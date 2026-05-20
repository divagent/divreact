import { Loader2, Send, Sparkles, TrendingUp } from 'lucide-react'
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
    const isPresetPrompt = queryPresets.includes(prompt)

    return (
        <section className="ai-panel">
            <div className="ai-composer">
                <input
                    className={isPresetPrompt ? 'placeholder-prompt' : ''}
                    value={prompt}
                    onChange={(event) => onPromptChange(event.target.value)}
                />
                <div className="composer-actions">
                    <Sparkles size={20} />
                    <button className="primary-button icon-only" type="button" onClick={onRun} disabled={isStreaming}>
                        {isStreaming ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                    </button>
                </div>
            </div>

            <div className="preset-row">
                {queryPresets.map((preset, index) => (
                    <button className={index === 0 ? 'featured-preset' : ''} key={preset} type="button" onClick={() => onPromptChange(preset)}>
                        {index === 0 ? <TrendingUp size={20} /> : <Sparkles size={15} />}
                        {preset}
                    </button>
                ))}
            </div>

            <pre className="ai-output">{output}</pre>
        </section>
    )
}
