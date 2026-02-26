import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { email, password, role = 'student' } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        tutor: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user has the requested role profile
    if (role === 'tutor' && !user.tutor) {
      return NextResponse.json(
        { success: false, message: 'Tutor profile not found. Please register as tutor first.' },
        { status: 403 }
      )
    }

    // Update last_active_at on login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_active_at: new Date()
      }
    })

    // Set cookies
    const cookieStore = await cookies()
    cookieStore.set('auth-token', 'authenticated', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    })
    cookieStore.set('user-id', user.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    })
    cookieStore.set('user-role', role, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    })

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: role,
      hasTutorProfile: !!user.tutor,
      hasStudentProfile: !!user.student
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

