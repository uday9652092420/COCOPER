/**
 * @file authStore.ts
 * @description Authentication store using zustand for the COCOS application.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as loginApi } from '../services/authservices/auth.service'

/**
 * @description Authenticated user shape.
 */
export interface AuthUser {
  id: string
  username: string
  fullName?: string | null
  role: string
  isSuperAdmin: boolean
  organizationId: string | null
}

/**
 * @description Login result returned to the UI.
 */
export interface LoginResult {
  success: boolean
  message?: string
}

/**
 * @description Authentication store state and actions.
 */
interface AuthState {
  user: AuthUser | null
  selectedOrganizationId: string | null
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => void
  setSelectedOrganization: (organizationId: string | null) => void
  updateUser: (partial: Partial<AuthUser>) => void
}

/**
 * @description Zustand store for authentication backed by the backend API.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
  user: null,
  selectedOrganizationId: null,

  login: async (username: string, password: string) => {
    try {
      const data = await loginApi(username, password)

      const user: AuthUser = {
        id: data.user.id,
        username: data.user.username,
        fullName: data.user.fullName,
        role: data.user.role,
        isSuperAdmin: data.user.isSuperAdmin,
        organizationId: data.user.organizationId,
      }

      set({
        user,
        selectedOrganizationId: data.user.organizationId,
      })

      if (data.user.organizationId) {
        localStorage.setItem('cocoper_org_id', data.user.organizationId)
      } else {
        localStorage.removeItem('cocoper_org_id')
      }

      return { success: true }
    } catch (error: unknown) {
      const message =
        (error as { message?: string })?.message ||
        'Invalid credentials. Please try again.'

      return { success: false, message }
    }
  },

  logout: () => {
    localStorage.removeItem('cocoper_org_id')
    set({ user: null, selectedOrganizationId: null })
  },

  setSelectedOrganization: (organizationId: string | null) => {
    if (organizationId) {
      localStorage.setItem('cocoper_org_id', organizationId)
    } else {
      localStorage.removeItem('cocoper_org_id')
    }

    set({ selectedOrganizationId: organizationId })
  },

  updateUser: (partial: Partial<AuthUser>) =>
    set((state) =>
      state.user ? { user: { ...state.user, ...partial } } : state
    ),
  }),
  {
    name: 'cocoper_auth',
    partialize: (state) => ({
      user: state.user,
      selectedOrganizationId: state.selectedOrganizationId,
    }),
  }
))