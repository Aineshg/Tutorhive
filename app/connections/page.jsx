"use client"

import { useState, useEffect } from "react"
import { Search, UserPlus, Users, MessageCircle, Star, BookOpen, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardNav } from "@/components/dashboard-nav"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("discover")
  const [peers, setPeers] = useState([])
  const [connectionRequests, setConnectionRequests] = useState([])
  const [connectedUsers, setConnectedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sendingRequest, setSendingRequest] = useState({})
  const [processingRequest, setProcessingRequest] = useState({})
  const [error, setError] = useState("")
  const [peerConnectionStatuses, setPeerConnectionStatuses] = useState({})
  const [checkingStatuses, setCheckingStatuses] = useState({})

  // Fetch discover peers
  const fetchDiscoverPeers = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      const response = await fetch(`/api/connections/discover?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setPeers(data.data.users || [])
      } else {
        setError(data.message || 'Failed to load users')
      }
    } catch (err) {
      console.error('Error fetching discover peers:', err)
      setError('Failed to load users')
    }
  }

  // Fetch connection requests
  const fetchConnectionRequests = async () => {
    try {
      const response = await fetch('/api/connections/requests')
      const data = await response.json()
      if (data.success) {
        setConnectionRequests(data.data.received || [])
      } else {
        setError(data.message || 'Failed to load connection requests')
      }
    } catch (err) {
      console.error('Error fetching connection requests:', err)
      setError('Failed to load connection requests')
    }
  }

  // Fetch connected users
  const fetchConnectedUsers = async () => {
    try {
      const response = await fetch('/api/connections')
      const data = await response.json()
      if (data.success) {
        setConnectedUsers(data.data.connections || [])
      } else {
        setError(data.message || 'Failed to load connections')
      }
    } catch (err) {
      console.error('Error fetching connections:', err)
      setError('Failed to load connections')
    }
  }

  // Load data on mount and tab change
  useEffect(() => {
    setLoading(true)
    setError("")
    
    // Update user's last_active_at when visiting connections page
    fetch('/api/activity/ping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }).catch(err => {
      console.error('Error pinging activity:', err)
    })
    
    const loadData = async () => {
      if (selectedTab === 'discover') {
        await fetchDiscoverPeers()
      } else if (selectedTab === 'requests') {
        await fetchConnectionRequests()
      } else if (selectedTab === 'connected') {
        await fetchConnectedUsers()
      }
      setLoading(false)
    }

    loadData()
  }, [selectedTab])

  // Debounce search
  useEffect(() => {
    if (selectedTab === 'discover') {
      const timer = setTimeout(() => {
        fetchDiscoverPeers()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [searchQuery])

  const filteredPeers = peers.filter(
    (peer) =>
      peer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.subjects.some((subject) => subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      peer.bio.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSendRequest = async (peerId, message = "") => {
    setSendingRequest(prev => ({ ...prev, [peerId]: true }))
    try {
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_id: peerId,
          message: message || undefined
        })
      })

      const data = await response.json()
      if (data.success) {
        // Update the status for this peer immediately
        setPeerConnectionStatuses(prev => ({
          ...prev,
          [peerId]: 'pending_sent'
        }))
        // Refresh discover peers to remove this user
        await fetchDiscoverPeers()
        // Refresh requests to show sent request
        await fetchConnectionRequests()
      } else {
        setError(data.message || 'Failed to send connection request')
      }
    } catch (err) {
      console.error('Error sending connection request:', err)
      setError('Failed to send connection request')
    } finally {
      setSendingRequest(prev => ({ ...prev, [peerId]: false }))
    }
  }

  // Check connection statuses for all peers at once when peers change
  useEffect(() => {
    if (selectedTab === 'discover' && peers.length > 0) {
      const checkAllStatuses = async () => {
        const peerIds = peers.map(p => p.id)
        
        // Mark all as checking
        const checkingMap = {}
        peerIds.forEach(peerId => {
          checkingMap[peerId] = true
        })
        setCheckingStatuses(checkingMap)

        const statusPromises = peerIds.map(async (peerId) => {
          try {
            const response = await fetch(`/api/connections/status/${peerId}`)
            const data = await response.json()
            if (data.success) {
              return { peerId, status: data.data.status }
            }
            return { peerId, status: 'not_connected' }
          } catch (err) {
            console.error(`Error checking status for ${peerId}:`, err)
            return { peerId, status: 'not_connected' }
          }
        })

        const results = await Promise.all(statusPromises)
        const statusMap = {}
        results.forEach(({ peerId, status }) => {
          statusMap[peerId] = status
        })
        setPeerConnectionStatuses(statusMap)
        setCheckingStatuses({})
      }

      checkAllStatuses()
    } else {
      // Clear statuses when not on discover tab
      setPeerConnectionStatuses({})
      setCheckingStatuses({})
    }
  }, [selectedTab, peers])

  const handleAcceptRequest = async (requestId) => {
    setProcessingRequest(prev => ({ ...prev, [requestId]: true }))
    try {
      const response = await fetch(`/api/connections/request/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' })
      })

      const data = await response.json()
      if (data.success) {
        // Remove from requests and add to connected
        await Promise.all([fetchConnectionRequests(), fetchConnectedUsers()])
      } else {
        setError(data.message || 'Failed to accept connection request')
      }
    } catch (err) {
      console.error('Error accepting connection request:', err)
      setError('Failed to accept connection request')
    } finally {
      setProcessingRequest(prev => ({ ...prev, [requestId]: false }))
    }
  }

  const handleDeclineRequest = async (requestId) => {
    if (!confirm('Are you sure you want to decline this connection request?')) {
      return
    }

    setProcessingRequest(prev => ({ ...prev, [requestId]: true }))
    try {
      const response = await fetch(`/api/connections/request/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'decline' })
      })

      const data = await response.json()
      if (data.success) {
        // Remove from requests
        await fetchConnectionRequests()
      } else {
        setError(data.message || 'Failed to decline connection request')
      }
    } catch (err) {
      console.error('Error declining connection request:', err)
      setError('Failed to decline connection request')
    } finally {
      setProcessingRequest(prev => ({ ...prev, [requestId]: false }))
    }
  }

  const handleRemoveConnection = async (connectionId) => {
    if (!confirm('Are you sure you want to remove this connection?')) {
      return
    }

    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        // Refresh connected users
        await fetchConnectedUsers()
      } else {
        setError(data.message || 'Failed to remove connection')
      }
    } catch (err) {
      console.error('Error removing connection:', err)
      setError('Failed to remove connection')
    }
  }

  const getInitials = (name) => {
    return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || 'U'
  }

  const PeerCard = ({ peer }) => {
    const connectionStatus = peerConnectionStatuses[peer.id] || null
    const checkingStatus = checkingStatuses[peer.id] || false

    const isRequestSent = connectionStatus === 'pending_sent' || connectionStatus === 'connected' || connectionStatus === 'pending_received'
    
    return (
      <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={peer.avatar_url || "/placeholder-user.jpg"} alt={peer.name} />
                  <AvatarFallback>
                    {getInitials(peer.name)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    peer.status === "online" ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{peer.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={peer.type === "tutor" ? "default" : "secondary"} className="text-xs">
                    {peer.type === "tutor" ? "Tutor" : "Student"}
                  </Badge>
                  <span>•</span>
                  <span>{peer.semester}</span>
                </div>
              </div>
            </div>
            {peer.rating && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{peer.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          {peer.bio && <p className="text-sm text-muted-foreground">{peer.bio}</p>}

          {peer.subjects && peer.subjects.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Subjects:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {peer.subjects.map((subject) => (
                  <Badge key={subject} variant="outline" className="text-xs">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2 mt-auto">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{peer.connections} connections</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                <Link href="/inbox">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={() => handleSendRequest(peer.id)}
                disabled={isRequestSent || sendingRequest[peer.id] || checkingStatus}
                className="flex-1 sm:flex-none"
                style={{ backgroundColor: isRequestSent ? undefined : 'oklch(0.395 0.055 200.975)', color: isRequestSent ? undefined : 'white', borderColor: isRequestSent ? undefined : 'oklch(0.395 0.055 200.975)' }}
                onMouseEnter={(e) => !isRequestSent && !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.35 0.055 200.975)')}
                onMouseLeave={(e) => !isRequestSent && !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.395 0.055 200.975)')}
              >
                {checkingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Checking...
                  </>
                ) : sendingRequest[peer.id] ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : isRequestSent ? (
                  connectionStatus === 'pending_received' ? 'Pending' : "Request Sent"
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ConnectionRequestCard = ({ request }) => (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={request.avatar_url || "/placeholder-user.jpg"} alt={request.name} />
                <AvatarFallback>
                  {getInitials(request.name)}
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  request.status === "online" ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{request.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={request.type === "tutor" ? "default" : "secondary"} className="text-xs">
                  {request.type === "tutor" ? "Tutor" : "Student"}
                </Badge>
                <span>•</span>
                <span>{request.semester}</span>
                <span>•</span>
                <span>{request.requestDate}</span>
              </div>
            </div>
          </div>
          {request.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{request.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {request.message && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm italic">"{request.message}"</p>
          </div>
        )}

        {request.bio && <p className="text-sm text-muted-foreground">{request.bio}</p>}

        {request.subjects && request.subjects.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Subjects:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {request.subjects.map((subject) => (
                <Badge key={subject} variant="outline" className="text-xs">
                  {subject}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2 mt-auto">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{request.connections} connections</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeclineRequest(request.id)}
              disabled={processingRequest[request.id]}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
            >
              {processingRequest[request.id] ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                'Decline'
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => handleAcceptRequest(request.id)}
              disabled={processingRequest[request.id]}
              className="flex-1 sm:flex-none"
              style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white', borderColor: 'oklch(0.395 0.055 200.975)' }}
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.35 0.055 200.975)')}
              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.395 0.055 200.975)')}
            >
              {processingRequest[request.id] ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                'Accept'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const ConnectedUserCard = ({ user }) => (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url || "/placeholder-user.jpg"} alt={user.name} />
                <AvatarFallback>
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  user.status === "online" ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={user.type === "tutor" ? "default" : "secondary"} className="text-xs">
                  {user.type === "tutor" ? "Tutor" : "Student"}
                </Badge>
                <span>•</span>
                <span>{user.semester}</span>
                <span>•</span>
                <span>Connected {user.connectedDate}</span>
              </div>
            </div>
          </div>
          {user.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{user.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}

        {user.subjects && user.subjects.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Subjects:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {user.subjects.map((subject) => (
                <Badge key={subject} variant="outline" className="text-xs">
                  {subject}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2 mt-auto">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">{user.connections} connections</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Last active: {user.lastActivity}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
              <Link href="/inbox">
                <MessageCircle className="h-4 w-4 mr-1" />
                Message
              </Link>
            </Button>
            {user.type === 'tutor' && (
              <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                <Link href="/sessions/book">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Book Session
                </Link>
              </Button>
            )}
          </div>
          
          <div className="sm:hidden text-xs text-muted-foreground">
            Last active: {user.lastActivity}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Connections</h1>
            <p className="text-muted-foreground">
              Connect with fellow students and tutors to enhance your learning experience
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search Bar - Only show on discover tab */}
          {selectedTab === 'discover' && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, subject, or interests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="connected">Connected</TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Discover Peers</h2>
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Loading...' : `${filteredPeers.length} ${filteredPeers.length === 1 ? "person" : "people"} found`}
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPeers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No peers found</h3>
                  <p className="text-muted-foreground">Try adjusting your search terms or browse all available peers</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {filteredPeers.map((peer) => (
                    <PeerCard key={peer.id} peer={peer} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Connection Requests</h2>
                <Badge variant="secondary" className="text-sm">
                  {loading ? '...' : `${connectionRequests.length} pending`}
                </Badge>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : connectionRequests.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {connectionRequests.map((request) => (
                    <ConnectionRequestCard key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pending requests</h3>
                  <p className="text-muted-foreground">Connection requests will appear here when you receive them</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="connected" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Connections</h2>
                <Badge variant="secondary" className="text-sm">
                  {loading ? '...' : `${connectedUsers.length} connected`}
                </Badge>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : connectedUsers.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {connectedUsers.map((user) => (
                    <ConnectedUserCard key={user.id || user.connectionId} user={user} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No connections yet</h3>
                  <p className="text-muted-foreground">Start connecting with peers to build your learning network</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
