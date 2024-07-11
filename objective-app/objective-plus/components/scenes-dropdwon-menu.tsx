import {
  CardStackPlusIcon,
  DotsVerticalIcon,
  EnterIcon,
  FilePlusIcon,
  ImageIcon,
  Link2Icon,
  Pencil2Icon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { Dialog, DropdownMenu, Flex, IconButton, Text } from '@radix-ui/themes'
import { FC, useState } from 'react'
import { useDispatch, useSelector } from '../hooks/redux'
import {
  loadCopyScene,
  loadDeleteScene,
  loadProject,
  loadProjects,
  loadScene,
  loadUpdateScene,
} from '../store/projects/actions'
import { selectMyProjects } from '../store/projects/selectors'
import { useNavigate } from 'react-router-dom'
import { AppState } from '../../../packages/excalidraw/types'
import { CustomDropDownMenuItem } from '../UI'
import { MySceneShareOptions } from '../../objective/components/TopRightUI'
import { selectAuth } from '../store/auth/reducer'
import { buildSceneUrl } from './app'
import { IProject, ISceneSimplified } from '../store/projects/reducer'

export const SceneDropDownMenu: FC<{ scene: ISceneSimplified; onRename: () => void }> = ({
  scene,
  onRename,
}) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const projects = useSelector(selectMyProjects)
  const otherProjects = projects.filter((p) => p.id !== scene.project_id)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const auth = useSelector(selectAuth)
  const isMyScene = scene.user_id === auth.user.id

  const onDelete = () => {
    dispatch(loadDeleteScene({ id: scene.id }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  const onDuplicate = () => {
    // NOTE: do not change scene name here, used does it by himself if he wanna
    dispatch(loadCopyScene({ id: scene.id }))
      .unwrap()
      .then((scene) => {
        dispatch(loadProject({ id: scene.project_id }))
        dispatch(loadScene({ id: scene.id }))
      })
  }

  const onMoveTo = (p: IProject) => {
    dispatch(loadUpdateScene({ id: scene.id, project_id: p.id }))
      .unwrap()
      .then(() => dispatch(loadProjects({})))
  }

  const onCopyTo = (p: IProject) => {
    dispatch(loadCopyScene({ id: scene.id, project_id: p.id }))
      .unwrap()
      .then((scene) => {
        dispatch(loadProject({ id: scene.project_id }))
        dispatch(loadScene({ id: scene.id }))
          .unwrap()
          .then((scene) => navigate(`/projects/${scene.project_id}`))
      })
  }

  const onExportClick = () => {
    // TMP solution
    const appStateOverrides: Partial<AppState> = {
      openDialog: { name: 'imageExport' },
    }
    navigate(`/scenes/${scene.id}`, { state: { appStateOverrides } })
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <IconButton variant={'ghost'} type={'button'} mt={'1'} mr={'1'}>
            <DotsVerticalIcon />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          style={{ minWidth: 180, paddingTop: '5px', paddingBottom: '5px' }}
          size={'1'}
          variant={'soft'} //
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {isMyScene && (
            <CustomDropDownMenuItem Icon={Pencil2Icon} text={'Rename'} onClick={onRename} />
          )}
          {isMyScene && (
            <>
              <DropdownMenu.Separator />
              <CustomDropDownMenuItem
                Icon={FilePlusIcon}
                text={'Duplicate'}
                onClick={onDuplicate} //
              />

              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger disabled={!otherProjects.length}>
                  <Flex>
                    <EnterIcon style={{ marginTop: 2, marginRight: 7 }} />
                    <Text>{'Move To'}</Text>
                  </Flex>
                </DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent sideOffset={10} alignOffset={1} style={{ minWidth: 100 }}>
                  {otherProjects.map((p) => (
                    <DropdownMenu.Item key={p.id} onClick={() => onMoveTo(p)}>
                      {p.name}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
            </>
          )}
          <>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger disabled={!otherProjects.length}>
                <Flex>
                  <CardStackPlusIcon style={{ marginTop: 2, marginRight: 7 }} />
                  <Text>{'Copy To'}</Text>
                </Flex>
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent sideOffset={10} alignOffset={1} style={{ minWidth: 100 }}>
                {otherProjects.map((p) => (
                  <DropdownMenu.Item key={p.id} onClick={() => onCopyTo(p)}>
                    {p.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Separator />
          </>

          <CustomDropDownMenuItem
            Icon={Link2Icon}
            text={'Share'}
            onClick={() => setShareDialogOpen(true)} //
          />

          <CustomDropDownMenuItem
            Icon={ImageIcon}
            text={'Export'}
            onClick={onExportClick} //
          />
          {isMyScene && <DropdownMenu.Separator />}
          {isMyScene && (
            <CustomDropDownMenuItem
              Icon={TrashIcon}
              text={'Delete'}
              color='red'
              onClick={onDelete}
            />
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <Dialog.Root open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <Dialog.Content style={{ width: 500, minHeight: 200 }}>
          <MySceneShareOptions url={buildSceneUrl(scene.id)} />
        </Dialog.Content>
      </Dialog.Root>
    </div>
  )
}
