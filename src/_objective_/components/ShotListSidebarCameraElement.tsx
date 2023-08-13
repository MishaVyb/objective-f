import { FC } from 'react'

import { CameraMeta } from '../types/types'
import style from './ShotListSidebarCameraElement.module.css'

const ShotListSidebarCameraElement: FC<{ cameraMeta: CameraMeta }> = ({ cameraMeta }) => {
  if (!cameraMeta.isShot) return <></>
  return (
    <div className={style.container}>
      <div className={style.shotNumber}>{cameraMeta.shotNumber}</div>
      <div className={style.name}>{cameraMeta.name}</div>
    </div>
  )
}

export default ShotListSidebarCameraElement
