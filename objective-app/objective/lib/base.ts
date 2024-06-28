import { getCommonBounds } from '../../../packages/excalidraw/element/bounds'
import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { COLOR_PALETTE } from '../../../packages/excalidraw/colors'
import { newElement } from '../../../packages/excalidraw/element'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { randomId, randomInteger } from '../../../packages/excalidraw/random'
import { LibraryItem } from '../../../packages/excalidraw/types'
import { buildWeekMeta } from '../meta/_initial'
import { ObjectiveElement, ObjectiveKinds, ObjectiveMeta, TAnyWeekMeta } from '../meta/_types'
import { getMeta } from '../meta/_selectors'

const OBJ_COLOR_SHADE_INDEX = 2 // min: 0; max: 5
const INTERNAL_INDEX_COLOR = COLOR_PALETTE.yellow[OBJ_COLOR_SHADE_INDEX]

type TLibraryItemInitOpts = {
  addInternalBasis?: boolean
}
export type TLibraryItemInitialMeta = Pick<
  Partial<TAnyWeekMeta>,
  'subkind' | 'labelOf' | 'disableResize' | 'lib'
>

const _objectiveItemElementsExtend = (
  id: ObjectiveMeta['id'],
  elements: ObjectiveElement[],
  opts: TLibraryItemInitOpts
) => {
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

const _objectiveItemBuild = (
  id: ObjectiveMeta['id'],
  elements: ObjectiveElement[],
  elOverrides: Partial<ExcalidrawElement>,
  name: ObjectiveMeta['name'],
  kind: ObjectiveKinds,
  metaInitial: TLibraryItemInitialMeta,
  opts: TLibraryItemInitOpts
) => {
  return elements.map((el) => ({
    ...el,
    ...elOverrides,

    customData: buildWeekMeta(kind, metaInitial.subkind, {
      name: name,
      elementsRequiredLength: elements.length,
      ...metaInitial,
    }),

    // do not change BG color if it's transparent:
    backgroundColor:
      el.backgroundColor === COLOR_PALETTE.transparent
        ? COLOR_PALETTE.transparent
        : elOverrides.backgroundColor || el.backgroundColor,

    version: 1,
    versionNonce: 0,
    id: randomId(),
    seed: randomInteger(),
    groupIds: [id],
    isDeleted: false,
  })) as ObjectiveElement[]
}

const _objectiveValidate = (
  id: ObjectiveMeta['id'],
  elements: ObjectiveElement[],
  opts: TLibraryItemInitOpts
) => {
  elements.forEach((el) => {
    const m = getMeta(el)

    if (m.core.isPushpinRotation) {
      if (el.angle) throw new Error('Angle should be 0 for isPushpinRotation. ')
    }
  })

  return elements
}

/**
 * Build Objective Single Item + Meta from raw Excalidraw elements
 */
export const buildObjectiveLibraryItem = (
  clipboardObj: ElementsClipboard,
  name: ObjectiveMeta['name'],
  kind: ObjectiveKinds,
  elOverrides: Partial<ExcalidrawElement>,
  metaInitial?: TLibraryItemInitialMeta,
  opts?: {
    addInternalBasis?: boolean
  }
): LibraryItem => {
  let elements = clipboardObj.elements as ObjectiveElement[]
  const id = randomId()

  elements = _objectiveItemElementsExtend(id, elements, opts || {})
  elements = _objectiveItemBuild(
    id,
    elements,
    elOverrides,
    name,
    kind,
    metaInitial || {},
    opts || {}
  )
  elements = _objectiveValidate(id, elements, opts || {})

  return {
    status: 'unpublished',
    kind: kind,
    id: randomId(),
    elements: elements,
    created: 0,
  }
}
