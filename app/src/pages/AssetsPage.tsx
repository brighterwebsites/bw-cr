import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CompetitorSnapshotsSection } from '../features/assets/CompetitorSnapshotsSection'
import { GscIntegrationSection } from '../features/assets/GscIntegrationSection'
import { WpIntegrationSection } from '../features/assets/WpIntegrationSection'
import { useData } from '../lib/data'
import { useAppNav } from '../lib/nav'
import type { Asset, Customer, Project } from '../lib/pipeline'

type AssetType = Asset['asset_type']
type ConnectionStatus = Asset['gsc_status']

const DEFAULT_LIST_TYPES: AssetType[] = ['managed_website', 'staging']

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  managed_website: 'Managed website',
  website: 'Website (proposal)',
  staging: 'Staging',
  other: 'Other',
}

type AssetForm = {
  name: string
  asset_url: string
  asset_type: AssetType
  customer_id: number | ''
  project_id: number | ''
  conversion_event_name: string
}

const emptyForm = (customerId: number | '' = ''): AssetForm => ({
  name: '',
  asset_url: '',
  asset_type: 'managed_website',
  customer_id: customerId,
  project_id: '',
  conversion_event_name: '',
})

function formFromAsset(a: Asset): AssetForm {
  return {
    name: a.name,
    asset_url: a.asset_url,
    asset_type: a.asset_type,
    customer_id: a.customer_id,
    project_id: a.project_id ?? '',
    conversion_event_name: a.conversion_event_name,
  }
}

function urlHref(url: string) {
  if (!url.trim()) return ''
  return url.startsWith('http') ? url : `https://${url}`
}

function customerName(customers: Customer[], id: number) {
  return customers.find((c) => c.id === id)?.business_name ?? `Customer #${id}`
}

