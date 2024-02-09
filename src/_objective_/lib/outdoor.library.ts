import { ElementsClipboard } from '../../clipboard'
import { COLOR_PALETTE } from '../../colors'
import { LibraryItem, LibraryItems } from '../../types'
import { ObjectiveKinds } from '../types/types'
import { createObjFromClipboard } from './helpers'
import bush from './outdoor/bush'
import car from './outdoor/car'

const BG_COLOR = COLOR_PALETTE.gray[1]

const createObj = (clipboardObj: ElementsClipboard, name: string): LibraryItem => {
  return createObjFromClipboard(clipboardObj, name, ObjectiveKinds.OUTDOR, {
    backgroundColor: BG_COLOR,
  })
}

export const LIB_OUTDOR: LibraryItems = [createObj(car, 'Car'), createObj(bush, 'Bush')]
