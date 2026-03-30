import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, ref, get } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import { calculateTotalScore, calculateBucketCount } from '../utils/scoring'
import { updatePlayerStats } from '../utils/stats'
import { celebrateChampion } from '../components/BucketAnimation'
import Navigation from '../components/Navigation'
import './TournamentResults.css'

export default function TournamentResults() {
  const { tournamentId } = useParams()
  const { player, updateStats, addGameToHistory } = usePlayer()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState(null)
  const [gamesData, setGamesData] = useState({})
  const statsWrittenRef = useRef(false)

  useEffect(() => {
    async function load() {
      const snap = await get(ref(db, `tournaments/${tournamentId}`))
      if (!snap.exists()) return
      const t = snap.val()
      setTournament(t)

      // Load all group game data in parallel
      const gameIds = []
      for (const [, round] of Object.entries(t.rounds || {})) {
        for (const [, group] of Object.entries(round.groups || {})) {
          gameIds.push(group.gameId)
        }
      }
      const snaps = await Promise.all(gameIds.map(id => get(ref(db, `games/${id}`))))
      const games = {}
      snaps.forEach((snap, i) => {
        if (snap.exists()) games[gameIds[i]] = snap.val()
      })
      setGamesData(games)
    }
    load()
  }, [tournamentId])

  const leaderboard = useMemo(() => {
    if (!tournament) return []
    const totals = {}
    const playerInfo = tournament.playerInfo || {}

    for (const [roundNum, round] of Object.entries(tournament.rounds || {})) {
      for (const [, group] of Object.entries(round.groups || {})) {
        const game = gamesData[group.gameId]
        if (!game) continue
        for (const pid of group.players || []) {
          if (!totals[pid]) totals[pid] = { total: 0, buckets: 0, rounds: {}, bestRound: Infinity, bestHole: Infinity }
          const roundScore = calculateTotalScore(game.scores?.[pid])
          const roundBuckets = calculateBucketCount(game.scores?.[pid])
          totals[pid].total += roundScore
          totals[pid].buckets += roundBuckets
          totals[pid].rounds[roundNum] = roundScore
          totals[pid].bestRound = Math.min(totals[pid].bestRound, roundScore)

          // Best hole for tiebreaker
          for (const holeScore of Object.values(game.scores?.[pid] || {})) {
            totals[pid].bestHole = Math.min(totals[pid].bestHole, holeScore.score ?? Infinity)
          }
        }
      }
    }

    return Object.entries(totals)
      .map(([pid, data]) => ({
        playerId: pid,
        name: playerInfo[pid]?.name || 'Player',
        emoji: playerInfo[pid]?.emoji || '🔴',
        ...data,
      }))
      .sort((a, b) => {
        if (a.total !== b.total) return a.total - b.total
        if (a.bestRound !== b.bestRound) return a.bestRound - b.bestRound
        return a.bestHole - b.bestHole
      })
      .map((e, i) => ({ ...e, rank: i + 1 }))
  }, [tournament, gamesData])

  useEffect(() => {
    if (!leaderboard.length || statsWrittenRef.current || !player) return

    const alreadyRecorded = (player.gameHistory || []).some(h => h.gameId === tournamentId)
    if (alreadyRecorded) { statsWrittenRef.current = true; return }

    statsWrittenRef.current = true

    const me = leaderboard.find(r => r.playerId === player.id)
    if (!me) return

    const cancel = celebrateChampion()

    const isWinner = me.rank === 1
    const newStats = updatePlayerStats(player.stats || {}, {
      score: me.total,
      buckets: me.buckets,
      isWinner,
    })
    updateStats(newStats)
    addGameToHistory({
      gameId: tournamentId,
      date: Date.now(),
      type: 'tournament',
      result: isWinner ? 'win' : 'loss',
      score: me.total,
      placement: me.rank,
    })

    return () => cancel?.()
  }, [leaderboard, player, tournamentId])

  if (!tournament) return <div className="page flex-center"><div className="anim-spin" style={{ fontSize: '2rem' }}>🏆</div></div>

  const champion = leaderboard[0]
  const roundCount = Object.keys(tournament.rounds || {}).length

  return (
    <>
      <Navigation title="Tournament Results" />
      <div className="page">
        <div className="champion-hero anim-fade-in-up">
          <div className="champion-crown anim-trophy">👑</div>
          <div className="champion-trophy anim-trophy" style={{ animationDelay: '0.2s' }}>🏆</div>
          <h2 className="champion-name">{champion?.name}</h2>
          <p className="champion-label">TOURNAMENT CHAMPION</p>
          <div className="champion-score">
            {champion?.total >= 0 ? '+' : ''}{champion?.total}
          </div>
          <p className="champion-detail">{roundCount} rounds • {roundCount * 9} holes • 🪣 {champion?.buckets} buckets</p>
        </div>

        <h3 className="mt-24 mb-12 fw-bold">Final Standings</h3>
        <div className="t-results-table">
          <div className="tr-header">
            <span>#</span>
            <span>Player</span>
            {Array.from({ length: roundCount }, (_, i) => (
              <span key={i}>R{i + 1}</span>
            ))}
            <span>Total</span>
          </div>
          {leaderboard.map((r, i) => (
            <div
              key={r.playerId}
              className={`tr-row ${r.rank === 1 ? 'tr-champion' : ''} ${r.playerId === player?.id ? 'tr-me' : ''} anim-fade-in`}
              style={{ animationDelay: `${0.5 + i * 0.1}s` }}
            >
              <span className="tr-rank">
                {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `${r.rank}`}
              </span>
              <span className="tr-player">
                <span>{r.emoji}</span>
                <span className="tr-name">{r.name}</span>
              </span>
              {Array.from({ length: roundCount }, (_, ri) => (
                <span key={ri} className="tr-rscore">{r.rounds[ri + 1] ?? '—'}</span>
              ))}
              <span className={`tr-total ${r.total <= 0 ? 'score-negative' : ''}`}>
                {r.total >= 0 ? '+' : ''}{r.total}
              </span>
            </div>
          ))}
        </div>

        <button className="btn btn-red btn-lg btn-block mt-24" onClick={() => navigate('/')}>
          Back Home
        </button>
      </div>
    </>
  )
}
