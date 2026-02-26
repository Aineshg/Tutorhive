import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  try {
    if (!prisma || !prisma.task || !prisma.studyPlanProgress) {
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

    const { id: taskId } = await params
    const body = await request.json()
    const { completed } = body

    // Get task with study plan
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        module: {
          include: {
            study_plan: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { success: false, message: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if user is the student for this study plan
    if (task.module.study_plan.student_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Only the student can complete tasks' },
        { status: 403 }
      )
    }

    const studyPlanId = task.module.study_plan.id

    if (completed) {
      // Mark as completed
      await prisma.studyPlanProgress.upsert({
        where: {
          study_plan_id_task_id_student_id: {
            study_plan_id: studyPlanId,
            task_id: taskId,
            student_id: userId
          }
        },
        create: {
          study_plan_id: studyPlanId,
          task_id: taskId,
          student_id: userId,
          completed_at: new Date()
        },
        update: {
          completed_at: new Date()
        }
      })

      // Update task status
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          completed_at: new Date()
        }
      })
    } else {
      // Mark as incomplete
      await prisma.studyPlanProgress.deleteMany({
        where: {
          study_plan_id: studyPlanId,
          task_id: taskId,
          student_id: userId
        }
      })

      // Update task status
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'pending',
          completed_at: null
        }
      })
    }

    // Recalculate progress percentage
    const allTasks = await prisma.task.findMany({
      where: {
        module: {
          study_plan_id: studyPlanId
        }
      }
    })

    const completedTasksCount = await prisma.studyPlanProgress.count({
      where: {
        study_plan_id: studyPlanId,
        student_id: userId
      }
    })

    const progressPercentage = allTasks.length > 0
      ? Math.round((completedTasksCount / allTasks.length) * 100)
      : 0

    // Update study plan progress
    await prisma.studyPlan.update({
      where: { id: studyPlanId },
      data: {
        progress_percentage: progressPercentage,
        status: progressPercentage === 100 ? 'completed' : 
                progressPercentage > 0 ? 'active' : 'pending',
        completed_at: progressPercentage === 100 ? new Date() : null,
        started_at: progressPercentage > 0 && !task.module.study_plan.started_at 
          ? new Date() 
          : task.module.study_plan.started_at
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        completed,
        progressPercentage,
        completedTasks: completedTasksCount,
        totalTasks: allTasks.length
      }
    })
  } catch (error) {
    console.error('Toggle task completion error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

