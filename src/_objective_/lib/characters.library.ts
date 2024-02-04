import { COLOR_PALETTE } from '../../colors'
import { randomId, randomInteger } from '../../random'
import { LibraryItem, LibraryItems } from '../../types'
import { characterInitialMeta, getBaseInitialMeta } from '../objects/initial'
import { ObjectiveKinds } from '../types/types'

const OBJ_COLOR_SHADE_INDEX = 2 // min: 0; max: 5
const OBJ_COLORS = [
  COLOR_PALETTE.green[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.blue[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.violet[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.yellow[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.orange[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.red[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.bronze[OBJ_COLOR_SHADE_INDEX],
  COLOR_PALETTE.gray[OBJ_COLOR_SHADE_INDEX],
]

const createObj = (primary_color: string): LibraryItem => {
  const groupId = randomId()
  const elCommon = {
    customData: getBaseInitialMeta(ObjectiveKinds.CHARACTER),
    version: 1,
    versionNonce: 0,
    isDeleted: false,
  }

  return {
    status: 'unpublished',
    kind: ObjectiveKinds.CHARACTER,
    id: randomId(),
    created: 1687101033001,
    elements: [
      {
        type: 'ellipse',
        ...elCommon,
        id: randomId(),
        seed: randomInteger(),
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        angle: 0,
        x: 2777.7800421273387,
        y: 1973.061212446385,
        strokeColor: COLOR_PALETTE.black[OBJ_COLOR_SHADE_INDEX],
        backgroundColor: primary_color,
        width: 26.917968750000018,
        height: 26.37775681134722,
        groupIds: [groupId],
        frameId: null,
        roundness: {
          type: 2,
        },
        boundElements: [],
        updated: 1687546128240,
        link: null,
        locked: false,
      },
      {
        type: 'line',
        ...elCommon,
        id: randomId(),
        seed: randomInteger(),
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        angle: 0,
        x: 2781.064189548841,
        y: 1978.0339870341772,
        strokeColor: COLOR_PALETTE.black[OBJ_COLOR_SHADE_INDEX],
        backgroundColor: primary_color,
        width: 20.64523999887456,
        height: 0,
        groupIds: [groupId],
        frameId: null,
        roundness: {
          type: 2,
        },
        boundElements: [],
        updated: 1687546128240,
        link: null,
        locked: false,
        startBinding: null,
        endBinding: null,
        lastCommittedPoint: null,
        startArrowhead: null,
        endArrowhead: null,
        points: [
          [0, 0],
          [20.64523999887456, 0],
        ],
      },
      {
        type: 'line',
        ...elCommon,
        id: randomId(),
        seed: randomInteger(),
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        angle: 0,
        x: 2779.0364083251793,
        y: 1981.5963779294866,
        strokeColor: COLOR_PALETTE.black[OBJ_COLOR_SHADE_INDEX],
        backgroundColor: primary_color,
        width: 24.391627628545166,
        height: 0.23074499543042748,
        groupIds: [groupId],
        frameId: null,
        roundness: {
          type: 2,
        },
        boundElements: [],
        updated: 1687546128240,
        link: null,
        locked: false,
        startBinding: null,
        endBinding: null,
        lastCommittedPoint: null,
        startArrowhead: null,
        endArrowhead: null,
        points: [
          [0, 0],
          [24.391627628545166, -0.23074499543042748],
        ],
      },
    ],
  }
}

export const LIB_CHARACTERS: LibraryItems = OBJ_COLORS.map((c) => createObj(c))
