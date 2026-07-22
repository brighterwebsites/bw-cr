import { useAppNav, type SeoTab } from '../lib/nav'
import { SeoPerformanceView } from '../features/seo/SeoPerformanceView'
import { SeoPagesView } from '../features/seo/SeoPagesView'

const TABS: { id: SeoTab; label: string }[] = [
  { id: 'performance', label: 'Performance' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'pages', label: 'Pages' },
]

export default function SeoPage() {
  const { seoTab, setSeoTab } = useAppNav()

  return (
    <div className="seo-shell">
      <nav className="seo-tabs" aria-label="SEO sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`seo-tab${seoTab === t.id ? ' seo-tab-on' : ''}`}
            onClick={() => setSeoTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="seo-tab-panel">
        {seoTab === 'performance' && <SeoPerformanceView />}
        {seoTab === 'opportunities' && (
          <div className="seo-stub card page-pad">
            <h2>Opportunities</h2>
            <p className="mutedtext">Phase B — cross-site opportunity pipeline from GSC page metrics.</p>
          </div>
        )}
        {seoTab === 'pages' && <SeoPagesView />}
      </div>
    </div>
  )
}
