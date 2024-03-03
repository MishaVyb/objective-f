import { CameraIcon, CircleBackslashIcon, MinusIcon, PlusIcon } from '@radix-ui/react-icons'
import { getFormValue } from '../../../packages/excalidraw/actions/actionProperties'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { ToolButton } from '../../../packages/excalidraw/components/ToolButton'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { t } from '../../../packages/excalidraw/i18n'
import { getSelectedElements } from '../../../packages/excalidraw/scene'
import { newMetaReprElement } from '../elements/newElement'
import {
  getCameraMetas, getSelectedCameraMetas
} from '../meta/selectors'
import { CameraMeta, isAllElementsCameras, isCameraElement } from '../meta/types'
import { handleMetaRepresentation, mutateElementsMeta } from '../elements/helpers'
import { register } from './register'
import { AppClassProperties } from '../../../packages/excalidraw/types'

type ActionType = 'init' | 'remove' | 'incraseShotNumber' | 'decraseShotNumber'


export const actionChangeMetaCameraShot = register({
  name: 'actionChangeMetaCameraShot',
  trackEvent: false,
  perform: (elements, appState, actionType: ActionType, app: AppClassProperties) => {
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
          app.scene,
          cameras,
          'nameRepr',
          (c: CameraMeta) => isShot ? getCameraMetaReprStr(c, {snotNumber: newCameraShootProps.shotNumber}) : '',
          newMetaReprElement
        )

        break
      case 'incraseShotNumber':
        newEls = handleMetaRepresentation(
          app.scene,
          cameras,
          'nameRepr',
          (c: CameraMeta) => getCameraMetaReprStr(c, {shotNumberUpdate: 1}),
          newMetaReprElement,
        )
        mutateElementsMeta(app, (c: CameraMeta) => ({
          shotNumber: getCameraShotNumberUpdate(c, 1),
        }))
        break
      case 'decraseShotNumber':
        newEls = handleMetaRepresentation(
          app.scene,
          cameras,
          'nameRepr',
          (c: CameraMeta) => getCameraMetaReprStr(c, {shotNumberUpdate: -1}),
          newMetaReprElement
        )
        mutateElementsMeta(app, (c: CameraMeta) => ({
          shotNumber: getCameraShotNumberUpdate(c, -1),
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
            icon=<CircleBackslashIcon/>
            onClick={() => updateData('remove')}
            title={t('labels.cameraRemoveFromShotList', null, 'Remove from shot list')}
            aria-label={'undefined'}
            visible={isShot}
          />
          <ToolButton
            type='button'
            icon=<MinusIcon/>
            onClick={() => updateData('decraseShotNumber')}
            title={t('labels.cameraDecraseShotNumber', null, 'Decrase shot number')}
            aria-label={'undefined'}
            visible={isShot}
          />
          <ToolButton
            type='button'
            icon=<PlusIcon/>
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

export const getCameraShotNumberUpdate = (c: CameraMeta, updateValue: number) => {
  const shotNumber = (c.shotNumber || 0) + updateValue
  if (shotNumber <= 0) return 1
  return shotNumber
}

const ALPHABET = (' ' + 'abcdefghijklmnopqrstuvwxyz').split('');

export const getCameraVersionStr = (shotVersion: number)=> ALPHABET[shotVersion] || `${shotVersion}`

export const getCameraMetaReprStr= (c: CameraMeta, opts?: {
    name?: string,
    snotNumber?: number,
    shotNumberUpdate?: number // incrase/decrase value
  }) => {
  let name = typeof opts?.name === 'undefined' ? c.name || '' : opts.name
  let shotNumber = opts?.snotNumber || c.shotNumber
  if (shotNumber) {
    shotNumber = opts?.shotNumberUpdate ? getCameraShotNumberUpdate(c, opts?.shotNumberUpdate || 0) : shotNumber
    name = name ? `\n${name}` : ''
    return `cam ${shotNumber}` + name
  }
  return name
}

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
