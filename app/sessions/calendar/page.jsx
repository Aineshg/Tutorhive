"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardNav } from "@/components/dashboard-nav"
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react"
import { useRouter } from "next/navigation"

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Computer Science",
  "Economics",
  "Psychology",
  "Statistics",
]

const upcomingConferences = [
  { name: "Math Study Group", date: "Jan 15, 2025", action: "Join" },
  { name: "Physics Workshop", date: "Jan 18, 2025", action: "Register" },
  { name: "Chemistry Lab Review", date: "Jan 22, 2025", action: "Pending" },
]

export default function CalendarSessionsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedSubject, setSelectedSubject] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()

  // Get week dates
  const getWeekDates = (date) => {
    const week = []
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const weekDates = getWeekDates(currentWeek)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const formatDateRange = () => {
    const start = weekDates[0]
    const end = weekDates[6]
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
  }

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const handleSearchTutors = () => {
    if (selectedSubject) {
      setIsDialogOpen(false)
      router.push(`/tutors/ranking?subject=${encodeURIComponent(selectedSubject)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
      <DashboardNav />

      {/* Top Navigation */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">{formatDateRange()}</h2>
            <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button className="bg-primary hover:bg-primary/90">Today</Button>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Weekly Date Selector */}
          <div className="mb-6">
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    date.toDateString() === selectedDate.toDateString()
                      ? "bg-primary text-primary-foreground"
                      : date.toDateString() === new Date().toDateString()
                        ? "bg-primary/10 text-primary"
                        : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  <div className="text-xs font-medium">{dayNames[index]}</div>
                  <div className="text-lg font-semibold">{date.getDate()}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sessions Section */}
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Sessions on{" "}
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h3>

            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">No sessions scheduled for this day</div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-card border-l border-border p-6">
          {/* Monthly Calendar */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border-0"
              />
            </CardContent>
          </Card>

          {/* Upcoming Conferences */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Conferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingConferences.map((conference, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                  >
                    <div>
                      <div className="font-medium text-sm">{conference.name}</div>
                      <div className="text-xs text-muted-foreground">{conference.date}</div>
                    </div>
                    <Badge variant={conference.action === "Join" ? "default" : "secondary"} className="text-xs">
                      {conference.action}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Session Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Select Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleSearchTutors}
                  disabled={!selectedSubject}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search Tutors
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
