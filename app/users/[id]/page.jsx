"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Loader2, Mail, Calendar, BookOpen, Clock, Trophy, Star, Users, ArrowLeft, MessageCircle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import Link from "next/link";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id;
  const { user: currentUser } = useUser();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        
        if (data.success) {
          setUserData(data.data);
        } else {
          setError(data.message || 'User not found');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">{error || 'User not found'}</p>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { user, profile } = userData;
  const isTutor = !!profile.tutor;
  const isStudent = !!profile.student;

  // Format join date
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Get bio
  const bio = (isStudent && profile.student?.bio) || (isTutor && profile.tutor?.bio) || "No bio available";

  // Get subjects
  const subjects = (isStudent && profile.student?.subjects) || (isTutor && profile.tutor?.subjects) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <DashboardNav />

      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.name}
                  />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {user.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl font-serif">
                {user.name}
              </CardTitle>
              <CardDescription className="flex items-center justify-center gap-2 flex-wrap mt-2">
                <Badge variant="secondary" className="capitalize">
                  {isTutor ? 'Tutor' : isStudent ? 'Student' : 'User'}
                </Badge>
                {isTutor && profile.tutor?.is_verified && (
                  <Badge variant="default" className="bg-green-500">
                    ✓ Verified
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {joinDate}</span>
              </div>
              {profile.student?.timezone && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.student.timezone}</span>
                </div>
              )}
              <Separator />
              <p className="text-sm text-muted-foreground leading-relaxed">
                {bio}
              </p>

              {subjects.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      {isTutor ? 'Teaching Subjects' : 'Subjects'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((subject) => (
                        <Badge key={subject} variant="outline">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {isTutor && profile.tutor && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {profile.tutor.rating && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Star className="h-4 w-4" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                          <span>Rating</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">
                          {profile.tutor.rating.toFixed(1)} ⭐
                        </p>
                      </div>
                    )}
                    {profile.tutor.hourly_rate && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Trophy className="h-4 w-4" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                          <span>Hourly Rate</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">
                          ${profile.tutor.hourly_rate.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {profile.tutor.experience && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                          <span>Experience</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">
                          {profile.tutor.experience}
                        </p>
                      </div>
                    )}
                    {profile.tutor.total_reviews > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" style={{ color: 'oklch(0.395 0.055 200.975)' }} />
                          <span>Reviews</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">
                          {profile.tutor.total_reviews}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {currentUser && currentUser.id !== user.id && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <Button
                      asChild
                      className="flex-1"
                      style={{ backgroundColor: 'oklch(0.395 0.055 200.975)', color: 'white' }}
                    >
                      <Link href={`/inbox?userId=${user.id}`}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

