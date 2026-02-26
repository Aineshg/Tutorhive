import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    if (!prisma || !prisma.studyPlan) {
      return NextResponse.json(
        { success: false, message: 'Database models not available' },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value
    const userRole = cookieStore.get('user-role')?.value || 'student'

    if (!userId) {
      console.log('Study plans API: No user ID in cookies')
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('Study plans API: User ID:', userId, 'Role:', userRole)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const subject = searchParams.get('subject')
    const role = searchParams.get('role') || userRole

    // Build where clause
    const where = {}
    if (role === 'student') {
      where.student_id = userId
      console.log('Study plans API: Filtering by student_id:', userId)
      // For students, exclude pending study plans by default unless explicitly requested
      if (!status || status === 'all') {
        where.status = { not: 'pending' }
      } else if (status) {
        where.status = status
      }
    } else if (role === 'tutor') {
      // Get tutor id
      const tutor = await prisma.tutor.findUnique({
        where: { user_id: userId }
      })
      if (tutor) {
        where.tutor_id = tutor.id
      } else {
        return NextResponse.json({
          success: true,
          data: { studyPlans: [], total: 0 }
        })
      }
      // For tutors, include all statuses (they need to see pending requests)
      if (status && status !== 'all') {
        where.status = status
      }
    }

    if (subject && subject !== 'all') {
      where.subject = subject
    }

    console.log('Study plans API: Query where clause:', JSON.stringify(where))

    let studyPlans = []
    try {
      studyPlans = await prisma.studyPlan.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              avatar_url: true
            }
          },
          tutor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar_url: true
                }
              }
            }
          },
          modules: {
            include: {
              tasks: true
            },
            orderBy: {
              order_index: 'asc'
            }
          },
          _count: {
            select: {
              modules: true,
              progress: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      })
    } catch (queryError) {
      console.error('Error querying study plans:', queryError)
      throw queryError
    }

    console.log('Study plans API: Found', studyPlans.length, 'study plans')

    // Calculate total lessons and completed lessons
    const studyPlansWithStats = studyPlans.map(plan => {
      const totalTasks = plan.modules.reduce((sum, module) => sum + module.tasks.length, 0)
      const completedTasks = plan.modules.reduce((sum, module) => 
        sum + module.tasks.filter(task => task.status === 'completed').length, 0
      )

      return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        subject: plan.subject,
        difficulty_level: plan.difficulty_level,
        status: plan.status,
        duration_weeks: plan.duration_weeks,
        time_commitment: plan.time_commitment,
        progress_percentage: plan.progress_percentage,
        created_at: plan.created_at,
        started_at: plan.started_at,
        completed_at: plan.completed_at,
        tutor: {
          id: plan.tutor.user.id,
          name: plan.tutor.user.name,
          avatar_url: plan.tutor.user.avatar_url
        },
        student: {
          id: plan.student.id,
          name: plan.student.name,
          avatar_url: plan.student.avatar_url
        },
        modules: plan.modules.length,
        lessons: totalTasks,
        completedLessons: completedTasks,
        totalModules: plan._count.modules
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        studyPlans: studyPlansWithStats,
        total: studyPlansWithStats.length
      }
    })
  } catch (error) {
    console.error('Get study plans error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    if (!prisma || !prisma.studyPlan) {
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

    if (userRole !== 'student') {
      return NextResponse.json(
        { success: false, message: 'Only students can create study plan requests' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { tutor_id, title, subject, difficulty_level, duration_weeks, time_commitment, learning_goals } = body

    if (!tutor_id || !title || !subject || !difficulty_level) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify tutor exists
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutor_id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: 'Tutor not found' },
        { status: 404 }
      )
    }

    // Create study plan
    const studyPlan = await prisma.studyPlan.create({
      data: {
        student_id: userId,
        tutor_id: tutor_id,
        title,
        description: learning_goals,
        subject,
        difficulty_level,
        duration_weeks: duration_weeks ? parseInt(duration_weeks) : null,
        time_commitment,
        learning_goals,
        status: 'pending'
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        },
        tutor: {
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
    })

    // Create notification for tutor
    try {
      await prisma.notification.create({
        data: {
          user_id: tutor.user.id,
          type: 'session_request', // Reusing notification type
          title: 'New Study Plan Request',
          message: `${studyPlan.student.name} has requested a study plan: ${title}`,
          link: `/study-plans/${studyPlan.id}`
        }
      })
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      data: {
        studyPlan: {
          id: studyPlan.id,
          title: studyPlan.title,
          description: studyPlan.description,
          subject: studyPlan.subject,
          difficulty_level: studyPlan.difficulty_level,
          status: studyPlan.status,
          tutor: {
            id: studyPlan.tutor.user.id,
            name: studyPlan.tutor.user.name
          },
          student: {
            id: studyPlan.student.id,
            name: studyPlan.student.name
          }
        }
      }
    })
  } catch (error) {
    console.error('Create study plan error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

