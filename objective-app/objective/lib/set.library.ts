import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { COLOR_PALETTE } from '../../../packages/excalidraw/colors'
import { LibraryItem, LibraryItems } from '../../../packages/excalidraw/types'
import { ObjectiveKinds } from '../meta/_types'
import { buildObjectiveLibraryItem } from './base'
import bath from './set/bath'
import chair from './set/chair'
import chair2 from './set/chair2'
import shower from './set/shower'
import sink from './set/sink'
import sofa from './set/sofa'
import sofa2 from './set/sofa2'
import stove from './set/stove'
import table from './set/table'
import table2 from './set/table2'
import table3 from './set/table3'
import toilet from './set/toilet'
import wardrobe from './set/wardrobe'

const BG_COLOR = COLOR_PALETTE.gray[1]

const createObj = (clipboardObj: ElementsClipboard, name: string): LibraryItem => {
  return buildObjectiveLibraryItem(
    clipboardObj,
    name,
    ObjectiveKinds.SET,
    { backgroundColor: BG_COLOR },
    undefined
  )
}

export const LIB_SET: LibraryItems = [
  createObj(table, 'Round Table'),
  createObj(table2, 'Dinning Table'),
  createObj(table3, 'Square Table'),
  createObj(wardrobe, 'Wardrobe'),
  createObj(chair, 'Armchair'),
  createObj(chair2, 'Chair'),
  createObj(sofa, 'Sofa'),
  createObj(sofa2, 'Couch'),
  //
  createObj(toilet, 'Toilet'),
  createObj(bath, 'Bath'),
  createObj(shower, 'Shower'),
  createObj(sink, 'Sink'),
  //
  createObj(stove, 'Stove'),
]
