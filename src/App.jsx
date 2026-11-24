import { ArrowDownToLine } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import AppLink from './components/AppLink.jsx'
import BrandMark from './components/BrandMark.jsx'
import BottomNav from './components/BottomNav.jsx'
import AdminPortal from './pages/AdminPage.jsx'
import ProfilePage from './pages/AboutPage.jsx'
import CatalogPage from './pages/CatalogPage.jsx'
import CarDetailPage from './pages/CarDetailPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import SellFormPage from './pages/SellPage.jsx'
import WishlistPage from './pages/WishlistPage.jsx'
import useWishlist from './hooks/useWishlist.js'
import './App.css'

function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    function handleInstallable(event) {
      event.preventDefault()
      setInstallEvent(event)
    }

    function handleInstalled() {
      setInstalled(true)
      setInstallEvent(null)
    }

    window.addEventListener('beforeinstallprompt', handleInstallable)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallable)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  if (!installEvent || installed) return null

  async function installApp() {
    await installEvent.prompt()
    setInstallEvent(null)
  }

  return (
    <button className="install-button" type="button" onClick={installApp}>
      <ArrowDownToLine size={15} aria-hidden="true" /> Pasang aplikasi
    </button>
  )
}

function NotFoundPage({ navigate }) {
  return (
    <main className="page-content not-found-page">
      <p className="eyebrow">404 · HALAMAN TIDAK DITEMUKAN</p>
      <h1>Halaman ini tidak ada.</h1>
      <AppLink className="button button-primary" to="/catalog" navigate={navigate}>Kembali ke katalog</AppLink>
    </main>
  )
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const { wishlistIds, storageAvailable, toggleWishlist } = useWishlist()

  useEffect(() => {
    function updatePath() {
      setPathname(window.location.pathname)
    }
    window.addEventListener('popstate', updatePath)
    return () => window.removeEventListener('popstate', updatePath)
  }, [])

  useEffect(() => {
    if (pathname.startsWith('/admin')) return undefined
    const main = document.querySelector('.app-shell main')
    if (!main) return undefined
    main.setAttribute('tabindex', '-1')
    main.focus({ preventScroll: true })
    return () => main.removeAttribute('tabindex')
  }, [pathname])

  const navigate = useCallback((path) => {
    if (path === window.location.pathname) return
    window.history.pushState({}, '', path)
    setPathname(path)
    window.scrollTo(0, 0)
  }, [])

  const detailMatch = pathname.match(/^\/cars\/([1-9]\d*)$/)
  let page
  if (pathname === '/') {
    page = <LandingPage navigate={navigate} wishlistIds={wishlistIds} toggleWishlist={toggleWishlist} />
  } else if (pathname === '/catalog') {
    page = <CatalogPage navigate={navigate} wishlistIds={wishlistIds} toggleWishlist={toggleWishlist} />
  } else if (pathname === '/wishlist') {
    page = <WishlistPage navigate={navigate} wishlistIds={wishlistIds} toggleWishlist={toggleWishlist} />
  } else if (pathname === '/sell') {
    page = <SellFormPage />
  } else if (pathname === '/about') {
    page = <ProfilePage />
  } else if (detailMatch) {
    page = (
      <CarDetailPage
        id={detailMatch[1]}
        navigate={navigate}
        wishlistIds={wishlistIds}
        toggleWishlist={toggleWishlist}
      />
    )
  } else if (pathname.startsWith('/admin')) {
    page = <AdminPortal pathname={pathname} navigate={navigate} />
  } else {
    page = <NotFoundPage navigate={navigate} />
  }

  if (pathname.startsWith('/admin')) return page

  return (
    <div className="app-shell">
      <header className="site-header">
        <AppLink className="brand-lockup" to="/" navigate={navigate} aria-label="CarHub, beranda">
          <BrandMark />
          <span><strong>CarHub</strong><small>Mobility, curated.</small></span>
        </AppLink>
        <div className="header-actions">
          <InstallPrompt />
        </div>
      </header>
      {page}
      {!storageAvailable && (
        <p className="storage-notice" role="status">
          Favorit hanya tersimpan selama sesi ini karena penyimpanan browser tidak tersedia.
        </p>
      )}
      <BottomNav pathname={pathname} navigate={navigate} favoriteCount={wishlistIds.length} />
    </div>
  )
}
