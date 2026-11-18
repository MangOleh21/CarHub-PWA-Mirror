import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isThemePreference, themePreferences } from './theme.js'

test('system, light, and dark are the available theme preferences', () => {
  assert.deepEqual(themePreferences, ['system', 'light', 'dark'])
  assert.equal(isThemePreference('system'), true)
  assert.equal(isThemePreference('light'), true)
  assert.equal(isThemePreference('dark'), true)
  assert.equal(isThemePreference('auto'), false)
})
