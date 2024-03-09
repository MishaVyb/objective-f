import { LIB_CAMERAS } from './cameras.library'
import { LIB_CHARACTERS } from './characters.library'
import { LIB_OUTDOR } from './outdoor.library'
import { LIB_PROPS } from './props.library'
import { LIB_SET } from './set.library'
import { LIB_LOCATION } from './location.library'
import { LIB_LIGHT } from './light.library'

export const OBJECTIVE_LIB = [
  ...LIB_LOCATION,
  ...LIB_CAMERAS,
  ...LIB_CHARACTERS,
  ...LIB_LIGHT,
  ...LIB_SET,
  ...LIB_PROPS,
  ...LIB_OUTDOR,
]
