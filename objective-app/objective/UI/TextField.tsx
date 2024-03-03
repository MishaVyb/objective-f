import clsx from 'clsx'
import { KeyboardEvent, forwardRef, useImperativeHandle, useRef } from 'react'

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
}

/** Simplified version of /packages/excalidraw/components/TextField.tsx  */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ value, onChange, label, fullWidth, placeholder, readonly, onKeyDown, bgColor }, ref) => {
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
        </div>
      </div>
    )
  }
)

TextField.displayName = 'TextField'
