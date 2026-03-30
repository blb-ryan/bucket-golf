import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, ref, set } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import { generateUniqueRoomCode } from '../utils/roomCode'

export default function QuickPlay() {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const createdRef = useRef(false)

  useEffect(() => {
    if (createdRef.current) return
    createdRef.current = true

    async function create() {
      try {
        const code = await generateUniqueRoomCode()
        const gameData = {
          type: 'quickPlay',
          host: player.id,
          status: 'lobby',
          settings: { holes: 9 },
          currentHole: 1,
          players: {
            [player.id]: { joinedAt: Date.now(), name: player.name, emoji: player.emoji },
          },
          scores: {},
          createdAt: Date.now(),
        }
        await set(ref(db, `games/${code}`), gameData)
        navigate(`/lobby/${code}`, { replace: true })
      } catch {
        navigate('/', { replace: true })
      }
    }
    create()
  }, [player, navigate])

  return (
    <div className="page flex-center" style={{ minHeight: '100dvh' }}>
      <div className="text-center">
        <div className="anim-spin" style={{ fontSize: '3rem' }}>⚡</div>
        <p className="mt-12 fw-bold">Setting up Quick Play...</p>
      </div>
    </div>
  )
}
