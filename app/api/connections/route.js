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

    // Verify Connection model exists
    if (!prisma.connection) {
      console.error('Connection model not available in Prisma client')
      return NextResponse.json(
        { success: false, message: 'Connection model not available. Please restart the server.' },
        { status: 500 }
      )
    }

    // Get all accepted connections
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { requester_id: userId, status: 'accepted' },
          { receiver_id: userId, status: 'accepted' }
        ]
      },
      include: {
        requester: {
          include: {
            student: {
              select: {
                semester: true,
                subjects: true,
                bio: true
              }
            },
            tutor: {
              select: {
                semester: true,
                subjects: true,
                bio: true,
                rating: true,
                total_reviews: true
              }
            }
          }
        },
        receiver: {
          include: {
            student: {
              select: {
                semester: true,
                subjects: true,
                bio: true
              }
            },
            tutor: {
              select: {
                semester: true,
                subjects: true,
                bio: true,
                rating: true,
                total_reviews: true
              }
            }
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      }
    })

    // Format connections
    const formattedConnections = connections.map(conn => {
      const otherUser = conn.requester_id === userId ? conn.receiver : conn.requester
      const isTutor = otherUser.role === 'tutor'
      const profile = isTutor ? otherUser.tutor : otherUser.student

      // Calculate last activity using last_active_at (or fallback to updated_at if not set)
      // last_active_at and updated_at are included because we use include (not select)
      // Prioritize last_active_at over updated_at for accurate activity tracking
      const lastActivityDate = otherUser.last_active_at 
        ? new Date(otherUser.last_active_at) 
        : (otherUser.updated_at ? new Date(otherUser.updated_at) : new Date())
      const now = new Date()
      const diffMs = now - lastActivityDate
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)
      
      let lastActivityText = 'Just now'
      if (diffDays > 0) {
        lastActivityText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      } else if (diffHours > 0) {
        lastActivityText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      } else {
        const diffMins = Math.floor(diffMs / (1000 * 60))
        if (diffMins > 0) {
          lastActivityText = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
        }
      }

      return {
        id: conn.id,
        connectionId: conn.id,
        name: otherUser.name,
        email: otherUser.email,
        avatar_url: otherUser.avatar_url,
        type: isTutor ? 'tutor' : 'student',
        semester: profile?.semester || 'N/A',
        subjects: profile?.subjects || [],
        bio: profile?.bio || '',
        rating: isTutor ? (profile?.rating || 0) : null,
        connections: 0, // Will be calculated
        status: 'offline',
        connectedDate: conn.created_at.toISOString().split('T')[0],
        lastActivity: lastActivityText
      }
    })

    // Get connection counts for each connected user
    const otherUserIds = formattedConnections.map(c => {
      const conn = connections.find(conn => conn.id === c.connectionId)
      return conn.requester_id === userId ? conn.receiver_id : conn.requester_id
    })

    if (otherUserIds.length > 0) {
      // Get all accepted connections involving these users
      const allConnections = await prisma.connection.findMany({
        where: {
          status: 'accepted',
          OR: [
            { requester_id: { in: otherUserIds } },
            { receiver_id: { in: otherUserIds } }
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

      formattedConnections.forEach((conn, index) => {
        const otherUserId = otherUserIds[index]
        conn.connections = countsMap.get(otherUserId) || 0
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        connections: formattedConnections,
        total: formattedConnections.length
      }
    })
  } catch (error) {
    console.error('Get connections error:', error)
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
