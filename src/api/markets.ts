// Near-real-time market snapshot quotes, pulled through the same `/yahoo` proxy
// that powers the ticker profile lookup (see api/ticker.ts). The chart endpoint's
// `meta` carries both the latest price and the prior close, which is all we need
// for a headline value + day change — no extra backend.
const YAHOO_PREFIX = '/yahoo'

// 'index' → show the price (ETF proxy for an index); 'rate' → the value already
// IS a percent (e.g. ^TNX = 10Y Treasury yield), so render it as one.
export type QuoteKind = 'index' | 'rate'

export type MarketSymbol = { symbol: string; label: string; kind: QuoteKind }

export type Quote = MarketSymbol & {
  price: number
  previousClose: number
  change: number
  changePercent: number
}

// Index ETFs + the 10Y Treasury yield dividends compete with.
export const MARKET_SYMBOLS: MarketSymbol[] = [
  { symbol: 'SPY', label: 'S&P 500', kind: 'index' },
  { symbol: 'QQQ', label: 'Nasdaq 100', kind: 'index' },
  { symbol: 'DIA', label: 'Dow Jones', kind: 'index' },
  { symbol: '^TNX', label: '10Y Treasury', kind: 'rate' },
]

type ChartMeta = {
  regularMarketPrice?: number
  previousClose?: number
  chartPreviousClose?: number
}

type ChartResponse = {
  chart: { result?: Array<{ meta: ChartMeta }>; error?: { description?: string } | null }
}

export async function fetchQuote(item: MarketSymbol, signal: AbortSignal): Promise<Quote> {
  // encodeURIComponent so index symbols like `^TNX` survive the path (`%5ETNX`).
  const url = new URL(`${YAHOO_PREFIX}/v8/finance/chart/${encodeURIComponent(item.symbol)}`, window.location.origin)
  url.searchParams.set('range', '1d')
  url.searchParams.set('interval', '1d')

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Yahoo returned ${response.status}`)

  const payload = (await response.json()) as ChartResponse
  if (payload.chart.error) throw new Error(payload.chart.error.description ?? `No quote for ${item.symbol}`)

  const meta = payload.chart.result?.[0]?.meta
  if (!meta || meta.regularMarketPrice == null) throw new Error(`No quote for ${item.symbol}`)

  const price = meta.regularMarketPrice
  const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? price
  const change = price - previousClose
  const changePercent = previousClose ? (change / previousClose) * 100 : 0

  return { ...item, price, previousClose, change, changePercent }
}
