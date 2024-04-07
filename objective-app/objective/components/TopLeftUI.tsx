import { ArrowLeftIcon, SymbolIcon } from '@radix-ui/react-icons'
import { Flex, IconButton, Text } from '@radix-ui/themes'
import { FC, ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from '../../objective-plus/hooks/redux'
import { selectIsPending } from '../../objective-plus/store/projects/reducer'
import { useExcalidrawAppState } from '../../../packages/excalidraw/components/App'
import { ToolButton } from '../../../packages/excalidraw/components/ToolButton'

const SHOW_SAVING_DEALOG_DELAY_MS = 1500

const TopLeftUI: FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const isPending = useSelector(selectIsPending)
  const [showSavingDialog, setShowSavingDialog] = useState(false)
  const appState = useExcalidrawAppState()

  useEffect(() => {
    if (isPending) {
      setShowSavingDialog(true)
      setTimeout(() => setShowSavingDialog(false), SHOW_SAVING_DEALOG_DELAY_MS)
    }
  }, [isPending])

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
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis', // FIXME doesn't work ...
        }}
      >
        {appState.name}
      </Text>
      {showSavingDialog && <SymbolIcon style={{ opacity: '10%' }} />}
    </Flex>
  )
}

export default TopLeftUI
