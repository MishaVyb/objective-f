import { Select } from '@radix-ui/themes'
import { FC } from 'react'
import { CAMERA_ASPECT_RATIOS_STR } from '../actionCamera'
import { numberToStr } from '../../elements/_math'

type TProps = {
  originalValue: number | undefined
  value: number | undefined
  updateData: (v: string) => void //
  hasBeenChanged: boolean
}

// TODO use for camera actions also
export const AspectRatioSelect: FC<TProps> = ({
  originalValue,
  value,
  updateData,
  hasBeenChanged,
}) => {
  const originalValueStr = numberToStr(originalValue)
  const valueStr = numberToStr(value)
  const isInitial = !hasBeenChanged

  const isOriginalPlaceholder = originalValueStr !== ''
  const isCustomPlaceholder =
    valueStr !== '' &&
    hasBeenChanged &&
    valueStr !== originalValueStr &&
    !CAMERA_ASPECT_RATIOS_STR.includes(valueStr)

  return (
    <Select.Root
      size={'1'}
      value={value === undefined || isInitial ? '' : valueStr}
      onValueChange={(v) => updateData(v)}
    >
      <Select.Trigger
        title={'Aspect ratio'}
        // @ts-ignore
        placeholder={'Aspect Ratio'}
        variant={'soft'}
        style={{
          height: 32, // HACK equals to button size
          width: 'min-content',
        }}
        radius={'none'}
      />
      <Select.Content position={'popper'} className='objective-select-content'>
        <Select.Group>
          <Select.Label>{'Pick aspect ratio'}</Select.Label>
          <Select.Group>
            {isOriginalPlaceholder || isCustomPlaceholder ? <Select.Separator /> : <></>}
            {isOriginalPlaceholder && (
              <Select.Item value={originalValueStr} className={'objective-select-item'}>
                {`${originalValueStr} (Original)`}
              </Select.Item>
            )}
            {isCustomPlaceholder && (
              <Select.Item value={valueStr} className={'objective-select-item'} disabled>
                {`${valueStr} (Custom)`}
              </Select.Item>
            )}
          </Select.Group>

          <Select.Separator />
          {CAMERA_ASPECT_RATIOS_STR.filter((v) => v !== originalValueStr).map((v) => (
            <Select.Item key={v} value={v} className={'objective-select-item'}>
              {v}
            </Select.Item>
          ))}
        </Select.Group>
      </Select.Content>
    </Select.Root>
  )
}
