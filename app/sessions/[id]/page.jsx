"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardNav } from "@/components/dashboard-nav"
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  MessageSquare,
  Star,
  ArrowLeft,
  FileText,
  Download,
  Upload,
  CheckCircle,
  PlayCircle,
  Users,
  Loader2,
  MapPin,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { format } from "date-fns"

export default function SessionDetailPage() {
  const params = useParams()
  const sessionId = params.id
  const { user } = useUser()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState("")
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState(new Date())
  const [rescheduleStartTime, setRescheduleStartTime] = useState("")
  const [rescheduleEndTime, setRescheduleEndTime] = useState("")
  const [rescheduling, setRescheduling] = useState(false)
  const router = useRouter()
  
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
    fetchSession()
  }, [sessionId])

  useEffect(() => {
    if (session && rescheduleDialogOpen) {
      setRescheduleDate(new Date(session.session_date))
      setRescheduleStartTime(session.start_time || "")
      setRescheduleEndTime(session.end_time || "")
    }
  }, [session, rescheduleDialogOpen])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`)
      const data = await response.json()
      if (data.success) {
        setSession(data.data.session)
        setNotes(data.data.session.notes || "")
      } else {
        setError(data.message || 'Failed to load session')
      }
    } catch (err) {
      console.error('Error fetching session:', err)
      setError('Failed to load session')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes })
      })

      const data = await response.json()
      if (data.success) {
        setSession(data.data.session)
        // Show success message (you can add a toast here)
      } else {
        setError(data.message || 'Failed to save notes')
      }
    } catch (err) {
      console.error('Error saving notes:', err)
      setError('Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleMarkAsCompleted = async () => {
    if (!confirm('Are you sure you want to mark this session as completed?')) {
      return
    }

    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' })
      })

      const data = await response.json()
      if (data.success) {
        setSession(data.data.session)
        // Show success message
        alert('Session marked as completed successfully!')
      } else {
        setError(data.message || 'Failed to update session status')
        alert(data.message || 'Failed to update session status')
      }
    } catch (err) {
      console.error('Error updating session status:', err)
      setError('Failed to update session status')
      alert('Failed to update session status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleStartTime) {
      alert('Please select a date and start time')
      return
    }

    setRescheduling(true)
    try {
      const response = await fetch(`/api/sessions/${sessionId}/reschedule`, {
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
        setSession(data.data.session)
        setRescheduleDialogOpen(false)
        alert('Session rescheduled successfully!')
        router.refresh()
      } else {
        setError(data.message || 'Failed to reschedule session')
        alert(data.message || 'Failed to reschedule session')
      }
    } catch (err) {
      console.error('Error rescheduling session:', err)
      setError('Failed to reschedule session')
      alert('Failed to reschedule session')
    } finally {
      setRescheduling(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const formatDateShort = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    }
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

  const getDurationText = (minutes) => {
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{error || 'Session not found'}</p>
            <Button asChild>
              <Link href="/sessions">Back to Sessions</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const tutor = session.tutor?.user
  const student = session.student
  const isUpcoming = session.status === 'confirmed' && new Date(session.session_date) > new Date()
  const isConfirmed = session.status === 'confirmed'
  const isCompleted = session.status === 'completed'
  const timeUntil = getTimeUntilSession(session.session_date, session.start_time)
  
  // Determine display user based on role
  const displayUser = isTutor ? student : tutor

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sessions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-serif font-bold mb-2">Session Details</h1>
            <p className="text-muted-foreground">
              {session.subject}
              {isTutor ? ` with ${student?.name}` : ` with ${tutor?.name}`}
            </p>
          </div>
          {isUpcoming && (
            <Button asChild style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white', borderColor: 'oklch(0.395 0.055 200.975)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'oklch(0.35 0.055 200.975)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'oklch(0.395 0.055 200.975)'}>
              <Link href={`/sessions/${session.id}`}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Join Session
              </Link>
            </Button>
          )}
          {isTutor && isConfirmed && !isCompleted && (
            <Button 
              onClick={handleMarkAsCompleted}
              disabled={updatingStatus}
              variant="default"
              style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white', borderColor: 'oklch(0.395 0.055 200.975)' }}
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.35 0.055 200.975)')}
              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.395 0.055 200.975)')}
            >
              {updatingStatus ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed
                </>
              )}
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-serif">{session.topic}</CardTitle>
                    <CardDescription>
                      {formatDate(session.session_date)} • {session.start_time} {session.end_time ? `- ${session.end_time}` : ''}
                    </CardDescription>
                  </div>
                  {timeUntil && (
                    <Badge variant="secondary">{timeUntil}</Badge>
                  )}
                  {session.status === 'pending' && (
                    <Badge variant="outline">Pending</Badge>
                  )}
                  {session.status === 'completed' && (
                    <Badge variant="secondary">Completed</Badge>
                  )}
                  {session.status === 'cancelled' && (
                    <Badge variant="destructive">Cancelled</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={displayUser?.avatar_url || "/placeholder-user.jpg"} />
                    <AvatarFallback>{getInitials(displayUser?.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{displayUser?.name}</h3>
                    <p className="text-muted-foreground">
                      {isTutor ? `${session.subject} Student` : `${session.subject} Tutor`}
                    </p>
                    {!isTutor && session.tutor?.rating && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-4 w-4 ${
                                star <= Math.round(session.tutor.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {session.tutor.rating.toFixed(1)} ({session.tutor.total_reviews || 0} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-sm text-muted-foreground">{formatDateShort(session.session_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-sm text-muted-foreground">
                        {session.start_time} {session.end_time ? `- ${session.end_time}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {session.session_type === 'online' ? (
                      <Video className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">Session Type</p>
                      <p className="text-sm text-muted-foreground">
                        {session.session_type === 'online' ? 'Online Session' : 'In-Person'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">{getDurationText(session.duration)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {session.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Session Description</h4>
                    <p className="text-muted-foreground">{session.description}</p>
                  </div>
                )}

                {session.cancellation_reason && (
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Cancellation Reason</h4>
                    <p className="text-muted-foreground">{session.cancellation_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Session Notes</CardTitle>
                <CardDescription>
                  {isTutor 
                    ? "Add notes about this session. The student can view these notes." 
                    : "Add notes, questions, or topics you'd like to discuss. The tutor can view these notes."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.notes && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm font-medium mb-2">Current Notes:</p>
                    <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
                  </div>
                )}
                <Textarea
                  placeholder={isTutor 
                    ? "Add session notes, learning points, or feedback..." 
                    : "Add your notes, questions, or topics you'd like to discuss..."}
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button onClick={handleSaveNotes} disabled={savingNotes} style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white', borderColor: 'oklch(0.395 0.055 200.975)' }} onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.35 0.055 200.975)')} onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.395 0.055 200.975)')}>
                  {savingNotes ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    session.notes ? 'Update Notes' : 'Save Notes'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isUpcoming && (
                  <Button className="w-full" asChild style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white', borderColor: 'oklch(0.395 0.055 200.975)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'oklch(0.35 0.055 200.975)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'oklch(0.395 0.055 200.975)'}>
                    <Link href={`/sessions/${session.id}`}>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Join Session
                    </Link>
                  </Button>
                )}
                {isTutor && isConfirmed && !isCompleted && (
                  <Button 
                    className="w-full"
                    onClick={handleMarkAsCompleted}
                    disabled={updatingStatus}
                    style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white', borderColor: 'oklch(0.395 0.055 200.975)' }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.35 0.055 200.975)')}
                    onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.395 0.055 200.975)')}
                  >
                    {updatingStatus ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Completed
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/inbox">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Link>
                </Button>
                {session.status !== 'cancelled' && session.status !== 'completed' && (
                  <Button 
                    variant="outline" 
                    className="w-full bg-transparent"
                    onClick={() => setRescheduleDialogOpen(true)}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Reschedule
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Session</DialogTitle>
            <DialogDescription>
              Choose a new date and time for this session. Both parties will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {session && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">
                  Current: {formatDateShort(session.session_date)} at {session.start_time}
                </p>
                {session.rescheduled_from && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Originally scheduled: {session.rescheduled_from}
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
                    {rescheduleDate ? format(rescheduleDate, "PPP") : "Pick a date"}
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
              onClick={() => setRescheduleDialogOpen(false)}
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
  )
}
