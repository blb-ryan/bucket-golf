import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { db, ref, onValue, update, remove, set, get } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import { calculateTotalScore, calculateBucketCount, formatScore } from '../utils/scoring'
import Navigation from '../components/Navigation'
import ScoreInput from '../components/ScoreInput'
import Leaderboard from '../components/Leaderboard'
import HoleIndicator from '../components/HoleIndicator'
import BucketAnimation from '../components/BucketAnimation'
import './Scoring.css'

export default function Scoring() {
  const { gameId } = useParams()
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [game, setGame] = useState(null)
  const tournamentId = searchParams.get('tournament') || game?.tournamentId
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [lbTab, setLbTab] = useState('group') // 'group' or 'tournament'
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [bucketTrigger, setBucketTrigger] = useState(0)
  const [isBestScore, setIsBestScore] = useState(false)

  // Tournament leaderboard state
  const [tournamentData, setTournamentData] = useState(null)
  const [tournamentGames, setTournamentGames] = useState({})

  useEffect(() => {
    const gameRef = ref(db, `games/${gameId}`)
    const unsub = onValue(gameRef, snap => {
      if (!snap.exists()) {
        navigate('/', { replace: true })
        return
      }
      const data = snap.val()
      setGame(data)
      if (data.status === 'active') {
        const tid = searchParams.get('tournament') || data.tournamentId
        localStorage.setItem('bucketgolf_active_game', JSON.stringify({
          gameId: tid || gameId,
          type: tid ? 'tournament' : 'game',
        }))
      }
      if (data.status === 'cancelled') {
        localStorage.removeItem('bucketgolf_active_game')
        navigate('/', { replace: true })
      }
      if (data.status === 'finished') {
        localStorage.removeItem('bucketgolf_active_game')
        const tid = searchParams.get('tournament') || data.tournamentId
        if (tid) {
          navigate(`/tournament-round/${tid}`, { replace: true })
        } else {
          navigate(`/results/${gameId}`, { replace: true })
        }
      }
    })
    return () => unsub()
  }, [gameId, navigate, searchParams])

  // Listen to tournament data if this is a tournament game
  useEffect(() => {
    if (!tournamentId) return
    const tRef = ref(db, `tournaments/${tournamentId}`)
    const unsub = onValue(tRef, snap => {
      if (snap.exists()) setTournamentData(snap.val())
    })
    return () => unsub()
  }, [tournamentId])

  // Listen to all tournament group games for the leaderboard
  const tournamentGameIds = useMemo(() => {
    if (!tournamentData?.rounds) return ''
    const ids = []
    for (const [, round] of Object.entries(tournamentData.rounds)) {
      if (!round.groups) continue
      for (const [, group] of Object.entries(round.groups)) {
        if (group.gameId) ids.push(group.gameId)
      }
    }
    return ids.sort().join(',')
  }, [JSON.stringify(tournamentData?.rounds)])

  useEffect(() => {
    if (!tournamentGameIds) return
    const ids = tournamentGameIds.split(',')
    const unsubs = ids.map(gid =>
      onValue(ref(db, `games/${gid}`), snap => {
        if (snap.exists()) {
          setTournamentGames(prev => ({ ...prev, [gid]: snap.val() }))
        }
      })
    )
    return () => unsubs.forEach(u => u())
  }, [tournamentGameIds])

  // Compute tournament-wide leaderboard
  const tournamentLeaderboard = useMemo(() => {
    if (!tournamentData?.rounds) return []
    const totals = {}
    const playerInfo = tournamentData.playerInfo || {}

    for (const [, round] of Object.entries(tournamentData.rounds)) {
      if (!round.groups) continue
      for (const [, group] of Object.entries(round.groups)) {
        const g = tournamentGames[group.gameId]
        if (!g) continue
        for (const pid of group.players || []) {
          if (!totals[pid]) totals[pid] = { total: 0, buckets: 0 }
          totals[pid].total += calculateTotalScore(g.scores?.[pid])
          totals[pid].buckets += calculateBucketCount(g.scores?.[pid])
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
      .sort((a, b) => a.total - b.total)
      .map((e, i) => ({ ...e, rank: i + 1 }))
  }, [tournamentData, tournamentGames])

  const isHost = game?.host === player.id
  const currentHole = game?.currentHole || 1
  const totalHoles = game?.settings?.holes || 9
  const hostName = game?.players?.[game?.host]?.name || 'host'
  const isTournament = !!tournamentId

  const { playerNames, playerEmojis } = useMemo(() => {
    const names = {}
    const emojis = {}
    if (game?.players) {
      Object.entries(game.players).forEach(([pid, p]) => {
        names[pid] = p.name
        emojis[pid] = p.emoji
      })
    }
    return { playerNames: names, playerEmojis: emojis }
  }, [game?.players])

  const myScore = game?.scores?.[player.id]?.[String(currentHole)]
  const hasSubmitted = myScore?.score != null

  const allSubmitted = useMemo(() => {
    if (!game?.players) return false
    return Object.keys(game.players).every(
      pid => game.scores?.[pid]?.[String(currentHole)]?.score != null
    )
  }, [game?.players, game?.scores, currentHole])

  const waitingNames = useMemo(() => {
    if (!game?.players) return []
    return Object.keys(game.players)
      .filter(pid => game.scores?.[pid]?.[String(currentHole)]?.score == null)
      .map(pid => game.players[pid]?.name || 'Player')
  }, [game?.players, game?.scores, currentHole])

  const handleSubmitScore = useCallback(async ({ hits, bucket, score }) => {
    await update(ref(db, `games/${gameId}/scores/${player.id}/${currentHole}`), {
      hits, bucket, score,
    })
    if (bucket) {
      setIsBestScore(score === 0 && hits === 1)
      setBucketTrigger(t => t + 1)
    }
  }, [gameId, player.id, currentHole])

  const handleUndoScore = useCallback(async () => {
    await set(ref(db, `games/${gameId}/scores/${player.id}/${currentHole}`), null)
  }, [gameId, player.id, currentHole])

  async function nextHole() {
    if (currentHole >= totalHoles) {
      await update(ref(db, `games/${gameId}`), { status: 'finished' })
    } else {
      await update(ref(db, `games/${gameId}`), { currentHole: currentHole + 1 })
    }
  }

  async function endGame() {
    await update(ref(db, `games/${gameId}`), { status: 'cancelled' })
    setTimeout(() => remove(ref(db, `games/${gameId}`)), 1500)
    navigate('/', { replace: true })
  }

  async function leaveGame() {
    const remainingPlayers = Object.keys(game?.players || {}).filter(id => id !== player.id)
    if (remainingPlayers.length === 0) {
      // Last player — delete the game
      await remove(ref(db, `games/${gameId}`))
    } else {
      const updates = {
        [`players/${player.id}`]: null,
        [`scores/${player.id}`]: null,
      }
      // Transfer host if needed
      if (game?.host === player.id) {
        updates.host = remainingPlayers[0]
      }
      await update(ref(db, `games/${gameId}`), updates)
    }
    navigate('/', { replace: true })
  }

  if (!game) return <div className="page flex-center"><div className="anim-spin" style={{ fontSize: '2rem' }}>🪣</div></div>

  return (
    <>
      <Navigation
        title={game?.roundNumber ? `R${game.roundNumber} - Group ${game.groupNumber}` : 'Bucket Golf'}
        rightAction={
          <button className="nav-back" onClick={() => { setShowLeaderboard(!showLeaderboard); setLbTab('group') }} aria-label="Toggle leaderboard">
            📊
          </button>
        }
      />
      <BucketAnimation trigger={bucketTrigger} isBestScore={isBestScore} />

      <div className="page">
        <HoleIndicator current={currentHole} total={totalHoles} />

        {showLeaderboard ? (
          <div className="mt-16 anim-fade-in">
            <div className="flex-between mb-12">
              <h3 className="fw-bold">Leaderboard</h3>
              <button className="btn btn-sm btn-outline" onClick={() => setShowLeaderboard(false)}>
                Back to Scoring
              </button>
            </div>

            {/* Tournament: show tabs for Group vs Tournament */}
            {isTournament && (
              <div className="lb-tabs mb-12">
                <button className={`lb-tab ${lbTab === 'group' ? 'lb-tab-active' : ''}`} onClick={() => setLbTab('group')}>
                  My Group
                </button>
                <button className={`lb-tab ${lbTab === 'tournament' ? 'lb-tab-active' : ''}`} onClick={() => setLbTab('tournament')}>
                  🏆 Tournament
                </button>
              </div>
            )}

            {lbTab === 'group' ? (
              <Leaderboard
                players={game.players}
                scores={game.scores}
                currentHole={currentHole}
                playerNames={playerNames}
                playerEmojis={playerEmojis}
                currentPlayerId={player.id}
              />
            ) : (
              <div className="tournament-lb">
                <div className="tournament-lb-header">
                  <span>#</span>
                  <span>Player</span>
                  <span>🪣</span>
                  <span>Total</span>
                </div>
                {tournamentLeaderboard.map(r => (
                  <div
                    key={r.playerId}
                    className={`tournament-lb-row ${r.rank === 1 ? 'tournament-lb-leader' : ''} ${r.playerId === player.id ? 'tournament-lb-me' : ''}`}
                  >
                    <span className="tlb-rank">{r.rank === 1 ? '👑' : `#${r.rank}`}</span>
                    <span className="tlb-player">
                      <span>{r.emoji}</span>
                      <span className="tlb-name">{r.name}</span>
                    </span>
                    <span className="tlb-buckets">{r.buckets}</span>
                    <span className={`tlb-total ${r.total < 0 ? 'score-negative' : ''}`}>
                      {formatScore(r.total)}
                    </span>
                  </div>
                ))}
                {tournamentLeaderboard.length === 0 && (
                  <p className="text-center text-sm text-gray" style={{ padding: '20px' }}>
                    Scores will appear as players submit...
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-16">
            <ScoreInput
              key={currentHole}
              hole={currentHole}
              onSubmit={handleSubmitScore}
              onUndo={handleUndoScore}
              disabled={hasSubmitted}
              canUndo={hasSubmitted}
            />

            {hasSubmitted && (
              <div className="scoring-waiting mt-20 anim-fade-in">
                <Leaderboard
                  players={game.players}
                  scores={game.scores}
                  currentHole={currentHole}
                  playerNames={playerNames}
                  playerEmojis={playerEmojis}
                  currentPlayerId={player.id}
                />

                {allSubmitted && isHost && (
                  <button className="btn btn-red btn-lg btn-block mt-16 anim-pop-in" onClick={nextHole}>
                    {currentHole >= totalHoles ? '🏁 Finish Game' : `➡️ Hole ${currentHole + 1}`}
                  </button>
                )}
                {allSubmitted && !isHost && (
                  <p className="text-center text-sm text-gray mt-12">
                    Waiting for {hostName} to advance...
                  </p>
                )}
                {!allSubmitted && waitingNames.length > 0 && (
                  <p className="text-center text-sm text-gray mt-12">
                    Waiting for {waitingNames.join(', ')}...
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-24">
          {isHost ? (
            showEndConfirm ? (
              <div className="card text-center anim-fade-in" style={{ border: '2px solid var(--red)' }}>
                <p className="fw-bold">End this game?</p>
                <p className="text-sm text-gray mt-8">All scores will be erased and players sent home.</p>
                <div className="flex-row gap-8 mt-16" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowEndConfirm(false)}>Cancel</button>
                  <button className="btn btn-red btn-sm" onClick={endGame}>End Game</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-outline btn-sm btn-block" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={() => setShowEndConfirm(true)}>
                End Game
              </button>
            )
          ) : (
            <button className="btn btn-outline btn-sm btn-block" onClick={leaveGame}>
              Leave Game
            </button>
          )}
        </div>
      </div>
    </>
  )
}
