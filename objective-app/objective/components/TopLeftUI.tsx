import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { Flex, Spinner, Text } from '@radix-ui/themes'
import { FC, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from '../../objective-plus/hooks/redux'
import {
  selectContinuousSceneUpdateIsPending,
  selectCurrentScene,
  selectIsMyScene,
} from '../../objective-plus/store/projects/selectors'
import { useExcalidrawAppState } from '../../../packages/excalidraw/components/App'
import { ToolButton } from '../../../packages/excalidraw/components/ToolButton'
import clsx from 'clsx'

const TopLeftUI: FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const isPending = useSelector(selectContinuousSceneUpdateIsPending)
  const appState = useExcalidrawAppState()
  const scene = useSelector(selectCurrentScene)
  const isMyScene = useSelector(selectIsMyScene)
  const secretProjectId = isMyScene ? scene?.project_id : null
  const projectId = (location.state?.projectId || secretProjectId) as string | null

  // do not go to project if we do not know it from state
  // because taking 'scene.project_id' is not secure
  // (user might share this scene, but not project entirely)
  const onGoBackClick = () =>
    projectId ? navigate(`/projects/${projectId}`) : navigate(`/projects`)

  return (
    <Flex gap={'2'}>
      {true && (
        <div className='undo-redo-buttons'>
          <ToolButton
            title={'Go back to projects'}
            type='button'
            icon={<ArrowLeftIcon />}
            onClick={onGoBackClick}
            aria-label={'undefined'}
          />
        </div>
      )}
      {children}
      <Text
        weight={'bold'}
        size={'1'}
        style={{
          maxWidth: 150,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {appState.name}
      </Text>
      <Spinner className={clsx({ 'fade-out': !isPending })} />
    </Flex>
  )
}

export default TopLeftUI
