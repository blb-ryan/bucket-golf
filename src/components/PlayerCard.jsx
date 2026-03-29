import './PlayerCard.css'

export default function PlayerCard({ name, emoji, score, isHost, isReady, rank }) {
  return (
    <div className={`player-card ${rank === 1 ? 'player-card-leader' : ''}`}>
      <div className="player-card-left">
        {rank != null && <span className="player-rank">#{rank}</span>}
        <span className="player-emoji">{emoji || '🔴'}</span>
        <div className="player-info">
          <span className="player-name">{name}</span>
          {isHost && <span className="player-badge">HOST</span>}
        </div>
      </div>
      <div className="player-card-right">
        {isReady && <span className="player-ready">✓</span>}
        {score != null && <span className="player-score">{score >= 0 ? '+' : ''}{score}</span>}
      </div>
    </div>
  )
}
