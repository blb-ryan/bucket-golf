import { useState } from 'react'
import './RoomCode.css'

export default function RoomCode({ code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code)
      } else {
        // Fallback for non-HTTPS or older browsers
        const el = document.createElement('textarea')
        el.value = code
        el.style.position = 'fixed'
        el.style.opacity = '0'
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="room-code-card" onClick={handleCopy}>
      <div className="room-code-label">Room Code</div>
      <div className="room-code-value">{code}</div>
      <div className="room-code-hint">{copied ? 'Copied!' : 'Tap to copy'}</div>
    </div>
  )
}
