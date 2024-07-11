import { AsyncThunk, createAction, createAsyncThunk } from '@reduxjs/toolkit'
import {
  fetchCopyScene,
  fetchCreateFile,
  fetchCreateProject,
  fetchCreateScene,
  fetchDeleteProject,
  fetchDeleteScene,
  fetchFile,
  fetchProject,
  fetchProjects,
  fetchScene,
  fetchScenes,
  fetchUpdateProject,
  fetchUpdateScene,
} from '../../utils/objective-api'
import { selectAuth } from '../auth/reducer'
import { ThunkApiConfig, safeAsyncThunk } from '../helpers'
import { IProject, IProjectsState, ISceneFull, ISceneSimplified } from './reducer'
import { BinaryFileData } from '../../../../packages/excalidraw/types'
import { MarkOptional } from '../../../../packages/excalidraw/utility-types'
import {
  ScenesFileRepository,
  ScenesRenderRepository,
  ScenesRepository,
  TSceneRenderKey,
  TSceneRenderRedux,
} from '../../utils/objective-local-db'
import { ensureArray, ensureMap, isObjectiveHidden } from '../../../objective/meta/_types'
import { exportToBlob, MIME_TYPES } from '../../../../packages/excalidraw'
import { selectSceneFullInfo, selectSceneRender, selectScenesFullInfoList } from './selectors'
import { getSceneVisibleFileIds } from './hooks'

// Responses
export type TGetProjectResponse = IProject
export type TGetProjectsResponse = IProject[]
export type TCreateProjectResponse = IProject
export type TUpdateProjectResponse = IProject
export type TDeleteProjectResponse = IProject

export type TGetSceneResponse = ISceneFull
export type TGetScenesResponse = ISceneFull[]
export type TCreateSceneResponse = ISceneFull
export type TUpdateSceneResponse = ISceneFull
export type TDeleteSceneResponse = ISceneFull

export type TGetFileResponse = Pick<BinaryFileData, 'id' | 'mimeType' | 'dataURL'>
export type TCreateFileResponse = Pick<BinaryFileData, 'id' | 'mimeType'>

// Payloads (query params, body, formData ...)
export type TQueryBase = {
  is_deleted?: boolean
  user_id?: string
}

export type TCreateProjectPayload = Pick<IProject, 'name'>
export type TUpdateProjectPayload = MarkOptional<
  Pick<IProject, 'name' | 'is_deleted'>,
  'name' | 'is_deleted'
>

export type TCreateScenePayload = Pick<
  ISceneFull,
  'name' | 'project_id' | 'appState' | 'elements'
> & { files: BinaryFileData[] }

export type TUpdateScenePayload = Partial<
  Pick<
    ISceneFull,
    | 'name'
    | 'project_id'
    // Excalidraw Data:
    | 'source'
    | 'version'
    | 'type'
    | 'appState'
    | 'elements'
  >
>

// Thunk args (payloads + any extra arguments)
export type TGetProjectThunkArg = Pick<IProject, 'id'>
export type TGetProjectsThunkArg = TQueryBase
export type TCreateProjectThunkArg = TCreateProjectPayload
export type TUpdateProjectThunkArg = TUpdateProjectPayload & Pick<IProject, 'id'>
export type TDeleteProjectThunkArg = Pick<IProject, 'id'>

export type TGetSceneThunkArg = Pick<ISceneFull, 'id'>
export type TGetScenesThunkArg = TQueryBase & { project_id?: string }
export type TCreateSceneThunkArg = TCreateScenePayload
export type TUpdateSceneThunkArg = TUpdateScenePayload & Pick<ISceneFull, 'id'>
export type TCopySceneThunkArg = TUpdateScenePayload & Pick<ISceneFull, 'id'>
export type TDeleteSceneThunkArg = Pick<ISceneFull, 'id'>

export type TGetFileThunkArg = {
  sceneId: ISceneFull['id']
  fileId: BinaryFileData['id']
}
export type TCreateFileThunkArg = {
  sceneId: ISceneFull['id']
  file: BinaryFileData
}

