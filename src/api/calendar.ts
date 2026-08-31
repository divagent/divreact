import { adminPassword, adminUsername, apiBaseUrl } from '../config/app'

// Reads the app's published dividend events back out of the Google Calendar
// (the same events the Predict button writes). Backed by
// GET {VITE_CORE_API}/div_agent/calendar_upcoming?days=30.

export type CalendarKind = 'fact' | 'estimate' | 'prediction'

export type CalendarItem = {
  exDate: string
  symbol: string
  amount: number | null
  kind: CalendarKind
  confidence: number | null
  summary: string
  googleEventId: string | null
  htmlLink: string | null
}

export type UpcomingCalendar = {
  startDate: string
  endDate: string
  items: CalendarItem[]
  errors: string[]
}

export async function fetchUpcomingCalendar(
  days = 30,
  signal?: AbortSignal,
): Promise<UpcomingCalendar> {
  const url = new URL('/div_agent/calendar_upcoming', apiBaseUrl)
  url.searchParams.set('days', String(days))

  const headers = new Headers()
  if (adminPassword) {
    headers.set('Authorization', `Basic ${btoa(`${adminUsername}:${adminPassword}`)}`)
  }

  const response = await fetch(url, { headers, signal })
  if (!response.ok) throw new Error(`Calendar API returned ${response.status}`)

  return (await response.json()) as UpcomingCalendar
}
