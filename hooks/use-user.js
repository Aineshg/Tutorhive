import { useState, useEffect } from 'react'

// Cache user data in memory to prevent flickering
let cachedUser = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Helper to get cached user from localStorage (client-side only)
function getCachedUserFromStorage() {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('user-data')
    if (stored) {
      const parsed = JSON.parse(stored)
      // Check if cache is still valid
      if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed.data
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return null
}

export function useUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)

  // Handle mounting (client-side only)
  useEffect(() => {
    setMounted(true)
    
    // Load from localStorage first (client-side only)
    const cached = getCachedUserFromStorage()
    if (cached) {
      setUser(cached)
      cachedUser = cached
      cacheTimestamp = Date.now()
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only run after component is mounted (client-side)
    if (!mounted) return

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user/current')
        const data = await response.json()

        if (data.success && data.data.user) {
          const userData = data.data.user
          setUser(userData)
          cachedUser = userData
          cacheTimestamp = Date.now()
          
          // Store in localStorage for persistence
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('user-data', JSON.stringify({
                data: userData,
                timestamp: Date.now()
              }))
            } catch (e) {
              // Ignore localStorage errors
            }
          }
        } else {
          setError(data.message || 'Failed to fetch user')
          // Clear cache on error
          cachedUser = null
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user-data')
          }
        }
      } catch (err) {
        setError('Failed to fetch user')
        console.error('Error fetching user:', err)
        // Don't clear cache on network error if we have cached data
      } finally {
        setLoading(false)
      }
    }

    // Check if we need to fetch
    const cached = getCachedUserFromStorage()
    const needsFetch = !cached || (cacheTimestamp && Date.now() - cacheTimestamp > CACHE_DURATION)
    
    if (needsFetch) {
      fetchUser()
    } else if (cached && !user) {
      // Use cached data if available
      setUser(cached)
      setLoading(false)
    }
  }, [mounted, user])

  const refetch = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/current')
      const data = await response.json()

      if (data.success && data.data.user) {
        const userData = data.data.user
        setUser(userData)
        cachedUser = userData
        cacheTimestamp = Date.now()
        setError(null)
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('user-data', JSON.stringify({
              data: userData,
              timestamp: Date.now()
            }))
          } catch (e) {
            // Ignore localStorage errors
          }
        }
      } else {
        setError(data.message || 'Failed to fetch user')
        // Clear cache on error
        cachedUser = null
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-data')
        }
      }
    } catch (err) {
      setError('Failed to fetch user')
      console.error('Error fetching user:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearCache = () => {
    cachedUser = null
    cacheTimestamp = 0
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user-data')
    }
  }

  return { user, loading, error, refetch, clearCache }
}