export type TAuthAsyncThunk = AsyncThunk<
  //
  // Returned: request Response
  | TGetProjectsResponse
  | TGetProjectsResponse
  | TCreateProjectResponse
  | TUpdateProjectResponse
  | TDeleteProjectResponse
  //
  | TGetScenesResponse
  | TGetScenesResponse
  | TCreateSceneResponse
  | TUpdateSceneResponse
  | TDeleteSceneResponse,
  //
  // ThunkArg: request Body / request URL params / all other necessary for making request
  | TGetProjectsThunkArg
  | TCreateProjectThunkArg
  | TUpdateProjectThunkArg
  //
  | TGetSceneThunkArg
  | TGetScenesThunkArg
  | TCreateSceneThunkArg
  | TUpdateSceneThunkArg
  //
  | TGetFileThunkArg
  | TCreateFileThunkArg,
  //
  // Config types:
  ThunkApiConfig
>
/**
 * Generic action that allowes to change any projects store value directly
 * (without creating separate action+reducer for any small thing to do)
 */
export const setObjectivePlusStore = createAction<Partial<IProjectsState>>('projects/setStore')

export type TPendingAction = ReturnType<TAuthAsyncThunk['pending']>
export type TRejectedAction = ReturnType<TAuthAsyncThunk['rejected']>
export type TFulfilledAction = ReturnType<TAuthAsyncThunk['fulfilled']>

export const resetRequestStatusAction = createAction('projects/resetRequestStatusAction')
export type TResetRequestStatusAction = ReturnType<typeof resetRequestStatusAction>

/** reset /projects API error (not auth) */
export const resetAPIError = createAction('projects/resetAPIError')
export type TResetAPIError = ReturnType<typeof resetAPIError>

export const discardProject = createAction<IProject['id']>('projects/discardProject')
export const isExportCtxReadyAction = createAction<boolean>('projects/isExportCtxReadyAction')

export const setInitialSceneLoadingIsPending = createAction<boolean>(
  'projects/setInitialLoadingSceneStatus'
)
export const setContinuousSceneUpdateIsPending = createAction<boolean>(
  'projects/setContinuousSceneUpdateIsPending'
)

export const loadProject = createAsyncThunk<
  TGetProjectResponse,
  TGetProjectThunkArg,
  ThunkApiConfig
>('projects/loadProject', ({ id }, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchProject(id, selectAuth(thunkApi.getState())))
)

export const loadProjects = createAsyncThunk<
  TGetProjectsResponse,
  TGetProjectsThunkArg,
  ThunkApiConfig
>('projects/loadProjects', (query, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchProjects(query, selectAuth(thunkApi.getState())))
)

export const loadCreateProject = createAsyncThunk<
  TCreateProjectResponse,
  TCreateProjectThunkArg,
  ThunkApiConfig
>('projects/loadCreateProject', (arg, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchCreateProject(arg, selectAuth(thunkApi.getState())))
)

export const loadUpdateProject = createAsyncThunk<
  TUpdateProjectResponse,
  TUpdateProjectThunkArg,
  ThunkApiConfig
>('projects/loadUpdateProject', ({ id, name, is_deleted }, thunkApi) =>
  safeAsyncThunk(thunkApi, () =>
    fetchUpdateProject(id, { name, is_deleted }, selectAuth(thunkApi.getState()))
  )
)

export const loadDeleteProject = createAsyncThunk<
  TDeleteProjectResponse,
  TDeleteProjectThunkArg,
  ThunkApiConfig
>('projects/loadDeleteProject', ({ id }, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchDeleteProject(id, selectAuth(thunkApi.getState())))
)

////////////////////////////////////////////////////////////////////////////////////////////////////

/** for Objective Plus logic (copy/duplicate/etc) */
export const loadScene = createAsyncThunk<TGetSceneResponse, TGetSceneThunkArg, ThunkApiConfig>(
  'projects/loadScene',
  (arg, thunkApi) =>
    safeAsyncThunk(thunkApi, () => fetchScene(arg.id, selectAuth(thunkApi.getState())))
)

/**
 * for Objective Plus logic (for generating thumbnail images)
 * @deprecated use {@link loadScenesFromLocalOrServer}
 * */
export const loadScenes = createAsyncThunk<TGetScenesResponse, TGetScenesThunkArg, ThunkApiConfig>(
  'projects/loadScenes',
  (query, thunkApi) =>
    safeAsyncThunk(thunkApi, () => fetchScenes(query, selectAuth(thunkApi.getState())))
)

