import isEqual from 'lodash/isEqual'
import { FC, ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'

import { useExcalidrawElements } from '../../components/App'
import { getCameraMetas } from '../selectors/selectors'
import { CameraMeta } from '../types/types'

/**
 * Objective contexts
 */
const ObjectiveCamerasContext = createContext<readonly CameraMeta[]>([])
export const useObjectiveCameras = () => useContext(ObjectiveCamerasContext)

/**
 * Helper component.
 * Handle custom context providers.
 */
const ObjectiveWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const elements = useExcalidrawElements()

  /**
   * NOTE:
   * Using state for context value to handle DeepEqual comparison between previous and current value.
   * If we pass currentCameras to context value directly it will produce *NEW* value for every
   * elements changing, even if cameras left unchanged.
   */
  const [cameras, setCameras] = useState<CameraMeta[]>([])

  useEffect(() => {
    const currentCameras = getCameraMetas(elements)
    if (!isEqual(cameras, currentCameras)) setCameras(currentCameras)
  }, [elements, cameras])

  return (
    <ObjectiveCamerasContext.Provider value={cameras}>{children}</ObjectiveCamerasContext.Provider>
  )
}

export default ObjectiveWrapper
