import { CameraIcon, CircleBackslashIcon, EnterIcon, ExitIcon, MinusIcon, PlusIcon } from '@radix-ui/react-icons'
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

type TChangeShotActionValue = 'init' | 'remove' | 'incraseShotNumber' | 'decraseShotNumber'


export const actionChangeMetaCameraShot = register({
  name: 'actionChangeMetaCameraShot',
  trackEvent: false,
  perform: (elements, appState, actionType: TChangeShotActionValue, app: AppClassProperties) => {
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
          (c: CameraMeta) => isShot ? getCameraMetaReprStr(c, {shotNumber: newCameraShootProps.shotNumber}) : '',
          newMetaReprElement
        )

        break
      case 'incraseShotNumber':
        newEls = handleMetaRepresentation(
          app.scene,
          cameras,
          'nameRepr',
          (c: CameraMeta) => {
            console.log(c)
            return getCameraMetaReprStr(c, { shotNumberUpdate: 1 })
          },
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
  }: PanelComponentProps<TChangeShotActionValue>) => {
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
            visible={!isShot}
          />
          <ToolButton
            type='button'
            icon=<CircleBackslashIcon/>
            onClick={() => updateData('remove')}
            title={t('labels.cameraRemoveFromShotList', null, 'Remove from shot list')}
            visible={isShot}
          />
          <ToolButton
            type='button'
            icon=<MinusIcon/>
            onClick={() => updateData('decraseShotNumber')}
            title={t('labels.cameraDecraseShotNumber', null, 'Decrase shot number')}
            visible={isShot}
          />
          <ToolButton
            type='button'
            icon=<PlusIcon/>
            onClick={() => updateData('incraseShotNumber')}
            title={t('labels.cameraIncraseShotNumber', null, 'Incrase shot number')}
            visible={isShot}
          />
        </fieldset>
      </>
    )
  },
})

// NOTE
// do not expose actions to init\remove shotVersion, as we handle it only be incrase\decrase version counter
type TChangeVersionActionValue = 'moveTo' | 'moveFrom'  | 'incraseShotVersion' | 'decraseShotVersion'

export const actionChangeMetaCameraVersion = register({
  name: 'actionChangeMetaCameraVersion',
  trackEvent: false,
  perform: (elements, appState, actionType: TChangeVersionActionValue, app: AppClassProperties) => {
    const cameras = getSelectedCameraMetas(elements, appState)
    // const isShot = actionType === 'init' ? true : false
    let newEls: ReturnType<typeof handleMetaRepresentation> = []

    switch (actionType) {
      // TODO
      // Move To \ From
      //--------------------------------------------//
      case 'incraseShotVersion':
        newEls = handleMetaRepresentation(
          app.scene,
          cameras,
          'nameRepr',
          (c: CameraMeta) => getCameraMetaReprStr(c, {shotVersionUpdate: 1}),
          newMetaReprElement,
        )
        mutateElementsMeta(app, (c: CameraMeta) => ({
          shotVersion: getCameraShotVersionUpdate(c, 1),
        }))
        break
      case 'decraseShotVersion':
        newEls = handleMetaRepresentation(
          app.scene,
          cameras,
          'nameRepr',
          (c: CameraMeta) => getCameraMetaReprStr(c, {shotVersionUpdate: -1}),
          newMetaReprElement
        )
        mutateElementsMeta(app, (c: CameraMeta) => ({
          shotVersion: getCameraShotVersionUpdate(c, -1),
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
  }: PanelComponentProps<TChangeVersionActionValue>) => {
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
          <legend>{"Shot version"}</legend>
          <ToolButton
            type='button'
            icon=<EnterIcon/>
            onClick={() => updateData('moveFrom')}
            title={"Move From"}
          />
          <ToolButton
            type='button'
            icon=<ExitIcon/>
            onClick={() => updateData('moveTo')}
            title={"Move To"}
          />

          {/* -------------------- */}
          <br/>
          <ToolButton
            type='button'
            icon=<MinusIcon/>
            onClick={() => updateData('decraseShotVersion')}
            title={'Decrase shot version'}
            visible={isShot}
          />
          <ToolButton
            type='button'
            icon=<PlusIcon/>
            onClick={() => updateData('incraseShotVersion')}
            title={'Incrase shot version'}
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

export const getCameraShotVersionUpdate = (c: CameraMeta, updateValue: number) => {
  const shotVersion = (c.shotVersion || 0) + updateValue
  if (shotVersion <= 0) return undefined // that camera has no version anymore
  return shotVersion
}


const ALPHABET = (' ' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ').split('');

export const getCameraVersionStr = (shotVersion: number | undefined) => shotVersion ? ALPHABET[shotVersion] || `${shotVersion}` : ''

export const getCameraMetaReprStr= (c: CameraMeta, opts?: {
    name?: string,
    shotNumber?: number,
    shotVersion?: number,
    shotNumberUpdate?: number // incrase/decrase value
    shotVersionUpdate?: number // incrase/decrase value
  }) => {
  let name = typeof opts?.name === 'undefined' ? c.name || '' : opts.name
  let shotNumber = opts?.shotNumber || c.shotNumber
  let shotVersion = opts?.shotVersion || c.shotVersion
  if (shotNumber) {
    shotNumber = opts?.shotNumberUpdate ? getCameraShotNumberUpdate(c, opts?.shotNumberUpdate || 0) : shotNumber
    shotVersion = opts?.shotVersionUpdate ? getCameraShotVersionUpdate(c, opts?.shotVersionUpdate || 0) : shotVersion
    name = name ? `\n${name}` : ''

    if (shotVersion) return `cam ${shotNumber}-${getCameraVersionStr(shotVersion)}` + name
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