const isSuccessListResponse = (v: any): v is TGetScenesResponse => 'length' in v
const isSuccessOneResponse = (v: any): v is TGetSceneResponse | TGetFileResponse => 'id' in v
const isInvalidateScene = (cached: ISceneSimplified | undefined, latest: ISceneSimplified) =>
  !cached ||
  new Date(cached.updated_at || cached.created_at) <
    new Date(latest.updated_at || latest.created_at)

const isInvalidateSceneRender = (
  cached: ISceneSimplified,
  latest: ISceneSimplified,
  cachedFileIds: BinaryFileData['id'][],
  latestFileIds: BinaryFileData['id'][]
) =>
  //@ts-ignore
  isInvalidateScene(cached, latest) || !new Set(cachedFileIds).isSupersetOf(new Set(latestFileIds))

/** for Objective Plus logic (for generating thumbnail images) */
export const loadScenesFromLocalOrServer = createAsyncThunk<
  TGetScenesResponse,
  TGetScenesThunkArg,
  ThunkApiConfig
>('projects/loadScenesFromLocalOrServer', async (query, thunkApi) => {
  const projectId = query.project_id
  const state = thunkApi.getState()
  const auth = selectAuth(state)

  // HACK circular imports
  const project: IProject | undefined = state.projects.projects?.find((p) => p.id === projectId)
  if (!project) return []

  const scenesRef = ensureMap(project.scenes.filter((s) => !s.is_deleted))
  const scenesRefInclDeleted = ensureMap(project.scenes)
  const scenesRepo = await ScenesRepository.getMany([...scenesRefInclDeleted.keys()])
  const scenesRepoMap = ensureMap(scenesRepo)

  const scenesRepoRemove = [...scenesRepoMap.values()].filter(
    (s) => !scenesRef.has(s.id) || project.is_deleted
  )
  if (scenesRepoRemove.length) {
    console.debug(
      `Removing scene from local: ${project.name}. `,
      scenesRepoRemove.map((s) => s.name)
    )
    await ScenesRepository.delMany(scenesRepoRemove.map((s) => s.id))
  }
  if (project.is_deleted) return []

  // scenes to invalidate in repository
  const scenesRepoInv = [...scenesRef.values()].filter((s) =>
    isInvalidateScene(scenesRepoMap.get(s.id), s)
  )
  const scenesRepoInvMap = ensureMap(scenesRepoInv)
  const scenesRepoPending = new Map<ISceneFull['id'], ISceneFull>([])

  if (scenesRepoInv.length === 1) {
    const oneSceneInv = scenesRepoInv[0]
    console.debug(
      `Fetch one scene info for project: ${project.name}. `,
      `Invalidate cache: ${oneSceneInv.name}`
    )

    // re-fetching 1 scene
    // (the most common case when coming from scene canvas back to projects dashaboard)
    const s = await safeAsyncThunk(thunkApi, () => fetchScene(oneSceneInv.id, auth))
    if (!isSuccessOneResponse(s)) return s
    scenesRepoPending.set(s.id, s)

    //
  } else if (scenesRepoInv.length > 1) {
    console.debug(
      `Fetch all scenes info for project: ${project.name}. Invalidate cache: `,
      scenesRepoInv.map((s) => s.name)
    )

    // re-fetching all scenes in case of many scene invalidation (not only required ids)
    // (simple implementation)
    const ss = await safeAsyncThunk(thunkApi, () =>
      fetchScenes({ project_id: query.project_id!, user_id: '' }, auth)
    )
    if (!isSuccessListResponse(ss)) return ss
    ss.forEach((s) => (scenesRepoInvMap.has(s.id) ? scenesRepoPending.set(s.id, s) : null))
  }

  // perform pending scenes
  if (scenesRepoPending.size) await ScenesRepository.setMany([...scenesRepoPending.entries()])

  const scenesRedux = ensureMap(state.projects.scenes || [])
  const scenesReduxInv = new Map<ISceneFull['id'], ISceneFull>([])
  for (const ref of scenesRef.values()) {
    // pending scene to invalidate in Redux always
    if (scenesRepoPending.has(ref.id)) scenesReduxInv.set(ref.id, scenesRepoPending.get(ref.id)!)
    // scene from Repo to invalidate only if Redux dont have it
    else if (scenesRepoMap.has(ref.id) && !scenesRedux.has(ref.id))
      scenesReduxInv.set(ref.id, scenesRepoMap.get(ref.id)!)
  }

  return ensureArray(scenesReduxInv)
})

