import {
  ElementsMap,
  ExcalidrawArrowElement,
  ExcalidrawElement,
  NonDeletedSceneElementsMap,
} from '../../../packages/excalidraw/element/types'

import { Mutable } from '../../../packages/excalidraw/utility-types'
import { newMetaReprElement, newPointerBeetween } from './_newElementObjectiveConstructors'
import { getObjectiveBasis, getObjectiveMetas, getMeta, getCore } from '../meta/_selectors'
import {
  TAnyMeta,
  ObjectiveKinds,
  ObjectiveMeta,
  PointerMeta,
  isCameraMeta,
  isKind,
  isObjective,
} from '../meta/_types'

import { getCameraMetaReprStr } from '../actions/actionCamera'

import { Vector, getElementCenter } from './_math'

import { createMetaRepr } from './_metaRepr'
import Scene from '../../../packages/excalidraw/scene/Scene'
import { getContainerElement } from '../../../packages/excalidraw/element/textElement'
import { mutateMeta } from './_mutateElements'
import { rotateMultipleElements } from '../../../packages/excalidraw/element/resizeElements'
import { duplicateMeta } from '../meta/_initial'

export type DuplicateHandlerOpts = {
  shift?: Vector
  rotate?: { center: Vector; angle: number }

  newElementsOverrides?: Partial<ExcalidrawElement>
  newElementsMeta?: Partial<TAnyMeta>

  addPointerWith?: ObjectiveMeta
  addPointerSubkind?: PointerMeta['subkind']
  addPointerOverrides?: Partial<ExcalidrawArrowElement>
  addPointerReverseDirection?: boolean
}

/**
 * filters out element we do not copy directly: LABEL and LABEL_TEXT
 * (because it wll be add as copied extraElements later)
 */
export const duplicateObjectiveEventHandlerFilter = (
  selectedElements: ElementsMap,
  scene: Scene
) => {
  const excludeElementIds = new Set<string>([])
  const metasMap = new Map(getObjectiveMetas(selectedElements).map((m) => [m.id, m]))

  for (const e of selectedElements.values()) {
    if (!isObjective(e)) continue
    const weekMeta = getMeta(e)

    if (isKind(weekMeta, ObjectiveKinds.LABEL) && metasMap.has(weekMeta.labelOf))
      excludeElementIds.add(e.id)

    if (isKind(weekMeta, ObjectiveKinds.LABEL_TEXT)) {
      //@ts-ignore
      const container = getContainerElement(e, scene.getNonDeletedElementsMap())
      const containerWeekMeta = isObjective(container) ? getMeta(container) : null
      if (
        isKind(containerWeekMeta, ObjectiveKinds.LABEL) &&
        metasMap.has(containerWeekMeta.labelOf)
      )
        excludeElementIds.add(e.id)
    }
  }

  for (const id of excludeElementIds) selectedElements.delete(id)
  return selectedElements
}

/**
 * Objective logic on duplicate elements:
 *
 * WARNING: it's assumed that both `affectedElements` and `newElements` has **equal** order!
 *
 * @param affectedElements elements that were shoosen for duplicate initially
 * @param newElements elements already copied/duplicated by Excalidraw
 */
export const duplicateObjectiveEventHandler = (
  affectedElements: readonly ExcalidrawElement[],
  newElements: Mutable<ExcalidrawElement>[],
  opts: DuplicateHandlerOpts | undefined
) => {
  // [1] Handle element copy
  // - appply some overrides for element
  // - copy element.customData (weekMeta properly)

  if (affectedElements.length !== newElements.length) throw new Error('Invalid Copy Handle. ')
  affectedElements.forEach((prevElement, index) => {
    const newElement = newElements[index]
    if (prevElement.type !== newElement.type) throw new Error('Invalid Copy Handle. ')
    _duplicateSingleObjectiveElement(prevElement, newElement)
  })

  // [2] Handle meta copy
  // - appply some overrides from `opts`
  // - creates extra new elements

  const extraNewEls: ExcalidrawElement[] = []
  const metas = getObjectiveMetas(newElements) as Mutable<ObjectiveMeta>[]
  metas.forEach((meta) => {
    extraNewEls.push(..._duplicateSingleObjectiveFullMeta(meta, opts))
  })

  return extraNewEls
}

const _duplicateSingleObjectiveElement = <TElement extends ExcalidrawElement>(
  original: TElement,
  copy: Mutable<TElement>
) => {
  const { oScene } = getCore()
  let defaultOverrides: Partial<TElement> = {}

  // Character Turn is transparent by design, but on duplicate/copy we want Parent bg color
  const metaOrig = oScene.getMetaByElement(original)
  const parentTurn = metaOrig && oScene.getTurnParent(metaOrig)?.basis
  if (parentTurn)
    defaultOverrides = {
      ...defaultOverrides,
      backgroundColor:
        copy.backgroundColor === 'transparent' ? parentTurn.backgroundColor : copy.backgroundColor,
    }

  Object.assign(copy, defaultOverrides)
  duplicateMeta(copy)
  return copy
}

const _duplicateSingleObjectiveFullMeta = (
  meta: ObjectiveMeta,
  opts: DuplicateHandlerOpts | undefined
) => {
  const { scene } = getCore()
  const extraNewEls: ExcalidrawElement[] = []

  if (opts?.newElementsMeta) {
    meta = mutateMeta(meta, opts.newElementsMeta)
  }
  if (opts?.shift) {
    // NOTE do nothing here with shift, as it's already applied at Excalidraw level at
    // duplicateElements.duplicateAndOffsetElement
  }
  if (opts?.rotate) {
    const center = getElementCenter(meta.basis!)
    rotateMultipleElements(
      new Map(),
      meta.elements,
      scene.getElementsMapIncludingDeleted(),
      undefined,
      undefined,
      false,
      center.x,
      center.y,
      opts.rotate.angle
    )
  }
  if (opts?.addPointerWith)
    extraNewEls.push(
      newPointerBeetween(
        opts?.addPointerReverseDirection
          ? getObjectiveBasis(meta)
          : getObjectiveBasis(opts.addPointerWith),
        opts?.addPointerReverseDirection
          ? getObjectiveBasis(opts.addPointerWith)
          : getObjectiveBasis(meta),

        // HACK we know for sure that those new els have no pointer between
        new Map([]) as NonDeletedSceneElementsMap,

        {
          scene: scene,
          subkind: opts.addPointerSubkind,
          overrides: opts?.addPointerOverrides,
        }
      )!
    )
  if (isCameraMeta(meta)) {
    if (meta.nameRepr)
      extraNewEls.push(
        ...createMetaRepr(
          meta,
          'nameRepr',
          getCameraMetaReprStr(meta, {
            name: opts?.newElementsMeta?.name,
            shotNumber: opts?.newElementsMeta?.shotNumber,
            shotVersion: opts?.newElementsMeta?.shotVersion,
          }),
          newMetaReprElement
        )
      )
  } else {
    // all other meta kinds
    if (meta.nameRepr)
      extraNewEls.push(...createMetaRepr(meta, 'nameRepr', meta.name!, newMetaReprElement))
  }
  return extraNewEls
}
