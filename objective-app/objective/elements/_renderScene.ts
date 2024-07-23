import { newElementWith } from '../../../packages/excalidraw'
import { isInitializedImageElement } from '../../../packages/excalidraw/element/typeChecks'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { renderElement } from '../../../packages/excalidraw/renderer/renderElement'
import { StaticSceneRenderConfig } from '../../../packages/excalidraw/scene/types'
import { getCoreSafe, getObjectiveMetas, isElementSelected } from '../meta/_selectors'
import { isCameraMeta, isObjectiveHidden } from '../meta/_types'
import { ensurePoint, ensureVector, getElementCenter } from './_math'
import {
  getCameraLensAngleElements,
  getPushpinArrowElements,
  getPushpinElements,
} from './_newElementObjectiveConstructors'
import { rotateElementOnAngle } from './_resizeElements'
import { isPushbinHandlePotential } from './_transformHandles'

export const renderObjectiveScene = (
  {
    canvas,
    rc,
    elementsMap,
    allElementsMap,
    visibleElements,
    scale,
    appState,
    renderConfig,
  }: StaticSceneRenderConfig,
  context: CanvasRenderingContext2D
) => {
  const { app } = getCoreSafe()
  const extraEls: ExcalidrawElement[] = []

  visibleElements.forEach((el) => {
    if (
      isInitializedImageElement(el) &&
      app &&
      app.state.croppingModeEnabled &&
      isElementSelected(app.state, el)
    ) {
      // original image on cropping
      const fullImageOverlay = newElementWith(el, {
        opacity: el.opacity / 2,
        xToPullFromImage: 0,
        yToPullFromImage: 0,
        wToPullFromImage: el.underlyingImageWidth,
        hToPullFromImage: el.underlyingImageHeight,
        x: el.x - el.xToPullFromImage * el.rescaleX,
        y: el.y - el.yToPullFromImage * el.rescaleY,
        width: el.underlyingImageWidth * el.rescaleX,
        height: el.underlyingImageHeight * el.rescaleY,
        angle: 0, // perfrom custom rotate in order to handle XY shift properly
      })

      // HACK not fullImageOverlay center, but cropped element center
      const rotateCenter = ensurePoint(getElementCenter(el))
      rotateElementOnAngle(fullImageOverlay, ensureVector(rotateCenter), el.angle)

      extraEls.push(fullImageOverlay)
    }
  })

  const metas = getObjectiveMetas(visibleElements)

  metas.forEach((meta) => {
    // lens angle & focus lines
    if (isCameraMeta(meta) && !isObjectiveHidden(meta.basis!) && meta.lensAngleRepr)
      extraEls.push(...getCameraLensAngleElements(meta))

    // pushpin
    if (app) {
      if (isPushbinHandlePotential(meta)) {
        extraEls.push(...getPushpinElements(meta))
      } else {
        extraEls.push(...getPushpinArrowElements(meta))
      }
    }
  })

  extraEls.forEach((e) =>
    renderElement(e, elementsMap, allElementsMap, rc, context, renderConfig, appState)
  )
}
