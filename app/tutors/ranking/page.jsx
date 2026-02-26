"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DashboardNav } from "@/components/dashboard-nav"
import { Star, BookOpen, Users, Filter, Search } from "lucide-react"
import Link from "next/link"

const tutors = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    avatar: "/math-tutor.png",
    rating: 4.9,
    experience: 156,
    studyPlans: 23,
    subjects: ["Mathematics", "Statistics", "Calculus"],
    availability: "Available",
    bio: "PhD in Mathematics with 8+ years of tutoring experience",
  },
  {
    id: 2,
    name: "Prof. Michael Chen",
    avatar: "/physics-tutor.jpg",
    rating: 4.8,
    experience: 203,
    studyPlans: 31,
    subjects: ["Physics", "Engineering", "Mathematics"],
    availability: "Busy",
    bio: "Former university professor specializing in advanced physics",
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    avatar: "/chemistry-tutor.jpg",
    rating: 4.7,
    experience: 89,
    studyPlans: 18,
    subjects: ["Chemistry", "Biology", "Organic Chemistry"],
    availability: "Available",
    bio: "Research scientist with passion for teaching chemistry",
  },
  {
    id: 4,
    name: "James Wilson",
    avatar: "/tutor-profile.png",
    rating: 4.6,
    experience: 67,
    studyPlans: 12,
    subjects: ["Computer Science", "Programming", "Mathematics"],
    availability: "Available",
    bio: "Software engineer turned educator, loves coding and math",
  },
]

export default function TutorRankingPage() {
  const searchParams = useSearchParams()
  const [selectedSubject, setSelectedSubject] = useState("")
  const [sortBy, setSortBy] = useState("rating")
  const [filterBy, setFilterBy] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const subject = searchParams.get("subject")
    if (subject) {
      setSelectedSubject(subject)
    }
  }, [searchParams])

  const filteredTutors = tutors
    .filter((tutor) => {
      const matchesSubject =
        !selectedSubject ||
        tutor.subjects.some((subject) => subject.toLowerCase().includes(selectedSubject.toLowerCase()))
      const matchesAvailability = filterBy === "all" || (filterBy === "available" && tutor.availability === "Available")
      const matchesSearch =
        !searchQuery ||
        tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.subjects.some((subject) => subject.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesSubject && matchesAvailability && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating
      if (sortBy === "experience") return b.experience - a.experience
      return 0
    })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
      <DashboardNav />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Find Your Perfect Tutor</h1>
          <p className="text-muted-foreground">
            {selectedSubject ? `Showing tutors for ${selectedSubject}` : "Browse all available tutors"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Sort
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Search Tutors</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Highest Rating</SelectItem>
                      <SelectItem value="experience">Most Experience</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter by Availability */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Availability</label>
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tutors</SelectItem>
                      <SelectItem value="available">Available Now</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input
                    placeholder="Filter by subject..."
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tutors List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {filteredTutors.map((tutor) => (
                <Card key={tutor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={tutor.avatar || "/placeholder.svg"} alt={tutor.name} />
                        <AvatarFallback>
                          {tutor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{tutor.name}</h3>
                            <p className="text-sm text-muted-foreground">{tutor.bio}</p>
                          </div>
                          <Badge
                            variant={tutor.availability === "Available" ? "default" : "secondary"}
                            className={tutor.availability === "Available" ? "bg-green-100 text-green-800" : ""}
                          >
                            {tutor.availability}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{tutor.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{tutor.experience} sessions</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{tutor.studyPlans} study plans</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {tutor.subjects.map((subject, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href="/profile">
                                View Profile
                              </Link>
                            </Button>
                            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700" asChild>
                              <Link href="/sessions/book">
                                Book Session
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTutors.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-lg">No tutors found matching your criteria</div>
                <p className="text-muted-foreground mt-2">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
