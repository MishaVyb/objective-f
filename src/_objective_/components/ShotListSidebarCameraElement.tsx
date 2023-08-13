import { FC } from 'react'

import { CameraMeta } from '../types/types'

const ShotListSidebarCameraElement: FC<{ cameraMeta: CameraMeta }> = ({ cameraMeta }) => {
  if (!cameraMeta.isShot) return <></>
  return (
    <div>
      {cameraMeta.shotNumber}
      {' | '}
      {cameraMeta.name}
    </div>
  )
}

export default ShotListSidebarCameraElement
