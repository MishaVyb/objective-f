import { FC } from 'react'

import { useObjectiveCameras } from './ObjectiveInnerWrapper'
import {
  useApp,
  useExcalidrawAppState,
  useExcalidrawSetAppState,
} from '../../../packages/excalidraw/components/App'
import { getObjectiveBasis, getSelectedCameraMetas, useCameraImages } from '../meta/selectors'
import { CameraElement, CameraMeta } from '../meta/types'
import * as Collapsible from '@radix-ui/react-collapsible'
import {
  AngleIcon,
  CaretDownIcon,
  CaretRightIcon,
  CropIcon,
  MarginIcon,
  PlusIcon,
  WidthIcon,
} from '@radix-ui/react-icons'

import React from 'react'
import { Badge, Code, Flex, IconButton, Separator, Text } from '@radix-ui/themes'
import {
  actionChangeMetaCameraShot,
  getCameraMetaReprStr,
  getFormatDemensionStr,
} from '../actions/actionCamera'
import clsx from 'clsx'
import { TBadgeProps, getRadixColor } from '../UI/colors'
import { groupBy } from '../utils/helpers'
import { distributeLibraryItemsOnSquareGrid } from '../../../packages/excalidraw/data/library'
import { LIB_CAMERAS } from '../lib/cameras.library'
import { numberToStr } from '../elements/math'

const ShotListSidebarContent: FC = () => {
  const app = useApp()
  const appState = useExcalidrawAppState()
  const cameras = useObjectiveCameras().filter((c) => c.isShot)
  const groupCameras = [...groupBy(cameras, 'shotNumber').entries()]
  const selectedCameras = getSelectedCameraMetas(app.scene, appState)
  const selectedCamera = selectedCameras.length === 1 ? selectedCameras[0] : null

  // TODO ??? add internal meta.cameraKey attribute to handle cameras manual ordering
  return (
    <Flex
      className={'objective-cameras-list'}
      direction={'column'}
      gap={'1'}
      m={'1'}
      style={{ height: '100%', overflowY: 'scroll' }}
    >
      {/* TODO CONTROLS
        -- select All Cameras
        -- collapse all collapsible
        -- re-order ???

      */}
      {groupCameras.map(([key, cameras], i) => {
        return (
          <div key={key}>
            {cameras.map((camera, i) => (
              <ShotListSidebarCameraElement
                key={i}
                camera={camera}
                isSelected={camera.id === selectedCamera?.id}
              />
            ))}
            {i === groupCameras.length - 1 ? null : <Separator size={'4'} />}
          </div>
        )
      })}
      <AddCameraButton
        style={{
          marginTop: cameras.length ? 'auto' : 10,
          marginBottom: 10,
        }}
      />
    </Flex>
  )
}

export const CameraBadge: FC<{ camera: CameraMeta } & TBadgeProps> = (props) => {
  const basis = getObjectiveBasis(props.camera)!
  const color = getRadixColor(props.camera)

  // HACK name: '' as we render name at separate component
  const cameraNumberAndVer = getCameraMetaReprStr(props.camera, { name: '' })

  if (color)
    return (
      <Badge color={color} {...props}>
        {cameraNumberAndVer}
      </Badge>
    )

  const opacity = '40' // from 00 to FF
  const fallbacksToColor = basis!.backgroundColor + opacity
  return (
    <Badge style={{ background: fallbacksToColor }} color={'gray'} {...props}>
      {cameraNumberAndVer}
    </Badge>
  )
}

const AddCameraButton: FC<{ style: any }> = ({ style }) => {
  const app = useApp()
  const onClick = () => {
    // TODO use las user choses via
    // - appState.currentCameraColor...
    // - appState.currentCameraFormat / ratio
    const els = distributeLibraryItemsOnSquareGrid([LIB_CAMERAS[0]]) as CameraElement[]
    app.onInsertElements(els)

    setTimeout(
      () => app.actionManager.executeAction(actionChangeMetaCameraShot, 'internal', 'init'),
      0
    )
  }

  return (
    <Flex
      className={clsx('toggled-item', { border: true })}
      align={'baseline'}
      justify={'center'}
      style={style}
      onClick={() => onClick()}
    >
      <PlusIcon />
      <Text
        className='objective-camera-label'
        size={'2'}
        ml={'1'}
        mt={'3'}
        mb={'3'}
        color={'gray'}
        align={'center'}
      >
        {'Add'}
      </Text>
    </Flex>
  )
}

