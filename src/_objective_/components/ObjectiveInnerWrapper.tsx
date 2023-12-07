import isEqual from 'lodash/isEqual'
import { FC, ReactNode, createContext, useContext, useEffect, useState } from 'react'

import { SymbolIcon } from '@radix-ui/react-icons'
import { Flex, Text } from '@radix-ui/themes'
import { RootBox } from '../../_objective_plus_/components/layout'
import { useSelector } from '../../_objective_plus_/hooks/redux'
import {
  selectIsMyScene,
  selectLoadingSceneIsPending,
} from '../../_objective_plus_/store/projects/reducer'
import { actionToggleViewMode } from '../../actions/actionToggleViewMode'
import App, { useApp, useExcalidrawElements } from '../../components/App'
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
 * - Handle custom context providers.
 * - Handle loading span.
 */
const ObjectiveInnerWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const elements = useExcalidrawElements()
  const app = useApp() as App
  const loading = useSelector(selectLoadingSceneIsPending)

  const isMyScene = useSelector(selectIsMyScene)

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

  /** Configure appState programatecly */
  useEffect(() => {
    if (loading) return

    // HACK: set `viewMode` by actionManager, otherwise it won't work
    //
    // Reference, how action called programatecly:
    // https://github.com/MishaVyb/objective-f/blob/3a8d57018e1d16e42513210841ce039660cabc55/src/components/ContextMenu.tsx#L100
    if (!isMyScene) {
      app.setState({ contextMenu: null }, () => {
        app.actionManager.executeAction(actionToggleViewMode, 'contextMenu')
      })
    }
  }, [isMyScene, loading, app])

  if (loading)
    return (
      <RootBox>
        <Flex justify={'center'} align={'center'} gap={'2'}>
          <SymbolIcon />
          <Text>loading</Text>
        </Flex>
      </RootBox>
    )

  return (
    <ObjectiveCamerasContext.Provider value={cameras}>
      <ExcalidrawFilesContext.Provider value={files}>{children}</ExcalidrawFilesContext.Provider>
    </ObjectiveCamerasContext.Provider>
  )
}

export default ObjectiveInnerWrapper
