import {
  ArrowRight,
  CarFront,
  CircleAlert,
  Eye,
  EyeOff,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import AppLink from '../components/AppLink.jsx'
import { LoadingState } from '../components/Feedback.jsx'
import { useAuth } from '../contexts/useAuth.js'
import { getSafeRedirectTarget, getUserAuthErrorMessage } from '../lib/user-auth.js'

const HIGHLIGHTS = [
  {
    Icon: ShieldCheck,
    title: 'Pantau status kurasi',
    copy: 'Lihat pengajuan menunggu review, tayang, atau catatan langsung dari tim kurasi.',
  },
  {
    Icon: CarFront,
    title: 'Katalog mobil pribadi',
    copy: 'Semua unit yang Anda tawarkan tersusun rapi di halaman Profil Anda.',
  },
  {
    Icon: MessageCircle,
    title: 'Kontak otomatis terisi',
    copy: 'Nama, nomor WhatsApp, dan kota siap pakai setiap kali mengajukan jual mobil.',
  },
]

function validateRegister(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Nama lengkap wajib diisi.'
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Masukkan alamat email yang valid.'
  }
  if (!form.phone.trim() || !/^\+?\d[\d\s()-]{7,19}$/.test(form.phone.trim())) {
    errors.phone = 'Gunakan nomor WhatsApp yang valid.'
  }
  if (form.password.length < 8) {
    errors.password = 'Kata sandi minimal 8 karakter.'
  }
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Konfirmasi kata sandi wajib diisi.'
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Kata sandi dan konfirmasi kata sandi tidak sama.'
  }
  return errors
}

function validateLogin(form) {
  const errors = {}
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Masukkan alamat email yang valid.'
  }
  if (!form.password) {
    errors.password = 'Kata sandi wajib diisi.'
  }
  return errors
}

