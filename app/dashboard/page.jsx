"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardNav } from "@/components/dashboard-nav"
import { useUser } from "@/hooks/use-user"
import { Loader2, Video, MapPin } from "lucide-react"
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Brain,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function DashboardPage() {
  const { user, loading } = useUser()
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    upcoming: 0,
    pending: 0,
    completed: 0
  })
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [recentActivities, setRecentActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(true)

  const isTutor = user?.role === 'tutor'

  useEffect(() => {
    if (user) {
      fetchUpcomingSessions()
      fetchSessionStats()
      fetchRecentActivity()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isTutor])

  const fetchUpcomingSessions = async () => {
    setLoadingSessions(true)
    try {
      const role = isTutor ? 'tutor' : 'student'
      const response = await fetch(`/api/sessions?status=upcoming&role=${role}`)
      const data = await response.json()
      if (data.success) {
        // Get only the next 3 upcoming sessions
        const sessions = data.data.sessions || []
        setUpcomingSessions(sessions.slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  const fetchSessionStats = async () => {
    try {
      const role = isTutor ? 'tutor' : 'student'
      const [upcomingRes, pendingRes, completedRes] = await Promise.all([
        fetch(`/api/sessions?status=upcoming&role=${role}`),
        fetch(`/api/sessions?status=pending&role=${role}`),
        fetch(`/api/sessions?status=completed&role=${role}`)
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

  const fetchRecentActivity = async () => {
    setLoadingActivities(true)
    try {
      const role = isTutor ? 'tutor' : 'student'
      const [sessionsRes, studyPlansRes] = await Promise.all([
        fetch(`/api/sessions?role=${role}`),
        fetch(`/api/study-plans?role=${role}&status=all`)
      ])

      const sessionsData = await sessionsRes.json()
      const studyPlansData = await studyPlansRes.json()

      const sessions = sessionsData.success && Array.isArray(sessionsData.data.sessions)
        ? sessionsData.data.sessions
        : []

      const studyPlans = studyPlansData.success && Array.isArray(studyPlansData.data.studyPlans)
        ? studyPlansData.data.studyPlans
        : []

      const sessionActivities = sessions.map((session) => {
        const baseDate = new Date(session.updated_at || session.session_date)
        const counterpart = isTutor ? session.student : session.tutor?.user

        let title = ''
        let badge = ''
        let icon = 'check'
        let badgeVariant = 'secondary'

        switch (session.status) {
          case 'completed':
            title = `Completed ${session.subject} session with ${counterpart?.name || 'student'}`
            badge = 'Completed'
            icon = 'check'
            badgeVariant = 'secondary'
            break
          case 'pending':
            title = `${isTutor ? 'New session request' : 'Pending confirmation'} for ${session.subject}`
            badge = 'Pending'
            icon = 'alert'
            badgeVariant = 'outline'
            break
          case 'confirmed':
            title = `Confirmed ${session.subject} session on ${formatDate(session.session_date)}`
            badge = 'Confirmed'
            icon = 'calendar'
            badgeVariant = 'secondary'
            break
          case 'cancelled':
            title = `${session.subject} session was cancelled`
            badge = 'Cancelled'
            icon = 'alert'
            badgeVariant = 'outline'
            break
          default:
            title = `${session.subject} session update`
            badge = session.status || 'Update'
            icon = 'calendar'
        }

        return {
          id: `session-${session.id}`,
          title,
          timestamp: formatTimeAgo(baseDate),
          badge,
          badgeVariant,
          icon,
          sortDate: baseDate
        }
      })

      const studyPlanActivities = studyPlans.map((plan) => {
        const baseDate = new Date(plan.updated_at || plan.created_at)
        const counterpart = isTutor ? plan.student : plan.tutor

        let title = ''
        let badge = ''
        let icon = 'plan'
        let badgeVariant = 'secondary'

        switch (plan.status) {
          case 'pending':
            title = `${plan.title} study plan requested ${isTutor ? `by ${plan.student?.name}` : `from ${plan.tutor?.name}`}`
            badge = 'Pending'
            icon = 'plan'
            badgeVariant = 'outline'
            break
          case 'active':
            title = `${plan.title} study plan is now active`
            badge = 'Active'
            icon = 'plan'
            badgeVariant = 'secondary'
            break
          case 'completed':
            title = `${plan.title} study plan completed`
            badge = 'Completed'
            icon = 'plan'
            badgeVariant = 'secondary'
            break
          default:
            title = `${plan.title} study plan update`
            badge = plan.status || 'Update'
        }

        return {
          id: `plan-${plan.id}`,
          title,
          subtitle: counterpart?.name,
          timestamp: formatTimeAgo(baseDate),
          badge,
          badgeVariant,
          icon,
          sortDate: baseDate
        }
      })

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const combined = [...sessionActivities, ...studyPlanActivities]
        .filter((entry) => entry.sortDate && entry.sortDate >= oneWeekAgo)
        .sort((a, b) => (b.sortDate || 0) - (a.sortDate || 0))
        .slice(0, 5)

      setRecentActivities(combined)
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    } finally {
      setLoadingActivities(false)
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

  const formatTimeAgo = (date) => {
    if (!date || isNaN(date.getTime())) return ''

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

  const activityIcon = (icon) => {
    switch (icon) {
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'calendar':
        return <Calendar className="h-5 w-5 text-primary" />
      case 'plan':
        return <BookOpen className="h-5 w-5 text-primary" />
      case 'check':
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />
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
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
          <p className="text-muted-foreground">
            {isTutor ? "Here's your tutoring schedule and session requests." : "Here's your learning progress and upcoming sessions."}
          </p>
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
              <p className="text-xs text-muted-foreground">
                {isTutor ? 'All sessions' : 'All time'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.upcoming}</div>
              <p className="text-xs text-muted-foreground">
                {isTutor ? 'Scheduled sessions' : 'Scheduled sessions'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isTutor ? 'Pending Requests' : 'Pending'}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.pending}</div>
              <p className="text-xs text-muted-foreground">
                {isTutor ? 'Awaiting response' : 'Awaiting confirmation'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.completed}</div>
              <p className="text-xs text-muted-foreground">
                {isTutor ? 'Total completed' : 'Total completed'}
              </p>
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
                <CardDescription>
                  {isTutor ? 'Your scheduled tutoring sessions' : 'Your scheduled tutoring sessions for this week'}
                </CardDescription>
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
                    {!isTutor && (
                      <Button variant="outline" className="mt-4 bg-transparent" asChild>
                        <Link href="/sessions/book">
                          <Plus className="h-4 w-4 mr-2" />
                          Book Your First Session
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {upcomingSessions.map((session) => {
                      const displayUser = isTutor ? session.student : session.tutor?.user
                      const timeUntil = getTimeUntilSession(session.session_date, session.start_time)
                      
                      return (
                        <div key={session.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar>
                              <AvatarImage src={displayUser?.avatar_url || "/placeholder-user.jpg"} />
                              <AvatarFallback>{getInitials(displayUser?.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold">
                                {session.subject}
                                {isTutor ? (
                                  <> with {displayUser?.name}</>
                                ) : (
                                  <> with {displayUser?.name}</>
                                )}
                              </h4>
                              <p className="text-sm text-muted-foreground">{session.topic}</p>
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
                            <p className="text-sm text-muted-foreground">{session.start_time}</p>
                            {timeUntil && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {timeUntil}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {!isTutor && (
                      <Button variant="outline" className="w-full bg-transparent" asChild>
                        <Link href="/sessions/book">
                          <Plus className="h-4 w-4 mr-2" />
                          Schedule New Session
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/sessions">
                        View All Sessions
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Recent Activity</CardTitle>
                <CardDescription>Your latest learning activities and achievements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingActivities ? (
                  <div className="space-y-2">
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
                ) : recentActivities.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No recent activity yet. Keep learning!</p>
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      {activityIcon(activity.icon)}
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
                        {activity.subtitle && (
                          <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                        )}
                      </div>
                      {activity.badge && (
                        <Badge variant={activity.badgeVariant || 'secondary'}>{activity.badge}</Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Study Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Study Progress</CardTitle>
                <CardDescription>Your current learning goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Mathematics</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Physics</span>
                    <span>72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Chemistry</span>
                    <span>68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                </div>

                <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                  <Link href="/profile">
                    View Detailed Progress
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
                {!isTutor && (
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                    <Link href="/sessions/book">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Session
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/study-plans">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Study Plans
                  </Link>
                </Button>

                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/tutors/ranking">
                    <Users className="h-4 w-4 mr-2" />
                    Find Tutors
                  </Link>
                </Button>
                {/* <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/ai-assistant">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Study Assistant
                  </Link>
                </Button> */}
                {!isTutor && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    asChild
                  >
                    <Link href="/tutor-registration">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Signup as Tutor
                    </Link>
                  </Button>
                )}
                {isTutor && (
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                    <Link href="/sessions?status=requests">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      View Requests ({sessionStats.pending})
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}