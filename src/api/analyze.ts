import { adminPassword, adminUsername, apiBaseUrl } from '../config/app'
import type { CalendarItem } from './calendar'

// Gemini agent read on a single clicked calendar event.
// Backed by POST {VITE_CORE_API}/div_agent/analyze_dividend.

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

export async function analyzeDividend(
  item: CalendarItem,
  signal?: AbortSignal,
): Promise<DividendAnalysis> {
  const url = new URL('/div_agent/analyze_dividend', apiBaseUrl)

  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (adminPassword) {
    headers.set('Authorization', `Basic ${btoa(`${adminUsername}:${adminPassword}`)}`)
  }

  const body = {
    symbol: item.symbol,
    exDate: item.exDate,
    amount: item.amount,
    kind: item.kind,
    confidence: item.confidence,
    summary: item.summary,
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
