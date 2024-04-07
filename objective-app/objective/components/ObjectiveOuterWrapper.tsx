import { FC, ReactNode, useCallback, useEffect } from 'react'

import { useParams } from 'react-router-dom'
import { SCENE_PERSISTENCE, __DEBUG_ENSURE_THEME } from '../../objective-plus/constants'
import { useDispatch, useSelector } from '../../objective-plus/hooks/redux'
import {
  createFile,
  setInitialSceneLoadingIsPending,
  loadSceneContinuos,
  loadSceneInitial,
  loadUpdateScene,
  toggleProject,
} from '../../objective-plus/store/projects/actions'
import {
  selectCurrentScene,
  selectIsMyScene,
  selectInitialSceneLoadingIsPending,
  ISceneFull,
} from '../../objective-plus/store/projects/reducer'
import { isImageElement } from '../../../packages/excalidraw/element/typeChecks'
import { ExcalidrawImperativeAPI } from '../../../packages/excalidraw/types'
import { OBJECTIVE_LIB as OBJECTIVE_LIB_ITEMS } from '../lib'
import { objectValues } from '../utils/types'

import { DEFAULT_GRID_MODE, getGridMode } from './ObjectiveSettingsDialog'
import { RestoredAppState } from '../../../packages/excalidraw/data/restore'
import { clearAppStateForDatabase } from '../../../packages/excalidraw/appState'
import { deepCopyElement } from '../../../packages/excalidraw/element/newElement'
import { LocalData } from '../../../excalidraw-app/data/LocalData'
import { useFilesFromLocalOrServer } from '../../objective-plus/store/projects/helpers'

/**
 * saving...
 * - to backend (elements, appState + files)
 * - to local IndexDB (files)
 *
 * */
export const updateScenePersistence = (
  dispatch: ReturnType<typeof useDispatch>,
  excalidrawApi: Pick<
    ExcalidrawImperativeAPI,
    'getAppState' | 'getFiles' | 'getSceneElements'
  > | null,
  sceneId: ISceneFull['id'] | undefined
) => {
  if (!excalidrawApi || !sceneId) return
  const elements = excalidrawApi.getSceneElements() // save on backend only not deleted elements

  // HACK
  // edge case, when we exiting from scene, Excalidraw api release elements store and return
  // empty list (but scene actually may has elements)
  //
  // and it also prevents scene updateing with no elements, if any app error occurs
  //
  if (!elements.length) {
    // if in some bad scenarios initial loading fails (no elemnets have been uploaded),
    // we want ensure that scene has no elements for real (at server side),
    // so dispatch load action for one more time
    //
    // UNUSED ???
    // loadingScene(loadSceneContinuos({ id: sceneId! }), { updateAppState: true })

    return
  }

  dispatch(
    loadUpdateScene({
      id: sceneId!,
      elements: elements,
      appState: clearAppStateForDatabase(excalidrawApi.getAppState()),
    })
  )
    .unwrap()
    .then((value) => {
      // TODO
      // check is action to fetch already dispatched or not? (do not dispatche the same request)

      // save on backend
      const files = excalidrawApi.getFiles() // files in memory (not at server and not at local IndexDB)
      const filesIds = objectValues(files).map((f) => f.id)
      const fileIdsStorredOnBackend = new Set(value.files.map((f) => f.id))
      const fileIdsToSave = filesIds.filter((id) => !fileIdsStorredOnBackend.has(id))
      fileIdsToSave.forEach((id) => dispatch(createFile({ sceneId: sceneId!, file: files[id] })))

      // save on local IndexDB
      LocalData.fileStorage.saveFiles({ elements, files })
    })
}

