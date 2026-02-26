"use client"

import { useEffect, useState } from "react"
import { useActivityPing } from "@/hooks/use-activity-ping"

/**
 * Activity Tracker Component
 * Tracks user activity and updates last_active_at periodically
 * Should be included in the main layout or dashboard
 */
export function ActivityTracker() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated by checking for auth cookie
    const checkAuth = () => {
      const cookies = document.cookie.split(';')
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='))
      setIsAuthenticated(!!authCookie)
    }

    checkAuth()
    // Check periodically in case auth state changes
    const interval = setInterval(checkAuth, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Only ping if authenticated
  useActivityPing(isAuthenticated ? 2 : null) // Ping every 2 minutes if authenticated

  return null // This component doesn't render anything
}
