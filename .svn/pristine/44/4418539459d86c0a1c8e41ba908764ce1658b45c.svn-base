/**
 * @file authStore.ts
 * @description Authentication store using zustand for the COCOS application.
 */

import { create } from 'zustand'

/**
 * @description Authenticated user shape.
 */
export interface AuthUser {
  username: string
}

/**
 * @description Authentication store state and actions.
 */
interface AuthState {
  user: AuthUser | null
  rememberMe: boolean
  login: (username: string, password: string, remember: boolean) => boolean
  logout: () => void
}

/**
 * @description Zustand store for authentication with simple dummy credentials.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  rememberMe: false,
  login: (username: string, password: string, remember: boolean) => {
    const isValid = username === 'admin' && password === 'admin123'
    if (!isValid) return false
    set({ user: { username }, rememberMe: remember })
    return true
  },
  logout: () => set({ user: null, rememberMe: false }),
}))