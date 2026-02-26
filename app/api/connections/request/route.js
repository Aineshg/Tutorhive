import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'


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

    // Verify Connection model exists
    if (!prisma.connection) {
      console.error('Connection model not available in Prisma client')
      return NextResponse.json(
        { success: false, message: 'Connection model not available. Please restart the server.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { receiver_id, message } = body

    if (!receiver_id) {
      return NextResponse.json(
        { success: false, message: 'Receiver ID is required' },
        { status: 400 }
      )
    }

    // Prevent self-connection
    if (receiver_id === userId) {
      return NextResponse.json(
        { success: false, message: 'Cannot send connection request to yourself' },
        { status: 400 }
      )
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiver_id }
    })

    if (!receiver) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if connection already exists (in any direction)
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requester_id: userId, receiver_id },
          { requester_id: receiver_id, receiver_id: userId }
        ]
      }
    })

    if (existingConnection) {
      if (existingConnection.status === 'accepted') {
        return NextResponse.json(
          { success: false, message: 'Already connected' },
          { status: 400 }
        )
      }
      if (existingConnection.status === 'pending') {
        return NextResponse.json(
          { success: false, message: 'Connection request already exists' },
          { status: 400 }
        )
      }
      // If declined, update it to pending
      if (existingConnection.status === 'declined') {
        const updated = await prisma.connection.update({
          where: { id: existingConnection.id },
          data: {
            requester_id: userId,
            receiver_id,
            status: 'pending',
            message: message || null
          }
        })

        // Create notification for receiver
        try {
          const requester = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
          })

          await prisma.notification.create({
            data: {
              user_id: receiver_id,
              type: 'session_request', // Reusing notification type, can add connection_request later
              title: 'New Connection Request',
              message: `${requester?.name || 'Someone'} wants to connect with you.`,
              link: '/connections'
            }
          })
        } catch (notifError) {
          console.error('Error creating notification:', notifError)
          // Don't fail the request if notification fails
        }

        return NextResponse.json({
          success: true,
          data: { connection: updated }
        })
      }
    }

    // Create new connection request
    const connection = await prisma.connection.create({
      data: {
        requester_id: userId,
        receiver_id,
        status: 'pending',
        message: message || null
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Create notification for receiver
    try {
      await prisma.notification.create({
        data: {
          user_id: receiver_id,
          type: 'session_request', // Reusing notification type
          title: 'New Connection Request',
          message: `${connection.requester.name} wants to connect with you.`,
          link: '/connections'
        }
      })
    } catch (notifError) {
      console.error('Error creating notification:', notifError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      data: { connection }
    })
  } catch (error) {
    console.error('Create connection request error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Connection request already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
