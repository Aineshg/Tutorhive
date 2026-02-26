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
    const type = searchParams.get('type') // 'sent' or 'received'

    // Verify Connection model exists
    if (!prisma.connection) {
      console.error('Connection model not available in Prisma client')
      return NextResponse.json(
        { success: false, message: 'Connection model not available. Please restart the server.' },
        { status: 500 }
      )
    }

    let where = {}
    
    if (type === 'sent') {
      where = {
        requester_id: userId,
        status: 'pending'
      }
    } else if (type === 'received') {
      where = {
        receiver_id: userId,
        status: 'pending'
      }
    } else {
      // Get both sent and received
      where = {
        OR: [
          { requester_id: userId, status: 'pending' },
          { receiver_id: userId, status: 'pending' }
        ]
      }
    }

    const requests = await prisma.connection.findMany({
      where,
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
        created_at: 'desc'
      }
    })

    // Format requests
    const formattedRequests = requests.map(req => {
      const isSent = req.requester_id === userId
      const otherUser = isSent ? req.receiver : req.requester
      const isTutor = otherUser.role === 'tutor'
      const profile = isTutor ? otherUser.tutor : otherUser.student

      // Count connections for the other user
      return {
        id: req.id,
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
        requestDate: req.created_at.toISOString().split('T')[0],
        message: req.message || '',
        isSent
      }
    })

    // Get connection counts
    const otherUserIds = formattedRequests.map((r, index) => {
      const req = requests[index]
      return r.isSent ? req.receiver_id : req.requester_id
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

      formattedRequests.forEach((req, index) => {
        const otherUserId = otherUserIds[index]
        req.connections = countsMap.get(otherUserId) || 0
      })
    }

    // Separate sent and received
    const sent = formattedRequests.filter(r => r.isSent)
    const received = formattedRequests.filter(r => !r.isSent)

    return NextResponse.json({
      success: true,
      data: {
        sent,
        received,
        all: formattedRequests
      }
    })
  } catch (error) {
    console.error('Get connection requests error:', error)
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
