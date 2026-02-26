"use client"

import React, { useState } from "react"
import { Search, UserPlus, Users, MessageCircle, Star, BookOpen, Settings, LogOut, User, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// Note: This app is a single, self-contained file, so we'll use a simple <a> tag for navigation.
// In a real Next.js app, Link from next/link would be used for client-side routing.
const CustomLink = ({ href, children, ...props }) => (
  <a href={href} {...props}>
    {children}
  </a>
);

// DashboardNav component is now included in this single file for a self-contained app.
export function DashboardNav({ userType = "student", userName = "User", userAvatar }) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <CustomLink href="/" className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-serif font-bold text-primary">TutorHive</h1>
        </CustomLink>

        <nav className="hidden md:flex items-center gap-6">
          <CustomLink
            href={userType === "student" ? "/dashboard" : "/dashboard/tutor"}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </CustomLink>
          <CustomLink href="/sessions" className="text-muted-foreground hover:text-foreground transition-colors">
            Sessions
          </CustomLink>
          <CustomLink href="/connections" className="text-muted-foreground hover:text-foreground transition-colors">
            Connections
          </CustomLink>
          <CustomLink href="/inbox" className="text-muted-foreground hover:text-foreground transition-colors">
            Inbox
          </CustomLink>
          <CustomLink href="/study-plans" className="text-muted-foreground hover:text-foreground transition-colors">
            Study Plans
          </CustomLink>
          {userType === "student" && (
            <CustomLink href="/tutors/ranking" className="text-muted-foreground hover:text-foreground transition-colors">
              Find Tutors
            </CustomLink>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
                  <AvatarFallback>{userName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userType === "student" ? "Student" : "Tutor"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <CustomLink href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </CustomLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <CustomLink href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </CustomLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

// Mock data for peers
const mockPeers = [
  {
    id: 1,
    name: "Emma Thompson",
    type: "student",
    semester: "3rd Semester",
    subjects: ["Mathematics", "Physics", "Computer Science"],
    rating: 4.8,
    connections: 45,
    bio: "Passionate about STEM subjects and collaborative learning.",
    avatar: "/student-sarah.jpg",
    status: "online",
  },
  {
    id: 2,
    name: "Michael Chen",
    type: "tutor",
    semester: "Graduate",
    subjects: ["Chemistry", "Biology", "Mathematics"],
    rating: 4.9,
    connections: 78,
    bio: "PhD student helping others excel in sciences.",
    avatar: "/math-tutor.png",
    status: "online",
  },
  {
    id: 3,
    name: "Sarah Johnson",
    type: "student",
    semester: "2nd Semester",
    subjects: ["English", "History", "Psychology"],
    rating: 4.6,
    connections: 32,
    bio: "Literature enthusiast and study group organizer.",
    avatar: "/student-john.jpg",
    status: "offline",
  },
  {
    id: 4,
    name: "David Rodriguez",
    type: "tutor",
    semester: "4th Semester",
    subjects: ["Computer Science", "Mathematics", "Statistics"],
    rating: 4.7,
    connections: 56,
    bio: "CS major with expertise in algorithms and data structures.",
    avatar: "/physics-tutor.jpg",
    status: "online",
  },
  {
    id: 5,
    name: "Lisa Wang",
    type: "student",
    semester: "1st Semester",
    subjects: ["Mathematics", "Chemistry", "Physics"],
    rating: 4.5,
    connections: 23,
    bio: "Pre-med student looking for study partners.",
    avatar: "/chemistry-tutor.jpg",
    status: "online",
  },
  {
    id: 6,
    name: "James Wilson",
    type: "tutor",
    semester: "Graduate",
    subjects: ["History", "Political Science", "Philosophy"],
    rating: 4.8,
    connections: 67,
    bio: "History PhD helping students with research and writing.",
    avatar: "/tutor-profile.png",
    status: "offline",
  },
]

export default function ConnectionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("discover")
  const [connectionRequests, setConnectionRequests] = useState([])

  const filteredPeers = mockPeers.filter(
    (peer) =>
      peer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.subjects.some((subject) => subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      peer.bio.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSendRequest = (peerId) => {
    setConnectionRequests((prev) => [...prev, peerId])
  }

  const PeerCard = ({ peer }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={peer.avatar || "/placeholder.svg"} alt={peer.name} />
                <AvatarFallback>
                  {peer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  peer.status === "online" ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{peer.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={peer.type === "tutor" ? "default" : "secondary"} className="text-xs">
                  {peer.type === "tutor" ? "Tutor" : "Student"}
                </Badge>
                <span>•</span>
                <span>{peer.semester}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{peer.rating}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{peer.bio}</p>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Subjects:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {peer.subjects.map((subject) => (
              <Badge key={subject} variant="outline" className="text-xs">
                {subject}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{peer.connections} connections</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button
              size="sm"
              onClick={() => handleSendRequest(peer.id)}
              disabled={connectionRequests.includes(peer.id)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {connectionRequests.includes(peer.id) ? "Sent" : "Connect"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Connections</h1>
            <p className="text-muted-foreground">
              Connect with fellow students and tutors to enhance your learning experience
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, subject, or interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="connected">Connected</TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Discover Peers</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredPeers.length} {filteredPeers.length === 1 ? "person" : "people"} found
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPeers.map((peer) => (
                  <PeerCard key={peer.id} peer={peer} />
                ))}
              </div>

              {filteredPeers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No peers found</h3>
                  <p className="text-muted-foreground">Try adjusting your search terms or browse all available peers</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-6">
              <h2 className="text-xl font-semibold">Connection Requests</h2>
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No pending requests</h3>
                <p className="text-muted-foreground">Connection requests will appear here when you receive them</p>
              </div>
            </TabsContent>

            <TabsContent value="connected" className="space-y-6">
              <h2 className="text-xl font-semibold">Your Connections</h2>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No connections yet</h3>
                <p className="text-muted-foreground">Start connecting with peers to build your learning network</p>
                </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
