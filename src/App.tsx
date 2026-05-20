import { useEffect, useMemo, useState } from 'react'
import { streamAiQuery } from './api/ai'
import { fetchDividends } from './api/dividends'
import { AiAgentPanel } from './components/AiAgentPanel'
import { AppHeader } from './components/AppHeader'
import { DividendDrawer } from './components/DividendDrawer'
import { DividendTable } from './components/DividendTable'
import { Filters } from './components/Filters'
import { SidePanel } from './components/SidePanel'
import { SignalBoard } from './components/SignalBoard'
import { defaultWatchlist, queryPresets, themeVars } from './config/app'
import { sampleDividends } from './data/sampleDividends'
import type { DateWindow, Dividend, SortDirection } from './types/dividend'
import { filterAndSortDividends, getExchangeOptions, getHighestYield, getNextPayment } from './utils/dividends'
import { addDays, formatCurrency, formatPercent } from './utils/formatters'

export function App() {
    const today = new Date().toISOString().slice(0, 10)
    const [query, setQuery] = useState('')
    const [dateWindow, setDateWindow] = useState<DateWindow>('week')
    const [startDate, setStartDate] = useState(today)
    const [endDate, setEndDate] = useState(addDays(today, 7))
    const [exchange, setExchange] = useState('all')
    const [pageSize, setPageSize] = useState(10)
    const [page, setPage] = useState(1)
    const [sortKey, setSortKey] = useState<keyof Dividend>('exDividendDate')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
    const [selectedDividend, setSelectedDividend] = useState<Dividend | null>(null)
    const [watchlist, setWatchlist] = useState<string[]>(defaultWatchlist)
    const [dividends, setDividends] = useState<Dividend[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [aiPrompt, setAiPrompt] = useState(queryPresets[0])
    const [aiOutput, setAiOutput] = useState('Ask the AI Agent to interpret the current calendar, watchlist, and filters.')
    const [isAiStreaming, setIsAiStreaming] = useState(false)

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

        async function loadDividends() {
            setIsLoading(true)
            setError('')

            try {
                const nextDividends = await fetchDividends({
                    startDate,
                    endDate,
                    query,
                    exchange,
                    signal: controller.signal,
                })
                setDividends(nextDividends)
            } catch (fetchError) {
                if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return

                setError('Live API unavailable. Showing sample dividend calendar data.')
                setDividends(sampleDividends)
            } finally {
                setIsLoading(false)
            }
        }

        loadDividends()

        return () => controller.abort()
    }, [startDate, endDate, query, exchange])

    useEffect(() => setPage(1), [query, startDate, endDate, exchange, pageSize])

    const exchangeOptions = useMemo(() => getExchangeOptions(dividends), [dividends])
    const filteredDividends = useMemo(
        () => filterAndSortDividends(dividends, query, exchange, sortKey, sortDirection),
        [dividends, exchange, query, sortDirection, sortKey],
    )

    const totalPages = Math.max(1, Math.ceil(filteredDividends.length / pageSize))
    const pageDividends = filteredDividends.slice((page - 1) * pageSize, page * pageSize)
    const visibleStart = filteredDividends.length ? (page - 1) * pageSize + 1 : 0
    const visibleEnd = Math.min(page * pageSize, filteredDividends.length)
    const highYieldCount = filteredDividends.filter((dividend) => Number(dividend.yield ?? 0) >= 5).length
    const confirmedCount = filteredDividends.filter((dividend) => dividend.status === 'Confirmed').length
    const nextPayment = getNextPayment(filteredDividends)
    const highestYield = getHighestYield(filteredDividends)
    const averageYield =
        filteredDividends.length > 0
            ? filteredDividends.reduce((sum, dividend) => sum + Number(dividend.yield ?? 0), 0) / filteredDividends.length
            : 0

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

    async function runAiQuery() {
        if (!aiPrompt.trim() || isAiStreaming) return

        setIsAiStreaming(true)
        setAiOutput('')

        await streamAiQuery(
            {
                prompt: aiPrompt,
                filters: { startDate, endDate, exchange, search: query },
                watchlist,
                dividends: filteredDividends.slice(0, 30),
            },
            (chunk) => setAiOutput((current) => current + chunk),
            (chunk) => setAiOutput((current) => current + chunk),
        )

        setIsAiStreaming(false)
    }

    return (
        <main className="app-shell" style={themeVars}>
            <AppHeader onExport={exportCsv} />

            <SignalBoard
                eventCount={filteredDividends.length}
                confirmedCount={confirmedCount}
                highYieldCount={highYieldCount}
                averageYield={formatPercent(averageYield)}
            />

            <Filters
                query={query}
                dateWindow={dateWindow}
                startDate={startDate}
                endDate={endDate}
                exchange={exchange}
                exchangeOptions={exchangeOptions}
                onQueryChange={setQuery}
                onDateWindowChange={setDateWindow}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onExchangeChange={setExchange}
            />

            {error ? <div className="notice">{error}</div> : null}

            <section className="workspace-grid">
                <div className="main-stack">
                    <AiAgentPanel
                        prompt={aiPrompt}
                        output={aiOutput}
                        isStreaming={isAiStreaming}
                        onPromptChange={setAiPrompt}
                        onRun={runAiQuery}
                    />

                    <DividendTable
                        dividends={pageDividends}
                        isLoading={isLoading}
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        watchlist={watchlist}
                        page={page}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        visibleStart={visibleStart}
                        visibleEnd={visibleEnd}
                        totalCount={filteredDividends.length}
                        nextPaymentSymbol={nextPayment?.symbol}
                        onOpen={setSelectedDividend}
                        onSort={handleSort}
                        onToggleWatchlist={toggleWatchlist}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                    />
                </div>

                <SidePanel watchlist={watchlist} highestYield={highestYield} onSelectSymbol={setQuery} />
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
