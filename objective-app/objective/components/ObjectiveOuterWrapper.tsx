import { FC, ReactNode, useCallback, useEffect, useState } from 'react'

import { useParams } from 'react-router-dom'
import { SCENE_PERSISTENCE, __DEBUG_ENSURE_THEME } from '../../objective-plus/constants'
import { useDispatch, useSelector } from '../../objective-plus/hooks/redux'
import {
  createFile,
  setInitialSceneLoadingIsPending,
  loadFile,
  loadSceneContinuos,
  loadSceneInitial,
  loadUpdateScene,
  toggleProject,
} from '../../objective-plus/store/projects/actions'
import {
  selectCurrentScene,
  selectIsMyScene,
  selectInitialSceneLoadingIsPending,
} from '../../objective-plus/store/projects/reducer'
import { deepCopyElement } from '../../../packages/excalidraw/element/newElement'
import { isImageElement } from '../../../packages/excalidraw/element/typeChecks'
import { Collaborator, ExcalidrawImperativeAPI, SocketId } from '../../../packages/excalidraw/types'
import { OBJECTIVE_LIB as OBJECTIVE_LIB_ITEMS } from '../lib'
import { objectValues } from '../meta/utils'

import { DEFAULT_GRID_MODE, getGridMode } from './ObjectiveSettingsDialog'

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
          const serializedElements = scene.elements.map((e) => deepCopyElement(e))

          const serializedAppState = {
            ...scene.appState,
            name: scene.name,
            theme: __DEBUG_ENSURE_THEME ? __DEBUG_ENSURE_THEME : scene.appState.theme,
          }
          serializedAppState.collaborators = new Map<SocketId, Collaborator>(
            //@ts-ignore
            Object.entries(serializedAppState.collaborators || {})
          )
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

          const localFiles = excalidrawApi.getFiles()
          const localFileIds = new Set(objectValues(localFiles).map((f) => f.id))
          const imageElementsWithFileNotInLocalFileIds = serializedElements
            .filter(isImageElement)
            .filter((e) => !e.isDeleted && e.fileId && !localFileIds.has(e.fileId))

          // scene has been load from server, but we need a little bit more for Excalidraw internal work
          setTimeout(() => {
            dispatch(setInitialSceneLoadingIsPending(false))
          }, 100)

          imageElementsWithFileNotInLocalFileIds.forEach((e) => {
            // TODO
            // chick is action to fetch already dispatched or not? (do not dispatche the same request)
            dispatch(loadFile({ sceneId: scene.id, fileId: e.fileId! }))
              .unwrap()
              .then((value) => {
                excalidrawApi.addFiles([
                  {
                    ...value,
                    created: new Date().getTime(), // ??? it seems that it works
                  },
                ])
              })
          })
        })
    },
    [excalidrawApi, dispatch]
  )

  /** saving... */
  const updatingScene = useCallback(() => {
    if (!excalidrawApi) return
    const els = excalidrawApi.getSceneElements() // save on backend only not deleted elements

    // HACK
    // edge case, when we exiting from scene, Excalidraw api release elements store and return
    // empty list (but scene actually may has elements)
    //
    // and it also prevents scene updateing with no elements, if any app error occurs
    // and to ensure that schene has no elements for real (at server side), dispatch load action for one more time
    //
    if (!els.length) {
      loadingScene(loadSceneContinuos({ id: sceneId! }), { updateAppState: true })
      return
    }

    dispatch(
      loadUpdateScene({
        id: sceneId!,
        elements: els,
        appState: excalidrawApi.getAppState(),
      })
    )
      .unwrap()
      .then((value) => {
        // TODO
        // check is action to fetch already dispatched or not? (do not dispatche the same request)

        const localFiles = excalidrawApi.getFiles()
        const localFileIds = objectValues(localFiles).map((f) => f.id)
        const fileIdsStorredOnBackend = new Set(value.files.map((f) => f.id))
        const fileIdsToSave = localFileIds.filter((id) => !fileIdsStorredOnBackend.has(id))
        fileIdsToSave.forEach((id) =>
          dispatch(createFile({ sceneId: sceneId!, file: localFiles[id] }))
        )
      })
  }, [excalidrawApi, dispatch, sceneId])

  // load scene on mount, save scene on un-mount
  useEffect(() => {
    loadingScene(loadSceneInitial({ id: sceneId! }))

    return () => {
      // set true by as default to ensure when other scene will be opened,
      // it will have pending status initially
      dispatch(setInitialSceneLoadingIsPending(true))
      updatingScene()
    }
  }, [loadingScene, updatingScene, sceneId])

  // auto save/load
  useEffect(() => {
    if (loading) return
    let interval: ReturnType<typeof setInterval>

    if (isMyScene) {
      // AUTO SAVE
      interval = setInterval(() => {
        updatingScene()
      }, SCENE_PERSISTENCE.AUTO_SAVE_INTERVAL_MS)
    } else {
      //
      // AUTO LOAD
      interval = setInterval(() => {
        loadingScene(loadSceneContinuos({ id: sceneId! }), { updateAppState: false })
      }, SCENE_PERSISTENCE.AUTO_LOADING_INTERVAL_MS)
    }

    return () => clearInterval(interval)
  }, [updatingScene, loading, isMyScene, loadingScene, sceneId])

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
