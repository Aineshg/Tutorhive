import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    // Check if Prisma models are available
    if (!prisma || !prisma.user) {
      console.error('Prisma models not available')
      return NextResponse.json(
        { success: false, message: 'Database models not available' },
        { status: 500 }
      )
    }

    // Await params in Next.js App Router
    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch user with student and tutor profiles
    // Cannot mix include and select - use include only
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        tutor: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          last_active_at: user.last_active_at
        },
        profile: {
          student: user.student,
          tutor: user.tutor
        }
      }
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

