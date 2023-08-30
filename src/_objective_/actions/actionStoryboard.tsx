import * as Popover from '@radix-ui/react-popover'
import clsx from 'clsx'
import { logger } from 'workbox-core/_private'

import { PanelComponentProps } from '../../actions/types'
import { useDevice } from '../../components/App'
import { ToolButton } from '../../components/ToolButton'
import { newLinearElement } from '../../element'
import { bindLinearElement, unbindLinearElements, updateBoundElements } from '../../element/binding'
import {
  ExcalidrawBindableElement,
  ExcalidrawElement,
  ExcalidrawImageElement,
  ExcalidrawLinearElement,
  NonDeleted,
} from '../../element/types'
import { getSelectedElements } from '../../scene'
import { AppState } from '../../types'
import { newMockPointer, newPointerBeetween } from '../objects/primitives'
import '../scss/cameraItem.scss'
import '../scss/popover.scss'
import {
  getCameraMetas,
  getElementById,
  getPointerBetween,
  getShotCameraMetas,
  useCamerasImages,
} from '../selectors/selectors'
import {
  CameraMeta,
  ObjectiveImageElement,
  ObjectiveKinds,
  isDisplayed,
  isImageRelatedToCamera,
} from '../types/types'
import './../scss/actionStoryboard.scss'
import { changeElementMeta, changeElementProperty } from './helpers'
import { register } from './register'

/**
 * NOTE: No checking is selected element is image or not.
 * Because of action context we are already expecting that only images are selected.
 */
const getSelectedImage = (elements: readonly ExcalidrawElement[], appState: AppState) => {
  const images = getSelectedElements(elements, appState)
  if (images.length !== 1) throw Error('Not Implemented!')
  return images[0] as ExcalidrawImageElement
}

export const actionInitStoryboard = register({
  name: 'actionInitStoryboard',
  trackEvent: false,

  /**
   *
   * @param elements *ALL* canvas elements, including deleted!
   */
  perform: (elements, appState, camera: CameraMeta) => {
    const image = getSelectedImage(elements, appState)
    const cameraBasis = getElementById(elements, camera.elementIds[0]) as ExcalidrawBindableElement // camera circle
    const action = camera.relatedImages.includes(image.id) ? 'unlink' : 'link'
    const pointer = getPointerBetween(elements, image, cameraBasis)

    if (action === 'unlink') {
      if (pointer) {
        // [1.1] unbind and delete
        unbindLinearElements([pointer])
        elements = changeElementProperty(elements, pointer, { isDeleted: true })
      }
      // [1.2] unlink
      elements = changeElementMeta(elements, camera, {
        relatedImages: [...camera.relatedImages].filter((id) => id !== image.id), // remove prev
      })
    } else {
      if (pointer) {
        logger.error('Camera and related Image are not linked, but have pointer already!')
        return false
      }

      // [2] Create pointer and link
      elements = changeElementMeta(
        elements,
        camera,
        {
          relatedImages: [...camera.relatedImages, image.id], // add new link
        },
        [newPointerBeetween(image, cameraBasis)] // add new pointer
      )
    }

    return {
      elements: elements,
      commitToHistory: true,
    }
  },
  PanelComponent: ({ elements, appState, updateData, appProps }: PanelComponentProps) => {
    const image = getSelectedImage(elements, appState)
    const cameras = getShotCameraMetas(elements)
    const { isMobile, isLandscape } = useDevice()

    const onClick = (camera: CameraMeta) => {
      updateData(camera)
    }

    return (
      <>
        <Popover.Root>
          <Popover.Trigger className={clsx('popover-trigger__button')}>
            {'As storyboard ...'}
          </Popover.Trigger>
          <Popover.Content
            className='popover-content'
            side={isMobile && !isLandscape ? 'bottom' : 'right'}
            align={isMobile && !isLandscape ? 'center' : 'start'}
            alignOffset={-16}
            sideOffset={20}
          >
            {cameras.map((camera, index) => (
              <div
                className={clsx('camera-item', { active: isImageRelatedToCamera(camera, image) })}
                key={index}
                onClick={() => onClick(camera)}
              >
                <div className='shot-number'>{camera.shotNumber}</div>
                <div className='name'>{camera.name}</div>
              </div>
            ))}
          </Popover.Content>
        </Popover.Root>
      </>
    )
  },
})

interface IPerformValue {
  camera: CameraMeta
  image: ObjectiveImageElement
  action: 'display' | 'unlink' | 'remove'
}

export const actionStoryboard = register({
  name: 'actionStoryboard',
  trackEvent: false,
  perform: (elements, appState, { camera, image, action }: IPerformValue) => {
    switch (action) {
      case 'display':
        elements = changeElementProperty(elements, image, {
          opacity: isDisplayed(image) ? 0 : 100,
          locked: isDisplayed(image),
        })
        break
      case 'unlink':
        // [1] remove target image in related camera images
        elements = changeElementMeta(elements, camera, {
          relatedImages: camera.relatedImages.filter((id) => id !== image.id),
        })
        // [2] make target image visible, if not
        elements = changeElementProperty(elements, image, {
          opacity: isDisplayed(image) ? image.opacity : 100,
          locked: isDisplayed(image) ? image.locked : false,
        })
        break
      case 'remove':
        elements = changeElementProperty(elements, image, { isDeleted: true })
        break
    }
    return {
      elements,
      appState,
      commitToHistory: true,
    }
  },
  PanelComponent: ({
    elements,
    appState,
    updateData,
    appProps,
  }: PanelComponentProps<IPerformValue>) => {
    const cameras = getCameraMetas(getSelectedElements(elements, appState))
    const images = useCamerasImages(cameras)

    if (cameras.length !== 1) return <></> // supports only for single camera selection
    const camera = cameras[0]

    return (
      <div className='storyboard-images'>
        <legend>Storyboard</legend>
        {images.map((image) => (
          <fieldset key={image.id}>
            <img src={image.dataURL} alt='' />
            <ToolButton
              type='button'
              icon='👁'
              onClick={() => updateData({ camera, image, action: 'display' })}
              title={'Show on canvas'}
              aria-label={'undefined'}
            />
            <ToolButton
              type='button'
              icon='❌'
              onClick={() => updateData({ camera, image, action: 'unlink' })}
              title={'Disable storyboard'}
              aria-label={'undefined'}
            />
            <ToolButton
              type='button'
              icon='🗑'
              onClick={() => updateData({ camera, image, action: 'remove' })}
              title={'Remove image'}
              aria-label={'undefined'}
            />
          </fieldset>
        ))}
      </div>
    )
  },
})
