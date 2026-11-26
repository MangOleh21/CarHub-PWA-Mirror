import { useCallback, useEffect, useState } from 'react'
import AuthContext from './AuthContext.js'
import {
  getUserSession,
  loginUser,
  logoutUser,
  registerUser,
  updateMyProfile,
} from '../services/api.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [sessionError, setSessionError] = useState(null)

  const refreshSession = useCallback(async () => {
    try {
      const { user: activeUser } = await getUserSession()
      setUser(activeUser)
      setSessionError(null)
      return activeUser
    } catch (error) {
      if (error?.status === 401) {
        setUser(null)
        setSessionError(null)
        return null
      }
      setUser(null)
      setSessionError(error?.message || 'Gagal memeriksa sesi akun.')
      return null
    } finally {
      setStatus('ready')
    }
  }, [])

  useEffect(() => {
    let active = true
    getUserSession()
      .then(({ user: activeUser }) => {
        if (!active) return
        setUser(activeUser)
        setSessionError(null)
      })
      .catch((error) => {
        if (!active) return
        setUser(null)
        setSessionError(error?.status === 401 ? null : (error?.message || 'Gagal memeriksa sesi akun.'))
      })
      .finally(() => {
        if (active) setStatus('ready')
      })
    return () => { active = false }
  }, [])

  const login = useCallback(async (input) => {
    const { user: loggedInUser } = await loginUser(input)
    setUser(loggedInUser)
    setSessionError(null)
    setStatus('ready')
    return loggedInUser
  }, [])

  const register = useCallback(async (input) => {
    const { user: registeredUser } = await registerUser(input)
    setUser(registeredUser)
    setSessionError(null)
    setStatus('ready')
    return registeredUser
  }, [])

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
    setSessionError(null)
  }, [])

  const updateProfile = useCallback(async (input) => {
    const { user: updatedUser } = await updateMyProfile(input)
    setUser(updatedUser)
    return updatedUser
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      status,
      sessionError,
      login,
      register,
      logout,
      updateProfile,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
