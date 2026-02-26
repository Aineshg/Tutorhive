"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { DashboardNav } from "@/components/dashboard-nav";
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  Calendar,
  Target,
  FileText,
  Video,
  MessageSquare,
  Star,
  TrendingUp,
  AlertCircle,
  Download,
  Loader2,
  BookOpen,
  PlayCircle,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { formatRelativeTime } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function StudyPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const studyPlanId = params.id;
  const [studyPlan, setStudyPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingTasks, setCompletingTasks] = useState({});
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [modules, setModules] = useState([
    { title: '', description: '', week_number: 1, tasks: [{ title: '', description: '', task_type: 'reading' }] }
  ]);

  useEffect(() => {
    if (studyPlanId) {
      fetchStudyPlan();
    }
  }, [studyPlanId]);

  const fetchStudyPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/study-plans/${studyPlanId}`);
      const data = await response.json();
      
      if (data.success) {
        setStudyPlan(data.data.studyPlan);
      }
    } catch (error) {
      console.error('Error fetching study plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptStudyPlan = async () => {
    setAccepting(true);
    try {
      const response = await fetch(`/api/study-plans/${studyPlanId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modules: modules.filter(m => m.title.trim() && m.tasks.some(t => t.title.trim()))
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowAcceptDialog(false);
        fetchStudyPlan(); // Refresh to show updated status
      } else {
        alert(data.message || 'Failed to accept study plan');
      }
    } catch (error) {
      console.error('Error accepting study plan:', error);
      alert('Failed to accept study plan. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const addModule = () => {
    setModules([...modules, { 
      title: '', 
      description: '', 
      week_number: modules.length + 1, 
      tasks: [{ title: '', description: '', task_type: 'reading' }] 
    }]);
  };

  const removeModule = (index) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const updateModule = (index, field, value) => {
    const updated = [...modules];
    updated[index][field] = value;
    setModules(updated);
  };

  const addTask = (moduleIndex) => {
    const updated = [...modules];
    updated[moduleIndex].tasks.push({ title: '', description: '', task_type: 'reading' });
    setModules(updated);
  };

  const removeTask = (moduleIndex, taskIndex) => {
    const updated = [...modules];
    updated[moduleIndex].tasks = updated[moduleIndex].tasks.filter((_, i) => i !== taskIndex);
    setModules(updated);
  };

  const updateTask = (moduleIndex, taskIndex, field, value) => {
    const updated = [...modules];
    updated[moduleIndex].tasks[taskIndex][field] = value;
    setModules(updated);
  };

  const handleTaskToggle = async (taskId, isCompleted) => {
    if (completingTasks[taskId]) return; // Prevent duplicate requests
    
    setCompletingTasks(prev => ({ ...prev, [taskId]: true }));

    try {
      const response = await fetch(`/api/study-plans/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !isCompleted
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state immediately for real-time feel
        setStudyPlan(prev => {
          if (!prev) return null;
          
          const updatedModules = prev.modules.map(module => ({
            ...module,
            tasks: module.tasks.map(task => {
              if (task.id === taskId) {
                return {
                  ...task,
                  isCompleted: !isCompleted,
                  status: !isCompleted ? 'completed' : 'pending',
                  completed_at: !isCompleted ? new Date().toISOString() : null
                };
              }
              return task;
            })
          }));

          return {
            ...prev,
            modules: updatedModules,
            progress_percentage: data.data.progressPercentage,
            stats: {
              ...prev.stats,
              completedTasks: data.data.completedTasks,
              totalTasks: data.data.totalTasks
            }
          };
        });
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
    } finally {
      setCompletingTasks(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });
    }
  };

  const getTaskTypeIcon = (taskType) => {
    switch (taskType) {
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'assignment': return <FileText className="h-4 w-4" />;
      case 'quiz': return <Target className="h-4 w-4" />;
      case 'practice': return <PlayCircle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
      </div>
    );
  }

  if (!studyPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">Study plan not found</p>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isStudent = user?.role === 'student';
  const isTutor = user?.role === 'tutor';
  const isPendingForTutor = isTutor && studyPlan.status === 'pending';
  const startedDate = studyPlan.started_at 
    ? new Date(studyPlan.started_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/study-plans">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Study Plans
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-serif font-bold mb-2">{studyPlan.title}</h1>
            <p className="text-muted-foreground">
              Created by {isStudent ? studyPlan.tutor.name : studyPlan.student.name} 
              {startedDate && ` • Started ${startedDate}`}
            </p>
          </div>
          {isPendingForTutor ? (
            <Button 
              onClick={() => setShowAcceptDialog(true)}
              style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept & Create Plan
            </Button>
          ) : (
            <Button asChild style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}>
              <Link href={`/inbox?userId=${isStudent ? studyPlan.tutor.id : studyPlan.student.id}`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Message {isStudent ? 'Tutor' : 'Student'}
              </Link>
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Overview */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={isStudent ? studyPlan.tutor.avatar_url : studyPlan.student.avatar_url} />
                    <AvatarFallback>
                      {(isStudent ? studyPlan.tutor.name : studyPlan.student.name).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="font-serif">Plan Overview</CardTitle>
                    <CardDescription>{studyPlan.description}</CardDescription>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className={`capitalize ${getStatusColor(studyPlan.status)}`}>
                        {studyPlan.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                    <div>
                      <p className="font-medium">Learning Goal</p>
                      <p className="text-sm text-muted-foreground">{studyPlan.learning_goals || 'No specific goals set'}</p>
                    </div>
                  </div>
                  {studyPlan.duration_weeks && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Duration</p>
                        <p className="text-sm text-muted-foreground">{studyPlan.duration_weeks} weeks</p>
                      </div>
                    </div>
                  )}
                  {studyPlan.time_commitment && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Time Commitment</p>
                        <p className="text-sm text-muted-foreground">{studyPlan.time_commitment}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Difficulty Level</p>
                      <p className="text-sm text-muted-foreground capitalize">{studyPlan.difficulty_level}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Overall Progress</h4>
                    <span className="text-sm font-medium">{studyPlan.progress_percentage || 0}%</span>
                  </div>
                  <Progress 
                    value={studyPlan.progress_percentage || 0} 
                    className="h-3"
                    style={{ 
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '--progress-background': 'oklch(0.395 0.055 200.975)'
                    }}
                  />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold" style={{ color: 'oklch(0.395 0.055 200.975)' }}>
                        {studyPlan.stats?.totalTasks || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Tasks</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {studyPlan.stats?.completedTasks || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">
                        {(studyPlan.stats?.totalTasks || 0) - (studyPlan.stats?.completedTasks || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasks and Modules */}
            <Tabs defaultValue="tasks" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="space-y-4">
                {studyPlan.modules && studyPlan.modules.length > 0 ? (
                  studyPlan.modules.map((module, moduleIndex) => {
                    const completedTasksInModule = module.tasks.filter(t => t.isCompleted).length;
                    const totalTasksInModule = module.tasks.length;
                    const moduleProgress = totalTasksInModule > 0 
                      ? Math.round((completedTasksInModule / totalTasksInModule) * 100)
                      : 0;

                    return (
                      <Card key={module.id} className="bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                          <CardTitle className="font-serif text-lg">
                            {module.week_number ? `Week ${module.week_number}: ` : ''}{module.title}
                          </CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Module Progress</span>
                              <span className="font-medium">{moduleProgress}%</span>
                            </div>
                            <Progress value={moduleProgress} className="h-2" />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {module.tasks.map((task) => (
                            <div
                              key={task.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                task.isCompleted
                                  ? "bg-green-50 border-green-200"
                                  : "bg-white border-gray-200"
                              }`}
                            >
                              <Checkbox
                                checked={task.isCompleted}
                                onCheckedChange={() => handleTaskToggle(task.id, task.isCompleted)}
                                disabled={completingTasks[task.id] || !isStudent}
                                className="h-5 w-5"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {getTaskTypeIcon(task.task_type)}
                                  <p className={`font-medium ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                                    {task.title}
                                  </p>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground">{task.description}</p>
                                )}
                                {task.due_date && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <Badge variant={task.isCompleted ? "secondary" : "outline"}>
                                {task.isCompleted ? "Completed" : "Pending"}
                              </Badge>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No modules or tasks yet</p>
                      {!isStudent && (
                        <p className="text-sm mt-2">Add modules and tasks to get started</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-serif">Study Materials</CardTitle>
                    <CardDescription>Resources provided by your tutor</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {studyPlan.resources && studyPlan.resources.length > 0 ? (
                      studyPlan.resources.map((resource) => (
                        <div key={resource.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            {resource.resource_type === 'video' ? (
                              <Video className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">{resource.title}</p>
                              <p className="text-sm text-muted-foreground">{resource.description || resource.resource_type}</p>
                            </div>
                          </div>
                          {resource.file_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          )}
                          {resource.external_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                                Open Link
                              </a>
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No resources available yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-serif">Progress Analytics</CardTitle>
                    <CardDescription>Your learning progress over time</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold" style={{ color: 'oklch(0.395 0.055 200.975)' }}>
                          {studyPlan.progress_percentage || 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">Overall Progress</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold" style={{ color: 'oklch(0.395 0.055 200.975)' }}>
                          {studyPlan.stats?.completedTasks || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Tasks Completed</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-semibold">Module Progress</h4>
                      {studyPlan.modules && studyPlan.modules.length > 0 ? (
                        studyPlan.modules.map((module) => {
                          const completed = module.tasks.filter(t => t.isCompleted).length;
                          const total = module.tasks.length;
                          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                          
                          return (
                            <div key={module.id} className="flex justify-between items-center">
                              <span className="text-sm">{module.title}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={progress} className="w-24 h-2" />
                                <span className="text-sm font-medium">{progress}%</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">No modules yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Task */}
            {studyPlan.modules && studyPlan.modules.length > 0 && (() => {
              const allTasks = studyPlan.modules.flatMap(m => m.tasks);
              const nextTask = allTasks.find(t => !t.isCompleted);
              
              return nextTask && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-serif">Current Task</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 border rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                      <h4 className="font-medium mb-2">{nextTask.title}</h4>
                      {nextTask.description && (
                        <p className="text-sm text-muted-foreground mb-3">{nextTask.description}</p>
                      )}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{studyPlan.progress_percentage || 0}%</span>
                        </div>
                        <Progress value={studyPlan.progress_percentage || 0} className="h-2" />
                      </div>
                    </div>
                    {isStudent && (
                      <Button 
                        className="w-full" 
                        onClick={() => handleTaskToggle(nextTask.id, false)}
                        style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}
                      >
                        Mark as Complete
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Info Card */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-serif">Study Plan Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subject</span>
                  <span className="font-medium">{studyPlan.subject}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Difficulty</span>
                  <span className="font-medium capitalize">{studyPlan.difficulty_level}</span>
                </div>
                {studyPlan.time_commitment && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time Commitment</span>
                    <span className="font-medium">{studyPlan.time_commitment}</span>
                  </div>
                )}
                {studyPlan.duration_weeks && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{studyPlan.duration_weeks} weeks</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Modules</span>
                  <span className="font-medium">{studyPlan.modules?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Tasks</span>
                  <span className="font-medium">{studyPlan.stats?.totalTasks || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Accept Study Plan Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Accept Study Plan & Add Modules</DialogTitle>
            <DialogDescription>
              Create modules and tasks for this study plan. The plan will be activated once you accept.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {modules.map((module, moduleIndex) => (
              <Card key={moduleIndex} className="bg-gray-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Module {moduleIndex + 1}</CardTitle>
                    {modules.length > 1 && (
                      <Button
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
            
            <Button
              type="button"
              variant="outline"
              onClick={addModule}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog(false)}
              disabled={accepting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptStudyPlan}
              disabled={accepting || modules.every(m => !m.title.trim() || !m.tasks.some(t => t.title.trim()))}
              style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept & Create Plan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
