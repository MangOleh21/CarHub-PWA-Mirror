import { useEffect, useState } from 'react'
import { ArrowUpRight, CarFront, ClipboardList, LogOut, RefreshCw, UserRound, UsersRound } from 'lucide-react'
import AppLink from '../../components/AppLink.jsx'
import BrandMark from '../../components/BrandMark.jsx'
import { ErrorState, LoadingState } from '../../components/Feedback.jsx'
import { useAuth } from '../../contexts/useAuth.js'
import { getAdminDashboardSummary, getAdminSession, logoutAdmin } from '../../services/api.js'
import AdminCarsPanel from './AdminCarsPanel.jsx'
import AdminCustomersPanel from './AdminCustomersPanel.jsx'
import AdminSubmissionsPanel from './AdminSubmissionsPanel.jsx'
import AdminAccountsPanel from './AdminAccountsPanel.jsx'

const tabs = [
  { id: 'cars', label: 'Katalog', Icon: CarFront },
  { id: 'submissions', label: 'Pengajuan', Icon: ClipboardList },
  { id: 'customers', label: 'Pengguna', Icon: UserRound },
  { id: 'admins', label: 'Akun admin', Icon: UsersRound, ownerOnly: true },
]

function AdminSummaryCards({ revision }) {
  const [response, setResponse] = useState({ key: null, summary: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${revision}:${attempt}`

  useEffect(() => {
    let active = true
    getAdminDashboardSummary()
      .then((summary) => {
        if (active) setResponse({ key: requestKey, summary, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key: requestKey, summary: null, error: cause.message })
      })
    return () => { active = false }
  }, [requestKey])

  const summary = response.key === requestKey ? response.summary : null
  const error = response.key === requestKey ? response.error : null
  const cards = [
    { label: 'Mobil di katalog', value: summary?.carListings, Icon: CarFront },
    { label: 'Pengajuan menunggu', value: summary?.pendingSubmissions, Icon: ClipboardList },
  ]

  return (
    <section className="admin-summary" aria-label="Ringkasan marketplace" aria-busy={!summary && !error}>
      {cards.map(({ label, value, Icon }) => (
        <article className="admin-summary-card" key={label}>
          <div className="admin-summary-card-top">
            <span>{label}</span>
            <Icon size={18} aria-hidden="true" />
          </div>
          <strong>{value ?? (error ? '—' : '…')}</strong>
          <small>Total tercatat</small>
        </article>
      ))}
      {error && (
        <div className="admin-summary-error" role="alert">
          <span>Ringkasan tidak dapat dimuat.</span>
          <button type="button" className="text-button" onClick={() => setAttempt((value) => value + 1)}>
            <RefreshCw size={14} aria-hidden="true" /> Coba lagi
          </button>
        </div>
      )}
    </section>
  )
}

export default function AdminDashboard({ navigate }) {
  const { refreshSession } = useAuth()
  const [session, setSession] = useState(null)
  const [sessionError, setSessionError] = useState(null)
  const [tab, setTab] = useState('cars')
  const [summaryRevision, setSummaryRevision] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(null)

  useEffect(() => {
    let active = true
    getAdminSession()
      .then(({ admin }) => { if (active) setSession(admin) })
      .catch((error) => {
        if (!active) return
        if (error.status === 401) navigate('/admin/login')
        else if (error.status === 403) navigate('/profile')
        else setSessionError(error.message)
      })
    return () => { active = false }
  }, [navigate])

  async function logout() {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await logoutAdmin()
      await refreshSession()
      navigate('/admin/login')
    } catch (error) {
      setLogoutError(error.message)
      setLoggingOut(false)
    }
  }

  if (sessionError) {
    return <main className="admin-shell"><ErrorState message={sessionError} onRetry={() => window.location.reload()} /></main>
  }
  if (!session) return <main className="admin-shell"><LoadingState label="Memuat portal admin" /></main>

  const visibleTabs = tabs.filter((item) => !item.ownerOnly || session.role === 'owner')
  const activeTab = visibleTabs.some((item) => item.id === tab) ? tab : 'cars'

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <AppLink className="brand-lockup" to="/" navigate={navigate} aria-label="Kembali ke CarHub">
          <BrandMark />
          <span><strong>CarHub</strong><small>ADMIN CONSOLE</small></span>
        </AppLink>
        <div className="admin-header-actions">
          <div className="admin-identity">
            <span>{session.name ? `${session.name} (${session.email})` : session.email}</span>
            <small>{session.role === 'owner' ? 'Owner' : 'Admin'}</small>
          </div>
          <button className="button button-quiet" type="button" onClick={logout} disabled={loggingOut}>
            <LogOut size={16} aria-hidden="true" /> {loggingOut ? 'Keluar…' : 'Keluar'}
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-title-row">
          <div>
            <p className="eyebrow">RUANG OPERASIONAL</p>
            <h1>Dashboard</h1>
          </div>
          <AppLink className="text-link" to="/catalog" navigate={navigate}>Lihat katalog <ArrowUpRight size={16} /></AppLink>
        </div>

        {logoutError && <p className="notice notice-error" role="alert">{logoutError}</p>}
        <AdminSummaryCards revision={summaryRevision} />

        <nav className="admin-tabs" aria-label="Bagian portal admin">
          {visibleTabs.map(({ id, label, Icon }) => (
            <button
              className={`admin-tab${activeTab === id ? ' is-active' : ''}`}
              key={id}
              type="button"
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => setTab(id)}
            >
              <Icon size={17} aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>

        {activeTab === 'cars' && (
          <AdminCarsPanel navigate={navigate} onDataChange={() => setSummaryRevision((value) => value + 1)} />
        )}
        {activeTab === 'submissions' && (
          <AdminSubmissionsPanel onDataChange={() => setSummaryRevision((value) => value + 1)} />
        )}
        {activeTab === 'customers' && (
          <AdminCustomersPanel />
        )}
        {activeTab === 'admins' && session.role === 'owner' && (
          <AdminAccountsPanel />
        )}
      </main>
    </div>
  )
}
