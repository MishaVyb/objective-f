import { Text, TextField } from '@radix-ui/themes'
import React, { FocusEvent, MouseEvent, forwardRef, useCallback, useEffect, useState } from 'react'
import { KEYS } from '../../../packages/excalidraw/keys'

type TEditableTextProps = {
  initialValue: string
  defaultValue: string
  onSubmit: (value: string) => void
  toggled?: boolean
  style?: React.CSSProperties
}

const EditableTextInput = forwardRef<HTMLInputElement, TEditableTextProps>(
  ({ initialValue, defaultValue, onSubmit, toggled, style }, nameInputRef) => {
    const [value, setValue] = useState(initialValue)

    const onTextClick = useCallback(
      (e?: MouseEvent) => {
        if (e) e.stopPropagation()
        //@ts-ignore
        setTimeout(() => nameInputRef?.current?.focus(), 0)
      },
      [nameInputRef]
    )

    useEffect(() => {
      if (toggled) onTextClick()
    }, [toggled, onTextClick])

    const onInputFocus = (event: FocusEvent<HTMLInputElement, Element>) => {
      event.target.select()
    }

    const onDoneEditing = () => {
      try {
        ;(document.activeElement as HTMLElement | null)?.blur()
      } catch (e) {
        console.warn(e)
      }

      const cleanValue = value || defaultValue
      if (cleanValue !== value) setValue(cleanValue)
      if (cleanValue !== initialValue) onSubmit(cleanValue)
    }
    const onCancelEditing = () => {
      try {
        ;(document.activeElement as HTMLElement | null)?.blur()
      } catch (e) {
        console.warn(e)
      }
      setValue(initialValue)
    }

    return (
      <TextField.Root
        style={{
          // width: 123, // default size
          ...style,

          // NOTE: its not working for imputs
          // overflow: 'hidden',
          // whiteSpace: 'nowrap',
          // textOverflow: 'ellipsis',
        }}
        className='ghost-text-field'
        ref={nameInputRef}
        value={value}
        size={'1'}
        onChange={(e) => setValue(e.target.value)}
        onFocus={onInputFocus}
        onBlur={onDoneEditing}
        onKeyUp={(e) =>
          (e.key === KEYS.ENTER && onDoneEditing()) || (e.key === KEYS.ESCAPE && onCancelEditing())
        }
        onClick={(e) => e.stopPropagation()}
      />
    )
  }
)

EditableTextInput.displayName = 'EditableText'
export default EditableTextInput
