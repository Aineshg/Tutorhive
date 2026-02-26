import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
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
        { success: false, message: 'Only tutors can accept study plans' },
        { status: 403 }
      )
    }

    const { id: studyPlanId } = await params
    const body = await request.json()
    const { modules } = body || {}

    // Get study plan
    const studyPlan = await prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
      include: {
        tutor: {
          select: {
            user_id: true
          }
        },
        student: {
          select: {
            id: true,
            name: true
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

    // Check if tutor owns this study plan
    // Get tutor's user_id to check access
    const tutorRecord = await prisma.tutor.findUnique({
      where: { id: studyPlan.tutor_id },
      select: { user_id: true }
    })
    
    if (!tutorRecord || tutorRecord.user_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    if (studyPlan.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Study plan is not pending' },
        { status: 400 }
      )
    }

    // Update study plan status
    const updatedPlan = await prisma.studyPlan.update({
      where: { id: studyPlanId },
      data: {
        status: 'active',
        started_at: new Date()
      }
    })

    // If modules are provided, create them
    if (modules && Array.isArray(modules) && modules.length > 0) {
      for (let i = 0; i < modules.length; i++) {
        const moduleData = modules[i]
        // Only create modules with titles
        if (!moduleData.title || !moduleData.title.trim()) continue
        
        await prisma.module.create({
          data: {
            study_plan_id: studyPlanId,
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
        where: { id: tutorRecord.user_id },
        select: { name: true }
      })
      
      await prisma.notification.create({
        data: {
          user_id: studyPlan.student.id,
          type: 'session_confirmed', // Reusing notification type
          title: 'Study Plan Accepted',
          message: `${tutorUser?.name || 'Your tutor'} has accepted and created your study plan: ${updatedPlan.title}`,
          link: `/study-plans/${studyPlanId}`
        }
      })
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      data: { studyPlan: updatedPlan }
    })
  } catch (error) {
    console.error('Accept study plan error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

