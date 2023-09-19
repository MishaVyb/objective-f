import { getFormValue } from '../../actions/actionProperties'
import { PanelComponentProps } from '../../actions/types'
import { ToolButton } from '../../components/ToolButton'
import { getNonDeletedElements } from '../../element'
import { t } from '../../i18n'
import { getSelectedElements } from '../../scene'
import { newNameRepr } from '../objects/primitives'
import { getCameraMetas } from '../selectors/selectors'
import { CameraMeta, isAllElementsCameras, isCameraElement } from '../types/types'
import { changeElementsMeta, updateMetaRepresentation } from './helpers'
import { register } from './register'

export const actionChangeMetaCameraShot = register({
  name: 'actionChangeMetaCameraShot',
  trackEvent: false,
  perform: (elements, appState, value) => {
    const isShot = value === 'init' ? true : false
    let newCameraShootProps: ReturnType<typeof determineCameraMeta>
    switch (value) {
      case 'init':
      case 'remove':
        newCameraShootProps = determineCameraMeta(
          getCameraMetas(getNonDeletedElements(elements)),
          isShot
        )
        elements = updateMetaRepresentation(
          elements,
          getCameraMetas(getSelectedElements(elements, appState)),
          'shotNumberRepr',
          isShot ? `cam ${newCameraShootProps.shotNumber}` : '',
          newNameRepr
        )
        elements = changeElementsMeta<CameraMeta>(elements, appState, newCameraShootProps)
        break
      case 'incraseShotNumber':
        elements = updateMetaRepresentation(
          elements,
          getCameraMetas(getSelectedElements(elements, appState)),
          'shotNumberRepr',
          (c: CameraMeta) => `cam ${c.shotNumber && c.shotNumber + 1}`,
          newNameRepr
        )
        elements = changeElementsMeta(elements, appState, (c: CameraMeta) => ({
          shotNumber: c.shotNumber && c.shotNumber + 1,
        }))
        break
      case 'decraseShotNumber':
        elements = updateMetaRepresentation(
          elements,
          getCameraMetas(getSelectedElements(elements, appState)),
          'shotNumberRepr',
          (c: CameraMeta) =>
            `cam ${c.shotNumber && c.shotNumber > 1 ? c.shotNumber - 1 : c.shotNumber}`,
          newNameRepr
        )
        elements = changeElementsMeta(elements, appState, (c: CameraMeta) => ({
          shotNumber: c.shotNumber && c.shotNumber > 1 ? c.shotNumber - 1 : c.shotNumber,
        }))
        break
    }

    return {
      elements: elements,
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
