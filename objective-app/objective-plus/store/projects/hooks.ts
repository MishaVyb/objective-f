import { useCallback } from 'react'
import { LocalData } from '../../../../excalidraw-app/data/LocalData'
import { FileId } from '../../../../packages/excalidraw/element/types'
import { ExcalidrawImperativeAPI } from '../../../../packages/excalidraw/types'
import { useDispatch, useSelector } from '../../hooks/redux'
import { loadFile } from './actions'
import { ISceneFull, ISceneSimplified, selectSceneFullInfo } from './reducer'
import { isInitializedImageElement } from '../../../../packages/excalidraw/element/typeChecks'

import { useEffect, useState } from 'react'
import { BinaryFileData } from '../../../../packages/excalidraw/types'
import { MIME_TYPES, exportToBlob } from '../../../../packages/excalidraw'
import { isObjectiveHidden } from '../../../objective/meta/_types'

export const getSceneVisibleFileIds = (scene: ISceneFull) =>
  scene.elements
    .filter(isInitializedImageElement)
    .filter((e) => !e.isDeleted && e.opacity)
    .map((e) => e.fileId)

export const useFilesFromLocalOrServer = () => {
  const dispatch = useDispatch()
  return useCallback(
    (
      sceneId: ISceneFull['id'],
      fileIds: FileId[],
      addFilesCallback: ExcalidrawImperativeAPI['addFiles']
    ) => {
      LocalData.fileStorage.getFiles(fileIds).then(({ loadedFiles, erroredFiles }) => {
        // DEBUG
        // console.debug(
        //   'Files loaded from IndexDB',
        //   loadedFiles,
        //   'Files not found at IndexDB (load from server)',
        //   [...erroredFiles.keys()]
        // )

        addFilesCallback(loadedFiles)

        for (const fileId of erroredFiles.keys()) {
          dispatch(loadFile({ sceneId: sceneId, fileId }))
            .unwrap()
            .then((value) => {
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
            })
        }
      })
    },
    []
  )
}

// TODO
const ScenesThumbnailURLCache = new Map<ISceneFull['id'], SVGSVGElement>([])

export const useSceneThumbnailURL = (scene: ISceneSimplified) => {
  const getFiles = useFilesFromLocalOrServer()
  const [_, setFiles] = useState<BinaryFileData[]>([])
  const sceneFullInfo = useSelector(selectSceneFullInfo(scene.id))
  const [thumbnailURL, setThumbnailURL] = useState('')

  const buildThumbnailURL = useCallback(
    (files: BinaryFileData[]) => {
      if (!sceneFullInfo) return

      exportToBlob({
        elements: sceneFullInfo.elements.filter((e) => !isObjectiveHidden(e)),
        appState: {
          ...sceneFullInfo.appState,
          exportBackground: true,
          viewBackgroundColor: '#fdfcfd', // var(--gray-1)
        },
        maxWidthOrHeight: 500,
        files: Object.fromEntries(files.map((f) => [f.id, f])),
        mimeType: MIME_TYPES.png,
      }).then((blob) => {
        const url = URL.createObjectURL(blob)
        setThumbnailURL(url)
      })
    },
    [sceneFullInfo]
  )

  const addFilesCallback = useCallback(
    (filesToAppend: BinaryFileData[]) =>
      setFiles((currentFiles) => {
        if (!sceneFullInfo) return []

        const nextFiles = [...currentFiles, ...filesToAppend]
        buildThumbnailURL(nextFiles)

        return nextFiles
      }),
    [sceneFullInfo, buildThumbnailURL]
  )

  // build thumbnail on mount
  useEffect(() => {
    if (!sceneFullInfo) return
    const fileIds = getSceneVisibleFileIds(sceneFullInfo)
    if (fileIds.length) getFiles(scene.id, fileIds, addFilesCallback)
    else buildThumbnailURL([])
  }, [sceneFullInfo])

  return thumbnailURL
}
