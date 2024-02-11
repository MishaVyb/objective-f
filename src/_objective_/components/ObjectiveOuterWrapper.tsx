import { FC, ReactNode, useCallback, useEffect } from 'react'

import { useParams } from 'react-router-dom'
import { SCENE_PERSISTENCE } from '../../_objective_plus_/constants'
import { useDispatch, useSelector } from '../../_objective_plus_/hooks/redux'
import {
  createFile,
  loadFile,
  loadSceneContinuos,
  loadSceneInitial,
  loadUpdateScene,
  toggleProject,
} from '../../_objective_plus_/store/projects/actions'
import {
  selectCurrentScene,
  selectIsMyScene,
  selectLoadingSceneIsPending,
} from '../../_objective_plus_/store/projects/reducer'
import { deepCopyElement } from '../../../packages/excalidraw/element/newElement'
import { isImageElement } from '../../../packages/excalidraw/element/typeChecks'
import { Collaborator, ExcalidrawImperativeAPI } from '../../../packages/excalidraw/types'
import { OBJECTIVE_LIB as OBJECTIVE_LIB_ITEMS } from '../lib'
import { objectValues } from '../types/utils'

/** Implements scene loading and saving */
const ObjectiveOuterWrapper: FC<{
  excalidrawApi: ExcalidrawImperativeAPI | null
  children: ReactNode
}> = ({ excalidrawApi, children }) => {
  const dispatch = useDispatch()
  const { sceneId } = useParams()
  const isMyScene = useSelector(selectIsMyScene)
  const scene = useSelector(selectCurrentScene)
  const loading = useSelector(selectLoadingSceneIsPending)

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
          const serializedAppState = { ...scene.appState, name: scene.name }
          serializedAppState.collaborators = new Map<string, Collaborator>(
            Object.entries(serializedAppState.collaborators || {})
          )

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
            .filter((e) => e.fileId && !localFileIds.has(e.fileId))

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

    dispatch(
      loadUpdateScene({
        id: sceneId!,
        elements: excalidrawApi.getSceneElementsIncludingDeleted(),
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
      updatingScene()
    }
  }, [loadingScene, updatingScene, sceneId])

  // auto save/load
  useEffect(() => {
    if (loading) return
    let interval: NodeJS.Timer

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

  return <>{children}</>
}

export default ObjectiveOuterWrapper
