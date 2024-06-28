import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { LibraryItem, LibraryItems } from '../../../packages/excalidraw/types'
import { ObjectiveKinds, ObjectiveMeta } from '../meta/_types'
import { TLibraryItemInitialMeta, buildObjectiveLibraryItem } from './base'
import doorOpen from './location/door-open'
import doorClose from './location/door-close'
import window from './location/window'
import stairs from './location/stairs'

import windowImage from './location/window-no-grid.png'
import doorOpenImage from './location/door-open-no-grid.png'
import doorCloseImage from './location/door-close-no-grid.png'
import wallImage from './location/wall-no-grid.png'

export const WALL_IMAGE = {
  src: wallImage,
  w: 55,
  h: 27,
  title: 'Wall',
}
export const WINDOW_IMAGE = {
  src: windowImage,
  w: 55,
  h: 27,
  title: 'Window',
}
export const DOOR_CLOSED_IMAGE = {
  src: doorCloseImage,
  w: 55,
  h: 27,
  title: 'Door',
}
export const DOOR_OPENNED_IMAGE = {
  src: doorOpenImage,
  w: 55,
  h: 27,
  title: 'Door',
}

const createObj = (
  clipboardObj: ElementsClipboard,
  name: string,
  metaInitial: TLibraryItemInitialMeta
): LibraryItem => {
  return buildObjectiveLibraryItem(clipboardObj, name, ObjectiveKinds.LOCATION, {}, metaInitial)
}

export const LIB_LOCATION: LibraryItems = [
  createObj(window, 'Window', {
    subkind: 'window',
    lib: { img: WINDOW_IMAGE },
    disableResize: false,
  }),
  createObj(doorClose, 'Closed Door', {
    subkind: 'doorClosed',
    lib: { img: DOOR_CLOSED_IMAGE },
  }),
  createObj(doorOpen, 'Open Door', {
    subkind: 'doorOpen',
    lib: { img: DOOR_OPENNED_IMAGE },
  }),

  createObj(stairs, 'Stairs', { subkind: 'Stairs' }),
]
