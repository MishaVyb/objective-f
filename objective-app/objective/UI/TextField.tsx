import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { IconButton, TextField as RadixTextField } from '@radix-ui/themes'
import clsx from 'clsx'
import { KeyboardEvent, ReactNode, forwardRef, useImperativeHandle, useRef } from 'react'
import { ToolButton } from '../../../packages/excalidraw/components/ToolButton'

export type TextFieldProps = {
  value?: string

  onChange?: (value: string) => void
  onClick?: () => void
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void

  readonly?: boolean
  fullWidth?: boolean

  label?: string
  placeholder?: string

  bgColor?: any
  slotIcon?: ReactNode
  onSlotIconClick?: () => void
}

/** Simplified version of /packages/excalidraw/components/TextField.tsx  */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      value,
      onChange,
      label,
      fullWidth,
      placeholder,
      readonly,
      onKeyDown,
      bgColor,
      slotIcon,
      onSlotIconClick,
    },
    ref
  ) => {
    const innerRef = useRef<HTMLInputElement | null>(null)

    useImperativeHandle(ref, () => innerRef.current!)

    return (
      <div
        className={clsx(
          'ExcTextField',
          {
            'ExcTextField--fullWidth': fullWidth,
          },
          bgColor
        )}
        onClick={() => {
          innerRef.current?.focus()
        }}
      >
        <div className='ExcTextField__label'>{label}</div>
        <div
          className={clsx('ExcTextField__input', {
            'ExcTextField__input--readonly': readonly,
          })}
          style={
            bgColor ? { background: bgColor } : {} //
          }
        >
          <input
            readOnly={readonly}
            type='text'
            value={value}
            placeholder={placeholder}
            ref={innerRef}
            onChange={(event) => onChange?.(event.target.value)}
            onKeyDown={onKeyDown}
          />
          {slotIcon && (
            <IconButton
              variant={'ghost'}
              color={'gray'}
              size={'2'}
              onClick={(e) => {
                e.preventDefault()
                if (onSlotIconClick) onSlotIconClick()
              }}
            >
              {slotIcon}
            </IconButton>
          )}

          {/* <RadixTextField.Root>
            <RadixTextField.Slot>
              <MagnifyingGlassIcon height='16' width='16' />
            </RadixTextField.Slot>
            <RadixTextField.Input placeholder='Search the docs…' />
          </RadixTextField.Root> */}
        </div>
      </div>
    )
  }
)

TextField.displayName = 'TextField'
