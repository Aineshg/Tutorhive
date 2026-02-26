import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    if (!prisma || !prisma.studyPlan) {
      return NextResponse.json(
        { success: false, message: 'Database models not available' },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id: studyPlanId } = await params

    const studyPlan = await prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
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
            tasks: {
              include: {
                progress: {
                  where: {
                    student_id: userId
                  }
                }
              },
              orderBy: {
                order_index: 'asc'
              }
            }
          },
          orderBy: {
            order_index: 'asc'
          }
        },
        resources: {
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    })

    if (!studyPlan) {
      return NextResponse.json(
        { success: false, message: 'Study plan not found' },
        { status: 404 }
      )
    }

    // Check if user has access
    // Get tutor's user_id to check access
    const tutorRecord = await prisma.tutor.findUnique({
      where: { id: studyPlan.tutor_id },
      select: { user_id: true }
    })
    
    if (studyPlan.student_id !== userId && tutorRecord?.user_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Calculate progress
    const totalTasks = studyPlan.modules.reduce((sum, module) => sum + module.tasks.length, 0)
    const completedTasks = studyPlan.modules.reduce((sum, module) => 
      sum + module.tasks.filter(task => 
        task.progress.length > 0 || task.status === 'completed'
      ).length, 0
    )

    // Format tasks with completion status
    const modulesWithTasks = studyPlan.modules.map(module => ({
      id: module.id,
      title: module.title,
      description: module.description,
      week_number: module.week_number,
      order_index: module.order_index,
      start_date: module.start_date,
      end_date: module.end_date,
      tasks: module.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        task_type: task.task_type,
        status: task.progress.length > 0 ? 'completed' : task.status,
        order_index: task.order_index,
        due_date: task.due_date,
        completed_at: task.progress.length > 0 ? task.progress[0].completed_at : task.completed_at,
        isCompleted: task.progress.length > 0
      }))
    }))

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
          duration_weeks: studyPlan.duration_weeks,
          time_commitment: studyPlan.time_commitment,
          learning_goals: studyPlan.learning_goals,
          progress_percentage: studyPlan.progress_percentage,
          created_at: studyPlan.created_at,
          started_at: studyPlan.started_at,
          completed_at: studyPlan.completed_at,
          tutor: {
            id: studyPlan.tutor.user.id,
            name: studyPlan.tutor.user.name,
            avatar_url: studyPlan.tutor.user.avatar_url
          },
          student: {
            id: studyPlan.student.id,
            name: studyPlan.student.name,
            avatar_url: studyPlan.student.avatar_url
          },
          modules: modulesWithTasks,
          resources: studyPlan.resources,
          stats: {
            totalTasks,
            completedTasks,
            totalModules: studyPlan.modules.length
          }
        }
      }
    })
  } catch (error) {
    console.error('Get study plan error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
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

    const { id: studyPlanId } = await params
    const body = await request.json()

    // Get study plan
    const studyPlan = await prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
      include: {
        tutor: {
          select: {
            user_id: true
          }
        }
      }
    })

    if (!studyPlan) {
      return NextResponse.json(
        { success: false, message: 'Study plan not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (userRole === 'tutor' && studyPlan.tutor.user_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    if (userRole === 'student' && studyPlan.student_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    // Update study plan
    const updatedPlan = await prisma.studyPlan.update({
      where: { id: studyPlanId },
      data: body,
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

    return NextResponse.json({
      success: true,
      data: { studyPlan: updatedPlan }
    })
  } catch (error) {
    console.error('Update study plan error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

