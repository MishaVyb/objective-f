import { FC } from 'react'

export const EasyInput: FC<{
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  powerCof?: number
}> = ({ min, max, step, value, onChange, powerCof }) => {
  powerCof = powerCof || 2
  step = step || 1

  // https://easings.net/#easeInQuad
  const getDisplayValue = (sliderValue: number): number =>
    Math.round(Math.pow(sliderValue, powerCof!))
  const getSliderValue = (displayValue: number): number =>
    Math.round(Math.pow(displayValue, 1 / powerCof!))

  return (
    <input
      type='range'
      min={getSliderValue(min)}
      max={getSliderValue(max)}
      step={step}
      onChange={(event) => onChange(getDisplayValue(Number(event.target.value)))}
      value={getSliderValue(value)}
    />
  )
}
