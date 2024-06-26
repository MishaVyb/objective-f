import { CURSOR_TYPE } from '../../../packages/excalidraw/constants'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { getCore } from '../meta/_selectors'
import { isHintingPushpin } from './_collision'
import { Vector, ensurePoint } from './_math'

export const getObjectiveCursorOnHoverNotSelectedEls = (
  scenePointer: Vector,
  hitElement: ExcalidrawElement | null | undefined
) => {
  const { oScene, appState, app } = getCore()
  if (!hitElement) return undefined

  const meta = oScene.getMetaByElement(hitElement)
  if (!meta) return undefined

  const isHitPishpin = isHintingPushpin(meta, ensurePoint(scenePointer))
  if (isHitPishpin) return CURSOR_TYPE.GRAB

  return undefined
}
