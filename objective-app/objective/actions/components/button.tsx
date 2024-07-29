import { Button, IconButton } from '@radix-ui/themes'
import clsx from 'clsx'
import { FC } from 'react'

type TRadixIconButtonProps = Parameters<typeof IconButton>[0]
type TPropsToggled = {
  toggled?: boolean
}
const EXCALIDRAW_BUTTON_SIZE = {
  height: 32,
  width: 32,
}

export const ExcalRadixButton: FC<TRadixIconButtonProps> = ({ children, ...props }) => {
  return (
    <Button
      variant={'soft'}
      color={'gray'}
      radius={'none'}
      style={props.size ? undefined : EXCALIDRAW_BUTTON_SIZE}
      {...props}
    >
      {children}
    </Button>
  )
}
export const ExcalRadixIconButton: FC<TRadixIconButtonProps> = ({ children, ...props }) => {
  return (
    <IconButton
      variant={'soft'}
      color={'gray'}
      radius={'none'}
      style={props.size ? undefined : EXCALIDRAW_BUTTON_SIZE}
      {...props}
    >
      {children}
    </IconButton>
  )
}

export const ExcalRadixToggledIconButton: FC<TRadixIconButtonProps & TPropsToggled> = ({
  toggled,
  children,
  ...props
}) => {
  if (props.color) throw new Error('Not Implemented. ') // CSS supports gray only...
  return (
    <ExcalRadixIconButton
      className={
        props.disabled ? undefined : clsx('objective-toggled-icon-button', { toggled: toggled })
      }
      {...props}
    >
      {children}
    </ExcalRadixIconButton>
  )
}
