import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { randomId } from '../../../packages/excalidraw/random'
import { Mutable } from '../../../packages/excalidraw/utility-types'
import { getMetaSimple } from './selectors'
import {
  AnyObjectiveMeta,
  CameraMeta,
  ObjectiveKinds,
  ObjectiveMeta,
  isCameraMeta,
  isObjective,
} from './types'

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
  name: undefined,
  nameRepr: undefined,
  basisIndex: 0,
  disableResize: true,
  ...overriddes,
})

export const cameraInitialMeta: CameraMeta = {
  ...getInitialMeta(ObjectiveKinds.CAMERA),

  isShot: undefined,
  shotNumber: undefined,
  shotVersion: undefined,
  focalLength: undefined,

  relatedImages: [],
}

/**
 * Initialize new meta. Some values are copied, some other taken from initial Meta.
 * MUTATE PROVIDED ELEMENT's META
 *
 * It's Objective replacement of Excalidraw deepCopyElement.
 */
export const duplicateMeta = (newElement: Mutable<ExcalidrawElement>) => {
  if (!isObjective(newElement)) return
  const weekMeta = getMetaSimple(newElement)

  if (isCameraMeta(weekMeta)) {
    Object.assign(
      newElement.customData,
      getInitialMeta(ObjectiveKinds.CAMERA, {
        name: weekMeta.name,
        description: weekMeta.description,
        disableResize: weekMeta.disableResize,

        // HACK
        // pass here TMP id in order to tell `duplicateObjectiveEventHandler` hat Object has nameRep.
        // So it will recreate Label with new id and provide that id here as well.
        nameRepr: weekMeta.nameRepr ? randomId() : undefined,

        isShot: weekMeta.isShot,
        shotNumber: weekMeta.shotNumber, // do not incrase shot number atomatecly, user will do it by himself
        shotVersion: weekMeta.shotVersion,
        focalLength: weekMeta.focalLength,

        // initial values
        relatedImages: [],
      })
    )
  } else {
    Object.assign(
      newElement.customData,
      getInitialMeta(weekMeta.kind, {
        name: weekMeta.name,
        description: weekMeta.description,
        disableResize: weekMeta.disableResize,

        // HACK
        nameRepr: weekMeta.nameRepr ? randomId() : undefined,
      })
    )
  }
}
