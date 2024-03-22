import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { COLOR_PALETTE } from '../../../packages/excalidraw/colors'
import { LibraryItem, LibraryItems } from '../../../packages/excalidraw/types'
import { ObjectiveKinds, ObjectiveMeta } from '../meta/types'
import { createObjFromClipboard } from './helpers'
import doorOpen from './location/door-open'
import doorClose from './location/door-close'
import doorHalfOpen from './location/door-half-open'
import window from './location/window'

import windowImage from './location/window-no-grid.png'
import doorOpenImage from './location/door-open-no-grid.png'
import doorCloseImage from './location/door-close-no-grid.png'
import wallImage from './location/wall-no-grid.png'

const WINDOW_BASIS_INDEX = 0
const DOOR_BASIS_INDEX = 1 // dashed line

const createObj = (
  clipboardObj: ElementsClipboard,
  name: string,
  baseIndex: number,
  subkind: ObjectiveMeta['subkind'],
  libraryImg: ObjectiveMeta['libraryImg']
): LibraryItem => {
  return createObjFromClipboard(
    clipboardObj,
    name,
    ObjectiveKinds.LOCATION,
    {},
    { basisIndex: baseIndex, subkind, libraryImg }
  )
}

export const LIB_LOCATION: LibraryItems = [
  createObj(window, 'Window', WINDOW_BASIS_INDEX, 'window', {
    src: windowImage,
    w: 55,
    h: 27,
    title: 'Window',
  }),
  createObj(doorClose, 'Door Closed', DOOR_BASIS_INDEX, 'doorClosed', {
    src: doorCloseImage,
    w: 55,
    h: 27,
    title: 'Door',
  }),
  // createObj(doorHalfOpen, 'Door Half Open', DOOR_BASIS_INDEX),
  createObj(doorOpen, 'Door Openned', DOOR_BASIS_INDEX, 'doorOpenned', {
    src: doorOpenImage,
    w: 55,
    h: 27,
    title: 'Door',
  }),
]

export const WALL_IMAGE: ObjectiveMeta['libraryImg'] = {
  src: wallImage,
  w: 55,
  h: 27,
  title: 'Wall',
}
