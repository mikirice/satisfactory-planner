import { useLocale } from '../i18n/index.ts'
import { aboutPagePath, articlesIndexPath, itemsIndexPath } from '../plan/item-pages.ts'
import { T } from './text.ts'

/**
 * 静的ページへの内部リンクは表示中の言語に合わせる（ja 以外は /en/ ミラー）。
 * パスの正典は src/plan/item-pages.ts。
 */
export function SiteFooter() {
  const { locale } = useLocale()
  return (
    <footer className="site-footer">
      <p>{T.footer.disclaimer}</p>
      <a href={articlesIndexPath(locale)}>{T.footer.articles}</a>
      <a href={itemsIndexPath(locale)}>{T.footer.items}</a>
      <a href={aboutPagePath(locale)}>{T.footer.about}</a>
      <a href="/privacy.html" target="_blank" rel="noreferrer">
        {T.footer.privacy}
      </a>
    </footer>
  )
}
