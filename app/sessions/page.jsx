"use client"

import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { DashboardNav } from "@/components/dashboard-nav"
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MessageSquare,
  Star,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Loader2,
  MapPin,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useUser } from "@/hooks/use-user"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

function SessionsPageContent() {
  const searchParams = useSearchParams()
  const { user } = useUser()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [searchQuery, setSearchQuery] = useState("")
  const [showBookedAlert, setShowBookedAlert] = useState(false)
  const [updatingSession, setUpdatingSession] = useState(null)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [selectedSessionForDecline, setSelectedSessionForDecline] = useState(null)
  const [cancellationReason, setCancellationReason] = useState("")
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] = useState(null)
  const [rescheduleDate, setRescheduleDate] = useState(new Date())
  const [rescheduleStartTime, setRescheduleStartTime] = useState("")
  const [rescheduleEndTime, setRescheduleEndTime] = useState("")
  const [rescheduling, setRescheduling] = useState(false)
  
  // Determine if user is logged in as tutor
  const isTutor = user?.role === 'tutor'
  
  const timeSlots = [
    { value: "9:00 AM", label: "9:00 AM" },
    { value: "10:00 AM", label: "10:00 AM" },
    { value: "11:00 AM", label: "11:00 AM" },
    { value: "12:00 PM", label: "12:00 PM" },
    { value: "1:00 PM", label: "1:00 PM" },
    { value: "2:00 PM", label: "2:00 PM" },
    { value: "3:00 PM", label: "3:00 PM" },
    { value: "4:00 PM", label: "4:00 PM" },
    { value: "5:00 PM", label: "5:00 PM" },
    { value: "6:00 PM", label: "6:00 PM" },
    { value: "7:00 PM", label: "7:00 PM" },
    { value: "8:00 PM", label: "8:00 PM" },
  ]

  useEffect(() => {
    // Check if user was redirected from booking
    if (searchParams.get('booked') === 'true') {
      setShowBookedAlert(true)
      setTimeout(() => setShowBookedAlert(false), 5000)
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      fetchSessions(activeTab)
    }
  }, [activeTab, user, isTutor])

  const fetchSessions = async (status) => {
    setLoading(true)
    try {
      // Fetch sessions based on current user role
      const role = isTutor ? 'tutor' : 'student'
      const response = await fetch(`/api/sessions?status=${status}&role=${role}`)
      const data = await response.json()
      if (data.success) {
        setSessions(data.data.sessions || [])
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptDecline = async (sessionId, action, reason = null) => {
    setUpdatingSession(sessionId)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action === 'accept' ? 'confirmed' : 'cancelled',
          cancellation_reason: action === 'decline' ? (reason || 'Declined by tutor') : null
        })
      })

      const data = await response.json()
      if (data.success) {
        // Refresh sessions
        fetchSessions(activeTab)
        // Close dialog and reset state
        if (action === 'decline') {
          setDeclineDialogOpen(false)
          setSelectedSessionForDecline(null)
          setCancellationReason("")
        }
      } else {
        console.error('Failed to update session:', data.message)
        alert(data.message || 'Failed to update session')
      }
    } catch (error) {
      console.error('Error updating session:', error)
      alert('Failed to update session. Please try again.')
    } finally {
      setUpdatingSession(null)
    }
  }

  const handleDeclineClick = (session) => {
    setSelectedSessionForDecline(session)
    setCancellationReason("")
    setDeclineDialogOpen(true)
  }

  const handleConfirmDecline = () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for declining this session.')
      return
    }
    if (selectedSessionForDecline) {
      handleAcceptDecline(selectedSessionForDecline.id, 'decline', cancellationReason.trim())
    }
  }

  const handleRescheduleClick = (session) => {
    if (!session || !session.id) {
      console.error('Invalid session object:', session)
      return
    }
    setSelectedSessionForReschedule(session)
    setRescheduleDate(session.session_date ? new Date(session.session_date) : new Date())
    setRescheduleStartTime(session.start_time || "")
    setRescheduleEndTime(session.end_time || "")
    setRescheduleDialogOpen(true)
  }

  const handleReschedule = async () => {
    if (!selectedSessionForReschedule || !rescheduleDate || !rescheduleStartTime) {
      alert('Please select a date and start time')
      return
    }

    setRescheduling(true)
    try {
      const response = await fetch(`/api/sessions/${selectedSessionForReschedule.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_date: rescheduleDate.toISOString(),
          start_time: rescheduleStartTime,
          end_time: rescheduleEndTime || null
        })
      })

      const data = await response.json()
      if (data.success) {
        setRescheduleDialogOpen(false)
        setSelectedSessionForReschedule(null)
        setRescheduleDate(new Date())
        setRescheduleStartTime("")
        setRescheduleEndTime("")
        alert('Session rescheduled successfully!')
        
        // If rescheduling a confirmed session, it stays confirmed and shows in upcoming
        // If rescheduling a pending session, it stays pending and shows in requests
        // Refresh the appropriate tab based on the updated session status
        const updatedSession = data.data?.session
        if (updatedSession?.status === 'confirmed') {
          // If it's confirmed, refresh the upcoming tab
          if (activeTab !== 'upcoming') {
            setActiveTab('upcoming')
          } else {
            fetchSessions('upcoming')
          }
        } else {
          // If it's pending, refresh the requests/pending tab
          const targetTab = isTutor ? 'requests' : 'requests'
          if (activeTab !== targetTab) {
            setActiveTab(targetTab)
          } else {
            fetchSessions(targetTab)
          }
        }
      } else {
        alert(data.message || 'Failed to reschedule session')
      }
    } catch (err) {
      console.error('Error rescheduling session:', err)
      alert('Failed to reschedule session')
    } finally {
      setRescheduling(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    }
  }

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Invalid date'
    }
  }

  const getTimeUntilSession = (dateString, timeString) => {
    const date = new Date(dateString)
    const [time, period] = timeString.split(' ')
    const [hours, minutes] = time.split(':')
    let hour = parseInt(hours)
    if (period === 'PM' && hour !== 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    
    date.setHours(hour, parseInt(minutes), 0, 0)
    const now = new Date()
    const diff = date - now
    const hoursUntil = Math.floor(diff / (1000 * 60 * 60))
    const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hoursUntil < 0) return null
    if (hoursUntil === 0) return `In ${minutesUntil} minutes`
    if (hoursUntil === 1) return "In 1 hour"
    return `In ${hoursUntil} hours`
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  }

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const tutorName = session.tutor?.user?.name?.toLowerCase() || ''
    const subject = session.subject?.toLowerCase() || ''
    const topic = session.topic?.toLowerCase() || ''
    return tutorName.includes(query) || subject.includes(query) || topic.includes(query)
  })

  // Group upcoming sessions by date
  const groupSessionsByDate = (sessions) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const todaySessions = []
    const thisWeekSessions = []
    const laterSessions = []

    sessions.forEach(session => {
      const sessionDate = new Date(session.session_date)
      sessionDate.setHours(0, 0, 0, 0)

      if (sessionDate.getTime() === today.getTime()) {
        todaySessions.push(session)
      } else if (sessionDate >= tomorrow && sessionDate <= nextWeek) {
        thisWeekSessions.push(session)
      } else {
        laterSessions.push(session)
      }
    })

    return { todaySessions, thisWeekSessions, laterSessions }
  }

  const renderSessionCard = (session, showTimeUntil = false) => {
    const tutor = session.tutor?.user
    const student = session.student
    const displayUser = isTutor ? student : tutor

    return (
      <Card key={session.id}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={displayUser?.avatar_url || "/placeholder-user.jpg"} />
                <AvatarFallback>{getInitials(displayUser?.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">
                  {session.subject}
                  {isTutor ? (
                    <> from {displayUser?.name}</>
                  ) : (
                    <> with {displayUser?.name}</>
                  )}
                </h4>
                <p className="text-sm text-muted-foreground">{session.topic}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(session.session_date)}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {session.start_time} {session.end_time ? `- ${session.end_time}` : ''}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {session.session_type === 'online' ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    {session.session_type === 'online' ? 'Online' : 'In-Person'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-row flex-col items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-end mt-2 sm:mt-0">
              {showTimeUntil && getTimeUntilSession(session.session_date, session.start_time) && (
                <Badge variant="secondary" className="w-fit sm:w-auto">
                  {getTimeUntilSession(session.session_date, session.start_time)}
                </Badge>
              )}
              {session.status === 'confirmed' && (
                <Badge variant="outline" className="w-fit sm:w-auto">Scheduled</Badge>
              )}
              {session.status === 'pending' && (
                <Badge variant="outline" className="w-fit sm:w-auto">Pending</Badge>
              )}
              {session.status === 'completed' && (
                <Badge variant="secondary" className="w-fit sm:w-auto">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
              {session.status === 'cancelled' && (
                <Badge variant="destructive" className="w-fit sm:w-auto">Cancelled</Badge>
              )}
              
              {session.status === 'confirmed' && (
                <Button asChild className="w-full sm:w-auto" style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white', borderColor: 'oklch(0.395 0.055 200.975)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'oklch(0.35 0.055 200.975)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'oklch(0.395 0.055 200.975)'}>
                  <Link href={`/sessions/${session.id}`}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Join Session
                  </Link>
                </Button>
              )}
              {session.status === 'pending' && (
                <Button variant="outline" size="sm" className="bg-transparent w-full sm:w-auto" asChild>
                  <Link href={`/sessions/${session.id}`}>
                    View Details
                  </Link>
                </Button>
              )}
              {session.status === 'completed' && (
                <Button variant="outline" size="sm" className="bg-transparent w-full sm:w-auto" asChild>
                  <Link href={`/sessions/${session.id}`}>
                    View Notes
                  </Link>
                </Button>
              )}
              {session.status === 'cancelled' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-transparent w-full sm:w-auto"
                  onClick={() => handleRescheduleClick(session)}
                >
                  Reschedule
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">My Sessions</h1>
            <p className="text-muted-foreground">Manage your tutoring sessions and view session history</p>
          </div>
          {!isTutor && (
            <Button asChild style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white', borderColor: 'oklch(0.395 0.055 200.975)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'oklch(0.35 0.055 200.975)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'oklch(0.395 0.055 200.975)'}>
              <Link href="/sessions/book">
                <Plus className="h-4 w-4 mr-2" />
                Book New Session
              </Link>
            </Button>
          )}
        </div>

        {showBookedAlert && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Session booked successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search sessions..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="bg-transparent">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            <TabsTrigger value="requests">
              {isTutor ? 'Requests' : 'Pending'}
            </TabsTrigger>
          </TabsList>

          {/* UPCOMING TAB */}
          <TabsContent value="upcoming" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {isTutor ? (
                  'No upcoming sessions.'
                ) : (
                  <>No upcoming sessions. <Link href="/sessions/book" className="text-primary underline">Book a session</Link></>
                )}
              </div>
            ) : (
              <>
                {(() => {
                  const { todaySessions, thisWeekSessions, laterSessions } = groupSessionsByDate(filteredSessions)
                  return (
                    <>
                      {todaySessions.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-serif font-semibold mb-4">Today</h3>
                          <div className="space-y-4">
                            {todaySessions.map(session => renderSessionCard(session, true))}
                          </div>
                        </div>
                      )}
                      {thisWeekSessions.length > 0 && (
                        <div>
                          <h3 className="text-lg font-serif font-semibold mb-4">This Week</h3>
                          <div className="space-y-4">
                            {thisWeekSessions.map(session => renderSessionCard(session))}
                          </div>
                        </div>
                      )}
                      {laterSessions.length > 0 && (
                        <div>
                          <h3 className="text-lg font-serif font-semibold mb-4">Later</h3>
                          <div className="space-y-4">
                            {laterSessions.map(session => renderSessionCard(session))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </>
            )}
          </TabsContent>

          {/* COMPLETED TAB */}
          <TabsContent value="completed" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No completed sessions yet.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map(session => (
                  <Card key={session.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={session.tutor?.user?.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback>{getInitials(session.tutor?.user?.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">
                              {session.subject} with {session.tutor?.user?.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">{session.topic}</p>
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <CalendarIcon className="h-4 w-4" />
                                {formatDateShort(session.session_date)}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {session.duration} minutes
                              </div>
                              {session.rating && (
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= Math.round(session.rating)
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-row flex-col items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-end mt-2 sm:mt-0">
                          <Badge variant="secondary" className="w-fit sm:w-auto">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                          <Button variant="outline" size="sm" className="bg-transparent w-full sm:w-auto" asChild>
                            <Link href={`/sessions/${session.id}`}>
                              View Notes
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CANCELLED TAB */}
          <TabsContent value="cancelled" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No cancelled sessions.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map(session => (
                  <Card key={session.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={session.tutor?.user?.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback>{getInitials(session.tutor?.user?.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">
                              {session.subject}
                              {isTutor ? ` with ${session.student?.name}` : ` with ${session.tutor?.user?.name}`}
                            </h4>
                            <p className="text-sm text-muted-foreground">{session.topic}</p>
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <CalendarIcon className="h-4 w-4" />
                                {formatDateShort(session.session_date)}
                              </div>
                              {session.cancellation_reason && (
                                <div className="flex items-start gap-1 text-sm text-muted-foreground max-w-md">
                                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span className="break-words">{session.cancellation_reason}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-row flex-col items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-end mt-2 sm:mt-0">
                          <Badge variant="destructive" className="w-fit sm:w-auto">Cancelled</Badge>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-transparent w-full sm:w-auto"
                            onClick={() => handleRescheduleClick(session)}
                          >
                            Reschedule
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* REQUESTS TAB */}
          <TabsContent value="requests" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {isTutor ? 'No pending session requests.' : 'No pending session requests.'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map(session => (
                  <Card key={session.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            {isTutor ? (
                              <>
                                <AvatarImage src={session.student?.avatar_url || "/placeholder-user.jpg"} />
                                <AvatarFallback>{getInitials(session.student?.name)}</AvatarFallback>
                              </>
                            ) : (
                              <>
                                <AvatarImage src={session.tutor?.user?.avatar_url || "/placeholder-user.jpg"} />
                                <AvatarFallback>{getInitials(session.tutor?.user?.name)}</AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">
                              {session.subject}
                              {isTutor ? (
                                <> from {session.student?.name}</>
                              ) : (
                                <> with {session.tutor?.user?.name}</>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground">{session.topic}</p>
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <CalendarIcon className="h-4 w-4" />
                                Requested for {formatDate(session.session_date)}, {session.start_time}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {isTutor ? 'Awaiting your response' : 'Pending response'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-row flex-col items-stretch sm:items-center gap-2 sm:gap-3 sm:justify-end mt-2 sm:mt-0">
                          <Badge variant="outline" className="w-fit sm:w-auto">
                            Pending
                          </Badge>
                          {isTutor ? (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full sm:w-auto"
                                style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white', borderColor: 'oklch(0.395 0.055 200.975)' }}
                                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.35 0.055 200.975)')}
                                onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.395 0.055 200.975)')}
                                onClick={() => handleAcceptDecline(session.id, 'accept')}
                                disabled={updatingSession === session.id}
                              >
                                {updatingSession === session.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Accept
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => handleDeclineClick(session)}
                                disabled={updatingSession === session.id}
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Decline
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" className="bg-transparent w-full sm:w-auto" asChild>
                              <Link href={`/sessions/${session.id}`}>
                                View Details
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Decline Session Dialog */}
        <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decline Session Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for declining this session. This will be visible to the student.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedSessionForDecline && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">
                    {selectedSessionForDecline.subject} - {selectedSessionForDecline.topic}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    With {selectedSessionForDecline.student?.name} • {formatDate(selectedSessionForDecline.session_date)}, {selectedSessionForDecline.start_time}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="cancellation-reason">Cancellation Reason *</Label>
                <Textarea
                  id="cancellation-reason"
                  placeholder="e.g., Schedule conflict, Not available at this time, etc."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeclineDialogOpen(false)
                  setCancellationReason("")
                  setSelectedSessionForDecline(null)
                }}
                disabled={updatingSession === selectedSessionForDecline?.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDecline}
                disabled={updatingSession === selectedSessionForDecline?.id || !cancellationReason.trim()}
              >
                {updatingSession === selectedSessionForDecline?.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Declining...
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Decline Session
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Session Dialog */}
        <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reschedule Session</DialogTitle>
              <DialogDescription>
                Choose a new date and time for this session. Both parties will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedSessionForReschedule && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">
                    Current: {formatDateShort(selectedSessionForReschedule?.session_date)} at {selectedSessionForReschedule?.start_time || 'N/A'}
                  </p>
                  {selectedSessionForReschedule?.rescheduled_from && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Originally scheduled: {selectedSessionForReschedule.rescheduled_from}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2 relative z-10">
                <Label>New Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-transparent"
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {rescheduleDate && !isNaN(rescheduleDate.getTime()) 
                        ? (() => {
                            try {
                              return format(rescheduleDate, "PPP")
                            } catch (error) {
                              console.error('Error formatting date:', error)
                              return rescheduleDate.toLocaleDateString()
                            }
                          })()
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0" 
                    align="start" 
                    side="bottom"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    sideOffset={5}
                  >
                    <Calendar
                      mode="single"
                      selected={rescheduleDate}
                      onSelect={(date) => {
                        if (date) {
                          setRescheduleDate(date)
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select value={rescheduleStartTime} onValueChange={setRescheduleStartTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Time (Optional)</Label>
                  <Select value={rescheduleEndTime || undefined} onValueChange={(value) => setRescheduleEndTime(value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRescheduleDialogOpen(false)
                  setSelectedSessionForReschedule(null)
                  setRescheduleDate(new Date())
                  setRescheduleStartTime("")
                  setRescheduleEndTime("")
                }}
                disabled={rescheduling}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={rescheduling || !rescheduleDate || !rescheduleStartTime}
                style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white', borderColor: 'oklch(0.395 0.055 200.975)' }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.35 0.055 200.975)')}
                onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.395 0.055 200.975)')}
              >
                {rescheduling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  'Reschedule Session'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function SessionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    }>
      <SessionsPageContent />
    </Suspense>
  )
}
