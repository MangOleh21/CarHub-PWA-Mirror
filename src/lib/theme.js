export const themePreferences = ['system', 'light', 'dark']

export function isThemePreference(value) {
  return themePreferences.includes(value)
}
