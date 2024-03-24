import { Badge, badgePropDefs } from '@radix-ui/themes'
import { COLOR_PALETTE, ColorPickerColor } from '../../../packages/excalidraw/colors'
import { objectEntries } from '../meta/utils'

export type TBadgeProps = Parameters<typeof Badge>[0]
export type TRadixColor = TBadgeProps['color']

const RADIX_COLORS = new Set(badgePropDefs.color.values)
export const isRadixColor = (color: any): color is TRadixColor => RADIX_COLORS.has(color)

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
