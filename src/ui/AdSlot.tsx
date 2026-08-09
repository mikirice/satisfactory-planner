import { ADS_ENABLED, AD_SLOT_SIZES } from '../config/ads.ts'
import { T } from './text.ts'

type AdSlotProps = {
  slot: keyof typeof AD_SLOT_SIZES
}

export function AdSlot({ slot }: AdSlotProps) {
  if (!ADS_ENABLED) return null

  const size = AD_SLOT_SIZES[slot]

  return (
    <div
      className={`ad-slot ad-slot--${slot}`}
      aria-label={T.ads.label}
      style={{ width: size.width, height: size.height }}
    />
  )
}
