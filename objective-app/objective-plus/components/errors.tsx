import { FC, useEffect, useState } from 'react'

import { Blockquote, Callout, Flex, IconButton } from '@radix-ui/themes'
import clsx from 'clsx'
import { Cross1Icon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { useDispatch } from '../hooks/redux'
import { resetAPIError } from '../store/projects/actions'
import { APIError } from '../store/projects/reducer'

export const ERROR_REPR_DELTA_SEC = 5 * 1000

export const ObjectiveErrorCollout: FC<{ errors: APIError[]; className?: string }> = ({
  errors,
  className,
}) => {
  const disparch = useDispatch()
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    if (errors.length) {
      timeout = setTimeout(() => setIsHidden(true), ERROR_REPR_DELTA_SEC)
    }
    return () => {
      if (timeout) clearTimeout(timeout)
      setIsHidden(false)
    }
  }, [errors])

  if (!errors.length) return null

  return (
    <Flex className={className} justify={'center'} m={'4'} >
      {errors.map((e) => (
        <Callout.Root
          className={clsx({ 'fade-out': e.renderOpts?.noHide ? false : isHidden })}
          color={e.renderOpts?.color || 'red'}
          role='alert'
          size={'1'}
          key={e.message}
          style={{
            marginTop: 'auto',
            marginBottom: 'auto',
            height: 'min-content',
          }}
        >
          {/* <Callout.Icon>
          </Callout.Icon> */}
          <Flex justify={'between'} style={{ minWidth: 300 }}>

            <Callout.Text size={'1'} weight={'bold'}>{e?.message}</Callout.Text>
            <IconButton onClick={() => disparch(resetAPIError())} color='gray' variant='ghost'>
              <Cross1Icon />
            </IconButton>
          </Flex>

          {e.detail && (
            <Blockquote
              color='gray'
              size='1'
              style={{
                width: 400,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              {e.detail}
            </Blockquote>
          )}
        </Callout.Root>
      ))}
    </Flex>
  )
}
