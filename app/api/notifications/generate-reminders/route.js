import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// This endpoint generates session reminder notifications
// Should be called periodically (e.g., via cron job or scheduled task)
export async function POST(request) {
  try {
    // Check for admin/secret key to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const secretKey = process.env.REMINDER_SECRET_KEY || 'default-secret-key'
    
    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    // Find sessions happening tomorrow (24 hours before)
    const sessionsTomorrow = await prisma.session.findMany({
      where: {
        status: 'confirmed',
        session_date: {
          gte: tomorrow,
          lt: dayAfterTomorrow
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        },
        tutor: {
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

    const notificationsCreated = []

    for (const session of sessionsTomorrow) {
      // Create reminder for student
      const existingStudentReminder = await prisma.notification.findFirst({
        where: {
          user_id: session.student_id,
          session_id: session.id,
          type: 'session_reminder',
          created_at: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })

      if (!existingStudentReminder) {
        const studentNotification = await prisma.notification.create({
          data: {
            user_id: session.student_id,
            type: 'session_reminder',
            title: 'Session Reminder',
            message: `You have a ${session.subject} session tomorrow at ${session.start_time} with ${session.tutor.user.name}.`,
            session_id: session.id,
            link: `/sessions/${session.id}`
          }
        })
        notificationsCreated.push(studentNotification)
      }

      // Create reminder for tutor
      const existingTutorReminder = await prisma.notification.findFirst({
        where: {
          user_id: session.tutor.user_id,
          session_id: session.id,
          type: 'session_reminder',
          created_at: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })

      if (!existingTutorReminder) {
        const tutorNotification = await prisma.notification.create({
          data: {
            user_id: session.tutor.user_id,
            type: 'session_reminder',
            title: 'Session Reminder',
            message: `You have a ${session.subject} session tomorrow at ${session.start_time} with ${session.student.name}.`,
            session_id: session.id,
            link: `/sessions/${session.id}`
          }
        })
        notificationsCreated.push(tutorNotification)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${notificationsCreated.length} reminder notifications`,
      data: { notificationsCreated: notificationsCreated.length }
    })
  } catch (error) {
    console.error('Generate reminders error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

