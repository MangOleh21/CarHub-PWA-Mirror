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
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from 'lucide-react'
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback.jsx'
import PaginationControls from '../../components/PaginationControls.jsx'
import {
  createAdminCustomer,
  deleteAdminCustomer,
  getAdminCustomers,
  updateAdminCustomer,
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

function validateCustomerForm(form, isEdit) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Nama lengkap wajib diisi.'
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Masukkan alamat email yang valid.'
  }
  if (!form.phone.trim() || !/^\+?\d[\d\s()-]{7,19}$/.test(form.phone.trim())) {
    errors.phone = 'Gunakan nomor WhatsApp yang valid.'
  }
  if (!isEdit || form.password || form.confirmPassword) {
    if (form.password.length < 8) {
      errors.password = 'Kata sandi minimal 8 karakter.'
    }
    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Kata sandi dan konfirmasi kata sandi tidak sama.'
    }
  }
  return errors
}

export default function AdminCustomersPanel() {
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [requestKey, setRequestKey] = useState(0)
  const [response, setResponse] = useState({ key: -1, result: null, error: null })

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
    getAdminCustomers({ search, status, page, pageSize })
      .then((result) => { if (active) setResponse({ key: requestKey, result, error: null }) })
      .catch((cause) => { if (active) setResponse({ key: requestKey, result: null, error: cause.message }) })
    return () => { active = false }
  }, [search, status, page, pageSize, requestKey])

  const loading = response.key !== requestKey
  const result = response.key === requestKey ? response.result : null
  const listError = response.key === requestKey ? response.error : null

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

  function openEditForm(customer) {
    setFormMode('edit')
    setEditingId(customer.id)
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      location: customer.location || '',
      isActive: customer.isActive,
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
    const errors = validateCustomerForm(form, isEdit)
    setFormErrors(errors)
    if (Object.keys(errors).length) return

    setBusy(true)
    try {
      if (isEdit) {
        const updated = await updateAdminCustomer(editingId, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          location: form.location.trim() || null,
          isActive: form.isActive,
          ...(form.password ? { password: form.password } : {}),
        })
        setActionMessage(`Data pengguna ${updated.name} berhasil diperbarui.`)
      } else {
        const created = await createAdminCustomer({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          location: form.location.trim() || null,
          isActive: form.isActive,
          password: form.password,
        })
        setActionMessage(`Pengguna baru ${created.name} berhasil ditambahkan.`)
      }
      closeForm()
      setRequestKey((key) => key + 1)
    } catch (cause) {
      setActionError(
        cause?.code === 'EMAIL_ALREADY_REGISTERED'
          ? 'Email tersebut sudah digunakan oleh akun lain.'
          : cause.message,
      )
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(customer) {
    const nextActive = !customer.isActive
    const confirmCopy = nextActive
      ? `Aktifkan kembali akun ${customer.name} (${customer.email})?`
      : `Nonaktifkan akun ${customer.name} (${customer.email})? Sesi aktif pengguna akan dicabut.`
    if (!window.confirm(confirmCopy)) return

    setBusy(true)
    setActionError(null)
    setActionMessage(null)
    try {
      await updateAdminCustomer(customer.id, {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        location: customer.location,
        isActive: nextActive,
      })
      setActionMessage(
        nextActive
          ? `Akun ${customer.name} diaktifkan kembali.`
          : `Akun ${customer.name} dinonaktifkan.`,
      )
      if (editingId === customer.id) closeForm()
      setRequestKey((key) => key + 1)
    } catch (cause) {
      setActionError(cause.message)
    } finally {
      setBusy(false)
    }
  }

  async function removeCustomer(customer) {
    if (!window.confirm(
      `Hapus permanen akun ${customer.name} (${customer.email})? Sesi pengguna akan dihapus, sementara listing mobil dan pengajuan lama tetap tersimpan tanpa pemilik.`,
    )) return

    setBusy(true)
    setActionError(null)
    setActionMessage(null)
    try {
      await deleteAdminCustomer(customer.id)
      setActionMessage(`Akun ${customer.name} telah dihapus.`)
      if (editingId === customer.id) closeForm()
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
    setRequestKey((key) => key + 1)
  }

  function changeStatus(event) {
    setStatus(event.target.value)
    setPage(1)
    setRequestKey((key) => key + 1)
  }

  function changePage(nextPage) {
    setPage(nextPage)
    setRequestKey((key) => key + 1)
  }

  function changePageSize(nextPageSize) {
    setPageSize(nextPageSize)
    setPage(1)
    setRequestKey((key) => key + 1)
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">DATA PENGGUNA</p>
          <h2>Kelola pengguna</h2>
        </div>
        {formMode !== 'create' && (
          <button className="button button-primary" type="button" onClick={openCreateForm} disabled={busy}>
            <UserPlus size={16} aria-hidden="true" /> Tambah pengguna
          </button>
        )}
      </div>

      {actionError && <p className="notice notice-error" role="alert">{actionError}</p>}
      {actionMessage && <p className="notice notice-success" role="status">{actionMessage}</p>}

      {formMode && (
        <section className="admin-customer-form-card" aria-labelledby="customer-form-heading">
          <div className="admin-panel-heading">
            <div>
              <p className="eyebrow">{formMode === 'edit' ? `EDIT PENGGUNA #${editingId}` : 'PENGGUNA BARU'}</p>
              <h3 id="customer-form-heading">
                {formMode === 'edit' ? 'Perbarui data pengguna' : 'Tambah akun pengguna'}
              </h3>
            </div>
            <button
              className="button button-quiet"
              type="button"
              onClick={closeForm}
              aria-label="Tutup formulir pengguna"
            >
              <X size={16} aria-hidden="true" /> Tutup
            </button>
          </div>

          <form className="auth-form" onSubmit={submitForm} noValidate>
            <div className="form-grid">
              <label className="form-field" htmlFor="admin-customer-name">
                <span>Nama lengkap</span>
                <input
                  id="admin-customer-name"
                  name="name"
                  maxLength={150}
                  value={form.name}
                  onChange={updateField}
                  aria-invalid={Boolean(formErrors.name)}
                />
                {formErrors.name && <small className="field-error">{formErrors.name}</small>}
              </label>

              <label className="form-field" htmlFor="admin-customer-email">
                <span>Email</span>
                <input
                  id="admin-customer-email"
                  name="email"
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={updateField}
                  aria-invalid={Boolean(formErrors.email)}
                />
                {formErrors.email && <small className="field-error">{formErrors.email}</small>}
              </label>

              <label className="form-field" htmlFor="admin-customer-phone">
                <span>Nomor WhatsApp</span>
                <input
                  id="admin-customer-phone"
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

              <label className="form-field" htmlFor="admin-customer-location">
                <span>Kota / lokasi <small>Opsional</small></span>
                <input
                  id="admin-customer-location"
                  name="location"
                  maxLength={150}
                  placeholder="Contoh: Semarang"
                  value={form.location}
                  onChange={updateField}
                />
              </label>

              <label className="form-field" htmlFor="admin-customer-password">
                <span>
                  {formMode === 'edit' ? 'Kata sandi baru' : 'Kata sandi'}{' '}
                  <small>{formMode === 'edit' ? 'Opsional, min. 8 karakter' : 'Min. 8 karakter'}</small>
                </span>
                <div className="password-input-wrap">
                  <input
                    id="admin-customer-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    maxLength={128}
                    placeholder={formMode === 'edit' ? 'Kosongkan jika tidak direset' : 'Minimal 8 karakter'}
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

              <label className="form-field" htmlFor="admin-customer-confirm-password">
                <span>Konfirmasi kata sandi</span>
                <div className="password-input-wrap">
                  <input
                    id="admin-customer-confirm-password"
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
                <span>Akun aktif (menonaktifkan akun akan langsung mencabut sesi login pengguna)</span>
              </label>
            )}

            <div className="account-actions">
              <button className="button button-primary" type="submit" disabled={busy}>
                <Save size={15} aria-hidden="true" />{' '}
                {busy ? 'Menyimpan…' : (formMode === 'edit' ? 'Simpan perubahan' : 'Buat akun pengguna')}
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
          <span className="sr-only">Cari pengguna berdasarkan nama, email, telepon, atau kota</span>
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
          <span className="sr-only">Filter status akun</span>
          <select value={status} onChange={changeStatus}>
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </label>
        <button className="button button-outline" type="submit">Cari</button>
      </form>

      {loading && <LoadingState label="Memuat daftar pengguna" />}
      {!loading && listError && (
        <ErrorState message={listError} onRetry={() => setRequestKey((key) => key + 1)} />
      )}
      {!loading && !listError && result?.data.length === 0 && (
        <EmptyState
          title="Belum ada pengguna yang cocok"
          message="Pengguna yang mendaftar atau dibuat admin akan tampil di sini."
        />
      )}
      {!loading && !listError && result?.data.length > 0 && (
        <>
          <div className="admin-customer-list">
            {result.data.map((customer) => {
              const initials = customer.name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase() || 'U'
              return (
                <article className="admin-customer-card" key={customer.id}>
                  <div className="admin-customer-card-top">
                    <div className="admin-customer-identity">
                      <div className="profile-user-avatar admin-customer-avatar" aria-hidden="true">
                        <span>{initials}</span>
                      </div>
                      <div className="profile-user-title-block">
                        <div className="profile-user-badge-row">
                          <span className="admin-record-id">
                            #{customer.id} · Daftar {new Date(customer.createdAt).toLocaleDateString('id-ID')}
                          </span>
                          <span className={`status-badge ${customer.isActive ? 'status-approved' : 'status-rejected'}`}>
                            {customer.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <h3>{customer.name}</h3>
                        <p className="profile-user-email">
                          <Mail size={13} aria-hidden="true" /> {customer.email}
                        </p>
                      </div>
                    </div>

                    <div className="admin-row-actions">
                      <button
                        className="button button-quiet"
                        type="button"
                        disabled={busy}
                        onClick={() => openEditForm(customer)}
                        aria-label={`Edit ${customer.name}`}
                      >
                        <Pencil size={15} aria-hidden="true" /> Edit
                      </button>
                      <button
                        className="button button-quiet"
                        type="button"
                        disabled={busy}
                        onClick={() => toggleActive(customer)}
                        aria-label={`${customer.isActive ? 'Nonaktifkan' : 'Aktifkan'} ${customer.name}`}
                      >
                        {customer.isActive
                          ? <><UserX size={15} aria-hidden="true" /> Nonaktifkan</>
                          : <><UserCheck size={15} aria-hidden="true" /> Aktifkan</>}
                      </button>
                      <button
                        className="button button-danger-quiet"
                        type="button"
                        disabled={busy}
                        onClick={() => removeCustomer(customer)}
                        aria-label={`Hapus ${customer.name}`}
                      >
                        <Trash2 size={15} aria-hidden="true" /> Hapus
                      </button>
                    </div>
                  </div>

                  <dl className="admin-customer-meta">
                    <div>
                      <dt><Phone size={13} aria-hidden="true" /> WhatsApp</dt>
                      <dd className="mono">{customer.phone}</dd>
                    </div>
                    <div>
                      <dt><MapPin size={13} aria-hidden="true" /> Lokasi</dt>
                      <dd>{customer.location || 'Belum diatur'}</dd>
                    </div>
                  </dl>
                </article>
              )
            })}
          </div>
          <PaginationControls
            currentPage={page}
            pageSize={pageSize}
            totalPages={result.pagination.totalPages}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
            label="Navigasi halaman daftar pengguna"
          />
        </>
      )}
    </section>
  )
}
