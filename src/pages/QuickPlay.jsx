import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, ref, set } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import { generateUniqueRoomCode } from '../utils/roomCode'
import { createGameData } from '../utils/gameFactory'

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
        await set(ref(db, `games/${code}`), createGameData(player, { type: 'quickPlay' }))
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