const _RENDER_DEMENSIONS = {
  thumbnail: 500,
  export: 1500,
}
const _RENDER_BG_COLORS = {
  thumbnail: '#fdfcfd', // var(--gray-1)
  export: '#ffffff',
}

export const renderSceneAction = createAsyncThunk<
  TSceneRenderRedux,
  TSceneRenderKey,
  ThunkApiConfig
>('projects/renderSceneAction', async (key, thunkApi) => {
  const [kind, id] = key
  const state = thunkApi.getState()
  const sceneFullInfo = selectSceneFullInfo(id)(state)
  if (!sceneFullInfo) throw Error('RuntimeError: no sceneFullInfo')

  const sceneRenderRedux = selectSceneRender(key)(state)
  if (sceneRenderRedux && !isInvalidateSceneRender(sceneRenderRedux, sceneFullInfo, [], []))
    return sceneRenderRedux

  const sceneRenderRepo = await ScenesRenderRepository.get(key)
  if (sceneRenderRepo && !isInvalidateSceneRender(sceneRenderRepo, sceneFullInfo, [], []))
    return {
      ...sceneRenderRepo, // FIXME only wanted fields
      renderBlob: sceneRenderRepo.renderBlob ? undefined : undefined,
      renderWeekUrl: URL.createObjectURL(sceneRenderRepo.renderBlob),
    }

  // NOTE
  // we could render scene without files and re-render it when it will be ready
  // but it triggers so many re-renders...
  // therefore do no render until we got all files
  const requiredFileIds = getSceneVisibleFileIds(sceneFullInfo)
  const files: BinaryFileData[] = []
  for (const fileId of requiredFileIds) {
    const action = await thunkApi.dispatch(loadFileFromLocalOrServer({ sceneId: id, fileId }))
    if (!isSuccessOneResponse(action.payload)) continue
    files.push(action.payload)
  }

  console.debug('Exporting scene: ', kind, sceneFullInfo.name, 'Files: ', files)
  const blob = await exportToBlob({
    elements: sceneFullInfo.elements.filter((e) => !isObjectiveHidden(e)),
    appState: {
      ...sceneFullInfo.appState,
      exportBackground: true,
      viewBackgroundColor: _RENDER_BG_COLORS[kind],
    },
    maxWidthOrHeight: _RENDER_DEMENSIONS[kind],
    files: Object.fromEntries(ensureMap(files).entries()),
    mimeType: MIME_TYPES.png,
  })

  const freshRender = {
    ...sceneFullInfo, // FIXME only wanted fields
    renderKind: kind,
    renderMaxWidthOrHeight: _RENDER_DEMENSIONS[kind],
    renderMimeType: MIME_TYPES.png,
    renderFileIds: requiredFileIds,
  }

  await ScenesRenderRepository.set(key, {
    ...freshRender,
    renderBlob: blob,
  })

  return {
    ...freshRender,
    renderWeekUrl: URL.createObjectURL(blob),
  }
})

export const renderScenesListExportAction = createAsyncThunk<
  TSceneRenderRedux[],
  any,
  ThunkApiConfig
>('projects/renderScenesListExportAction', async ({ projectId }, thunkApi) => {
  const state = thunkApi.getState()
  const scenesFullInfo = selectScenesFullInfoList(projectId)(state)
  const res = await Promise.all(
    (scenesFullInfo || [])?.map((s) => {
      // TODO files
      // ...getSceneVisibleFileIds(s).map((fileId) =>
      //   dispatch(loadFileFromLocalOrServer({ sceneId: s.id, fileId })).unwrap()
      return thunkApi.dispatch(renderSceneAction(['export', s.id])).unwrap()
    })
  )
  return res
})

/** for ObjectiveOuterWrapper logic */
export const loadSceneInitial = createAsyncThunk<
  TGetSceneResponse,
  TGetSceneThunkArg,
  ThunkApiConfig
>('projects/loadSceneInitial', (arg, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchScene(arg.id, selectAuth(thunkApi.getState())))
)

/** for ObjectiveOuterWrapper logic */
export const loadSceneContinuos = createAsyncThunk<
  TGetSceneResponse,
  TGetSceneThunkArg,
  ThunkApiConfig
