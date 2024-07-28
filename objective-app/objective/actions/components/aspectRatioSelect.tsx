import { Select } from '@radix-ui/themes'
import { FC } from 'react'
import { CAMERA_ASPECT_RATIOS_STR } from '../actionCamera'
import { numberToStr } from '../../elements/_math'

type TProps = {
  value: number | undefined
  updateData: (v: string) => void //
  hasBeenChanged: boolean
}

// TODO use for camera actions also
export const AspectRatioSelect: FC<TProps> = ({ value, updateData, hasBeenChanged }) => {
  const valueStr = numberToStr(value)
  const isCustom = hasBeenChanged && !CAMERA_ASPECT_RATIOS_STR.includes(valueStr)
  const isInitial = !hasBeenChanged

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
        }}
        radius={'none'}
      />
      <Select.Content position={'popper'}>
        <Select.Group>
          <Select.Label>{'Pick aspect ratio'}</Select.Label>
          <Select.Separator />
          {isCustom ? (
            <Select.Group>
              <Select.Item value={valueStr} className={'objective-select-item'} disabled>
                {valueStr}
              </Select.Item>
            </Select.Group>
          ) : (
            <Select.Group>
              <Select.Item value={'custom'} className={'objective-select-item'}>
                {'Custom'}
              </Select.Item>
            </Select.Group>
          )}

          <Select.Separator />
          {CAMERA_ASPECT_RATIOS_STR.map((v) => (
            <Select.Item key={v} value={v} className={'objective-select-item'}>
              {v}
            </Select.Item>
          ))}
        </Select.Group>
      </Select.Content>
    </Select.Root>
  )
}
