import * as Popover from '@radix-ui/react-popover'
import clsx from 'clsx'

import { PanelComponentProps } from '../../actions/types'
import { useDevice } from '../../components/App'
import { ToolButton } from '../../components/ToolButton'
import { ExcalidrawElement, ExcalidrawImageElement } from '../../element/types'
import { getSelectedElements } from '../../scene'
import { AppState } from '../../types'
import '../scss/cameraItem.scss'
import '../scss/popover.scss'
import {
  getCameraMetas,
  getShotCameraMetas,
  useCamerasImages
} from '../selectors/selectors'
import { CameraMeta, ObjectiveImageElement, isDisplayed } from '../types/types'
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
  perform: (elements, appState, camera: CameraMeta) => {
    const image = getSelectedImage(elements, appState)
    return changeElementMeta(elements, camera, appState, {
      relatedImages: camera.relatedImages.includes(image.id)
        ? [...camera.relatedImages].filter((id) => id !== image.id) // remove prev
        : [...camera.relatedImages, image.id], // add new (first)
    })
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
                className={clsx('camera-item', {
                  // is image related already to this camera
                  active: camera.relatedImages ? camera.relatedImages.includes(image.id) : false,
                })}
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
  perform: (elements, appState, { camera, image, action }: IPerformValue, app, manager) => {
    switch (action) {
      case 'display':
        return changeElementProperty(elements, image, appState, {
          opacity: isDisplayed(image) ? 0 : 100,
          locked: isDisplayed(image),
        })
      case 'unlink':
        // NOTE: Double change is called here. For cameraMeta and for image.
        return changeElementProperty(
          changeElementMeta(elements, camera, appState, {
            // [1] remove target image in related camera images
            relatedImages: camera.relatedImages.filter((id) => id !== image.id),
          }).elements,
          image,
          appState,
          {
            // [2] make target image visible, if not
            opacity: isDisplayed(image) ? image.opacity : 100,
            locked: isDisplayed(image) ? image.locked : false,
          }
        )
      case 'remove':
        return changeElementProperty(elements, image, appState, {
          isDeleted: true,
        })
      default:
        return {
          elements,
          appState,
          commitToHistory: true,
        }
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
              // visible={!isShot}
            />
            <ToolButton
              type='button'
              icon='❌'
              onClick={() => updateData({ camera, image, action: 'unlink' })}
              title={'Disable storyboard'}
              aria-label={'undefined'}
              // visible={isShot}
            />
            <ToolButton
              type='button'
              icon='🗑'
              onClick={() => updateData({ camera, image, action: 'remove' })}
              title={'Remove image'}
              aria-label={'undefined'}
              // visible={isShot}
            />
          </fieldset>
        ))}
      </div>
    )
  },
})
