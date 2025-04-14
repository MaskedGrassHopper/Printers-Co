import { useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from './store'

export function useAuth() {
  const { data: session, status, update } = useSession()
  const { session: cachedSession, lastSync } = useAuthStore()

  // Use cached session if available and newer than session from useSession
  const currentSession = useMemo(() => {
    if (!session && !cachedSession) return null
    if (!session) return cachedSession
    if (!cachedSession) return session
    
    // Use the most recently updated session
    return lastSync > new Date(session.expires).getTime() ? cachedSession : session
  }, [session, cachedSession, lastSync])

  // Memoized auth state
  const isAuthenticated = useMemo(() => {
    if (!currentSession) return false
    return new Date(currentSession.expires) > new Date()
  }, [currentSession])

  // Memoized user data
  const user = useMemo(() => currentSession?.user ?? null, [currentSession])

  // Optimized token refresh
  const refreshToken = useCallback(async () => {
    try {
      const updatedSession = await update()
      return !!updatedSession
    } catch (error) {
      console.error('Failed to refresh token:', error)
      return false
    }
  }, [update])

  return {
    session: currentSession,
    status,
    isAuthenticated,
    user,
    refreshToken,
  }
} 