import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

/**
 * PATCH /api/messages/[id]
 * Edit or delete a message
 */
export async function PATCH(request, { params }) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: messageId } = await params
    const body = await request.json()
    const { action, content, reaction } = body

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true
      }
    })

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Message not found' },
        { status: 404 }
      )
    }

    // Verify user is part of the conversation
    if (message.conversation.participant1_id !== userId && 
        message.conversation.participant2_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 403 }
      )
    }

    let updatedMessage

    if (action === 'edit') {
      // Only sender can edit their message
      if (message.sender_id !== userId) {
        return NextResponse.json(
          { success: false, message: 'Only the sender can edit a message' },
          { status: 403 }
        )
      }

      if (!content || !content.trim()) {
        return NextResponse.json(
          { success: false, message: 'Content is required' },
          { status: 400 }
        )
      }

      if (message.is_deleted) {
        return NextResponse.json(
          { success: false, message: 'Cannot edit a deleted message' },
          { status: 400 }
        )
      }

      updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: content.trim(),
          is_edited: true,
          edited_at: new Date()
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
    } else if (action === 'delete') {
      // Only sender can delete their message
      if (message.sender_id !== userId) {
        return NextResponse.json(
          { success: false, message: 'Only the sender can delete a message' },
          { status: 403 }
        )
      }

      updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          is_deleted: true,
          deleted_at: new Date(),
          content: 'This message was deleted'
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
    } else if (action === 'react') {
      // Anyone in the conversation can react
      if (!reaction) {
        return NextResponse.json(
          { success: false, message: 'Reaction emoji is required' },
          { status: 400 }
        )
      }

      const currentReactions = message.reactions || {}
      const reactionArray = currentReactions[reaction] || []
      
      // Toggle reaction: if user already reacted, remove it; otherwise add it
      const hasReacted = reactionArray.includes(userId)
      const updatedReactions = { ...currentReactions }
      
      if (hasReacted) {
        updatedReactions[reaction] = reactionArray.filter(id => id !== userId)
        // Remove reaction key if empty
        if (updatedReactions[reaction].length === 0) {
          delete updatedReactions[reaction]
        }
      } else {
        updatedReactions[reaction] = [...reactionArray, userId]
      }

      updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          reactions: updatedReactions
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
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "edit", "delete", or "react"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        message: {
          id: updatedMessage.id,
          sender: {
            id: updatedMessage.sender.id,
            name: updatedMessage.sender.name,
            avatar_url: updatedMessage.sender.avatar_url
          },
          content: updatedMessage.content,
          status: updatedMessage.status,
          isEdited: updatedMessage.is_edited,
          isDeleted: updatedMessage.is_deleted,
          editedAt: updatedMessage.edited_at,
          deletedAt: updatedMessage.deleted_at,
          readAt: updatedMessage.read_at,
          reactions: updatedMessage.reactions || {},
          createdAt: updatedMessage.created_at,
          updatedAt: updatedMessage.updated_at,
          isOwnMessage: updatedMessage.sender_id === userId
        }
      }
    })
  } catch (error) {
    console.error('Update message error:', error)
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

