import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, ref, set } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import { generateUniqueRoomCode } from '../utils/roomCode'
import Navigation from '../components/Navigation'
import './TournamentSetup.css'

export default function TournamentSetup() {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [rounds, setRounds] = useState(2)
  const [groupSize, setGroupSize] = useState(2)
  const [advancement, setAdvancement] = useState('auto')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
    const code = await generateUniqueRoomCode()
    const data = {
      host: player.id,
      status: 'lobby',
      settings: {
        rounds,
        groupSize,
        advancement,
      },
      playerInfo: {
        [player.id]: { name: player.name, emoji: player.emoji, joinedAt: Date.now() },
      },
      rounds: {},
      leaderboard: {},
      createdAt: Date.now(),
    }

    await set(ref(db, `tournaments/${code}`), data)
    navigate(`/tournament-lobby/${code}`)
    } catch {
      setError('Failed to create tournament. Try again.')
    }
    setLoading(false)
  }

  return (
    <>
      <Navigation title="Tournament" showBack />
      <div className="page">
        <h2 className="page-title">🏆 Tournament Settings</h2>

        <div className="setup-field">
          <label className="setup-label">Number of Rounds</label>
          <div className="option-row">
            {[1, 2, 3, 4].map(n => (
              <button key={n} className={`option-btn ${rounds === n ? 'option-active' : ''}`} onClick={() => setRounds(n)}>
                {n}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray text-center mt-8">{rounds * 9} total holes</p>
        </div>

        <div className="setup-field">
          <label className="setup-label">Group Size</label>
          <div className="option-row">
            {[2, 3, 4].map(n => (
              <button key={n} className={`option-btn ${groupSize === n ? 'option-active' : ''}`} onClick={() => setGroupSize(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="setup-field">
          <label className="setup-label">Round Advancement</label>
          <div className="option-row">
            <button className={`option-btn option-wide ${advancement === 'auto' ? 'option-active' : ''}`} onClick={() => setAdvancement('auto')}>
              Auto
            </button>
            <button className={`option-btn option-wide ${advancement === 'manual' ? 'option-active' : ''}`} onClick={() => setAdvancement('manual')}>
              Manual
            </button>
          </div>
          <p className="text-sm text-gray text-center mt-8">
            {advancement === 'auto' ? 'Next round starts when all groups finish' : 'Host manually starts next round'}
          </p>
        </div>

        {error && <p className="text-red text-sm text-center">{error}</p>}

        <button className="btn btn-yellow btn-lg btn-block mt-16" onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : '🏆 Create Tournament'}
        </button>
      </div>
    </>
  )
}
