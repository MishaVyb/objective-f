import { FC } from 'react'

import { useExcalidrawSetAppState } from '../../components/App'
import { useCameraImages } from '../selectors/selectors'
import { CameraMeta } from '../types/types'
import './../scss/cameraItem.scss'

const ShotListSidebarCameraElement: FC<{
  camera: CameraMeta
}> = ({ camera }) => {
  const setAppState = useExcalidrawSetAppState()
  const images = useCameraImages(camera)

  const onClick = () => {
    setAppState({
      selectedElementIds: Object.fromEntries(camera.elementIds.map((id) => [id, true])),
      selectedGroupIds: { [camera.id]: true },
      editingGroupId: null,
    })
  }

  if (!camera.isShot) return <></>
  return (
    <div className='camera-item' onClick={onClick}>
      <div className='shot-number'>{camera.shotNumber}</div>
      <div className='name'>{camera.name}</div>
      {images.map((image) => (
        <img src={image.dataURL} key={image.id} alt='' />
      ))}
    </div>
  )
}

export default ShotListSidebarCameraElement
