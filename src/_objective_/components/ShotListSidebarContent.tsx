import { FC } from 'react'

import { useExcalidrawElements, useObjectiveCameras } from '../../components/App'
import { getCameraMetas } from '../selectors/selectors'
import ShotListSidebarCameraElement from './ShotListSidebarCameraElement'
import style from './ShotListSidebarContent.module.css'

const ShotListSidebarContent: FC = () => {
  // const cameraMetas = getCameraMetas(useExcalidrawElements())
  const cameraMetas = useObjectiveCameras()
  console.log('render')
  return (
    <aside className={style.container}>
      {cameraMetas.map((cameraMeta, i) => (
        // TODO add internal meta.cameraKey attribute to handle cameras manual ordering
        <ShotListSidebarCameraElement key={i} cameraMeta={cameraMeta} />
      ))}
    </aside>
  )
}

export default ShotListSidebarContent
