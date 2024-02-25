import isEqual from 'lodash/isEqual'
import { FC, ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'

import { SymbolIcon } from '@radix-ui/react-icons'
import { Flex, Text } from '@radix-ui/themes'
import { RootBox } from '../../objective-plus/components/layout'
import { useSelector } from '../../objective-plus/hooks/redux'
import {
  selectIsMyScene,
  selectLoadingSceneIsPending,
} from '../../objective-plus/store/projects/reducer'
import { actionToggleViewMode } from '../../../packages/excalidraw/actions/actionToggleViewMode'
import App, {
  useApp,
  useExcalidrawAppState,
  useExcalidrawElements,
} from '../../../packages/excalidraw/components/App'
import { BinaryFiles } from '../../../packages/excalidraw/types'
import { getCameraMetas } from '../meta/selectors'
import { CameraMeta } from '../meta/types'
import { useMouse } from '../hooks/useMouse'
import { LinearElementEditor } from '../../../packages/excalidraw/element/linearElementEditor'
import { getLastLineLength, numberToStr } from '../elements/math'

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
  const app = useApp() as App
  const { multiElement } = useExcalidrawAppState()
  const elements = useExcalidrawElements()

  const loading = useSelector(selectLoadingSceneIsPending)
  const isMyScene = useSelector(selectIsMyScene)

  const showMeasurement = !!multiElement // TODO show when `appState.editingLinearElement`
  const mouse = useMouse(showMeasurement)

  const lineMeasurementStr = useMemo(() => {
    return multiElement ? numberToStr(getLastLineLength(multiElement) / 100, { unit: 'm' }) : null
  }, [multiElement?.points.at(-2), multiElement?.points.at(-1)])

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
      <ExcalidrawFilesContext.Provider value={files}>
        {/*  */}
        <Tooltip.TooltipProvider>
          <Tooltip.Root delayDuration={0} open={showMeasurement}>
            <Tooltip.TooltipTrigger asChild>
              <div ref={mouse.ref} style={{ height: '100vh', width: '100vw' }}>
                {children}
              </div>
            </Tooltip.TooltipTrigger>
            <Tooltip.Content
              align='start'
              alignOffset={mouse.x + 10}
              sideOffset={-mouse.y - 40}
              hideWhenDetached
              className='objective-tooltip-content'
            >
              {lineMeasurementStr}
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.TooltipProvider>
      </ExcalidrawFilesContext.Provider>
    </ObjectiveCamerasContext.Provider>
  )
}

export default ObjectiveInnerWrapper
