import { ElementsClipboard } from '../../../packages/excalidraw/clipboard'
import { LibraryItem, LibraryItems } from '../../../packages/excalidraw/types'
import { ObjectiveKinds, ObjectiveMeta } from '../meta/types'
import { createObjFromClipboard } from './helpers'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
//
import skyPanel_1x2 from './light/skyPanel_1x2'
import skyPanel_2x1 from './light/skyPanel_2x1'
import skyPanel_2x2 from './light/skyPanel_2x2'
import skyPanel_2x4 from './light/skyPanel_2x4'
import skyPanel_4x2 from './light/skyPanel_4x2'
import skyPanel_4x4 from './light/skyPanel_4x4'
//
import kinoflo_2x2 from './light/kinoflo_2x2'
import kinoflo_2x4 from './light/kinoflo_2x4'
import kinoflo_4x2 from './light/kinoflo_4x2'
import kinoflo_4x4 from './light/kinoflo_4x4'
//
import jambo_4 from './light/jambo_4'
import jambo_9 from './light/jambo_9'
import jambo_12 from './light/jambo_12'
//
import astera_2 from './light/astera_2'
import astera_4 from './light/astera_4'
import astera_8 from './light/astera_8'
//
import pipe_4 from './light/pipe_4'
import pipe_8 from './light/pipe_8'
//
import astera_lamp from './light/astera_lamp'
import sun from './light/sun'
//
import arri_s from './light/arri_s'
import arri_m from './light/arri_m'
import arri_l from './light/arri_l'
//
import aputure_s from './light/aputure_s'
import aputure_m from './light/aputure_m'
//
import open_face from './light/open_face'
import etc from './light/etc'
import parik from './light/parik'
//
import frame_4 from './light/frame_4'
import frame_8 from './light/frame_8'
import frame_12 from './light/frame_12'
import frame_20 from './light/frame_20'
//
import applebox from './light/applebox'
import farm from './light/farm'

const createObj = (
  clipboardObj: ElementsClipboard,
  name: string,
  metaOverrides: Omit<Partial<ObjectiveMeta>, 'kind' | 'name'> = {},
  elOverrides: Partial<ExcalidrawElement> = {}
): LibraryItem => {
  return createObjFromClipboard(
    clipboardObj,
    name,
    ObjectiveKinds.LIGHT,
    elOverrides,
    metaOverrides
  )
}

const GREEN_FRAME_BG = '40c057'
const BLACK_FRAME_BG = '343a40'
const WHITE_FRAME_BG = 'e9ecef'

