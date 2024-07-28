import { Select } from '@radix-ui/themes'
import { FC } from 'react'
import { CAMERA_ASPECT_RATIOS_STR } from '../actionCamera'
import { numberToStr } from '../../elements/_math'
import { ExcalidrawImageElement } from '../../../../packages/excalidraw/element/types'

type TProps = {
  el: ExcalidrawImageElement
  value: number | undefined
  updateData: (v: string) => void //
  hasBeenChanged: boolean
}

// TODO use for camera actions also
export const AspectRatioSelect: FC<TProps> = ({ el, value, updateData, hasBeenChanged }) => {
  const originalValueStr = numberToStr(el.underlyingImageWidth / el.underlyingImageHeight)
  const valueStr = numberToStr(value)
  const isInitial = !hasBeenChanged

  console.log({ value })
  const isCustomPlaceholder =
    hasBeenChanged && valueStr !== originalValueStr && !CAMERA_ASPECT_RATIOS_STR.includes(valueStr)

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
      <Select.Content position={'popper'}>
        <Select.Group>
          <Select.Label>{'Pick aspect ratio'}</Select.Label>
          <Select.Separator />
          <Select.Group>
            <Select.Item value={originalValueStr} className={'objective-select-item'}>
              {`${originalValueStr} (Original)`}
            </Select.Item>
          </Select.Group>
          {isCustomPlaceholder && (
            <Select.Group>
              <Select.Item value={valueStr} className={'objective-select-item'} disabled>
                {`${valueStr} (Custom)`}
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
