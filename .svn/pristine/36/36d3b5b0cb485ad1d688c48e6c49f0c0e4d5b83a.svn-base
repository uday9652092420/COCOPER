/**
 * @file uiStore.ts
 * @description Global UI store for layout, language, and theme preferences.
 */

import { create } from 'zustand'

/**
 * @description Supported language codes.
 */
export type LanguageCode = 'en' | 'te' | 'ta' | 'kn' | 'hi'

/**
 * @description UI store state and actions.
 */
interface UIState {
  sidebarCollapsed: boolean
  language: LanguageCode
  toggleSidebar: () => void
  setLanguage: (lang: LanguageCode) => void
}

/**
 * @description Zustand store for layout and language preferences.
 */
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  language: 'en',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setLanguage: (language: LanguageCode) => set({ language }),
}))