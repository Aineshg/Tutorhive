"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { X } from "lucide-react"

export function NotificationsDropdown() {
  const router = useRouter()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [wasOpen, setWasOpen] = useState(false)

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 2 minutes (120 seconds)
    const interval = setInterval(fetchNotifications, 120000)
    return () => clearInterval(interval)
  }, [])

  // Also fetch when dropdown opens (only if it wasn't fetched very recently)
  useEffect(() => {
    if (open) {
      // Only fetch if dropdown wasn't opened recently (within last 10 seconds)
      const lastFetch = localStorage.getItem('lastNotificationFetch')
      const now = Date.now()
      if (!lastFetch || (now - parseInt(lastFetch)) > 10000) {
        fetchNotifications()
        localStorage.setItem('lastNotificationFetch', now.toString())
      }
    }
  }, [open])

  // Track when dropdown was opened
  useEffect(() => {
    if (open) {
      setWasOpen(true)
    }
  }, [open])

  // Mark all notifications as read when dropdown is closed (after being opened)
  useEffect(() => {
    if (!open && wasOpen && unreadCount > 0) {
      // Mark all as read when dropdown closes (only if it was previously open)
      const markAll = async () => {
        try {
          const response = await fetch('/api/notifications', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ markAllAsRead: true })
          })

          if (response.ok) {
            // Update local state immediately
            setNotifications(prev => 
              prev.map(n => ({ ...n, status: 'read', read_at: new Date() }))
            )
            setUnreadCount(0)
          }
        } catch (error) {
          console.error('Error marking all as read:', error)
        }
      }
      markAll()
      setWasOpen(false) // Reset the flag
    }
  }, [open, wasOpen, unreadCount])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?unreadOnly=false')
      const data = await response.json()
      if (data.success) {
        setNotifications(data.data.notifications || [])
        setUnreadCount(data.data.unreadCount || 0)
      } else {
        console.error('Failed to fetch notifications:', data.message)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        // Update local state immediately instead of refetching
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, status: 'read', read_at: new Date() } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (response.ok) {
        // Update local state immediately instead of refetching
        setNotifications(prev => 
          prev.map(n => ({ ...n, status: 'read', read_at: new Date() }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation() // Prevent triggering the notification click
    try {
      const response = await fetch(`/api/notifications?notificationId=${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove notification from local state and update unread count
        setNotifications(prev => {
          const deleted = prev.find(n => n.id === notificationId)
          if (deleted?.status === 'unread') {
            setUnreadCount(count => Math.max(0, count - 1))
          }
          return prev.filter(n => n.id !== notificationId)
        })
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const deleteAllNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?deleteAll=true', {
        method: 'DELETE'
      })

      if (response.ok) {
        // Clear all notifications from local state
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error)
    }
  }

  const handleDropdownClose = () => {
    setOpen(false)
  }

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (notification.status === 'unread') {
      markAsRead(notification.id)
    }
    
    // Navigate to the link if available
    if (notification.link) {
      setOpen(false) // Close dropdown first
      router.push(notification.link) // Use Next.js router for navigation
    } else {
      // If no link, just close the dropdown
      setOpen(false)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'session_reminder':
        return '🔔'
      case 'session_request':
        return '📅'
      case 'session_confirmed':
        return '✅'
      case 'session_cancelled':
        return '❌'
      case 'session_rescheduled':
        return '🔄'
      case 'session_completed':
        return '🎉'
      default:
        return '📬'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger 
        asChild
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(!open)
        }}
      >
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-4 w-4 text-gray-600" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0"
        isOpen={open}
        onClose={handleDropdownClose}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteAllNotifications()
                  }}
                  className="text-xs h-auto p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Clear all
                </Button>
              )}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    markAllAsRead()
                  }}
                  className="text-xs h-auto p-1"
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors relative group ${
                    notification.status === 'unread' ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <div className="flex items-center gap-1">
                          {notification.status === 'unread' && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                            onClick={(e) => deleteNotification(notification.id, e)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              asChild
            >
              <Link href="/notifications">View all notifications</Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

