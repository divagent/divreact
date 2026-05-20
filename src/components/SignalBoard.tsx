import { BadgeDollarSign, CalendarDays, Sparkles, TrendingUp } from 'lucide-react'
import { Metric } from './Metric'

export function SignalBoard({
  eventCount,
  confirmedCount,
  highYieldCount,
  averageYield,
}: {
  eventCount: number
  confirmedCount: number
  highYieldCount: number
  averageYield: string
}) {
  return (
    <section className="signal-board" aria-label="Dividend summary">
      <Metric icon={<CalendarDays size={20} />} label="Events" value={eventCount.toString()} />
      <Metric icon={<BadgeDollarSign size={20} />} label="Confirmed" value={confirmedCount.toString()} />
      <Metric icon={<TrendingUp size={20} />} label="High yield" value={highYieldCount.toString()} />
      <Metric icon={<Sparkles size={20} />} label="Average yield" value={averageYield} />
    </section>
  )
}
