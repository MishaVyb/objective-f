import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { LibraryItem, LibraryItems } from '../../../packages/excalidraw/types'
import { ObjectiveKinds } from '../meta/types'
import { createObjFromClipboard } from './helpers'
import ledPanel from './light/led-panel'

const createObj = (clipboardObj: ElementsClipboard, name: string): LibraryItem => {
  return createObjFromClipboard(clipboardObj, name, ObjectiveKinds.LIGHT, {})
}

export const LIB_LIGHT: LibraryItems = [
  createObj(ledPanel, 'Led Panel'), //
]
