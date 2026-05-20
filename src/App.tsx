import { useEffect, useMemo, useState } from 'react'
import { streamAiQuery } from './api/ai'
import { fetchDividends } from './api/dividends'
import { AiAgentPanel } from './components/AiAgentPanel'
import { AppHeader } from './components/AppHeader'
import { DividendDrawer } from './components/DividendDrawer'
import { DividendTable } from './components/DividendTable'
import { SidePanel } from './components/SidePanel'
import { defaultWatchlist, queryPresets, themeVars } from './config/app'
import { sampleDividends } from './data/sampleDividends'
import type { Dividend, SortDirection } from './types/dividend'
import { filterAndSortDividends, getHighestYield, getNextPayment } from './utils/dividends'
import { addDays } from './utils/formatters'

export function App() {
    const today = new Date().toISOString().slice(0, 10)
    const startDate = today
    const endDate = addDays(today, 7)
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
    const [aiOutput, setAiOutput] = useState('Ask the AI Agent to interpret the current calendar and watchlist.')
    const [isAiStreaming, setIsAiStreaming] = useState(false)

    useEffect(() => {
        const controller = new AbortController()

        async function loadDividends() {
            setIsLoading(true)
            setError('')

            try {
                const nextDividends = await fetchDividends({
                    startDate,
                    endDate,
                    query: '',
                    exchange: 'all',
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
    }, [startDate, endDate])

    useEffect(() => setPage(1), [startDate, endDate, pageSize])

    const filteredDividends = useMemo(
        () => filterAndSortDividends(dividends, '', 'all', sortKey, sortDirection),
        [dividends, sortDirection, sortKey],
    )

    const totalPages = Math.max(1, Math.ceil(filteredDividends.length / pageSize))
    const pageDividends = filteredDividends.slice((page - 1) * pageSize, page * pageSize)
    const visibleStart = filteredDividends.length ? (page - 1) * pageSize + 1 : 0
    const visibleEnd = Math.min(page * pageSize, filteredDividends.length)
    const nextPayment = getNextPayment(filteredDividends)
    const highestYield = getHighestYield(filteredDividends)

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

    async function runAiQuery() {
        if (!aiPrompt.trim() || isAiStreaming) return

        setIsAiStreaming(true)
        setAiOutput('')

        await streamAiQuery(
            {
                prompt: aiPrompt,
                filters: { startDate, endDate, exchange: 'all', search: '' },
                watchlist,
                dividends: filteredDividends.slice(0, 30),
            },
            (chunk) => setAiOutput((current) => current + chunk),
            (chunk) => setAiOutput((current) => current + chunk),
        )

        setIsAiStreaming(false)
    }

    function promptForSymbol(symbol: string) {
        setAiPrompt(`Analyze dividend timing, yield, and payment risk for ${symbol}.`)
    }

    return (
        <main className="app-shell" style={themeVars}>
            <AppHeader />

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

                <SidePanel watchlist={watchlist} highestYield={highestYield} onSelectSymbol={promptForSymbol} />
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
