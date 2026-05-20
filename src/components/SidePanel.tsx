import type { Dividend } from '../types/dividend'

export function SidePanel({
  watchlist,
  highestYield,
  onSelectSymbol,
}: {
  watchlist: string[]
  highestYield?: Dividend
  onSelectSymbol: (symbol: string) => void
}) {
  return (
    <aside className="side-panel">
      <div>
        <p className="eyebrow">Saved symbols</p>
        <h2>Watchlist</h2>
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
