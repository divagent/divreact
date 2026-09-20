import { adminPassword, adminUsername, apiBaseUrl } from '../config/app'
import type { CalendarItem } from './calendar'
import { fetchTickerProfile } from './ticker'

// Gemini agent read on a single clicked calendar event.
// Backed by POST {VITE_CORE_API}/div_agent/analyze_dividend.
//
// Grounding `facts` are collected ONCE at query/Predict time and stamped onto the
// calendar event, so a click reuses the already-certain facts off the row — no
// re-fetch. Only when the row carries no stored facts (e.g. an event published
// before facts were persisted) do we best-effort fetch the Yahoo profile as a
// fallback. Either way a missing profile never blocks the analysis.

export type AnalysisSource = { title: string; url: string }

export type RiskLabel = 'low' | 'medium' | 'high' | 'unknown'

export type DividendAnalysis = {
  ticker: string
  exDate: string | null
  headline: string
  reasoning: string
  riskLabel: RiskLabel
  sources: AnalysisSource[]
  model?: string
  generatedAt?: string
  // True when the agent found a declaration and silently corrected the public
  // calendar (stale prediction -> declared fact). The UI refreshes on this.
  corrected?: boolean
}

// Build grounding facts from the facts already stored on the calendar row.
// Returns undefined when the row carries none (older events) so the caller can
// fall back to a live Yahoo fetch. trailingYield is derived from ttm / price.
function factsFromItem(item: CalendarItem) {
  const hasStored =
    item.ttmAmount != null ||
    item.companyName != null ||
    (item.pastYearDividends?.length ?? 0) > 0
  if (!hasStored) return undefined

  const trailingYield =
    item.ttmAmount != null && item.price != null && item.price > 0
      ? (item.ttmAmount / item.price) * 100
      : null
  return {
    companyName: item.companyName ?? undefined,
    currency: item.currency ?? undefined,
    price: item.price ?? undefined,
    ttmAmount: item.ttmAmount ?? undefined,
    trailingYield: trailingYield ?? undefined,
    forwardYield: item.forwardYield ?? undefined,
    forwardRate: item.forwardRate ?? undefined,
    pastYearDividends: item.pastYearDividends ?? [],
  }
}

async function loadFacts(symbol: string, signal?: AbortSignal) {
  try {
    const p = await fetchTickerProfile(symbol, signal ?? new AbortController().signal)
    return {
      companyName: p.companyName,
      currency: p.currency,
      price: p.price,
      ttmAmount: p.ttmAmount,
      trailingYield: p.trailingYield,
      forwardYield: p.forwardYield,
      forwardRate: p.forwardRate,
      pastYearDividends: p.pastYearDividends.map((d) => ({ exDate: d.date, amount: d.amount })),
    }
  } catch {
    return undefined // grounding is best-effort; agent falls back to web signals
  }
}

export async function analyzeDividend(
  item: CalendarItem,
  signal?: AbortSignal,
): Promise<DividendAnalysis> {
  const url = new URL('/div_agent/analyze_dividend', apiBaseUrl)

  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (adminPassword) {
    headers.set('Authorization', `Basic ${btoa(`${adminUsername}:${adminPassword}`)}`)
  }

  // Prefer the facts stamped on the row at Predict time; only re-fetch Yahoo
  // when the row has none stored.
  const facts = factsFromItem(item) ?? (await loadFacts(item.ticker, signal))

  const body = {
    ticker: item.ticker,
    exDate: item.exDate,
    amount: item.amount,
    divstatus: item.divstatus,
    confidence: item.confidence,
    summary: item.summary,
    facts,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok) throw new Error(`Analyze API returned ${response.status}`)

  return (await response.json()) as DividendAnalysis
}
