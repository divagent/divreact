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
