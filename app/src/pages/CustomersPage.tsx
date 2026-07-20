import { useEffect, useMemo, useState } from 'react'
import { useData } from '../lib/data'
import { useAppNav } from '../lib/nav'
import type { Asset, Customer, Project } from '../lib/pipeline'
import { isClosed, stageLabel, stageTheme } from '../lib/pipeline'
import DeliverablesTable from '../features/projects/DeliverablesTable'

type Lifecycle = Customer['lifecycle']

type CustomerForm = {
  business_name: string
  contact_first_name: string
  contact_last_name: string
  email: string
  phone: string
  address: string
  location: string
  website: string
  contact_method: string
  lifecycle: Lifecycle
  notes: string
}

const emptyForm = (): CustomerForm => ({
  business_name: '',
  contact_first_name: '',
  contact_last_name: '',
  email: '',
  phone: '',
  address: '',
  location: '',
  website: '',
  contact_method: 'Email',
  lifecycle: 'lead',
  notes: '',
})

function formFromCustomer(c: Customer): CustomerForm {
  return {
    business_name: c.business_name,
    contact_first_name: c.contact_first_name,
    contact_last_name: c.contact_last_name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    location: c.location,
    website: c.website,
    contact_method: c.contact_method,
    lifecycle: c.lifecycle,
    notes: c.notes,
  }
}

function contactLabel(c: Pick<CustomerForm, 'contact_first_name' | 'contact_last_name'>) {
  return [c.contact_first_name, c.contact_last_name].filter(Boolean).join(' ')
}

function websiteHref(url: string) {
  if (!url.trim()) return ''
  return url.startsWith('http') ? url : `https://${url}`
}

