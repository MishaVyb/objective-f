import { FC } from 'react'

import { ExcalidrawImperativeAPI } from '../../types'
import { CameraMeta } from '../types/types'
import ShotListSidebarCameraElement from './ShotListSidebarCameraElement'

const ShotListSidebarContent: FC<{
  excalidrawAPI: ExcalidrawImperativeAPI
  cameraMetas: readonly CameraMeta[]
}> = ({ excalidrawAPI, cameraMetas }) => {
  return (
    <aside>
      {cameraMetas.map((cameraMeta, i) => (
        // TODO add internal meta.cameraKey attribute to handle cameras manual ordering
        <ShotListSidebarCameraElement key={i} cameraMeta={cameraMeta} />
      ))}
    </aside>
  )
}

export default ShotListSidebarContent
