import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user-id')?.value

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated. Please login first.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { phone, subjects, experience, semester, bio, hourlyRate } = body

    // Validate required fields
    if (!subjects || subjects.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Please select at least one subject' },
        { status: 400 }
      )
    }

    if (!experience) {
      return NextResponse.json(
        { success: false, message: 'Please select your experience level' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tutor: true, student: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if tutor profile already exists
    if (user.tutor) {
      return NextResponse.json(
        { success: false, message: 'Tutor profile already exists for this user' },
        { status: 409 }
      )
    }

    // Ensure student profile exists (all tutors are also students)
    if (!user.student) {
      await prisma.student.create({
        data: {
          user_id: userId
        }
      })
    }

    // Create tutor profile with same user_id
    const tutor = await prisma.tutor.create({
      data: {
        user_id: userId,
        phone: phone || null,
        subjects: subjects || [],
        experience: experience || null,
        semester: semester || null,
        bio: bio || null,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      },
    })

    // Update user role to include tutor (or keep as student if they want both roles)
    // For now, we'll keep the user's role as is, but they can login as tutor

    return NextResponse.json({
      success: true,
      message: 'Tutor profile created successfully!',
      data: { tutor },
    }, { status: 201 })
  } catch (error) {
    console.error('Tutor registration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

