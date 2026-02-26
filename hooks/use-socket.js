import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useUser } from './use-user'

export function useSocket() {
  const { user } = useUser()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return

    // Initialize socket connection
    const socketUrl = typeof window !== 'undefined' 
      ? (window.location.origin) 
      : 'http://localhost:3000'
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id)
      setIsConnected(true)
      
      // Authenticate with user ID
      socketInstance.emit('authenticate', user.id)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    socketRef.current = socketInstance
    setSocket(socketInstance)

    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [user?.id])

  return { socket, isConnected }
}

