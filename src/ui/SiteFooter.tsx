import { T } from './text.ts'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>{T.footer.disclaimer}</p>
      <a href="/articles/">{T.footer.articles}</a>
      <a href="/items/">{T.footer.items}</a>
      <a href="/privacy.html" target="_blank" rel="noreferrer">
        {T.footer.privacy}
      </a>
    </footer>
  )
}
