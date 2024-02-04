import { ElementsClipboard } from '../../clipboard'
import { COLOR_PALETTE } from '../../colors'
import { LibraryItem, LibraryItems } from '../../types'
import { ObjectiveKinds } from '../types/types'
import one from './characters/one'
import two from './characters/two'

import { createObjFromClipboard } from './helpers'
const OBJ_COLOR_SHADE_INDEX = 2 // min: 0; max: 5
const OBJ_COLORS = [
  COLOR_PALETTE.green[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.blue[OBJ_COLOR_SHADE_INDEX],
  // COLOR_PALETTE.violet[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.yellow[OBJ_COLOR_SHADE_INDEX],
  // COLOR_PALETTE.orange[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.red[OBJ_COLOR_SHADE_INDEX],
  // COLOR_PALETTE.bronze[OBJ_COLOR_SHADE_INDEX],
  // COLOR_PALETTE.gray[OBJ_COLOR_SHADE_INDEX],
]

const createObj = (clipboardObj: ElementsClipboard, primary_color: string): LibraryItem => {
  return createObjFromClipboard(clipboardObj, '', ObjectiveKinds.CHARACTER, {
    backgroundColor: primary_color,
  })
}

export const LIB_CHARACTERS_2: LibraryItems = [
  ...OBJ_COLORS.map((c) => createObj(one, c)),
  ...OBJ_COLORS.map((c) => createObj(two, c)),
]
