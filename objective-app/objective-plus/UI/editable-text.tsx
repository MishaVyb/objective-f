import { Text, TextField } from '@radix-ui/themes'
import { FocusEvent, MouseEvent, forwardRef, useCallback, useEffect, useState } from 'react'

type TEditableTextProps = {
  initialValue: string
  defaultValue: string
  onSubmit: (value: string) => void
  toggled?: boolean
}

const EditableText = forwardRef<HTMLInputElement, TEditableTextProps>(
  ({ initialValue, defaultValue, onSubmit, toggled }, nameInputRef) => {
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
      const cleanValue = value || defaultValue
      if (cleanValue !== value) setValue(cleanValue)
      if (cleanValue !== initialValue) onSubmit(cleanValue)
    }

    return (
      <TextField.Root
        style={{
          width: 123, // TODO configurable

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
        onKeyUp={(e) => e.key === 'Enter' && onDoneEditing()}
        onClick={(e) => e.stopPropagation()}
      />
    )
  }
)

EditableText.displayName = 'EditableText'
export default EditableText
