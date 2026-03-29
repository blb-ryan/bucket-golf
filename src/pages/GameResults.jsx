import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, ref, get, update } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import { calculateTotalScore, calculateBucketCount } from '../utils/scoring'
import { updatePlayerStats } from '../utils/stats'
import { celebrateWinner } from '../components/BucketAnimation'
import Navigation from '../components/Navigation'
import './GameResults.css'

export default function GameResults() {
  const { gameId } = useParams()
  const { player, updateStats, addGameToHistory } = usePlayer()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [statsWritten, setStatsWritten] = useState(false)

  useEffect(() => {
    async function load() {
      const snap = await get(ref(db, `games/${gameId}`))
      if (snap.exists()) setGame(snap.val())
    }
    load()
  }, [gameId])

  const rankings = useMemo(() => {
    if (!game) return []
    return Object.keys(game.players || {})
      .map(pid => ({
        playerId: pid,
        name: game.players[pid].name,
        emoji: game.players[pid].emoji,
        total: calculateTotalScore(game.scores?.[pid]),
        buckets: calculateBucketCount(game.scores?.[pid]),
      }))
      .sort((a, b) => a.total - b.total)
      .map((e, i) => ({ ...e, rank: i + 1 }))
  }, [game])

  useEffect(() => {
    if (!rankings.length || statsWritten || !player) return
    setStatsWritten(true)

    const me = rankings.find(r => r.playerId === player.id)
    if (!me) return

    celebrateWinner()

    const isWinner = me.rank === 1
    const newStats = updatePlayerStats(player.stats || {}, {
      score: me.total,
      buckets: me.buckets,
      isWinner,
    })

    updateStats(newStats)
    addGameToHistory({
      gameId,
      date: Date.now(),
      type: game?.type || 'casual',
      result: isWinner ? 'win' : 'loss',
      score: me.total,
    })
  }, [rankings, statsWritten, player])

  if (!game) return <div className="page flex-center"><div className="anim-spin" style={{ fontSize: '2rem' }}>🪣</div></div>

  const winner = rankings[0]
  const totalHoles = game.settings?.holes || 9

  return (
    <>
      <Navigation title="Final Results" />
      <div className="page">
        <div className="results-hero anim-fade-in-up">
          <div className="results-trophy anim-trophy">🏆</div>
          <h2 className="results-winner-name">{winner?.name}</h2>
          <p className="results-winner-label">WINNER</p>
          <div className="results-winner-score">
            {winner?.total >= 0 ? '+' : ''}{winner?.total}
          </div>
        </div>

        <div className="results-table mt-24">
          <div className="results-table-header">
            <span>Rank</span>
            <span>Player</span>
            <span>🪣</span>
            <span>Score</span>
          </div>
          {rankings.map((r, i) => (
            <div
              key={r.playerId}
              className={`results-table-row ${r.rank === 1 ? 'results-row-winner' : ''} ${r.playerId === player?.id ? 'results-row-me' : ''} anim-fade-in`}
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <span className="rr-rank">
                {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`}
              </span>
              <span className="rr-player">
                <span>{r.emoji}</span>
                <span className="rr-name">{r.name}</span>
              </span>
              <span className="rr-buckets">{r.buckets}</span>
              <span className={`rr-score ${r.total <= 0 ? 'score-negative' : ''}`}>
                {r.total >= 0 ? '+' : ''}{r.total}
              </span>
            </div>
          ))}
        </div>

        <div className="results-meta mt-20 text-center text-sm text-gray">
          {game.settings?.courseName || 'Quick Round'} • {totalHoles} holes
        </div>

        <button className="btn btn-red btn-lg btn-block mt-24" onClick={() => navigate('/')}>
          Back Home
        </button>
      </div>
    </>
  )
}
