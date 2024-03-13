import {
  CameraIcon,
  CircleBackslashIcon,
  EnterIcon,
  ExitIcon,
  MinusIcon,
  PlusIcon,
} from '@radix-ui/react-icons'
import { getFormValue } from '../../../packages/excalidraw/actions/actionProperties'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { getSelectedElements } from '../../../packages/excalidraw/scene'
import { newMetaReprElement } from '../elements/newElement'
import { getCameraMetas, getObjectiveSingleMeta, getSelectedCameraMetas } from '../meta/selectors'
import { CameraMeta, isAllElementsCameras, isCameraElement } from '../meta/types'

import { register } from './register'
import { AppClassProperties } from '../../../packages/excalidraw/types'
import { Button, Flex, IconButton } from '@radix-ui/themes'
import { handleMetaRepresentation } from '../elements/metaRepr'
import { mutateElementsMeta } from '../elements/mutateElements'
import { duplicateElements } from '../../../packages/excalidraw/actions/actionDuplicateSelection'

type TChangeShotActionValue = 'init' | 'remove' | 'incraseShotNumber' | 'decraseShotNumber'

export const actionChangeMetaCameraShot = register({
  name: 'actionChangeMetaCameraShot',
  trackEvent: false,
  perform: (elements, appState, actionType: TChangeShotActionValue, app: AppClassProperties) => {
    const cameras = getSelectedCameraMetas(app.scene, appState)
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
          (c: CameraMeta) =>
            isShot ? getCameraMetaReprStr(c, { shotNumber: newCameraShootProps.shotNumber }) : '',
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
          newMetaReprElement
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
          (c: CameraMeta) => getCameraMetaReprStr(c, { shotNumberUpdate: -1 }),
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
      <fieldset>
        <legend>{'Shot list'}</legend>
        {isShot ? (
          <Flex gap={'1'}>
            <IconButton
              size={'2'}
              variant={'outline'}
              color={'red'}
              onClick={() => updateData('remove')}
              title={'Remove from shot list'}
            >
              <CircleBackslashIcon />
            </IconButton>
            <IconButton
              size={'2'}
              variant={'soft'}
              color={'gray'}
              onClick={() => updateData('decraseShotNumber')}
              title={'Decrase shot number'}
            >
              <MinusIcon />
            </IconButton>
            <IconButton
              size={'2'}
              variant={'soft'}
              color={'gray'}
              onClick={() => updateData('incraseShotNumber')}
              title={'Incrase shot number'}
            >
              <PlusIcon />
            </IconButton>
          </Flex>
        ) : (
          <Button
            size={'2'}
            variant={'surface'}
            color={'gray'}
            highContrast={true}
            onClick={() => updateData('init')}
            title={'Add to shotlist'}
          >
            <CameraIcon />
            {'Add'}
          </Button>
        )}
      </fieldset>
    )
  },
})

// NOTE
// do not expose actions to init\remove shotVersion, as we handle it only be incrase\decrase version counter
type TChangeVersionActionValue = 'moveTo' | 'moveFrom' | 'incraseShotVersion' | 'decraseShotVersion'

