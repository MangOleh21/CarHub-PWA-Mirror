import { CarFront, Heart, House, Plus, UserRound } from 'lucide-react'
import AppLink from './AppLink.jsx'

const items = [
  { path: '/', label: 'Home', Icon: House },
  { path: '/catalog', label: 'Katalog', Icon: CarFront },
  { path: '/sell', label: 'Jual', Icon: Plus, prominent: true },
  { path: '/wishlist', label: 'Favorit', Icon: Heart },
  { path: '/about', label: 'Profil', Icon: UserRound },
]

export default function BottomNav({ pathname, navigate, favoriteCount }) {
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {items.map(({ path, label, Icon, prominent }) => {
        const active = pathname === path
        return (
          <AppLink
            className={`bottom-nav-item${prominent ? ' bottom-nav-sell' : ''}${active ? ' is-active' : ''}`}
            key={path}
            to={path}
            navigate={navigate}
            aria-current={active ? 'page' : undefined}
          >
            <span className="nav-icon-wrap">
              <Icon size={20} strokeWidth={active ? 2 : 1.7} aria-hidden="true" />
              {path === '/wishlist' && favoriteCount > 0 && (
                <span className="nav-count" aria-label={`${favoriteCount} favorit`}>{favoriteCount}</span>
              )}
            </span>
            <span>{label}</span>
          </AppLink>
        )
      })}
    </nav>
  )
}