export const LIB_LIGHT: LibraryItems = [
  createObj(skyPanel_1x2, 'Led Panel 1x2', { subkind: 'Led Panel', library: {mainTitle: 'Led Panel', subTitle: '1x2'} }),
  createObj(skyPanel_2x1, 'Led Panel 2x1', { subkind: 'Led Panel', library: {mainTitle: 'Led Panel', subTitle: '2x1'} }),
  createObj(skyPanel_2x2, 'Led Panel 2x2', { subkind: 'Led Panel', library: {mainTitle: 'Led Panel', subTitle: '2x2'} }),
  createObj(skyPanel_2x4, 'Led Panel 2x4', { subkind: 'Led Panel', library: {mainTitle: 'Led Panel', subTitle: '2x4'} }),
  createObj(skyPanel_4x2, 'Led Panel 4x2', { subkind: 'Led Panel', library: {mainTitle: 'Led Panel', subTitle: '4x2'} }),
  createObj(skyPanel_4x4, 'Led Panel 4x4', { subkind: 'Led Panel', library: {mainTitle: 'Led Panel', subTitle: '4x4'} }),
  //
  createObj(kinoflo_2x2, 'Kinoflo 2x2', { subkind: 'Kinoflo', library: {mainTitle: 'Kinoflo', subTitle: '2x2'}  }),
  createObj(kinoflo_2x4, 'Kinoflo 2x4', { subkind: 'Kinoflo', library: {mainTitle: 'Kinoflo', subTitle: '2x4'}  }),
  createObj(kinoflo_4x2, 'Kinoflo 4x2', { subkind: 'Kinoflo', library: {mainTitle: 'Kinoflo', subTitle: '4x2'}  }),
  createObj(kinoflo_4x4, 'Kinoflo 4x4', { subkind: 'Kinoflo', library: {mainTitle: 'Kinoflo', subTitle: '4x4'}  }),
  //
  createObj(jambo_4, 'Jambo 4 lamps', { subkind: 'Jambo', library: {mainTitle: 'Jambo', subTitle: '4 lamps'}  }),
  createObj(jambo_9, 'Jambo 9 lamps', { subkind: 'Jambo', library: {mainTitle: 'Jambo', subTitle: '9 lamps'}  }),
  createObj(jambo_12, 'Jambo 12 lamps', { subkind: 'Jambo', library: {mainTitle: 'Jambo', subTitle: '12 lamps'}  }),
  //
  createObj(astera_2, 'Astera 2 ft', { subkind: 'Astera', library: {mainTitle: 'Astera', subTitle: '2 ft'} }),
  createObj(astera_4, 'Astera 4 ft', { subkind: 'Astera', library: {mainTitle: 'Astera', subTitle: '4 ft'} }),
  createObj(astera_8, 'Astera 8 ft', { subkind: 'Astera', library: {mainTitle: 'Astera', subTitle: '8 ft'} }),
  //
  createObj(pipe_4, 'Pipe 4 ft', { subkind: 'Pipe', library: {mainTitle: 'Pipe', subTitle: '4 ft'}  }),
  createObj(pipe_8, 'Pipe 8 ft', { subkind: 'Pipe', library: {mainTitle: 'Pipe', subTitle: '8 ft'}  }),

  //
  createObj(arri_s, 'Arri S', { subkind: 'Arri', library: {mainTitle: 'Arri', subTitle: 'S'}  }),
  createObj(arri_m, 'Arri M', { subkind: 'Arri', library: {mainTitle: 'Arri', subTitle: 'M'}  }),
  createObj(arri_l, 'Arri L', { subkind: 'Arri', library: {mainTitle: 'Arri', subTitle: 'L'}  }),
  //
  createObj(aputure_s, 'Aputure S', { subkind: 'Aputure', library: {mainTitle: 'Aputure', subTitle: 'S'}  }),
  createObj(aputure_m, 'Aputure M', { subkind: 'Aputure', library: {mainTitle: 'Aputure', subTitle: 'M'}  }),
  //
  createObj(open_face, 'Open Face', { subkind: 'Open Face' }),
  createObj(parik, 'Par', { subkind: 'Par' }),
  createObj(etc, 'Etc Source Four', { subkind: 'Etc' }),
  //
  createObj(astera_lamp, 'Aster Bulb', { subkind: 'Bulb' }),
  createObj(sun, 'Sun', { subkind: 'Sun' }),
  //
  // TODO FRAMES
  // createObj(frame_4, 'Frame 4 ft', { subkind: 'Frame' }, { backgroundColor: WHITE_FRAME_BG }),
  // createObj(frame_8, 'Frame 8 ft', { subkind: 'Frame' }, { backgroundColor: WHITE_FRAME_BG }),
  // createObj(frame_12, 'Frame 12 ft', { subkind: 'Frame' }, { backgroundColor: WHITE_FRAME_BG }),
  // createObj(frame_20, 'Frame 20 ft', { subkind: 'Frame' }, { backgroundColor: WHITE_FRAME_BG }),
  // //
  // createObj(frame_4, 'Frame 4 ft', { subkind: 'Frame' }, { backgroundColor: BLACK_FRAME_BG }),
  // createObj(frame_8, 'Frame 8 ft', { subkind: 'Frame' }, { backgroundColor: BLACK_FRAME_BG }),
  // createObj(frame_12, 'Frame 12 ft', { subkind: 'Frame' }, { backgroundColor: BLACK_FRAME_BG }),
  // createObj(frame_20, 'Frame 20 ft', { subkind: 'Frame' }, { backgroundColor: BLACK_FRAME_BG }),
  // //
  // createObj(frame_4, 'Frame 4 ft', { subkind: 'Frame' }, { backgroundColor: GREEN_FRAME_BG }),
  // createObj(frame_8, 'Frame 8 ft', { subkind: 'Frame' }, { backgroundColor: GREEN_FRAME_BG }),
  // createObj(frame_12, 'Frame 12 ft', { subkind: 'Frame' }, { backgroundColor: GREEN_FRAME_BG }),
  // createObj(frame_20, 'Frame 20 ft', { subkind: 'Frame' }, { backgroundColor: GREEN_FRAME_BG }),
  //
  createObj(farm, 'Farm 12 ft', { subkind: 'Farm' }),
  createObj(applebox, 'Apple Box', { subkind: 'Apple Box' }),
]
