import {
  CarFront,
  ChevronRight,
  CircleAlert,
  Eye,
  EyeOff,
  Info,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
import AppLink from '../components/AppLink.jsx'
import { LoadingState } from '../components/Feedback.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { useAuth } from '../contexts/useAuth.js'

function UserProfileCard({ navigate }) {
  const { user, status, sessionError, logout, updateProfile, refreshSession } = useAuth()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    name: '',
    phone: '',
    location: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null)

  function startEditing() {
    setDraft({
      name: user.name || '',
      phone: user.phone || '',
      location: user.location || '',
      newPassword: '',
      confirmNewPassword: '',
    })
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setFeedback(null)
    setEditing(true)
  }

  function cancelEditing() {
    setDraft((current) => ({ ...current, newPassword: '', confirmNewPassword: '' }))
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setFeedback(null)
    setEditing(false)
  }

  async function saveProfile(event) {
    event.preventDefault()
    setFeedback(null)
    if (!draft.name.trim()) {
      setFeedback({ type: 'error', text: 'Nama lengkap wajib diisi.' })
      return
    }
    if (!/^\+?\d[\d\s()-]{7,19}$/.test(draft.phone.trim())) {
      setFeedback({ type: 'error', text: 'Gunakan nomor WhatsApp yang valid.' })
      return
    }
    if (draft.newPassword || draft.confirmNewPassword) {
      if (draft.newPassword.length < 8) {
        setFeedback({ type: 'error', text: 'Kata sandi baru minimal 8 karakter.' })
        return
      }
      if (draft.newPassword !== draft.confirmNewPassword) {
        setFeedback({ type: 'error', text: 'Kata sandi baru dan konfirmasi kata sandi tidak sama.' })
        return
      }
    }

    setBusy(true)
    try {
      await updateProfile({
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        location: draft.location.trim() || null,
        ...(draft.newPassword ? { newPassword: draft.newPassword } : {}),
      })
      setDraft((current) => ({ ...current, newPassword: '', confirmNewPassword: '' }))
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      setEditing(false)
      setFeedback({
        type: 'success',
        text: draft.newPassword
          ? 'Profil dan kata sandi baru berhasil disimpan.'
          : 'Profil pengguna berhasil diperbarui.',
      })
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    setBusy(true)
    setFeedback(null)
    try {
      await logout()
      setEditing(false)
    } catch (error) {
      setFeedback({ type: 'error', text: error.message })
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading') {
    return (
      <section className="profile-user-card" aria-label="Memuat profil pengguna">
        <LoadingState label="Memeriksa sesi akun" />
      </section>
    )
  }

  if (!user) {
    return (
      <section className="profile-user-card profile-guest-card" aria-labelledby="profile-user-heading">
        <div className="profile-user-top">
          <div className="profile-user-identity">
            <div className="profile-user-avatar is-guest" aria-hidden="true">
              <UserRound size={26} strokeWidth={1.7} />
            </div>
            <div>
              <p className="eyebrow">AKUN PENGGUNA</p>
              <h2 id="profile-user-heading">Belum masuk akun</h2>
              <p className="profile-user-subtitle">
                Masuk atau daftar untuk mengajukan jual mobil dan memantau katalog unit milik Anda.
              </p>
            </div>
          </div>
        </div>
        {sessionError && (
          <div className="notice notice-error" role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            <span>{sessionError}</span>
            <button className="button button-quiet" type="button" onClick={refreshSession}>Coba lagi</button>
          </div>
        )}
        <div className="account-actions">
          <AppLink className="button button-primary" to="/login?next=/profile" navigate={navigate}>
            <LogIn size={16} aria-hidden="true" /> Masuk
          </AppLink>
          <AppLink className="button button-outline" to="/register?next=/profile" navigate={navigate}>
            <UserPlus size={16} aria-hidden="true" /> Daftar akun
          </AppLink>
        </div>
      </section>
    )
  }

  const userInitials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <section className="profile-user-card" aria-labelledby="profile-user-heading">
      <div className="profile-user-top">
        <div className="profile-user-identity">
          <div className="profile-user-avatar" aria-hidden="true">
            <span>{userInitials || 'U'}</span>
          </div>
          <div className="profile-user-title-block">
            <div className="profile-user-badge-row">
              <p className="eyebrow">PROFIL PENGGUNA</p>
              <span className="status-badge my-listing-status-active">Aktif</span>
            </div>
            <h2 id="profile-user-heading">{user.name}</h2>
            <p className="profile-user-email">
              <Mail size={14} aria-hidden="true" /> {user.email}
            </p>
          </div>
        </div>
        <div className="account-actions">
          {!editing && (
            <button className="button button-outline" type="button" onClick={startEditing} disabled={busy}>
              <Pencil size={15} aria-hidden="true" /> Edit profil
            </button>
          )}
          <button className="button button-quiet" type="button" onClick={handleLogout} disabled={busy}>
            <LogOut size={15} aria-hidden="true" /> Keluar
          </button>
        </div>
      </div>

      {feedback && (
        <p className={`notice ${feedback.type === 'error' ? 'notice-error' : 'notice-success'}`} role="status">
          {feedback.text}
        </p>
      )}

      {!editing ? (
        <dl className="profile-meta-grid">
          <div className="profile-meta-item">
            <dt><Phone size={14} aria-hidden="true" /> Nomor WhatsApp</dt>
            <dd className="mono">{user.phone}</dd>
          </div>
          <div className="profile-meta-item">
            <dt><MapPin size={14} aria-hidden="true" /> Lokasi</dt>
            <dd>{user.location || 'Belum diatur'}</dd>
          </div>
        </dl>
      ) : (
        <form className="auth-form account-edit-form" onSubmit={saveProfile} noValidate>
          <div className="form-grid">
            <label className="form-field" htmlFor="profile-name">
              <span>Nama lengkap</span>
              <input
                id="profile-name"
                autoComplete="name"
                value={draft.name}
                maxLength={150}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="form-field" htmlFor="profile-phone">
              <span>Nomor WhatsApp</span>
              <input
                id="profile-phone"
                type="tel"
                autoComplete="tel"
                maxLength={25}
                value={draft.phone}
                onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
            <label className="form-field" htmlFor="profile-location">
              <span>Kota / lokasi</span>
              <input
                id="profile-location"
                autoComplete="address-level2"
                maxLength={150}
                placeholder="Contoh: Semarang"
                value={draft.location}
                onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
              />
            </label>
          </div>
          <div className="profile-password-section">
            <p className="eyebrow">UBAH KATA SANDI (OPSIONAL)</p>
            <div className="form-grid">
              <label className="form-field" htmlFor="profile-new-password">
                <span>Kata sandi baru <small>Min. 8 karakter</small></span>
                <div className="password-input-wrap">
                  <input
                    id="profile-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    maxLength={128}
                    value={draft.newPassword}
                    onChange={(event) => setDraft((current) => ({ ...current, newPassword: event.target.value }))}
                  />
                  <button
                    className="password-visibility-toggle"
                    type="button"
                    aria-label={showNewPassword ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
                    aria-pressed={showNewPassword}
                    onClick={() => setShowNewPassword((visible) => !visible)}
                  >
                    {showNewPassword
                      ? <EyeOff size={18} aria-hidden="true" />
                      : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </label>
              <label className="form-field" htmlFor="profile-confirm-new-password">
                <span>Konfirmasi kata sandi baru</span>
                <div className="password-input-wrap">
                  <input
                    id="profile-confirm-new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Ulangi kata sandi baru"
                    maxLength={128}
                    value={draft.confirmNewPassword}
                    onChange={(event) => setDraft((current) => ({
                      ...current,
                      confirmNewPassword: event.target.value,
                    }))}
                  />
                  <button
                    className="password-visibility-toggle"
                    type="button"
                    aria-label={showConfirmPassword
                      ? 'Sembunyikan konfirmasi kata sandi baru'
                      : 'Tampilkan konfirmasi kata sandi baru'}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                  >
                    {showConfirmPassword
                      ? <EyeOff size={18} aria-hidden="true" />
                      : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </label>
            </div>
          </div>
          <div className="account-actions">
            <button className="button button-primary" type="submit" disabled={busy}>
              <Save size={15} aria-hidden="true" /> {busy ? 'Menyimpan…' : 'Simpan perubahan'}
            </button>
            <button className="button button-quiet" type="button" onClick={cancelEditing} disabled={busy}>
              <X size={15} aria-hidden="true" /> Batal
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

export default function ProfilePage({ navigate }) {
  const { user } = useAuth()

  return (
    <main className="page-content profile-page">
      <section className="page-intro">
        <p className="eyebrow">PROFIL SAYA</p>
        <h1>Akun &amp;<br /><em>pengaturan Anda.</em></h1>
        <p>Kelola data kontak penjual, buka katalog mobil milik Anda, dan atur preferensi tampilan CarHub.</p>
      </section>

      <UserProfileCard navigate={navigate} />

      {user && (
        <section className="profile-utility-card profile-listings-card" aria-labelledby="profile-listings-title">
          <div className="profile-about-head">
            <span className="install-guide-icon" aria-hidden="true">
              <CarFront size={20} strokeWidth={1.8} />
            </span>
            <div>
              <p className="eyebrow">KATALOG PENJUAL</p>
              <h2 id="profile-listings-title">Mobil Saya</h2>
              <p>Lihat seluruh unit yang sedang tayang, pengajuan menunggu review, dan catatan moderasi admin pada halaman tersendiri.</p>
            </div>
          </div>
          <div className="account-actions">
            <AppLink className="button button-primary" to="/my-listings" navigate={navigate}>
              Buka halaman Mobil Saya <ChevronRight size={16} aria-hidden="true" />
            </AppLink>
            <AppLink className="button button-outline" to="/sell" navigate={navigate}>
              <Plus size={16} aria-hidden="true" /> Jual mobil
            </AppLink>
          </div>
        </section>
      )}

      <div className="profile-utilities">
        <section className="profile-utility-card theme-settings" aria-labelledby="theme-settings-title">
          <p className="eyebrow">PREFERENSI</p>
          <h2 id="theme-settings-title">Pengaturan tampilan</h2>
          <ThemeToggle />
        </section>

        <section className="profile-utility-card profile-about-card" aria-labelledby="profile-about-title">
          <div className="profile-about-head">
            <span className="install-guide-icon" aria-hidden="true">
              <Info size={20} strokeWidth={1.8} />
            </span>
            <div>
              <p className="eyebrow">INFORMASI APLIKASI</p>
              <h2 id="profile-about-title">Tentang CarHub</h2>
              <p>Lihat profil pembuat, arsitektur teknologi, dan panduan pemasangan CarHub PWA.</p>
            </div>
          </div>
          <AppLink className="button button-outline profile-about-button" to="/about" navigate={navigate}>
            Buka halaman Tentang <ChevronRight size={16} aria-hidden="true" />
          </AppLink>
        </section>
      </div>
    </main>
  )
}
