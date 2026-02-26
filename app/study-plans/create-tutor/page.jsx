"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardNav } from "@/components/dashboard-nav"
import { ArrowLeft, Plus, X, Trash2, Loader2, Search, Sparkles } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/use-user"

export default function CreateTutorStudyPlanPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [selectedStudent, setSelectedStudent] = useState("")
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [planTitle, setPlanTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [difficultyLevel, setDifficultyLevel] = useState("")
  const [learningGoals, setLearningGoals] = useState("")
  const [duration, setDuration] = useState("")
  const [timeCommitment, setTimeCommitment] = useState("")
  const [modules, setModules] = useState([
    { title: '', description: '', week_number: 1, tasks: [{ title: '', description: '', task_type: 'reading' }] }
  ])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiError, setAiError] = useState("")

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
    // Wait for user to load before checking role
    if (userLoading) {
      return // Still loading
    }
    
    if (!user || user?.role !== 'tutor') {
      router.push('/study-plans')
      return
    }
    
    fetchStudents()
  }, [user, userLoading, router])

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      const response = await fetch('/api/users/students')
      const data = await response.json()
      
      if (data.success) {
        setStudents(data.data.students || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addModule = () => {
    setModules([...modules, { 
      title: '', 
      description: '', 
      week_number: modules.length + 1, 
      tasks: [{ title: '', description: '', task_type: 'reading' }] 
    }])
  }

  const removeModule = (index) => {
    setModules(modules.filter((_, i) => i !== index))
  }

  const updateModule = (index, field, value) => {
    const updated = [...modules]
    updated[index][field] = value
    setModules(updated)
  }

  const addTask = (moduleIndex) => {
    const updated = [...modules]
    updated[moduleIndex].tasks.push({ title: '', description: '', task_type: 'reading' })
    setModules(updated)
  }

  const removeTask = (moduleIndex, taskIndex) => {
    const updated = [...modules]
    updated[moduleIndex].tasks = updated[moduleIndex].tasks.filter((_, i) => i !== taskIndex)
    setModules(updated)
  }

  const updateTask = (moduleIndex, taskIndex, field, value) => {
    const updated = [...modules]
    updated[moduleIndex].tasks[taskIndex][field] = value
    setModules(updated)
  }

  const parseAiJson = (rawContent) => {
    if (!rawContent) return null
    const trimmed = rawContent.trim()
    const cleaned = trimmed.startsWith("```")
      ? trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
      : trimmed
    try {
      return JSON.parse(cleaned)
    } catch (error) {
      console.error("Failed to parse AI response:", error)
      return null
    }
  }

  const normaliseModules = (aiModules) => {
    if (!Array.isArray(aiModules)) return []
    return aiModules
      .map((module, index) => ({
        title: String(module?.title || `Module ${index + 1}`).trim(),
        description: module?.description ? String(module.description).trim() : "",
        week_number: typeof module?.week_number === "number" ? module.week_number : index + 1,
        tasks: Array.isArray(module?.tasks)
          ? module.tasks
              .map((task, taskIndex) => ({
                title: String(task?.title || `Task ${taskIndex + 1}`).trim(),
                description: task?.description ? String(task.description).trim() : "",
                task_type: ["reading", "video", "assignment", "quiz", "practice"].includes(task?.task_type)
                  ? task.task_type
                  : "reading",
              }))
              .filter((task) => task.title.length > 0)
          : [],
      }))
      .filter((module) => module.title.length > 0 && module.tasks.length > 0)
  }

  const generateModulesWithAI = async () => {
    setAiError("")

    const missingFields = {}

    if (!planTitle.trim()) {
      missingFields.planTitle = "Plan title is required before generating"
    }
    if (!subject) {
      missingFields.subject = "Select a subject before generating"
    }
    if (!difficultyLevel) {
      missingFields.difficultyLevel = "Select a difficulty level before generating"
    }
    if (!learningGoals.trim()) {
      missingFields.learningGoals = "Describe the learning goals before generating"
    }

    if (Object.keys(missingFields).length > 0) {
      setErrors((prev) => ({ ...prev, ...missingFields }))
      setAiError("Please complete the plan details before generating with AI.")
      return
    }

    setGenerating(true)
    try {
      const systemPrompt = `You are an expert tutor assistant. Output ONLY JSON matching this schema: { "modules": [ { "title": string, "description"?: string, "week_number"?: number, "tasks": [ { "title": string, "description"?: string, "task_type": "reading"|"video"|"assignment"|"quiz"|"practice" } ] } ] }. Provide 3-6 modules with 3-5 tasks each. Align workload with duration and hours per week.`

      const durationLabel = durationToLabel(duration)
      const timeLabel = timeCommitmentToLabel(timeCommitment)

      const userPrompt = `Create a detailed study plan outline for the following context:\n- Title: ${planTitle || "Untitled"}\n- Subject: ${subject || "(subject not selected)"}\n- Difficulty: ${difficultyLevel || "(not set)"}\n- Duration: ${durationLabel}\n- Weekly time commitment: ${timeLabel}\n- Learning goals: ${learningGoals || "(not provided)"}.\nEnsure tasks are varied and actionable.`

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          messages: [{ type: "user", content: userPrompt }],
          maxTokens: 2000,
          temperature: 0.6,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reach AI service")
      }

      const data = await response.json()
      const parsed = parseAiJson(data?.message?.content)

      if (!parsed || !parsed.modules) {
        throw new Error("AI response could not be parsed")
      }

      const generatedModules = normaliseModules(parsed.modules)

      if (generatedModules.length === 0) {
        throw new Error("AI proposal did not include any usable modules")
      }

      setModules(generatedModules.map((module, index) => ({
        ...module,
        week_number: module.week_number ?? index + 1,
        tasks: module.tasks.length > 0 ? module.tasks.map((task) => ({ ...task })) : [{ title: "", description: "", task_type: "reading" }],
      })))
    } catch (error) {
      console.error("AI module generation failed:", error)
      setAiError(error.message || "Failed to generate modules. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!selectedStudent) {
      newErrors.student = "Please select a student"
    }
    if (!planTitle.trim()) {
      newErrors.planTitle = "Plan title is required"
    }
    if (!subject) {
      newErrors.subject = "Subject is required"
    }
    if (!difficultyLevel) {
      newErrors.difficultyLevel = "Difficulty level is required"
    }
    if (modules.length === 0 || modules.every(m => !m.title.trim())) {
      newErrors.modules = "At least one module with a title is required"
    }
    if (modules.some(m => m.title.trim() && m.tasks.every(t => !t.title.trim()))) {
      newErrors.tasks = "Each module must have at least one task with a title"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const durationWeeks = duration === "4-weeks" ? 4 :
                           duration === "6-weeks" ? 6 :
                           duration === "8-weeks" ? 8 :
                           duration === "12-weeks" ? 12 : null

      const response = await fetch('/api/study-plans/create-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: selectedStudent,
          title: planTitle,
          subject: subject.charAt(0).toUpperCase() + subject.slice(1).replace('-', ' '),
          difficulty_level: difficultyLevel,
          duration_weeks: durationWeeks,
          time_commitment: timeCommitment === "3-5" ? "3-5 hours/week" :
                          timeCommitment === "5-7" ? "5-7 hours/week" :
                          timeCommitment === "7-10" ? "7-10 hours/week" :
                          timeCommitment === "10+" ? "10+ hours/week" : timeCommitment,
          learning_goals: learningGoals,
          modules: modules.filter(m => m.title.trim() && m.tasks.some(t => t.title.trim()))
        })
      })

      const data = await response.json()
      
      if (data.success) {
        router.push(`/study-plans/${data.data.studyPlan.id}`)
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

  const selectedStudentData = students.find(s => s.id === selectedStudent)

  // Show loading state while user is being fetched
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
      </div>
    )
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
            <h1 className="text-3xl font-serif font-bold mb-2">Create Study Plan</h1>
            <p className="text-muted-foreground">Create and assign a personalized learning path to a student</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Student Selection */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="font-serif">Select Student</CardTitle>
                  <CardDescription>Choose a student to assign this study plan to</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {loadingStudents ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          onClick={() => {
                            setSelectedStudent(student.id)
                            setErrors({ ...errors, student: null })
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedStudent === student.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={student.avatar_url} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                            {student.semester && (
                              <p className="text-xs text-muted-foreground">{student.semester}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {filteredStudents.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No students found</p>
                      )}
                    </div>
                  )}
                  {errors.student && (
                    <p className="text-sm text-red-500">{errors.student}</p>
                  )}
                </CardContent>
              </Card>

              {/* Plan Details */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="font-serif">Plan Details</CardTitle>
                  <CardDescription>Provide basic information about the study plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="planTitle">Plan Title *</Label>
                    <Input 
                      id="planTitle" 
                      placeholder="e.g., Advanced Calculus Mastery" 
                      value={planTitle}
                      onChange={(e) => {
                        setPlanTitle(e.target.value)
                        setErrors({ ...errors, planTitle: null })
                      }}
                      className={errors.planTitle ? "border-red-500" : ""}
                    />
                    {errors.planTitle && (
                      <p className="text-sm text-red-500">{errors.planTitle}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Subject *</Label>
                      <Select value={subject} onValueChange={(value) => {
                        setSubject(value)
                        setErrors({ ...errors, subject: null })
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
                      <Label>Difficulty Level *</Label>
                      <Select value={difficultyLevel} onValueChange={(value) => {
                        setDifficultyLevel(value)
                        setErrors({ ...errors, difficultyLevel: null })
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
                    <Label htmlFor="learningGoals">Learning Goals</Label>
                    <Textarea
                      id="learningGoals"
                      placeholder="Describe what the student should achieve..."
                      rows={4}
                      value={learningGoals}
                      onChange={(e) => {
                        setLearningGoals(e.target.value)
                        setErrors((prev) => ({ ...prev, learningGoals: null }))
                      }}
                      className={errors.learningGoals ? "border-red-500" : ""}
                    />
                    {errors.learningGoals && (
                      <p className="text-sm text-red-500">{errors.learningGoals}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
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
                    </div>

                    <div className="space-y-2">
                      <Label>Time Commitment</Label>
                      <Select value={timeCommitment} onValueChange={setTimeCommitment}>
                        <SelectTrigger>
                          <SelectValue placeholder="Hours per week" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3-5">3-5 hours/week</SelectItem>
                          <SelectItem value="5-7">5-7 hours/week</SelectItem>
                          <SelectItem value="7-10">7-10 hours/week</SelectItem>
                          <SelectItem value="10+">10+ hours/week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modules and Tasks */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="font-serif">Modules & Tasks</CardTitle>
                      <CardDescription>Create the learning modules and tasks for this study plan</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateModulesWithAI}
                        disabled={generating}
                        className="whitespace-nowrap"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Generating…
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4 text-primary" />
                            Generate with AI
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={addModule}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Module
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {aiError && (
                    <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {aiError}
                    </div>
                  )}
                  {modules.map((module, moduleIndex) => (
                    <Card key={moduleIndex} className="bg-gray-50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Module {moduleIndex + 1}</CardTitle>
                          {modules.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeModule(moduleIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Module Title *</Label>
                            <Input
                              value={module.title}
                              onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                              placeholder="e.g., Introduction to Calculus"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Week Number</Label>
                            <Input
                              type="number"
                              value={module.week_number}
                              onChange={(e) => updateModule(moduleIndex, 'week_number', parseInt(e.target.value) || 1)}
                              min="1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={module.description}
                            onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                            placeholder="Module description..."
                            rows={2}
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Tasks</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addTask(moduleIndex)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Task
                            </Button>
                          </div>
                          
                          {module.tasks.map((task, taskIndex) => (
                            <Card key={taskIndex} className="bg-white">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Task {taskIndex + 1}</span>
                                  {module.tasks.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTask(moduleIndex, taskIndex)}
                                      className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label>Task Title *</Label>
                                    <Input
                                      value={task.title}
                                      onChange={(e) => updateTask(moduleIndex, taskIndex, 'title', e.target.value)}
                                      placeholder="e.g., Read Chapter 1"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Task Type</Label>
                                    <Select
                                      value={task.task_type}
                                      onValueChange={(value) => updateTask(moduleIndex, taskIndex, 'task_type', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="reading">Reading</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="assignment">Assignment</SelectItem>
                                        <SelectItem value="quiz">Quiz</SelectItem>
                                        <SelectItem value="practice">Practice</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label>Description</Label>
                                  <Textarea
                                    value={task.description}
                                    onChange={(e) => updateTask(moduleIndex, taskIndex, 'description', e.target.value)}
                                    placeholder="Task description..."
                                    rows={2}
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {errors.modules && (
                    <p className="text-sm text-red-500">{errors.modules}</p>
                  )}
                  {errors.tasks && (
                    <p className="text-sm text-red-500">{errors.tasks}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm sticky top-4">
                <CardHeader>
                  <CardTitle className="font-serif">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedStudentData && (
                    <div>
                      <Label className="text-muted-foreground">Student</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedStudentData.avatar_url} />
                          <AvatarFallback>{selectedStudentData.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{selectedStudentData.name}</p>
                      </div>
                    </div>
                  )}
                  
                  {planTitle && (
                    <div>
                      <Label className="text-muted-foreground">Title</Label>
                      <p className="mt-1">{planTitle}</p>
                    </div>
                  )}
                  
                  {subject && (
                    <div>
                      <Label className="text-muted-foreground">Subject</Label>
                      <p className="mt-1">{subject}</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-muted-foreground">Modules</Label>
                    <p className="mt-1 text-2xl font-bold" style={{ color: 'oklch(0.395 0.055 200.975)' }}>
                      {modules.filter(m => m.title.trim()).length}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground">Total Tasks</Label>
                    <p className="mt-1 text-2xl font-bold" style={{ color: 'oklch(0.395 0.055 200.975)' }}>
                      {modules.reduce((sum, m) => sum + m.tasks.filter(t => t.title.trim()).length, 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                  style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Study Plan'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

