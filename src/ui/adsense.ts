const ADSENSE_SCRIPT_ID = 'google-adsense-script'
const ADSENSE_SCRIPT_URL = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'

let scriptRequested = false

export function loadAdSenseScript(client: string): void {
  if (
    (import.meta as ImportMeta & { vitest?: unknown }).vitest ||
    import.meta.env.MODE === 'test' ||
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    !client ||
    scriptRequested ||
    document.getElementById(ADSENSE_SCRIPT_ID)
  ) {
    return
  }

  scriptRequested = true
  const script = document.createElement('script')
  script.id = ADSENSE_SCRIPT_ID
  script.async = true
  script.src = `${ADSENSE_SCRIPT_URL}?client=${encodeURIComponent(client)}`
  document.head.appendChild(script)
}
