"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardNav } from "@/components/dashboard-nav"
import { X, Plus, GraduationCap, BookOpen, Clock, User, Loader2 } from "lucide-react"

const availableSubjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "History",
  "Geography",
  "Economics",
  "Psychology",
  "Statistics",
  "Calculus",
  "Algebra",
  "Geometry",
  "Literature",
]

const experienceLevels = [
  "Beginner (0-1 years)",
  "Intermediate (1-3 years)",
  "Advanced (3-5 years)",
  "Expert (5+ years)",
]

const semesterOptions = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "7th Semester",
  "8th Semester",
  "Graduate Student",
  "PhD Student",
  "Recent Graduate",
]

export default function TutorRegistrationPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subjects: [],
    experience: "",
    semester: "",
    bio: "",
    hourlyRate: "",
  })

  // Fetch current user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user/current')
        const data = await response.json()

        if (data.success && data.data.user) {
          setFormData(prev => ({
            ...prev,
            name: data.data.user.name,
            email: data.data.user.email
          }))
        } else {
          // User not logged in, redirect to login
          router.push('/login?redirect=/tutor-registration')
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        router.push('/login?redirect=/tutor-registration')
      } finally {
        setIsLoadingUser(false)
      }
    }

    fetchUser()
  }, [router])

  const [newSubject, setNewSubject] = useState("")

  const addSubject = (subject) => {
    if (subject && !formData.subjects.includes(subject)) {
      setFormData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, subject],
      }))
      setNewSubject("")
    }
  }

  const removeSubject = (subject) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== subject),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Validate required fields
    if (!formData.subjects || formData.subjects.length === 0) {
      setError("Please select at least one subject you can tutor.")
      return
    }

    if (!formData.experience) {
      setError("Please select your experience level.")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/tutor-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phone,
          subjects: formData.subjects,
          experience: formData.experience,
          semester: formData.semester,
          bio: formData.bio,
          hourlyRate: formData.hourlyRate,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Success - redirect to tutor dashboard
        router.push("/dashboard/tutor?registered=true")
      } else {
        setError(data.message || "Registration failed. Please try again.")
      }
    } catch (err) {
      setError("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <DashboardNav />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Become a Tutor</h1>
          <p className="text-muted-foreground">
            Share your knowledge and help other students succeed. Fill out the form below to start your tutoring
            journey.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Tell us about yourself and your contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">This is your registered name</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@example.com"
                    required
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">This is your registered email</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
              <CardDescription>Your current academic status and experience level</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semester">Current Semester/Level *</Label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, semester: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your current semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesterOptions.map((semester) => (
                        <SelectItem key={semester} value={semester}>
                          {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Tutoring Experience *</Label>
                  <Select
                    value={formData.experience}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, experience: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subjects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif">
                <BookOpen className="h-5 w-5" />
                Subjects You Can Tutor
              </CardTitle>
              <CardDescription>
                Select the subjects you're confident teaching. You can add multiple subjects.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={newSubject} onValueChange={setNewSubject}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a subject to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects
                      .filter((subject) => !formData.subjects.includes(subject))
                      .map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={() => addSubject(newSubject)} disabled={!newSubject} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.subjects.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Subjects ({formData.subjects.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.subjects.map((subject) => (
                      <Badge key={subject} variant="secondary" className="flex items-center gap-1">
                        {subject}
                        <button
                          type="button"
                          onClick={() => removeSubject(subject)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.subjects.length === 0 && (
                <p className="text-sm text-muted-foreground">Please select at least one subject you can tutor.</p>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif">
                <Clock className="h-5 w-5" />
                Additional Information
              </CardTitle>
              <CardDescription>Share more about your teaching approach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio/Teaching Philosophy</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about your teaching style, approach, and what makes you a great tutor..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                "Create Tutor Profile"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

