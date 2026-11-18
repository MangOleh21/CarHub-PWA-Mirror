import { useEffect, useState } from 'react'
import ThemeContext from './ThemeContext.js'
import { isThemePreference } from '../lib/theme.js'

const STORAGE_KEY = 'carhub-theme'

function readPreference() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export default function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readPreference)

  useEffect(() => {
    document.documentElement.dataset.theme = preference
    try {
      window.localStorage.setItem(STORAGE_KEY, preference)
    } catch {
      // Theme selection still applies for this session when storage is unavailable.
    }
  }, [preference])

  function changePreference(value) {
    if (isThemePreference(value)) setPreference(value)
  }

  return (
    <ThemeContext.Provider value={{
      preference,
      setPreference: changePreference,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}
