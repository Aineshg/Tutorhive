"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardNav } from "@/components/dashboard-nav"
import { useUser } from "@/hooks/use-user"
import { Loader2, Video, MapPin, Clock, CheckCircle2 } from "lucide-react"
import {
  Calendar,
  BookOpen,
  Users,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  MessageSquare,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
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

export default function TutorDashboardPage() {
  const { user, loading } = useUser()
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    upcoming: 0,
    pending: 0,
    completed: 0
  })
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [updatingSession, setUpdatingSession] = useState(null)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [selectedSessionForDecline, setSelectedSessionForDecline] = useState(null)
  const [cancellationReason, setCancellationReason] = useState("")
  const [studentProgress, setStudentProgress] = useState([])
  const [loadingProgress, setLoadingProgress] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUpcomingSessions()
      fetchPendingRequests()
      fetchSessionStats()
      fetchStudentProgress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchUpcomingSessions = async () => {
    setLoadingSessions(true)
    try {
      const response = await fetch(`/api/sessions?status=upcoming&role=tutor`)
      const data = await response.json()
      if (data.success) {
        const sessions = data.data.sessions || []
        // Get the next 3 upcoming sessions (sorted by date)
        setUpcomingSessions(sessions.slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  const fetchStudentProgress = async () => {
    setLoadingProgress(true)
    try {
      const [studyPlansRes, sessionsRes] = await Promise.all([
        fetch('/api/study-plans?role=tutor&status=all'),
        fetch('/api/sessions?role=tutor')
      ])

      const studyPlansData = await studyPlansRes.json()
      const sessionsData = await sessionsRes.json()

      const studyPlans = studyPlansData.success && Array.isArray(studyPlansData.data?.studyPlans)
        ? studyPlansData.data.studyPlans
        : []

      const sessions = sessionsData.success && Array.isArray(sessionsData.data?.sessions)
        ? sessionsData.data.sessions
        : []

      const planEntries = studyPlans
        .map((plan) => {
          const referenceDate = plan.completed_at || plan.started_at || plan.created_at
          const studentName = plan.student?.name || 'Student'
          const statusLabel = formatStatus(plan.status)
          const progressLabel = plan.progress_percentage != null ? `${plan.progress_percentage}% complete` : null

          return {
            id: `plan-${plan.id}`,
            type: plan.status === 'completed' ? 'success' : plan.status === 'pending' ? 'pending' : 'plan',
            title: `${studentName} • ${plan.title}`,
            description: [statusLabel, progressLabel].filter(Boolean).join(' • '),
            timestamp: formatTimeAgo(new Date(referenceDate)),
            badge: statusLabel,
            badgeVariant: plan.status === 'completed' ? 'secondary' : plan.status === 'pending' ? 'outline' : 'secondary',
            sortDate: new Date(referenceDate)
          }
        })

      const recentSessions = sessions
        .filter((session) => ['completed', 'confirmed'].includes(session.status))
        .map((session) => {
          const referenceDate = session.updated_at || session.session_date
          return {
            id: `session-${session.id}`,
            type: session.status === 'completed' ? 'success' : 'info',
            title: `${session.student?.name || 'Student'} • ${session.subject}`,
            description: session.status === 'completed'
              ? `Session completed • ${session.topic}`
              : `Session confirmed for ${formatDate(session.session_date)}`,
            timestamp: formatTimeAgo(new Date(referenceDate)),
            badge: session.status === 'completed' ? 'Completed' : 'Confirmed',
            badgeVariant: session.status === 'completed' ? 'secondary' : 'secondary',
            sortDate: new Date(referenceDate)
          }
        })

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const combined = [...planEntries, ...recentSessions]
        .filter((entry) => {
          return (
            entry.sortDate &&
            !Number.isNaN(entry.sortDate.valueOf()) &&
            entry.sortDate >= oneWeekAgo
          )
        })
        .sort((a, b) => b.sortDate - a.sortDate)
        .slice(0, 4)

      setStudentProgress(combined)
    } catch (error) {
      console.error('Error fetching student progress:', error)
      setStudentProgress([])
    } finally {
      setLoadingProgress(false)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`/api/sessions?status=pending&role=tutor`)
      const data = await response.json()
      if (data.success) {
        setPendingRequests((data.data.sessions || []).slice(0, 2))
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    }
  }

  const fetchSessionStats = async () => {
    try {
      const [upcomingRes, pendingRes, completedRes] = await Promise.all([
        fetch(`/api/sessions?status=upcoming&role=tutor`),
        fetch(`/api/sessions?status=pending&role=tutor`),
        fetch(`/api/sessions?status=completed&role=tutor`)
      ])

      const upcomingData = await upcomingRes.json()
      const pendingData = await pendingRes.json()
      const completedData = await completedRes.json()

      const upcoming = upcomingData.success ? (upcomingData.data.sessions || []).length : 0
      const pending = pendingData.success ? (pendingData.data.sessions || []).length : 0
      const completed = completedData.success ? (completedData.data.sessions || []).length : 0

      setSessionStats({
        total: upcoming + pending + completed,
        upcoming,
        pending,
        completed
      })
    } catch (error) {
      console.error('Error fetching session stats:', error)
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
        // Refresh data
        fetchPendingRequests()
        fetchSessionStats()
        fetchUpcomingSessions()
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
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }
  }

  const getTimeUntilSession = (dateString, timeString) => {
    const date = new Date(dateString)
    const [time, period] = timeString.split(' ')
    const [hours, minutes] = time.split(':')
    let hour24 = parseInt(hours)
    if (period === 'PM' && hour24 !== 12) hour24 += 12
    if (period === 'AM' && hour24 === 12) hour24 = 0
    date.setHours(hour24, parseInt(minutes), 0, 0)

    const now = new Date()
    const diffMs = date - now
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `In ${diffHours}h ${diffMinutes}m`
    } else if (diffMinutes > 0) {
      return `In ${diffMinutes}m`
    } else {
      return 'Now'
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatStatus = (status) => {
    if (!status) return 'Update'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatTimeAgo = (date) => {
    if (!date || Number.isNaN(date.getTime())) return ''
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const renderProgressIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'plan':
        return <BookOpen className="h-5 w-5 text-primary" />
      case 'info':
      default:
        return <TrendingUp className="h-5 w-5 text-primary" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'Tutor'}!</h1>
          <p className="text-muted-foreground">Manage your tutoring sessions and track your student progress.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.total}</div>
              <p className="text-xs text-muted-foreground">All sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.upcoming}</div>
              <p className="text-xs text-muted-foreground">Scheduled sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.completed}</div>
              <p className="text-xs text-muted-foreground">Total completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Upcoming Sessions</CardTitle>
                <CardDescription>Your scheduled tutoring sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : upcomingSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming sessions scheduled.</p>
                  </div>
                ) : (
                  <>
                    {upcomingSessions.map((session) => {
                      const timeUntil = getTimeUntilSession(session.session_date, session.start_time)
                      
                      return (
                        <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar>
                              <AvatarImage src={session.student?.avatar_url || "/placeholder-user.jpg"} />
                              <AvatarFallback>{getInitials(session.student?.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold">{session.student?.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {session.subject} - {session.topic}
                              </p>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  {session.session_type === 'online' ? (
                                    <Video className="h-3 w-3" />
                                  ) : (
                                    <MapPin className="h-3 w-3" />
                                  )}
                                  {session.session_type === 'online' ? 'Online' : 'In-Person'}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {session.duration} min
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-medium text-sm">
                              {formatDate(session.session_date)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {session.start_time} {session.end_time ? `- ${session.end_time}` : ''}
                            </p>
                            {timeUntil && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {timeUntil}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href="/sessions">
                        <Calendar className="h-4 w-4 mr-2" />
                        View Full Schedule
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Student Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Student Progress</CardTitle>
                <CardDescription>Recent achievements and updates from your students</CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              {loadingProgress ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="animate-pulse flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="h-5 w-5 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted rounded" />
                      </div>
                      <div className="h-5 w-16 bg-muted rounded" />
                    </div>
                  ))}
                </div>
              ) : studentProgress.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No recent updates from your students yet.</p>
                </div>
              ) : (
                studentProgress.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    {renderProgressIcon(entry.type)}
                    <div className="flex-1">
                      <p className="font-medium">{entry.title}</p>
                      {entry.description && (
                        <p className="text-sm text-muted-foreground">{entry.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{entry.timestamp}</p>
                    </div>
                    {entry.badge && (
                      <Badge variant={entry.badgeVariant || 'secondary'}>{entry.badge}</Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Session Requests</CardTitle>
                <CardDescription>New tutoring requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pending requests</p>
                  </div>
                ) : (
                  <>
                    {pendingRequests.map((session) => (
                      <div key={session.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={session.student?.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback>{getInitials(session.student?.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{session.student?.name}</p>
                            <p className="text-xs text-muted-foreground">{session.subject}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{session.topic}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Requested: {formatDate(session.session_date)}, {session.start_time}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleAcceptDecline(session.id, 'accept')}
                            disabled={updatingSession === session.id}
                          >
                            {updatingSession === session.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Accept
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 bg-transparent"
                            onClick={() => handleDeclineClick(session)}
                            disabled={updatingSession === session.id}
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                      <Link href="/sessions?status=requests">
                        View All Requests
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Session Overview</CardTitle>
                <CardDescription>Your tutoring metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Sessions Completed</span>
                  <span className="font-medium">{sessionStats.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Upcoming Sessions</span>
                  <span className="font-medium">{sessionStats.upcoming}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Pending Requests</span>
                  <span className="font-medium">{sessionStats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Sessions</span>
                  <span className="font-medium">{sessionStats.total}</span>
                </div>

                <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                  <Link href="/sessions">
                    View All Sessions
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/sessions?status=requests">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    View Requests ({sessionStats.pending})
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/sessions">
                    <Calendar className="h-4 w-4 mr-2" />
                    View All Sessions
                  </Link>
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/study-plans">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Study Plans
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/settings/availability">
                    <Clock className="h-4 w-4 mr-2" />
                    Manage Availability
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/inbox">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

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
      </div>
    </div>
  )
}
