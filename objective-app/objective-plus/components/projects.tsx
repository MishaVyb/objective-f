import {
  ClipboardCopyIcon,
  Cross1Icon,
  DotsVerticalIcon,
  FilePlusIcon,
  HomeIcon,
  Link2Icon,
  Pencil2Icon,
  ResetIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import {
  Button,
  Dialog,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
  Separator,
  Text,
  TextField,
  ScrollArea,
  Tabs,
  Strong,
  Spinner,
} from '@radix-ui/themes'
import clsx from 'clsx'
import { FC, useEffect, useState } from 'react'
import { useDispatch, useSelector } from '../hooks/redux'
import {
  discardProject,
  loadCreateProject,
  loadDeleteProject,
  loadProject,
  loadProjects,
  loadScene,
  loadScenes,
  loadUpdateProject,
} from '../store/projects/actions'
import {
  IProject,
  selectMyProjects,
  selectIsPending,
  selectProject,
  selectAllProjects,
  selectOtherProjects,
  selectMyDeletedProjects,
} from '../store/projects/reducer'
import { ACCENT_COLOR } from '../constants'
import { CustomDropDownMenuItem } from '../UI'
import { useNavigate, useParams } from 'react-router-dom'
import { selectAuth } from '../store/auth/reducer'

export const getProjectUrl = (id: IProject['id']) => `${window.location.host}/projects/${id}`

const ProjectNewItem: FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [name, setName] = useState('Untitled Project')
  const [open, setOpen] = useState(false)

  const onCreate = () => {
    setOpen(false)
    dispatch(loadCreateProject({ name }))
      .unwrap()
      .then(
        (project) =>
          dispatch(loadProjects({}))
            .unwrap()
            .then(() => navigate(`/projects/${project.id}`)) // select newly created project
      )
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button
          style={{
            opacity: '60%', //
            width: '96%',
          }}
          mt='4'
          variant={'outline'}
          radius={'none'}
        >
          <FilePlusIcon /> New Project
        </Button>
      </Dialog.Trigger>

      <Dialog.Content style={{ maxWidth: 450 }} onCloseAutoFocus={(e) => e.preventDefault()}>
        <Dialog.Title>Project</Dialog.Title>
        <Dialog.Description size='2' mb='4'>
          Create New Project
        </Dialog.Description>

        <label>
          <Text as='div' size='2' mb='1' weight='bold'>
            Name
          </Text>
          <TextField.Root
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Enter project name'
            onKeyUp={(e) => e.key === 'Enter' && onCreate()}
          />
        </label>

        <Flex gap='3' mt='4' justify='end'>
          <Dialog.Close>
            <Button variant='soft' color='gray'>
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button variant='soft' onClick={onCreate}>
              Create
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}

const ProjectItem: FC<{ project: IProject; toggled: boolean }> = ({ project, toggled }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [isRenameOpen, setRenameOpen] = useState(false)
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [name, setName] = useState(project.name)
  const auth = useSelector(selectAuth)
  const isMyProject = project.user_id === auth.user.id
  const url = getProjectUrl(project.id)

  const onClick = () => {
    navigate(`/projects/${project.id}`)
  }

  const onRenameActivate = () => {
    setRenameOpen(true)
  }

  const onRename = () => {
    setRenameOpen(false)
    dispatch(loadUpdateProject({ ...project, name: name || 'Untitled Project' }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  const onDelete = () => {
    dispatch(loadDeleteProject({ id: project.id }))
      .unwrap()
      .then(() => {
        dispatch(loadProjects({ is_deleted: false }))
        dispatch(loadProjects({ is_deleted: true }))
        navigate('/projects')
      })
  }

  const renameDialogComponent = (
    <Dialog.Root //
      open={isRenameOpen}
      onOpenChange={setRenameOpen}
    >
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title color={ACCENT_COLOR}>{'Project'}</Dialog.Title>
        <Dialog.Description size='2' mb='4'>
          {'Rename Project'}
        </Dialog.Description>

        <label>
          <Text as='div' size='1' mb='1' color={'gray'}>
            {'Name'}
          </Text>
          <TextField.Root
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Enter project name'
            onKeyUp={(e) => e.key === 'Enter' && onRename()}
          />
        </label>

        <Flex gap='3' mt='4' justify='end'>
          <Dialog.Close>
            <Button variant='soft' color='gray'>
              {'Cancel'}
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button variant={'soft'} onClick={() => onRename()}>
              {'Update'}
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )

  const shareDialogComponent = (
    <Dialog.Root open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
      <Dialog.Content style={{ width: 500, minHeight: 200 }}>
        <Heading size={'3'} color={ACCENT_COLOR}>
          {'Public project'}
        </Heading>
        <Separator size={'4'} mt={'1'} mb={'3'} />
        <Text as={'p'} size={'1'}>
          {'Everyone with a link '}
          <Strong>{'can view'}</Strong>
          {' any scene of that project, but can not edit them. '}
        </Text>
        <Flex gap={'1'} direction={'row'} justify={'between'} mt={'3'}>
          <TextField.Root style={{ flexGrow: 1 }} value={url} size='2' readOnly />
          <IconButton variant={'outline'} color={'gray'} ml={'auto'}>
            <ClipboardCopyIcon onClick={() => navigator.clipboard.writeText(url)} />
          </IconButton>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )

  const menu = (
    <DropdownMenu.Root onOpenChange={(v) => setMenuOpen(v)}>
      <DropdownMenu.Trigger>
        <IconButton variant={'ghost'} type={'button'} mt={'1'} mr={'4'} radius={'none'}>
          <DotsVerticalIcon />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        style={{ minWidth: 150 }}
        size={'1'}
        variant={'soft'} //
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <CustomDropDownMenuItem
          Icon={Pencil2Icon}
          text={'Rename'}
          onClick={onRenameActivate} //
        />
        <CustomDropDownMenuItem
          Icon={Link2Icon}
          text={'Share'}
          onClick={() => setShareDialogOpen(true)} //
        />
        <DropdownMenu.Separator />
        <CustomDropDownMenuItem Icon={TrashIcon} text={'Delete'} color='red' onClick={onDelete} />
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )

  const discardProjectComponent = (
    <IconButton
      title='Discard project'
      color={'gray'}
      variant={'ghost'}
      type={'button'}
      mt={'1'}
      mr={'4'}
      radius={'none'} //
      onClick={() => dispatch(discardProject(project.id))}
    >
      <Cross1Icon />
    </IconButton>
  )

  const onRecover = () =>
    dispatch(loadUpdateProject({ id: project.id, is_deleted: false }))
      .unwrap()
      .then(() => {
        dispatch(loadProjects({}))
      })
  const recoverProjectComponent = (
    <IconButton
      title='Recover project'
      color={'gray'}
      variant={'ghost'}
      type={'button'}
      mt={'1'}
      mr={'4'}
      radius={'none'} //
      onClick={onRecover}
    >
      <ResetIcon />
    </IconButton>
  )

  return (
    <Flex
      justify={'between'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          width: 'calc(100% - 45px)', // leave some space for options button
        }}
        className={clsx('projects-toggled-item', { toggled: toggled })}
        onClick={onClick}
      >
        <Text
          color={toggled ? ACCENT_COLOR : 'gray'}
          ml='1'
          mr={'auto'}
          style={{ userSelect: 'none' }}
        >
          {project.name}
        </Text>
      </div>
      {!project.is_deleted && isMyProject && (toggled || isHovered || isMenuOpen) && menu}
      {!project.is_deleted && isMyProject && renameDialogComponent}
      {!project.is_deleted && shareDialogComponent}
      {!project.is_deleted && !isMyProject && (toggled || isHovered) && discardProjectComponent}
      {project.is_deleted && (toggled || isHovered) && recoverProjectComponent}
    </Flex>
  )
}

export type ProjectsSectionTabs = 'my_projects' | 'other_projects' | 'deleted_projects'

const ProjectsSection = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const loading = useSelector(selectIsPending)

  const { projectId } = useParams()
  const currentProject = useSelector(selectProject(projectId))

  // [1] set projectId to path param, if it's not there
  const allProjects = useSelector(selectAllProjects())
  const defaultProject = allProjects[0] as IProject | undefined
  useEffect(() => {
    if (!projectId && defaultProject) navigate(`/projects/${defaultProject.id}`)
  }, [projectId, defaultProject])

  // [2] set tab depending on project from url
  const auth = useSelector(selectAuth)
  const isMyProject = currentProject?.user_id ? currentProject.user_id === auth.user.id : true
  const [tabValue, setTabValue] = useState<ProjectsSectionTabs>(
    isMyProject ? 'my_projects' : 'other_projects'
  )
  const [isTabWasChangedByUser, setIsTabWasChangedByUser] = useState(false)
  useEffect(() => {
    if (isTabWasChangedByUser) return
    if (isMyProject) setTabValue('my_projects')
    else setTabValue('other_projects')
  }, [isTabWasChangedByUser, isMyProject])

  // FIXME
  // here is might be double request for the same resource (for all scenes, and scene by id)
  // bu it's needed for now to invalidate external (other user's) scene data stored at local storage

  // load all user's projects (incl deleted)
  const myProjects = useSelector(selectMyProjects)
  const deletedProjects = useSelector(selectMyDeletedProjects)
  useEffect(() => {
    dispatch(loadProjects({ is_deleted: false }))
      .unwrap()
      .then((projects) => {
        // load full scenes info here for thumbnails render only
        dispatch(loadScenes({}))
      })
    dispatch(loadProjects({ is_deleted: true }))
  }, [dispatch])

  // load current project from path parameters
  // (means it's other user project access via external link)
  const otherProjects = useSelector(selectOtherProjects)
  useEffect(() => {
    if (projectId)
      dispatch(loadProject({ id: projectId }))
        .unwrap()
        .then((project) => {
          // Load full scenes info here for thumbnails render only
          if (!project.is_deleted)
            project.scenes.forEach((scene) => dispatch(loadScene({ id: scene.id })))
        })
  }, [projectId, dispatch])

  return (
    <Tabs.Root value={tabValue} style={{ height: '100%' }}>
      <Tabs.List>
        <Tabs.Trigger
          value='my_projects'
          onClick={() => {
            setIsTabWasChangedByUser(true)
            setTabValue('my_projects')
          }}
        >
          <HomeIcon />
          <Text ml='2'>{'My'}</Text>
        </Tabs.Trigger>
        <Tabs.Trigger
          value='other_projects'
          onClick={() => {
            setIsTabWasChangedByUser(true)
            setTabValue('other_projects')
          }}
        >
          <Link2Icon />
          <Text ml='2'>{'Others'}</Text>
        </Tabs.Trigger>
        <Tabs.Trigger
          value='deleted_projects'
          onClick={() => {
            setIsTabWasChangedByUser(true)
            setTabValue('deleted_projects')
          }}
        >
          <TrashIcon color='red' />
        </Tabs.Trigger>
        <Flex mt={'3'} style={{ width: '100%' }} justify={'end'}>
          {loading && <Spinner />}
        </Flex>
      </Tabs.List>

      <Flex
        pl='2'
        style={{
          height: 'calc(100% - 50px)',
          width: '25vw', // as scenes use `75vw`
          minWidth: 270,
        }}
        className='objective-box'
        direction={'column'}
        gap={'1'}
      >
        <Tabs.Content
          value='my_projects'
          style={{
            height: 'calc(100% - 20px)', //
          }}
        >
          <ScrollArea mt={'2'} mb={'2'} scrollbars='vertical'>
            {myProjects.map((p) => (
              <ProjectItem key={p.id} project={p} toggled={p.id === currentProject?.id} />
            ))}
            <ProjectNewItem />
          </ScrollArea>
        </Tabs.Content>
        <Tabs.Content value='other_projects' style={{ height: '100%' }}>
          <ScrollArea mt={'2'} scrollbars='vertical'>
            {otherProjects.map((p) => (
              <ProjectItem key={p.id} project={p} toggled={p.id === currentProject?.id} />
            ))}
          </ScrollArea>
        </Tabs.Content>
        <Tabs.Content value='deleted_projects' style={{ height: '100%' }}>
          <ScrollArea mt={'2'} scrollbars='vertical'>
            {deletedProjects.map((p) => (
              <ProjectItem key={p.id} project={p} toggled={p.id === currentProject?.id} />
            ))}
          </ScrollArea>
        </Tabs.Content>
      </Flex>
    </Tabs.Root>
  )
}

export default ProjectsSection
