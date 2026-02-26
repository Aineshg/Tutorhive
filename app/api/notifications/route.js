import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value

    console.log('Get notifications request - userId:', userId)

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const whereClause = {
      user_id: userId,
      ...(unreadOnly && { status: 'unread' })
    }

    console.log('Fetching notifications with whereClause:', whereClause)
    
    // Check if notification model exists
    if (!prisma.notification) {
      console.error('Prisma notification model not available!')
      return NextResponse.json(
        { success: false, message: 'Database model not available' },
        { status: 500 }
      )
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc'
      },
      take: unreadOnly ? 10 : 50
    })

    const unreadCount = await prisma.notification.count({
      where: {
        user_id: userId,
        status: 'unread'
      }
    })

    console.log(`Found ${notifications.length} notifications for user ${userId}, ${unreadCount} unread`)

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      meta: error.meta
    })
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error'
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error', 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          name: error.name,
          meta: error.meta
        } : undefined
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request) {
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
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          user_id: userId,
          status: 'unread'
        },
        data: {
          status: 'read',
          read_at: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    }

    if (notificationId) {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          user_id: userId // Ensure user owns the notification
        },
        data: {
          status: 'read',
          read_at: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: { notification }
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
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
    const notificationId = searchParams.get('notificationId')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    if (deleteAll) {
      // Delete all notifications for the user
      await prisma.notification.deleteMany({
        where: {
          user_id: userId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'All notifications deleted successfully'
      })
    }

    if (notificationId) {
      // Delete a specific notification
      await prisma.notification.delete({
        where: {
          id: notificationId,
          user_id: userId // Ensure user owns the notification
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Notification deleted successfully'
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

