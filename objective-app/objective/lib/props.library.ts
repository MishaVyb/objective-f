import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { LibraryItem, LibraryItems } from '../../../packages/excalidraw/types'
import { ObjectiveKinds } from '../meta/_types'
import { buildObjectiveLibraryItem } from './base'

import bottle from './props/bottle'
import cat from './props/cat'
import dog from './props/dog'
import gun from './props/gun'
import knife from './props/knife'
import keyboard from './props/keyboard'
import laptop from './props/laptop'
import notepad from './props/notepad'

import pc from './props/pc'
import phone from './props/phone'
import plant1 from './props/plant1'
import plant2 from './props/plant2'
import plate from './props/plate'

import lamp from './props/lamp'
import ring from './props/ring'
import lightBulb from './props/light-bulb'

const createObj = (clipboardObj: ElementsClipboard, name: string): LibraryItem => {
  return buildObjectiveLibraryItem(clipboardObj, name, ObjectiveKinds.PROP, {})
}

export const LIB_PROPS: LibraryItems = [
  createObj(laptop, 'Laptop'),
  createObj(pc, 'PC'),
  createObj(keyboard, 'Keyboard'),
  createObj(phone, 'Phone'),
  //
  createObj(gun, 'Gun'),
  createObj(knife, 'Knife'),
  createObj(bottle, 'Bottle'),
  createObj(plate, 'Plate'),
  //
  createObj(plant1, 'Plant'),
  createObj(plant2, 'Plant'),
  createObj(cat, 'Cat'),
  createObj(dog, 'Dog'),
  //
  createObj(notepad, 'Notepad'),
  createObj(lamp, 'Floor Lamp'),

  createObj(lightBulb, 'Light Bulb'),
  createObj(ring, 'One Ring to Rule Them All'),
]
