import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { COLOR_PALETTE } from '../../../packages/excalidraw/colors'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { randomId, randomInteger } from '../../../packages/excalidraw/random'
import { LibraryItem } from '../../../packages/excalidraw/types'
import { getBaseInitialMeta } from '../objects/initial'
import { ObjectiveKinds } from '../types/types'

export const createObjFromClipboard = (
  clipboardObj: ElementsClipboard,
  name: string,
  kind: ObjectiveKinds,
  overrides: Partial<ExcalidrawElement>
): LibraryItem => {
  const groupId = randomId()

  // OVERRIDES:
  const els = clipboardObj.elements.map((el) => ({
    ...el,
    ...overrides,
    // do not change BG color if it's transparent:
    backgroundColor:
      el.backgroundColor === COLOR_PALETTE.transparent
        ? COLOR_PALETTE.transparent
        : overrides.backgroundColor || el.backgroundColor,
    //
    customData: getBaseInitialMeta(ObjectiveKinds.PROP, { name: name }),
    //
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
    elements: els,
  }
}
