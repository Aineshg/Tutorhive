"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DashboardNav } from "@/components/dashboard-nav"
import { useUser } from "@/hooks/use-user"
import { Calendar as CalendarIcon, Clock, Save, Plus, X, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

export default function AvailabilityManagementPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [availability, setAvailability] = useState([])
  const [unavailableDates, setUnavailableDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addDateDialogOpen, setAddDateDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dateReason, setDateReason] = useState("")
  const [error, setError] = useState("")

  // Group availability by day of week for easier management
  const getSlotsForDay = (dayOfWeek) => {
    return availability.filter(a => a.day_of_week === dayOfWeek && a.is_available)
  }

  // 1-hour increment time options from 9:00 AM to 5:00 PM
  const TIME_OPTIONS = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ]

  // Build 1-hour slot ranges (e.g., 9:00 AM - 10:00 AM, ..., 4:00 PM - 5:00 PM)
  const TIME_RANGES = TIME_OPTIONS.slice(0, -1).map((start, idx) => ({
    start,
    end: TIME_OPTIONS[idx + 1],
    label: `${start} - ${TIME_OPTIONS[idx + 1]}`,
  }))

  const makeSlotId = (dayOfWeek, start, end) => `${dayOfWeek}:${start}-${end}`

  const isSlotSelected = (dayOfWeek, start, end) => {
    return availability.some(
      a => a.day_of_week === dayOfWeek && a.start_time === start && a.end_time === end && a.is_available
    )
  }

  const toggleSlot = (dayOfWeek, start, end) => {
    setAvailability(prev => {
      const exists = prev.find(a => a.day_of_week === dayOfWeek && a.start_time === start && a.end_time === end)
      if (exists) {
        // Remove the slot
        return prev.filter(a => !(a.day_of_week === dayOfWeek && a.start_time === start && a.end_time === end))
      }
      // Add the slot
      return [
        ...prev,
        {
          id: makeSlotId(dayOfWeek, start, end),
          day_of_week: dayOfWeek,
          start_time: start,
          end_time: end,
          is_available: true,
        },
      ]
    })
  }

  useEffect(() => {
    if (userLoading) {
      return
    }

    if (!user || user.role !== 'tutor') {
      router.push('/dashboard')
      return
    }

    fetchAvailability()
  }, [userLoading, user, router])

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/availability')
      const data = await response.json()
      if (data.success) {
        setAvailability(data.data.availability || [])
        setUnavailableDates(data.data.unavailableDates || [])
      }
    } catch (err) {
      console.error('Error fetching availability:', err)
      setError('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  // (Removed free-text and dropdown editing helpers in favor of slot toggles)

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      // Send all availability slots (including multiple per day)
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availability: availability.filter(a => a.is_available).map(a => ({
            day_of_week: a.day_of_week,
            start_time: a.start_time,
            end_time: a.end_time,
            is_available: true
          })),
          unavailableDates: unavailableDates.map(d => ({
            date: d.date,
            reason: d.reason || ""
          }))
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('Availability updated successfully!')
        fetchAvailability()
      } else {
        setError(data.message || 'Failed to update availability')
      }
    } catch (err) {
      console.error('Error saving availability:', err)
      setError('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const handleAddUnavailableDate = () => {
    if (!selectedDate) return

    const dateStr = selectedDate.toISOString().split('T')[0]
    const existing = unavailableDates.find(d => d.date?.split('T')[0] === dateStr)
    
    if (existing) {
      setError('This date is already marked as unavailable')
      return
    }

    setUnavailableDates(prev => [...prev, {
      id: Date.now().toString(),
      date: selectedDate.toISOString(),
      reason: dateReason
    }])
    setAddDateDialogOpen(false)
    setSelectedDate(new Date())
    setDateReason("")
  }

  const handleRemoveUnavailableDate = (id) => {
    setUnavailableDates(prev => prev.filter(d => d.id !== id))
  }

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'tutor') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold mb-2">Availability Management</h1>
          <p className="text-muted-foreground">
            Set your weekly availability and block specific dates when you're not available.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Weekly Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Weekly Availability</CardTitle>
              <CardDescription>
                Set your available hours for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS_OF_WEEK.map(day => {
                const daySlots = getSlotsForDay(day.value)

                return (
                  <div key={day.value} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-base">{day.label}</Label>
                      <p className="text-xs text-muted-foreground">Tap to toggle slots</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TIME_RANGES.map((tr) => {
                        const selected = isSlotSelected(day.value, tr.start, tr.end)
                        return (
                          <Button
                            key={`${day.value}-${tr.label}`}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            className={`justify-start ${selected ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" : "bg-transparent"}`}
                            onClick={() => toggleSlot(day.value, tr.start, tr.end)}
                          >
                            <Clock className={`h-4 w-4 mr-2 ${selected ? "text-primary-foreground" : ""}`} />
                            <span className="text-xs">{tr.label}</span>
                          </Button>
                        )
                      })}
                    </div>
                    {daySlots.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No slots selected for this day.</p>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Unavailable Dates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif">Blocked Dates</CardTitle>
                  <CardDescription>
                    Mark specific dates when you're not available
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddDateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Date
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {unavailableDates.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No blocked dates. Click "Add Date" to block a specific date.
                </p>
              ) : (
                <div className="space-y-2">
                  {unavailableDates.map(date => (
                    <div
                      key={date.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {format(new Date(date.date), "PPP")}
                        </p>
                        {date.reason && (
                          <p className="text-sm text-muted-foreground">{date.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUnavailableDate(date.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Availability
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Add Unavailable Date Dialog */}
      <Dialog open={addDateDialogOpen} onOpenChange={setAddDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Date</DialogTitle>
            <DialogDescription>
              Select a date when you won't be available for sessions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                placeholder="e.g., Personal day, Holiday, etc."
                value={dateReason}
                onChange={(e) => setDateReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDateDialogOpen(false)
                setDateReason("")
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUnavailableDate}>
              Add Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

