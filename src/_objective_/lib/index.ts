import { LIB_CAMERAS } from './cameras.library'
import { LIB_CHARACTERS } from './characters.library'
import { LIB_OUTDOR } from './outdoor.library'
import { LIB_PROPS } from './props.library'
import { LIB_SET } from './set.library'
import { LIB_LOCATION } from './location.library'

export const OBJECTIVE_LIB = [
  ...LIB_CAMERAS,
  ...LIB_CHARACTERS,
  ...LIB_LOCATION,
  ...LIB_SET,
  ...LIB_PROPS,
  ...LIB_OUTDOR,
]
