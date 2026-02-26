import { useState, useEffect, useCallback } from 'react'
import { useSocket } from './use-socket'

/**
 * Hook to fetch and track unread message count
 * Updates in real-time via WebSocket
 */
export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { socket, isConnected } = useSocket()

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/messages/unread-count')
      const data = await response.json()
      if (data.success) {
        setUnreadCount(data.data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching unread message count:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount()
    
    // Poll for updates every 2 minutes
    const interval = setInterval(fetchUnreadCount, 120000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Listen for WebSocket events to update count in real-time
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleMessageReceived = () => {
      // Increment unread count when a new message is received
      // (only if it's not from the current user, handled by API)
      fetchUnreadCount()
    }

    const handleMessageRead = () => {
      // Decrement unread count when messages are read
      fetchUnreadCount()
    }

    socket.on('message_received', handleMessageReceived)
    socket.on('message_read', handleMessageRead)

    return () => {
      socket.off('message_received', handleMessageReceived)
      socket.off('message_read', handleMessageRead)
    }
  }, [socket, isConnected, fetchUnreadCount])

  return { unreadCount, loading, refresh: fetchUnreadCount }
}

