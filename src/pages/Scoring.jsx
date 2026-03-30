import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { db, ref, onValue, update, remove } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
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
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [bucketTrigger, setBucketTrigger] = useState(0)
  const [isBestScore, setIsBestScore] = useState(false)

  useEffect(() => {
    const gameRef = ref(db, `games/${gameId}`)
    const unsub = onValue(gameRef, snap => {
      if (!snap.exists()) {
        navigate('/', { replace: true })
        return
      }
      const data = snap.val()
      setGame(data)
      if (data.status === 'cancelled') {
        navigate('/', { replace: true })
      }
      if (data.status === 'finished') {
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

  const isHost = game?.host === player.id
  const currentHole = game?.currentHole || 1
  const totalHoles = game?.settings?.holes || 9

  const playerNames = useMemo(() => {
    const names = {}
    if (game?.players) {
      Object.entries(game.players).forEach(([pid, p]) => { names[pid] = p.name })
    }
    return names
  }, [JSON.stringify(game?.players)])

  const playerEmojis = useMemo(() => {
    const emojis = {}
    if (game?.players) {
      Object.entries(game.players).forEach(([pid, p]) => { emojis[pid] = p.emoji })
    }
    return emojis
  }, [JSON.stringify(game?.players)])

  const myScore = game?.scores?.[player.id]?.[String(currentHole)]
  const hasSubmitted = myScore?.score != null

  const allSubmitted = useMemo(() => {
    if (!game?.players || !game?.scores) return false
    return Object.keys(game.players).every(
      pid => game.scores?.[pid]?.[String(currentHole)]?.score != null
    )
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

  async function nextHole() {
    if (currentHole >= totalHoles) {
      await update(ref(db, `games/${gameId}`), { status: 'finished' })
    } else {
      await update(ref(db, `games/${gameId}`), { currentHole: currentHole + 1 })
    }
  }

  async function endGame() {
    await update(ref(db, `games/${gameId}`), { status: 'cancelled' })
    // Small delay so other clients pick up the cancelled status before removal
    setTimeout(() => remove(ref(db, `games/${gameId}`)), 1000)
    navigate('/', { replace: true })
  }

  async function leaveGame() {
    const updates = { [`players/${player.id}`]: null }
    await update(ref(db, `games/${gameId}`), updates)
    navigate('/', { replace: true })
  }

  if (!game) return <div className="page flex-center"><div className="anim-spin" style={{ fontSize: '2rem' }}>🪣</div></div>

  return (
    <>
      <Navigation
        title="Bucket Golf"
        rightAction={
          <button className="nav-back" onClick={() => setShowLeaderboard(!showLeaderboard)} aria-label="Toggle leaderboard">
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
            <Leaderboard
              players={game.players}
              scores={game.scores}
              currentHole={currentHole}
              playerNames={playerNames}
              playerEmojis={playerEmojis}
              currentPlayerId={player.id}
            />
          </div>
        ) : (
          <div className="mt-16">
            <ScoreInput
              key={currentHole}
              hole={currentHole}
              onSubmit={handleSubmitScore}
              disabled={hasSubmitted}
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
                    Waiting for host to advance...
                  </p>
                )}
                {!allSubmitted && (
                  <p className="text-center text-sm text-gray mt-12">
                    Waiting for all players...
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Host: End Game / Non-host: Leave Game */}
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
