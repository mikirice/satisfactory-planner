import { T } from './text.ts'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>{T.footer.disclaimer}</p>
      <a href="/privacy.html" target="_blank" rel="noreferrer">
        {T.footer.privacy}
      </a>
    </footer>
  )
}
