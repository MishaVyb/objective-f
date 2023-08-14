import { FC } from 'react'

import { useObjectiveCameras } from './ObjectiveWrapper'
import ShotListSidebarCameraElement from './ShotListSidebarCameraElement'
import style from './ShotListSidebarContent.module.css'

const ShotListSidebarContent: FC = () => {
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
