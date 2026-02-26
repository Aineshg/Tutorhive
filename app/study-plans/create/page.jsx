"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DashboardNav } from "@/components/dashboard-nav"
import { ArrowLeft, Target, Clock, Calendar, Star, Users, CheckCircle, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CreateStudyPlanPage() {
  const router = useRouter()
  const [selectedTutor, setSelectedTutor] = useState("")
  const [planTitle, setPlanTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [difficultyLevel, setDifficultyLevel] = useState("")
  const [learningGoals, setLearningGoals] = useState("")
  const [duration, setDuration] = useState("")
  const [timeCommitment, setTimeCommitment] = useState("")
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [errors, setErrors] = useState({})
  const [tutors, setTutors] = useState([])
  const [loadingTutors, setLoadingTutors] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const durationToLabel = (value) => {
    switch (value) {
      case "4-weeks":
        return "4 weeks"
      case "6-weeks":
        return "6 weeks"
      case "8-weeks":
        return "8 weeks"
      case "12-weeks":
        return "12 weeks"
      case "flexible":
        return "Flexible"
      default:
        return value || "unspecified"
    }
  }

  const timeCommitmentToLabel = (value) => {
    switch (value) {
      case "3-5":
        return "3-5 hours/week"
      case "5-7":
        return "5-7 hours/week"
      case "7-10":
        return "7-10 hours/week"
      case "10+":
        return "10+ hours/week"
      default:
        return value || "unspecified"
    }
  }

  useEffect(() => {
    fetchTutors()
  }, [])

  const fetchTutors = async () => {
    try {
      setLoadingTutors(true)
      // Fetch connected tutors or all tutors
      const response = await fetch('/api/connections')
      const connectionsData = await response.json()
      
      if (connectionsData.success && connectionsData.data.connected.length > 0) {
        // Get tutor IDs from connections
        const tutorUserIds = connectionsData.data.connected.map(conn => {
          const otherUser = conn.requester_id === connectionsData.data.currentUserId 
            ? conn.receiver 
            : conn.requester
          return otherUser.id
        })

        // Fetch tutor profiles
        const tutorsResponse = await fetch('/api/tutors')
        const tutorsData = await tutorsResponse.json()
        
        if (tutorsData.success) {
          // Filter to only connected tutors
          const connectedTutors = tutorsData.data.tutors.filter(tutor => 
            tutorUserIds.includes(tutor.user.id)
          )
          setTutors(connectedTutors)
        } else {
          // Fallback to all tutors if connection filtering fails
          if (tutorsData.success) {
            setTutors(tutorsData.data.tutors || [])
          }
        }
      } else {
        // If no connections, fetch all tutors
        const tutorsResponse = await fetch('/api/tutors')
        const tutorsData = await tutorsResponse.json()
        if (tutorsData.success) {
          setTutors(tutorsData.data.tutors || [])
        }
      }
    } catch (error) {
      console.error('Error fetching tutors:', error)
      // Fallback: fetch all tutors
      try {
        const tutorsResponse = await fetch('/api/tutors')
        const tutorsData = await tutorsResponse.json()
        if (tutorsData.success) {
          setTutors(tutorsData.data.tutors || [])
        }
      } catch (fallbackError) {
        console.error('Error fetching tutors fallback:', fallbackError)
      }
    } finally {
      setLoadingTutors(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!planTitle.trim()) {
      newErrors.planTitle = "Plan title is required"
    }
    if (!subject) {
      newErrors.subject = "Please select a subject"
    }
    if (!difficultyLevel) {
      newErrors.difficultyLevel = "Please select a difficulty level"
    }
    if (!learningGoals.trim()) {
      newErrors.learningGoals = "Learning goals are required"
    }
    if (!duration) {
      newErrors.duration = "Please select a duration"
    }
    if (!timeCommitment) {
      newErrors.timeCommitment = "Please select time commitment"
    }
    if (!selectedTutor) {
      newErrors.selectedTutor = "Please select a tutor"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitPlan = () => {
    if (validateForm()) {
      setShowSummaryModal(true)
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

  const handleConfirmSubmit = async () => {
    setSubmitting(true)
    try {
      // Convert duration to weeks
      const durationWeeks = duration === "4-weeks" ? 4 :
                           duration === "6-weeks" ? 6 :
                           duration === "8-weeks" ? 8 :
                           duration === "12-weeks" ? 12 : null

      const response = await fetch('/api/study-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutor_id: selectedTutor, // This should be tutor.id (tutor record ID), not user.id
          title: planTitle,
          subject: subject.charAt(0).toUpperCase() + subject.slice(1).replace('-', ' '),
          difficulty_level: difficultyLevel,
          duration_weeks: durationWeeks,
          time_commitment: timeCommitment === "3-5" ? "3-5 hours/week" :
                          timeCommitment === "5-7" ? "5-7 hours/week" :
                          timeCommitment === "7-10" ? "7-10 hours/week" :
                          timeCommitment === "10+" ? "10+ hours/week" : timeCommitment,
          learning_goals: learningGoals
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setShowSummaryModal(false)
        // Redirect to study plans list showing pending status
        router.push('/study-plans?status=pending')
      } else {
        alert(data.message || 'Failed to create study plan')
        setSubmitting(false)
      }
    } catch (error) {
      console.error('Error creating study plan:', error)
      alert('Failed to create study plan. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/study-plans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Study Plans
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Request New Study Plan</h1>
            <p className="text-muted-foreground">Create a personalized learning path with your tutor</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-serif">Plan Details</CardTitle>
                <CardDescription>Provide basic information about your learning goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="planTitle">Plan Title</Label>
                  <Input 
                    id="planTitle" 
                    placeholder="e.g., Advanced Calculus Mastery" 
                    value={planTitle}
                    onChange={(e) => {
                      setPlanTitle(e.target.value)
                      clearError('planTitle')
                    }}
                    className={errors.planTitle ? "border-red-500" : ""}
                  />
                  {errors.planTitle && (
                    <p className="text-sm text-red-500">{errors.planTitle}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={subject} onValueChange={(value) => {
                      setSubject(value)
                      clearError('subject')
                    }}>
                      <SelectTrigger className={errors.subject ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.subject && (
                      <p className="text-sm text-red-500">{errors.subject}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <Select value={difficultyLevel} onValueChange={(value) => {
                      setDifficultyLevel(value)
                      clearError('difficultyLevel')
                    }}>
                      <SelectTrigger className={errors.difficultyLevel ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.difficultyLevel && (
                      <p className="text-sm text-red-500">{errors.difficultyLevel}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Learning Goals</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you want to achieve with this study plan..."
                    rows={4}
                    value={learningGoals}
                    onChange={(e) => {
                      setLearningGoals(e.target.value)
                      clearError('learningGoals')
                    }}
                    className={errors.learningGoals ? "border-red-500" : ""}
                  />
                  {errors.learningGoals && (
                    <p className="text-sm text-red-500">{errors.learningGoals}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preferred Duration</Label>
                    <Select value={duration} onValueChange={(value) => {
                      setDuration(value)
                      clearError('duration')
                    }}>
                      <SelectTrigger className={errors.duration ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4-weeks">4 weeks</SelectItem>
                        <SelectItem value="6-weeks">6 weeks</SelectItem>
                        <SelectItem value="8-weeks">8 weeks</SelectItem>
                        <SelectItem value="12-weeks">12 weeks</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.duration && (
                      <p className="text-sm text-red-500">{errors.duration}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Time Commitment</Label>
                    <Select value={timeCommitment} onValueChange={(value) => {
                      setTimeCommitment(value)
                      clearError('timeCommitment')
                    }}>
                      <SelectTrigger className={errors.timeCommitment ? "border-red-500" : ""}>
                        <SelectValue placeholder="Hours per week" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3-5">3-5 hours/week</SelectItem>
                        <SelectItem value="5-7">5-7 hours/week</SelectItem>
                        <SelectItem value="7-10">7-10 hours/week</SelectItem>
                        <SelectItem value="10+">10+ hours/week</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.timeCommitment && (
                      <p className="text-sm text-red-500">{errors.timeCommitment}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tutor Selection */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-serif">Select Tutor</CardTitle>
                <CardDescription>Choose a tutor to create your personalized study plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingTutors ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                  </div>
                ) : tutors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tutors available</p>
                    <p className="text-sm mt-2">Connect with tutors first to request a study plan</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href="/connections">
                        <Users className="h-4 w-4 mr-2" />
                        Browse Tutors
                      </Link>
                    </Button>
                  </div>
                ) : (
                  tutors.map((tutor) => (
                    <div
                      key={tutor.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTutor === tutor.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        setSelectedTutor(tutor.tutor_id || tutor.id)
                        clearError('selectedTutor')
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={tutor.avatar_url} />
                          <AvatarFallback>
                            {tutor.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{tutor.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {tutor.subjects?.join(', ') || 'No subjects listed'}
                          </p>
                          {tutor.rating && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`h-3 w-3 ${
                                      star <= Math.round(tutor.rating) 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {tutor.rating.toFixed(1)} {tutor.total_reviews > 0 && `(${tutor.total_reviews} reviews)`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {(selectedTutor === tutor.tutor_id || selectedTutor === tutor.id) && <Badge variant="secondary">Selected</Badge>}
                      </div>
                    </div>
                  ))
                )}
                {errors.selectedTutor && (
                  <p className="text-sm text-red-500">{errors.selectedTutor}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan Summary */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-serif">Plan Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {planTitle && (
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                    <div>
                      <p className="font-medium">Plan Title</p>
                      <p className="text-sm text-muted-foreground">{planTitle}</p>
                    </div>
                  </div>
                )}
                {subject && (
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                    <div>
                      <p className="font-medium">Subject</p>
                      <p className="text-sm text-muted-foreground capitalize">{subject}</p>
                    </div>
                  </div>
                )}
                {difficultyLevel && (
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                    <div>
                      <p className="font-medium">Difficulty Level</p>
                      <p className="text-sm text-muted-foreground capitalize">{difficultyLevel}</p>
                    </div>
                  </div>
                )}
                {duration && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">{durationToLabel(duration)}</p>
                    </div>
                  </div>
                )}
                {timeCommitment && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Time Commitment</p>
                      <p className="text-sm text-muted-foreground">{timeCommitmentToLabel(timeCommitment)}</p>
                    </div>
                  </div>
                )}
                {selectedTutor && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Selected Tutor</p>
                      <p className="text-sm text-muted-foreground">
                        {tutors.find(t => (t.tutor_id || t.id) === selectedTutor)?.name || "Not selected"}
                      </p>
                    </div>
                  </div>
                )}
                {learningGoals && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium mb-2">Learning Goals</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{learningGoals}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleSubmitPlan}
                  style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}
                >
                  Submit Plan Request
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Your tutor will review and customize this plan within 24 hours
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Study Plan Summary
            </DialogTitle>
            <DialogDescription>
              Please review your study plan details before submitting
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Plan Overview */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Plan Overview</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {planTitle && (
                  <div>
                    <span className="font-medium">Title:</span>
                    <p className="text-muted-foreground">{planTitle}</p>
                  </div>
                )}
                {subject && (
                  <div>
                    <span className="font-medium">Subject:</span>
                    <p className="text-muted-foreground capitalize">{subject}</p>
                  </div>
                )}
                {difficultyLevel && (
                  <div>
                    <span className="font-medium">Difficulty:</span>
                    <p className="text-muted-foreground capitalize">{difficultyLevel}</p>
                  </div>
                )}
                {duration && (
                  <div>
                    <span className="font-medium">Duration:</span>
                    <p className="text-muted-foreground">{durationToLabel(duration)}</p>
                  </div>
                )}
                {timeCommitment && (
                  <div>
                    <span className="font-medium">Time Commitment:</span>
                    <p className="text-muted-foreground">{timeCommitmentToLabel(timeCommitment)}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">Selected Tutor:</span>
                  <p className="text-muted-foreground">
                    {tutors.find(t => (t.tutor_id || t.id) === selectedTutor)?.name || "Not selected"}
                  </p>
                </div>
              </div>
            </div>

            {/* Learning Goals */}
            {learningGoals && (
              <div>
                <h3 className="font-semibold mb-2">Learning Goals</h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">{learningGoals}</p>
                </div>
              </div>
            )}

            {/* Tutor Information */}
            {selectedTutor && tutors.find(t => (t.tutor_id || t.id) === selectedTutor) && (() => {
              const tutor = tutors.find(t => (t.tutor_id || t.id) === selectedTutor)
              return (
                <div>
                  <h3 className="font-semibold mb-3">Selected Tutor</h3>
                  <div className="flex items-center gap-4 p-4 border border-border rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={tutor.avatar_url} />
                      <AvatarFallback>
                        {tutor.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{tutor.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {tutor.subjects?.join(', ') || 'No subjects listed'}
                      </p>
                      {tutor.rating && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-3 w-3 ${
                                  star <= Math.round(tutor.rating) 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {tutor.rating.toFixed(1)} {tutor.total_reviews > 0 && `(${tutor.total_reviews} reviews)`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your tutor will review your request within 24 hours</li>
                <li>• They will create a personalized study plan based on your goals</li>
                <li>• You'll receive a notification when your plan is ready</li>
                <li>• You can then start your learning journey!</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSummaryModal(false)}
              disabled={submitting}
            >
              <X className="h-4 w-4 mr-2" />
              Edit Plan
            </Button>
            <Button 
              onClick={handleConfirmSubmit}
              disabled={submitting}
              style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm & Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
