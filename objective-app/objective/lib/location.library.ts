import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { COLOR_PALETTE } from '../../../packages/excalidraw/colors'
import { LibraryItem, LibraryItems } from '../../../packages/excalidraw/types'
import { ObjectiveKinds } from '../meta/types'
import { createObjFromClipboard } from './helpers'
import doorOpen from './location/door-open'
import doorClose from './location/door-close'
import doorHalfOpen from './location/door-half-open'

const DOOR_BASIS_INDEX = 1 // dashed line

const createObj = (
  clipboardObj: ElementsClipboard,
  name: string,
  baseIndex: number
): LibraryItem => {
  return createObjFromClipboard(
    clipboardObj,
    name,
    ObjectiveKinds.LOCATION,
    {},
    { basisIndex: baseIndex }
  )
}

export const LIB_LOCATION: LibraryItems = [
  createObj(doorClose, 'Door Close', DOOR_BASIS_INDEX),
  createObj(doorHalfOpen, 'Door Half Open', DOOR_BASIS_INDEX),
  createObj(doorOpen, 'Door Open', DOOR_BASIS_INDEX),
]
