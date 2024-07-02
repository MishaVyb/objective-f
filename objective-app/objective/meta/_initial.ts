import { deepCopyElement } from '../../../packages/excalidraw/element/newElement'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { Mutable } from '../../../packages/excalidraw/utility-types'

import { getMeta } from './_selectors'
import {
  ObjectiveKinds,
  isCameraMeta,
  isKind,
  isObjective,
  TAnyWeekMeta,
  ObjectiveSubkinds,
  ObjectiveElement,
  WeekMeta,
  CameraMeta,
  LabelMeta,
  isObjectiveKind,
  META_VERSION,
} from './_types'

/**
 * Get initital `element.customData`
 * - building initial Library Objective Item
 * - building extra Objective Item on fly programatecly during some user action
 * */
export const buildWeekMeta = (
  kind: ObjectiveKinds,
  subkind: ObjectiveSubkinds | undefined = undefined,
  extra: Pick<
    Partial<TAnyWeekMeta>,
    'name' | 'labelOf' | 'elementsRequiredLength' | 'lib' | 'relatedImages'
  > = {}
): WeekMeta | WeekMeta<CameraMeta> | WeekMeta<LabelMeta> => {
  if (isObjectiveKind(kind, ObjectiveKinds.CAMERA)) {
    const CAMERA: WeekMeta<CameraMeta> = {
      version: META_VERSION,
      kind: kind,
      subkind: subkind,
      disableResize: true,
      relatedImages: [],
    }
    return CAMERA
  }
  if (isObjectiveKind(kind, ObjectiveKinds.LABEL)) {
    const LABEL: WeekMeta<LabelMeta> = {
      version: META_VERSION,
      kind: kind,
      subkind: subkind,
      //
      labelOf: extra.labelOf || '',
      disableResize: false,
    }
    return LABEL
  }
  const COMMON: WeekMeta = {
    version: META_VERSION,
    kind: kind,
    subkind: subkind,
    //
    disableResize: true,
    ...extra,
  }
  return COMMON
}

/**
 * Initialize new meta. Some values are copied, some other taken from initial Meta.
 * MUTATE PROVIDED ELEMENT's META
 *
 * Reset some values, that should not be copied. Apply some defaults.
 * Element.customData already copied be `deepCopyElement`. @see {@link deepCopyElement}
 */
export const duplicateMeta = (newElement: Mutable<ExcalidrawElement>) => {
  if (!isObjective(newElement)) return
  const originalMeta = getMeta(newElement)

  // common:
  Object.assign(newElement.customData, {
    // dissociate any Turns
    turnParentId: undefined,
  })

  // per kind:
  if (isCameraMeta(originalMeta))
    Object.assign(newElement.customData, {
      // dissociate any Storyboards
      relatedImages: [],
      // do not incrase shot number atomatecly, user will do it by himself
      shotNumber: originalMeta.shotNumber,
    })

  if (isKind(originalMeta, ObjectiveKinds.LABEL) || isKind(originalMeta, ObjectiveKinds.LABEL_TEXT))
    // NOTE if we copy LABEL/LABEL_TEXT directly it's no Objective anymore
    removeMeta(newElement)
}

export const removeMeta = (element: ObjectiveElement) => {
  const el = element as Mutable<ExcalidrawElement>
  el.customData = undefined
}

// ------------------------ ts tests -----------------------------------------

const aaa = () => {}
