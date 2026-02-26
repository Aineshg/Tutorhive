import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

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

    const connectionId = params.id
    const body = await request.json()
    const { action } = body // 'accept' or 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "accept" or "decline"' },
        { status: 400 }
      )
    }

    // Get the connection
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        requester: {
          select: {
            id: true,
            name: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, message: 'Connection request not found' },
        { status: 404 }
      )
    }

    // Verify user is the receiver
    if (connection.receiver_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to update this connection request' },
        { status: 403 }
      )
    }

    // Verify status is pending
    if (connection.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Connection request is not pending' },
        { status: 400 }
      )
    }

    // Update connection status
    const updatedConnection = await prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: action === 'accept' ? 'accepted' : 'declined'
      }
    })

    // Create notification for requester
    try {
      const receiver = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      })

      await prisma.notification.create({
        data: {
          user_id: connection.requester_id,
          type: action === 'accept' ? 'session_confirmed' : 'session_cancelled', // Reusing types
          title: action === 'accept' 
            ? 'Connection Request Accepted' 
            : 'Connection Request Declined',
          message: action === 'accept'
            ? `${receiver?.name || 'Someone'} accepted your connection request.`
            : `${receiver?.name || 'Someone'} declined your connection request.`,
          link: '/connections'
        }
      })
    } catch (notifError) {
      console.error('Error creating notification:', notifError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      data: { connection: updatedConnection }
    })
  } catch (error) {
    console.error('Update connection request error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
