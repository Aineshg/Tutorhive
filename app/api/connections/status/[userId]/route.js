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

    const otherUserId = params.userId

    if (!otherUserId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if connection exists
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requester_id: userId, receiver_id: otherUserId },
          { requester_id: otherUserId, receiver_id: userId }
        ]
      }
    })

    if (!connection) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'not_connected'
        }
      })
    }

    let status = 'not_connected'
    if (connection.status === 'accepted') {
      status = 'connected'
    } else if (connection.status === 'pending') {
      if (connection.requester_id === userId) {
        status = 'pending_sent'
      } else {
        status = 'pending_received'
      }
    } else if (connection.status === 'declined') {
      status = 'declined'
    }

    return NextResponse.json({
      success: true,
      data: {
        status,
        connectionId: connection.id
      }
    })
  } catch (error) {
    console.error('Get connection status error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
