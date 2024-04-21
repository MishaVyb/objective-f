import isEqual from 'lodash/isEqual'
import { FC, ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'

import { useDispatch, useSelector } from '../../objective-plus/hooks/redux'
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
import { getCameraMetas, getSelectedSceneEls } from '../meta/selectors'
import { CameraMeta, isWallToolOrWallDrawing } from '../meta/types'
import { useMouse } from '../hooks/useMouse'
import { getLastLineLength, numberToStr } from '../elements/math'
import { LoadingMessage } from '../../../packages/excalidraw/components/LoadingMessage'
import { updateScenePersistence } from './ObjectiveOuterWrapper'
import { useParams } from 'react-router-dom'

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
 * - Handle loading/saving span.
 */
const ObjectiveInnerWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useDispatch()
  const app = useApp() as App
  const { multiElement } = useExcalidrawAppState()
  const elements = useExcalidrawElements()

  const initialSceneLoading = useSelector(selectInitialSceneLoadingIsPending)
  const { sceneId } = useParams()
  const isMyScene = useSelector(selectIsMyScene)

  // TODO show when editing liner element (when `appState.editingLinearElement` is set)
  const showMeasurement =
    !!multiElement &&
    isWallToolOrWallDrawing(app.state.activeTool, getSelectedSceneEls(app.scene, app.state))
  const mouse = useMouse(showMeasurement)

  const lastPoint = multiElement?.points.at(-1) || [0, 0]
  const memoDepends = [Math.round(lastPoint[0] / 10) * 10, Math.round(lastPoint[1] / 10) * 10]
  const lineMeasurementStr = useMemo(() => {
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
    const currentCameras = getCameraMetas(elements, { sort: true })
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

  /** Configure app/appState programatecly after `loading` flag has been changed */
  useEffect(() => {
    if (initialSceneLoading) return
    else {
      // HACK: clear history to prevent Undo to empty scene (when scene hasn't loaded yet)
      app.history.clear()
      app.history.resumeRecording()
    }

    // HACK: set `viewMode` by actionManager, otherwise it won't work
    //
    // Reference, how action called programatecly:
    // https://github.com/MishaVyb/objective-f/blob/3a8d57018e1d16e42513210841ce039660cabc55/src/components/ContextMenu.tsx#L100
    if (!isMyScene) {
      app.setState({ contextMenu: null }, () => {
        app.actionManager.executeAction(actionToggleViewMode, 'contextMenu')
      })
    }
  }, [isMyScene, initialSceneLoading, app])

  /** saving scene on elements changes */
  useEffect(() => {
    if (isMyScene)
      updateScenePersistence(
        dispatch,
        {
          getFiles: () => app.files,
          getSceneElements: () => elements,

          // FIXME we should pass appState as dependency,
          // but it will trigger updates for every scroll movement,
          // therefore appState are updating only when elements have updated or every 10 sec on auto update timer
          getAppState: () => app.state,
        },
        sceneId
      )
  }, [elements, app, isMyScene])

  if (initialSceneLoading) return <LoadingMessage />

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