export default function AuthPage({ mode = 'login', navigate, search }) {
  const { user, status, login, register } = useAuth()
  const isRegister = mode === 'register'
  const redirectTo = getSafeRedirectTarget(search, '/profile')
  const nextQuery = search || ''
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const errorAlertRef = useRef(null)

  useEffect(() => {
    if (status === 'ready' && user) {
      navigate(redirectTo)
    }
  }, [navigate, redirectTo, status, user])

  useEffect(() => {
    if (submitError) {
      errorAlertRef.current?.focus()
    }
  }, [submitError])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[name]
        return next
      })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError(null)

    const validationErrors = isRegister ? validateRegister(form) : validateLogin(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) {
      const firstErrorField = Object.keys(validationErrors)[0]
      document.getElementById(`auth-${firstErrorField}`)?.focus()
      return
    }

    setSubmitting(true)
    try {
      if (isRegister) {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          location: form.location.trim() || null,
          password: form.password,
        })
      } else {
        await login({
          email: form.email.trim(),
          password: form.password,
        })
      }
      setForm((current) => ({ ...current, password: '', confirmPassword: '' }))
      setShowPassword(false)
      setShowConfirmPassword(false)
      navigate(redirectTo)
    } catch (cause) {
      setSubmitError(getUserAuthErrorMessage(cause, mode))
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <main className="page-content auth-page">
        <LoadingState label="Memeriksa sesi akun" />
      </main>
    )
  }

  return (
    <main className="page-content auth-page">
      <div className="auth-layout">
        <section className="auth-aside" aria-labelledby="auth-page-heading">
          <p className="eyebrow">{isRegister ? 'AKUN PENJUAL · CARHUB' : 'AKSES AKUN · CARHUB'}</p>
          <h1 id="auth-page-heading">
            {isRegister ? <>Mulai jual<br /><em>lebih terukur.</em></> : <>Masuk ke<br /><em>akun Anda.</em></>}
          </h1>
          <p className="auth-aside-copy">
            {isRegister
              ? 'Satu akun untuk mengajukan jual mobil bekas dan memantau seluruh daftar unit Anda secara transparan.'
              : 'Kelola pengajuan jual mobil Anda dan pantau unit yang sedang tayang langsung dari halaman Profil.'}
          </p>

          <ul className="auth-highlights">
            {HIGHLIGHTS.map(({ Icon, title, copy }) => (
              <li key={title} className="auth-highlight-item">
                <span className="auth-highlight-icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="auth-buyer-note">
            Hanya ingin mencari mobil?{' '}
            <AppLink className="text-link" to="/catalog" navigate={navigate}>
              Jelajahi katalog tanpa akun
            </AppLink>
          </p>
        </section>

        <section className="auth-card" aria-label={isRegister ? 'Formulir pendaftaran' : 'Formulir masuk'}>
          <nav className="auth-mode-switch" aria-label="Pilih mode autentikasi">
            <AppLink
              className={`auth-mode-tab${!isRegister ? ' is-active' : ''}`}
              to={`/login${nextQuery}`}
              navigate={navigate}
              aria-current={!isRegister ? 'page' : undefined}
            >
              Masuk
            </AppLink>
            <AppLink
              className={`auth-mode-tab${isRegister ? ' is-active' : ''}`}
              to={`/register${nextQuery}`}
              navigate={navigate}
              aria-current={isRegister ? 'page' : undefined}
            >
              Daftar
            </AppLink>
          </nav>

          <div className="auth-card-heading">
            <h2>{isRegister ? 'Buat akun baru' : 'Selamat datang kembali'}</h2>
            <p>
              {isRegister
                ? 'Lengkapi informasi kontak untuk profil penjual Anda.'
                : 'Masukkan email dan kata sandi akun CarHub Anda.'}
            </p>
          </div>

          {submitError && (
            <div
              className="notice notice-error auth-alert"
              role="alert"
              aria-atomic="true"
              tabIndex="-1"
              ref={errorAlertRef}
            >
              <CircleAlert size={18} aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isRegister && (
              <label className="form-field" htmlFor="auth-name">
                <span>Nama lengkap</span>
                <input
                  id="auth-name"
                  name="name"
                  autoComplete="name"
                  placeholder="Contoh: Budi Santoso"
                  maxLength={150}
                  value={form.name}
                  onChange={updateField}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'auth-name-error' : undefined}
                />
                {errors.name && <small className="field-error" id="auth-name-error">{errors.name}</small>}
              </label>
            )}

            <label className="form-field" htmlFor="auth-email">
              <span>Email</span>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete={isRegister ? 'email' : 'username'}
                placeholder="nama@email.com"
                maxLength={254}
                value={form.email}
                onChange={updateField}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'auth-email-error' : undefined}
              />
              {errors.email && <small className="field-error" id="auth-email-error">{errors.email}</small>}
            </label>

            {isRegister && (
              <div className="auth-form-row">
                <label className="form-field" htmlFor="auth-phone">
                  <span>Nomor WhatsApp</span>
                  <input
                    id="auth-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="08xx atau +62"
                    maxLength={25}
                    value={form.phone}
                    onChange={updateField}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'auth-phone-error' : undefined}
                  />
                  {errors.phone && <small className="field-error" id="auth-phone-error">{errors.phone}</small>}
                </label>

                <label className="form-field" htmlFor="auth-location">
                  <span>Kota <small>Opsional</small></span>
                  <input
                    id="auth-location"
                    name="location"
                    autoComplete="address-level2"
                    placeholder="Contoh: Semarang"
                    maxLength={150}
                    value={form.location}
                    onChange={updateField}
                  />
                </label>
              </div>
            )}

            <label className="form-field" htmlFor="auth-password">
              <span>Kata sandi {isRegister && <small>Min. 8 karakter</small>}</span>
              <div className="password-input-wrap">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder={isRegister ? 'Buat kata sandi minimal 8 karakter' : 'Masukkan kata sandi'}
                  maxLength={128}
                  value={form.password}
                  onChange={updateField}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'auth-password-error' : undefined}
                />
                <button
                  className="password-visibility-toggle"
                  type="button"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword
                    ? <EyeOff size={18} aria-hidden="true" />
                    : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <small className="field-error" id="auth-password-error">{errors.password}</small>}
            </label>

            {isRegister && (
              <label className="form-field" htmlFor="auth-confirmPassword">
                <span>Konfirmasi kata sandi</span>
                <div className="password-input-wrap">
                  <input
                    id="auth-confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Ulangi kata sandi Anda"
                    maxLength={128}
                    value={form.confirmPassword}
                    onChange={updateField}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'auth-confirmPassword-error' : undefined}
                  />
                  <button
                    className="password-visibility-toggle"
                    type="button"
                    aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                  >
                    {showConfirmPassword
                      ? <EyeOff size={18} aria-hidden="true" />
                      : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <small className="field-error" id="auth-confirmPassword-error">{errors.confirmPassword}</small>
                )}
              </label>
            )}

            <button className="button button-primary auth-submit-button" type="submit" disabled={submitting}>
              {submitting
                ? (isRegister ? 'Mendaftarkan akun…' : 'Memeriksa akun…')
                : <>{isRegister ? 'Daftar sekarang' : 'Masuk ke CarHub'} <ArrowRight size={17} aria-hidden="true" /></>}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? (
              <>Sudah punya akun? <AppLink className="text-link" to={`/login${nextQuery}`} navigate={navigate}>Masuk di sini</AppLink></>
            ) : (
              <>Belum punya akun? <AppLink className="text-link" to={`/register${nextQuery}`} navigate={navigate}>Daftar akun baru</AppLink></>
            )}
          </p>
        </section>
      </div>
    </main>
  )
}
