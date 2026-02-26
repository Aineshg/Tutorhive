"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DashboardNav } from "@/components/dashboard-nav"
import {
  Brain,
  Send,
  Lightbulb,
  BookOpen,
  Calculator,
  Beaker,
  Atom,
  TrendingUp,
  Target,
  Clock,
  Sparkles,
} from "lucide-react"
import { useState } from "react"
import { useUser } from "@/hooks/use-user"
import Link from "next/link"

export default function AIAssistantPage() {
  const { user } = useUser()
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content:
        "Hello! I'm your AI study assistant. I can help you with problem-solving, concept explanations, study recommendations, and more. What would you like to work on today?",
      timestamp: "10:30 AM",
    },
  ])
  const [inputValue, setInputValue] = useState("")

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const newMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages([...messages, newMessage])
    setInputValue("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: "ai",
        content:
          "I understand you're working on calculus problems. Let me help you break this down step by step. First, let's identify what type of problem this is and what approach would work best...",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold mb-2">AI Study Assistant</h1>
              <p className="text-muted-foreground">Get personalized help with your studies</p>
            </div>
          </div>
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Chat Interface */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="chat" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="chat">Chat Assistant</TabsTrigger>
                <TabsTrigger value="problem-solver">Problem Solver</TabsTrigger>
                <TabsTrigger value="study-planner">Study Planner</TabsTrigger>
                <TabsTrigger value="concept-explainer">Concept Explainer</TabsTrigger>
              </TabsList>

              <TabsContent value="chat">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader>
                    <CardTitle className="font-serif">AI Chat Assistant</CardTitle>
                    <CardDescription>Ask questions, get explanations, and receive study guidance</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ScrollArea className="flex-1 pr-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {message.type === "ai" && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10">
                                  <Brain className="h-4 w-4 text-primary" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.type === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                            </div>
                            {message.type === "user" && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src="/diverse-student-profiles.png" />
                                <AvatarFallback>
                                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="flex gap-2 mt-4">
                      <Input
                        placeholder="Ask me anything about your studies..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="problem-solver">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif">AI Problem Solver</CardTitle>
                    <CardDescription>Upload or type your problem for step-by-step solutions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="p-4 text-center hover:bg-muted/50 cursor-pointer">
                        <Calculator className="h-8 w-8 text-primary mx-auto mb-2" />
                        <h3 className="font-semibold">Mathematics</h3>
                        <p className="text-sm text-muted-foreground">Calculus, Algebra, Statistics</p>
                      </Card>
                      <Card className="p-4 text-center hover:bg-muted/50 cursor-pointer">
                        <Atom className="h-8 w-8 text-secondary mx-auto mb-2" />
                        <h3 className="font-semibold">Physics</h3>
                        <p className="text-sm text-muted-foreground">Mechanics, Quantum, Thermodynamics</p>
                      </Card>
                      <Card className="p-4 text-center hover:bg-muted/50 cursor-pointer">
                        <Beaker className="h-8 w-8 text-accent mx-auto mb-2" />
                        <h3 className="font-semibold">Chemistry</h3>
                        <p className="text-sm text-muted-foreground">Organic, Inorganic, Biochemistry</p>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Enter your problem:</label>
                        <textarea
                          className="w-full p-3 border border-border rounded-lg resize-none"
                          rows={4}
                          placeholder="Type or paste your problem here..."
                        />
                      </div>
                      <Button className="w-full">
                        <Brain className="h-4 w-4 mr-2" />
                        Solve Problem
                      </Button>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Recent Solutions</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-background rounded">
                          <span className="text-sm">Find the derivative of f(x) = x³ + 2x² - 5x + 1</span>
                          <Badge variant="secondary">Solved</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-background rounded">
                          <span className="text-sm">Calculate the pH of a 0.1M HCl solution</span>
                          <Badge variant="secondary">Solved</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="study-planner">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif">AI Study Planner</CardTitle>
                    <CardDescription>Get personalized study schedules and recommendations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold">Current Goals</h3>
                        <div className="space-y-3">
                          <div className="p-3 border border-border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Master Calculus II</span>
                              <Badge variant="secondary">75%</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">Expected completion: 2 weeks</div>
                          </div>
                          <div className="p-3 border border-border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Quantum Mechanics Basics</span>
                              <Badge variant="outline">45%</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">Expected completion: 4 weeks</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold">AI Recommendations</h3>
                        <div className="space-y-3">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Focus Area</span>
                            </div>
                            <p className="text-sm">Spend more time on integration techniques this week</p>
                          </div>
                          <div className="p-3 bg-secondary/10 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-secondary" />
                              <span className="font-medium text-sm">Schedule Tip</span>
                            </div>
                            <p className="text-sm">Best study time for you: 9-11 AM based on your performance</p>
                          </div>
                          <div className="p-3 bg-accent/10 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-4 w-4 text-accent" />
                              <span className="font-medium text-sm">Goal Adjustment</span>
                            </div>
                            <p className="text-sm">
                              Consider extending physics timeline by 1 week for better retention
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full">
                      <Brain className="h-4 w-4 mr-2" />
                      Generate New Study Plan
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="concept-explainer">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif">AI Concept Explainer</CardTitle>
                    <CardDescription>Get clear explanations of complex topics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">What concept would you like explained?</label>
                        <Input placeholder="e.g., Chain rule in calculus, Quantum superposition, etc." />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" className="bg-transparent">
                          Simple
                        </Button>
                        <Button variant="outline" size="sm" className="bg-transparent">
                          Detailed
                        </Button>
                        <Button variant="outline" size="sm" className="bg-transparent">
                          With Examples
                        </Button>
                      </div>
                      <Button className="w-full">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Explain Concept
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Popular Explanations</h3>
                      <div className="grid gap-3">
                        <Card className="p-4 hover:bg-muted/50 cursor-pointer">
                          <h4 className="font-medium mb-1">The Chain Rule</h4>
                          <p className="text-sm text-muted-foreground">
                            Understanding how to differentiate composite functions
                          </p>
                          <Badge variant="outline" className="mt-2">
                            Mathematics
                          </Badge>
                        </Card>
                        <Card className="p-4 hover:bg-muted/50 cursor-pointer">
                          <h4 className="font-medium mb-1">Wave-Particle Duality</h4>
                          <p className="text-sm text-muted-foreground">
                            How light and matter exhibit both wave and particle properties
                          </p>
                          <Badge variant="outline" className="mt-2">
                            Physics
                          </Badge>
                        </Card>
                        <Card className="p-4 hover:bg-muted/50 cursor-pointer">
                          <h4 className="font-medium mb-1">Organic Reaction Mechanisms</h4>
                          <p className="text-sm text-muted-foreground">
                            Step-by-step breakdown of how organic reactions occur
                          </p>
                          <Badge variant="outline" className="mt-2">
                            Chemistry
                          </Badge>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">AI Insights</CardTitle>
                <CardDescription>Personalized recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Performance Trend</span>
                  </div>
                  <p className="text-sm">Your math scores improved 15% this week!</p>
                </div>

                <div className="p-3 bg-secondary/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-secondary" />
                    <span className="font-medium text-sm">Study Pattern</span>
                  </div>
                  <p className="text-sm">You're most productive during morning sessions</p>
                </div>

                <div className="p-3 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-accent" />
                    <span className="font-medium text-sm">Next Focus</span>
                  </div>
                  <p className="text-sm">Practice more integration by parts problems</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/ai-assistant">
                    <Calculator className="h-4 w-4 mr-2" />
                    Solve Math Problem
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/ai-assistant">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Explain Concept
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/study-plans/create">
                    <Target className="h-4 w-4 mr-2" />
                    Create Study Plan
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/profile">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analyze Progress
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">This Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Problems Solved</span>
                  <span className="font-medium">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Concepts Explained</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Study Plans Created</span>
                  <span className="font-medium">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Chat Sessions</span>
                  <span className="font-medium">15</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}