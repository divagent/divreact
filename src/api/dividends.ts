import { apiBaseUrl } from '../config/app'
import type { DividendApiResponse } from '../types/dividend'
import { normalizeDividends } from '../utils/dividends'

export type DividendQuery = {
  startDate: string
  endDate: string
  query: string
  exchange: string
  signal: AbortSignal
}

export async function fetchDividends({ startDate, endDate, query, exchange, signal }: DividendQuery) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    limit: '200',
  })

  if (query.trim()) params.set('search', query.trim())
  if (exchange !== 'all') params.set('exchange', exchange)

  const response = await fetch(`${apiBaseUrl}/dividends?${params.toString()}`, { signal })

  if (!response.ok) throw new Error(`API returned ${response.status}`)

  return normalizeDividends((await response.json()) as DividendApiResponse)
}
