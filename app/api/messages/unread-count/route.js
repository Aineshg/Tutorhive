import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

/**
 * GET /api/messages/unread-count
 * Get total unread message count for the authenticated user
 */
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

    // Get all conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1_id: userId },
          { participant2_id: userId }
        ]
      },
      select: {
        id: true
      }
    })

    const conversationIds = conversations.map(c => c.id)

    // Count unread messages
    const unreadCount = await prisma.message.count({
      where: {
        conversation_id: { in: conversationIds },
        sender_id: { not: userId },
        OR: [
          { read_at: null },
          { status: { not: 'read' } }
        ]
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        unreadCount
      }
    })
  } catch (error) {
    console.error('Get unread count error:', error)
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

