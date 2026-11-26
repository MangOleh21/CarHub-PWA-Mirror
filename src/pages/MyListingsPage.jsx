import { ArrowLeft, LogIn, Plus, UserPlus } from 'lucide-react'
import AppLink from '../components/AppLink.jsx'
import { LoadingState } from '../components/Feedback.jsx'
import MyListingsSection from '../components/MyListingsSection.jsx'
import { useAuth } from '../contexts/useAuth.js'

export default function MyListingsPage({ navigate, wishlistIds = [], toggleWishlist }) {
  const { user, status } = useAuth()

  if (status === 'loading') {
    return (
      <main className="page-content my-listings-page">
        <LoadingState label="Memeriksa sesi akun" />
      </main>
    )
  }

  return (
    <main className="page-content my-listings-page">
      <AppLink className="back-link" to="/profile" navigate={navigate}>
        <ArrowLeft size={17} aria-hidden="true" /> Kembali ke Profil
      </AppLink>

      <section className="page-intro my-listings-page-intro">
        <div>
          <p className="eyebrow">KATALOG PENJUAL</p>
          <h1>Mobil<br /><em>Saya.</em></h1>
          <p>Pantau seluruh mobil yang sedang tayang di katalog serta pengajuan jual yang sedang ditinjau atau ditolak.</p>
        </div>
        {user && (
          <AppLink className="button button-primary" to="/sell" navigate={navigate}>
            <Plus size={16} aria-hidden="true" /> Jual mobil
          </AppLink>
        )}
      </section>

      {!user ? (
        <section className="account-gate">
          <h2>Masuk untuk melihat daftar mobil Anda</h2>
          <p>Halaman Mobil Saya menampilkan seluruh unit tayang dan riwayat pengajuan jual yang terhubung dengan akun CarHub Anda.</p>
          <div className="account-actions">
            <AppLink className="button button-primary" to="/login?next=/my-listings" navigate={navigate}>
              <LogIn size={16} aria-hidden="true" /> Masuk
            </AppLink>
            <AppLink className="button button-outline" to="/register?next=/my-listings" navigate={navigate}>
              <UserPlus size={16} aria-hidden="true" /> Daftar akun
            </AppLink>
          </div>
        </section>
      ) : (
        <MyListingsSection
          navigate={navigate}
          wishlistIds={wishlistIds}
          toggleWishlist={toggleWishlist}
          showHeading={false}
        />
      )}
    </main>
  )
}