export default function AssetsPage() {
  const { assets, customers, projects, loading, error, updateAsset, createAsset } = useData()
  const { assetsIntent, consumeAssetsIntent } = useAppNav()
  const [search, setSearch] = useState('')
  const [showAllTypes, setShowAllTypes] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [createDraft, setCreateDraft] = useState<AssetForm | null>(null)
  const [openIntegrationsFor, setOpenIntegrationsFor] = useState<number | null>(null)
  const [gscNotice, setGscNotice] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gsc = params.get('gsc')
    const assetParam = params.get('asset_id')
    if (!gsc || !assetParam) return
    const aid = Number(assetParam)
    if (!Number.isFinite(aid)) return
    setCreating(false)
    setCreateDraft(null)
    setSelectedId(aid)
    setOpenIntegrationsFor(aid)
    if (gsc === 'connected') setGscNotice('GSC connected — refresh metrics or confirm property URL.')
    else if (gsc === 'error') {
      setGscNotice(`GSC setup issue: ${params.get('message') ?? 'unknown error'}`)
    }
    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  useEffect(() => {
    if (!assetsIntent) return
    if (assetsIntent.mode === 'open') {
      setCreating(false)
      setCreateDraft(null)
      setSelectedId(assetsIntent.assetId)
    } else {
      setCreating(true)
      setCreateDraft({
        ...emptyForm(assetsIntent.customerId),
        project_id: assetsIntent.projectId,
      })
      setSelectedId(null)
    }
    consumeAssetsIntent()
  }, [assetsIntent, consumeAssetsIntent])

  const customerById = useMemo(() => {
    const map = new Map<number, Customer>()
    for (const c of customers) map.set(c.id, c)
    return map
  }, [customers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = showAllTypes
      ? assets
      : assets.filter((a) => DEFAULT_LIST_TYPES.includes(a.asset_type))
    if (q) {
      list = list.filter((a) => {
        const cust = customerById.get(a.customer_id)?.business_name ?? ''
        return (
          a.name.toLowerCase().includes(q) ||
          a.asset_url.toLowerCase().includes(q) ||
          cust.toLowerCase().includes(q) ||
          a.asset_type.toLowerCase().includes(q) ||
          (ASSET_TYPE_LABELS[a.asset_type] ?? '').toLowerCase().includes(q)
        )
      })
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [assets, search, customerById, showAllTypes])

  const selected = assets.find((a) => a.id === selectedId) ?? null

  useEffect(() => {
    if (creating) return
    if (selectedId != null && !assets.some((a) => a.id === selectedId)) {
      setSelectedId(null)
    }
  }, [assets, selectedId, creating])

  if (loading) return <div className="page-pad">Loading assets…</div>
  if (error) return <div className="page-pad page-error">{error}</div>

  return (
    <>
      {gscNotice && (
        <div className="assets-gsc-notice login-ok">
          {gscNotice}{' '}
          <button type="button" className="btn-link" onClick={() => setGscNotice(null)}>
            dismiss
          </button>
        </div>
      )}
    <div className="master-detail">
      <div className="master-list">
        <div className="master-list-search">
          <input
            placeholder="Search name, URL, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary master-list-new"
            onClick={() => {
              setCreateDraft(emptyForm())
              setCreating(true)
              setSelectedId(null)
            }}
          >
            + New asset
          </button>
        </div>
        <label className="master-list-filter">
          <input
            type="checkbox"
            checked={showAllTypes}
            onChange={(e) => setShowAllTypes(e.target.checked)}
          />
          Show all types
        </label>
        <div className="master-list-items">
          {filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`master-item ${!creating && selectedId === a.id ? 'master-item-on' : ''}`}
              onClick={() => {
                setCreating(false)
                setCreateDraft(null)
                setSelectedId(a.id)
              }}
            >
              <div className="master-item-name">{a.name || 'Untitled asset'}</div>
              {a.asset_url && <div className="master-item-sub">{a.asset_url}</div>}
              <div className="master-item-stage">
                <span className={`asset-type-pill asset-type-${a.asset_type}`}>
                  {ASSET_TYPE_LABELS[a.asset_type] ?? a.asset_type}
                </span>
                <span className="mutedtext" style={{ marginLeft: 6 }}>
                  {customerName(customers, a.customer_id)}
                </span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <div className="master-list-empty">No assets found.</div>}
        </div>
      </div>

      <div className="detail-area">
        {creating && createDraft && (
          <AssetDetail
            mode="create"
            initial={createDraft}
            customers={customers}
            projects={projects}
            onCancel={() => {
              setCreating(false)
              setCreateDraft(null)
            }}
            onCreate={async (form) => {
              const row = await createAsset({
                name: form.name,
                asset_url: form.asset_url,
                asset_type: form.asset_type,
                customer_id: form.customer_id as number,
                project_id: form.project_id === '' ? null : form.project_id,
                conversion_event_name: form.conversion_event_name,
              })
              setCreating(false)
              setCreateDraft(null)
              setSelectedId(row.id)
            }}
          />
        )}
        {!creating && !selected && <div className="detail-empty">Select an asset</div>}
        {!creating && selected && (
          <AssetDetail
            key={selected.id}
            mode="edit"
            asset={selected}
            assetId={selected.id}
            initial={formFromAsset(selected)}
            customers={customers}
            projects={projects}
            openIntegrations={openIntegrationsFor === selected.id}
            onSave={async (form) => {
              await updateAsset(selected.id, {
                name: form.name,
                asset_url: form.asset_url,
                asset_type: form.asset_type,
                customer_id: form.customer_id as number,
                project_id: form.project_id === '' ? null : form.project_id,
                conversion_event_name: form.conversion_event_name,
              })
            }}
          />
        )}
      </div>
    </div>
    </>
  )
}

function AssetDetail({
  mode,
  asset,
  assetId,
  initial,
  customers,
  projects,
  openIntegrations,
  onSave,
  onCreate,
  onCancel,
}: {
  mode: 'edit' | 'create'
  asset?: Asset
  assetId?: number
  initial: AssetForm
  customers: Customer[]
  projects: Project[]
  openIntegrations?: boolean
  onSave?: (form: AssetForm) => Promise<void>
  onCreate?: (form: AssetForm) => Promise<void>
  onCancel?: () => void
}) {
  const { assets } = useData()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [integrationsOpen, setIntegrationsOpen] = useState(false)
  const [runPanelOpen, setRunPanelOpen] = useState(false)

  useEffect(() => {
    setForm(initial)
    setErr(null)
    setOk(false)
    setIntegrationsOpen(Boolean(openIntegrations))
    setRunPanelOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on assetId / mode only
  }, [assetId, mode, openIntegrations])

  const projectsForCustomer = useMemo(() => {
    if (form.customer_id === '') return []
    return projects.filter((p) => p.customer_id === form.customer_id)
  }, [projects, form.customer_id])

  function set<K extends keyof AssetForm>(key: K, value: AssetForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'customer_id') {
        const custId = value as AssetForm['customer_id']
        const stillValid =
          next.project_id !== '' &&
          projects.some((p) => p.id === next.project_id && p.customer_id === custId)
        if (!stillValid) next.project_id = ''
      }
      return next
    })
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setErr('Name is required.')
      return
    }
    if (form.customer_id === '') {
      setErr('Customer is required.')
      return
    }
    setSaving(true)
    setErr(null)
    try {
      if (mode === 'create') {
        await onCreate?.(form)
      } else {
        await onSave?.(form)
        setOk(true)
        setTimeout(() => setOk(false), 2000)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  return (
    <div className={`jdp asset-detail-layout ${runPanelOpen ? 'asset-detail-has-panel' : ''}`}>
      <div className="jdp-header">
        <div className="jdp-title">
          <div className="jdp-name">{mode === 'create' ? 'New asset' : form.name || 'Asset'}</div>
          {mode === 'edit' && assetId != null && <span className="mutedtext">#{assetId}</span>}
        </div>
        <div className="jdp-header-actions">
          {mode === 'create' && (
            <button type="button" className="btn btn-gray" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || (mode === 'edit' && !dirty)}
            onClick={() => void handleSave()}
          >
            {saving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </div>

      {err && (
        <div className="login-error" style={{ marginBottom: 8 }}>
          {err}
        </div>
      )}
      {ok && (
        <div className="login-ok" style={{ marginBottom: 8 }}>
          Saved
        </div>
      )}

      <div className="jdp-section">
        <div className="jdp-section-title">Asset details</div>
        <div className="jdp-2col">
          <div className="jdp-field jdp-full">
            <span className="jdp-label">Name</span>
            <input
              className="jdp-input"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Type</span>
            <select
              className="jdp-input"
              value={form.asset_type}
              onChange={(e) => set('asset_type', e.target.value as AssetType)}
            >
              {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map((t) => (
                <option key={t} value={t}>
                  {ASSET_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Conversion event</span>
            <input
              className="jdp-input"
              value={form.conversion_event_name}
              onChange={(e) => set('conversion_event_name', e.target.value)}
              placeholder="e.g. generate_lead"
            />
          </div>
          <div className="jdp-field jdp-full">
            <span className="jdp-label">URL</span>
            <input
              className="jdp-input"
              value={form.asset_url}
              onChange={(e) => set('asset_url', e.target.value)}
            />
            {form.asset_url && (
              <div className="jdp-quick-links">
                <a href={urlHref(form.asset_url)} target="_blank" rel="noreferrer">
                  open
                </a>
              </div>
            )}
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Customer</span>
            <select
              className="jdp-input"
              value={form.customer_id === '' ? '' : String(form.customer_id)}
              onChange={(e) =>
                set('customer_id', e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.business_name}
                </option>
              ))}
            </select>
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Current project</span>
            <select
              className="jdp-input"
              value={form.project_id === '' ? '' : String(form.project_id)}
              onChange={(e) =>
                set('project_id', e.target.value === '' ? '' : Number(e.target.value))
              }
              disabled={form.customer_id === ''}
            >
              <option value="">None</option>
              {projectsForCustomer.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {mode === 'edit' && asset && (
        <div className="jdp-section">
          <button
            type="button"
            className={`jdp-accordion-toggle ${integrationsOpen ? 'is-open' : ''}`}
            onClick={() => setIntegrationsOpen((o) => !o)}
          >
            <span>Integrations</span>
            <span className="jdp-accordion-chevron">{integrationsOpen ? '▾' : '▸'}</span>
          </button>
          {integrationsOpen && (
            <div className="jdp-accordion-body">
              <GscIntegrationSection asset={asset} allAssets={assets} />
              <WpIntegrationSection asset={asset} />
              <div className="jdp-2col" style={{ marginTop: 16 }}>
                <DisplayField label="Health score" value={asset.health_score ?? '—'} />
                <DisplayField label="GA4" value={<StatusChip status={asset.ga4_status} />} />
                <DisplayField label="WP CLI" value={<StatusChip status={asset.wp_cli_status} />} />
                <DisplayField label="Hermes profile" value={asset.hermes_profile || '—'} />
                <DisplayField label="Telegram topic" value={asset.telegram_topic || '—'} />
                <DisplayField label="Workspace" value={asset.workspace || '—'} />
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'edit' && asset && (
        <CompetitorSnapshotsSection asset={asset} onRunPanelChange={setRunPanelOpen} />
      )}
    </div>
  )
}

function DisplayField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="jdp-field">
      <span className="jdp-label">{label}</span>
      <div className="jdp-readonly">{value}</div>
    </div>
  )
}

function StatusChip({ status }: { status: ConnectionStatus }) {
  return <span className={`conn-status conn-status-${status}`}>{status}</span>
}