>('projects/loadSceneContinuous', (arg, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchScene(arg.id, selectAuth(thunkApi.getState())))
)

export const loadCreateScene = createAsyncThunk<
  TCreateSceneResponse,
  TCreateSceneThunkArg,
  ThunkApiConfig
>('projects/loadCreateScene', (arg, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchCreateScene(arg, selectAuth(thunkApi.getState())))
)

export const loadCopyScene = createAsyncThunk<
  TCreateSceneResponse,
  TCopySceneThunkArg,
  ThunkApiConfig
>('projects/loadCopyScene', ({ id, ...payload }, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchCopyScene(id, payload, selectAuth(thunkApi.getState())))
)

export const loadUpdateScene = createAsyncThunk<
  TUpdateSceneResponse,
  TUpdateSceneThunkArg,
  ThunkApiConfig
>('projects/loadUpdateScene', ({ id, ...payload }, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchUpdateScene(id, payload, selectAuth(thunkApi.getState())))
)

export const loadUpdateSceneContinuos = createAsyncThunk<
  TUpdateSceneResponse | null,
  TUpdateSceneThunkArg,
  ThunkApiConfig
>('projects/loadUpdateSceneContinuos', async ({ id, ...payload }, thunkApi) => {
  const pending = thunkApi.getState().projects.continuousSceneUpdateIsPending
  if (pending) return null

  thunkApi.dispatch(setContinuousSceneUpdateIsPending(true))
  const result = await safeAsyncThunk(thunkApi, () =>
    fetchUpdateScene(id, payload, selectAuth(thunkApi.getState()))
  )
  thunkApi.dispatch(setContinuousSceneUpdateIsPending(false))

  return result
})

export const loadDeleteScene = createAsyncThunk<
  TDeleteSceneResponse,
  TDeleteSceneThunkArg,
  ThunkApiConfig
>('projects/loadDeleteScene', ({ id }, thunkApi) =>
  safeAsyncThunk(thunkApi, () => fetchDeleteScene(id, selectAuth(thunkApi.getState())))
)

export const loadFile = createAsyncThunk<TGetFileResponse | null, TGetFileThunkArg, ThunkApiConfig>(
  'projects/loadFile',
  (arg, thunkApi) =>
    safeAsyncThunk(
      thunkApi,
      () => fetchFile(arg.sceneId, arg.fileId, selectAuth(thunkApi.getState())),
      {
        _404: (thunkApi, response) => {
          console.warn('Getting image from server fieled. Storyboard image is gone', response)
          return null
        },
      }
    )
)

export const loadFileFromLocalOrServer = createAsyncThunk<
  BinaryFileData | null,
  TGetFileThunkArg,
  ThunkApiConfig
>('projects/loadFileFromLocalOrServer', async ({ sceneId, fileId }, thunkApi) => {
  // UNUSED
  // const state = thunkApi.getState()
  // const sceneFileRedux = selectSceneFile(fileId)(state)
  // if (sceneFileRedux) return sceneFileRedux

  // REFRESH
  const sceneFileRepo = await ScenesFileRepository.get(fileId)
  if (sceneFileRepo) return sceneFileRepo

  console.debug('Getting image from server. ', { sceneId, fileId })
  const sceneFileServer = await safeAsyncThunk(
    thunkApi,
    () => fetchFile(sceneId, fileId, selectAuth(thunkApi.getState())),
    {
      _404: (thunkApi, response) => {
        console.warn('Getting image from server fieled. Storyboard image is gone', response)
        return null
      },
    }
  )
  if (!isSuccessOneResponse(sceneFileServer)) return sceneFileServer // ERROR or file is None

  const sceneFileServerFull: BinaryFileData = {
    ...sceneFileServer,
    created: 0, // ???
  }

  await ScenesFileRepository.set(fileId, sceneFileServerFull)
  return sceneFileServerFull
})

export const createFile = createAsyncThunk<
  TCreateFileResponse,
  TCreateFileThunkArg,
  ThunkApiConfig
>('projects/createFile', (arg, thunkApi) =>
  safeAsyncThunk(thunkApi, () =>
    fetchCreateFile(arg.sceneId, arg.file, selectAuth(thunkApi.getState()))
  )
)
