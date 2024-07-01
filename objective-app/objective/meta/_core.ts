import { MarkOptional } from '../../../packages/excalidraw/utility-types'
import { ObjectiveKinds, ObjectiveMeta, ObjectiveSubkinds } from './_types'

const _DEFAULT: ObjectiveMeta['core'] = { basisIndex: 0, isInternalBasis: false }

const _METAS_CORE_DEFINITION: MarkOptional<
  Record<ObjectiveKinds | ObjectiveSubkinds, ObjectiveMeta['core']>,
  ObjectiveKinds | ObjectiveSubkinds
> = {
  // per Kind:
  camera: {
    ..._DEFAULT,
    isInternalBasis: true,

    isPushpinRotation: true,
    pushpinRotationShiftAngle: 1.5708, // 90˚
    pushpinRotationShiftFactor: 50 / 14,
    pushpinRotationCenterShiftFactor: 50 / 13.5,

    disableFlip: true, // FIXME now it does'n work good for cameras because of Turns (but OK for characters)
    disableResizeAlways: true, // FIXME now it does'n work good for cameras/characeter because of Turns
  },

  character: {
    ..._DEFAULT,
    isInternalBasis: true,

    isPushpinRotation: true,
    pushpinRotationShiftAngle: 0,
    pushpinRotationShiftFactor: 50 / 16,
    disableResizeAlways: true, // FIXME now it does'n work good for cameras/characeter because of Turns
  },

  // per Subkind:
  window: {
    ..._DEFAULT,
    // isBoundsTakenFromBasis: true, // UNUSED
  },
  doorClosed: {
    ..._DEFAULT,
    basisIndex: 1, // dashed line
    // isBoundsTakenFromBasis: true, // UNUSED
  },
  doorOpen: {
    ..._DEFAULT,
    basisIndex: 1, // dashed line
    // isBoundsTakenFromBasis: true, // UNUSED
  },
  pushpinArrow: {
    ..._DEFAULT,
    arrowheadSize: 7,
  },
}

export const getMetaCore = (
  kind: ObjectiveKinds,
  subkind?: ObjectiveSubkinds
): ObjectiveMeta['core'] =>
  (subkind && _METAS_CORE_DEFINITION[subkind]) || _METAS_CORE_DEFINITION[kind] || _DEFAULT
