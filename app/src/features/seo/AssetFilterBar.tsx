import { useAppNav } from '../../lib/nav'
import type { Asset } from '../../lib/pipeline'
import { assetDotColor } from '../../lib/seo'

type Props = {
  assets: Asset[]
  selected: number | 'all'
  onSelect: (id: number | 'all') => void
  monitoredIds: number[]
}

export function AssetFilterBar({ assets, selected, onSelect, monitoredIds }: Props) {
  const { openAssetRecord } = useAppNav()
  const list = assets.filter((a) => monitoredIds.includes(a.id))

  return (
    <div className="seo-filter-bar">
      <button
        type="button"
        className={`fbtn${selected === 'all' ? ' fbtn-on' : ''}`}
        onClick={() => onSelect('all')}
      >
        All sites
      </button>
      {list.map((a) => (
        <button
          key={a.id}
          type="button"
          className={`fbtn seo-filter-asset${selected === a.id ? ' fbtn-on' : ''}`}
          onClick={() => onSelect(a.id)}
        >
          <span
            className="seo-dot"
            style={{ background: assetDotColor(a.id, monitoredIds) }}
          />
          {a.name || 'Untitled'}
        </button>
      ))}
      {selected !== 'all' && (
        <button
          type="button"
          className="btn-link seo-filter-open-asset"
          onClick={() => openAssetRecord(selected)}
        >
          Open asset →
        </button>
      )}
    </div>
  )
}
