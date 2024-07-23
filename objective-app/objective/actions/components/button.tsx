import { IconButton } from '@radix-ui/themes'
import clsx from 'clsx'
import { FC } from 'react'

type TRadixIconButtonProps = Parameters<typeof IconButton>[0]
type TPropsExtend = {
  toggled?: boolean
}

export const ExcalRadixIconButton: FC<TRadixIconButtonProps & TPropsExtend> = ({
  toggled,
  children,
  ...props
}) => {
  return (
    <IconButton
      className={
        props.disabled ? undefined : clsx('objective-toggled-icon-button', { toggled: toggled })
      }
      variant={'soft'}
      color={'gray'}
      radius={'none'}
      style={{
        height: 32,
        width: 32,
      }}
      {...props}
    >
      {children}
    </IconButton>
  )
}
