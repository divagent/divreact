import { Sparkles, X } from 'lucide-react'
import type { CalendarItem } from '../api/calendar'
import type { Dividend } from '../types/dividend'
import { formatCurrency, formatDate } from '../utils/formatters'

export function SidePanel({
  watchlist,
  highestYield,
  onSelectSymbol,
  selectedItem,
  onClearSelection,
}: {
  watchlist: string[]
  highestYield?: Dividend
  onSelectSymbol: (symbol: string) => void
  selectedItem?: CalendarItem | null
  onClearSelection?: () => void
}) {
  return (
    <aside className="side-panel">
      {selectedItem ? (
        <div className="agent-analysis">
          <div className="agent-analysis-head">
            <span className="eyebrow" style={{ margin: 0 }}>
              <Sparkles size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
              Agent analysis
            </span>
            {onClearSelection ? (
              <button type="button" className="agent-analysis-close" onClick={onClearSelection} aria-label="Close analysis">
                <X size={16} />
              </button>
            ) : null}
          </div>

          <h3 style={{ margin: '2px 0 0' }}>{selectedItem.symbol}</h3>
          <p className="ticker-sub" style={{ margin: 0 }}>
            Ex-date {formatDate(selectedItem.exDate)}
            {selectedItem.amount != null ? ` · ${formatCurrency(selectedItem.amount)}` : ''}
          </p>

          <div className="agent-analysis-body">
            <p className="agent-analysis-label">Reasoning</p>
            <p className="agent-analysis-placeholder">
              Agent reasoning for {selectedItem.symbol} will appear here — payment
              history, cadence stability, coverage, and confidence behind this
              {selectedItem.kind === 'prediction' ? ' predicted' : ''} ex-date.
            </p>
          </div>
        </div>
      ) : null}

      <div>
        <p className="eyebrow">Saved symbols</p>
        <h3>Watchlist</h3>
      </div>
      {watchlist.length ? (
        <div className="watchlist">
          {watchlist.map((symbol) => (
            <button key={symbol} type="button" onClick={() => onSelectSymbol(symbol)}>
              {symbol}
            </button>
          ))}
        </div>
      ) : (
        <p>No symbols saved yet.</p>
      )}

      <div className="insight-card">
        <span>Highest yield</span>
        <strong>{highestYield?.symbol ?? 'N/A'}</strong>
      </div>

      <div>
        <p className="eyebrow">Market calendars</p>
        <div className="calendar-links">
          <a href="#">Earnings</a>
          <a href="#">IPO Calendar</a>
          <a href="#">Economic</a>
          <a href="#">Stock splits</a>
        </div>
      </div>
    </aside>
  )
}
