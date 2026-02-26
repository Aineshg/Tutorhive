import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')
    const search = searchParams.get('search')

    // Build where clause
    const whereClause = {
      is_verified: true // Only show verified tutors
    }

    if (subject) {
      whereClause.subjects = {
        has: subject
      }
    }

    // Get tutors with their user info
    const tutors = await prisma.tutor.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true
          }
        }
      }
    })
    
    // Sort tutors: by rating (desc, nulls last), then by total_reviews (desc)
    tutors.sort((a, b) => {
      const ratingA = a.rating ?? 0
      const ratingB = b.rating ?? 0
      if (ratingB !== ratingA) {
        return ratingB - ratingA
      }
      return (b.total_reviews ?? 0) - (a.total_reviews ?? 0)
    })

    // Filter by search term if provided (client-side filtering for now)
    let filteredTutors = tutors
    if (search) {
      const searchLower = search.toLowerCase()
      filteredTutors = tutors.filter(tutor => {
        const tutorName = tutor.user.name.toLowerCase()
        const tutorSubjects = tutor.subjects.join(' ').toLowerCase()
        return tutorName.includes(searchLower) || tutorSubjects.includes(searchLower)
      })
    }

    // Format the response
    const formattedTutors = filteredTutors.map(tutor => ({
      id: tutor.user.id, // Return user_id for booking
      tutor_id: tutor.id, // Also return tutor.id if needed
      name: tutor.user.name,
      email: tutor.user.email,
      avatar_url: tutor.user.avatar_url,
      subjects: tutor.subjects,
      specialties: tutor.subjects.join(', '),
      rating: tutor.rating || 0,
      total_reviews: tutor.total_reviews || 0,
      hourly_rate: tutor.hourly_rate || 0,
      bio: tutor.bio,
      experience: tutor.experience,
      is_verified: tutor.is_verified
    }))

    return NextResponse.json({
      success: true,
      data: { tutors: formattedTutors }
    })
  } catch (error) {
    console.error('Get tutors error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      meta: error.meta
    })
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

