import { DownloadIcon } from '@radix-ui/react-icons'
import { Button, Dialog, Flex, Spinner } from '@radix-ui/themes'
import { FC, useEffect, useState } from 'react'
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer'
import { useParams } from 'react-router-dom'
import {
  selectIsExportCtxReady,
  selectProject,
  selectScenesExportCtx,
  selectScenesFullInfoList,
} from '../store/projects/selectors'

import { useDispatch, useSelector } from '../hooks/redux'
import { ScenesTableForExportDialog } from './scenes-list'
import { ScenesDocument } from './scenes-pdf'
import { isExportCtxReadyAction, renderSceneAction } from '../store/projects/actions'

const ProjectExportPreview: FC = () => {
  const { projectId } = useParams()
  const ctx = useSelector(selectScenesExportCtx(projectId))

  return (
    <PDFViewer width={400}>
      <ScenesDocument ctx={ctx} />
    </PDFViewer>
  )
}

const PDFLink: FC = () => {
  console.log('!!! PDFLink !!!')
  const { projectId } = useParams()
  const ctx = useSelector(selectScenesExportCtx(projectId))
  // const project = useSelector(selectProject(projectId))

  return (
    <></>
    // <PDFDownloadLink
    //   document={<ScenesDocument ctx={ctx} />}
    //   fileName={`${project?.name}.objective.pdf`}
    // >
    //   {({ blob, url, loading, error }) => (
    //     <Button variant={'soft'} loading={loading}>
    //       {'Download'}
    //     </Button>
    //   )}
    // </PDFDownloadLink>
  )
}

const DownloadButton: FC = () => {
  const isReady = useSelector(selectIsExportCtxReady())
  // const isReady = true
  return isReady ? <PDFLink /> : <Button variant={'soft'} loading />
}

export const ProjectExportDialogContent: FC = () => {
  const { projectId } = useParams()
  const dispatch = useDispatch()
  const project = useSelector(selectProject(projectId))
  const scenesFullInfo = useSelector(selectScenesFullInfoList(projectId))
  // const [isExportCtxReady, setIsExportCtxReady] = useState(false)

  // useEffect(() => {
  //   Promise.all(
  //     (scenesFullInfo || [])?.map((s) => {
  //       return [
  //         dispatch(renderSceneAction(['export', s.id])).unwrap(),
  //         // TODO files
  //         // ...getSceneVisibleFileIds(s).map((fileId) =>
  //         //   dispatch(loadFileFromLocalOrServer({ sceneId: s.id, fileId })).unwrap()
  //         // ),
  //       ]
  //     })
  //   ).then((v) => {
  //     console.log('isExportCtxReady')
  //     dispatch(isExportCtxReadyAction(true))
  //     // setIsExportCtxReady(true)
  //   })
  // }, [dispatch, scenesFullInfo])

  if (!project) return

  return (
    <>
      <Dialog.Title>{'Export Project'}</Dialog.Title>
      <Flex justify={'between'}>
        <Flex style={{ height: '60vh', width: '50%', overflowY: 'scroll' }}>
          <ScenesTableForExportDialog />
        </Flex>
        <Flex style={{ height: '60vh', width: '50%' }} justify={'center'}>
          {/* <ProjectExportPreview /> */}
        </Flex>
      </Flex>

      <Flex gap='3' justify='center' mt={'4'}>
        <Dialog.Close>
          <Button variant='soft' color='gray'>
            {'Cancel'}
          </Button>
        </Dialog.Close>
        <Dialog.Close>
          <DownloadButton />
        </Dialog.Close>
      </Flex>
    </>
  )
}

export const ProjectExportDialog: FC = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button variant={'outline'} size={'1'}>
          <DownloadIcon />
          {'PDF'}
        </Button>
      </Dialog.Trigger>

      <Dialog.Content
        className='objective-plus-app'
        style={{
          height: '80vh', //
        }}
        width={'95%'}
        maxWidth={'95%'}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <ProjectExportDialogContent />
      </Dialog.Content>
    </Dialog.Root>
  )
}
