import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { COLOR_PALETTE } from '../../../packages/excalidraw/colors'
import { LibraryItem, LibraryItems } from '../../../packages/excalidraw/types'
import { ObjectiveKinds } from '../meta/types'
import { getInitialObjectiveItem } from './objectiveInitial'
import bush from './outdoor/bush'
import car from './outdoor/car'
import track from './outdoor/track'
import playback from './outdoor/playback'

const BG_COLOR = COLOR_PALETTE.gray[1]

const createObj = (clipboardObj: ElementsClipboard, name: string): LibraryItem => {
  return getInitialObjectiveItem(clipboardObj, name, ObjectiveKinds.OTHER, {
    backgroundColor: BG_COLOR,
  })
}

export const LIB_OTHER: LibraryItems = [
  createObj(car, 'Car'),
  createObj(track, 'Track'),
  createObj(bush, 'Bush'),
  createObj(playback, 'Playback'),
]
