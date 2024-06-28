import {
  getBoundTextElement,
  getContainerElement,
} from '../../../packages/excalidraw/element/textElement'
import {
  hasBoundTextElement,
  isArrowElement,
  isFreeDrawElement,
  isImageElement,
  isTextElement,
} from '../../../packages/excalidraw/element/typeChecks'
import {
  ElementsMapOrArray,
  ExcalidrawElement,
  ExcalidrawTextContainer,
} from '../../../packages/excalidraw/element/types'
import { arrayToMap } from '../../../packages/excalidraw/utils'
import { __DEBUG_DISABLE_ARRANGE } from '../../objective-plus/constants'
import { getMeta } from '../meta/_selectors'
import { ObjectiveKinds, isKindEl, isObjective, isSubkindEl } from '../meta/_types'

// TODO
// remember order tha user have applied for specific elements
// and safe it here while reordering by default Objective rules
//
export const arrangeElements = (elements: ElementsMapOrArray, newEls: ElementsMapOrArray) => {
  if (__DEBUG_DISABLE_ARRANGE)
    return [...arrayToMap(elements).values(), ...arrayToMap(newEls).values()]

  // do not use scene here, as scene has initital elements that has no current Action mutation
  const elsMap = new Map([...arrayToMap(elements), ...arrayToMap(newEls)])
  const takenElements = new Set<string>([])

  const otherExcalidraw: ExcalidrawElement[] = []
  const wall: ExcalidrawElement[] = []
  const location: ExcalidrawElement[] = []
  const outdoor: ExcalidrawElement[] = []
  const set: ExcalidrawElement[] = []
  const prop: ExcalidrawElement[] = []
  const image: ExcalidrawElement[] = []
  const light: ExcalidrawElement[] = []
  const character: ExcalidrawElement[] = []
  const camera: ExcalidrawElement[] = []
  const pointer: ExcalidrawElement[] = []
  const arrow: ExcalidrawElement[] = []
  const draw: ExcalidrawElement[] = []
  const text: ExcalidrawElement[] = [] // and its containers

  // iteration happens in insertion order according to MDN doc.
  for (const el of elsMap.values()) {
    if (takenElements.has(el.id)) continue
    if (isKindEl(el, ObjectiveKinds.LABEL)) continue // container&text add below by `meta.nameRepr` relation
    if (hasBoundTextElement(el)) continue // container add below by its text)

    const els = [el]

    if (isObjective(el)) {
      const meta = getMeta(el)
      if (meta.nameRepr) {
        const container = elsMap.get(meta.nameRepr) as ExcalidrawTextContainer | undefined

        // place Labels container & text along side with its Parent:
        // objectiveBasis (transparent circle) -> Label container&text -> otherObjectiveEls
        if (container && !takenElements.has(container.id)) {
          els.push(container)
          const text = getBoundTextElement(container, elsMap)
          if (text && !takenElements.has(text.id)) els.push(text)
        }
      }
    }

    if (isTextElement(el)) {
      const container = getContainerElement(el, elsMap)
      if (container) els.unshift(container)
    }

    if (isKindEl(el, ObjectiveKinds.WALL)) wall.push(...els)
    else if (isKindEl(el, ObjectiveKinds.LOCATION)) location.push(...els)
    else if (isKindEl(el, ObjectiveKinds.OTHER)) outdoor.push(...els)
    else if (isKindEl(el, ObjectiveKinds.SET)) set.push(...els)
    else if (isKindEl(el, ObjectiveKinds.PROP)) prop.push(...els)
    else if (isImageElement(el)) image.push(...els)
    else if (isKindEl(el, ObjectiveKinds.LIGHT)) light.push(...els)
    else if (isKindEl(el, ObjectiveKinds.CHARACTER)) character.push(...els)
    else if (isKindEl(el, ObjectiveKinds.CAMERA)) camera.push(...els)
    else if (isKindEl(el, ObjectiveKinds.POINTER)) pointer.push(...els)
    else if (isArrowElement(el)) arrow.push(...els)
    else if (isFreeDrawElement(el)) draw.push(...els)
    else if (isTextElement(el)) text.push(...els)
    else otherExcalidraw.push(...els)

    els.forEach((e) => takenElements.add(e.id))
  }
  return [
    ...otherExcalidraw,
    ...wall,
    ...location,
    ...outdoor,
    ...set,
    ...prop,
    ...pointer, // pointer is small line and its better place it before other important elements
    ...image,
    ...light,
    ...character,
    ...camera,
    ...arrow,
    ...draw,
    ...text,
  ]
}
