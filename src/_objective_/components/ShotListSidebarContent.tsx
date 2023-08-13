import { FC } from 'react'

import { ExcalidrawImperativeAPI } from '../../types'
import { CameraMeta } from '../types/types'
import ShotListSidebarCameraElement from './ShotListSidebarCameraElement'
import style from './ShotListSidebarContent.module.css'

const ShotListSidebarContent: FC<{
  excalidrawAPI: ExcalidrawImperativeAPI
  cameraMetas: readonly CameraMeta[]
}> = ({ excalidrawAPI, cameraMetas }) => {
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
