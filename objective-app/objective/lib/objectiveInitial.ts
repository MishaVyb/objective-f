import { getCommonBounds } from '../../../packages/excalidraw/element/bounds'
import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { COLOR_PALETTE } from '../../../packages/excalidraw/colors'
import { newElement } from '../../../packages/excalidraw/element'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { randomId, randomInteger } from '../../../packages/excalidraw/random'
import { LibraryItem } from '../../../packages/excalidraw/types'
import { getInitialMeta } from '../meta/initial'
import { ObjectiveElement, ObjectiveKinds, ObjectiveMeta } from '../meta/types'
import { mutateElementMeta } from '../elements/mutateElements'
import { getMetaSimple } from '../meta/selectors'

const OBJ_COLOR_SHADE_INDEX = 2 // min: 0; max: 5
const INTERNAL_INDEX_COLOR = COLOR_PALETTE.yellow[OBJ_COLOR_SHADE_INDEX]

type ObjectiveInitOpts = {
  addInternalBasis?: boolean
}

const _objectivePreInit = (elements: ObjectiveElement[], opts: ObjectiveInitOpts) => {
  if (opts?.addInternalBasis) {
    const padding = 10
    const [minX, minY, maxX, maxY] = getCommonBounds(elements)
    const autoBasisElement = newElement({
      type: 'rectangle',
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,

      opacity: 0,
      backgroundColor: INTERNAL_INDEX_COLOR,
      strokeColor: INTERNAL_INDEX_COLOR,
    }) as any as ObjectiveElement

    elements = [autoBasisElement, ...elements]
  }
  return elements
}

const _objectiveInit = (
  elements: ObjectiveElement[],
  name: string,
  kind: ObjectiveKinds,
  elOverrides: Partial<ExcalidrawElement>,
  groupId: string,
  metaOverrides: Omit<Partial<ObjectiveMeta>, 'kind' | 'name'>,
  opts: ObjectiveInitOpts
) => {
  const meta = getInitialMeta(kind, {
    name: name,
    ...metaOverrides,
  })
  return elements.map((el) => ({
    ...el,
    ...elOverrides,

    customData: meta,

    // do not change BG color if it's transparent:
    backgroundColor:
      el.backgroundColor === COLOR_PALETTE.transparent
        ? COLOR_PALETTE.transparent
        : elOverrides.backgroundColor || el.backgroundColor,

    version: 1,
    versionNonce: 0,
    id: randomId(),
    seed: randomInteger(),
    groupIds: [groupId],
    isDeleted: false,
  })) as ObjectiveElement[]
}

const _objectivePostInit = (elements: ObjectiveElement[], opts: ObjectiveInitOpts) => {
  const elementsRequiredLength = elements.length
  elements.forEach((el) => mutateElementMeta(el, { elementsRequiredLength }))
  return elements
}

const _objectiveValidate = (elements: ObjectiveElement[], opts: ObjectiveInitOpts) => {
  elements.forEach((el) => {
    const m = getMetaSimple(el)

    if (m.coreOpts?.isPushpinRotation) {
      if (el.angle) throw new Error('Angle should be 0 for isPushpinRotation. ')
    }
  })

  return elements
}

/**
 * Build Objective Item from raw Excalidraw elements
 * - handle element props
 * - call for getInitialMeta(...)
 */
export const getInitialObjectiveItem = (
  clipboardObj: ElementsClipboard,
  name: string,
  kind: ObjectiveKinds,
  elOverrides: Partial<ExcalidrawElement>,
  metaOverrides: Omit<Partial<ObjectiveMeta>, 'kind' | 'name'> = {},
  opts?: {
    addInternalBasis?: boolean
  }
): LibraryItem => {
  let elements = clipboardObj.elements as ObjectiveElement[]
  const groupId = randomId()

  elements = _objectivePreInit(elements, opts || {})
  elements = _objectiveInit(elements, name, kind, elOverrides, groupId, metaOverrides, opts || {})
  elements = _objectivePostInit(elements, opts || {})
  elements = _objectiveValidate(elements, opts || {})

  return {
    status: 'unpublished',
    kind: kind,
    id: randomId(),
    elements: elements,
    created: 0,
  }
}
