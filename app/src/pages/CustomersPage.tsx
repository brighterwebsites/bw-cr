import { useMemo } from 'react'
import { useData } from '../lib/data'

export default function CustomersPage() {
  const { customers, loading, error } = useData()

  const sorted = useMemo(
    () => [...customers].sort((a, b) => a.business_name.localeCompare(b.business_name)),
    [customers],
  )

  if (loading) return <div className="page-pad">Loading customers…</div>
  if (error) return <div className="page-pad page-error">{error}</div>

  return (
    <div className="page-pad">
      <h1 className="page-title">Customers</h1>
      <p className="page-sub">{sorted.length} customer{sorted.length !== 1 ? 's' : ''}</p>
      {sorted.length === 0 ? (
        <p className="muted">No customers yet. Add via Supabase or a create form (coming soon).</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Lifecycle</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.business_name}</strong>
                  {c.website && (
                    <div className="cell-sub">
                      <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noreferrer">
                        {c.website}
                      </a>
                    </div>
                  )}
                </td>
                <td>
                  {[c.contact_first_name, c.contact_last_name].filter(Boolean).join(' ') || '—'}
                  {c.email && <div className="cell-sub">{c.email}</div>}
                </td>
                <td>{c.location || '—'}</td>
                <td>
                  <span className={`lifecycle-pill lifecycle-${c.lifecycle}`}>{c.lifecycle}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
