import { ArrowLeft, ExternalLink, Smartphone } from 'lucide-react'
import AppLink from '../components/AppLink.jsx'
import { profile } from '../data/profile.js'

export default function AboutPage({ navigate }) {
  const initials = profile.name
    .split(/\s+/)
    .slice(0, 3)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <main className="page-content about-page">
      <AppLink className="back-link" to="/profile" navigate={navigate}>
        <ArrowLeft size={17} aria-hidden="true" /> Kembali ke Profil
      </AppLink>

      <section className="page-intro">
        <p className="eyebrow">TENTANG CARHUB</p>
        <h1>Pasar mobil bekas,<br /><em>lebih terbuka.</em></h1>
        <p>Pembeli dapat menjelajahi katalog, menyimpan favorit, dan menghubungi penjual via WhatsApp tanpa akun. Penjual dapat masuk untuk mengajukan mobil dan memantau listing miliknya.</p>
      </section>

      <section className="profile-card" aria-labelledby="profile-heading">
        <div className="profile-avatar">
          {profile.photoUrl
            ? <img src={profile.photoUrl} alt={`Foto ${profile.name}`} />
            : <span aria-hidden="true">{initials}</span>}
        </div>
        <div className="profile-copy">
          <p className="eyebrow">PEMBUAT</p>
          <h2 id="profile-heading">{profile.name}</h2>
          <dl className="profile-details">
            <div><dt>NIM</dt><dd>{profile.nim}</dd></div>
            <div><dt>Kelas</dt><dd>{profile.className}</dd></div>
            {profile.studyProgram && <div><dt>Program studi</dt><dd>{profile.studyProgram}</dd></div>}
          </dl>
          <a className="text-link" href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
            Profil GitHub <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>
      </section>

      <section className="about-section">
        <p className="eyebrow">DIBANGUN UNTUK</p>
        <h2>Pilihan yang terasa jelas.</h2>
        <p>Setiap listing menampilkan harga, tahun, jarak tempuh, transmisi, tipe bodi, warna, dan lokasi. Simpan mobil favorit di perangkat Anda, lalu lanjutkan percakapan langsung dengan penjual melalui WhatsApp.</p>
      </section>

      <section className="about-section" aria-labelledby="tech-stack-title">
        <p className="eyebrow">TEKNOLOGI</p>
        <h2 id="tech-stack-title">Dibangun dengan.</h2>
        <dl className="profile-details">
          <div><dt>Frontend</dt><dd>React · Vite</dd></div>
          <div><dt>Backend</dt><dd>Node.js · Express</dd></div>
          <div><dt>Database</dt><dd>Neon · PostgreSQL</dd></div>
          <div><dt>Platform</dt><dd>Progressive Web App</dd></div>
        </dl>
      </section>

      <section className="install-guide">
        <div className="install-guide-icon"><Smartphone size={22} aria-hidden="true" /></div>
        <div>
          <p className="eyebrow">CARHUB PWA</p>
          <h2>Pasang di perangkat Anda</h2>
          <p>Di Chrome, buka menu browser lalu pilih “Install app” atau “Tambahkan ke layar utama”. Setelah terpasang, CarHub dapat dibuka seperti aplikasi.</p>
        </div>
      </section>
    </main>
  )
}
