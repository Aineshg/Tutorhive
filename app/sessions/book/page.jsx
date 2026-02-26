"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardNav } from "@/components/dashboard-nav"
import { Clock, Star, ArrowLeft, Video, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function BookSessionPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTutor, setSelectedTutor] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [sessionType, setSessionType] = useState("online")
  const [duration, setDuration] = useState("60")
  const [subject, setSubject] = useState("")
  const [topic, setTopic] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState({})
  const [tutors, setTutors] = useState([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState("")
  const [tutorAvailability, setTutorAvailability] = useState([])
  const [blockedDates, setBlockedDates] = useState([])
  const [bookedSessions, setBookedSessions] = useState([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  // Fetch tutors on component mount
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const response = await fetch('/api/tutors')
        const data = await response.json()
        if (data.success) {
          setTutors(data.data.tutors)
          if (data.data.tutors.length > 0) {
            setSelectedTutor(data.data.tutors[0].id)
          }
        }
      } catch (err) {
        console.error('Error fetching tutors:', err)
        setError('Failed to load tutors')
      } finally {
        setLoading(false)
      }
    }

    fetchTutors()
  }, [])

  // Fetch availability and booked sessions when tutor is selected
  useEffect(() => {
    if (!selectedTutor) {
      setTutorAvailability([])
      setBlockedDates([])
      setBookedSessions([])
      return
    }

    const tutorRecord = tutors.find((t) => t.id === selectedTutor)
    const tutorPrismaId = tutorRecord?.tutor_id

    if (!tutorPrismaId) {
      setTutorAvailability([])
      setBlockedDates([])
      setBookedSessions([])
      return
    }

    const fetchTutorAvailability = async () => {
      setLoadingAvailability(true)
      try {
        // Fetch availability
        const availResponse = await fetch(`/api/availability?tutorId=${tutorPrismaId}`)
        const availData = await availResponse.json()
        if (availData.success) {
          setTutorAvailability(availData.data.availability || [])
          setBlockedDates(availData.data.unavailableDates || [])
        }

        // Fetch booked sessions for this tutor (as a student viewing tutor's sessions)
        const sessionsResponse = await fetch(`/api/sessions?tutorId=${tutorPrismaId}&role=student`)
        const sessionsData = await sessionsResponse.json()
        if (sessionsData.success) {
          // Filter for confirmed/pending sessions (not cancelled/completed)
          const activeSessions = (sessionsData.data.sessions || []).filter(
            s => s.status === 'confirmed' || s.status === 'pending'
          )
          setBookedSessions(activeSessions)
        }
      } catch (err) {
        console.error('Error fetching tutor availability:', err)
      } finally {
        setLoadingAvailability(false)
      }
    }

    fetchTutorAvailability()
  }, [selectedTutor, tutors])

  // Clear selected time when date changes
  useEffect(() => {
    setSelectedTime("")
  }, [selectedDate])

  // Clear subject when tutor changes (if current subject is not in new tutor's subjects)
  useEffect(() => {
    if (selectedTutor && tutors.length > 0) {
      const tutor = tutors.find(t => t.id === selectedTutor)
      if (tutor) {
        if (tutor.subjects && tutor.subjects.length > 0) {
          // If current subject is not in tutor's subjects, clear it
          if (subject && !tutor.subjects.includes(subject)) {
            setSubject("")
          }
        } else {
          // If tutor has no subjects, clear the subject
          setSubject("")
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTutor, tutors])

  // Helper functions
  const getDayOfWeek = (date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
  }

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null
    const [time, period] = timeStr.split(' ')
    let [hours, minutes] = time.split(':').map(Number)
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return hours * 60 + (minutes || 0)
  }

  const slotsOverlap = (slotStart, slotEnd, sessionStart, sessionEnd, sessionDuration) => {
    const slotStartMin = parseTimeToMinutes(slotStart)
    const slotEndMin = parseTimeToMinutes(slotEnd)
    const sessionStartMin = parseTimeToMinutes(sessionStart)
    let sessionEndMin = parseTimeToMinutes(sessionEnd)

    if (sessionEndMin === null && sessionDuration) {
      sessionEndMin = sessionStartMin + Number(sessionDuration)
    }

    if ([slotStartMin, slotEndMin, sessionStartMin, sessionEndMin].some((val) => val === null)) {
      return false
    }

    return Math.max(slotStartMin, sessionStartMin) < Math.min(slotEndMin, sessionEndMin)
  }

  const isDateBlocked = (date) => {
    if (!date) return false
    const dateStr = date.toISOString().split('T')[0]
    return blockedDates.some(bd => {
      const blockedDateStr = new Date(bd.date).toISOString().split('T')[0]
      return blockedDateStr === dateStr
    })
  }

  const isSlotBooked = (slotStart, slotEnd, date) => {
    if (!date) return false
    const dateStr = date.toISOString().split('T')[0]
    return bookedSessions.some(session => {
      const sessionDateStr = new Date(session.session_date).toISOString().split('T')[0]
      if (sessionDateStr !== dateStr) return false
      
      // Check if the slot overlaps with the booked session
      return slotsOverlap(slotStart, slotEnd, session.start_time, session.end_time, session.duration)
    })
  }

  const getAvailableTimeSlots = () => {
    if (!selectedDate) return []
    
    const dayOfWeek = getDayOfWeek(selectedDate)
    const daySlots = tutorAvailability.filter(a => a.day_of_week === dayOfWeek)
    
    // Format slots and filter out booked ones
    return daySlots
      .map(slot => {
        const slotStr = `${slot.start_time} - ${slot.end_time}`
        const isBooked = isSlotBooked(slot.start_time, slot.end_time, selectedDate)
        return {
          label: slotStr,
          start_time: slot.start_time,
          end_time: slot.end_time,
          isBooked
        }
      })
      .filter(slot => !slot.isBooked) // Only show available slots
  }

  const getSelectedTutor = () => tutors.find(tutor => tutor.id === selectedTutor)
  const getDurationText = () => {
    const durationMap = {
      "30": "30 minutes",
      "60": "1 hour",
      "90": "1.5 hours",
      "120": "2 hours"
    }
    return durationMap[duration] || "1 hour"
  }

  const calculateTotalCost = () => {
    const tutor = getSelectedTutor()
    const durationHours = parseInt(duration) / 60
    return tutor ? Math.round((tutor.hourly_rate || 0) * durationHours) : 0
  }

  const getTutorFallback = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'T'
  }

  const parseTimeSlot = (timeSlot) => {
    // Parse "3:00 PM - 4:00 PM" into start_time and end_time
    if (typeof timeSlot === 'string') {
      const [start, end] = timeSlot.split(' - ')
      return { start_time: start, end_time: end }
    }
    // If it's already an object with start_time and end_time
    return { start_time: timeSlot.start_time, end_time: timeSlot.end_time }
  }

  // AI GENERATED: Form validation logic
  const validateForm = () => {
    const newErrors = {}
    
    if (!subject.trim()) {
      newErrors.subject = "Subject is required"
    }
    if (!topic.trim()) {
      newErrors.topic = "Topic is required"
    }
    if (!description.trim()) {
      newErrors.description = "Description is required"
    }
    if (!selectedTutor) {
      newErrors.tutor = "Please select a tutor"
    }
    if (!selectedTime) {
      newErrors.time = "Please select a time slot"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBookSession = async () => {
    if (!validateForm()) {
      return
    }

    setBooking(true)
    setError("")

    try {
      const { start_time, end_time } = parseTimeSlot(selectedTime)
      
      // Combine date and time for session_date
      const [time, period] = start_time.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      if (period === 'PM' && hour !== 12) hour += 12
      if (period === 'AM' && hour === 12) hour = 0
      
      const sessionDateTime = new Date(selectedDate)
      sessionDateTime.setHours(hour, parseInt(minutes), 0, 0)

      const response = await fetch('/api/sessions/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutor_id: selectedTutor,
          subject,
          topic,
          description,
          session_date: sessionDateTime.toISOString(),
          start_time,
          end_time,
          duration,
          session_type: sessionType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Booking failed:', data)
        setError(data.message || data.error || 'Failed to book session')
        return
      }

      if (data.success) {
        // Redirect to sessions page
        router.push('/sessions?booked=true')
      } else {
        setError(data.message || 'Failed to book session')
      }
    } catch (err) {
      console.error('Error booking session:', err)
      setError('Failed to book session. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

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
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Book a Session</h1>
            <p className="text-muted-foreground">Schedule a tutoring session with your preferred tutor</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tutor Selection */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-serif">Select Tutor</CardTitle>
                <CardDescription>Choose from your connected tutors or find a new one</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : tutors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tutors available. <Link href="/tutors/ranking" className="text-primary underline">Find tutors</Link>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {tutors.map((tutor) => (
                    <div
                      key={tutor.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTutor === tutor.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        setSelectedTutor(tutor.id)
                        clearError('tutor')
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={tutor.avatar_url || `/placeholder-user.jpg`} />
                          <AvatarFallback>{getTutorFallback(tutor.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{tutor.name}</h4>
                          <p className="text-sm text-muted-foreground">{tutor.specialties || tutor.subjects?.join(', ')}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-3 w-3 ${
                                    star <= Math.round(tutor.rating || 0)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {tutor.rating?.toFixed(1) || '0.0'} ({tutor.total_reviews || 0} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={selectedTutor === tutor.id ? "secondary" : "outline"}>
                          {selectedTutor === tutor.id ? "Selected" : "Available"}
                        </Badge>
                        
                      </div>
                    </div>
                    ))}
                  </div>
                )}
                {errors.tutor && (
                  <p className="text-sm text-red-500">{errors.tutor}</p>
                )}
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/tutors/ranking">
                    Find More Tutors
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Session Details */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Session Details</CardTitle>
                <CardDescription>Provide details about your tutoring session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  {selectedTutor ? (
                    <Select 
                      value={subject} 
                      onValueChange={(value) => {
                        setSubject(value)
                        clearError('subject')
                      }}
                    >
                      <SelectTrigger className={errors.subject ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSelectedTutor()?.subjects?.map((subj) => (
                          <SelectItem key={subj} value={subj}>
                            {subj}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input 
                      id="subject" 
                      placeholder="Select a tutor first" 
                      value=""
                      disabled
                      className={errors.subject ? "border-red-500" : ""}
                    />
                  )}
                  {errors.subject && (
                    <p className="text-sm text-red-500">{errors.subject}</p>
                  )}
                  {selectedTutor && getSelectedTutor()?.subjects?.length === 0 && (
                    <p className="text-sm text-muted-foreground">This tutor has no subjects listed.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Specific Topic</Label>
                  <Input 
                    id="topic" 
                    placeholder="e.g., Derivatives and Applications" 
                    value={topic}
                    onChange={(e) => {
                      setTopic(e.target.value)
                      clearError('topic')
                    }}
                    className={errors.topic ? "border-red-500" : ""}
                  />
                  {errors.topic && (
                    <p className="text-sm text-red-500">{errors.topic}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Session Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you'd like to focus on during this session..."
                    rows={4}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      clearError('description')
                    }}
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Session Type</Label>
                    <Select value={sessionType} onValueChange={setSessionType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Online Session
                          </div>
                        </SelectItem>
                        <SelectItem value="in-person">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            In-Person
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Date & Time Selection */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Select Date</CardTitle>
                <CardDescription>Choose your preferred date</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  disabled={(date) => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const checkDate = new Date(date)
                    checkDate.setHours(0, 0, 0, 0)
                    return checkDate < today || isDateBlocked(date)
                  }}
                  modifiers={{
                    blocked: (date) => isDateBlocked(date)
                  }}
                  modifiersClassNames={{
                    blocked: "bg-red-100 text-red-600 hover:bg-red-200"
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Available Times</CardTitle>
                <CardDescription>
                  {getSelectedTutor()?.name}'s availability for {selectedDate?.toDateString()}
                  {loadingAvailability && " (Loading...)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {loadingAvailability ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : getAvailableTimeSlots().length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {selectedDate ? 
                      (isDateBlocked(selectedDate) 
                        ? "This date is blocked by the tutor." 
                        : "No available time slots for this day. Please select another date.") 
                      : "Please select a date first."}
                  </p>
                ) : (
                  getAvailableTimeSlots().map((slot) => {
                    const slotLabel = slot.label || `${slot.start_time} - ${slot.end_time}`
                    return (
                      <Button
                        key={slotLabel}
                        variant="outline"
                        className={`w-full justify-start transition-colors ${
                          selectedTime === slotLabel
                            ? "bg-primary/10 border-primary"
                            : "bg-transparent hover:bg-muted/50"
                        }`}
                        onClick={() => {
                          setSelectedTime(slotLabel)
                          clearError('time')
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {slotLabel}
                      </Button>
                    )
                  })
                )}
                {errors.time && (
                  <p className="text-sm text-red-500">{errors.time}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Session Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Tutor:</span>
                  <span className="text-sm font-medium">{getSelectedTutor()?.name || "Select a tutor"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Subject:</span>
                  <span className="text-sm font-medium">{subject || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Topic:</span>
                  <span className="text-sm font-medium">{topic || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Date:</span>
                  <span className="text-sm font-medium">{selectedDate?.toDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Time:</span>
                  <span className="text-sm font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Duration:</span>
                  <span className="text-sm font-medium">{getDurationText()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Type:</span>
                  <span className="text-sm font-medium capitalize">{sessionType}</span>
                </div>
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <Button 
                  className="w-full" 
                  onClick={handleBookSession}
                  disabled={booking}
                  style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white', borderColor: 'oklch(0.395 0.055 200.975)' }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.35 0.055 200.975)')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'oklch(0.395 0.055 200.975)')}
                >
                  {booking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Book Session'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
