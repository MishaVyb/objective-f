import { FC, ReactNode, useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useDispatch } from '../../_objective_plus_/hooks/redux'
import { loadScene, loadUpdateScene } from '../../_objective_plus_/store/projects/actions'
import { selectLoadingSceneIsPending } from '../../_objective_plus_/store/projects/reducer'
import { deepCopyElement } from '../../element/newElement'
import { Collaborator, ExcalidrawImperativeAPI } from '../../types'

const AUTO_SAVE_INTERVAL_MS = 2 * 1000 // 10 sec

/** Implement scene loading and saving */
const ObjectiveOuterWrapper: FC<{
  excalidrawApi: ExcalidrawImperativeAPI | null
  children: ReactNode
}> = ({ excalidrawApi, children }) => {
  const dispatch = useDispatch()
  const { sceneId } = useParams()
  const loading = useSelector(selectLoadingSceneIsPending)

  const loadingScene = useCallback(() => {
    if (!excalidrawApi) return

    console.log('loadingScene')
    dispatch(loadScene({ id: sceneId! }))
      .unwrap()
      .then((scene) => {
        console.log('success', scene)

        // Data serialization. Ensure types.
        const serializedElements = scene.elements.map((e) => deepCopyElement(e))
        const serializedAppState = { ...scene.appState }
        serializedAppState.collaborators = new Map<string, Collaborator>(
          Object.entries(serializedAppState.collaborators || {})
        )

        excalidrawApi.updateScene({
          elements: serializedElements,
          appState: serializedAppState,
          collaborators: serializedAppState.collaborators,
        })
      })
  }, [excalidrawApi, dispatch, sceneId])

  const updatingScene = useCallback(() => {
    if (!excalidrawApi) return

    console.log('updatingScene')
    dispatch(
      loadUpdateScene({
        id: sceneId!,
        elements: excalidrawApi.getSceneElementsIncludingDeleted(),
        appState: excalidrawApi.getAppState(),
      })
    )
  }, [excalidrawApi, dispatch, sceneId])

  // load scene on mount
  // save scene on un-mount
  useEffect(() => {
    console.log('mount')
    loadingScene()

    return () => {
      console.log('unmount')
      updatingScene()
    }
  }, [loadingScene, updatingScene])

  // AUTO SAVE
  useEffect(() => {
    if (loading) return

    // TODO
    // Use not save interval but set timeout !!!
    const interval = setInterval(() => {
      console.log('auto save')
      updatingScene()
    }, AUTO_SAVE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [updatingScene, loading])

  return <>{children}</>
}

export default ObjectiveOuterWrapper
