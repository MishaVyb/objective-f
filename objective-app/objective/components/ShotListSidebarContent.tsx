import { FC } from 'react'

import { useObjectiveCameras } from './ObjectiveInnerWrapper'
import ShotListSidebarCameraElement from './ShotListSidebarCameraElement'
import './../scss/cameraItem.scss'

const ShotListSidebarContent: FC = () => {
  const cameras = useObjectiveCameras()
  return (
    <aside className='cameras-list'>
      {cameras.map((camera, i) => (
        // TODO add internal meta.cameraKey attribute to handle cameras manual ordering
        <ShotListSidebarCameraElement key={i} camera={camera} />
      ))}
    </aside>
  )
}

export default ShotListSidebarContent
