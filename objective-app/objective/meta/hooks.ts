import { useMemo } from 'react'
import { useApp, useExcalidrawElements } from '../../../packages/excalidraw/components/App'
import { useExcalidrawFiles } from '../components/ObjectiveInnerWrapper'
import { CameraMeta, ObjectiveImageElement } from './types'
import { InitializedExcalidrawImageElement } from '../../../packages/excalidraw/element/types'
import { isInitializedImageElement } from '../../../packages/excalidraw/element/typeChecks'

export const useCamerasImages = (cameras: readonly CameraMeta[]) => {
  const files = useExcalidrawFiles()
  const elements = useExcalidrawElements()
  const app = useApp()
  const elsMap = app.scene.getElementsMapIncludingDeleted()

  return useMemo(() => {
    const imageElementIds: string[] = []
    cameras.forEach((c) => imageElementIds.push(...c.relatedImages))
    const imageElements = imageElementIds
      .map((id) => elsMap.get(id))
      .filter(
        (e): e is InitializedExcalidrawImageElement =>
          !!e && !e.isDeleted && isInitializedImageElement(e)
      )
    const images: ObjectiveImageElement[] = []
    imageElements.forEach((e) =>
      files[e.fileId] ? images.push({ ...files[e.fileId], ...e }) : null
    )
    return images
  }, [files, elements, cameras])
}

export const useCameraImages = (camera: CameraMeta) => useCamerasImages([camera])
