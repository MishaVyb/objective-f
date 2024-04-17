import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { COLOR_PALETTE } from '../../../packages/excalidraw/colors'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { randomId, randomInteger } from '../../../packages/excalidraw/random'
import { LibraryItem } from '../../../packages/excalidraw/types'
import { getInitialMeta } from '../meta/initial'
import { ObjectiveKinds, ObjectiveMeta } from '../meta/types'

export const createObjFromClipboard = (
  clipboardObj: ElementsClipboard,
  name: string,
  kind: ObjectiveKinds,
  elOverrides: Partial<ExcalidrawElement>,
  metaOverrides: Omit<Partial<ObjectiveMeta>, 'kind' | 'name'> = {}
): LibraryItem => {
  const groupId = randomId()

  // OVERRIDES:
  const els = clipboardObj.elements.map((el) => ({
    customData: getInitialMeta(kind, {
      name: name,
      elementsRequiredLength: clipboardObj.elements.length,
      ...metaOverrides,
    }),

    ...el,
    ...elOverrides,
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
  }))

  return {
    status: 'unpublished',
    kind: kind,
    id: randomId(),
    created: 1687101033001,

    //@ts-ignore
    elements: els,
  }
}
