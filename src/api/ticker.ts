import type { DividendEvent, TickerProfile } from '../types/ticker'

// Yahoo Finance is reached through the `/yahoo` prefix so the browser never hits
// query1.finance.yahoo.com directly (it sends no CORS headers). In dev this is
// handled by the Vite proxy (see vite.config.ts); in prod point `/yahoo` at a
// backend/serverless proxy.
const YAHOO_PREFIX = '/yahoo'

type YahooChartResponse = {
  chart: {
    result?: Array<{
      meta: {
        currency?: string
        symbol?: string
        fullExchangeName?: string
        exchangeName?: string
        longName?: string
        shortName?: string
        regularMarketPrice?: number
      }
      events?: {
        dividends?: Record<string, { amount: number; date: number }>
      }
    }>
    error?: { code?: string; description?: string } | null
  }
}

// quoteSummary date fields arrive as { raw: <unix seconds>, fmt: "yyyy-mm-dd" }
// (Yahoo's default, unformatted responses can also send a bare number).
type YahooDate = number | { raw?: number; fmt?: string }

type YahooQuoteSummaryResponse = {
  quoteSummary: {
    result?: Array<{
      assetProfile?: { industry?: string; sector?: string }
      calendarEvents?: { exDividendDate?: YahooDate; dividendDate?: YahooDate }
    }>
    error?: unknown
  }
}

function yahooDateToIso(value: YahooDate | undefined): string | undefined {
  const seconds = typeof value === 'object' ? value?.raw : value
  return typeof seconds === 'number' && seconds > 0 ? toIsoDate(seconds) : undefined
}

const DAY = 86_400_000

function toIsoDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10)
}

async function loadIndustryAndNextExDate(symbol: string, signal: AbortSignal) {
  // quoteSummary is crumb-gated and frequently 401s from a simple proxy; treat
  // everything here as best-effort and never let it break the core profile.
  try {
    const url = new URL(`${YAHOO_PREFIX}/v10/finance/quoteSummary/${symbol}`, window.location.origin)
    url.searchParams.set('modules', 'assetProfile,calendarEvents')

    const response = await fetch(url, { signal })
    if (!response.ok) return {}

    const payload = (await response.json()) as YahooQuoteSummaryResponse
    const result = payload.quoteSummary.result?.[0]
    if (!result) return {}

    return {
      industry: result.assetProfile?.industry,
      nextExDate: yahooDateToIso(result.calendarEvents?.exDividendDate),
    }
  } catch {
    return {}
  }
}

export async function fetchTickerProfile(symbol: string, signal: AbortSignal): Promise<TickerProfile> {
  const url = new URL(`${YAHOO_PREFIX}/v8/finance/chart/${symbol}`, window.location.origin)
  url.searchParams.set('range', '1y')
  url.searchParams.set('interval', '1d')
  url.searchParams.set('events', 'div')

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Yahoo returned ${response.status}`)

  const payload = (await response.json()) as YahooChartResponse
  if (payload.chart.error) throw new Error(payload.chart.error.description ?? 'Unknown symbol')

  const result = payload.chart.result?.[0]
  if (!result) throw new Error(`No data for ${symbol}`)

  const { meta } = result
  const price = Number(meta.regularMarketPrice ?? 0)

  const cutoff = Date.now() - 365 * DAY
  const pastYearDividends: DividendEvent[] = Object.values(result.events?.dividends ?? {})
    .filter((event) => event.date * 1000 >= cutoff)
    .map((event) => ({ date: toIsoDate(event.date), amount: Number(event.amount) }))
    .sort((a, b) => b.date.localeCompare(a.date))

  const ttmAmount = pastYearDividends.reduce((sum, event) => sum + event.amount, 0)
  const paymentsPerYear = pastYearDividends.length
  const latestAmount = pastYearDividends[0]?.amount ?? 0
  const forwardRate = latestAmount * paymentsPerYear

  const trailingYield = price > 0 && ttmAmount > 0 ? (ttmAmount / price) * 100 : undefined
  const forwardYield = price > 0 && forwardRate > 0 ? (forwardRate / price) * 100 : undefined

  const extra = await loadIndustryAndNextExDate(symbol, signal)

  return {
    symbol: (meta.symbol ?? symbol).toUpperCase(),
    companyName: meta.longName ?? meta.shortName ?? symbol.toUpperCase(),
    industry: extra.industry,
    exchange: meta.fullExchangeName ?? meta.exchangeName,
    currency: meta.currency ?? 'USD',
    price,
    pastYearDividends,
    ttmAmount,
    paymentsPerYear,
    trailingYield,
    forwardYield,
    forwardRate,
    nextExDate: extra.nextExDate,
    nextAmount: extra.nextExDate ? latestAmount : undefined,
  }
}

const TICKER_PATTERN = /^[A-Za-z][A-Za-z.-]{0,5}$/

// A bare token like "IBM" or "BRK.B" is treated as a ticker lookup; anything with
// spaces or longer than a symbol is routed to the AI agent instead.
export function isLikelyTicker(input: string) {
  return TICKER_PATTERN.test(input.trim())
}
