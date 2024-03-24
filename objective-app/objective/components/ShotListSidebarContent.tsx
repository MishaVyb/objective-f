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
import { CaretDownIcon, CaretRightIcon, PlusIcon } from '@radix-ui/react-icons'

import React from 'react'
import { Badge, Flex, IconButton, Separator, Text } from '@radix-ui/themes'
import { actionChangeMetaCameraShot, getCameraMetaReprStr } from '../actions/actionCamera'
import clsx from 'clsx'
import { HEX_TO_COLOR, TBadgeProps, isRadixColor } from '../UI/colors'
import { groupBy } from '../utils/helpers'
import { distributeLibraryItemsOnSquareGrid } from '../../../packages/excalidraw/data/library'
import { LIB_CAMERAS } from '../lib/cameras.library'
import { mutateElementMeta, mutateMeta, mutateSelectedElsMeta } from '../elements/mutateElements'

const ShotListSidebarContent: FC = () => {
  const app = useApp()
  const appState = useExcalidrawAppState()
  const cameras = useObjectiveCameras().filter((c) => c.isShot)
  const groupCameras = groupBy(cameras, 'shotNumber')
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
      {[...groupCameras.entries()].map(([key, cameras], i) => {
        return (
          <div key={key}>
            {cameras.map((camera, i) => (
              <ShotListSidebarCameraElement
                key={i}
                camera={camera}
                isSelected={camera.id === selectedCamera?.id}
              />
            ))}
            <Separator size={'4'} />
          </div>
        )
      })}
      <AddCameraButton />
    </Flex>
  )
}

export const CameraBadge: FC<{ camera: CameraMeta } & TBadgeProps> = (props) => {
  const basis = getObjectiveBasis(props.camera)!
  const color = HEX_TO_COLOR.get(basis.backgroundColor)

  // HACK name: '' as we render name at separate component
  const cameraNumberAndVer = getCameraMetaReprStr(props.camera, { name: '' })

  if (color && isRadixColor(color))
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

const AddCameraButton = () => {
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
      style={{
        marginTop: 'auto',
        marginBottom: 10,
      }}
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

  const setAppState = useExcalidrawSetAppState()
  const images = useCameraImages(props.camera)

  const selectCamera = () => {
    if (!open) setOpen(true)
    setAppState({
      selectedElementIds: Object.fromEntries(props.camera.elementIds.map((id) => [id, true])),
      selectedGroupIds: { [props.camera.id]: true },
      editingGroupId: null,
    })
  }

  return (
    <Collapsible.Root className='CollapsibleRoot' open={open} onOpenChange={setOpen}>
      <Flex
        className={clsx('toggled-item-soft', { toggled: props.isSelected })}
        align={'baseline'}
        onClick={() => selectCamera()}
      >
        <CameraBadge camera={props.camera} m={'2'} />
        <Text className='objective-camera-label' size={'2'}>
          {props.camera.name}
        </Text>

        <Collapsible.Trigger
          asChild
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <IconButton
            style={{ marginLeft: 'auto', marginRight: 10 }}
            variant={'outline'}
            color={'gray'}
            size={'1'}
            mt={'2'}
          >
            {open ? <CaretDownIcon /> : <CaretRightIcon />}
          </IconButton>
        </Collapsible.Trigger>
      </Flex>

      <Collapsible.Content>
        <Flex direction={'column'}>
          {/* TODO camera format && focal len && aspect ratio */}
          {/* TODO images */}
          {images.map((image) => (
            <img key={image.id} src={image.dataURL} alt='' />
          ))}
          {/* TODO desc */}
        </Flex>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

export default ShotListSidebarContent
