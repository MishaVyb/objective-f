import * as Popover from '@radix-ui/react-popover'
import clsx from 'clsx'

import { PanelComponentProps } from '../../actions/types'
import { useDevice } from '../../components/App'
import { ExcalidrawElement, ExcalidrawImageElement } from '../../element/types'
import { getSelectedElements } from '../../scene'
import { AppState } from '../../types'
import '../scss/cameraItem.scss'
import '../scss/popover.scss'
import { getShotCameraMetas } from '../selectors/selectors'
import { CameraMeta } from '../types/types'
import { changeElementMeta } from './helpers'
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
      relatedImages: camera.relatedImages
        ? camera.relatedImages.includes(image.id)
          ? [...camera.relatedImages].filter((id) => id !== image.id) // remove prev
          : [...camera.relatedImages, image.id] // add new
        : [image.id], // add first
    })
  },
  PanelComponent: ({ elements, appState, updateData, appProps }: PanelComponentProps) => {
    const image = getSelectedImage(elements, appState)
    const cameras = getShotCameraMetas(elements)
    const { isMobile, isLandscape } = useDevice()
    console.log(cameras)

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
