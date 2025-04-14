import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Session } from 'next-auth'

// Version for cache invalidation
const AUTH_STORE_VERSION = 1

interface AuthState {
  session: Session | null
  lastSync: number
  setSession: (session: Session | null) => void
  clearSession: () => void
}

// Create auth store with persistence and version control
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      lastSync: 0,
      setSession: (session) => set({ session, lastSync: Date.now() }),
      clearSession: () => set({ session: null, lastSync: Date.now() }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      version: AUTH_STORE_VERSION,
      // Only persist specific fields
      partialize: (state) => ({
        session: state.session,
        lastSync: state.lastSync,
      }),
      // Handle version changes
      onRehydrateStorage: () => (state) => {
        // Perform any necessary migrations or state updates
        console.debug('Auth store rehydrated:', state?.session ? 'Session found' : 'No session')
      },
    }
  )
) 