import { Text, TextField } from '@radix-ui/themes'
import { FC, FocusEvent, useRef, useState } from 'react'

type TEditableTextProps = {
  initialValue: string
  onSubmit: (value: string) => void
}

const EditableText: FC<TEditableTextProps> = ({ initialValue, onSubmit }) => {
  if (!initialValue) initialValue = 'Untitled Project'

  const [isEdit, setIsEdit] = useState(false)
  const [value, setValue] = useState(initialValue)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const onTextClick = () => {
    setTimeout(() => nameInputRef.current?.focus(), 0)
    setIsEdit(true)
  }

  const onInputFocus = (event: FocusEvent<HTMLInputElement, Element>) => {
    event.target.select()
  }

  const onDoneEditing = () => {
    setIsEdit(false)
    if (value !== initialValue) onSubmit(value)
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
        />
      </TextField.Root>
    )

  return (
    <Text className='editable-text' m={'1'} size={'1'} as={'p'} onClick={onTextClick}>
      {value}
    </Text>
  )
}

export default EditableText
