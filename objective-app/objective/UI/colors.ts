import { Badge, Code } from '@radix-ui/themes'
import { COLOR_PALETTE, ColorPickerColor } from '../../../packages/excalidraw/colors'
import { objectEntries } from '../utils/types'
import { ObjectiveMeta } from '../meta/_types'
import { getObjectiveBasis } from '../meta/_selectors'

export type TBadgeProps = Parameters<typeof Badge>[0]
export type TBadgeColor = TBadgeProps['color']
export type TCodeProps = Parameters<typeof Code>[0]
export type TCodeColor = TCodeProps['color']
export type TRadixColor = TBadgeColor | TCodeColor

const RADIX_COLORS = new Set([
  'gray',
  'gold',
  'bronze',
  'brown',
  'yellow',
  'amber',
  'orange',
  'tomato',
  'red',
  'ruby',
  'crimson',
  'pink',
  'plum',
  'purple',
  'violet',
  'iris',
  'indigo',
  'blue',
  'cyan',
  'teal',
  'jade',
  'green',
  'grass',
  'lime',
  'mint',
  'sky',
])

export const isRadixColor = (color: any): color is TBadgeColor => RADIX_COLORS.has(color)

export const getHexToColorMap = () => {
  const res = new Map<string, ColorPickerColor>([])
  for (const [colorName, colors] of objectEntries(COLOR_PALETTE)) {
    for (const hex of colors) {
      res.set(hex, colorName)
    }
  }
  return res
}
export const HEX_TO_COLOR = new Map(getHexToColorMap())

export const getRadixColor = (
  meta: ObjectiveMeta,
  opts?: { default: TRadixColor }
): TRadixColor | undefined => {
  const basis = getObjectiveBasis(meta)
  const color = basis && HEX_TO_COLOR.get(basis.backgroundColor)
  return color && isRadixColor(color) ? color : opts?.default
}
