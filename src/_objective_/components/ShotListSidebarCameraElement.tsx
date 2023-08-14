import { FC } from 'react'

import { useExcalidrawSetAppState } from '../../components/App'
import { CameraMeta } from '../types/types'
import style from './ShotListSidebarCameraElement.module.css'

const ShotListSidebarCameraElement: FC<{
  cameraMeta: CameraMeta
}> = ({ cameraMeta }) => {
  const setAppState = useExcalidrawSetAppState()
  if (!cameraMeta.isShot) return <></>

  const onClick = () => {
    setAppState({
      selectedElementIds: Object.fromEntries(cameraMeta.elementIds.map((id) => [id, true])),
      selectedGroupIds: { [cameraMeta.id]: true },
      editingGroupId: null,
    })
  }
  return (
    <div className={style.container} onClick={onClick}>
      <div className={style.shotNumber}>{cameraMeta.shotNumber}</div>
      <div className={style.name}>{cameraMeta.name}</div>
    </div>
  )
}

export default ShotListSidebarCameraElement
