import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  Search,
  Star,
  X,
} from 'lucide-react'
import './style.css'

type Dividend = {
  symbol: string
  companyName: string
  exDividendDate: string
  recordDate?: string
  paymentDate?: string
  declarationDate?: string
  amount: number
  yield?: number
  frequency?: string
  exchange?: string
  status?: string
}

type ApiDividend = Partial<Dividend> & {
  company?: string
  company_name?: string
  ex_date?: string
  exDividendDate?: string
  record_date?: string
  payment_date?: string
  declaration_date?: string
  dividend?: number
  dividend_amount?: number
  dividend_yield?: number
}

type ApiResponse = ApiDividend[] | { data?: ApiDividend[]; results?: ApiDividend[]; items?: ApiDividend[]; total?: number }

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const pageSizeOptions = [10, 25, 50]

const sampleDividends: Dividend[] = [
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    exDividendDate: '2026-05-20',
    recordDate: '2026-05-21',
    paymentDate: '2026-06-11',
    declarationDate: '2026-03-12',
    amount: 0.83,
    yield: 0.72,
    frequency: 'Quarterly',
    exchange: 'NASDAQ',
    status: 'Confirmed',
  },
  {
    symbol: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    exDividendDate: '2026-05-21',
    recordDate: '2026-05-22',
    paymentDate: '2026-06-30',
    declarationDate: '2026-04-16',
    amount: 1.4,
    yield: 2.1,
    frequency: 'Quarterly',
    exchange: 'NYSE',
    status: 'Confirmed',
  },
  {
    symbol: 'KO',
    companyName: 'The Coca-Cola Company',
    exDividendDate: '2026-05-23',
    recordDate: '2026-05-26',
    paymentDate: '2026-07-01',
    declarationDate: '2026-04-24',
    amount: 0.51,
    yield: 3.05,
    frequency: 'Quarterly',
    exchange: 'NYSE',
    status: 'Estimated',
  },
  {
    symbol: 'T',
    companyName: 'AT&T Inc.',
    exDividendDate: '2026-05-24',
    recordDate: '2026-05-27',
    paymentDate: '2026-07-03',
    declarationDate: '2026-04-28',
    amount: 0.28,
    yield: 5.84,
    frequency: 'Quarterly',
    exchange: 'NYSE',
    status: 'Confirmed',
  },
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    exDividendDate: '2026-05-28',
    recordDate: '2026-05-29',
    paymentDate: '2026-06-12',
    declarationDate: '2026-05-05',
    amount: 0.26,
    yield: 0.51,
    frequency: 'Quarterly',
    exchange: 'NASDAQ',
    status: 'Confirmed',
  },
  {
    symbol: 'VZ',
    companyName: 'Verizon Communications Inc.',
    exDividendDate: '2026-05-29',
    recordDate: '2026-06-01',
    paymentDate: '2026-07-10',
    declarationDate: '2026-05-07',
    amount: 0.68,
    yield: 6.34,
    frequency: 'Quarterly',
    exchange: 'NYSE',
    status: 'Estimated',
  },
]

const dateWindowOptions = [
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'Custom', value: 'custom' },
]

