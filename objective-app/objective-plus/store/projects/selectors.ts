import { createSelector } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { orderBy } from '../../../objective/utils/helpers'
import { APIError, IProject, ISceneFull } from './reducer'
import { TSceneRenderKey } from '../../utils/objective-local-db'
import { selectAuth } from '../auth/reducer'
import { ensureMap } from '../../../objective/meta/_types'
import { TScenesDocumentContext } from '../../components/scenes-pdf'

export const selectIsPending = (state: RootState) => state.projects.pendingRequest
export const selectContinuousSceneUpdateIsPending = (state: RootState) =>
  state.projects.continuousSceneUpdateIsPending

export const selectInitialSceneLoadingIsPending = (state: RootState) =>
  state.projects.initialSceneLoadingIsPending

const _EMPTY_LIST: IProject[] = []

export const selectError = (state: RootState) => state.projects.error
export const selectProjectsMeta = () => (state: RootState) => state.projects.projectsMeta
export const selectAllProjects = () => (state: RootState) => state.projects.projects || _EMPTY_LIST
export const selectMyProjects = createSelector(
  [selectAllProjects(), selectProjectsMeta(), selectAuth],
  (projects, meta, auth) =>
    projects
      .filter((p) => !p.is_deleted && p.user_id === auth.user.id)
      .sort((a, b) => orderBy(meta?.order, a, b))
)
export const selectMyDeletedProjects = createSelector(
  [selectAllProjects(), selectProjectsMeta(), selectAuth],
  (projects, meta, auth) =>
    projects
      .filter((p) => p.is_deleted && p.user_id === auth.user.id)
      .sort((a, b) => orderBy(meta?.order, a, b))
)
export const selectOtherProjects = createSelector(
  [selectAllProjects(), selectProjectsMeta(), selectAuth],
  (projects, meta, auth) =>
    projects
      .filter((p) => !p.is_deleted && p.user_id !== auth.user.id)
      .sort((a, b) => orderBy(meta?.order, a, b))
)

export const selectProject = (projectId: IProject['id'] | undefined) => (state: RootState) =>
  state.projects.projects?.find((p) => p.id === projectId)

export const selectScenesMeta = () => (state: RootState) => state.projects.scenesMeta

/** Select not deleted scenes of current toggled project */
export const selectScenes = (projectId: IProject['id'] | undefined) =>
  createSelector([selectProject(projectId), selectScenesMeta()], (project, meta) => {
    return (project?.scenes?.filter((s) => !s.is_deleted) || []).sort((a, b) =>
      orderBy(meta?.order, a, b)
    )
  })

export const selectSceneFullInfo = (id: ISceneFull['id']) => (state: RootState) =>
  state.projects.scenes?.find((s) => s.id === id)

export const selectScenesFullInfoList = (projectId: IProject['id'] | undefined) =>
  createSelector(
    [selectProject(projectId), (state: RootState) => state.projects.scenes, selectScenesMeta()],
    (project, scenes, meta) =>
      scenes?.filter((s) => s.project_id === project?.id).sort((a, b) => orderBy(meta?.order, a, b))
  )

export const selectIsExportCtxReady = () => (state: RootState) => state.projects.isExportCtxReady
export const selectScenesExportCtx = (projectId: IProject['id'] | undefined) =>
  createSelector(
    [
      selectProject(projectId),
      selectScenesFullInfoList(projectId),
      // select only 'export' renders
      (state: RootState) => state.projects.sceneRenders,

      // TODO
      // (state: RootState) => state.projects.sceneFiles,
    ],
    (
      project,
      scenes,
      renders
      // allFiles // TODO
    ): TScenesDocumentContext => {
      const rendersMap = ensureMap(renders || [])
      // const allFilesMap = ensureMap(allFiles || [])

      const scenesCtx = scenes?.map((sceneFullInfo) => ({
        fullInfo: sceneFullInfo,
        renderInfo: rendersMap.get(sceneFullInfo.id),
        // TODO
        // files: mapOmitNone(getSceneVisibleFileIds(sceneFullInfo), (fileId) =>
        //   allFilesMap.get(fileId)
        // ),
      }))
      return {
        project,
        scenesCtx,
      }
    }
  )

export const selectSceneRender =
  ([kind, id]: TSceneRenderKey) =>
  (state: RootState) =>
    state.projects.sceneThumbnails?.find((s) => s.renderKind === kind && s.id === id)

//   // TODO
// export const selectSceneFile = (id: BinaryFileData['id']) => (state: RootState) =>
//   state.projects.sceneFiles?.find((f) => f.id === id)
// export const selectSceneFiles = (id: ISceneFull['id']) =>
//   createSelector(
//     [(state: RootState) => state.projects.sceneFiles, selectSceneFullInfo(id)],
//     (allFiles, sceneFullInfo) => {
//       if (!sceneFullInfo) return []
//       const allFilesMap = ensureMap(allFiles || [])
//       const fileIds = getSceneVisibleFileIds(sceneFullInfo)
//       return mapOmitNone(fileIds, (fileId) => allFilesMap.get(fileId))
//     }
//   )

/**
 * Get current openned Scene meta info.
 *
 * For full scene elements or appState access, use Excalidraw API. Like:
 *  `appState = useExcalidrawAppState`
 *
 * (as we do not store in redux state, only at Excalidraw State)
 */
export const selectCurrentScene = (state: RootState) => state.projects.currentScene

export const selectIsMyScene = createSelector(
  [selectCurrentScene, selectAuth],
  (scene, auth) => scene?.user_id === auth.user.id
)
export const selectIsOtherScene = createSelector(
  [selectCurrentScene, selectAuth],
  (scene, auth) => scene?.user_id !== auth.user.id
)

export const selectAPIErrors = createSelector(
  [(state: RootState) => state.projects.error, (state: RootState) => state.auth.error],
  (project_error, auth_error) => [project_error, auth_error].filter((e): e is APIError => !!e)
)

export const selectNotUserAPIErrors = createSelector([selectAPIErrors], (errors) =>
  errors.filter((e) => e.type !== 'UserError')
)
export const selectUserAPIErrors = createSelector([selectAPIErrors], (errors) =>
  errors.filter((e) => e.type === 'UserError')
)
