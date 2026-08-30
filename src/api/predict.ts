import { adminPassword, adminUsername, apiBaseUrl } from '../config/app'

// Shape returned by POST /div_agent/predict_dividend on the deployed backend.
export type DividendPrediction = {
  symbol: string
  predicted_amount: number | null
  predicted_ex_date: string | null // ISO yyyy-mm-dd
  direction: 'up' | 'down' | 'constant'
  confidence: number // 0..1
  reasoning: string
  sources: string[]
}

export type PredictionResult = {
  symbol: string
  prediction: DividendPrediction
  prediction_id: string
  published: boolean
  google_event_id: string | null
  publish_error: string | null
}

/**
 * Ask the backend to predict the next dividend for `symbol`, publish it to the
 * shared Google Calendar, and persist it. Always hits the deployed core API
 * (`VITE_CORE_API`).
 */
export async function predictDividend(symbol: string, signal?: AbortSignal): Promise<PredictionResult> {
  const url = new URL('/div_agent/predict_dividend', apiBaseUrl)
  url.searchParams.set('symbol', symbol.trim().toUpperCase())

  const headers = new Headers()
  if (adminPassword) {
    headers.set('Authorization', `Basic ${btoa(`${adminUsername}:${adminPassword}`)}`)
  }

  const response = await fetch(url, { method: 'POST', headers, signal })
  if (!response.ok) throw new Error(`Predict API returned ${response.status}`)

  return (await response.json()) as PredictionResult
}
