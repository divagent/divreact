import { Brain, Loader2, Send } from 'lucide-react'
import { queryPresets } from '../config/app'

export function AiAgentPanel({
  prompt,
  output,
  isStreaming,
  onPromptChange,
  onRun,
}: {
  prompt: string
  output: string
  isStreaming: boolean
  onPromptChange: (value: string) => void
  onRun: () => void
}) {
  return (
    <section className="ai-panel">
      <div className="panel-heading">
        <div className="section-title">
          <Brain size={21} />
          <div>
            <p className="eyebrow">Primary workspace</p>
            <h2>AI Dividend Agent</h2>
            <p>Ask about income opportunities, watchlist timing, high-yield risk, and upcoming payment windows.</p>
          </div>
        </div>
        {isStreaming ? <span className="live-pill">Streaming</span> : null}
      </div>

      <div className="ai-query-row">
        <input value={prompt} onChange={(event) => onPromptChange(event.target.value)} />
        <button className="primary-button icon-only" type="button" onClick={onRun} disabled={isStreaming}>
          {isStreaming ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
        </button>
      </div>

      <div className="preset-row">
        {queryPresets.map((preset) => (
          <button key={preset} type="button" onClick={() => onPromptChange(preset)}>
            {preset}
          </button>
        ))}
      </div>

      <pre className="ai-output">{output}</pre>
    </section>
  )
}
