import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if Prisma models are available
    if (!prisma || !prisma.user || !prisma.session) {
      console.error('Prisma models not available')
      return NextResponse.json(
        { success: false, message: 'Database models not available' },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value
    const userRole = cookieStore.get('user-role')?.value || 'student'

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Fetch user with student and tutor profiles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        tutor: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const isStudent = userRole === 'student' || !!user.student
    const isTutor = userRole === 'tutor' || !!user.tutor

    // Build where clause for sessions
    let sessionWhere = {}
    if (isStudent) {
      sessionWhere.student_id = userId
    } else if (isTutor && user.tutor?.id) {
      sessionWhere.tutor_id = user.tutor.id
    }

    // If no valid session where clause, return empty stats
    if (Object.keys(sessionWhere).length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: userRole,
            avatar_url: user.avatar_url,
            created_at: user.created_at,
            last_active_at: user.last_active_at
          },
          profile: {
            student: user.student,
            tutor: user.tutor
          },
          stats: {
            totalSessions: 0,
            completedSessions: 0,
            pendingSessions: 0,
            confirmedSessions: 0,
            cancelledSessions: 0,
            hoursStudied: 0,
            averageRating: 0,
            connectionCount: 0
          },
          studentStats: isStudent && user.student ? {
            semester: user.student.semester || null,
            gpa: user.student.gpa || null,
            studyHours: user.student.study_hours || 0,
            progressScore: user.student.progress_score || 0,
            currentStreak: user.student.current_streak || 0,
            level: user.student.level || null,
            preferredLanguage: user.student.preferred_language || 'english'
          } : null,
          tutorStats: isTutor && user.tutor ? {
            totalStudents: 0,
            totalSessionsTaught: 0,
            averageRating: user.tutor.rating || 0,
            totalReviews: user.tutor.total_reviews || 0,
            totalEarnings: 0,
            hourlyRate: user.tutor.hourly_rate || 0,
            isVerified: user.tutor.is_verified || false
          } : null,
          subjectPerformance: [],
          progressOverTime: [],
          recentSessions: [],
          achievements: []
        }
      })
    }

    // Get session statistics
    let sessionStats = []
    try {
      sessionStats = await prisma.session.groupBy({
        by: ['status'],
        where: sessionWhere,
        _count: {
          id: true
        }
      })
    } catch (error) {
      console.error('Error fetching session stats:', error)
      sessionStats = []
    }

    // Get completed sessions for hours calculation
    const performanceWindowStart = new Date()
    performanceWindowStart.setMonth(performanceWindowStart.getMonth() - 6)

    let completedSessions = []
    try {
      const completedSessionsQuery = {
        where: {
          status: 'completed',
          session_date: {
            gte: performanceWindowStart
          },
          ...sessionWhere
        },
        select: {
          duration: true,
          subject: true,
          rating: true,
          session_date: true,
        },
        orderBy: {
          session_date: 'desc'
        }
      }

      completedSessions = await prisma.session.findMany(completedSessionsQuery)
    } catch (error) {
      console.error('Error fetching completed sessions:', error)
      completedSessions = []
    }

    // Calculate statistics
    const totalSessions = sessionStats.reduce((sum, stat) => sum + stat._count.id, 0)
    const hoursStudied = completedSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
    const averageRating = completedSessions.length > 0
      ? completedSessions.reduce((sum, session) => sum + (session.rating || 0), 0) / completedSessions.length
      : 0

    // Get recent sessions (last 10)
    let recentSessions = []
    try {
      const recentSessionsQuery = {
        where: sessionWhere,
        include: {},
        orderBy: {
          session_date: 'desc'
        },
        take: 10
      }

      if (isStudent) {
        recentSessionsQuery.include.tutor = {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar_url: true
              }
            }
          }
        }
      } else if (isTutor) {
        recentSessionsQuery.include.student = {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar_url: true
              }
            }
          }
        }
      }

      recentSessions = await prisma.session.findMany(recentSessionsQuery)
    } catch (error) {
      console.error('Error fetching recent sessions:', error)
      recentSessions = []
    }

    // Get subject performance (for students)
    const subjectPerformance = completedSessions.reduce((acc, session) => {
      if (!session.subject) return acc
      if (!acc[session.subject]) {
        acc[session.subject] = { count: 0, totalRating: 0, hours: 0 }
      }
      acc[session.subject].count++
      acc[session.subject].totalRating += session.rating || 0
      acc[session.subject].hours += (session.duration || 0) / 60
      return acc
    }, {})

    const maxSubjectSessions = Object.values(subjectPerformance).reduce((max, data) => Math.max(max, data.count), 0) || 1

    // Convert to array format for chart
    const subjectPerformanceArray = Object.entries(subjectPerformance)
      .map(([subject, data]) => {
        const averageRating = data.count > 0 ? data.totalRating / data.count : 0
        const ratingScore = averageRating > 0 ? Math.round(averageRating * 20) : 0
        const participationScore = Math.round((data.count / maxSubjectSessions) * 100)
        const score = ratingScore > 0 ? ratingScore : participationScore

        return {
          subject,
          score: Math.min(score, 100),
          fullMark: 100,
          sessions: data.count,
          hours: Math.round(data.hours * 10) / 10,
          averageRating: Math.round(averageRating * 10) / 10
        }
      })
      .sort((a, b) => b.score - a.score)

    // Get progress over time (sessions per month)
    const progressOverTime = completedSessions.reduce((acc, session) => {
      const date = new Date(session.session_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[monthKey]) {
        acc[monthKey] = 0
      }
      acc[monthKey]++
      return acc
    }, {})

    const progressMonths = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      d.setDate(1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      progressMonths.push({ key, date: d })
    }

    const progressOverTimeArray = progressMonths.map(({ key, date }) => ({
      month: key,
      label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
      sessions: progressOverTime[key] || 0
    }))

    // Get connection count
    let connectionCount = 0
    try {
      connectionCount = await prisma.connection.count({
        where: {
          status: 'accepted',
          OR: [
            { requester_id: userId },
            { receiver_id: userId }
          ]
        }
      })
    } catch (error) {
      console.error('Error fetching connection count:', error)
      connectionCount = 0
    }

    // Calculate achievements
    const achievements = []
    if (totalSessions >= 1) achievements.push({ id: 'first_session', name: 'First Session', description: 'Completed your first session', icon: '🎯' })
    if (totalSessions >= 10) achievements.push({ id: 'ten_sessions', name: 'Dedicated Learner', description: 'Completed 10 sessions', icon: '📚' })
    if (totalSessions >= 50) achievements.push({ id: 'fifty_sessions', name: 'Expert Learner', description: 'Completed 50 sessions', icon: '🏆' })
    if (user.student?.current_streak >= 7) achievements.push({ id: 'week_streak', name: 'Week Warrior', description: '7-day study streak', icon: '🔥' })
    if (user.student?.current_streak >= 30) achievements.push({ id: 'month_streak', name: 'Month Master', description: '30-day study streak', icon: '💪' })
    if (averageRating >= 4.5 && completedSessions.length >= 5) achievements.push({ id: 'high_rated', name: 'Top Performer', description: 'Average rating of 4.5+', icon: '⭐' })

    // Tutor-specific stats
    let tutorStats = null
    if (isTutor && user.tutor) {
      try {
        const tutorSessions = await prisma.session.findMany({
          where: {
            tutor_id: user.tutor.id,
            status: 'completed'
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        })

        const uniqueStudents = new Set(tutorSessions.map(s => s.student_id))
        const totalEarnings = tutorSessions.reduce((sum, session) => {
          const hours = (session.duration || 0) / 60
          const rate = user.tutor.hourly_rate || 0
          return sum + (hours * rate)
        }, 0)

        tutorStats = {
          totalStudents: uniqueStudents.size,
          totalSessionsTaught: tutorSessions.length,
          averageRating: user.tutor.rating || 0,
          totalReviews: user.tutor.total_reviews || 0,
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          hourlyRate: user.tutor.hourly_rate || 0,
          isVerified: user.tutor.is_verified || false
        }
      } catch (error) {
        console.error('Error fetching tutor stats:', error)
        tutorStats = {
          totalStudents: 0,
          totalSessionsTaught: 0,
          averageRating: user.tutor.rating || 0,
          totalReviews: user.tutor.total_reviews || 0,
          totalEarnings: 0,
          hourlyRate: user.tutor.hourly_rate || 0,
          isVerified: user.tutor.is_verified || false
        }
      }
    }

    // Student-specific stats
    let studentStats = null
    if (isStudent && user.student) {
      studentStats = {
        semester: user.student.semester || null,
        gpa: user.student.gpa || null,
        studyHours: user.student.study_hours || 0,
        progressScore: user.student.progress_score || 0,
        currentStreak: user.student.current_streak || 0,
        level: user.student.level || null,
        preferredLanguage: user.student.preferred_language || 'english'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: userRole,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          last_active_at: user.last_active_at
        },
        profile: {
          student: user.student,
          tutor: user.tutor
        },
        stats: {
          totalSessions,
          completedSessions: sessionStats.find(s => s.status === 'completed')?._count.id || 0,
          pendingSessions: sessionStats.find(s => s.status === 'pending')?._count.id || 0,
          confirmedSessions: sessionStats.find(s => s.status === 'confirmed')?._count.id || 0,
          cancelledSessions: sessionStats.find(s => s.status === 'cancelled')?._count.id || 0,
          hoursStudied: Math.round(hoursStudied * 10) / 10,
          averageRating: Math.round(averageRating * 10) / 10,
          connectionCount
        },
        studentStats,
        tutorStats,
        subjectPerformance: subjectPerformanceArray,
        progressOverTime: progressOverTimeArray,
        recentSessions: recentSessions.map(session => {
          const otherUser = isStudent 
            ? (session.tutor?.user ? {
                id: session.tutor.user.id,
                name: session.tutor.user.name,
                avatar_url: session.tutor.user.avatar_url
              } : null)
            : (session.student?.user ? {
                id: session.student.user.id,
                name: session.student.user.name,
                avatar_url: session.student.user.avatar_url
              } : null)

          return {
            id: session.id,
            subject: session.subject,
            topic: session.topic,
            status: session.status,
            session_date: session.session_date,
            duration: session.duration,
            rating: session.rating,
            otherUser
          }
        }),
        achievements
      }
    })
  } catch (error) {
    console.error('Get profile stats error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

