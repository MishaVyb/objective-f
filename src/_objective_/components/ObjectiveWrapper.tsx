import isEqual from 'lodash/isEqual'
import { FC, ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'

import { useApp, useExcalidrawElements } from '../../components/App'
import { BinaryFiles } from '../../types'
import { getCameraMetas } from '../selectors/selectors'
import { CameraMeta } from '../types/types'

/**
 * Extra contexts
 */
const ObjectiveCamerasContext = createContext<readonly CameraMeta[]>([])
export const useObjectiveCameras = () => useContext(ObjectiveCamerasContext)

const ExcalidrawFilesContext = createContext<BinaryFiles>({})
export const useExcalidrawFiles = () => useContext(ExcalidrawFilesContext)
/**
 * Helper component.
 * Handle custom context providers.
 */
const ObjectiveWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const elements = useExcalidrawElements()
  const app = useApp()

  /**
   * NOTE:
   * Using state for context value to handle DeepEqual comparison between previous and current value.
   * If we pass currentCameras to context value directly it will produce *NEW* value for every
   * elements changing, even if cameras left unchanged.
   */
  const [cameras, setCameras] = useState<readonly CameraMeta[]>([])
  useEffect(() => {
    const currentCameras = getCameraMetas(elements)
    if (!isEqual(cameras, currentCameras)) setCameras(currentCameras)
  }, [elements, cameras])

  /**
   * NOTE: It's better to use ExcalidrawFilesContext for getting files, then app.files directly.
   * As in case of changing files, it's not cause re-rendering of child components, where they are
   * used.
   */
  const [files, setFiles] = useState<BinaryFiles>({})
  useEffect(() => {
    setFiles(app.files)
  }, [app.files])

  return (
    <ObjectiveCamerasContext.Provider value={cameras}>
      <ExcalidrawFilesContext.Provider value={files}>{children}</ExcalidrawFilesContext.Provider>
    </ObjectiveCamerasContext.Provider>
  )
}

export default ObjectiveWrapper
