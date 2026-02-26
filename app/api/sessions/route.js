import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // upcoming, completed, cancelled, pending
    const role = searchParams.get('role') || userRole // student or tutor
    const tutorId = searchParams.get('tutorId') // For students to see a specific tutor's sessions

    // Build the where clause based on role
    let whereClause = {}
    
    if (role === 'student') {
      whereClause.student_id = userId
      // If tutorId is provided, filter by that tutor
      if (tutorId) {
        whereClause.tutor_id = tutorId
      }
    } else if (role === 'tutor') {
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
      
      whereClause.tutor_id = tutor.id
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid role' },
        { status: 400 }
      )
    }

    // Map frontend status to database status
    if (status === 'upcoming') {
      whereClause.status = 'confirmed'
      whereClause.session_date = { gte: new Date() }
    } else if (status === 'completed') {
      whereClause.status = 'completed'
    } else if (status === 'cancelled') {
      whereClause.status = 'cancelled'
    } else if (status === 'requests' || status === 'pending') {
      whereClause.status = 'pending'
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
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
      },
      orderBy: {
        session_date: 'desc'
      }
    })

    // For upcoming sessions, filter out past confirmed sessions
    let filteredSessions = sessions
    if (status === 'upcoming') {
      filteredSessions = sessions.filter(session => {
        const sessionDateTime = new Date(session.session_date)
        return sessionDateTime >= new Date()
      })
    }

    return NextResponse.json({
      success: true,
      data: { sessions: filteredSessions }
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

