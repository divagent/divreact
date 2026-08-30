import { useState, type CSSProperties } from 'react'
import { CalendarCheck, Loader2, Sparkles, TriangleAlert } from 'lucide-react'
import { predictDividend, type PredictionResult } from '../api/predict'
import { formatCurrency, formatDate } from '../utils/formatters'

// All styles are inline and width-constrained on purpose: this block must never
// widen the ticker card / left column (which would push the side panel off-screen),
// and it must not touch any global CSS.
const wrap: CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginTop: 16,
  maxWidth: '100%',
  minWidth: 0,
  width: '100%',
}

const buttonRow: CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'flex-end',
  maxWidth: '100%',
  minWidth: 0,
  width: '100%',
}

const resultBox: CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  maxWidth: '100%',
  minWidth: 0,
  width: '100%',
}

const DIRECTION_ARROW: Record<PredictionResult['prediction']['direction'], string> = {
  up: '↑',
  down: '↓',
  constant: '→',
}

export function PredictDividendButton({ symbol }: { symbol: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    if (isLoading) return
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      setResult(await predictDividend(symbol))
    } catch (runError) {
      setError((runError as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const prediction = result?.prediction
  const confidencePct = prediction ? Math.round(prediction.confidence * 100) : 0

  return (
    <div style={wrap}>
      <div style={buttonRow}>
        <button className="primary-button" type="button" onClick={run} disabled={isLoading} style={{ maxWidth: '100%' }}>
          {isLoading ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
          {isLoading ? 'Predicting…' : 'Predict & add to calendar'}
        </button>
      </div>

      {error ? (
        <div style={{ ...resultBox, color: 'var(--error-text)', fontSize: 13, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TriangleAlert size={14} /> {error}
        </div>
      ) : null}

      {prediction ? (
        <div style={resultBox}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
            <strong style={{ fontSize: 20 }}>
              {prediction.predicted_amount != null ? formatCurrency(prediction.predicted_amount) : 'Amount TBD'}
            </strong>
            <span style={{ fontSize: 14, textTransform: 'capitalize' }}>
              {DIRECTION_ARROW[prediction.direction]} {prediction.direction}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>
              {confidencePct}% confidence
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: 'var(--muted)', minWidth: 0 }}>
            <span>Ex-date: {prediction.predicted_ex_date ? formatDate(prediction.predicted_ex_date) : '—'}</span>
            {result?.published ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--success)' }}>
                <CalendarCheck size={14} /> Published to calendar
              </span>
            ) : result?.publish_error ? (
              <span style={{ color: 'var(--faint)' }}>Not published: {result.publish_error}</span>
            ) : null}
          </div>

          {prediction.reasoning ? (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, minWidth: 0, overflowWrap: 'anywhere' }}>
              {prediction.reasoning}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