const ShotListSidebarCameraElement: FC<{ camera: CameraMeta; isSelected: boolean }> = (props) => {
  const [open, setOpen] = React.useState(false)
  const { camera } = props

  const setAppState = useExcalidrawSetAppState()
  const images = useCameraImages(camera)
  const hasCollapseableProperties =
    images.length || camera.focusDistance || camera.aspectRatio || camera.description
  const realOpen = !!hasCollapseableProperties && open
  const formatStr = camera.cameraFormat && getFormatDemensionStr(camera.cameraFormat)

  const selectCamera = () => {
    if (!open) setOpen(true)
    setAppState({
      selectedElementIds: Object.fromEntries(camera.elementIds.map((id) => [id, true])),
      selectedGroupIds: { [camera.id]: true },
      editingGroupId: null,
    })
  }

  return (
    <Collapsible.Root className='CollapsibleRoot' open={realOpen} onOpenChange={setOpen}>
      <Flex
        className={clsx('toggled-item-soft', { toggled: props.isSelected })}
        align={'center'}
        onClick={() => selectCamera()}
      >
        <CameraBadge camera={camera} m={'2'} />

        <Text className='objective-camera-label' size={'2'}>
          {camera.name}
        </Text>

        <Flex style={{ marginLeft: 'auto', marginRight: 10 }} align={'center'}>
          {!realOpen && camera.focalLength && (
            <Code color={'gray'} size={'1'} mr={hasCollapseableProperties ? '3' : '5'}>
              {camera.focalLength}
              {'mm'}
            </Code>
          )}
          {hasCollapseableProperties && (
            <Collapsible.Trigger
              asChild
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <IconButton variant={'ghost'} color={'gray'} size={'2'}>
                {realOpen ? <CaretDownIcon /> : <CaretRightIcon />}
              </IconButton>
            </Collapsible.Trigger>
          )}
        </Flex>
      </Flex>

      <Collapsible.Content>
        <Flex direction={'column'} ml={'2'} mr={'2'} mt={'1'} height={'max-content'}>
          <Flex gap={'1'} justify={'start'}>
            {camera.cameraFormat && (
              <Flex
                title={`${camera.cameraFormat.description} — ${formatStr!.x} x ${formatStr!.y}`}
                align={'center'}
                gap={'1'}
              >
                <MarginIcon />
                <Text color={'gray'} size={'1'}>
                  {camera.cameraFormat.title}
                </Text>
              </Flex>
            )}
            {camera.cameraFormat && camera.aspectRatio && (
              <Separator orientation={'vertical'} m={'2'} />
            )}
            {camera.aspectRatio && (
              <Flex title={'Aspect ratio'} align={'center'} gap={'1'}>
                <CropIcon />
                <Text color={'gray'} size={'1'}>
                  {numberToStr(camera.aspectRatio)}
                </Text>
              </Flex>
            )}
          </Flex>
          <Flex gap={'1'} justify={'start'}>
            {camera.focalLength && (
              <Flex title={'Focal length'} align={'center'} gap={'1'}>
                <AngleIcon />
                <Text color={'gray'} size={'1'}>
                  {numberToStr(camera.focalLength, { unit: 'mm' })}
                </Text>
              </Flex>
            )}
            {camera.focalLength && camera.focusDistance && (
              <Separator orientation={'vertical'} m={'2'} />
            )}
            {camera.focusDistance && (
              <Flex title={'Focus line distance'} align={'center'} gap={'1'}>
                <WidthIcon />
                <Text color={'gray'} size={'1'}>
                  {numberToStr(camera.focusDistance, { unit: 'm' })}
                </Text>
              </Flex>
            )}
          </Flex>
          {images.map((image) => (
            <img style={{ marginBottom: 5 }} key={image.id} src={image.dataURL} alt='' />
          ))}
          {/* TODO desc */}
          <Text title={'Description'}>{camera.description}</Text>
        </Flex>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

export default ShotListSidebarContent