/** Implements scene loading and saving */
const ObjectiveOuterWrapper: FC<{
  excalidrawApi: ExcalidrawImperativeAPI | null
  children: ReactNode
}> = ({ excalidrawApi, children }) => {
  const dispatch = useDispatch()
  const { sceneId } = useParams()
  const isMyScene = useSelector(selectIsMyScene)
  const scene = useSelector(selectCurrentScene)
  const loading = useSelector(selectInitialSceneLoadingIsPending)
  const fetchFiles = useFilesFromLocalOrServer()

  /** loading... */
  const loadingScene = useCallback(
    (
      action: ReturnType<typeof loadSceneContinuos> | ReturnType<typeof loadSceneInitial>,
      opts: { updateAppState?: boolean } = { updateAppState: true }
    ) => {
      if (!excalidrawApi) return

      dispatch(action)
        .unwrap()
        .then((scene) => {
          // Data serialization. Ensure types.

          // NOTE: deep copy is required here in order to resolve this issue:
          //   TypeError: Cannot assign to read only property 'x' of object '#<Object>'
          //
          // Maybe `fetch()` method return read-only objects...
          const serializedElements = scene.elements.map((e) => deepCopyElement(e))

          const serializedAppState: RestoredAppState = {
            // current
            ...excalidrawApi.getAppState(),

            // from server
            ...clearAppStateForDatabase(scene.appState),

            // overrides
            name: scene.name,
            collaborators: new Map([]),

            // overrides (debug)
            theme: __DEBUG_ENSURE_THEME ? __DEBUG_ENSURE_THEME : excalidrawApi.getAppState().theme,
          }

          // ensure objective settings
          if (getGridMode(serializedAppState) === -1) {
            serializedAppState.gridSizeConfig = DEFAULT_GRID_MODE.size
            serializedAppState.gridBoldLineFrequency = DEFAULT_GRID_MODE.freq
          }

          excalidrawApi.updateScene({
            elements: serializedElements,
            appState: opts?.updateAppState ? serializedAppState : undefined,
            collaborators: serializedAppState.collaborators,
          })
          excalidrawApi.updateLibrary({
            libraryItems: OBJECTIVE_LIB_ITEMS,
          })

          // images that we have
          const localFiles = excalidrawApi.getFiles()
          const localFileIds = new Set(objectValues(localFiles).map((f) => f.id))

          // images that we don't have
          const imageElementsWithFileNotInLocalFileIds = serializedElements
            .filter(isImageElement)
            .filter((e) => !e.isDeleted && e.fileId && !localFileIds.has(e.fileId))
          const fileIds = imageElementsWithFileNotInLocalFileIds.map((e) => e.fileId!)

          // scene has been load from server, but we need a little bit more for Excalidraw internal work
          setTimeout(() => {
            dispatch(setInitialSceneLoadingIsPending(false))
          }, 100)

          fetchFiles(scene.id, fileIds, excalidrawApi.addFiles)
        })
    },
    [excalidrawApi, dispatch]
  )

  // load scene on mount
  useEffect(() => {
    loadingScene(loadSceneInitial({ id: sceneId! }))
    return () => {
      // set true to ensure when other scene will be opened,
      // that that other scene will have pending status at the begining
      dispatch(setInitialSceneLoadingIsPending(true))
    }
  }, [loadingScene, sceneId])

  // auto save/load
  useEffect(() => {
    if (loading) return
    let interval: ReturnType<typeof setInterval>

    if (isMyScene) {
      // AUTO SAVE
      interval = setInterval(() => {
        updateScenePersistence(dispatch, excalidrawApi, sceneId)
      }, SCENE_PERSISTENCE.AUTO_SAVE_INTERVAL_MS)
    } else {
      //
      // AUTO LOAD
      interval = setInterval(() => {
        loadingScene(loadSceneContinuos({ id: sceneId! }), { updateAppState: false })
      }, SCENE_PERSISTENCE.AUTO_LOADING_INTERVAL_MS)
    }

    return () => clearInterval(interval)
  }, [loading, isMyScene, loadingScene, sceneId, excalidrawApi])

  // in case scene opened by link, toggle scene project
  useEffect(() => {
    if (isMyScene && scene) dispatch(toggleProject(scene.project_id))
  }, [isMyScene, scene, dispatch])

  // NOTE
  // Do not render loader here, othervie it won't render Excalidraw App and we never get excalidrawAPI
  // that is required to finalize initial loading action. Therefore we display render at `ObjectiveInnerWrapper`
  // if (loading) return <LoadingMessage />

  return <>{children}</>
}

export default ObjectiveOuterWrapper