export default function CustomersPage() {
  const { customers, projects, assets, stages, loading, error, updateCustomer, createCustomer } =
    useData()
  const { customersIntent, consumeCustomersIntent } = useAppNav()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [createDraft, setCreateDraft] = useState<CustomerForm | null>(null)

  useEffect(() => {
    if (!customersIntent) return
    setCreating(false)
    setCreateDraft(null)
    setSelectedId(customersIntent.customerId)
    consumeCustomersIntent()
  }, [customersIntent, consumeCustomersIntent])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = !q
      ? customers
      : customers.filter(
          (c) =>
            c.business_name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.location.toLowerCase().includes(q) ||
            contactLabel(c).toLowerCase().includes(q),
        )
    return [...list].sort((a, b) => a.business_name.localeCompare(b.business_name))
  }, [customers, search])

  const projectsByCustomer = useMemo(() => {
    const map = new Map<number, Project[]>()
    for (const p of projects) {
      const list = map.get(p.customer_id) ?? []
      list.push(p)
      map.set(p.customer_id, list)
    }
    return map
  }, [projects])

  const assetsByCustomer = useMemo(() => {
    const map = new Map<number, Asset[]>()
    for (const a of assets) {
      const list = map.get(a.customer_id) ?? []
      list.push(a)
      map.set(a.customer_id, list)
    }
    return map
  }, [assets])

  const selected = customers.find((c) => c.id === selectedId) ?? null

  useEffect(() => {
    if (creating) return
    if (selectedId != null && !customers.some((c) => c.id === selectedId)) {
      setSelectedId(null)
    }
  }, [customers, selectedId, creating])

  if (loading) return <div className="page-pad">Loading customers…</div>
  if (error) return <div className="page-pad page-error">{error}</div>

  return (
    <div className="master-detail">
      <div className="master-list">
        <div className="master-list-search">
          <input
            placeholder="Search name, phone, email…"
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
            + New customer
          </button>
        </div>
        <div className="master-list-items">
          {filtered.map((c) => {
            const cProjects = projectsByCustomer.get(c.id) ?? []
            const openCount = cProjects.filter((p) => !isClosed(p.stage)).length
            return (
              <button
                key={c.id}
                type="button"
                className={`master-item ${!creating && selectedId === c.id ? 'master-item-on' : ''}`}
                onClick={() => {
                  setCreating(false)
                  setCreateDraft(null)
                  setSelectedId(c.id)
                }}
              >
                <div className="master-item-name">{c.business_name}</div>
                {contactLabel(c) && <div className="master-item-sub">{contactLabel(c)}</div>}
                {c.phone && <div className="master-item-sub">{c.phone}</div>}
                <div className="master-item-stage">
                  <span className={`lifecycle-pill lifecycle-${c.lifecycle}`}>{c.lifecycle}</span>
                  {cProjects.length > 0 && (
                    <span className="mutedtext" style={{ marginLeft: 6 }}>
                      {cProjects.length} project{cProjects.length !== 1 ? 's' : ''}
                      {openCount > 0 ? ` · ${openCount} open` : ''}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="master-list-empty">No customers found.</div>
          )}
        </div>
      </div>

      <div className="detail-area">
        {creating && createDraft && (
          <CustomerDetail
            mode="create"
            initial={createDraft}
            projects={[]}
            assets={[]}
            stages={stages}
            onCancel={() => {
              setCreating(false)
              setCreateDraft(null)
            }}
            onCreate={async (form) => {
              const row = await createCustomer(form)
              setCreating(false)
              setCreateDraft(null)
              setSelectedId(row.id)
            }}
          />
        )}
        {!creating && !selected && <div className="detail-empty">Select a customer</div>}
        {!creating && selected && (
          <CustomerDetail
            key={selected.id}
            mode="edit"
            customerId={selected.id}
            initial={formFromCustomer(selected)}
            projects={projectsByCustomer.get(selected.id) ?? []}
            assets={assetsByCustomer.get(selected.id) ?? []}
            stages={stages}
            onSave={async (form) => {
              await updateCustomer(selected.id, form)
            }}
          />
        )}
      </div>
    </div>
  )
}

function CustomerDetail({
  mode,
  customerId,
  initial,
  projects,
  assets,
  stages,
  onSave,
  onCreate,
  onCancel,
}: {
  mode: 'edit' | 'create'
  customerId?: number
  initial: CustomerForm
  projects: Project[]
  assets: Asset[]
  stages: ReturnType<typeof useData>['stages']
  onSave?: (form: CustomerForm) => Promise<void>
  onCreate?: (form: CustomerForm) => Promise<void>
  onCancel?: () => void
}) {
  const { openProjectInPipeline, openAssetRecord } = useAppNav()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    setForm(initial)
    setErr(null)
    setOk(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally sync on customerId / mode only
  }, [customerId, mode])

  function set<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.business_name.trim()) {
      setErr('Business name is required.')
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
    <div className="jdp">
      <div className="jdp-header">
        <div className="jdp-title">
          <div className="jdp-name">
            {mode === 'create' ? 'New customer' : form.business_name || 'Customer'}
          </div>
          {mode === 'edit' && customerId != null && (
            <span className="mutedtext">#{customerId}</span>
          )}
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

      {err && <div className="login-error" style={{ marginBottom: 8 }}>{err}</div>}
      {ok && <div className="login-ok" style={{ marginBottom: 8 }}>Saved</div>}

      <div className="jdp-section">
        <div className="jdp-section-title">Customer details</div>
        <div className="jdp-2col">
          <div className="jdp-field jdp-full">
            <span className="jdp-label">Business name</span>
            <input
              className="jdp-input"
              value={form.business_name}
              onChange={(e) => set('business_name', e.target.value)}
            />
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Lifecycle</span>
            <select
              className="jdp-input"
              value={form.lifecycle}
              onChange={(e) => set('lifecycle', e.target.value as Lifecycle)}
            >
              <option value="lead">lead</option>
              <option value="customer">customer</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Contact method</span>
            <select
              className="jdp-input"
              value={form.contact_method}
              onChange={(e) => set('contact_method', e.target.value)}
            >
              <option>Email</option>
              <option>Phone</option>
              <option>SMS</option>
            </select>
          </div>
          <div className="jdp-field">
            <span className="jdp-label">First name</span>
            <input
              className="jdp-input"
              value={form.contact_first_name}
              onChange={(e) => set('contact_first_name', e.target.value)}
            />
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Last name</span>
            <input
              className="jdp-input"
              value={form.contact_last_name}
              onChange={(e) => set('contact_last_name', e.target.value)}
            />
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Phone</span>
            <input
              className="jdp-input"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
            {form.phone && (
              <div className="jdp-quick-links">
                <a href={`tel:${form.phone.replace(/\s/g, '')}`}>tel</a>
                <a href={`sms:${form.phone.replace(/\s/g, '')}`}>sms</a>
              </div>
            )}
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Email</span>
            <input
              className="jdp-input"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {form.email && (
              <div className="jdp-quick-links">
                <a href={`mailto:${form.email}`}>email</a>
              </div>
            )}
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Location</span>
            <input
              className="jdp-input"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
            />
          </div>
          <div className="jdp-field">
            <span className="jdp-label">Website</span>
            <input
              className="jdp-input"
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
            />
            {form.website && (
              <div className="jdp-quick-links">
                <a href={websiteHref(form.website)} target="_blank" rel="noreferrer">
                  open
                </a>
              </div>
            )}
          </div>
          <div className="jdp-field jdp-full">
            <span className="jdp-label">Address</span>
            <input
              className="jdp-input"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
          </div>
          <div className="jdp-field jdp-full">
            <span className="jdp-label">Notes</span>
            <textarea
              className="jdp-input jdp-textarea"
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>
      </div>

      {mode === 'edit' && (
        <>
          <div className="jdp-section">
            <div className="jdp-section-title">Projects ({projects.length})</div>
            {projects.length === 0 && <div className="mutedtext">No projects yet.</div>}
            {projects.map((p) => {
              const closed = isClosed(p.stage)
              const theme = stageTheme(p.stage)
              return (
                <div key={p.id} className="customer-project-card">
                  <div className="customer-project-row">
                    <div>
                      <div className="customer-project-name">{p.name}</div>
                      {p.system_description && (
                        <div className="mutedtext">{p.system_description}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="stage-chip stage-chip-btn"
                      style={{
                        background: closed ? 'var(--gray-200)' : theme.light,
                        color: closed ? 'var(--muted)' : theme.text,
                      }}
                      onClick={() => openProjectInPipeline(p.id)}
                      title="Open in pipeline"
                    >
                      {closed ? 'Closed' : stageLabel(p.stage, p.step, stages)}
                    </button>
                  </div>
                  <DeliverablesTable projectId={p.id} />
                </div>
              )
            })}
          </div>

          <div className="jdp-section">
            <div className="jdp-section-title">Assets ({assets.length})</div>
            {assets.length === 0 ? (
              <div className="mutedtext">No assets for this customer.</div>
            ) : (
              <table className="table panel-mini-table">
                <thead>
                  <tr>
                    <th className="th-left">Name</th>
                    <th className="th-left">URL</th>
                    <th>Open URL</th>
                    <th>Record</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id}>
                      <td className="td-left">{a.name || '—'}</td>
                      <td className="td-left mutedtext">{a.asset_url || '—'}</td>
                      <td>
                        {a.asset_url ? (
                          <a
                            className="btn-link"
                            href={websiteHref(a.asset_url)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => openAssetRecord(a.id)}
                        >
                          Open record
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