function App() {
  const today = new Date().toISOString().slice(0, 10)
  const [query, setQuery] = useState('')
  const [dateWindow, setDateWindow] = useState('week')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(addDays(today, 7))
  const [exchange, setExchange] = useState('all')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<keyof Dividend>('exDividendDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedDividend, setSelectedDividend] = useState<Dividend | null>(null)
  const [watchlist, setWatchlist] = useState<string[]>(['MSFT', 'KO'])
  const [dividends, setDividends] = useState<Dividend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (dateWindow === 'today') {
      setStartDate(today)
      setEndDate(today)
    }

    if (dateWindow === 'week') {
      setStartDate(today)
      setEndDate(addDays(today, 7))
    }

    if (dateWindow === 'month') {
      setStartDate(today)
      setEndDate(addDays(today, 30))
    }
  }, [dateWindow, today])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchDividends() {
      setIsLoading(true)
      setError('')

      try {
        const params = new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
          limit: '200',
        })

        if (query.trim()) params.set('search', query.trim())
        if (exchange !== 'all') params.set('exchange', exchange)

        const response = await fetch(`${apiBaseUrl}/dividends?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`API returned ${response.status}`)

        const payload = (await response.json()) as ApiResponse
        const nextDividends = normalizeDividends(payload)
        setDividends(nextDividends)
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return

        setError('Live API unavailable. Showing sample dividend calendar data.')
        setDividends(sampleDividends)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDividends()

    return () => controller.abort()
  }, [startDate, endDate, query, exchange])

  useEffect(() => setPage(1), [query, startDate, endDate, exchange, pageSize])

  const exchangeOptions = useMemo(() => {
    const exchanges = new Set(dividends.map((dividend) => dividend.exchange).filter(Boolean))
    return ['all', ...Array.from(exchanges)] as string[]
  }, [dividends])

  const filteredDividends = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return dividends
      .filter((dividend) => {
        const matchesQuery =
          !normalizedQuery ||
          dividend.symbol.toLowerCase().includes(normalizedQuery) ||
          dividend.companyName.toLowerCase().includes(normalizedQuery)
        const matchesExchange = exchange === 'all' || dividend.exchange === exchange
        return matchesQuery && matchesExchange
      })
      .sort((a, b) => {
        const first = a[sortKey]
        const second = b[sortKey]

        if (typeof first === 'number' && typeof second === 'number') {
          return sortDirection === 'asc' ? first - second : second - first
        }

        return sortDirection === 'asc'
          ? String(first ?? '').localeCompare(String(second ?? ''))
          : String(second ?? '').localeCompare(String(first ?? ''))
      })
  }, [dividends, exchange, query, sortDirection, sortKey])

  const totalPages = Math.max(1, Math.ceil(filteredDividends.length / pageSize))
  const pageDividends = filteredDividends.slice((page - 1) * pageSize, page * pageSize)
  const visibleStart = filteredDividends.length ? (page - 1) * pageSize + 1 : 0
  const visibleEnd = Math.min(page * pageSize, filteredDividends.length)

  const highYieldCount = filteredDividends.filter((dividend) => Number(dividend.yield ?? 0) >= 5).length
  const confirmedCount = filteredDividends.filter((dividend) => dividend.status === 'Confirmed').length
  const nextPayment = filteredDividends
    .filter((dividend) => dividend.paymentDate)
    .sort((a, b) => String(a.paymentDate).localeCompare(String(b.paymentDate)))[0]

  function handleSort(nextKey: keyof Dividend) {
    if (sortKey === nextKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      return
    }

    setSortKey(nextKey)
    setSortDirection('asc')
  }

  function toggleWatchlist(symbol: string) {
    setWatchlist((current) =>
      current.includes(symbol) ? current.filter((item) => item !== symbol) : [...current, symbol],
    )
  }

  function exportCsv() {
    const rows = [
      ['Symbol', 'Company', 'Ex-Date', 'Record Date', 'Payment Date', 'Amount', 'Yield', 'Frequency', 'Exchange'],
      ...filteredDividends.map((dividend) => [
        dividend.symbol,
        dividend.companyName,
        dividend.exDividendDate,
        dividend.recordDate ?? '',
        dividend.paymentDate ?? '',
        formatCurrency(dividend.amount),
        formatPercent(dividend.yield),
        dividend.frequency ?? '',
        dividend.exchange ?? '',
      ]),
    ]

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dividends-${startDate}-${endDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="app-shell">
      <section className="toolbar-band">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Market activity</p>
            <h1>Dividends Calendar</h1>
          </div>
          <button className="icon-text-button" type="button" onClick={exportCsv}>
            <Download size={18} />
            Export
          </button>
        </div>

        <div className="summary-grid" aria-label="Calendar summary">
          <Metric label="Events" value={filteredDividends.length.toString()} />
          <Metric label="Confirmed" value={confirmedCount.toString()} />
          <Metric label="High yield" value={highYieldCount.toString()} />
          <Metric label="Next payment" value={nextPayment?.symbol ?? 'None'} />
        </div>

        <div className="filters">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search symbol or company"
            />
          </label>

          <div className="segmented-control" aria-label="Date range">
            {dateWindowOptions.map((option) => (
              <button
                className={dateWindow === option.value ? 'active' : ''}
                key={option.value}
                type="button"
                onClick={() => setDateWindow(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="date-field">
            <CalendarDays size={18} />
            <input
              disabled={dateWindow !== 'custom'}
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="date-field">
            <CalendarDays size={18} />
            <input
              disabled={dateWindow !== 'custom'}
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>

          <label className="select-field">
            <Filter size={18} />
            <select value={exchange} onChange={(event) => setExchange(event.target.value)}>
              {exchangeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All exchanges' : option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error ? <div className="notice">{error}</div> : null}

      <section className="content-grid">
        <div className="table-panel">
          <div className="table-header">
            <div>
              <h2>Upcoming dividends</h2>
              <p>
                Showing {visibleStart}-{visibleEnd} of {filteredDividends.length}
              </p>
            </div>
            <label>
              Show
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="state-panel">
              <Loader2 className="spin" size={28} />
              <span>Loading dividend calendar</span>
            </div>
          ) : pageDividends.length ? (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <SortableTh label="Symbol" sortKey="symbol" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortableTh
                        label="Company"
                        sortKey="companyName"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                      <SortableTh
                        label="Ex-date"
                        sortKey="exDividendDate"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                      <th>Record</th>
                      <th>Payment</th>
                      <SortableTh label="Amount" sortKey="amount" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortableTh label="Yield" sortKey="yield" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      <th>Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageDividends.map((dividend) => (
                      <tr key={`${dividend.symbol}-${dividend.exDividendDate}`} onClick={() => setSelectedDividend(dividend)}>
                        <td>
                          <div className="symbol-cell">
                            <button
                              className={watchlist.includes(dividend.symbol) ? 'star-button active' : 'star-button'}
                              type="button"
                              aria-label={`Toggle ${dividend.symbol} watchlist`}
                              onClick={(event) => {
                                event.stopPropagation()
                                toggleWatchlist(dividend.symbol)
                              }}
                            >
                              <Star size={16} />
                            </button>
                            <strong>{dividend.symbol}</strong>
                          </div>
                        </td>
                        <td>{dividend.companyName}</td>
                        <td>{formatDate(dividend.exDividendDate)}</td>
                        <td>{formatDate(dividend.recordDate)}</td>
                        <td>{formatDate(dividend.paymentDate)}</td>
                        <td>{formatCurrency(dividend.amount)}</td>
                        <td>
                          <span className={Number(dividend.yield ?? 0) >= 5 ? 'yield-pill high' : 'yield-pill'}>
                            {formatPercent(dividend.yield)}
                          </span>
                        </td>
                        <td>{dividend.frequency ?? 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  <ChevronLeft size={18} />
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="state-panel">
              <CalendarDays size={28} />
              <span>No dividend reports found for this date range.</span>
            </div>
          )}
        </div>

        <aside className="side-panel">
          <h2>Watchlist</h2>
          {watchlist.length ? (
            <div className="watchlist">
              {watchlist.map((symbol) => (
                <button key={symbol} type="button" onClick={() => setQuery(symbol)}>
                  {symbol}
                </button>
              ))}
            </div>
          ) : (
            <p>No symbols saved yet.</p>
          )}

          <h2>Other calendars</h2>
          <div className="calendar-links">
            <a href="#">Earnings</a>
            <a href="#">IPO Calendar</a>
            <a href="#">Economic</a>
            <a href="#">Stock splits</a>
          </div>
        </aside>
      </section>

      {selectedDividend ? (
        <DividendDrawer
          dividend={selectedDividend}
          isWatched={watchlist.includes(selectedDividend.symbol)}
          onClose={() => setSelectedDividend(null)}
          onToggleWatchlist={toggleWatchlist}
        />
      ) : null}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function SortableTh({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string
  sortKey: keyof Dividend
  activeKey: keyof Dividend
  direction: 'asc' | 'desc'
  onSort: (key: keyof Dividend) => void
}) {
  const indicator = activeKey === sortKey ? (direction === 'asc' ? '↑' : '↓') : ''

  return (
    <th>
      <button type="button" onClick={() => onSort(sortKey)}>
        {label} {indicator}
      </button>
    </th>
  )
}

function DividendDrawer({
  dividend,
  isWatched,
  onClose,
  onToggleWatchlist,
}: {
  dividend: Dividend
  isWatched: boolean
  onClose: () => void
  onToggleWatchlist: (symbol: string) => void
}) {
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <section className="drawer" onClick={(event) => event.stopPropagation()}>
        <button className="close-button" type="button" aria-label="Close details" onClick={onClose}>
          <X size={20} />
        </button>
        <p className="eyebrow">{dividend.exchange ?? 'Market'} dividend</p>
        <h2>
          {dividend.symbol}
          <span>{dividend.companyName}</span>
        </h2>
        <button className="icon-text-button full" type="button" onClick={() => onToggleWatchlist(dividend.symbol)}>
          <Star size={18} />
          {isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
        </button>

        <div className="drawer-stats">
          <Metric label="Amount" value={formatCurrency(dividend.amount)} />
          <Metric label="Yield" value={formatPercent(dividend.yield)} />
          <Metric label="Status" value={dividend.status ?? 'N/A'} />
        </div>

        <dl className="date-list">
          <div>
            <dt>Declaration date</dt>
            <dd>{formatDate(dividend.declarationDate)}</dd>
          </div>
          <div>
            <dt>Ex-dividend date</dt>
            <dd>{formatDate(dividend.exDividendDate)}</dd>
          </div>
          <div>
            <dt>Record date</dt>
            <dd>{formatDate(dividend.recordDate)}</dd>
          </div>
          <div>
            <dt>Payment date</dt>
            <dd>{formatDate(dividend.paymentDate)}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

function normalizeDividends(payload: ApiResponse): Dividend[] {
  const rows: ApiDividend[] = Array.isArray(payload) ? payload : payload.data ?? payload.results ?? payload.items ?? []

  return rows.map((row) => ({
    symbol: String(row.symbol ?? '').toUpperCase(),
    companyName: String(row.companyName ?? row.company_name ?? row.company ?? 'Unknown company'),
    exDividendDate: String(row.exDividendDate ?? row.ex_date ?? ''),
    recordDate: row.recordDate ?? row.record_date,
    paymentDate: row.paymentDate ?? row.payment_date,
    declarationDate: row.declarationDate ?? row.declaration_date,
    amount: Number(row.amount ?? row.dividend_amount ?? row.dividend ?? 0),
    yield: row.yield ?? row.dividend_yield,
    frequency: row.frequency,
    exchange: row.exchange,
    status: row.status,
  }))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatPercent(value?: number) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return 'N/A'
  return `${Number(value).toFixed(2)}%`
}

function formatDate(value?: string) {
  if (!value) return 'N/A'

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
