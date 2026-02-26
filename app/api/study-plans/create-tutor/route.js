import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

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

    if (userRole !== 'tutor') {
      return NextResponse.json(
        { success: false, message: 'Only tutors can create study plans directly' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { student_id, title, subject, difficulty_level, duration_weeks, time_commitment, learning_goals, modules } = body

    if (!student_id || !title || !subject || !difficulty_level) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: student_id },
      include: {
        student: true
      }
    })

    if (!student || !student.student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      )
    }

    // Get tutor record
    const tutor = await prisma.tutor.findUnique({
      where: { user_id: userId }
    })

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: 'Tutor profile not found' },
        { status: 404 }
      )
    }

    // Create study plan with status 'active' (tutor is creating it directly)
    const studyPlan = await prisma.studyPlan.create({
      data: {
        student_id: student_id,
        tutor_id: tutor.id,
        title,
        description: learning_goals,
        subject,
        difficulty_level,
        duration_weeks: duration_weeks ? parseInt(duration_weeks) : null,
        time_commitment,
        learning_goals,
        status: 'active',
        started_at: new Date()
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

    // Create modules and tasks if provided
    if (modules && Array.isArray(modules) && modules.length > 0) {
      for (let i = 0; i < modules.length; i++) {
        const moduleData = modules[i]
        // Only create modules with titles
        if (!moduleData.title || !moduleData.title.trim()) continue
        
        await prisma.module.create({
          data: {
            study_plan_id: studyPlan.id,
            title: moduleData.title,
            description: moduleData.description || null,
            week_number: moduleData.week_number || null,
            order_index: i,
            tasks: {
              create: (moduleData.tasks || [])
                .filter(task => task.title && task.title.trim())
                .map((taskData, index) => ({
                  title: taskData.title,
                  description: taskData.description || null,
                  task_type: taskData.task_type || 'reading',
                  status: 'pending',
                  order_index: index
                }))
            }
          }
        })
      }
    }

    // Create notification for student
    try {
      const tutorUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      })
      
      await prisma.notification.create({
        data: {
          user_id: student_id,
          type: 'session_confirmed', // Reusing notification type
          title: 'New Study Plan Created',
          message: `${tutorUser?.name || 'Your tutor'} has created a new study plan for you: ${title}`,
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
    console.error('Create tutor study plan error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

