import type { Page } from '../../types'

export function PageIntro({ number, title, description }: { number: string; title: Page; description: string }) {
  return <div className="page-intro">
    <div><p className="eyebrow"><span className="eyebrow-mark" /> MÓDULO / {number}</p>
      <h1>{title}<span className="heading-dot" aria-hidden="true">.</span></h1><p className="page-description">{description}</p></div>
    <span className="edition-tag">ECOLOGÍSTICA · 1.4.0</span>
  </div>
}
