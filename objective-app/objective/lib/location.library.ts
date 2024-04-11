import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { LibraryItem, LibraryItems } from '../../../packages/excalidraw/types'
import { ObjectiveKinds, ObjectiveMeta } from '../meta/types'
import { createObjFromClipboard } from './helpers'
import doorOpen from './location/door-open'
import doorClose from './location/door-close'
import window from './location/window'
import stairs from './location/stairs'

import windowImage from './location/window-no-grid.png'
import doorOpenImage from './location/door-open-no-grid.png'
import doorCloseImage from './location/door-close-no-grid.png'
import wallImage from './location/wall-no-grid.png'

const WINDOW_BASIS_INDEX = 0
const DOOR_BASIS_INDEX = 1 // dashed line

const createObj = (
  clipboardObj: ElementsClipboard,
  name: string,
  metaOverrides: Omit<Partial<ObjectiveMeta>, 'kind' | 'name'>
): LibraryItem => {
  return createObjFromClipboard(clipboardObj, name, ObjectiveKinds.LOCATION, {}, metaOverrides)
}

export const LIB_LOCATION: LibraryItems = [
  createObj(window, 'Window', {
    basisIndex: WINDOW_BASIS_INDEX,
    subkind: 'window',
    disableResize: false,
    libraryImg: {
      src: windowImage,
      w: 55,
      h: 27,
      title: 'Window',
    },
  }),
  createObj(doorClose, 'Closed Door', {
    basisIndex: DOOR_BASIS_INDEX,
    subkind: 'doorClosed',
    libraryImg: {
      src: doorCloseImage,
      w: 55,
      h: 27,
      title: 'Door',
    },
  }),
  createObj(doorOpen, 'Open Door', {
    basisIndex: DOOR_BASIS_INDEX,
    subkind: 'doorOpen',
    libraryImg: {
      src: doorOpenImage,
      w: 55,
      h: 27,
      title: 'Door',
    },
  }),
  // createObj(doorHalfOpen, 'Door Half Open', DOOR_BASIS_INDEX),

  //
  createObj(stairs, 'Stairs', { subkind: 'Stairs' }),
]

export const WALL_IMAGE: ObjectiveMeta['libraryImg'] = {
  src: wallImage,
  w: 55,
  h: 27,
  title: 'Wall',
}
