import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

export async function DELETE(request, { params }) {
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

    // Get the connection
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId }
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, message: 'Connection not found' },
        { status: 404 }
      )
    }

    // Verify user is part of the connection
    if (connection.requester_id !== userId && connection.receiver_id !== userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to delete this connection' },
        { status: 403 }
      )
    }

    // Delete the connection
    await prisma.connection.delete({
      where: { id: connectionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Connection removed successfully'
    })
  } catch (error) {
    console.error('Delete connection error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
