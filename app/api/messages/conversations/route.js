import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'


/**
 * GET /api/messages/conversations
 * Get all conversations for the authenticated user
 * Only shows conversations with connected users
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
      include: {
        participant1: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            role: true
          }
        },
        participant2: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            role: true
          }
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        last_message_at: 'desc'
      }
    })

    // Format conversations and check if user is connected to the other participant
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.participant1_id === userId 
          ? conv.participant2 
          : conv.participant1

        // Check if users are connected
        const connection = await prisma.connection.findFirst({
          where: {
            status: 'accepted',
            OR: [
              { requester_id: userId, receiver_id: otherUser.id },
              { requester_id: otherUser.id, receiver_id: userId }
            ]
          }
        })

        // Only include conversations with connected users
        if (!connection) {
          return null
        }

        // Get unread message count
        const unreadCount = await prisma.message.count({
          where: {
            conversation_id: conv.id,
            sender_id: { not: userId },
            OR: [
              { read_at: null },
              { status: { not: 'read' } }
            ]
          }
        })

        const lastMessage = conv.messages[0]
        const lastMessageContent = lastMessage?.is_deleted 
          ? 'This message was deleted' 
          : lastMessage?.content || 'No messages yet'

        return {
          id: conv.id,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            avatar_url: otherUser.avatar_url,
            role: otherUser.role
          },
          lastMessage: {
            content: lastMessageContent,
            sender: lastMessage?.sender?.name || 'Unknown',
            timestamp: lastMessage?.created_at || conv.last_message_at,
            isDeleted: lastMessage?.is_deleted || false
          },
          unreadCount,
          lastMessageAt: conv.last_message_at,
          updatedAt: conv.updated_at,
          hasMessages: conv.messages.length > 0
        }
      })
    )

    // Filter out null conversations (not connected)
    const validConversations = formattedConversations.filter(c => c !== null)

    // Get all connected users who don't have conversations yet
    const allConnections = await prisma.connection.findMany({
      where: {
        status: 'accepted',
        OR: [
          { requester_id: userId },
          { receiver_id: userId }
        ]
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
            role: true
          }
        }
      }
    })

    // Get user IDs who already have conversations
    const usersWithConversations = new Set()
    validConversations.forEach(conv => {
      usersWithConversations.add(conv.otherUser.id)
    })

    // Add connected users without conversations
    const connectedUsersWithoutChats = allConnections
      .map(conn => {
        const otherUser = conn.requester_id === userId ? conn.receiver : conn.requester
        return { user: otherUser, connectionDate: conn.created_at }
      })
      .filter(({ user }) => !usersWithConversations.has(user.id))
      .map(({ user, connectionDate }) => ({
        id: null, // No conversation ID yet
        otherUser: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
          role: user.role
        },
        lastMessage: {
          content: 'Start messaging now',
          sender: null,
          timestamp: connectionDate,
          isDeleted: false
        },
        unreadCount: 0,
        lastMessageAt: connectionDate,
        updatedAt: connectionDate,
        hasMessages: false,
        isNewConversation: true
      }))

    // Combine and sort by last_message_at or connection date
    const allChats = [...validConversations, ...connectedUsersWithoutChats].sort((a, b) => {
      return new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    })

    return NextResponse.json({
      success: true,
      data: {
        conversations: allChats,
        total: allChats.length
      }
    })
  } catch (error) {
    console.error('Get conversations error:', error)
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

