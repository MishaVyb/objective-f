import {
  CameraIcon,
  CircleBackslashIcon,
  Cross1Icon,
  EnterIcon,
  ExitIcon,
  EyeClosedIcon,
  EyeOpenIcon,
  MinusIcon,
  PlusIcon,
  ReloadIcon,
} from '@radix-ui/react-icons'
import { getFormValue } from '../../../packages/excalidraw/actions/actionProperties'
import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { ExcalidrawElement } from '../../../packages/excalidraw/element/types'
import { getSelectedElements } from '../../../packages/excalidraw/scene'
import { newMetaReprElement } from '../elements/newElement'

import {
  getCameraMetas,
  getMetasCommonValue,
  getObjectiveSingleMeta,
  getSelectedCameraMetas,
} from '../meta/selectors'
import { CameraFormat, CameraMeta, isAllElementsCameras, isCameraElement } from '../meta/types'

import { register } from './register'
import { AppClassProperties } from '../../../packages/excalidraw/types'
import { Button, Code, Flex, IconButton, Select, Separator, Text } from '@radix-ui/themes'
import { handleMetaRepresentation } from '../elements/metaRepr'
import { mutateSelectedElsMeta } from '../elements/mutateElements'
import { duplicateElements } from '../../../packages/excalidraw/actions/actionDuplicateSelection'
import {
  degreesToRadian,
  ensureVector,
  getElementCenter,
  numberToStr,
  radianToDegrees,
} from '../elements/math'
import { getRadixColor } from '../UI/colors'
import { EasyInput } from '../UI/InputEasyIn'
import clsx from 'clsx'
import { getObjectiveRotationCenter } from '../elements/resizeElements'

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
        mutateSelectedElsMeta<CameraMeta>(app, newCameraShootProps)

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
          (c: CameraMeta) => getCameraMetaReprStr(c, { shotNumberUpdate: 1 }),
          newMetaReprElement
        )
        mutateSelectedElsMeta(app, (c: CameraMeta) => ({
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
        mutateSelectedElsMeta(app, (c: CameraMeta) => ({
          shotNumber: getCameraShotNumberUpdate(c, -1),
        }))
        break
    }

    return {
      elements: [...elements, ...newEls],
      appState:
        actionType === 'init' // open Shot List on `Add` button click
          ? { ...appState, openSidebar: { name: 'ShotList', tab: 'ShotList' } }
          : undefined,
      commitToHistory: true,
    }
  },

  PanelComponent: ({
    elements,
    appState,
    updateData,
    appProps,
    app,
  }: PanelComponentProps<TChangeShotActionValue>) => {
    if (!isAllElementsCameras(getSelectedElements(elements, appState))) return <></>
    const isShot = getFormValue<boolean>(
      elements,
      appState,
      (element) => (isCameraElement(element) ? element.customData.isShot : false) || false,
      true,
      false
    )
    const metas = getSelectedCameraMetas(app.scene, appState)
    const basisColor = getMetasCommonValue(metas, (m) => getRadixColor(m)) || 'gray'

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
            color={basisColor}
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
type TChangeVersionActionValue =
  | 'moveTo'
  | 'moveFrom'
  | 'rotateTo'
  | 'incraseShotVersion'
  | 'decraseShotVersion'

export const actionChangeMetaCameraVersion = register({
  name: 'actionChangeMetaCameraVersion',
  trackEvent: false,
  perform: (elements, appState, actionType: TChangeVersionActionValue, app: AppClassProperties) => {
    const cameras = getSelectedCameraMetas(app.scene, appState)
    const singleCamera = cameras[0]
    const basisCenter = getElementCenter(singleCamera.basis!)

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
            addPointerOverrides: { endArrowhead: 'triangle' },
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
            addPointerOverrides: { endArrowhead: 'triangle' },
            addPointerReverseDirection: true,
            newElementsMeta: { shotVersion: newCameraShotVers },
          }),
          commitToHistory: true,
        }
      case 'rotateTo':
        // TODO
        // if (!singleCamera.shotVersion) {
        //   newCameraShotVers = 2
        //   // RECURSIVE CALL
        //   elements = actionChangeMetaCameraVersion.perform(elements, appState, 'rotateTo', app)
        //     .elements!
        // } else {
        //   newCameraShotVers = singleCamera.shotVersion + 1
        // }
        // mutateSelectedElsMeta(app, {turnChildId: })
        return {
          ...duplicateElements(elements, appState, app, {
            shift: { x: 0, y: 0 },
            rotate: {
              center: ensureVector(
                getObjectiveRotationCenter(singleCamera, basisCenter.x, basisCenter.y)
              ),
              angle: degreesToRadian(10), // FIXME
            },
            newElementsMeta: {
              turnParentId: singleCamera.id,
              // shotVersion: newCameraShotVers, // FIXME
              nameRepr: undefined,
            },
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
        mutateSelectedElsMeta(app, (c: CameraMeta) => ({
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
        mutateSelectedElsMeta(app, (c: CameraMeta) => ({
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
        <legend>{isShot ? 'Shot version / Movement' : 'Movement'}</legend>

        <Flex gap={'1'}>
          {isShot ? (
            <>
              <IconButton
                size={'1'}
                variant={'soft'}
                color={'gray'}
                onClick={() => updateData('decraseShotVersion')}
                title={'Decrase shot version'}
              >
                <MinusIcon />
              </IconButton>
              <IconButton
                size={'1'}
                variant={'soft'}
                color={'gray'}
                onClick={() => updateData('incraseShotVersion')}
                title={'Incrase shot version'}
              >
                <PlusIcon />
              </IconButton>
            </>
          ) : null}
          {singleMeta && (
            <>
              <Button
                size={'1'}
                variant={'surface'}
                color={'gray'}
                onClick={() => updateData('moveFrom')}
                title={'Move camera from'}
              >
                {'From'}
                <EnterIcon />
              </Button>
              <Button
                size={'1'}
                variant={'surface'}
                color={'gray'}
                onClick={() => updateData('moveTo')}
                title={'Move camera to'}
              >
                <ExitIcon />
                {'To'}
              </Button>

              <Button
                size={'1'}
                variant={'surface'}
                color={'gray'}
                onClick={() => updateData('rotateTo')}
                title={'Move camera to'}
              >
                <ReloadIcon />
                {'Turn'}
              </Button>
            </>
          )}
        </Flex>
      </fieldset>
    )
  },
})

/** https://en.wikipedia.org/wiki/Image_sensor_format */
export const CAMERA_FORMATS: readonly CameraFormat[] = [
  {
    title: 'Super 8',
    description: 'Super 8 mm film frame',
    demensions: { x: 5.79, y: 4.01 },
  },
  {
    title: 'Super 16',
    description: 'Super 16 mm film frame',
    demensions: { x: 12.52, y: 7.41 },
  },
  {
    title: 'Micro Four Thirds',
    description: 'Micro Four Thirds ("4/3")',
    demensions: { x: 17.3, y: 13 },
  },
  {
    title: 'Super 35',
    description: 'Super 35mm film 4 perf',
    demensions: { x: 24.89, y: 18.66 },
    isDefault: true,
  },
  {
    title: 'Full Frame',
    description: '35 mm film',
    demensions: { x: 36, y: 24 },
  },
  {
    title: 'Standard 65/70',
    description: '65/70 mm film frame',
    demensions: { x: 52.48, y: 23.01 },
  },
]
export const getFormatDemensionStr = (f: CameraFormat) => ({
  x: numberToStr(f.demensions.x, { roundVal: [2, 1, 0], hideDecimalVal: false }),
  y: numberToStr(f.demensions.y, { roundVal: [2, 1, 0], hideDecimalVal: false }),
})

export const CAMERA_ASPECT_RATIOS = [
  2.39,
  2.35,
  2.0,
  1.85,
  1.77, // 16/9
  1.6, // 16 / 10
  1.33, // 4/3
  1.0,
]

export const DEFAULT_CAMERA_FORMAT = CAMERA_FORMATS.find((f) => f.isDefault)!
export const DEFAULT_FOCAL_LENGTH = 35 // mm
export const DEFAULT_FOCUS_DISTANCE = 300 // cm
export const DEFAULT_ASPECT_RATIO = 1.77

/** radian */
export const getCameraLensAngle = (c: CameraMeta) =>
  // AOV = 2arctan(d/2f)
  c.focalLength
    ? Math.atan((c.cameraFormat || DEFAULT_CAMERA_FORMAT)?.demensions.x / (2 * c.focalLength)) * 2
    : undefined

export const getCameraLensAngleDeg = (c: CameraMeta) =>
  radianToDegrees(getCameraLensAngle(c), { round: true })

type TChangeDetailsAction =
  | {
      newFocalLength?: number
      newFocusDistance?: number
      newCameraFormat?: string // title
      newAspectRatio?: string
      lensAngleRepr?: boolean
    }
  | 'discard'

export const actionChangeCameraDetails = register({
  name: 'actionChangeCameraDetails',
  trackEvent: false,
  perform: (elements, appState, action: TChangeDetailsAction, app) => {
    if (action === 'discard') {
      mutateSelectedElsMeta<CameraMeta>(app, {
        focalLength: undefined,
        focusDistance: undefined,
        cameraFormat: undefined,
        aspectRatio: undefined,
        lensAngleRepr: undefined,
      })
      return {
        elements: elements,
        commitToHistory: true,
      }
    }
    if (action.newFocalLength)
      mutateSelectedElsMeta<CameraMeta>(app, { focalLength: action.newFocalLength })
    if (action.newFocusDistance)
      mutateSelectedElsMeta<CameraMeta>(app, { focusDistance: action.newFocusDistance })
    if (action.lensAngleRepr !== undefined)
      mutateSelectedElsMeta<CameraMeta>(app, { lensAngleRepr: action.lensAngleRepr })

    if (action.newCameraFormat) {
      // TODO custom
      mutateSelectedElsMeta<CameraMeta>(app, {
        cameraFormat: CAMERA_FORMATS.find((v) => v.title === action.newCameraFormat),
      })
    }

    if (action.newAspectRatio) {
      let aspectRatio
      if (action.newAspectRatio === 'Custom') aspectRatio = undefined // TODO
      else if (action.newAspectRatio === 'Disable') aspectRatio = undefined
      else aspectRatio = Number(action.newAspectRatio)

      mutateSelectedElsMeta<CameraMeta>(app, { aspectRatio })
    }

    return {
      elements: elements,
      commitToHistory: true,
    }
  },

  PanelComponent: ({
    elements,
    appState,
    updateData,
    appProps,
    app,
  }: PanelComponentProps<TChangeDetailsAction>) => {
    const metas = getSelectedCameraMetas(app.scene, appState)

    const focalLen = getMetasCommonValue<number, CameraMeta>(metas, 'focalLength')
    const focusDistance = getMetasCommonValue<number, CameraMeta>(metas, 'focusDistance')
    const angle = getMetasCommonValue(metas, (m) => getCameraLensAngleDeg(m))
    const color = getMetasCommonValue(metas, (m) => getRadixColor(m)) || 'gray'
    const format = getMetasCommonValue<CameraFormat, CameraMeta>(metas, 'cameraFormat')
    const formatDefault = format || DEFAULT_CAMERA_FORMAT
    const aspectRatio = getMetasCommonValue<number, CameraMeta>(metas, 'aspectRatio')
    const lensAngleRepr = getMetasCommonValue(metas, 'lensAngleRepr', false)
    const isDiscardable = metas.some(
      (m) => m.focalLength || m.focusDistance || m.cameraFormat || m.aspectRatio
    )

    const onEyeButtonClick = () =>
      updateData({
        lensAngleRepr: !lensAngleRepr,
        newFocalLength: focalLen ? undefined : DEFAULT_FOCAL_LENGTH, // apply default, if not
      })

    const onFocalLenChange = (v: number) =>
      updateData({
        newFocalLength: v,
        lensAngleRepr: focalLen ? undefined : true, // set default
      })
    const onDistanceChange = (v: number) =>
      updateData({
        newFocusDistance: v,
        newFocalLength: focusDistance ? undefined : DEFAULT_FOCAL_LENGTH, // set default
        lensAngleRepr: focusDistance ? undefined : true, // set default
      })

    return (
      <fieldset>
        {/* <legend>{'Specification'}</legend> */}
        <Separator size={'4'} />
        <label className='control-label'>
          <Flex display={'flex'} gap={'1'} justify={'between'} m={'2'}>
            <Select.Root
              size={'1'}
              value={format?.title === undefined ? '' : format?.title}
              // defaultValue={DEFAULT_CAMERA_FORMAT.title}
              onValueChange={(v) => updateData({ newCameraFormat: v })}
            >
              {/* @ts-ignore */}
              <Select.Trigger title={'Camera format'} placeholder='Format' variant='ghost' />
              <Select.Content>
                <Select.Group>
                  <Select.Label>{'Pick camera format'}</Select.Label>
                  <Select.Separator />
                  {CAMERA_FORMATS.map((f) => (
                    <Flex key={f.title} justify={'between'} align={'baseline'}>
                      <Select.Item
                        title={f.description}
                        value={f.title}
                        className={'objective-select-item'}
                      >
                        {f.title}{' '}
                      </Select.Item>
                      <Text color={'gray'} size={'1'} weight={'light'}>
                        <Code size={'1'}>{getFormatDemensionStr(f).x}</Code>
                        {'x'}
                        <Code size={'1'}>{getFormatDemensionStr(f).y}</Code>
                      </Text>
                    </Flex>
                  ))}
                </Select.Group>
                <Select.Separator />
                <Select.Group>
                  <Select.Item value='Custom' disabled>
                    Custom
                  </Select.Item>
                  {/* <Select.Item value='Disable'>Disable</Select.Item> */}
                </Select.Group>
              </Select.Content>
            </Select.Root>
            <Select.Root
              size={'1'}
              value={aspectRatio === undefined ? '' : String(aspectRatio)}
              // defaultValue={String(DEFAULT_ASPECT_RATIO)}
              onValueChange={(v) => updateData({ newAspectRatio: v })}
            >
              <Select.Trigger
                title={'Aspect ratio'}
                // @ts-ignore
                placeholder={'Aspect Ratio'}
                variant='ghost'
                style={{ maxWidth: (format?.title.length || 0) < 12 ? 150 : 50 }} // TMP use Flex shrink / grow
                ml={'3'}
                mr={'2'}
              />
              <Select.Content>
                <Select.Group>
                  <Select.Label>{'Pick aspect ratio'}</Select.Label>
                  <Select.Separator />
                  {CAMERA_ASPECT_RATIOS.map((r) => (
                    <Select.Item key={r} value={String(r)} className={'objective-select-item'}>
                      {numberToStr(r)}
                    </Select.Item>
                  ))}
                </Select.Group>
                <Select.Separator />
                <Select.Group>
                  <Select.Item value='Custom' disabled>
                    Custom
                  </Select.Item>
                  {/* <Select.Item value='Disable'>Disable</Select.Item> */}
                </Select.Group>
              </Select.Content>
            </Select.Root>

            <Flex gap={'2'}>
              <IconButton
                size={'1'}
                variant={'ghost'}
                color={'gray'}
                onClick={onEyeButtonClick}
                title={lensAngleRepr ? 'Hide lens angle' : 'Show lens angle'}
              >
                {lensAngleRepr ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </IconButton>
              {isDiscardable && (
                <IconButton
                  title={'Discard settings'}
                  size={'1'}
                  variant={'ghost'}
                  color={'gray'}
                  onClick={() => updateData('discard')}
                >
                  <Cross1Icon />
                </IconButton>
              )}
            </Flex>
          </Flex>
          <Flex align={'baseline'} justify={'between'} gap={'1'}>
            {'Focal length'}
            <Code
              className={clsx({ hidden: !focalLen })}
              style={{ marginLeft: 'auto' }}
              title={`Regarding ${formatDefault?.title} format`}
              size={'1'}
              weight={'bold'}
              color={color}
            >{`${focalLen}mm`}</Code>
            <Code
              className={clsx({ hidden: !focalLen })}
              title={'Horizontal angle'}
              size={'1'}
              color={'gray'}
              variant={'ghost'}
              weight={'light'} //
            >{`${angle}˚`}</Code>
          </Flex>
          <EasyInput
            min={5}
            max={200}
            powerCof={1}
            onChange={onFocalLenChange}
            value={focalLen !== undefined ? focalLen : DEFAULT_FOCAL_LENGTH}
          />
          <Flex align={'baseline'} justify={'between'} gap={'1'}>
            {'Focus distance'}
            <Code
              className={clsx({ hidden: !focusDistance })}
              title={`Distance`}
              style={{ marginLeft: 'auto' }}
              size={'1'}
              weight={'bold'}
              color={color}
            >
              {numberToStr(focusDistance! / 100, { unit: 'm' })}
            </Code>
          </Flex>
          <EasyInput
            min={0}
            max={1600}
            onChange={onDistanceChange}
            value={focusDistance !== undefined ? focusDistance : DEFAULT_FOCUS_DISTANCE}
          />
        </label>
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
      shotVersion: undefined,
    }
  }

  return {
    isShot: false,
    shotNumber: undefined,
    shotVersion: undefined,
  }
}
