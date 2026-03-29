import './HoleIndicator.css'

export default function HoleIndicator({ current, total }) {
  return (
    <div className="hole-indicator">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`hole-dot ${i + 1 < current ? 'hole-done' : ''} ${i + 1 === current ? 'hole-current' : ''} ${i + 1 > current ? 'hole-future' : ''}`}
        >
          {i + 1}
        </div>
      ))}
    </div>
  )
}
