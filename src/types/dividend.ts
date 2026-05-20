export type Dividend = {
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

export type ApiDividend = Partial<Dividend> & {
  company?: string
  company_name?: string
  ex_date?: string
  record_date?: string
  payment_date?: string
  declaration_date?: string
  dividend?: number
  dividend_amount?: number
  dividend_yield?: number
}

export type DividendApiResponse = ApiDividend[] | { data?: ApiDividend[]; results?: ApiDividend[]; items?: ApiDividend[] }

export type SortDirection = 'asc' | 'desc'
export type DateWindow = 'today' | 'week' | 'month' | 'custom'
