import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { COLOR_PALETTE } from '../../../packages/excalidraw/colors'
import { LibraryItem, LibraryItems } from '../../../packages/excalidraw/types'
import { ObjectiveKinds } from '../meta/types'
import { getInitialObjectiveItem } from './objectiveInitial'

const OBJ_COLOR_SHADE_INDEX = 2 // min: 0; max: 5
const OBJ_COLORS = [
  COLOR_PALETTE.green[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.blue[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.orange[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.violet[OBJ_COLOR_SHADE_INDEX],
  // COLOR_PALETTE.yellow[OBJ_COLOR_SHADE_INDEX],
  // COLOR_PALETTE.red[OBJ_COLOR_SHADE_INDEX],
  // COLOR_PALETTE.bronze[OBJ_COLOR_SHADE_INDEX],
  // COLOR_PALETTE.gray[OBJ_COLOR_SHADE_INDEX],
]

const CLIPBOARD = {
  type: 'excalidraw/clipboard',
  elements: [
    {
      // ...elCommon,
      // id: randomId(),
      // seed: randomInteger(),
      //
      // background circle
      type: 'ellipse',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 0,
      angle: 0,
      x: 974.648916347785,
      y: -342.13888962844504,
      strokeColor: COLOR_PALETTE.gray[OBJ_COLOR_SHADE_INDEX],
      // backgroundColor: primary_color,
      width: 50,
      height: 50,
      // groupIds: [groupId],
      frameId: null,
      roundness: { type: 2 },
      boundElements: [],
      updated: 1693133009653,
      link: null,
      locked: false,
    },
    {
      // ...elCommon,
      // id: randomId(),
      // seed: randomInteger(),
      //
      // camera lens:
      type: 'line',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 100,
      angle: 0,
      x: 1005.8224224334356,
      y: -319.82031146362687,
      strokeColor: COLOR_PALETTE.black,
      // backgroundColor: primary_color,
      width: 7.295961737587788,
      height: 12.409370818632151,
      // groupIds: [groupId],
      frameId: null,
      roundness: null,
      boundElements: [],
      updated: 1693133009653,
      link: null,
      locked: false,
      startBinding: null,
      endBinding: null,
      lastCommittedPoint: null,
      startArrowhead: null,
      endArrowhead: null,
      points: [
        [0, 0],
        [7.295961737587788, -3.492084250469352],
        [7.295961737587788, 8.9172865681628],
        [0, 4.863974491725163],
      ],
    },
    {
      // ...elCommon,
      // id: randomId(),
      // seed: randomInteger(),
      // background body
      //
      type: 'rectangle',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 0,
      opacity: 100,
      angle: 0,
      x: 986.1794485245459,
      y: -325.32709886117055,
      strokeColor: COLOR_PALETTE.black,
      // backgroundColor: primary_color,
      width: 19.705332556219844,
      height: 16.836834779048647,
      // groupIds: [groupId],
      frameId: null,
      roundness: { type: 3 },
      boundElements: [],
      updated: 1693133009653,
      link: null,
      locked: false,
    },
  ],
  files: {},
} as any as ElementsClipboard

const createObj = (primaryColor: string): LibraryItem => {
  return getInitialObjectiveItem(CLIPBOARD, '', ObjectiveKinds.CAMERA, {
    backgroundColor: primaryColor,
  })
}

export const LIB_CAMERAS: LibraryItems = OBJ_COLORS.map((c) => createObj(c))
