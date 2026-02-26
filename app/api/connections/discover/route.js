import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') // 'student' or 'tutor'
    const subject = searchParams.get('subject') // Filter by subject
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verify Connection model exists
    if (!prisma.connection) {
      console.error('Connection model not available in Prisma client')
      return NextResponse.json(
        { success: false, message: 'Connection model not available. Please restart the server.' },
        { status: 500 }
      )
    }

    // Get all existing connections (both directions) and pending requests
    const existingConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { requester_id: userId },
          { receiver_id: userId }
        ]
      },
      select: {
        requester_id: true,
        receiver_id: true,
        status: true
      }
    })

    // Get user IDs to exclude (connected or has pending requests)
    const excludeUserIds = new Set([userId])
    existingConnections.forEach(conn => {
      if (conn.requester_id === userId) {
        excludeUserIds.add(conn.receiver_id)
      } else {
        excludeUserIds.add(conn.requester_id)
      }
    })

    // Build where clause
    const where = {
      id: {
        notIn: Array.from(excludeUserIds)
      }
    }

    // Filter by role
    if (role) {
      where.role = role
    }

    // Search filter - combine with AND if search exists
    if (search) {
      where.AND = [
        {
          id: {
            notIn: Array.from(excludeUserIds)
          },
          ...(role ? { role } : {})
        },
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      ]
      // Remove top-level conditions since they're in AND
      delete where.id
      if (role) delete where.role
    }

    // Get users with their student/tutor profiles
    const users = await prisma.user.findMany({
      where,
      include: {
        student: {
          select: {
            subjects: true,
            semester: true,
            bio: true
          }
        },
        tutor: {
          select: {
            subjects: true,
            semester: true,
            bio: true,
            rating: true,
            total_reviews: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        created_at: 'desc'
      }
    })

    // Filter by subject if provided
    let filteredUsers = users
    if (subject) {
      filteredUsers = users.filter(user => {
        const userSubjects = user.role === 'tutor' 
          ? (user.tutor?.subjects || [])
          : (user.student?.subjects || [])
        return userSubjects.some(sub => 
          sub.toLowerCase().includes(subject.toLowerCase())
        )
      })
    }

    // Format response
    const formattedUsers = filteredUsers.map(user => {
      const isTutor = user.role === 'tutor'
      const profile = isTutor ? user.tutor : user.student
      
      // Count connections for this user
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        type: user.role === 'tutor' ? 'tutor' : 'student',
        semester: profile?.semester || 'N/A',
        subjects: profile?.subjects || [],
        bio: profile?.bio || '',
        rating: isTutor ? (profile?.rating || 0) : null,
        connections: 0, // Will be calculated separately if needed
        status: 'offline' // Can be enhanced with online status tracking
      }
    })

    // Get connection counts for each user
    const userIds = formattedUsers.map(u => u.id)
    if (userIds.length > 0) {
      // Get all accepted connections involving these users
      const allConnections = await prisma.connection.findMany({
        where: {
          status: 'accepted',
          OR: [
            { requester_id: { in: userIds } },
            { receiver_id: { in: userIds } }
          ]
        },
        select: {
          requester_id: true,
          receiver_id: true
        }
      })

      const countsMap = new Map()
      allConnections.forEach(conn => {
        countsMap.set(conn.requester_id, (countsMap.get(conn.requester_id) || 0) + 1)
        countsMap.set(conn.receiver_id, (countsMap.get(conn.receiver_id) || 0) + 1)
      })

      formattedUsers.forEach(user => {
        user.connections = countsMap.get(user.id) || 0
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        total: formattedUsers.length,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('Discover connections error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
