import { ArrowLeftIcon, SymbolIcon } from '@radix-ui/react-icons'
import { Flex, IconButton, Text } from '@radix-ui/themes'
import { FC, ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from '../../objective-plus/hooks/redux'
import { selectContinuousSceneUpdateIsPending } from '../../objective-plus/store/projects/reducer'
import { useExcalidrawAppState } from '../../../packages/excalidraw/components/App'
import { ToolButton } from '../../../packages/excalidraw/components/ToolButton'
import clsx from 'clsx'

const TopLeftUI: FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const isPending = useSelector(selectContinuousSceneUpdateIsPending)
  const appState = useExcalidrawAppState()

  return (
    <Flex gap={'2'}>
      <div className='undo-redo-buttons'>
        <ToolButton
          title={'Go back to projects'}
          type='button'
          icon={<ArrowLeftIcon />}
          onClick={() => navigate('/')}
          aria-label={'undefined'}
        />
      </div>
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
      <SymbolIcon
        color={'gray'}
        className={clsx({ 'fade-out': !isPending })} //
        // style={{ opacity: '20%' }}
      />
    </Flex>
  )
}

export default TopLeftUI
