import { FC } from 'react'
import { Document, Page, Text, StyleSheet, Image, View } from '@react-pdf/renderer'

import { IProject, ISceneFull, ISceneSimplified } from '../store/projects/reducer'
import { TSceneRenderRedux } from '../utils/objective-local-db'
import { getShotCameraMetas } from '../../objective/meta/_selectors'
import { CameraMeta } from '../../objective/meta/_types'
import { getCameraMetaReprStr } from '../../objective/actions/actionCamera'
import { BinaryFileData } from '../../../packages/excalidraw/types'
import { isInitializedImageElement } from '../../../packages/excalidraw/element/typeChecks'

const styles = StyleSheet.create({
  body: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
  },
})

export type TSceneDocumentContext = {
  fullInfo?: ISceneFull
  renderInfo?: TSceneRenderRedux
  files?: BinaryFileData[]
}
export type TScenesDocumentContext = {
  project?: IProject
  scenesCtx?: TSceneDocumentContext[]
}

export const ScenesDocument: FC<{ ctx: TScenesDocumentContext }> = ({ ctx }) => {
  return (
    <Document>
      <ProjectCoverPage ctx={ctx} />
      {ctx.scenesCtx?.map((sceneCtx) =>
        sceneCtx?.fullInfo ? (
          <SceneItem key={sceneCtx.fullInfo.id} sceneId={sceneCtx.fullInfo.id} ctx={ctx} />
        ) : (
          <></>
        )
      )}
    </Document>
  )
}

const ProjectCoverPage: FC<{ ctx: TScenesDocumentContext }> = ({ ctx }) => {
  const project = ctx.project!
  return (
    <Page
      size='A4'
      style={{
        paddingTop: 250,
      }}
    >
      <Text
        style={{
          fontSize: 44,
          textAlign: 'center',
        }}
      >
        {project.name}
      </Text>
      <Text
        style={{
          fontSize: 18,
          textAlign: 'center',
          margin: 12,
        }}
      >
        {'TOP PLAN'}
      </Text>
      {/*<Text style={styles.author}>{project.user_id}</Text> TODO */}
      {/* TODO user.role */}
      {/* TODO scene to the link */}
      {/* TODO date */}
      {/* TODO footer (objective logo and link) */}
    </Page>
  )
}

const SceneItem: FC<{ sceneId: ISceneSimplified['id']; ctx: TScenesDocumentContext }> = ({
  sceneId,
  ctx,
}) => {
  const sceneCtx = ctx.scenesCtx?.find((ctx) => ctx.fullInfo?.id === sceneId)
  if (!sceneCtx || !sceneCtx.fullInfo) return <></>
  const scene = sceneCtx.fullInfo
  // if (scene.name !== 'AAA') return <></> // REMOVE

  return (
    <Page size='A4' style={styles.body}>
      <Text
        style={{
          fontSize: 18,
          textAlign: 'center',
          margin: 12,
        }}
      >
        {scene.name}
      </Text>
      <SceneTopPlan sceneCtx={sceneCtx} />
      {/* TODO */}
      {/* <SceneShotList sceneCtx={sceneCtx} /> */}
    </Page>
  )
}

const SceneTopPlan: FC<{ sceneCtx: TSceneDocumentContext }> = ({ sceneCtx }) => {
  const scene = sceneCtx.fullInfo!
  const render = sceneCtx.renderInfo
  if (!render) return <></>

  return <Image src={render.renderWeekUrl} />
}

const SceneShotList: FC<{ sceneCtx: TSceneDocumentContext }> = ({ sceneCtx }) => {
  const scene = sceneCtx.fullInfo!
  const render = sceneCtx.renderInfo
  if (!render) return <></>
  const cameras = getShotCameraMetas(scene.elements)

  return cameras.map((camera) => <SceneShotItem sceneCtx={sceneCtx} camera={camera} />)
}

const SceneShotItem: FC<{ sceneCtx: TSceneDocumentContext; camera: CameraMeta }> = ({
  sceneCtx,
  camera,
}) => {
  let summary = camera.name || ''
  if (camera.description) summary += `\n${camera.description}`
  const imageElementId = camera.relatedImages[0]
  const imageElement = sceneCtx.fullInfo?.elements.find((e) => e.id == imageElementId)
  const fileId = imageElement && isInitializedImageElement(imageElement) && imageElement.fileId
  const storyboard = sceneCtx?.files?.find((f) => f.id == fileId)

  return (
    <View
      style={{
        border: '2px solid gray', //
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
      }}
    >
      <View
        style={{
          border: '1px solid gray', //
        }}
      >
        {storyboard ? <Image src={storyboard.dataURL} /> : <></>}
      </View>

      <View
        style={{
          border: '1px solid gray', //
        }}
      >
        <Text
          style={{
            fontSize: 14,
          }}
        >
          {getCameraMetaReprStr(camera, { name: '' })}
        </Text>
      </View>

      <View
        style={{
          border: '1px solid gray', //
        }}
      >
        <Text
          style={{
            fontSize: 14,
          }}
        >
          {summary}
        </Text>
      </View>
    </View>
  )
}
