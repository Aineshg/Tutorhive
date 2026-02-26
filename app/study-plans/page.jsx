"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  BookOpen,
  Star,
  TrendingUp,
  Users,
  CheckCircle,
  Plus,
  Eye,
  Share,
  Clock,
  Loader2
} from "lucide-react";
import { DashboardNav } from "@/components/dashboard-nav";
import { useUser } from "@/hooks/use-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudyPlansPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const isTutor = user?.role === 'tutor';
  const [studyPlans, setStudyPlans] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeTab, setActiveTab] = useState(isTutor ? "requests" : "plans");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || "all");

  // Update filter from URL params on mount
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setFilterStatus(statusParam);
      if (isTutor && statusParam === 'pending') {
        setActiveTab('requests');
      }
    }
  }, [searchParams, isTutor]);

  useEffect(() => {
    if (activeTab === 'plans') {
      fetchStudyPlans();
    } else if (activeTab === 'requests' && isTutor) {
      fetchPendingRequests();
    }
  }, [filterStatus, filterSubject, activeTab, isTutor]);

  const fetchPendingRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await fetch('/api/study-plans?status=pending');
      const data = await response.json();
      
      if (data.success) {
        setPendingRequests(data.data.studyPlans || []);
      } else {
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      setPendingRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchStudyPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // For students, if they want to see pending, explicitly pass it
      // Otherwise, the API will exclude pending by default
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterSubject !== 'all') {
        params.append('subject', filterSubject);
      }
      
      const response = await fetch(`/api/study-plans?${params.toString()}`);
      const data = await response.json();
      
      console.log('Study plans API response:', data);
      
      if (data.success) {
        console.log('Study plans received:', data.data?.studyPlans?.length || 0);
        setStudyPlans(data.data.studyPlans || []);
      } else {
        console.error('Failed to fetch study plans:', data.message);
        setStudyPlans([]);
      }
    } catch (error) {
      console.error('Error fetching study plans:', error);
      setStudyPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const subjects = ["Mathematics", "Physics", "Chemistry", "Computer Science", "Biology"];
  const statuses = ["active", "completed", "paused", "pending"];

  const filteredPlans = studyPlans.filter(plan => {
    const matchesSearch = plan.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "pending": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
      case "easy": return "bg-green-100 text-green-800";
      case "intermediate":
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "advanced":
      case "hard": return "bg-orange-100 text-orange-800";
      case "expert": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Study Plans</h1>
              <p className="text-muted-foreground">Your personalized learning journeys</p>
            </div>
            <Button asChild style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}>
              <Link href={isTutor ? "/study-plans/create-tutor" : "/study-plans/create"}>
                <Plus className="h-4 w-4 mr-2" />
                {isTutor ? "Create Study Plan" : "Create New Plan"}
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs for Tutors */}
        {isTutor && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="requests">
                Requests
                {pendingRequests.length > 0 && (
                  <Badge className="ml-2 bg-orange-500">{pendingRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="plans">My Study Plans</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Search and Filter - Only show for plans tab */}
        {(!isTutor || activeTab === 'plans') && (
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search study plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value="all">All Subjects</option>
              {subjects.filter(s => s !== 'all').map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value="all">All Status</option>
              {statuses.filter(s => s !== 'all').map(status => (
                <option key={status} value={status} className="capitalize">{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        )}

        {/* Content based on active tab */}
        {isTutor && activeTab === 'requests' ? (
          <div>
            {loadingRequests ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                <p className="text-muted-foreground">Students haven't requested any study plans yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRequests.map((plan) => (
                  <Card key={plan.id} className="hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm border-orange-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{plan.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Student: {plan.student?.name || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{plan.subject}</Badge>
                        <Badge className="text-xs capitalize bg-orange-100 text-orange-800">
                          Pending
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {plan.learning_goals && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Learning Goals:</p>
                            <p className="text-sm line-clamp-2">{plan.learning_goals}</p>
                          </div>
                        )}
                        {plan.time_commitment && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{plan.time_commitment}</span>
                          </div>
                        )}
                      </div>

                      <Button className="w-full" size="sm" asChild style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}>
                        <Link href={`/study-plans/${plan.id}`}>
                          Review & Accept
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Study Plans Grid */}
            {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No study plans found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
            <Button asChild style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}>
              <Link href="/study-plans/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Study Plan
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{plan.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{plan.progress_percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all" 
                        style={{ 
                          width: `${plan.progress_percentage || 0}%`,
                          backgroundColor: 'oklch(0.395 0.055 200.975)'
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{plan.completedLessons || 0}/{plan.lessons || 0} lessons</span>
                      <span>{plan.modules || 0} modules</span>
                    </div>
                  </div>

                  {/* Tags and Status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{plan.subject}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{plan.difficulty_level}</Badge>
                    <Badge className={`text-xs capitalize ${getDifficultyColor(plan.difficulty_level)}`}>
                      {plan.difficulty_level}
                    </Badge>
                    <Badge className={`text-xs capitalize ${getStatusColor(plan.status)}`}>
                      {plan.status}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {plan.time_commitment && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{plan.time_commitment}</span>
                      </div>
                    )}
                    {plan.duration_weeks && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span>{plan.duration_weeks} weeks</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button className="flex-1" size="sm" asChild style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}>
                      <Link href={`/study-plans/${plan.id}`}>
                        {plan.status === "completed" ? "Review" : "Continue"}
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/study-plans/${plan.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
