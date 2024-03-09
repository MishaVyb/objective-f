import { changeProperty } from '../../../packages/excalidraw/actions/actionProperties'
import { duplicateElement } from '../../../packages/excalidraw/element'
import { mutateElement, newElementWith } from '../../../packages/excalidraw/element/mutateElement'
import {
  getBoundTextElement,
  handleBindTextResize,
} from '../../../packages/excalidraw/element/textElement'
import {
  ExcalidrawBindableElement,
  ExcalidrawElement,
  ExcalidrawLinearElement,
  ExcalidrawRectangleElement,
  ExcalidrawTextElementWithContainer,
} from '../../../packages/excalidraw/element/types'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { AppClassProperties, AppState } from '../../../packages/excalidraw/types'
import {
  ObjectiveElement,
  ObjectiveKinds,
  ObjectiveMeta,
  isElementRelatedToMeta,
  isElementTarget,
  isKind,
} from '../meta/types'
import { LinearElementEditor } from '../../../packages/excalidraw/element/linearElementEditor'
import { getObjectiveBasis, getPointerIds } from '../meta/selectors'
import { fixBindingsAfterDeletion } from '../../../packages/excalidraw/element/binding'
import { mutateMeta } from './mutateElements'


type TNewReprConstructor = (
  meta: ObjectiveMeta,
  value: string
) => [ExcalidrawRectangleElement, ExcalidrawTextElementWithContainer]

/**
 * Generic function to create\update\remove `on Canvas` representation for meta information.
 * -- or create
 * -- or update
 * -- or delete (if newValue === '')
 */
export const handleMetaRepresentation = <TMeta extends ObjectiveMeta>(
  scene: Scene,
  metas: readonly TMeta[],
  fieldName: 'nameRepr',
  newValue: string | ((meta: TMeta) => string),
  newRepr: TNewReprConstructor
) => {
  const newEls: ExcalidrawElement[] = []
  let newValueResolved
  metas.forEach((meta) => {
    newValueResolved = typeof newValue === 'function' ? newValue(meta) : newValue

    if (newValueResolved && !meta[fieldName])
      //
      newEls.push(...createMetaRepr(meta, fieldName, newValueResolved, newRepr))
    else if (newValueResolved && meta[fieldName])
      //
      updateMetaRepr(scene, meta, fieldName, newValueResolved)
    else if (!newValueResolved && meta[fieldName])
      //
      deleteMetaRepr(scene, meta, fieldName)
  })
  return newEls
}

export const createMetaRepr = <TMeta extends ObjectiveMeta>(
  meta: TMeta,
  fieldName: keyof TMeta,
  newValue: string,
  newRepr: TNewReprConstructor
  // TODO scene do not required here and it's to much to refactor to pass it here
) => {
  const [rectangle, text] = newRepr(meta, newValue)
  // Link representation:
  // @ts-ignore
  mutateMeta(meta, { [fieldName]: rectangle.id })
  return [rectangle, text]
}

export const updateMetaRepr = <TMeta extends ObjectiveMeta>(
  scene: Scene,
  meta: TMeta,
  fieldName: keyof TMeta,
  newValue: string
) => {
  const containerId = meta[fieldName] as ExcalidrawElement['id']
  const container = scene.getElement(containerId)
  if (!container) return

  handleBindTextResize(
    container,
    scene.getElementsMapIncludingDeleted(),
    false,
    false,
    { newOriginalText: newValue } //
  )
}

export const deleteMetaRepr = <TMeta extends ObjectiveMeta>(
  scene: Scene,
  meta: TMeta, // main Objactive element, not repr container itself
  fieldName: 'nameRepr' // LEGACY
) => {
  if (isKind(meta, ObjectiveKinds.LABEL)) return // Label can not has repr

  const containerId = meta[fieldName] as ExcalidrawElement['id']

  // Unlink representation:
  mutateMeta(meta, { nameRepr: undefined })

  // Remove repr:
  const container = scene.getElement(containerId) as ExcalidrawBindableElement
  if (!container) return
  mutateElement(container, { isDeleted: true })

  // Remove pointers (if any):
  const basis = getObjectiveBasis<ExcalidrawBindableElement>(meta)
  const pointerIds = getPointerIds(basis, container)
  const pointers = [...pointerIds].map((id) => scene.getElement(id)!)

  pointers.forEach((el) => mutateElement(el, { isDeleted: true }))

  // pop ref on pointer from `element.boundElements`
  fixBindingsAfterDeletion(scene.getNonDeletedElements(), pointers)

  const text = getBoundTextElement(container, scene.getElementsMapIncludingDeleted())
  if (!text) return

  mutateElement(text!, { isDeleted: true })
}
