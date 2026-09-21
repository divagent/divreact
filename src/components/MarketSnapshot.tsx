import { useEffect, useState } from 'react'
import { Loader2, TrendingDown, TrendingUp } from 'lucide-react'
import { fetchQuote, MARKET_SYMBOLS, type Quote } from '../api/markets'

// Idle-state right pane: a live markets snapshot (indices + 10Y yield) that gives
// market-wide context you can't read off the dividend calendar. Refreshes on a
// 60s timer while mounted. Shown only when no calendar row is selected — the
// per-row agent analysis takes over that space on click (unchanged).
export function MarketSnapshot() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      // allSettled so one bad symbol (e.g. a stale ^TNX) doesn't blank the rest.
      const settled = await Promise.allSettled(MARKET_SYMBOLS.map((s) => fetchQuote(s, controller.signal)))
      if (controller.signal.aborted) return
      const ok = settled
        .filter((r): r is PromiseFulfilledResult<Quote> => r.status === 'fulfilled')
        .map((r) => r.value)
      if (ok.length) {
        setQuotes(ok)
        setError(null)
      } else {
        setError('Markets unavailable')
      }
      setLoading(false)
    }

    load()
    const timer = window.setInterval(load, 60_000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [])

  return (
    <div className="market-snapshot">
      <p className="eyebrow" style={{ margin: 0 }}>
        Markets
      </p>

      {loading && !quotes.length ? (
        <p className="agent-analysis-placeholder" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 className="spin" size={14} /> Loading markets…
        </p>
      ) : error && !quotes.length ? (
        <p className="agent-analysis-placeholder">{error}</p>
      ) : (
        <ul className="market-list">
          {quotes.map((q) => {
            const up = q.change >= 0
            const color = up ? 'var(--success)' : 'var(--error-text)'
            return (
              <li key={q.symbol}>
                <span className="market-name">{q.label}</span>
                <span className="market-value">
                  {q.kind === 'rate'
                    ? `${q.price.toFixed(2)}%`
                    : q.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="market-change" style={{ color }}>
                  {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {q.kind === 'rate'
                    ? `${up ? '+' : ''}${q.change.toFixed(2)}`
                    : `${up ? '+' : ''}${q.changePercent.toFixed(2)}%`}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
