import { Monitor, Moon, Sun } from 'lucide-react'
import useTheme from '../contexts/useTheme.js'
import { themePreferences } from '../lib/theme.js'

const themeOptions = {
  system: { label: 'Ikuti tema sistem', text: 'Sistem', Icon: Monitor },
  light: { label: 'Tema terang', text: 'Terang', Icon: Sun },
  dark: { label: 'Tema gelap', text: 'Gelap', Icon: Moon },
}

export default function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  return (
    <div className="theme-toggle" role="group" aria-label="Pilih tema">
      {themePreferences.map((value) => {
        const { label, text, Icon } = themeOptions[value]
        return (
          <button
            className="theme-option"
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={preference === value}
            title={label}
            onClick={() => setPreference(value)}
          >
            <Icon size={16} aria-hidden="true" />
            <span className="theme-option-label">{text}</span>
          </button>
        )
      })}
    </div>
  )
}
