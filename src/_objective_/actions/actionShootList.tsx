import { getFormValue } from '../../actions/actionProperties'
import { PanelComponentProps } from '../../actions/types'
import { ToolButton } from '../../components/ToolButton'
import { getNonDeletedElements } from '../../element'
import { ExcalidrawElement } from '../../element/types'
import { t } from '../../i18n'
import { getSelectedElements } from '../../scene'
import { AppState } from '../../types'
import { getCameraMetas } from '../selectors/selectors'
import { CameraMeta, isAllElementsCameras } from '../types/types'
import { changeElementsMeta } from './helpers'
import { register } from './register'

export const actionChangeMetaCameraShot = register({
  name: 'actionChangeMetaCameraShot',
  trackEvent: false,
  perform: (elements, appState, value) => {
    switch (value) {
      case 'init':
      case 'remove':
        return changeCameraIsShot(elements, appState, value === 'init' ? true : false)
      case 'incraseShotNumber':
        return changeElementsMeta(elements, appState, (m: CameraMeta) => ({
          shotNumber: m.shotNumber && m.shotNumber + 1,
        }))
      case 'decraseShotNumber':
        return changeElementsMeta(elements, appState, (m: CameraMeta) => ({
          shotNumber: m.shotNumber && m.shotNumber > 1 ? m.shotNumber - 1 : m.shotNumber,
        }))
    }

    throw Error
  },

  PanelComponent: ({ elements, appState, updateData, appProps }: PanelComponentProps) => {
    if (!isAllElementsCameras(getSelectedElements(elements, appState))) return <></>
    const isShot = getFormValue(elements, appState, (element) => element.customData?.isShot, null)

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

const changeCameraIsShot = (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
  isShot: boolean
) =>
  changeElementsMeta(
    elements,
    appState,
    determineCameraMeta(getCameraMetas(getNonDeletedElements(elements)), isShot)
  )

const determineCameraMeta = (cameras: readonly CameraMeta[], isShot: boolean) => {
  if (isShot)
    return {
      isShot: true,
      shotNumber: Math.max(...cameras.map((c) => c.shotNumber || 0)) + 1,
      shotVersion: undefined,
    }

  return {
    isShot: false,
    shotNumber: undefined,
    shotVersion: undefined,
  }
}
