"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DashboardNav } from "@/components/dashboard-nav"
import {
  CheckCircle,
  Circle,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Target,
  TrendingUp,
  Star,
} from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function TasksPage() {
  const [completedTasks, setCompletedTasks] = useState([])

  const toggleTask = (taskId) => {
    setCompletedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">My Tasks</h1>
            <p className="text-muted-foreground">Track your assignments and study goals across all subjects</p>
          </div>
          <Button asChild>
            <Link href="/tasks/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Link>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Across all subjects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">18</div>
              <p className="text-xs text-muted-foreground">+3 this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">4</div>
              <p className="text-xs text-muted-foreground">Due this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">75%</div>
              <p className="text-xs text-muted-foreground">+5% from last week</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." className="pl-10" />
          </div>
          <Button variant="outline" className="bg-transparent">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Mathematics Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/math-tutor.png" />
                      <AvatarFallback>DR</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="font-serif">Mathematics - Calculus II</CardTitle>
                      <CardDescription>Dr. Rodriguez • 4 tasks</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">Progress: 75%</div>
                    <Progress value={75} className="w-24 h-2 mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id="task-1"
                    checked={completedTasks.includes("task-1")}
                    onCheckedChange={() => toggleTask("task-1")}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Complete Related Rates Problems</p>
                        <p className="text-sm text-muted-foreground">Practice problems 15-25 from textbook</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          Due Today
                        </Badge>
                        <Badge variant="secondary">High Priority</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-green-50">
                  <Checkbox id="task-2" checked={true} disabled />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium line-through text-muted-foreground">Chain Rule Worksheet</p>
                        <p className="text-sm text-muted-foreground">Complete all 20 problems</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id="task-3"
                    checked={completedTasks.includes("task-3")}
                    onCheckedChange={() => toggleTask("task-3")}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Review Integration Techniques</p>
                        <p className="text-sm text-muted-foreground">Study Chapter 7.1-7.3</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due Dec 18
                        </Badge>
                        <Badge variant="outline">Medium Priority</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id="task-4"
                    checked={completedTasks.includes("task-4")}
                    onCheckedChange={() => toggleTask("task-4")}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Midterm Preparation</p>
                        <p className="text-sm text-muted-foreground">Review all previous assignments</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due Dec 20
                        </Badge>
                        <Badge variant="destructive">High Priority</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Physics Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/physics-tutor.jpg" />
                      <AvatarFallback>SM</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="font-serif">Physics - Quantum Mechanics</CardTitle>
                      <CardDescription>Prof. Smith • 3 tasks</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">Progress: 33%</div>
                    <Progress value={33} className="w-24 h-2 mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-green-50">
                  <Checkbox id="task-5" checked={true} disabled />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium line-through text-muted-foreground">Wave Function Analysis</p>
                        <p className="text-sm text-muted-foreground">Solve problems 1-10</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id="task-6"
                    checked={completedTasks.includes("task-6")}
                    onCheckedChange={() => toggleTask("task-6")}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Schrödinger Equation Practice</p>
                        <p className="text-sm text-muted-foreground">Work through example problems</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due Dec 17
                        </Badge>
                        <Badge variant="secondary">Medium Priority</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id="task-7"
                    checked={completedTasks.includes("task-7")}
                    onCheckedChange={() => toggleTask("task-7")}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Lab Report: Particle in a Box</p>
                        <p className="text-sm text-muted-foreground">Complete analysis and conclusions</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due Dec 19
                        </Badge>
                        <Badge variant="destructive">High Priority</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chemistry Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/chemistry-tutor.jpg" />
                      <AvatarFallback>LJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="font-serif">Chemistry - Organic Chemistry</CardTitle>
                      <CardDescription>Dr. Johnson • 2 tasks</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">Progress: 50%</div>
                    <Progress value={50} className="w-24 h-2 mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-green-50">
                  <Checkbox id="task-8" checked={true} disabled />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium line-through text-muted-foreground">Reaction Mechanisms Study</p>
                        <p className="text-sm text-muted-foreground">Review SN1 and SN2 reactions</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Checkbox
                    id="task-9"
                    checked={completedTasks.includes("task-9")}
                    onCheckedChange={() => toggleTask("task-9")}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Stereochemistry Problems</p>
                        <p className="text-sm text-muted-foreground">Complete problem set 8</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due Dec 21
                        </Badge>
                        <Badge variant="outline">Low Priority</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Due Today</CardTitle>
                <CardDescription>Tasks that need to be completed today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-orange-200 bg-orange-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium">Complete Related Rates Problems</p>
                    <p className="text-sm text-muted-foreground">Mathematics - Due in 4 hours</p>
                  </div>
                  <Badge variant="destructive">Urgent</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">This Week</CardTitle>
                <CardDescription>Tasks due within the next 7 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">Schrödinger Equation Practice</p>
                    <p className="text-sm text-muted-foreground">Physics - Due Dec 17</p>
                  </div>
                  <Badge variant="secondary">Medium Priority</Badge>
                </div>

                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">Review Integration Techniques</p>
                    <p className="text-sm text-muted-foreground">Mathematics - Due Dec 18</p>
                  </div>
                  <Badge variant="outline">Medium Priority</Badge>
                </div>

                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">Lab Report: Particle in a Box</p>
                    <p className="text-sm text-muted-foreground">Physics - Due Dec 19</p>
                  </div>
                  <Badge variant="destructive">High Priority</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-serif font-semibold mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground mb-4">You don't have any overdue tasks. Great job!</p>
                <Button variant="outline" className="bg-transparent" asChild>
                  <Link href="/tasks">
                    View All Tasks
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Recently Completed</CardTitle>
                <CardDescription>Tasks you've finished in the past week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">Chain Rule Worksheet</p>
                    <p className="text-sm text-muted-foreground">Mathematics - Completed Dec 14</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">Wave Function Analysis</p>
                    <p className="text-sm text-muted-foreground">Physics - Completed Dec 13</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((star) => (
                      <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <Star className="h-3 w-3 text-gray-300" />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">Reaction Mechanisms Study</p>
                    <p className="text-sm text-muted-foreground">Chemistry - Completed Dec 12</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
