import './RoomCode.css'

export default function RoomCode({ code }) {
  const handleCopy = () => {
    navigator.clipboard?.writeText(code)
  }

  return (
    <div className="room-code-card" onClick={handleCopy}>
      <div className="room-code-label">Room Code</div>
      <div className="room-code-value">{code}</div>
      <div className="room-code-hint">Tap to copy</div>
    </div>
  )
}
