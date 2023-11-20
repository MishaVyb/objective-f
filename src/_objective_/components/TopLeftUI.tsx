import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { Flex, IconButton, Text } from '@radix-ui/themes'
import { FC, ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from '../../_objective_plus_/hooks/redux'
import { selectIsPending } from '../../_objective_plus_/store/projects/reducer'

const SHOW_SAVING_DEALOG_DELAY_MS = 1500

const TopLeftUI: FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const isPending = useSelector(selectIsPending)
  const [showSavingDialog, setShowSavingDialog] = useState(false)

  useEffect(() => {
    if (isPending) {
      setShowSavingDialog(true)
      setTimeout(() => setShowSavingDialog(false), SHOW_SAVING_DEALOG_DELAY_MS)
    }
  }, [isPending])

  return (
    <Flex gap={'2'} direction={'column'}>
      <Flex gap={'2'}>
        <IconButton
          variant={'outline'}
          radius={'large'}
          color={'gray'}
          highContrast
          onClick={() => navigate('/')}
        >
          <ArrowLeftIcon />
        </IconButton>
        {showSavingDialog && (
          <>
            <Text style={{ opacity: '15%' }} color={'gray'} weight={'bold'} size={'1'}>
              Saving ...
            </Text>
          </>
        )}
      </Flex>
      {children}
    </Flex>
  )
}

export default TopLeftUI
