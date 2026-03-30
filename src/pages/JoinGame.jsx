import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, ref, get, update } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import { VALID_CHARS } from '../utils/roomCode'
import Navigation from '../components/Navigation'
import './JoinGame.css'

export default function JoinGame() {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin(e) {
    e.preventDefault()
    const roomCode = code.toUpperCase().trim()
    if (roomCode.length !== 4) { setError('Enter a 4-character room code'); return }
    setLoading(true)
    setError('')

    try {
      // Check games first
      const gameSnap = await get(ref(db, `games/${roomCode}`))
      if (gameSnap.exists()) {
        const game = gameSnap.val()
        if (game.status === 'finished') { setError('This game has already ended'); setLoading(false); return }
        if (game.status === 'active' && !game.players?.[player.id]) { setError('Game already in progress'); setLoading(false); return }

        // Join the game
        await update(ref(db, `games/${roomCode}/players/${player.id}`), {
          joinedAt: Date.now(),
          name: player.name,
          emoji: player.emoji,
        })
        navigate(`/lobby/${roomCode}`)
        return
      }

      // Check tournaments
      const tourneySnap = await get(ref(db, `tournaments/${roomCode}`))
      if (tourneySnap.exists()) {
        const tourney = tourneySnap.val()
        if (tourney.status === 'finished') { setError('This tournament has already ended'); setLoading(false); return }

        // Join the tournament (write to playerInfo object — race-safe)
        await update(ref(db, `tournaments/${roomCode}/playerInfo/${player.id}`), {
          name: player.name,
          emoji: player.emoji,
          joinedAt: Date.now(),
        })
        navigate(`/tournament-lobby/${roomCode}`)
        return
      }

      setError('No game found with that code')
    } catch {
      setError('Connection error. Try again.')
    }
    setLoading(false)
  }

  return (
    <>
      <Navigation title="Join Game" showBack />
      <div className="page flex-center" style={{ minHeight: 'calc(100dvh - 56px)' }}>
        <form className="join-form anim-fade-in-up" onSubmit={handleJoin}>
          <div className="join-icon">🔗</div>
          <h2 className="join-title">Enter Room Code</h2>
          <p className="text-sm text-gray text-center mb-16">Ask the host for the 4-character code</p>

          <input
            className="join-code-input"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().split('').filter(c => VALID_CHARS.has(c)).join('').slice(0, 4))}
            placeholder="ABCD"
            maxLength={4}
            autoFocus
            autoCapitalize="characters"
          />

          {error && <p className="text-red text-sm text-center mt-12">{error}</p>}

          <button className="btn btn-red btn-lg btn-block mt-20" type="submit" disabled={loading || code.length < 4}>
            {loading ? 'Joining...' : 'Join'}
          </button>
        </form>
      </div>
    </>
  )
}
