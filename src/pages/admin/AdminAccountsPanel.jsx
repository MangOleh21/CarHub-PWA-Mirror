import { useEffect, useState } from 'react'
import { UserPlus, UserX } from 'lucide-react'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback.jsx'
import { createAdminUser, deactivateAdminUser, getAdminUsers } from '../../services/api.js'

export default function AdminAccountsPanel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [requestKey, setRequestKey] = useState(0)
  const [response, setResponse] = useState({ key: -1, admins: null, error: null })

  useEffect(() => {
    let active = true
    getAdminUsers()
      .then((admins) => {
        if (active) setResponse({ key: requestKey, admins, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key: requestKey, admins: null, error: cause.message })
      })
    return () => { active = false }
  }, [requestKey])

  const loading = response.key !== requestKey
  const admins = response.key === requestKey ? response.admins : null
  const listError = response.key === requestKey ? response.error : null

  async function createAccount(event) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const admin = await createAdminUser({ email: email.trim(), password })
      setEmail('')
      setPassword('')
      setMessage(`Akun admin dibuat dengan ID ${admin.id}.`)
      setRequestKey((key) => key + 1)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  async function deactivate(admin) {
    if (!window.confirm(`Nonaktifkan akun ${admin.email}? Sesi aktif akun tersebut akan dicabut.`)) return
    setError(null)
    setBusy(true)
    try {
      await deactivateAdminUser(admin.id)
      setMessage(`Akun ${admin.email} telah dinonaktifkan.`)
      setRequestKey((key) => key + 1)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div><p className="eyebrow">AKSES INTERNAL</p><h2>Akun administrator</h2></div>
      </div>
      <p className="admin-explainer">Owner dapat membuat akun admin baru. Password hanya dikirim melalui koneksi API dan tidak disimpan di browser.</p>
      <form className="admin-create-form" onSubmit={createAccount}>
        <label className="form-field" htmlFor="new-admin-email">
          <span>Email admin</span>
          <input
            id="new-admin-email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="form-field" htmlFor="new-admin-password">
          <span>Password sementara <small>Min. 12 karakter</small></span>
          <input
            id="new-admin-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="button button-primary" type="submit" disabled={busy}>
          <UserPlus size={16} aria-hidden="true" /> Buat akun admin
        </button>
      </form>
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      {message && <p className="notice notice-success" role="status">{message}</p>}

      <div className="admin-created-list">
        <h3>Semua akun admin</h3>
        {loading && <LoadingState label="Memuat akun administrator" />}
        {!loading && listError && (
          <ErrorState message={listError} onRetry={() => setRequestKey((key) => key + 1)} />
        )}
        {!loading && !listError && admins.length === 0 && (
          <EmptyState title="Belum ada akun" message="Akun administrator akan ditampilkan di sini." />
        )}
        {!loading && !listError && admins.map((admin) => (
          <div className="admin-created-row" key={admin.id}>
            <div>
              <strong>{admin.email}</strong>
              <small>ID {admin.id} · {admin.role === 'owner' ? 'Owner' : 'Admin'} · Dibuat {new Date(admin.createdAt).toLocaleDateString('id-ID')}</small>
            </div>
            <div className="admin-account-actions">
              <span className={`status-badge ${admin.isActive ? 'status-approved' : 'status-rejected'}`}>
                {admin.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
              {admin.role === 'admin' && admin.isActive && (
                <button
                  className="button button-danger-quiet"
                  type="button"
                  disabled={busy}
                  onClick={() => deactivate(admin)}
                  aria-label={`Nonaktifkan ${admin.email}`}
                >
                  <UserX size={16} aria-hidden="true" /> Nonaktifkan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
