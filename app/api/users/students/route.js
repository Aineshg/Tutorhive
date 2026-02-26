import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    if (!prisma || !prisma.user) {
      return NextResponse.json(
        { success: false, message: 'Database models not available' },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value
    const userRole = cookieStore.get('user-role')?.value || 'student'

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (userRole !== 'tutor') {
      return NextResponse.json(
        { success: false, message: 'Only tutors can access this endpoint' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Get all users who have student profiles
    // Since Student has user_id (unique), we need to find users that have a corresponding Student record
    const where = {
      student: {
        isNot: null
      }
    }

    if (search) {
      where.AND = [
        {
          student: {
            isNot: null
          }
        },
        {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              email: {
                contains: search,
                mode: 'insensitive'
              }
            }
          ]
        }
      ]
    }

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        student: {
          select: {
            id: true,
            semester: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      },
      take: 50
    })

    return NextResponse.json({
      success: true,
      data: {
        students: students.map(student => ({
          id: student.id,
          name: student.name,
          email: student.email,
          avatar_url: student.avatar_url,
          semester: student.student?.semester || null
        }))
      }
    })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

