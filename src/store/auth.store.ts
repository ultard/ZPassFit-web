import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  setTokens: (tokens: { accessToken: string, refreshToken?: string | null }) => void
  clearTokens: () => void
}

const storage
  = typeof window === 'undefined'
    ? undefined
    : createJSONStorage(() => window.localStorage)

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      accessToken: null,
      refreshToken: null,
      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),
      clearTokens: () => set({ accessToken: null, refreshToken: null })
    }),
    {
      name: 'auth',
      storage,
      partialize: s => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken
      })
    }
  )
)

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken
}
