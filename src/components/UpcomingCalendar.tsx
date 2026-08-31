import { useEffect, useState, type CSSProperties } from 'react'
import { CalendarDays, ExternalLink, Loader2, TriangleAlert } from 'lucide-react'
import { fetchUpcomingCalendar, type CalendarItem, type CalendarKind } from '../api/calendar'
import { formatCurrency, formatDate } from '../utils/formatters'

const KIND_LABEL: Record<CalendarKind, string> = {
  fact: 'Confirmed',
  estimate: 'Estimate',
  prediction: 'Prediction',
}

const KIND_COLOR: Record<CalendarKind, string> = {
  fact: 'var(--success)',
  estimate: 'var(--muted)',
  prediction: 'var(--brand-dark)',
}

const pill = (kind: CalendarKind): CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  color: KIND_COLOR[kind],
  border: `1px solid ${KIND_COLOR[kind]}`,
})

export function UpcomingCalendar({ days = 30, refreshKey = 0 }: { days?: number; refreshKey?: number }) {
  const [items, setItems] = useState<CalendarItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await fetchUpcomingCalendar(days, controller.signal)
        setItems(result.items)
        // Backend reports config/connectivity problems in `errors` (never 500s).
        if (!result.items.length && result.errors.length) setError(result.errors[0])
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return
        setError((fetchError as Error).message)
      } finally {
        setIsLoading(false)
      }
    }

    load()
    return () => controller.abort()
    // refreshKey bumps after a successful predict so the new events show without a reload.
  }, [days, refreshKey])

  return (
    <section className="table-panel">
      <div className="table-header">
        <div>
          <h2>Upcoming dividends</h2>
          <p className="ticker-sub" style={{ margin: 0 }}>
            From the calendar · next {days} days
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="state-panel">
          <Loader2 className="spin" size={28} />
          <span>Loading calendar</span>
        </div>
      ) : error ? (
        <div className="state-panel">
          <TriangleAlert size={28} />
          <span>{error}</span>
        </div>
      ) : items.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Ex-date</th>
                <th>Symbol</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Confidence</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.googleEventId ?? `${item.symbol}-${item.exDate}`}>
                  <td>{formatDate(item.exDate)}</td>
                  <td>
                    <strong>{item.symbol}</strong>
                  </td>
                  <td>{item.amount != null ? formatCurrency(item.amount) : '—'}</td>
                  <td>
                    <span style={pill(item.kind)}>{KIND_LABEL[item.kind]}</span>
                  </td>
                  <td>{item.kind === 'prediction' && item.confidence != null ? `${Math.round(item.confidence * 100)}%` : '—'}</td>
                  <td>
                    {item.htmlLink ? (
                      <a href={item.htmlLink} target="_blank" rel="noreferrer" title="Open in Google Calendar" style={{ color: 'var(--muted)' }}>
                        <ExternalLink size={14} />
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="state-panel">
          <CalendarDays size={28} />
          <span>No dividends on the calendar for the next {days} days.</span>
        </div>
      )}
    </section>
  )
}
