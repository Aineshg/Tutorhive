import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
export const dynamic = 'force-dynamic'

export async function GET(request) {
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
    const tutorId = searchParams.get('tutorId')

    // If tutorId is provided, get that tutor's availability (for booking page)
    // Otherwise, get current user's availability (if they're a tutor)
    let targetTutorId = tutorId

    if (!targetTutorId) {
      const tutor = await prisma.tutor.findUnique({
        where: { user_id: userId }
      })

      if (!tutor) {
        return NextResponse.json(
          { success: false, message: 'Tutor profile not found' },
          { status: 404 }
        )
      }

      targetTutorId = tutor.id
    }

    const availability = await prisma.tutorAvailability.findMany({
      where: {
        tutor_id: targetTutorId,
        is_available: true
      },
      orderBy: {
        day_of_week: 'asc'
      }
    })

    const unavailableDates = await prisma.tutorUnavailableDate.findMany({
      where: {
        tutor_id: targetTutorId,
        date: {
          gte: new Date()
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        availability,
        unavailableDates: unavailableDates.map(ud => ({
          id: ud.id,
          date: ud.date,
          reason: ud.reason
        }))
      }
    })
  } catch (error) {
    console.error('Get availability error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const tutor = await prisma.tutor.findUnique({
      where: { user_id: userId }
    })

    if (!tutor) {
      return NextResponse.json(
        { success: false, message: 'Tutor profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { availability, unavailableDates } = body

    // Delete all existing availability and recreate with new slots
    // This allows multiple slots per day
    if (availability && Array.isArray(availability)) {
      // Delete all existing availability for this tutor
      await prisma.tutorAvailability.deleteMany({
        where: { tutor_id: tutor.id }
      })

      // Create new availability slots
      if (availability.length > 0) {
        await prisma.tutorAvailability.createMany({
          data: availability.map(avail => ({
            tutor_id: tutor.id,
            day_of_week: avail.day_of_week,
            start_time: avail.start_time,
            end_time: avail.end_time,
            is_available: true
          }))
        })
      }
    }

    // Handle unavailable dates
    if (unavailableDates && Array.isArray(unavailableDates)) {
      // Delete existing unavailable dates that are not in the new list
      const existingDates = await prisma.tutorUnavailableDate.findMany({
        where: { tutor_id: tutor.id }
      })

      const newDateStrings = unavailableDates.map(d => new Date(d.date).toISOString().split('T')[0])
      const datesToDelete = existingDates.filter(
        ed => !newDateStrings.includes(ed.date.toISOString().split('T')[0])
      )

      for (const date of datesToDelete) {
        await prisma.tutorUnavailableDate.delete({
          where: { id: date.id }
        })
      }

      // Create or update unavailable dates
      for (const unavail of unavailableDates) {
        const date = new Date(unavail.date)
        date.setHours(0, 0, 0, 0)

        await prisma.tutorUnavailableDate.upsert({
          where: {
            tutor_id_date: {
              tutor_id: tutor.id,
              date: date
            }
          },
          update: {
            reason: unavail.reason || null
          },
          create: {
            tutor_id: tutor.id,
            date: date,
            reason: unavail.reason || null
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully'
    })
  } catch (error) {
    console.error('Update availability error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

