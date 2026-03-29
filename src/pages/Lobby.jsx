import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, ref, onValue, off, update } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import Navigation from '../components/Navigation'
import RoomCode from '../components/RoomCode'
import PlayerCard from '../components/PlayerCard'
import './Lobby.css'

export default function Lobby() {
  const { gameId } = useParams()
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)

  useEffect(() => {
    const gameRef = ref(db, `games/${gameId}`)
    const unsub = onValue(gameRef, snap => {
      if (snap.exists()) {
        const data = snap.val()
        setGame(data)
        if (data.status === 'active') {
          navigate(`/scoring/${gameId}`, { replace: true })
        }
      }
    })
    return () => off(gameRef, 'value', unsub)
  }, [gameId, navigate])

  async function startGame() {
    await update(ref(db, `games/${gameId}`), { status: 'active' })
  }

  async function leaveGame() {
    if (game?.host === player.id) {
      // Transfer host
      const playerIds = Object.keys(game.players || {}).filter(id => id !== player.id)
      if (playerIds.length > 0) {
        await update(ref(db, `games/${gameId}`), { host: playerIds[0] })
      }
    }
    const { [player.id]: _, ...remaining } = game?.players || {}
    await update(ref(db, `games/${gameId}`), { players: remaining })
    navigate('/')
  }

  if (!game) return <div className="page flex-center"><div className="anim-spin" style={{ fontSize: '2rem' }}>🪣</div></div>

  const isHost = game.host === player.id
  const playerList = Object.entries(game.players || {})

  return (
    <>
      <Navigation title={game.settings?.courseName || 'Game Lobby'} showBack />
      <div className="page">
        <RoomCode code={gameId} />

        <div className="lobby-info mt-16 text-center">
          <span className="text-sm text-gray">{game.settings?.holes} holes</span>
          {game.type === 'quickPlay' && <span className="lobby-badge-quick">⚡ Quick Play</span>}
        </div>

        <h3 className="mt-20 mb-12 fw-bold">Players ({playerList.length})</h3>
        <div className="flex-col gap-8">
          {playerList.map(([pid, pdata]) => (
            <PlayerCard
              key={pid}
              name={pdata.name}
              emoji={pdata.emoji}
              isHost={game.host === pid}
            />
          ))}
        </div>

        {playerList.length < 2 && (
          <p className="text-center text-sm text-gray mt-16">
            Share the room code with friends to play together, or start solo!
          </p>
        )}

        {isHost && (
          <button className="btn btn-red btn-lg btn-block mt-24" onClick={startGame}>
            Start Game
          </button>
        )}

        {!isHost && (
          <p className="text-center text-sm text-gray mt-24">
            Waiting for host to start the game...
          </p>
        )}

        <button className="btn btn-outline btn-sm btn-block mt-12" onClick={leaveGame}>
          Leave Game
        </button>
      </div>
    </>
  )
}
