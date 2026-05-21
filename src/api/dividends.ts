import { adminPassword, adminUsername, apiBaseUrl } from '../config/app'
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
    const url = new URL('/div_show/list', apiBaseUrl)
    url.search = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        limit: '200',
    }).toString()

    if (query.trim()) url.searchParams.set('search', query.trim())
    if (exchange !== 'all') url.searchParams.set('exchange', exchange)

    const headers = new Headers()
    if (adminPassword) {
        headers.set('Authorization', `Basic ${btoa(`${adminUsername}:${adminPassword}`)}`)
    }

    const response = await fetch(url, { headers, signal })

    if (!response.ok) throw new Error(`API returned ${response.status}`)

    return normalizeDividends((await response.json()) as DividendApiResponse)
}
