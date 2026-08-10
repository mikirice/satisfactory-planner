import { useEffect } from 'react'

import {
  ADS_ENABLED,
  ADSENSE_CLIENT,
  AD_SLOT_SIZES,
  SLOT_RESULT_BANNER,
  SLOT_SIDEBAR_RECT,
} from '../config/ads.ts'
import { loadAdSenseScript } from './adsense.ts'
import { T } from './text.ts'

type AdSlotProps = {
  slot: keyof typeof AD_SLOT_SIZES
}

export function AdSlot({ slot }: AdSlotProps) {
  const slotId = slot === 'rect' ? SLOT_SIDEBAR_RECT : SLOT_RESULT_BANNER

  useEffect(() => {
    if (!ADS_ENABLED || !ADSENSE_CLIENT || !slotId) return

    loadAdSenseScript(ADSENSE_CLIENT)
    if (
      (import.meta as ImportMeta & { vitest?: unknown }).vitest ||
      import.meta.env.MODE === 'test' ||
      typeof window === 'undefined'
    ) {
      return
    }

    const adWindow = window as typeof window & { adsbygoogle?: Record<string, never>[] }
    adWindow.adsbygoogle ??= []
    adWindow.adsbygoogle.push({})
  }, [slotId])

  if (!ADS_ENABLED || !ADSENSE_CLIENT || !slotId) return null

  const size = AD_SLOT_SIZES[slot]

  return (
    <div
      className={`ad-slot ad-slot--${slot}`}
      aria-label={T.ads.label}
      style={{ width: size.width }}
    >
      <small className="ad-slot__label">{T.ads.label}</small>
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: size.width, height: size.height }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-full-width-responsive="false"
      />
    </div>
  )
}
