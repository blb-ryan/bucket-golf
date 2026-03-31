import './HoleIndicator.css'

export default function HoleIndicator({ current, total, viewing, onHoleTap }) {
  return (
    <div className="hole-indicator">
      {Array.from({ length: total }, (_, i) => {
        const hole = i + 1
        const isDone = hole < current
        const isCurrent = hole === current
        const isViewing = hole === viewing
        return (
          <div
            key={i}
            className={`hole-dot ${isDone ? 'hole-done' : ''} ${isCurrent && !viewing ? 'hole-current' : ''} ${hole > current ? 'hole-future' : ''} ${isViewing ? 'hole-viewing' : ''} ${isDone ? 'hole-tappable' : ''}`}
            onClick={isDone && onHoleTap ? () => onHoleTap(hole) : undefined}
          >
            {hole}
          </div>
        )
      })}
    </div>
  )
}
