import isEqual from 'lodash/isEqual'
import { FC, ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'

import { useSelector } from '../../objective-plus/hooks/redux'
import {
  selectIsMyScene,
  selectInitialSceneLoadingIsPending,
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
import { getLastLineLength, numberToStr } from '../elements/math'
import { LoadingMessage } from '../../../packages/excalidraw/components/LoadingMessage'

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

  const loading = useSelector(selectInitialSceneLoadingIsPending)
  const isMyScene = useSelector(selectIsMyScene)

  const showMeasurement = !!multiElement // TODO show when `appState.editingLinearElement`
  const mouse = useMouse(showMeasurement)

  const lastPoint = multiElement?.points.at(-1) || [0, 0]
  const memoDepends = [Math.round(lastPoint[0] / 10) * 10, Math.round(lastPoint[1] / 10) * 10]
  const lineMeasurementStr = useMemo(() => {
    console.log('useMemo', memoDepends)
    return multiElement ? numberToStr(getLastLineLength(multiElement) / 100, { unit: 'm' }) : null
  }, [...memoDepends])

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

  if (loading) return <LoadingMessage />

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
