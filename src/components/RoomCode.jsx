import { useState } from 'react'
import './RoomCode.css'

export default function RoomCode({ code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
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
