import clsx from 'clsx'

import { PanelComponentProps } from '../../../packages/excalidraw/actions/types'
import { useDevice } from '../../../packages/excalidraw/components/App'
import { unbindLinearElements } from '../../../packages/excalidraw/element/binding'
import {
  ExcalidrawElement,
  ExcalidrawEllipseElement,
  ExcalidrawEmbeddableElement,
  ExcalidrawImageElement,
} from '../../../packages/excalidraw/element/types'
import { getSelectedElements } from '../../../packages/excalidraw/scene'
import { AppClassProperties } from '../../../packages/excalidraw/types'
import { POINTER_COMMON, newPointerBeetween } from '../elements/_newElementObjectiveConstructors'
import {
  getObjectiveBasis,
  getCameraMetas,
  getShotCameraMetas,
  getPointers,
  getMetaByObjectiveId,
} from '../meta/_selectors'
import {
  CameraMeta,
  ObjectiveImageElement,
  isDisplayed,
  isImageRelatedToCamera,
} from '../meta/_types'
import { deleteEventHandler } from '../elements/_deleteElements'

import { register } from './register'
import { Button, Flex, IconButton, Popover, Separator, Text } from '@radix-ui/themes'
import { CameraIcon, CircleBackslashIcon, EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons'
import { ImageIcon, TrashIcon } from '../../../packages/excalidraw/components/icons'
import { mutateMeta } from '../elements/_mutateElements'
import { arrangeElements } from '../elements/_zIndex'
import { CameraBadge } from '../components/ShotListSidebarContent'
import { useCamerasImages } from '../meta/_hooks'
import { mutateElement } from '../../../packages/excalidraw'

export const actionInitStoryboard = register({
  name: 'actionInitStoryboard',
  trackEvent: false,
  perform: (
    elements,
    appState,
    payload: {
      camera: CameraMeta | CameraMeta['id']
      image: ExcalidrawImageElement
      handlePointer: boolean
    },
    app
  ) => {
    let camera: CameraMeta
    if (typeof payload.camera === 'string') {
      camera = getMetaByObjectiveId(elements, payload.camera) as CameraMeta
      if (!camera) return false
    } else {
      camera = payload.camera
    }

    const newEls: ExcalidrawElement[] = []

    // const images = getSelectedElements(elements, appState)
    // if (images.length !== 1) return false
    const image = payload.image as ExcalidrawImageElement

    const cameraBasis = getObjectiveBasis<ExcalidrawEmbeddableElement>(camera)
    if (!cameraBasis) return false

    const action = camera.relatedImages.includes(image.id) ? 'unlink' : 'link'
    const pointers = getPointers(app.scene.getNonDeletedElementsMap(), image, cameraBasis)
    const pointer = pointers[0] // TODO handle many pointers

    if (action === 'unlink') {
      if (pointer) {
        // [1.1] unbind and delete
        unbindLinearElements([pointer])
        mutateElement(pointer, { isDeleted: true })
      }
      // [1.2] unlink
      mutateMeta(camera, {
        relatedImages: [...camera.relatedImages].filter((id) => id !== image.id), // remove prev
      })
    } else {
      // create pointer
      if (payload.handlePointer) {
        const newPointer = newPointerBeetween(
          image,
          cameraBasis,
          app.scene.getNonDeletedElementsMap(),
          { subkind: 'storyboardPointer' }
        )
        if (newPointer) newEls.push(newPointer)
      }

      // link
      mutateMeta(camera, { relatedImages: [...camera.relatedImages, image.id] })
    }

    return {
      elements: newEls.length ? arrangeElements(elements, newEls) : elements,
      commitToHistory: true,
    }
  },
  PanelComponent: ({ elements, appState, updateData, appProps }: PanelComponentProps) => {
    const images = getSelectedElements(elements, appState)
    if (images.length !== 1) return <></>
    const image = images[0] as ExcalidrawImageElement

    const cameras = getShotCameraMetas(elements)
    const device = useDevice()

    const onClick = (camera: CameraMeta) => {
      updateData({ camera, image, handlePointer: true })
    }

    return (
      <Popover.Root>
        <Popover.Trigger>
          <Button color={'gray'} variant='soft' disabled={!cameras.length}>
            <CameraIcon />
            {'Storyboard'}
          </Button>
        </Popover.Trigger>
        <Popover.Content
          side={device.viewport.isMobile && !device.viewport.isLandscape ? 'bottom' : 'right'}
          align={device.viewport.isMobile && !device.viewport.isLandscape ? 'center' : 'start'}
          alignOffset={-10}
          sideOffset={20}
        >
          <Flex
            direction={'column'}
            className={'objective-cameras-list'}
            style={{
              minHeight: 150,
              maxHeight: 430,
              overflowY: 'scroll',
            }}
          >
            {cameras.map((camera, index) => (
              <div
                key={index}
                className={clsx('toggled-item', { toggled: isImageRelatedToCamera(camera, image) })}
                onClick={() => onClick(camera)}
              >
                <Flex m={'2'} style={{ width: '100%' }}>
                  <CameraBadge camera={camera} />
                  <Text className='objective-camera-label' ml={'2'} size={'1'}>
                    {camera.name}
                  </Text>
                </Flex>
              </div>
            ))}
          </Flex>
        </Popover.Content>
      </Popover.Root>
    )
  },
})

interface IPerformValue {
  camera: CameraMeta
  imageRef: ObjectiveImageElement // not current scene element, because it's taken for useMemo hook
  action: 'display' | 'unlink' | 'remove'
}

export const actionStoryboard = register({
  name: 'actionStoryboard',
  trackEvent: false,
  perform: (
    elements,
    appState,
    { camera, imageRef, action }: IPerformValue,
    app: AppClassProperties
  ) => {
    const image = app.scene.getNonDeletedElementsMap().get(imageRef.id)! as ExcalidrawImageElement
    const cameraBasis = getObjectiveBasis<ExcalidrawEllipseElement>(camera)
    const pointers = getPointers(app.scene.getNonDeletedElementsMap(), image, cameraBasis)
    const pointer = pointers[0] // TODO handle many pointers
    const displayed = isDisplayed(image)

    const otherCamerasRelatedToImage = app.scene.oScene
      .getCamerasRelatedToImage(image.id)
      .filter((c) => c.id !== camera.id)

    switch (action) {
      case 'display':
        // [1] change display for pointer
        if (pointer)
          mutateElement(pointer, {
            opacity: displayed ? 0 : POINTER_COMMON().opacity,
            locked: displayed,
          })
        // [2] change display for image
        mutateElement(image, {
          opacity: displayed ? 0 : 100,
          locked: displayed,
        })
        // [3] change display for other pointers
        otherCamerasRelatedToImage.forEach((camera) => {
          const cameraBasis = getObjectiveBasis<ExcalidrawEllipseElement>(camera)
          const pointers = getPointers(app.scene.getNonDeletedElementsMap(), image, cameraBasis)
          const pointer = pointers[0] // TODO handle many pointers

          if (pointer)
            mutateElement(pointer, {
              opacity: displayed ? 0 : POINTER_COMMON().opacity,
              locked: displayed,
            })
        })
        break
      case 'unlink':
        // [1] remove target image in related camera images
        mutateMeta(camera, {
          relatedImages: camera.relatedImages.filter((id) => id !== image.id),
        })
        // [2] remove pointer
        if (pointer)
          mutateElement(pointer, {
            isDeleted: true,
          })
        // [3] make target image visible, if not
        mutateElement(image, {
          opacity: displayed ? image.opacity : 100,
          locked: displayed ? image.locked : false,
        })
        break
      case 'remove':
        // [1] remove image
        deleteEventHandler([image])
        break
    }
    return { commitToHistory: true } // no need to return `elements` as mutate directly at Scene
  },
  PanelComponent: ({
    elements,
    appState,
    updateData,
    appProps,
    app,
  }: PanelComponentProps<IPerformValue>) => {
    const cameras = getCameraMetas(getSelectedElements(elements, appState))
    const images = useCamerasImages(cameras)

    if (cameras.length !== 1) return <></> // supports only for single camera selection
    const camera = cameras[0]

    const onAddImageClick = () => {
      app.setActiveTool({
        type: 'image',
        insertOnCanvasDirectly: false, // let user decide where to put this image
        asStoryboardForCamera: camera.id,
      })
    }

    return (
      <div className='storyboard-images'>
        <Separator size={'4'} mb={'2'} />
        <legend>{'Storyboard'}</legend>

        {images.length ? (
          images.map((image) => (
            <fieldset key={image.id}>
              <img style={{ width: '100%', marginTop: 5 }} src={image.dataURL} alt='' />

              <Flex gap={'1'}>
                <IconButton
                  size={'2'}
                  variant={'surface'}
                  color={'gray'}
                  onClick={() => onAddImageClick()}
                  title={'Add another image'}
                >
                  <div className='ToolIcon__icon'>{ImageIcon}</div>
                </IconButton>

                <IconButton
                  size={'2'}
                  variant={'outline'}
                  color={'red'}
                  onClick={() => updateData({ camera, imageRef: image, action: 'unlink' })}
                  title={'Remove image from storyboard'}
                >
                  <CircleBackslashIcon />
                </IconButton>

                <IconButton
                  size={'2'}
                  variant={'outline'}
                  color={'gray'}
                  highContrast
                  onClick={() => updateData({ camera, imageRef: image, action: 'remove' })}
                  title={'Delete image'}
                >
                  <div className='ToolIcon__icon'>{TrashIcon}</div>
                </IconButton>

                <IconButton
                  size={'2'}
                  variant={'soft'}
                  color={'gray'}
                  onClick={() => updateData({ camera, imageRef: image, action: 'display' })}
                  title={isDisplayed(image) ? 'Hide image on canvas' : 'Show image on canvas'}
                >
                  {isDisplayed(image) ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </IconButton>
              </Flex>
            </fieldset>
          ))
        ) : (
          <Button
            size={'2'}
            style={{
              // HACK fix not native Excalidraw icon inside Radix button
              paddingLeft: 5,
              gap: 0,
            }}
            variant={'surface'}
            color={'gray'}
            onClick={() => onAddImageClick()}
            title={'Add image frame'}
          >
            <div className='ToolIcon__icon'>{ImageIcon}</div>
            <Text
              style={{
                paddingLeft: -10,
              }}
            >
              {'Add'}
            </Text>
          </Button>
        )}
      </div>
    )
  },
})
