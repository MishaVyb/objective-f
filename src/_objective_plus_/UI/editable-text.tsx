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
    const [isEdit, setIsEdit] = useState(toggled)
    const [value, setValue] = useState(initialValue)

    const onTextClick = useCallback(
      (e?: MouseEvent) => {
        if (e) e.stopPropagation()
        //@ts-ignore
        setTimeout(() => nameInputRef?.current?.focus(), 0)
        setIsEdit(true)
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
      setIsEdit(false)

      const cleanValue = value || defaultValue
      if (cleanValue !== value) setValue(cleanValue)
      if (cleanValue !== initialValue) onSubmit(cleanValue)
    }

    if (isEdit)
      return (
        <TextField.Root>
          <TextField.Input
            ref={nameInputRef}
            value={value}
            size={'1'}
            onChange={(e) => setValue(e.target.value)}
            onFocus={onInputFocus}
            onBlur={onDoneEditing}
            onKeyUp={(e) => e.key === 'Enter' && onDoneEditing()}
            onClick={(e) => e.stopPropagation()}
          />
        </TextField.Root>
      )

    return (
      <Text className='editable-text' m={'1'} size={'1'} as={'p'} onClick={(e) => onTextClick(e)}>
        {value}
      </Text>
    )
  }
)

EditableText.displayName = 'EditableText'
export default EditableText
