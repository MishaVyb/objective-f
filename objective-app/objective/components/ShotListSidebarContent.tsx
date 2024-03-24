import { FC } from 'react'

import { useObjectiveCameras } from './ObjectiveInnerWrapper'
import { useApp, useExcalidrawSetAppState } from '../../../packages/excalidraw/components/App'
import { getObjectiveBasis, getSelectedCameraMetas, useCameraImages } from '../meta/selectors'
import { CameraMeta } from '../meta/types'
import * as Collapsible from '@radix-ui/react-collapsible'
import { CaretDownIcon, CaretRightIcon } from '@radix-ui/react-icons'

import React from 'react'
import { Badge, Flex, Text } from '@radix-ui/themes'
import { getCameraMetaReprStr } from '../actions/actionCamera'
import clsx from 'clsx'

const ShotListSidebarContent: FC = () => {
  const app = useApp()
  const cameras = useObjectiveCameras().filter((c) => c.isShot)
  const selectedCameras = getSelectedCameraMetas(app.scene, app.state)
  const selectedCamera = selectedCameras.length === 1 ? selectedCameras[0] : null

  return (
    <Flex className={'objective-cameras-list'} direction={'column'} gap={'1'} m={'1'}>
      {cameras.map((camera, i) => (
        // TODO add internal meta.cameraKey attribute to handle cameras manual ordering
        <ShotListSidebarCameraElement
          key={i}
          camera={camera}
          isSelected={camera.id === selectedCamera?.id}
        />
      ))}
    </Flex>
  )
}

const ShotListSidebarCameraElement: FC<{ camera: CameraMeta; isSelected: boolean }> = (props) => {
  const [open, setOpen] = React.useState(false)

  const setAppState = useExcalidrawSetAppState()

  const images = useCameraImages(props.camera)

  const onClick = () => {
    setAppState({
      selectedElementIds: Object.fromEntries(props.camera.elementIds.map((id) => [id, true])),
      selectedGroupIds: { [props.camera.id]: true },
      editingGroupId: null,
    })
  }

  return (
    <Collapsible.Root className='CollapsibleRoot' open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <Flex
          className={clsx('toggled-item', { toggled: props.isSelected })}
          // style={{ width: '100%' }}
          // m={'1'}
          align={'baseline'}
          onClick={() => onClick()}
        >
          <Badge
            style={{ background: getObjectiveBasis(props.camera)!.backgroundColor + '40' }}
            color={'gray'}
            m={'2'}
          >
            {getCameraMetaReprStr(props.camera, { name: '' })}
          </Badge>
          <Text className='objective-camera-label' size={'2'}>
            {props.camera.name}
          </Text>
          <div style={{ marginLeft: 'auto', marginRight: 10 }}>
            {open ? <CaretDownIcon /> : <CaretRightIcon />}
          </div>
        </Flex>
      </Collapsible.Trigger>

      <Collapsible.Content>
        <Text>CONTENT</Text>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

export default ShotListSidebarContent
