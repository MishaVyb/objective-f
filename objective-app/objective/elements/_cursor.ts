import { CURSOR_TYPE } from '../../../packages/excalidraw/constants'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { scene_getMetaByElement } from '../meta/_scene'
import { getCore } from '../meta/_selectors'
import { isHintingPushpin } from './_collision'
import { Vector, ensurePoint } from './_math'

export const getObjectiveCursorOnHoverNotSelectedEls = (
  scenePointer: Vector,
  hitElement: ExcalidrawElement | null | undefined
) => {
  const { oScene, appState, app } = getCore()
  if (!hitElement) return undefined

  const meta = scene_getMetaByElement(oScene, hitElement)
  if (!meta) return undefined

  const isHitPishpin = isHintingPushpin(
    oScene,
    appState,
    meta,
    app.frameNameBoundsCache,
    ensurePoint(scenePointer)
  )
  if (isHitPishpin) return CURSOR_TYPE.GRAB

  return undefined
}
