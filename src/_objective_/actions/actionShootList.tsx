import { getFormValue } from '../../actions/actionProperties'
import { PanelComponentProps } from '../../actions/types'
import { ToolButton } from '../../components/ToolButton'
import { t } from '../../i18n'
import { getSelectedElements } from '../../scene'
import { newNameRepr } from '../objects/primitives'
import { getSelectedCameraMetas } from '../selectors/selectors'
import { CameraMeta, isAllElementsCameras, isCameraElement } from '../types/types'
import { mutateElementsMeta, updateMetaRepresentation } from './helpers'
import { register } from './register'

export const actionChangeMetaCameraShot = register({
  name: 'actionChangeMetaCameraShot',
  trackEvent: false,
  perform: (elements, appState, value, app) => {
    const cameras = getSelectedCameraMetas(elements, appState)
    const isShot = value === 'init' ? true : false
    let newCameraShootProps: ReturnType<typeof determineCameraMeta>
    let newEls: ReturnType<typeof updateMetaRepresentation> = []

    switch (value) {
      case 'init':
      case 'remove':
        newCameraShootProps = determineCameraMeta(cameras, isShot)
        newEls = updateMetaRepresentation(
          cameras,
          'shotNumberRepr',
          isShot ? `cam ${newCameraShootProps.shotNumber}` : '',
          newNameRepr
        )
        mutateElementsMeta<CameraMeta>(app, newCameraShootProps)
        break
      case 'incraseShotNumber':
        newEls = updateMetaRepresentation(
          cameras,
          'shotNumberRepr',
          (c: CameraMeta) => `cam ${c.shotNumber && c.shotNumber + 1}`,
          newNameRepr
        )
        mutateElementsMeta(app, (c: CameraMeta) => ({
          shotNumber: c.shotNumber && c.shotNumber + 1,
        }))
        break
      case 'decraseShotNumber':
        newEls = updateMetaRepresentation(
          cameras,
          'shotNumberRepr',
          (c: CameraMeta) =>
            `cam ${c.shotNumber && c.shotNumber > 1 ? c.shotNumber - 1 : c.shotNumber}`,
          newNameRepr
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

  PanelComponent: ({ elements, appState, updateData, appProps }: PanelComponentProps) => {
    if (!isAllElementsCameras(getSelectedElements(elements, appState))) return <></>
    const isShot = getFormValue(
      elements,
      appState,
      (element) => (isCameraElement(element) ? element.customData.isShot : false),
      false
    )

    return (
      <>
        <fieldset>
          <legend>{t('labels.shotList', null, 'Shot list')}</legend>
          <ToolButton
            type='button'
            icon='📸'
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

// const changeCameraIsShot = (
//   elements: readonly ExcalidrawElement[],
//   appState: AppState,
//   isShot: boolean
// ) =>
//   changeElementsMeta<CameraMeta>(
//     elements,
//     appState,
//     determineCameraMeta(getCameraMetas(getNonDeletedElements(elements)), isShot)
//   )

const determineCameraMeta = (cameras: readonly CameraMeta[], isShot: boolean) => {
  if (isShot)
    return {
      isShot: true,
      shotNumber: Math.max(...cameras.map((c) => c.shotNumber || 0)) + 1,
      shotVersion: undefined, // not implemented yet
    }

  return {
    isShot: false,
    shotNumber: undefined,
    shotVersion: undefined, // not implemented yet
  }
}
