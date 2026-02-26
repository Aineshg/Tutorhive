import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sessionId = params.id

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
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

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this session
    if (session.student_id !== userId) {
      // Check if user is the tutor
      const tutor = await prisma.tutor.findUnique({
        where: { user_id: userId }
      })
      
      if (!tutor || session.tutor_id !== tutor.id) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to view this session' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: { session }
    })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
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
    const { status, notes, rating, cancellation_reason } = body

    // Get the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        tutor: true
      }
    })

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to update
    let hasPermission = false
    if (session.student_id === userId) {
      // Students can cancel, add notes, and rate
      hasPermission = true
    } else {
      // Check if user is the tutor
      const tutor = await prisma.tutor.findUnique({
        where: { user_id: userId }
      })
      
      if (tutor && session.tutor_id === tutor.id) {
        // Tutors can confirm, cancel, and add notes
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to update this session' },
        { status: 403 }
      )
    }

    // Build update data
    const updateData = {}
    
    if (status) {
      // Validate status transitions
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: 'Invalid status' },
          { status: 400 }
        )
      }
      
      // Business logic: 
      // - Students can only cancel pending or confirmed sessions
      // - Tutors can accept (confirm) or decline (cancel) pending sessions
      // - Tutors can cancel confirmed sessions
      if (userRole === 'student') {
        if (status !== 'cancelled' || (session.status !== 'pending' && session.status !== 'confirmed')) {
          return NextResponse.json(
            { success: false, message: 'Students can only cancel pending or confirmed sessions' },
            { status: 403 }
          )
        }
      } else if (userRole === 'tutor') {
        // Tutors can accept pending sessions (change to confirmed)
        if (status === 'confirmed' && session.status === 'pending') {
          // Allow tutor to accept
        } else if (status === 'cancelled' && session.status === 'pending') {
          // Allow tutor to decline pending sessions
        } else if (status === 'cancelled' && session.status === 'confirmed') {
          // Allow tutor to cancel confirmed sessions
        } else if (status === 'completed' && session.status === 'confirmed') {
          // Allow tutor to mark confirmed sessions as completed
        } else {
          return NextResponse.json(
            { success: false, message: 'Invalid status transition for tutor' },
            { status: 403 }
          )
        }
      }
      
      updateData.status = status
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (rating !== undefined) {
      // Only students can rate, and only completed sessions
      if (userRole !== 'student' || session.status !== 'completed') {
        return NextResponse.json(
          { success: false, message: 'Rating can only be added to completed sessions by students' },
          { status: 403 }
        )
      }
      
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { success: false, message: 'Rating must be between 1 and 5' },
          { status: 400 }
        )
      }
      
      updateData.rating = parseFloat(rating)
    }

    if (cancellation_reason) {
      updateData.cancellation_reason = cancellation_reason
    }

    // Update the session
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: updateData,
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

    // Create notifications based on status changes
    try {
      if (status === 'confirmed' && session.status === 'pending') {
        // Notify student when tutor confirms
        console.log('Creating session_confirmed notification for student:', session.student_id)
        const notification = await prisma.notification.create({
          data: {
            user_id: session.student_id,
            type: 'session_confirmed',
            title: 'Session Confirmed',
            message: `${updatedSession.tutor.user.name} has confirmed your ${session.subject} session.`,
            session_id: sessionId,
            link: `/sessions/${sessionId}`
          }
        })
        console.log('Session confirmed notification created:', notification.id)
      } else if (status === 'cancelled') {
        // Notify only the affected party (not the one who cancelled)
        const cancelledBy = userRole === 'tutor' ? updatedSession.tutor.user.name : updatedSession.student.name
        
        if (userRole === 'tutor') {
          // Tutor cancelled - notify student only
          await prisma.notification.create({
            data: {
              user_id: session.student_id,
              type: 'session_cancelled',
              title: 'Session Cancelled',
              message: `${cancelledBy} has cancelled the ${session.subject} session.${cancellation_reason ? ` Reason: ${cancellation_reason}` : ''}`,
              session_id: sessionId,
              link: `/sessions/${sessionId}`
            }
          })
        } else {
          // Student cancelled - notify tutor only
          const tutorUserId = updatedSession.tutor.user.id
          await prisma.notification.create({
            data: {
              user_id: tutorUserId,
              type: 'session_cancelled',
              title: 'Session Cancelled',
              message: `${cancelledBy} has cancelled the ${session.subject} session.${cancellation_reason ? ` Reason: ${cancellation_reason}` : ''}`,
              session_id: sessionId,
              link: `/sessions/${sessionId}`
            }
          })
        }
      } else if (status === 'completed' && session.status === 'confirmed') {
        // Notify student when tutor marks session as completed
        await prisma.notification.create({
          data: {
            user_id: session.student_id,
            type: 'session_completed',
            title: 'Session Completed',
            message: `Your ${session.subject} session with ${updatedSession.tutor.user.name} has been marked as completed. You can now rate the session.`,
            session_id: sessionId,
            link: `/sessions/${sessionId}`
          }
        })
      }
    } catch (notifError) {
      console.error('Error creating notification:', notifError)
      console.error('Notification error details:', {
        message: notifError.message,
        stack: notifError.stack,
        code: notifError.code,
        meta: notifError.meta
      })
      // Don't fail the update if notification creation fails
    }

    // If rating was added, update tutor's average rating
    if (rating !== undefined && updatedSession.status === 'completed') {
      const tutorSessions = await prisma.session.findMany({
        where: {
          tutor_id: session.tutor_id,
          status: 'completed',
          rating: { not: null }
        },
        select: { rating: true }
      })

      const totalRating = tutorSessions.reduce((sum, s) => sum + (s.rating || 0), 0)
      const avgRating = tutorSessions.length > 0 ? totalRating / tutorSessions.length : 0

      await prisma.tutor.update({
        where: { id: session.tutor_id },
        data: {
          rating: avgRating,
          total_reviews: tutorSessions.length
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      data: { session: updatedSession }
    })
  } catch (error) {
    console.error('Update session error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

