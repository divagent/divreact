import { CalendarDays, Filter, Search } from 'lucide-react'
import { dateWindowOptions } from '../config/app'
import type { DateWindow } from '../types/dividend'

export function Filters({
  query,
  dateWindow,
  startDate,
  endDate,
  exchange,
  exchangeOptions,
  onQueryChange,
  onDateWindowChange,
  onStartDateChange,
  onEndDateChange,
  onExchangeChange,
}: {
  query: string
  dateWindow: DateWindow
  startDate: string
  endDate: string
  exchange: string
  exchangeOptions: string[]
  onQueryChange: (value: string) => void
  onDateWindowChange: (value: DateWindow) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onExchangeChange: (value: string) => void
}) {
  return (
    <section className="filter-deck">
      <label className="search-field">
        <Search size={18} />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search symbol or company" />
      </label>

      <div className="segmented-control" aria-label="Date range">
        {dateWindowOptions.map((option) => (
          <button
            className={dateWindow === option.value ? 'active' : ''}
            key={option.value}
            type="button"
            onClick={() => onDateWindowChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="date-field">
        <CalendarDays size={18} />
        <input disabled={dateWindow !== 'custom'} type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
      </label>

      <label className="date-field">
        <CalendarDays size={18} />
        <input disabled={dateWindow !== 'custom'} type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} />
      </label>

      <label className="select-field">
        <Filter size={18} />
        <select value={exchange} onChange={(event) => onExchangeChange(event.target.value)}>
          {exchangeOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'all' ? 'All exchanges' : option}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