export const actionChangeMetaCameraVersion = register({
  name: 'actionChangeMetaCameraVersion',
  trackEvent: false,
  perform: (elements, appState, actionType: TChangeVersionActionValue, app: AppClassProperties) => {
    const cameras = getSelectedCameraMetas(app.scene, appState)
    const singleCamera = cameras[0]

    let newEls: ReturnType<typeof handleMetaRepresentation> = []
    let newCameraShotVers: number

    switch (actionType) {
      case 'moveTo':
        if (!singleCamera.shotVersion) {
          newCameraShotVers = 2
          // RECURSIVE CALL
          elements = actionChangeMetaCameraVersion.perform(
            elements,
            appState,
            'incraseShotVersion',
            app
          ).elements!
        } else {
          newCameraShotVers = singleCamera.shotVersion + 1
        }
        return {
          ...duplicateElements(elements, appState, app, {
            shift: { x: 150, y: 0 },
            addPointerWith: singleCamera,
            addPointerSubkind: 'cameraMovementPointer',
            addPointerOverrides: {endArrowhead: 'triangle'},
            newElementsMeta: { shotVersion: newCameraShotVers },
          }),
          commitToHistory: true,
        }
      case 'moveFrom':
        if (!singleCamera.shotVersion) {
          newCameraShotVers = 1
          // FIXME
          // RECURSIVE CALL x2
          elements = actionChangeMetaCameraVersion.perform(
            elements,
            appState,
            'incraseShotVersion',
            app
          ).elements!
          elements = actionChangeMetaCameraVersion.perform(
            elements,
            appState,
            'incraseShotVersion',
            app
          ).elements!
        } else {
          newCameraShotVers = singleCamera.shotVersion - 1
          elements = actionChangeMetaCameraVersion.perform(
            elements,
            appState,
            'incraseShotVersion',
            app
          ).elements!
        }
        return {
          ...duplicateElements(elements, appState, app, {
            shift: { x: -150, y: 0 },
            addPointerWith: singleCamera,
            addPointerSubkind: 'cameraMovementPointer',
            addPointerOverrides: {endArrowhead: 'triangle'},
            addPointerReverseDirection: true,
            newElementsMeta: { shotVersion: newCameraShotVers },
          }),
          commitToHistory: true,
        }

      case 'incraseShotVersion':
        newEls = handleMetaRepresentation(
          app.scene,
          cameras,
          'nameRepr',
          (c: CameraMeta) => getCameraMetaReprStr(c, { shotVersionUpdate: 1 }),
          newMetaReprElement
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
          (c: CameraMeta) => getCameraMetaReprStr(c, { shotVersionUpdate: -1 }),
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
    const singleMeta = getObjectiveSingleMeta(getSelectedElements(elements, appState))

    const isShot = getFormValue<boolean>(
      elements,
      appState,
      (element) => (isCameraElement(element) ? element.customData.isShot : false) || false,
      true,
      false
    )

    return (
      <fieldset>
        <legend>{'Shot version'}</legend>
        <Flex direction={'column'} gap={'1'}>
          {singleMeta && (
            <Flex gap={'1'}>
              <Button
                size={'2'}
                variant={'surface'}
                color={'gray'}
                onClick={() => updateData('moveFrom')}
                title={'Move camera from'}
              >
                {'From'}
                <EnterIcon />
              </Button>

              <Button
                size={'2'}
                variant={'surface'}
                color={'gray'}
                onClick={() => updateData('moveTo')}
                title={'Move camera to'}
              >
                <ExitIcon />
                {'To'}
              </Button>
            </Flex>
          )}
          {isShot ? (
            <Flex gap={'1'}>
              <IconButton
                size={'2'}
                variant={'soft'}
                color={'gray'}
                onClick={() => updateData('decraseShotVersion')}
                title={'Decrase shot version'}
              >
                <MinusIcon />
              </IconButton>
              <IconButton
                size={'2'}
                variant={'soft'}
                color={'gray'}
                onClick={() => updateData('incraseShotVersion')}
                title={'Incrase shot version'}
              >
                <PlusIcon />
              </IconButton>
            </Flex>
          ) : null}
        </Flex>
      </fieldset>
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

const ALPHABET = (' ' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ').split('')

export const getCameraVersionStr = (shotVersion: number | undefined) =>
  shotVersion ? ALPHABET[shotVersion] || `${shotVersion}` : ''

export const getCameraMetaReprStr = (
  c: CameraMeta,
  opts?: {
    name?: string
    shotNumber?: number
    shotVersion?: number
    shotNumberUpdate?: number // incrase/decrase value
    shotVersionUpdate?: number // incrase/decrase value
  }
) => {
  let name = typeof opts?.name === 'undefined' ? c.name || '' : opts.name
  let shotNumber = opts?.shotNumber || c.shotNumber
  let shotVersion = opts?.shotVersion || c.shotVersion
  if (shotNumber) {
    shotNumber = opts?.shotNumberUpdate
      ? getCameraShotNumberUpdate(c, opts?.shotNumberUpdate || 0)
      : shotNumber
    shotVersion = opts?.shotVersionUpdate
      ? getCameraShotVersionUpdate(c, opts?.shotVersionUpdate || 0)
      : shotVersion
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
