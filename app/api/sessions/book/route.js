import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value
    const userRole = cookieStore.get('user-role')?.value
    
    console.log('Booking request - userId:', userId, 'userRole:', userRole)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (userRole !== 'student') {
      return NextResponse.json(
        { success: false, message: 'Only students can book sessions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('Booking request body:', body)
    
    const {
      tutor_id, // This should be the tutor's user_id from the frontend
      subject,
      topic,
      description,
      session_date,
      start_time,
      end_time,
      duration,
      session_type = 'online'
    } = body

    // Validate required fields
    if (!tutor_id || !subject || !topic || !session_date || !start_time || !duration) {
      console.log('Missing fields:', { tutor_id, subject, topic, session_date, start_time, duration })
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the tutor record by user_id
    console.log('Looking for tutor with user_id:', tutor_id)
    const tutor = await prisma.tutor.findUnique({
      where: { user_id: tutor_id },
      include: { user: true }
    })
    console.log('Found tutor:', tutor ? 'Yes' : 'No')

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: 'Tutor not found' },
        { status: 404 }
      )
    }

    // Get or create the student record
    let student = await prisma.student.findUnique({
      where: { user_id: userId }
    })

    if (!student) {
      // Auto-create student profile if it doesn't exist
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        )
      }

      // Create student profile
      if (!prisma.student) {
        console.error('prisma.student is undefined!')
        return NextResponse.json(
          { success: false, message: 'Database error: Student model not available' },
          { status: 500 }
        )
      }
      
      student = await prisma.student.create({
        data: {
          user_id: userId
        }
      })
    }

    // Parse session_date
    const sessionDate = new Date(session_date)
    if (isNaN(sessionDate.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid session date' },
        { status: 400 }
      )
    }

    // Check for time conflicts (optional - you can enhance this later)
    // For now, we'll allow booking and let tutors confirm/cancel

    // Create the session
    console.log('Creating session with data:', {
      student_id: userId,
      tutor_id: tutor.id,
      subject,
      topic,
      session_date: sessionDate,
      start_time,
      end_time,
      duration: parseInt(duration),
      session_type: session_type === 'in-person' ? 'in_person' : 'online'
    })
    
    // Create the session
    const session = await prisma.session.create({
      data: {
        student_id: userId,
        tutor_id: tutor.id, // Use tutor.id, not tutor.user_id
        subject,
        topic,
        description: description || null,
        session_date: sessionDate,
        start_time,
        end_time: end_time || null,
        duration: parseInt(duration),
        session_type: session_type === 'in-person' ? 'in_person' : 'online',
        status: 'pending'
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

    // Create notification for tutor about new session request
    try {
      // Get student user info for the notification message
      const studentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      })

      const tutorUserId = tutor.user_id || tutor.user?.id
      console.log('Creating session_request notification:', {
        tutorUserId,
        tutor: tutor.id,
        tutorUser: tutor.user,
        studentName: studentUser?.name
      })

      if (!tutorUserId) {
        console.error('Tutor user_id not found. Tutor object:', JSON.stringify(tutor, null, 2))
      } else {
        const notification = await prisma.notification.create({
          data: {
            user_id: tutorUserId,
            type: 'session_request',
            title: 'New Session Request',
            message: `${studentUser?.name || 'A student'} has requested a ${subject} session on ${new Date(session_date).toLocaleDateString()} at ${start_time}.`,
            session_id: session.id,
            link: `/sessions/${session.id}`
          }
        })
        console.log('✅ Notification created successfully:', {
          id: notification.id,
          userId: notification.user_id,
          type: notification.type,
          sessionId: notification.session_id
        })
      }
    } catch (notifError) {
      console.error('❌ Error creating notification:', notifError)
      console.error('Notification error details:', {
        message: notifError.message,
        stack: notifError.stack,
        code: notifError.code,
        meta: notifError.meta
      })
      // Don't fail the booking if notification creation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Session booked successfully',
      data: { session }
    })
  } catch (error) {
    console.error('Book session error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

