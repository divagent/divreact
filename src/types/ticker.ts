export type DividendEvent = {
  date: string // ISO yyyy-mm-dd (ex-dividend date)
  amount: number
}

export type TickerProfile = {
  symbol: string
  companyName: string
  industry?: string
  exchange?: string
  currency: string
  price: number
  // trailing 12-month history (most recent first)
  pastYearDividends: DividendEvent[]
  ttmAmount: number
  paymentsPerYear: number
  trailingYield?: number // %
  forwardYield?: number // %
  forwardRate?: number // annualized $/share
  // best-effort, crumb-gated fields (may be undefined)
  nextExDate?: string
  nextAmount?: number
}
