import { FC, ReactNode, useCallback, useEffect } from 'react'

import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from '../../_objective_plus_/hooks/redux'
import {
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
import { deepCopyElement } from '../../element/newElement'
import { Collaborator, ExcalidrawImperativeAPI } from '../../types'
import { SCENE_PERSISTENCE } from '../../_objective_plus_/constants'

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
        })
    },
    [excalidrawApi, dispatch]
  )

  const updatingScene = useCallback(() => {
    if (!excalidrawApi) return
    dispatch(
      loadUpdateScene({
        id: sceneId!,
        elements: excalidrawApi.getSceneElementsIncludingDeleted(),
        appState: excalidrawApi.getAppState(),
      })
    )
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
