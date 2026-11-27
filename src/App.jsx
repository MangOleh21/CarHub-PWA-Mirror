import { ArrowDownToLine, LogIn } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import AppLink from './components/AppLink.jsx'
import BrandMark from './components/BrandMark.jsx'
import BottomNav from './components/BottomNav.jsx'
import { useAuth } from './contexts/useAuth.js'
import AdminPortal from './pages/AdminPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import CatalogPage from './pages/CatalogPage.jsx'
import CarDetailPage from './pages/CarDetailPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import MyListingsPage from './pages/MyListingsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import SellFormPage from './pages/SellPage.jsx'
import WishlistPage from './pages/WishlistPage.jsx'
import useWishlist from './hooks/useWishlist.js'
import './App.css'

function HeaderAccountIndicator({ navigate, pathname }) {
  const { user, status } = useAuth()

  if (status === 'loading') return null

  if (!user) {
    return (
      <AppLink
        className={`header-login-link${pathname === '/login' || pathname === '/register' ? ' is-active' : ''}`}
        to="/login"
        navigate={navigate}
      >
        <LogIn size={15} aria-hidden="true" />
        <span>Masuk</span>
      </AppLink>
    )
  }

  const parts = user.name.trim().split(/\s+/).filter(Boolean)
  const initials = parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'
  const shortName = parts[0] || user.name
  const isAdmin = user.role === 'admin' || user.role === 'owner'
  const roleLabel = user.role === 'owner' ? 'Owner' : 'Admin'

  return (
    <AppLink
      className={`header-account-chip${pathname === '/profile' || pathname === '/my-listings' ? ' is-active' : ''}`}
      to="/profile"
      navigate={navigate}
      aria-label={`Akun aktif: ${user.name}${isAdmin ? ` (${roleLabel})` : ''}, buka halaman Profil`}
    >
      <span className="header-account-avatar" aria-hidden="true">
        {initials}
        <span className="header-account-dot" />
      </span>
      <span className="header-account-name">{shortName}</span>
      {isAdmin && <span className="header-role-badge">{roleLabel}</span>}
    </AppLink>
  )
}

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
  const [location, setLocation] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }))
  const { pathname, search } = location
  const { wishlistIds, storageAvailable, toggleWishlist } = useWishlist()

  useEffect(() => {
    function updatePath() {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
      })
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
    const destination = new URL(path, window.location.origin)
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const nextPath = `${destination.pathname}${destination.search}${destination.hash}`
    if (nextPath === currentPath) return
    window.history.pushState({}, '', nextPath)
    setLocation({ pathname: destination.pathname, search: destination.search })
    window.scrollTo(0, 0)
  }, [])

  const detailMatch = pathname.match(/^\/cars\/([1-9]\d*|offline-[a-z0-9-]+)$/)
  let page
  if (pathname === '/') {
    page = <LandingPage navigate={navigate} wishlistIds={wishlistIds} toggleWishlist={toggleWishlist} />
  } else if (pathname === '/catalog') {
    page = (
      <CatalogPage
        navigate={navigate}
        search={search}
        wishlistIds={wishlistIds}
        toggleWishlist={toggleWishlist}
      />
    )
  } else if (pathname === '/wishlist') {
    page = <WishlistPage navigate={navigate} wishlistIds={wishlistIds} toggleWishlist={toggleWishlist} />
  } else if (pathname === '/sell') {
    page = <SellFormPage navigate={navigate} />
  } else if (pathname === '/profile') {
    page = <ProfilePage navigate={navigate} />
  } else if (pathname === '/my-listings') {
    page = (
      <MyListingsPage
        navigate={navigate}
        wishlistIds={wishlistIds}
        toggleWishlist={toggleWishlist}
      />
    )
  } else if (pathname === '/about') {
    page = <AboutPage navigate={navigate} />
  } else if (pathname === '/login') {
    page = <AuthPage mode="login" navigate={navigate} search={search} />
  } else if (pathname === '/register') {
    page = <AuthPage mode="register" navigate={navigate} search={search} />
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
          <HeaderAccountIndicator navigate={navigate} pathname={pathname} />
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
