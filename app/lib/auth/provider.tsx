'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from './store'

// Time before token refresh in milliseconds (5 minutes before expiry)
const REFRESH_THRESHOLD = 5 * 60 * 1000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update: updateSession } = useSession()
  const { setSession, lastSync } = useAuthStore()

  // Sync session state with store
  useEffect(() => {
    if (session) {
      setSession(session)
    }
  }, [session, setSession])

  // Handle token refresh
  useEffect(() => {
    const checkTokenExpiry = async () => {
      if (!session?.expires) return

      const expiryTime = new Date(session.expires).getTime()
      const timeUntilExpiry = expiryTime - Date.now()

      if (timeUntilExpiry <= REFRESH_THRESHOLD) {
        try {
          // Update session to refresh token
          await updateSession()
        } catch (error) {
          console.error('Failed to refresh token:', error)
        }
      }
    }

    // Check token expiry every minute
    const interval = setInterval(checkTokenExpiry, 60 * 1000)
    
    // Initial check
    checkTokenExpiry()

    return () => clearInterval(interval)
  }, [session, updateSession])

  return children
} 