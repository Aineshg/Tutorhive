import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

/**
 * POST /api/messages/send
 * Send a message in a conversation
 * Creates conversation if it doesn't exist
 */
export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { receiver_id, content } = body

    if (!receiver_id || !content || !content.trim()) {
      return NextResponse.json(
        { success: false, message: 'Receiver ID and content are required' },
        { status: 400 }
      )
    }

    if (receiver_id === userId) {
      return NextResponse.json(
        { success: false, message: 'Cannot send message to yourself' },
        { status: 400 }
      )
    }

    // Verify users are connected
    const connection = await prisma.connection.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { requester_id: userId, receiver_id },
          { requester_id: receiver_id, receiver_id: userId }
        ]
      }
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, message: 'Users must be connected to send messages' },
        { status: 403 }
      )
    }

    // Find or create conversation
    // Ensure consistent ordering (smaller ID first)
    const [participant1_id, participant2_id] = userId < receiver_id 
      ? [userId, receiver_id]
      : [receiver_id, userId]

    let conversation = await prisma.conversation.findUnique({
      where: {
        participant1_id_participant2_id: {
          participant1_id,
          participant2_id
        }
      }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participant1_id,
          participant2_id
        }
      })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender_id: userId,
        content: content.trim(),
        status: 'sent'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        }
      }
    })

    // Update conversation's last_message_at
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        last_message_at: new Date()
      }
    })

    // Update message status to delivered immediately
    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: 'delivered'
      }
    })

    // Create notification for the receiver
    try {
      const receiver = await prisma.user.findUnique({
        where: { id: receiver_id },
        select: { name: true }
      })

      await prisma.notification.create({
        data: {
          user_id: receiver_id,
          type: 'message',
          title: 'New Message',
          message: `${message.sender.name} sent you a message: ${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}`,
          link: `/inbox`,
          metadata: {
            conversationId: conversation.id,
            senderId: userId,
            senderName: message.sender.name
          }
        }
      })
    } catch (notificationError) {
      // Don't fail the message send if notification creation fails
      console.error('Error creating message notification:', notificationError)
    }

    // Emit socket event if available
    try {
      const { io } = require('socket.io')
      if (io && global.io) {
        global.io.to(`conversation:${conversation.id}`).emit('message_received', {
          id: message.id,
          conversationId: conversation.id,
          sender: {
            id: message.sender.id,
            name: message.sender.name,
            avatar_url: message.sender.avatar_url
          },
          content: message.content,
          status: 'delivered',
          isEdited: false,
          isDeleted: false,
          reactions: {},
          createdAt: message.created_at,
          updatedAt: message.updated_at,
          isOwnMessage: false
        })
      }
    } catch (socketError) {
      // Socket not available, continue without it
      console.log('Socket not available, message saved to database')
    }

    return NextResponse.json({
      success: true,
      data: {
        message: {
          id: message.id,
          sender: {
            id: message.sender.id,
            name: message.sender.name,
            avatar_url: message.sender.avatar_url
          },
          content: message.content,
          status: 'delivered',
          isEdited: false,
          isDeleted: false,
          reactions: {},
          createdAt: message.created_at,
          updatedAt: message.updated_at,
          isOwnMessage: true
        },
        conversationId: conversation.id
      }
    })
  } catch (error) {
    console.error('Send message error:', error)
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

