import { useEffect, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import AppLink from '../components/AppLink.jsx'
import BrandMark from '../components/BrandMark.jsx'
import { ErrorState, LoadingState } from '../components/Feedback.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { getAdminLoginErrorMessage } from '../lib/admin-login.js'
import AdminDashboard from './admin/AdminDashboard.jsx'
import AdminCarEditor from './admin/AdminCarEditor.jsx'
import { getAdminSession, loginAdmin } from '../services/api.js'

export default function AdminPage({ pathname, navigate }) {
  if (pathname === '/admin/login') return <AdminLogin navigate={navigate} />

  const editorMatch = pathname.match(/^\/admin\/cars\/(new|[1-9]\d*\/edit)$/)
  if (editorMatch) {
    const isNew = editorMatch[1] === 'new'
    const carId = isNew ? null : editorMatch[1].split('/')[0]
    return <AdminCarEditor carId={carId} navigate={navigate} />
  }
  if (pathname === '/admin') return <AdminDashboard navigate={navigate} />

  return (
    <main className="admin-login-page">
      <AppLink className="back-link" to="/admin" navigate={navigate}>Kembali ke portal admin</AppLink>
      <ErrorState message="Halaman admin tidak ditemukan." />
    </main>
  )
}

function AdminLogin({ navigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionError, setSessionError] = useState(null)

  useEffect(() => {
    let active = true
    getAdminSession()
      .then(() => { if (active) navigate('/admin') })
      .catch((cause) => {
        if (!active || cause.status === 401) return
        setSessionError(cause.message)
      })
      .finally(() => { if (active) setCheckingSession(false) })
    return () => { active = false }
  }, [navigate])

  async function submit(event) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await loginAdmin({ email: email.trim(), password })
      setPassword('')
      navigate('/admin')
    } catch (cause) {
      setError(getAdminLoginErrorMessage(cause))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="admin-login-page">
      <header className="admin-login-header">
        <AppLink className="brand-lockup" to="/" navigate={navigate} aria-label="Kembali ke CarHub">
          <BrandMark />
          <span><strong>CarHub</strong><small>ADMINISTRATOR</small></span>
        </AppLink>
        <ThemeToggle />
      </header>
      <section className="admin-login-card">
        <p className="eyebrow">RUANG OPERASIONAL</p>
        <h1>Masuk ke portal.</h1>
        <p className="admin-login-copy">Gunakan akun admin CarHub yang telah dibuat oleh owner.</p>
        {checkingSession && <LoadingState label="Memeriksa sesi admin" />}
        {sessionError && (
          <div className="notice notice-error login-error" role="alert">
            <CircleAlert size={18} aria-hidden="true" />
            <span>Sesi admin tidak dapat diperiksa: {sessionError}</span>
          </div>
        )}
        {error && (
          <div className="notice notice-error login-error" role="alert" aria-atomic="true">
            <CircleAlert size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        {!checkingSession && <form className="seller-form login-form" onSubmit={submit}>
          <label className="form-field" htmlFor="admin-email">
            <span>Email</span>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="form-field" htmlFor="admin-password">
            <span>Kata sandi</span>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              minLength={12}
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="button button-primary submit-button" type="submit" disabled={submitting}>
            {submitting ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>}
        {!checkingSession && <p className="login-footnote">Tidak ada pendaftaran publik. Hubungi owner CarHub untuk akses.</p>}
      </section>
    </main>
  )
}
