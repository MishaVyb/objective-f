import {
  DashboardIcon,
  ListBulletIcon,
  ResetIcon,
  TextAlignBottomIcon,
  TextAlignTopIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { Badge, Box, Button, Flex, Heading, IconButton, Select, Text } from '@radix-ui/themes'
import clsx from 'clsx'
import { FC } from 'react'
import { useDispatch, useSelector } from '../hooks/redux'
import { loadProjects, loadUpdateProject, setObjectivePlusStore } from '../store/projects/actions'
import { selectScenesMeta, selectProject } from '../store/projects/selectors'
import { useParams } from 'react-router-dom'
import { ACCENT_COLOR } from '../constants'
import { selectAuth } from '../store/auth/reducer'
import { useViewport } from '../../objective/hooks/useVieport'
import { OrderMode } from '../store/projects/reducer'
import { ProjectExportDialog } from './scenes-export-dialog'
import { ScenesIcons, ScenesTable } from './scenes-list'

export const ScenesSectionHeader: FC = () => {
  const { width } = useViewport()
  const isSmallViewPort = width <= 768
  const { projectId } = useParams()
  const project = useSelector(selectProject(projectId))
  const meta = useSelector(selectScenesMeta())
  const dispatch = useDispatch()

  // TODO
  // load other user
  // const auth = useSelector(selectAuth)
  // const isMyProject = project?.user_id === auth.user.id
  // const user = useSelector(selectUser(project?.user_id))
  // useEffect(() => {
  //   if (!project) return
  //   if (!user) dispatch(loadUser({ id: project.user_id }))
  // }, [project, user])

  const onViewModeChange = (t: 'list' | 'icons') => {
    dispatch(setObjectivePlusStore({ scenesMeta: { ...meta, view: t } }))
  }
  const onOrderChange = (v: OrderMode) => {
    dispatch(setObjectivePlusStore({ scenesMeta: { ...meta, order: v } }))
  }

  return (
    <Flex
      style={{ width: '100%' }}
      justify={'between'}
      direction={isSmallViewPort ? 'column' : 'row'}
      align={'baseline'}
    >
      <Flex align={'baseline'} gap={'3'}>
        <Heading
          color={ACCENT_COLOR}
          weight={'light'} //
          ml={isSmallViewPort ? '2' : '5'}
          mb={'2'}
          style={{ textDecoration: 'underline', textDecorationThickness: '2px' }}
        >
          {project?.name}
          {/* TODO {user && <Badge>{user.username || user.email}</Badge>} */}
        </Heading>

        <ProjectExportDialog />
      </Flex>

      <Flex
        ml={isSmallViewPort ? '2' : '5'} //
        gap={'1'}
      >
        <Select.Root value={meta?.order} onValueChange={onOrderChange} size={'1'}>
          <Select.Trigger
            placeholder={'Scenes Order'}
            style={{ minWidth: 120 }} //
          />
          <Select.Content position={'popper'}>
            <Select.Group>
              <Select.Label>
                <Text>{'Scenes Order'}</Text>
              </Select.Label>
              <Select.Item value='alphabetical'>
                <Flex gap={'1'} mr={'1'}>
                  <Text>{'Alphabetical'}</Text>
                  <TextAlignBottomIcon style={{ marginTop: 0 }} />
                </Flex>
              </Select.Item>
              <Select.Separator />
              <Select.Item value='created'>
                <Flex gap={'1'} mr={'1'}>
                  <Text>{'Date Created'}</Text>
                  <TextAlignTopIcon style={{ marginTop: 3 }} />
                </Flex>
              </Select.Item>
              <Select.Item value='created.desc'>
                <Flex gap={'1'} mr={'1'}>
                  <Text>{'Date Created'}</Text>
                  <TextAlignBottomIcon style={{ marginTop: 0 }} />
                </Flex>
              </Select.Item>
              <Select.Separator />
              <Select.Item value='updated'>
                <Flex gap={'1'} mr={'1'}>
                  <Text>{'Date Modified'}</Text>
                  <TextAlignTopIcon style={{ marginTop: 3 }} />
                </Flex>
              </Select.Item>
              <Select.Item value='updated.desc'>
                <Flex gap={'1'} mr={'1'}>
                  <Text>{'Date Modified'}</Text>
                  <TextAlignBottomIcon style={{ marginTop: 0 }} />
                </Flex>
              </Select.Item>
            </Select.Group>
          </Select.Content>
        </Select.Root>
        <IconButton
          title='List View'
          className={clsx(
            'objective-plus-toggled-icon-button',
            { toggled: meta?.view === 'list' } //
          )}
          variant={'soft'}
          size={'1'}
          onClick={() => onViewModeChange('list')}
        >
          <ListBulletIcon />
        </IconButton>
        <IconButton
          title='Icons View'
          className={clsx(
            'objective-plus-toggled-icon-button',
            { toggled: meta?.view === 'icons' } //
          )}
          variant={'soft'}
          size={'1'}
          onClick={() => onViewModeChange('icons')}
        >
          <DashboardIcon />
        </IconButton>
      </Flex>
    </Flex>
  )
}

export const ScenesSection = () => {
  const { width } = useViewport()
  const isSmallViewPort = width <= 768
  const dispatch = useDispatch()
  const { projectId } = useParams()
  const project = useSelector(selectProject(projectId))
  const auth = useSelector(selectAuth)
  const meta = useSelector(selectScenesMeta())

  if (!project) return <></>

  const isMyProject = project.user_id === auth.user.id
  const onRecover = () =>
    dispatch(loadUpdateProject({ id: project.id, is_deleted: false }))
      .unwrap()
      .then(() => {
        dispatch(loadProjects({}))
      })

  if (project.is_deleted)
    return (
      <Flex
        style={{
          width: '100%',
          height: '100%',
        }}
        justify={'center'}
        align={'center'}
        direction={'column'}
        gap={'2'}
      >
        <Badge color='red'>
          <TrashIcon />
          {'This project has been deleted'}
        </Badge>
        {isMyProject && (
          <Button variant='outline' color='gray' size='1' onClick={onRecover}>
            <ResetIcon />
            {'Recover'}
          </Button>
        )}
      </Flex>
    )

  return (
    <Box p={isSmallViewPort ? '1' : '5'} style={{ width: '100%' }}>
      <ScenesSectionHeader />
      {meta?.view === 'list' ? <ScenesTable /> : <ScenesIcons />}
    </Box>
  )
}
