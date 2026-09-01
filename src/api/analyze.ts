import { adminPassword, adminUsername, apiBaseUrl } from '../config/app'
import type { CalendarItem } from './calendar'
import { fetchTickerProfile } from './ticker'

// Gemini agent read on a single clicked calendar event.
// Backed by POST {VITE_CORE_API}/div_agent/analyze_dividend.
//
// Before asking, we best-effort fetch the ticker's authoritative Yahoo profile
// (price + trailing dividends) and pass it as `facts` so the agent grounds its
// read in the real yield/amount trend instead of hallucinating. A profile-fetch
// failure never blocks the analysis — the agent still runs on web signals.

export type AnalysisSource = { title: string; url: string }

export type RiskLabel = 'low' | 'medium' | 'high' | 'unknown'

export type DividendAnalysis = {
  symbol: string
  exDate: string | null
  headline: string
  reasoning: string
  riskLabel: RiskLabel
  sources: AnalysisSource[]
  model?: string
  generatedAt?: string
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

  const facts = await loadFacts(item.symbol, signal)

  const body = {
    symbol: item.symbol,
    exDate: item.exDate,
    amount: item.amount,
    kind: item.kind,
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
