import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

/**
 * GET /api/messages/conversations/[id]
 * Get all messages in a conversation
 */
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

    const { id: conversationId } = await params

    // Verify user is a participant in this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participant1: true,
        participant2: true
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      )
    }

    if (conversation.participant1_id !== userId && conversation.participant2_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to view this conversation' },
        { status: 403 }
      )
    }

    // Get all messages (excluding deleted ones from display, but keep them for context)
    const messages = await prisma.message.findMany({
      where: {
        conversation_id: conversationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar_url: true
          }
        }
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    // Mark messages as delivered and read
    await prisma.message.updateMany({
      where: {
        conversation_id: conversationId,
        sender_id: { not: userId },
        status: { in: ['sent', 'delivered'] }
      },
      data: {
        status: 'read',
        read_at: new Date()
      }
    })

    // Format messages
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      sender: {
        id: msg.sender.id,
        name: msg.sender.name,
        avatar_url: msg.sender.avatar_url
      },
      content: msg.is_deleted ? 'This message was deleted' : msg.content,
      status: msg.status,
      isEdited: msg.is_edited,
      isDeleted: msg.is_deleted,
      editedAt: msg.edited_at,
      deletedAt: msg.deleted_at,
      readAt: msg.read_at,
      reactions: msg.reactions || {},
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
      isOwnMessage: msg.sender_id === userId
    }))

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          participant1: {
            id: conversation.participant1.id,
            name: conversation.participant1.name,
            avatar_url: conversation.participant1.avatar_url
          },
          participant2: {
            id: conversation.participant2.id,
            name: conversation.participant2.name,
            avatar_url: conversation.participant2.avatar_url
          }
        },
        messages: formattedMessages,
        total: formattedMessages.length
      }
    })
  } catch (error) {
    console.error('Get conversation messages error:', error)
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

