import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value
    const userRole = cookieStore.get('user-role')?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sessionId = params.id
    const body = await request.json()
    const { session_date, start_time, end_time } = body

    if (!session_date || !start_time) {
      return NextResponse.json(
        { success: false, message: 'Session date and start time are required' },
        { status: 400 }
      )
    }

    // Get the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
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

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to reschedule
    let hasPermission = false
    if (session.student_id === userId) {
      hasPermission = true
    } else {
      const tutor = await prisma.tutor.findUnique({
        where: { user_id: userId }
      })
      
      if (tutor && session.tutor_id === tutor.id) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to reschedule this session' },
        { status: 403 }
      )
    }

    // Only confirmed or upcoming sessions can be rescheduled
    if (session.status !== 'confirmed' && session.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Only confirmed or pending sessions can be rescheduled' },
        { status: 400 }
      )
    }

    // Parse new session date
    const newSessionDate = new Date(session_date)
    if (isNaN(newSessionDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid session date' },
        { status: 400 }
      )
    }

    // Store original date/time for rescheduled_from
    const originalDateTime = `${session.session_date.toISOString().split('T')[0]} ${session.start_time}`

    // Update the session
    // Keep the status as 'confirmed' if rescheduling a confirmed session, 
    // so it shows in upcoming instead of requests
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        session_date: newSessionDate,
        start_time,
        end_time: end_time || session.end_time,
        rescheduled_from: originalDateTime,
        status: session.status === 'confirmed' ? 'confirmed' : 'pending' // Keep confirmed status if already confirmed
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
          }
        },
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true
              }
            }
          }
        }
      }
    })

    // Create notifications for both student and tutor
    let reschedulerName = 'User'
    if (userRole === 'tutor') {
      reschedulerName = session.tutor?.user?.name || 'Tutor'
    } else {
      reschedulerName = session.student?.name || 'Student'
      // If student name not loaded, fetch it
      if (reschedulerName === 'Student') {
        const studentUser = await prisma.user.findUnique({ 
          where: { id: session.student_id }, 
          select: { name: true } 
        })
        reschedulerName = studentUser?.name || 'Student'
      }
    }

    // Notify only the affected party (not the one who rescheduled)
    const tutorUserId = session.tutor?.user?.id || session.tutor?.user_id
    
    if (userRole === 'tutor') {
      // Tutor rescheduled - notify student only
      await prisma.notification.create({
        data: {
          user_id: session.student_id,
          type: 'session_rescheduled',
          title: 'Session Rescheduled',
          message: `${reschedulerName} has rescheduled your ${session.subject} session. New date: ${newSessionDate.toLocaleDateString()} at ${start_time}`,
          session_id: sessionId,
          link: `/sessions/${sessionId}`
        }
      })
    } else {
      // Student rescheduled - notify tutor only
      if (tutorUserId) {
        await prisma.notification.create({
          data: {
            user_id: tutorUserId,
            type: 'session_rescheduled',
            title: 'Session Rescheduled',
            message: `${reschedulerName} has rescheduled the ${session.subject} session. New date: ${newSessionDate.toLocaleDateString()} at ${start_time}`,
            session_id: sessionId,
            link: `/sessions/${sessionId}`
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Session rescheduled successfully',
      data: { session: updatedSession }
    })
  } catch (error) {
    console.error('Reschedule session error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

