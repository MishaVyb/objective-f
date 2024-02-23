import { CameraIcon } from '@radix-ui/react-icons'
import { getFormValue } from '../../../packages/excalidraw/actions/actionProperties'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { ToolButton } from '../../../packages/excalidraw/components/ToolButton'
import { mutateElement } from '../../../packages/excalidraw/element/mutateElement'
import { handleBindTextResize } from '../../../packages/excalidraw/element/textElement'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { t } from '../../../packages/excalidraw/i18n'
import { getSelectedElements } from '../../../packages/excalidraw/scene'
import { newShotNumberRepr } from '../objects/primitives'
import {
  getCameraMetas,
  getElement,
  getElementsMapStrict,
  getSelectedCameraMetas,
} from '../selectors/selectors'
import { CameraMeta, isAllElementsCameras, isCameraElement } from '../types/types'
import { handleMetaRepresentation, mutateElementsMeta } from '../elements/helpers'
import { register } from './register'

type ActionType = 'init' | 'remove' | 'incraseShotNumber' | 'decraseShotNumber'

export const actionChangeMetaCameraShot = register({
  name: 'actionChangeMetaCameraShot',
  trackEvent: false,
  perform: (elements, appState, actionType: ActionType, app) => {
    const cameras = getSelectedCameraMetas(elements, appState)
    const isShot = actionType === 'init' ? true : false
    let newCameraShootProps: ReturnType<typeof determineCameraMeta>
    let newEls: ReturnType<typeof handleMetaRepresentation> = []

    switch (actionType) {
      case 'init':
      case 'remove':
        // [1] change meta
        newCameraShootProps = determineCameraMeta(elements, isShot)
        mutateElementsMeta<CameraMeta>(app, newCameraShootProps)

        // [2] create/remove shotNumber repr
        newEls = handleMetaRepresentation(
          cameras,
          'shotNumberRepr',
          isShot ? `cam ${newCameraShootProps.shotNumber}` : '',
          newShotNumberRepr
        )

        // [3] move name repr up/down
        cameras.forEach((c) => {
          const container = getElement(c.nameRepr)
          if (!container) return
          mutateElement(container, { y: isShot ? container.y + 25 : container.y - 25 })
          handleBindTextResize(
            container!,
            getElementsMapStrict(container),
            false //
          )
        })

        break
      case 'incraseShotNumber':
        newEls = handleMetaRepresentation(
          cameras,
          'shotNumberRepr',
          (c: CameraMeta) => `cam ${c.shotNumber && c.shotNumber + 1}`,
          newShotNumberRepr
        )
        mutateElementsMeta(app, (c: CameraMeta) => ({
          shotNumber: c.shotNumber && c.shotNumber + 1,
        }))
        break
      case 'decraseShotNumber':
        newEls = handleMetaRepresentation(
          cameras,
          'shotNumberRepr',
          (c: CameraMeta) =>
            `cam ${c.shotNumber && c.shotNumber > 1 ? c.shotNumber - 1 : c.shotNumber}`,
          newShotNumberRepr
        )
        mutateElementsMeta(app, (c: CameraMeta) => ({
          shotNumber: c.shotNumber && c.shotNumber > 1 ? c.shotNumber - 1 : c.shotNumber,
        }))
        break
    }

    return {
      elements: [...elements, ...newEls],
      commitToHistory: true,
    }
  },

  PanelComponent: ({
    elements,
    appState,
    updateData,
    appProps,
  }: PanelComponentProps<ActionType>) => {
    if (!isAllElementsCameras(getSelectedElements(elements, appState))) return <></>
    const isShot = getFormValue<boolean>(
      elements,
      appState,
      (element) => (isCameraElement(element) ? element.customData.isShot : false) || false,
      true,
      false
    )

    return (
      <>
        <fieldset>
          <legend>{t('labels.shotList', null, 'Shot list')}</legend>
          <ToolButton
            type='button'
            icon=<CameraIcon/>
            onClick={() => updateData('init')}
            title={t('labels.cameraAddToShotlist', null, 'Add to shotlist')}
            aria-label={'undefined'}
            visible={!isShot}
          />
          <ToolButton
            type='button'
            icon='❌'
            onClick={() => updateData('remove')}
            title={t('labels.cameraRemoveFromShotList', null, 'Remove from shot list')}
            aria-label={'undefined'}
            visible={isShot}
          />
          <ToolButton
            type='button'
            icon='➖'
            onClick={() => updateData('decraseShotNumber')}
            title={t('labels.cameraDecraseShotNumber', null, 'Decrase shot number')}
            aria-label={'undefined'}
            visible={isShot}
          />
          <ToolButton
            type='button'
            icon='➕'
            onClick={() => updateData('incraseShotNumber')}
            title={t('labels.cameraIncraseShotNumber', null, 'Incrase shot number')}
            aria-label={'undefined'}
            visible={isShot}
          />
        </fieldset>
      </>
    )
  },
})

export const determineCameraMeta = (elements: readonly ExcalidrawElement[], isShot: boolean) => {
  if (isShot) {
    const allCameras = getCameraMetas(elements)
    return {
      isShot: true,
      shotNumber: Math.max(...allCameras.map((c) => c.shotNumber || 0)) + 1,
      shotVersion: undefined, // not implemented yet
    }
  }

  return {
    isShot: false,
    shotNumber: undefined,
    shotVersion: undefined, // not implemented yet
  }
}
