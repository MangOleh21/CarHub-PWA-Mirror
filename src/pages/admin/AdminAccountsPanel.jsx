import { useEffect, useState } from 'react'
import { CheckCircle2, ShieldCheck, UserPlus, UserX, XCircle } from 'lucide-react'
import { LoadingState } from '../../components/Feedback.jsx'
import { createAdminUser, deactivateAdminUser, getAdminUsers } from '../../services/api.js'

export default function AdminAccountsPanel({ onCreated, onDeactivated }) {
  const [adminList, setAdminList] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let active = true
    getAdminUsers()
      .then((data) => {
        if (active) {
          setAdminList(data)
          setLoading(false)
        }
      })
      .catch((cause) => {
        if (active) {
          setListError(cause.message)
          setLoading(false)
        }
      })
    return () => { active = false }
  }, [])

  async function createAccount(event) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const admin = await createAdminUser({ email: email.trim(), password })
      if (onCreated) onCreated(admin)
      setAdminList((current) => [admin, ...current.filter((item) => item.id !== admin.id)])
      setEmail('')
      setPassword('')
      setMessage(`Akun admin ${admin.email} (ID ${admin.id}) berhasil dibuat.`)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  async function deactivate(admin) {
    if (!window.confirm(`Nonaktifkan akun ${admin.email}? Sesi aktif akun tersebut akan dicabut.`)) return
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const updated = await deactivateAdminUser(admin.id)
      if (onDeactivated) onDeactivated(admin.id)
      setAdminList((current) => current.map((item) => (item.id === admin.id ? updated : item)))
      setMessage(`Akun ${admin.email} telah dinonaktifkan.`)
    } catch (cause) {
      setError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">AKSES INTERNAL</p>
          <h2>Akun administrator</h2>
        </div>
      </div>
      <p className="admin-explainer">
        Owner dapat membuat akun admin baru dan menonaktifkan akun yang tidak lagi bertugas. Password hanya dikirim melalui koneksi API terenkripsi.
      </p>

      <form className="admin-create-form" onSubmit={createAccount}>
        <label className="form-field" htmlFor="new-admin-email">
          <span>Email admin baru</span>
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
        <h3>Daftar akun terdaftar</h3>
        {loading && <LoadingState label="Memuat daftar admin…" />}
        {!loading && listError && <p className="notice notice-error">{listError}</p>}
        {!loading && !listError && adminList.length === 0 && (
          <p className="muted-copy">Belum ada akun admin terdaftar.</p>
        )}
        {!loading && !listError && adminList.length > 0 && (
          <div className="admin-accounts-table-wrap">
            <table className="admin-accounts-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Peran</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {adminList.map((admin) => (
                  <tr key={admin.id} className={admin.isActive ? '' : 'is-inactive'}>
                    <td>
                      <strong>{admin.email}</strong>
                      <small className="account-id">ID: #{admin.id}</small>
                    </td>
                    <td>
                      <span className={`role-badge role-${admin.role}`}>
                        <ShieldCheck size={13} aria-hidden="true" />
                        {admin.role === 'owner' ? 'Owner' : 'Admin'}
                      </span>
                    </td>
                    <td>
                      {admin.isActive ? (
                        <span className="account-status is-active">
                          <CheckCircle2 size={14} aria-hidden="true" /> Aktif
                        </span>
                      ) : (
                        <span className="account-status is-inactive">
                          <XCircle size={14} aria-hidden="true" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td>
                      {admin.role === 'admin' && admin.isActive && (
                        <button
                          className="button button-danger-quiet account-action-btn"
                          type="button"
                          disabled={busy}
                          onClick={() => deactivate(admin)}
                          aria-label={`Nonaktifkan ${admin.email}`}
                        >
                          <UserX size={15} aria-hidden="true" /> Nonaktifkan
                        </button>
                      )}
                      {admin.role === 'owner' && <span className="muted-copy">Utama</span>}
                      {admin.role === 'admin' && !admin.isActive && <span className="muted-copy">Dinonaktifkan</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
