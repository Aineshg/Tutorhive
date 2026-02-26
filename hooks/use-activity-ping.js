import { useEffect, useRef } from 'react'

/**
 * Hook to ping the activity endpoint periodically to update user's last_active_at
 * This ensures accurate "last active" tracking for other users
 * @param {number|null} intervalMinutes - Minutes between pings. If null, pinging is disabled.
 */
export function useActivityPing(intervalMinutes = 2) {
  const intervalRef = useRef(null)
  const lastPingRef = useRef(null)

  useEffect(() => {
    // Don't ping if intervalMinutes is null (user not authenticated)
    if (intervalMinutes === null) {
      return
    }

    // Ping immediately on mount
    const pingActivity = async () => {
      try {
        const response = await fetch('/api/activity/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (response.ok) {
          lastPingRef.current = Date.now()
        }
      } catch (error) {
        console.error('Error pinging activity:', error)
      }
    }

    // Initial ping
    pingActivity()

    // Set up interval to ping every N minutes
    const intervalMs = intervalMinutes * 60 * 1000
    intervalRef.current = setInterval(pingActivity, intervalMs)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [intervalMinutes])

  // Also ping on page visibility change (when user comes back to tab)
  useEffect(() => {
    // Don't set up visibility listener if pinging is disabled
    if (intervalMinutes === null) {
      return
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Ping if it's been more than 1 minute since last ping
        const now = Date.now()
        const oneMinuteAgo = now - (60 * 1000)
        
        if (!lastPingRef.current || lastPingRef.current < oneMinuteAgo) {
          fetch('/api/activity/ping', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          }).then(() => {
            lastPingRef.current = Date.now()
          }).catch(err => {
            console.error('Error pinging activity on visibility change:', err)
          })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [intervalMinutes])
}
