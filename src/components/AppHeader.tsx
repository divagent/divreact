import { Download, Sparkles } from 'lucide-react'
import brandLogo from '../assets/logo/ChatGPT_Image_May_20__2026__10_03_18_AM-removebg-preview.png'

export function AppHeader({ onExport }: { onExport: () => void }) {
  return (
    <header className="top-rail">
      <div className="brand-lockup">
        <img src={brandLogo} alt="Dividend AI" />
        <div>
          <strong>Dividend AI</strong>
          <span>Income calendar intelligence</span>
        </div>
      </div>
      <div className="header-actions">
        <div className="agent-badge">
          <Sparkles size={17} />
          AI Agent ready
        </div>
        <button className="ghost-button" type="button" onClick={onExport}>
          <Download size={18} />
          Export calendar
        </button>
      </div>
    </header>
  )
}
