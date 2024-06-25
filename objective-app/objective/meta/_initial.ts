import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { randomId } from '../../../packages/excalidraw/random'
import { MarkOptional, Mutable } from '../../../packages/excalidraw/utility-types'

import { getMetaSimple } from './_selectors'
import {
  AnyObjectiveMeta,
  ObjectiveKinds,
  ObjectiveMeta,
  isCameraMeta,
  isKind,
  isObjective,
} from './_types'

type TMetaOverrides = Record<ObjectiveKinds, Partial<Omit<AnyObjectiveMeta, 'kind'>>>
type TOptionalMetaOverrides = MarkOptional<TMetaOverrides, keyof TMetaOverrides>

/**
 * Metas Core Opts Delcaration.
 * @see {@link ObjectiveMeta.coreOpts}
 */
const _METAS_CORE_DEFINITION: TOptionalMetaOverrides = {
  camera: {
    isInternalBasis: true,
    relatedImages: [],
    coreOpts: {
      isPushpinRotation: true,
      pushpinRotationShiftAngle: 1.5708, // 90˚
      pushpinRotationShiftFactor: 50 / 14,
      pushpinRotationCenterShiftFactor: 50 / 13.5,

      disableFlip: true, // FIXME now it does'n work good for cameras because of Turns (but OK for characters)
      disableResizeAlways: true, // FIXME now it does'n work good for cameras/characeter because of Turns
    },
  },
  character: {
    isInternalBasis: true,
    coreOpts: {
      isPushpinRotation: true,
      pushpinRotationShiftAngle: 0,
      pushpinRotationShiftFactor: 50 / 16,
      disableResizeAlways: true, // FIXME now it does'n work good for cameras/characeter because of Turns
    },
  },
  light: {
    isInternalBasis: true,
  },
}

/**
 * NOTE: dont forget apply all defaults here and at duplicateMeta function bellow
 *
 * @return default meta with overrides
 * */
export const getInitialMeta = <T extends ObjectiveKinds>(
  kind: T,
  overriddes: Omit<Partial<AnyObjectiveMeta>, 'kind'> = {}
): ObjectiveMeta<T> => ({
  kind: kind,
  id: '',
  elementIds: [],
  elements: [],
  basis: undefined,
  name: undefined,
  nameRepr: undefined,
  basisIndex: 0,
  isInternalBasis: false,
  disableResize: true,
  ..._METAS_CORE_DEFINITION[kind],
  ...overriddes,
})

/**
 * Initialize new meta. Some values are copied, some other taken from initial Meta.
 * MUTATE PROVIDED ELEMENT's META
 *
 * It's Objective replacement of Excalidraw deepCopyElement.
 */
export const duplicateMeta = (newElement: Mutable<ExcalidrawElement>) => {
  if (!isObjective(newElement)) return
  const weekMeta = getMetaSimple(newElement)
  const newMeta = newElement.customData

  // common:
  Object.assign(
    newMeta,
    getInitialMeta(weekMeta.kind, {
      name: weekMeta.name,
      description: weekMeta.description,
      disableResize: weekMeta.disableResize,

      // HACK
      // pass here TMP id in order to tell `duplicateObjectiveEventHandler` hat Object has nameRep.
      // So it will recreate Label with new id and provide that id here as well.
      nameRepr: weekMeta.nameRepr ? randomId() : undefined,
      turnParentId: undefined, // dissociate any Turns
    })
  )

  // per kind:
  if (isCameraMeta(weekMeta))
    Object.assign(
      newMeta,
      getInitialMeta(ObjectiveKinds.CAMERA, {
        ...newMeta, // ???

        isShot: weekMeta.isShot,
        shotNumber: weekMeta.shotNumber, // do not incrase shot number atomatecly, user will do it by himself
        shotVersion: weekMeta.shotVersion,
        focalLength: weekMeta.focalLength,
        focusDistance: weekMeta.focusDistance,
        cameraFormat: weekMeta.cameraFormat,
        aspectRatio: weekMeta.aspectRatio,
        lensAngleRepr: weekMeta.lensAngleRepr,
      })
    )

  if (isKind(weekMeta, ObjectiveKinds.LABEL) || isKind(weekMeta, ObjectiveKinds.LABEL_TEXT))
    // @ts-ignore // HACK if we copy LABEL/LABEL_TEXT directly it's no Objective anymore
    newElement.customData = {}
}
