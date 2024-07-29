import { useCallback } from 'react'
import { LocalData } from '../../../../excalidraw-app/data/LocalData'
import { FileId } from '../../../../packages/excalidraw/element/types'
import { ExcalidrawImperativeAPI } from '../../../../packages/excalidraw/types'
import { useDispatch } from '../../hooks/redux'
import { loadFile } from './actions'
import { ISceneFull } from './reducer'
import { isInitializedImageElement } from '../../../../packages/excalidraw/element/typeChecks'

export const getSceneVisibleFileIds = (scene: ISceneFull) =>
  scene.elements
    .filter(isInitializedImageElement)
    .filter((e) => !e.isDeleted && e.opacity)
    .map((e) => e.fileId)

export const useFilesFromLocalOrServer = () => {
  const dispatch = useDispatch()
  return useCallback(
    async (
      sceneId: ISceneFull['id'],
      fileIds: FileId[],
      addFilesCallback: ExcalidrawImperativeAPI['addFiles']
    ) => {
      const { loadedFiles, erroredFiles } = await LocalData.fileStorage.getFiles(fileIds)
      // // DEBUG
      // console.debug(
      //   'Files loaded from IndexDB',
      //   loadedFiles,
      //   'Files not found at IndexDB (load from server)',
      //   [...erroredFiles.keys()]
      // )

      addFilesCallback(loadedFiles)

      for (const fileId of erroredFiles.keys()) {
        const value = await dispatch(loadFile({ sceneId: sceneId, fileId })).unwrap()
        if (value) {
          const newFiles = [
            {
              ...value,
              created: new Date().getTime(), // ??? it seems that it works
            },
          ]
          addFilesCallback(newFiles)

          // this file uploaded from server successfully,
          // so it's not errored anymore and avaliable for saving
          LocalData.fileStorage.resetErroredFile(fileId)
          LocalData.fileStorage.saveFiles({
            files: Object.fromEntries(newFiles.map((f) => [f.id, f])),
          })
        }
      }

      return
    },
    []
  )
}