import { useMemo } from 'react'
import { calculateTotalScore, calculateBucketCount, formatScore } from '../utils/scoring'
import './Leaderboard.css'

export default function Leaderboard({ players, scores, currentHole, playerNames, playerEmojis, currentPlayerId }) {
  const rankings = useMemo(() => {
    return Object.keys(players || {})
      .map(pid => ({
        playerId: pid,
        name: playerNames?.[pid] || 'Player',
        emoji: playerEmojis?.[pid] || '🔴',
        total: calculateTotalScore(scores?.[pid]),
        buckets: calculateBucketCount(scores?.[pid]),
        hasSubmitted: scores?.[pid]?.[String(currentHole)]?.score != null,
        isMe: pid === currentPlayerId,
      }))
      .sort((a, b) => a.total - b.total)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))
  }, [players, scores, currentHole, playerNames, playerEmojis, currentPlayerId])

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <span>Rank</span>
        <span>Player</span>
        <span>Bkt</span>
        <span>Total</span>
      </div>
      {rankings.map((r, i) => (
        <div
          key={r.playerId}
          className={`leaderboard-row ${r.rank === 1 ? 'leader-row' : ''} ${r.isMe ? 'me-row' : ''}`}
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <span className="lb-rank">
            {r.rank === 1 ? '👑' : `#${r.rank}`}
          </span>
          <span className="lb-player">
            <span className="lb-emoji">{r.emoji}</span>
            <span className="lb-name">{r.name}</span>
            {r.hasSubmitted && <span className="lb-check">✓</span>}
          </span>
          <span className="lb-buckets">🪣 {r.buckets}</span>
          <span className={`lb-total ${r.total <= 0 ? 'score-negative' : ''}`}>
            {formatScore(r.total)}
          </span>
        </div>
      ))}
    </div>
  )
}
