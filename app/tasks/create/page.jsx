"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardNav } from "@/components/dashboard-nav"
import { ArrowLeft, CalendarIcon, Clock, Target, Flag } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { format } from "date-fns"

export default function CreateTaskPage() {
  const [dueDate, setDueDate] = useState()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [priority, setPriority] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [associatedTutor, setAssociatedTutor] = useState("")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    
    if (!title.trim()) {
      newErrors.title = "Task title is required"
    }
    if (!description.trim()) {
      newErrors.description = "Description is required"
    }
    if (!subject) {
      newErrors.subject = "Please select a subject"
    }
    if (!priority) {
      newErrors.priority = "Please select a priority level"
    }
    if (!estimatedTime) {
      newErrors.estimatedTime = "Please select estimated time"
    }
    if (!dueDate) {
      newErrors.dueDate = "Please select a due date"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateTask = () => {
    if (validateForm()) {
      // Form is valid, proceed with creating task
      console.log("Creating task:", {
        title,
        description,
        subject,
        priority,
        estimatedTime,
        dueDate,
        associatedTutor,
        notes
      })
      // Here you would typically make an API call to create the task
      alert("Task created successfully!")
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
            <Link href="/tasks">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Create New Task</h1>
            <p className="text-muted-foreground">Add a new task to track your learning progress</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Task Details</CardTitle>
                <CardDescription>Provide information about your new task</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Complete Calculus Problem Set 5" 
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      clearError('title')
                    }}
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe what needs to be done..." 
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
                    <Label>Subject</Label>
                    <Select value={subject} onValueChange={(value) => {
                      setSubject(value)
                      clearError('subject')
                    }}>
                      <SelectTrigger className={errors.subject ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mathematics">Mathematics</SelectItem>
                        <SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem>
                        <SelectItem value="biology">Biology</SelectItem>
                        <SelectItem value="computer-science">Computer Science</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.subject && (
                      <p className="text-sm text-red-500">{errors.subject}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(value) => {
                      setPriority(value)
                      clearError('priority')
                    }}>
                      <SelectTrigger className={errors.priority ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-gray-500" />
                            Low Priority
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-yellow-500" />
                            Medium Priority
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-red-500" />
                            High Priority
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.priority && (
                      <p className="text-sm text-red-500">{errors.priority}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={`w-full justify-start text-left font-normal bg-transparent ${errors.dueDate ? "border-red-500" : ""}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar 
                          mode="single" 
                          selected={dueDate} 
                          onSelect={(date) => {
                            setDueDate(date)
                            clearError('dueDate')
                          }} 
                          initialFocus 
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.dueDate && (
                      <p className="text-sm text-red-500">{errors.dueDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Estimated Time</Label>
                    <Select value={estimatedTime} onValueChange={(value) => {
                      setEstimatedTime(value)
                      clearError('estimatedTime')
                    }}>
                      <SelectTrigger className={errors.estimatedTime ? "border-red-500" : ""}>
                        <SelectValue placeholder="How long will this take?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30min">30 minutes</SelectItem>
                        <SelectItem value="1hour">1 hour</SelectItem>
                        <SelectItem value="2hours">2 hours</SelectItem>
                        <SelectItem value="3hours">3 hours</SelectItem>
                        <SelectItem value="4hours">4+ hours</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.estimatedTime && (
                      <p className="text-sm text-red-500">{errors.estimatedTime}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Associated Tutor (Optional)</Label>
                  <Select value={associatedTutor} onValueChange={setAssociatedTutor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tutor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dr-rodriguez">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/math-tutor.png" />
                            <AvatarFallback>DR</AvatarFallback>
                          </Avatar>
                          Dr. Rodriguez - Mathematics
                        </div>
                      </SelectItem>
                      <SelectItem value="prof-smith">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/physics-tutor.jpg" />
                            <AvatarFallback>SM</AvatarFallback>
                          </Avatar>
                          Prof. Smith - Physics
                        </div>
                      </SelectItem>
                      <SelectItem value="dr-johnson">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/chemistry-tutor.jpg" />
                            <AvatarFallback>LJ</AvatarFallback>
                          </Avatar>
                          Dr. Johnson - Chemistry
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Any additional information or reminders..." 
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Task Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Subject</p>
                    <p className="text-sm text-muted-foreground">Mathematics</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Due Date</p>
                    <p className="text-sm text-muted-foreground">{dueDate ? format(dueDate, "PPP") : "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Estimated Time</p>
                    <p className="text-sm text-muted-foreground">2 hours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Flag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Priority</p>
                    <p className="text-sm text-muted-foreground">High Priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Quick Templates</CardTitle>
                <CardDescription>Use these common task templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  Problem Set Assignment
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  Reading Assignment
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  Lab Report
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  Exam Preparation
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  Research Project
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button className="w-full" size="lg" onClick={handleCreateTask}>
                  Create Task
                </Button>
                <Button variant="outline" className="w-full bg-transparent">
                  Save as Draft
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
