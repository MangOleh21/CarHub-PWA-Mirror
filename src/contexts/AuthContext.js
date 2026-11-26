import { createContext } from 'react'

const AuthContext = createContext({
  user: null,
  status: 'loading',
  sessionError: null,
  login: async () => null,
  register: async () => null,
  logout: async () => {},
  updateProfile: async () => null,
  refreshSession: async () => null,
})

export default AuthContext
