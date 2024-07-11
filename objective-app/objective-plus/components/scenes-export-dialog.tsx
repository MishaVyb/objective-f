import { DownloadIcon } from '@radix-ui/react-icons'
import { Button, Dialog, Flex, Spinner } from '@radix-ui/themes'
import { FC, useEffect } from 'react'
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
import { isExportCtxReadyAction, renderScenesListExportAction } from '../store/projects/actions'

const ProjectExportPreview: FC = () => {
  const { projectId } = useParams()
  const ctx = useSelector(selectScenesExportCtx(projectId))
  const isReady = useSelector(selectIsExportCtxReady())
  if (isReady) console.log('Render PDF preview: ')

  return isReady ? (
    <PDFViewer width={400}>
      <ScenesDocument ctx={ctx} />
    </PDFViewer>
  ) : (
    <Flex
      style={{
        height: '100%',
        width: '100%',
      }}
      justify={'center'}
      align={'center'}
    >
      <Spinner />
    </Flex>
  )
}

const DownloadButton: FC = () => {
  const { projectId } = useParams()
  const ctx = useSelector(selectScenesExportCtx(projectId))
  const project = useSelector(selectProject(projectId))
  const isReady = useSelector(selectIsExportCtxReady())

  return isReady ? (
    <PDFDownloadLink
      document={<ScenesDocument ctx={ctx} />}
      fileName={`${project?.name}.objective.pdf`}
    >
      {({ blob, url, loading, error }) => (
        <Button variant={'soft'} loading={loading}>
          {'Download'}
        </Button>
      )}
    </PDFDownloadLink>
  ) : (
    <Button variant={'soft'} loading>
      {'Download'}
    </Button>
  )
}

export const ProjectExportDialogContent: FC = () => {
  const { projectId } = useParams()
  const dispatch = useDispatch()
  const project = useSelector(selectProject(projectId))
  const scenesFullInfo = useSelector(selectScenesFullInfoList(projectId))

  useEffect(() => {
    console.log('Prepare PDF context. ')
    dispatch(renderScenesListExportAction({ projectId }))
      .unwrap()
      .then(() => {
        setTimeout(() => dispatch(isExportCtxReadyAction(true)), 1500)
      })
    return () => {
      dispatch(isExportCtxReadyAction(false))
    }
  }, [dispatch, scenesFullInfo])

  if (!project) return null

  return (
    <>
      <Dialog.Title>{'Export Project'}</Dialog.Title>
      <Flex justify={'between'}>
        <Flex style={{ height: '60vh', width: '50%', overflowY: 'scroll' }}>
          <ScenesTableForExportDialog />
        </Flex>
        <Flex style={{ height: '60vh', width: '50%' }} justify={'center'}>
          <ProjectExportPreview />
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
