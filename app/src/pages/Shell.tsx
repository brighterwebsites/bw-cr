import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { DataProvider } from '../lib/data'
import PipelinePage from './PipelinePage'
import CustomersPage from './CustomersPage'
import StubPage from './StubPage'

type Page = 'pipeline' | 'customers' | 'tasks' | 'assets'

export default function Shell() {
  return (
    <DataProvider>
      <ShellInner />
    </DataProvider>
  )
}

function ShellInner() {
  const { session, signOut } = useAuth()
  const [page, setPage] = useState<Page>('pipeline')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  function NavItem({ p, icon, label }: { p: Page; icon: string; label: string }) {
    return (
      <button
        type="button"
        className={`sidebar-item ${page === p ? 'sidebar-item-on' : ''}`}
        onClick={() => setPage(p)}
        title={sidebarOpen ? undefined : label}
      >
        <span className="sidebar-icon">{icon}</span>
        {sidebarOpen && <span className="sidebar-label">{label}</span>}
      </button>
    )
  }

  return (
    <div className="shell-layout">
      <header className="app-header">
        <div className="header-left">
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle sidebar"
          >
            ☰
          </button>
          <span className="nav-brand">
            Brighter Websites <span className="badge">CRM</span>
          </span>
        </div>
        <div className="header-right">
          <span className="nav-user">{session?.user.email}</span>
          <button type="button" className="btn btn-gray" style={{ fontSize: 12 }} onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ display: 'contents' }}>
        <aside className={`sidebar${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
          <nav className="sidebar-nav">
            <NavItem p="pipeline" icon="◉" label="Pipeline" />
            <div className="sidebar-section">{sidebarOpen ? 'CRM' : '·'}</div>
            <NavItem p="customers" icon="👥" label="Customers" />
            <NavItem p="tasks" icon="✓" label="Tasks" />
            <NavItem p="assets" icon="🌐" label="Assets" />
          </nav>
        </aside>

        <main className="app-main">
          {page === 'pipeline' && <PipelinePage />}
          {page === 'customers' && <CustomersPage />}
          {page === 'tasks' && (
            <StubPage icon="✓" title="Tasks" note="Task list and create form — next up." />
          )}
          {page === 'assets' && (
            <StubPage icon="🌐" title="Assets" note="Websites, integrations, and metrics — next up." />
          )}
        </main>
      </div>
    </div>
  )
}
