import { Flex } from '@radix-ui/themes'
import clsx, { ClassValue } from 'clsx'
import { FC, ReactNode } from 'react'

/**
 *
 * Layout:
 * - takes all avaliable space (vertically by 100vh and horizontally by CSS default)
 * - locates children element at center (both vertically and horizontally )
 */
export const RootBox: FC<{ children?: ReactNode }> = ({ children }) => {
  return (
    <Flex style={{ height: '100vh' }} justify={'center'} align={'center'}>
      {children}
    </Flex>
  )
}

/**
 * ### Custom Card Style
 * We do not use radix-ui Card, to more style control
 *
 * ### Card Wide:
 * We could use radix-ui `Section` component
 * but is's size\width options do not work properly
 * so we use CSS directly to manipulate with section `width`
 *
 * ### Card Hight:
 * Depending by content (children) hight (default CSS behavior)
 */
export const ObjectiveCard: FC<{ extraClass?: ClassValue; children?: ReactNode }> = ({
  extraClass,
  children,
}) => {
  return (
    <Flex
      style={{ minWidth: 400 }}
      className={clsx('objective-card', extraClass)}
      p={'9'}
      justify={'center'}
      direction={'column'}
      gap={'1'}
    >
      {children}
    </Flex>
  )
}
