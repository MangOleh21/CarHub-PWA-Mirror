import { useEffect, useState } from 'react'
import {
  Eye,
  EyeOff,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from 'lucide-react'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback.jsx'
import PaginationControls from '../../components/PaginationControls.jsx'
import { getPageItems } from '../../lib/pagination.js'
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
} from '../../services/api.js'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  location: '',
  isActive: true,
  password: '',
  confirmPassword: '',
}

function validateAdminForm(form, isEdit) {
  const errors = {}
  if (isEdit && !form.name.trim()) {
    errors.name = 'Nama lengkap wajib diisi.'
  }
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Masukkan alamat email yang valid.'
  }
  const trimmedPhone = form.phone.trim()
  if (trimmedPhone && !/^\+?\d[\d\s()-]{7,19}$/.test(trimmedPhone)) {
    errors.phone = 'Gunakan nomor WhatsApp yang valid.'
  }
  if (!isEdit || form.password || form.confirmPassword) {
    if (form.password.length < 12) {
      errors.password = 'Kata sandi admin minimal 12 karakter.'
    }
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Kata sandi dan konfirmasi kata sandi tidak sama.'
    }
  }
  return errors
}

export default function AdminAccountsPanel() {
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [requestKey, setRequestKey] = useState(0)
  const [response, setResponse] = useState({ key: -1, admins: null, error: null })

  const [formMode, setFormMode] = useState(null) // null | 'create' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [actionMessage, setActionMessage] = useState(null)

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

  const filteredAdmins = (admins ?? []).filter((admin) => {
    if (status === 'active' && !admin.isActive) return false
    if (status === 'inactive' && admin.isActive) return false
    if (!search) return true
    const term = search.toLocaleLowerCase('id-ID')
    return [admin.name, admin.email, admin.role, admin.phone, admin.location]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase('id-ID').includes(term))
  })
  const pageResult = getPageItems(filteredAdmins, page, pageSize)

  function openCreateForm() {
    setFormMode('create')
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
    setActionError(null)
    setActionMessage(null)
  }

  function openEditForm(admin) {
    setFormMode('edit')
    setEditingId(admin.id)
    setForm({
      name: admin.name || admin.email.split('@')[0] || '',
      email: admin.email || '',
      phone: admin.phone || '',
      location: admin.location || '',
      isActive: admin.isActive,
      password: '',
      confirmPassword: '',
    })
    setFormErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
    setActionError(null)
    setActionMessage(null)
  }

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    if (formErrors[name]) {
      setFormErrors((current) => {
        const next = { ...current }
        delete next[name]
        return next
      })
    }
  }

  async function submitForm(event) {
    event.preventDefault()
    setActionError(null)
    setActionMessage(null)

    const isEdit = formMode === 'edit'
    const errors = validateAdminForm(form, isEdit)
    setFormErrors(errors)
    if (Object.keys(errors).length) return

    setBusy(true)
    try {
      if (isEdit) {
        const updated = await updateAdminUser(editingId, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          location: form.location.trim() || null,
          isActive: form.isActive,
          ...(form.password ? { password: form.password } : {}),
        })
        setActionMessage(`Data admin ${updated.name || updated.email} berhasil diperbarui.`)
      } else {
        const created = await createAdminUser({
          ...(form.name.trim() ? { name: form.name.trim() } : {}),
          email: form.email.trim(),
          phone: form.phone.trim(),
          location: form.location.trim() || null,
          isActive: form.isActive,
          password: form.password,
        })
        setActionMessage(
          `Akun admin ${created.name ? `${created.name} (${created.email})` : created.email} berhasil dibuat.`,
        )
      }
      closeForm()
      setRequestKey((key) => key + 1)
    } catch (cause) {
      setActionError(
        cause?.code === 'ADMIN_EMAIL_EXISTS'
          ? 'Email tersebut sudah digunakan oleh akun lain.'
          : cause.message,
      )
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(admin) {
    const nextActive = !admin.isActive
    const label = admin.name ? `${admin.name} (${admin.email})` : admin.email
    const confirmCopy = nextActive
      ? `Aktifkan kembali akun admin ${label}?`
      : `Nonaktifkan akun admin ${label}? Sesi aktif akun tersebut akan dicabut.`
    if (!window.confirm(confirmCopy)) return

    setBusy(true)
    setActionError(null)
    setActionMessage(null)
    try {
      await updateAdminUser(admin.id, {
        name: admin.name || admin.email.split('@')[0] || 'Administrator',
        email: admin.email,
        phone: admin.phone || '',
        location: admin.location ?? null,
        isActive: nextActive,
      })
      setActionMessage(
        nextActive
          ? `Akun admin ${label} diaktifkan kembali.`
          : `Akun admin ${label} telah dinonaktifkan.`,
      )
      if (editingId === admin.id) closeForm()
      setRequestKey((key) => key + 1)
    } catch (cause) {
      setActionError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeAdmin(admin) {
    const label = admin.name ? `${admin.name} (${admin.email})` : admin.email
    if (!window.confirm(
      `Hapus permanen akun admin ${label}? Sesi login admin akan dicabut, sedangkan riwayat review dan katalog tetap tersimpan.`,
    )) return

    setBusy(true)
    setActionError(null)
    setActionMessage(null)
    try {
      await deleteAdminUser(admin.id)
      setActionMessage(`Akun admin ${label} telah dihapus.`)
      if (editingId === admin.id) closeForm()
      setRequestKey((key) => key + 1)
    } catch (cause) {
      setActionError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  function applySearch(event) {
    event.preventDefault()
    setSearch(searchDraft.trim())
    setPage(1)
  }

  function changeStatus(event) {
    setStatus(event.target.value)
    setPage(1)
  }

  function changePageSize(nextPageSize) {
    setPageSize(nextPageSize)
    setPage(1)
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">AKSES INTERNAL</p>
          <h2>Kelola admin</h2>
        </div>
        {formMode !== 'create' && (
          <button className="button button-primary" type="button" onClick={openCreateForm} disabled={busy}>
            <UserPlus size={16} aria-hidden="true" /> Tambah admin
          </button>
        )}
      </div>

      {actionError && <p className="notice notice-error" role="alert">{actionError}</p>}
      {actionMessage && <p className="notice notice-success" role="status">{actionMessage}</p>}

      {formMode && (
        <section className="admin-customer-form-card" aria-labelledby="admin-form-heading">
          <div className="admin-panel-heading">
            <div>
              <p className="eyebrow">{formMode === 'edit' ? `EDIT ADMIN #${editingId}` : 'AKUN ADMIN BARU'}</p>
              <h3 id="admin-form-heading">
                {formMode === 'edit' ? 'Perbarui data administrator' : 'Tambah akun administrator'}
              </h3>
            </div>
            <button
              className="button button-quiet"
              type="button"
              onClick={closeForm}
              aria-label="Tutup formulir admin"
            >
              <X size={16} aria-hidden="true" /> Tutup
            </button>
          </div>

          <form className="auth-form" onSubmit={submitForm} noValidate>
            <div className="form-grid">
              <label className="form-field" htmlFor="new-admin-name">
                <span>Nama lengkap {formMode !== 'edit' && <small>Opsional</small>}</span>
                <input
                  id="new-admin-name"
                  name="name"
                  autoComplete="name"
                  placeholder="Contoh: Moderator CarHub"
                  maxLength={150}
                  value={form.name}
                  onChange={updateField}
                  aria-invalid={Boolean(formErrors.name)}
                />
                {formErrors.name && <small className="field-error">{formErrors.name}</small>}
              </label>

              <label className="form-field" htmlFor="new-admin-email">
                <span>Email admin</span>
                <input
                  id="new-admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@carhub.id"
                  maxLength={254}
                  value={form.email}
                  onChange={updateField}
                  aria-invalid={Boolean(formErrors.email)}
                />
                {formErrors.email && <small className="field-error">{formErrors.email}</small>}
              </label>

              <label className="form-field" htmlFor="new-admin-phone">
                <span>Nomor WhatsApp <small>Opsional</small></span>
                <input
                  id="new-admin-phone"
                  name="phone"
                  type="tel"
                  maxLength={25}
                  placeholder="08xx atau +62"
                  value={form.phone}
                  onChange={updateField}
                  aria-invalid={Boolean(formErrors.phone)}
                />
                {formErrors.phone && <small className="field-error">{formErrors.phone}</small>}
              </label>

              <label className="form-field" htmlFor="new-admin-location">
                <span>Kota / lokasi <small>Opsional</small></span>
                <input
                  id="new-admin-location"
                  name="location"
                  maxLength={150}
                  placeholder="Contoh: Semarang"
                  value={form.location}
                  onChange={updateField}
                />
              </label>

              <label className="form-field" htmlFor="new-admin-password">
                <span>
                  {formMode === 'edit' ? 'Kata sandi baru' : 'Kata sandi sementara'}{' '}
                  <small>{formMode === 'edit' ? 'Opsional, min. 12 karakter' : 'Min. 12 karakter'}</small>
                </span>
                <div className="password-input-wrap">
                  <input
                    id="new-admin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    maxLength={128}
                    placeholder={formMode === 'edit' ? 'Kosongkan jika tidak direset' : 'Minimal 12 karakter'}
                    value={form.password}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.password)}
                  />
                  <button
                    className="password-visibility-toggle"
                    type="button"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
                {formErrors.password && <small className="field-error">{formErrors.password}</small>}
              </label>

              <label className="form-field" htmlFor="new-admin-confirm-password">
                <span>Konfirmasi kata sandi</span>
                <div className="password-input-wrap">
                  <input
                    id="new-admin-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    maxLength={128}
                    placeholder="Ulangi kata sandi"
                    value={form.confirmPassword}
                    onChange={updateField}
                    aria-invalid={Boolean(formErrors.confirmPassword)}
                  />
                  <button
                    className="password-visibility-toggle"
                    type="button"
                    aria-label={showConfirmPassword
                      ? 'Sembunyikan konfirmasi kata sandi'
                      : 'Tampilkan konfirmasi kata sandi'}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                  >
                    {showConfirmPassword
                      ? <EyeOff size={18} aria-hidden="true" />
                      : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
                {formErrors.confirmPassword && <small className="field-error">{formErrors.confirmPassword}</small>}
              </label>
            </div>

            {formMode === 'edit' && (
              <label className="consent-field">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={updateField}
                />
                <span>Akun aktif (menonaktifkan akun akan langsung mencabut sesi login admin)</span>
              </label>
            )}

            <div className="account-actions">
              <button className="button button-primary" type="submit" disabled={busy}>
                <Save size={15} aria-hidden="true" />{' '}
                {busy ? 'Menyimpan…' : (formMode === 'edit' ? 'Simpan perubahan' : 'Buat akun admin')}
              </button>
              <button className="button button-quiet" type="button" onClick={closeForm} disabled={busy}>
                Batal
              </button>
            </div>
          </form>
        </section>
      )}

      <form className="admin-customer-toolbar" onSubmit={applySearch}>
        <label className="search-field">
          <span className="sr-only">Cari admin berdasarkan nama, email, atau role</span>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            maxLength={100}
            placeholder="Cari nama, email, WhatsApp, atau kota"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
        </label>
        <label className="status-filter">
          <span className="sr-only">Filter status akun admin</span>
          <select value={status} onChange={changeStatus}>
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </label>
        <button className="button button-outline" type="submit">Cari</button>
      </form>

      {loading && <LoadingState label="Memuat akun administrator" />}
      {!loading && listError && (
        <ErrorState message={listError} onRetry={() => setRequestKey((key) => key + 1)} />
      )}
      {!loading && !listError && pageResult.items.length === 0 && (
        <EmptyState
          title="Belum ada akun admin yang cocok"
          message="Akun owner dan administrator akan ditampilkan di sini."
        />
      )}
      {!loading && !listError && pageResult.items.length > 0 && (
        <>
          <div className="admin-customer-list">
            {pageResult.items.map((admin) => {
              const displayName = admin.name || admin.email.split('@')[0] || 'Administrator'
              const initials = displayName
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase() || 'A'
              return (
                <article className="admin-customer-card" key={admin.id}>
                  <div className="admin-customer-card-top">
                    <div className="admin-customer-identity">
                      <div className="profile-user-avatar admin-customer-avatar" aria-hidden="true">
                        <span>{initials}</span>
                      </div>
                      <div className="profile-user-title-block">
                        <div className="profile-user-badge-row">
                          <span className="admin-record-id">
                            #{admin.id} · Daftar {new Date(admin.createdAt).toLocaleDateString('id-ID')}
                          </span>
                          <span className="status-badge role-badge-admin">
                            <ShieldCheck size={12} aria-hidden="true" />{' '}
                            {admin.role === 'owner' ? 'Owner' : 'Admin'}
                          </span>
                          <span className={`status-badge ${admin.isActive ? 'status-approved' : 'status-rejected'}`}>
                            {admin.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <h3>{displayName}</h3>
                        <p className="profile-user-email">
                          <Mail size={13} aria-hidden="true" /> {admin.email}
                        </p>
                      </div>
                    </div>

                    {admin.role === 'admin' && (
                      <div className="admin-row-actions">
                        <button
                          className="button button-quiet"
                          type="button"
                          disabled={busy}
                          onClick={() => openEditForm(admin)}
                          aria-label={`Edit ${displayName}`}
                        >
                          <Pencil size={15} aria-hidden="true" /> Edit
                        </button>
                        <button
                          className="button button-quiet"
                          type="button"
                          disabled={busy}
                          onClick={() => toggleActive(admin)}
                          aria-label={`${admin.isActive ? 'Nonaktifkan' : 'Aktifkan'} ${displayName}`}
                        >
                          {admin.isActive
                            ? <><UserX size={15} aria-hidden="true" /> Nonaktifkan</>
                            : <><UserCheck size={15} aria-hidden="true" /> Aktifkan</>}
                        </button>
                        <button
                          className="button button-danger-quiet"
                          type="button"
                          disabled={busy}
                          onClick={() => removeAdmin(admin)}
                          aria-label={`Hapus ${displayName}`}
                        >
                          <Trash2 size={15} aria-hidden="true" /> Hapus
                        </button>
                      </div>
                    )}
                  </div>

                  <dl className="admin-customer-meta">
                    <div>
                      <dt><Phone size={13} aria-hidden="true" /> WhatsApp</dt>
                      <dd className={admin.phone ? 'mono' : ''}>{admin.phone || 'Belum diatur'}</dd>
                    </div>
                    <div>
                      <dt><MapPin size={13} aria-hidden="true" /> Lokasi</dt>
                      <dd>{admin.location || 'Belum diatur'}</dd>
                    </div>
                  </dl>
                </article>
              )
            })}
          </div>
          <PaginationControls
            currentPage={pageResult.page}
            pageSize={pageSize}
            totalPages={pageResult.totalPages}
            onPageChange={setPage}
            onPageSizeChange={changePageSize}
            label="Navigasi halaman daftar admin"
          />
        </>
      )}
    </section>
  )
}
