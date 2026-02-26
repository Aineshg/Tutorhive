"use client";

import { useState, useEffect } from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { Loader2, Mail, Calendar, BookOpen, Clock, Trophy, Target, Edit, Star, Users, DollarSign, TrendingUp, Award, CheckCircle, AlertCircle, XCircle, MoreVertical } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/profile/stats');
        const data = await response.json();
        
        if (data.success) {
          setProfileData(data.data);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfileData();
    }
  }, [user?.id]);

  if (userLoading || loading || !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
      </div>
    );
  }

  const { user: userInfo, profile, stats, studentStats, tutorStats, subjectPerformance, progressOverTime, recentSessions, achievements } = profileData;
  const isTutor = userInfo.role === 'tutor';
  const isStudent = userInfo.role === 'student';

  // Format join date
  const joinDate = new Date(userInfo.created_at).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Get bio from profile
  const bio = (isStudent && profile.student?.bio) || (isTutor && profile.tutor?.bio) || "No bio available";

  // Get subjects
  const subjects = (isStudent && profile.student?.subjects) || (isTutor && profile.tutor?.subjects) || [];

  // Get timezone
  const timezone = (isStudent && profile.student?.timezone) || "Not set";

  // Get level
  const level = (isStudent && profile.student?.level) || null;

  // Format session status
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'outline', icon: Clock, label: 'Pending', color: 'text-yellow-600' },
      confirmed: { variant: 'default', icon: CheckCircle, label: 'Confirmed', color: 'text-blue-600' },
      completed: { variant: 'default', icon: CheckCircle, label: 'Completed', color: 'text-green-600' },
      cancelled: { variant: 'destructive', icon: XCircle, label: 'Cancelled', color: 'text-red-600' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* Left Column: Profile & Stats */}
          <div className="flex-1 lg:flex-none lg:w-80 space-y-6 mb-6 lg:mb-0">
            {/* Profile Card */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={userInfo.avatar_url || "/placeholder.svg"}
                      alt={userInfo.name}
                    />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {userInfo.name
                        ? userInfo.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl font-serif">
                  {userInfo.name}
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="capitalize">
                    {userInfo.role}
                  </Badge>
                  {level && (
                    <Badge variant="outline">{level}</Badge>
                  )}
                  {isTutor && tutorStats?.isVerified && (
                    <Badge variant="default" className="bg-green-500">
                      ✓ Verified
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{userInfo.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {joinDate}</span>
                </div>
                {timezone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{timezone}</span>
                  </div>
                )}
                <Separator />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {bio}
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  asChild
                >
                  <Link href="/settings">
                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-serif">
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                    <span className="text-sm">Total Sessions</span>
                  </div>
                  <span className="font-semibold">
                    {stats.totalSessions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                    <span className="text-sm">Hours {isStudent ? 'Studied' : 'Taught'}</span>
                  </div>
                  <span className="font-semibold">
                    {stats.hoursStudied}h
                  </span>
                </div>
                {isStudent && studentStats?.currentStreak > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                      <span className="text-sm">Current Streak</span>
                    </div>
                    <span className="font-semibold">
                      {studentStats.currentStreak} days
                    </span>
                  </div>
                )}
                {isTutor && tutorStats && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                        <span className="text-sm">Total Students</span>
                      </div>
                      <span className="font-semibold">
                        {tutorStats.totalStudents}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                        <span className="text-sm">Rating</span>
                      </div>
                      <span className="font-semibold">
                        {tutorStats.averageRating.toFixed(1)} ⭐
                      </span>
                    </div>
                    {tutorStats.totalEarnings > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                          <span className="text-sm">Total Earnings</span>
                        </div>
                        <span className="font-semibold">
                          ${tutorStats.totalEarnings.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {stats.averageRating > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                      <span className="text-sm">Avg Rating</span>
                    </div>
                    <span className="font-semibold">
                      {stats.averageRating.toFixed(1)} ⭐
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                    <span className="text-sm">Connections</span>
                  </div>
                  <span className="font-semibold">
                    {stats.connectionCount}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Subjects */}
            {subjects.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-serif">
                    {isStudent ? 'Subjects' : 'Teaching Subjects'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <Badge key={subject} variant="outline">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            {achievements.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Award className="h-5 w-5" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Tabs with Content */}
          <div className="flex-1 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Session Statistics */}
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-serif">Session Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-blue-50">
                        <div className="text-2xl font-bold text-blue-600">{stats.completedSessions}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-yellow-50">
                        <div className="text-2xl font-bold text-yellow-600">{stats.pendingSessions}</div>
                        <div className="text-sm text-muted-foreground">Pending</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-green-50">
                        <div className="text-2xl font-bold text-green-600">{stats.confirmedSessions}</div>
                        <div className="text-sm text-muted-foreground">Confirmed</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-red-50">
                        <div className="text-2xl font-bold text-red-600">{stats.cancelledSessions}</div>
                        <div className="text-sm text-muted-foreground">Cancelled</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Student Specific Info */}
                {isStudent && studentStats && (
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif">Student Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {studentStats.semester && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Semester</span>
                          <span className="font-medium">{studentStats.semester}</span>
                        </div>
                      )}
                      {studentStats.gpa && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">GPA</span>
                          <span className="font-medium">{studentStats.gpa.toFixed(2)}</span>
                        </div>
                      )}
                      {studentStats.progressScore > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Progress Score</span>
                          <span className="font-medium">{studentStats.progressScore}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Preferred Language</span>
                        <span className="font-medium capitalize">{studentStats.preferredLanguage}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tutor Specific Info */}
                {isTutor && tutorStats && (
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif">Tutor Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {profile.tutor?.experience && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Experience</span>
                          <span className="font-medium">{profile.tutor.experience}</span>
                        </div>
                      )}
                      {profile.tutor?.semester && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Semester</span>
                          <span className="font-medium">{profile.tutor.semester}</span>
                        </div>
                      )}
                      {tutorStats.hourlyRate > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Hourly Rate</span>
                          <span className="font-medium">${tutorStats.hourlyRate.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Reviews</span>
                        <span className="font-medium">{tutorStats.totalReviews}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Sessions Taught</span>
                        <span className="font-medium">{tutorStats.totalSessionsTaught}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Sessions Tab */}
              <TabsContent value="sessions" className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-serif">Recent Sessions</CardTitle>
                    <CardDescription>Your most recent tutoring sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentSessions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No sessions yet</p>
                        {isStudent && (
                          <Button className="mt-4" asChild style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}>
                            <Link href="/sessions/book">Book Your First Session</Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentSessions.map((session) => (
                          <Link key={session.id} href={`/sessions/${session.id}`}>
                            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{session.subject}</h4>
                                    {getStatusBadge(session.status)}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{session.topic}</p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(session.session_date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {session.duration} min
                                    </div>
                                    {session.rating && (
                                      <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        {session.rating.toFixed(1)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {session.otherUser && (
                                  <div className="flex flex-col items-end gap-2">
                                    <span className="text-sm font-medium text-right max-w-[120px] truncate">
                                      {session.otherUser.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                        <div className="text-center pt-4">
                          <Button variant="outline" asChild>
                            <Link href="/sessions">View All Sessions</Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                {/* Subject Performance Chart */}
                {subjectPerformance.length > 0 && (
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <Target className="h-5 w-5" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                        Subject Performance
                      </CardTitle>
                      <CardDescription>
                        Your performance across different subjects (based on session ratings)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="w-full h-[400px] p-4 overflow-hidden">
                      <ChartContainer
                        config={{
                          score: {
                            label: "Performance Score",
                            color: "oklch(0.395 0.055 200.975)",
                          },
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart
                            data={subjectPerformance}
                            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                          >
                            <PolarGrid gridType="polygon" />
                            <PolarAngleAxis
                              dataKey="subject"
                              tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                            />
                            <PolarRadiusAxis
                              angle={90}
                              domain={[0, 100]}
                              tick={{
                                fontSize: 10,
                                fill: "hsl(var(--muted-foreground))",
                              }}
                            />
                            <Radar
                              name="Performance"
                              dataKey="score"
                              stroke="oklch(0.395 0.055 200.975)"
                              fill="oklch(0.395 0.055 200.975)"
                              fillOpacity={0.3}
                              strokeWidth={2}
                              dot={{
                                fill: "oklch(0.395 0.055 200.975)",
                                strokeWidth: 2,
                                r: 4,
                              }}
                            />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(label) => `Subject: ${label}`}
                        formatter={(value) => [`${value}%`, "Score"]}
                      />
                          </RadarChart>
                        </ResponsiveContainer>
                      </ChartContainer>

                      {/* Performance Summary */}
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {subjectPerformance.map((item) => (
                          <div key={item.subject} className="text-center">
                            <div className="text-2xl font-bold mb-1" style={{ color: 'oklch(0.395 0.055 200.975)' }}>
                              {item.score}%
                            </div>
                            <div className="text-xs text-muted-foreground">{item.subject}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.sessions} session{item.sessions !== 1 ? 's' : ''}
                            </div>
                            {item.averageRating > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Avg rating {item.averageRating.toFixed(1)} ⭐
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Progress Over Time */}
                {progressOverTime.length > 0 && (
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-serif flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                        Progress Over Time
                      </CardTitle>
                      <CardDescription>
                        Number of completed sessions per month
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <ChartContainer
                        config={{
                          sessions: {
                            label: "Sessions",
                            color: "oklch(0.395 0.055 200.975)",
                          },
                        }}
                      >
                        <div className="w-full h-[260px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={progressOverTime} margin={{ top: 10, right: 20, bottom: 50, left: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="label" 
                                tick={{ fontSize: 11 }}
                                angle={-20}
                                textAnchor="end"
                              />
                              <YAxis allowDecimals={false} width={30} />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="sessions"
                                stroke="oklch(0.395 0.055 200.975)"
                                strokeWidth={2}
                                dot={{ fill: "oklch(0.395 0.055 200.975)", r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}

                {subjectPerformance.length === 0 && progressOverTime.length === 0 && (
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No performance data available yet</p>
                      <p className="text-sm mt-2">Complete some sessions to see your performance metrics</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-serif">Recent Activity</CardTitle>
                    <CardDescription>Your recent tutoring activity and milestones</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentSessions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent activity</p>
                      </div>
                    ) : (
                      <>
                        {recentSessions.slice(0, 10).map((session) => (
                          <div key={session.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                            <div className={`h-2 w-2 rounded-full ${
                              session.status === 'completed' ? 'bg-green-500' :
                              session.status === 'confirmed' ? 'bg-blue-500' :
                              session.status === 'pending' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {session.status === 'completed' && `Completed ${session.subject} session`}
                                {session.status === 'confirmed' && `Confirmed ${session.subject} session`}
                                {session.status === 'pending' && `Pending ${session.subject} session request`}
                                {session.status === 'cancelled' && `Cancelled ${session.subject} session`}
                                {session.otherUser && ` ${isStudent ? 'with' : 'with student'} ${session.otherUser.name}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatRelativeTime(session.session_date)}
                                {session.rating && ` • Rated ${session.rating.toFixed(1)} ⭐`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
