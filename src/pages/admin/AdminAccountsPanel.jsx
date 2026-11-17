import { useState } from 'react'
import { UserPlus, UserX } from 'lucide-react'
import { createAdminUser, deactivateAdminUser } from '../../services/api.js'

export default function AdminAccountsPanel({ admins, onCreated, onDeactivated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  async function createAccount(event) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const admin = await createAdminUser({ email: email.trim(), password })
      onCreated(admin)
      setEmail('')
      setPassword('')
      setMessage(`Akun admin dibuat dengan ID ${admin.id}.`)
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
      onDeactivated(admin.id)
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
        <h3>Akun yang dibuat pada sesi ini</h3>
        {admins.length === 0 && (
          <p className="muted-copy">Belum ada akun baru di sesi ini. API backend belum menyediakan endpoint daftar akun admin.</p>
        )}
        {admins.map((admin) => (
          <div className="admin-created-row" key={admin.id}>
            <div><strong>{admin.email}</strong><small>ID {admin.id}</small></div>
            <button
              className="button button-danger-quiet"
              type="button"
              disabled={busy}
              onClick={() => deactivate(admin)}
              aria-label={`Nonaktifkan ${admin.email}`}
            >
              <UserX size={16} aria-hidden="true" /> Nonaktifkan
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
