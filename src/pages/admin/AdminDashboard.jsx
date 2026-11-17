import { useEffect, useState } from 'react'
import { ArrowUpRight, CarFront, ClipboardList, LogOut, UsersRound } from 'lucide-react'
import AppLink from '../../components/AppLink.jsx'
import { ErrorState, LoadingState } from '../../components/Feedback.jsx'
import { getAdminSession, logoutAdmin } from '../../services/api.js'
import AdminCarsPanel from './AdminCarsPanel.jsx'
import AdminSubmissionsPanel from './AdminSubmissionsPanel.jsx'
import AdminAccountsPanel from './AdminAccountsPanel.jsx'

const tabs = [
  { id: 'cars', label: 'Katalog', Icon: CarFront },
  { id: 'submissions', label: 'Pengajuan', Icon: ClipboardList },
  { id: 'admins', label: 'Akun admin', Icon: UsersRound, ownerOnly: true },
]

export default function AdminDashboard({ navigate }) {
  const [session, setSession] = useState(null)
  const [sessionError, setSessionError] = useState(null)
  const [tab, setTab] = useState('cars')
  const [createdAdmins, setCreatedAdmins] = useState([])
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(null)

  useEffect(() => {
    let active = true
    getAdminSession()
      .then(({ admin }) => { if (active) setSession(admin) })
      .catch((error) => {
        if (!active) return
        if (error.status === 401) navigate('/admin/login')
        else setSessionError(error.message)
      })
    return () => { active = false }
  }, [navigate])

  async function logout() {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await logoutAdmin()
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
          <span className="brand-mark"><CarFront size={21} aria-hidden="true" /></span>
          <span><strong>CarHub</strong><small>ADMIN CONSOLE</small></span>
        </AppLink>
        <div className="admin-header-actions">
          <div className="admin-identity">
            <span>{session.email}</span>
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
          <AppLink className="text-link" to="/" navigate={navigate}>Lihat katalog <ArrowUpRight size={16} /></AppLink>
        </div>

        {logoutError && <p className="notice notice-error" role="alert">{logoutError}</p>}

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

        {activeTab === 'cars' && <AdminCarsPanel navigate={navigate} />}
        {activeTab === 'submissions' && <AdminSubmissionsPanel />}
        {activeTab === 'admins' && session.role === 'owner' && (
          <AdminAccountsPanel
            admins={createdAdmins}
            onCreated={(admin) => setCreatedAdmins((current) => [admin, ...current])}
            onDeactivated={(id) => setCreatedAdmins((current) => current.filter((admin) => admin.id !== id))}
          />
        )}
      </main>
    </div>
  )
}
