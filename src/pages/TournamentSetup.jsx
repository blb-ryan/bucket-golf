import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, ref, set, update } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import { generateRoomCode } from '../utils/roomCode'
import Navigation from '../components/Navigation'
import './TournamentSetup.css'

export default function TournamentSetup() {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [rounds, setRounds] = useState(2)
  const [groupSize, setGroupSize] = useState(2)
  const [courseName, setCourseName] = useState('')
  const [advancement, setAdvancement] = useState('auto')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    const code = generateRoomCode()
    const data = {
      host: player.id,
      status: 'lobby',
      settings: {
        rounds,
        groupSize,
        courseName: courseName.trim() || 'Championship Course',
        advancement,
      },
      players: [player.id],
      playerInfo: {
        [player.id]: { name: player.name, emoji: player.emoji },
      },
      rounds: {},
      leaderboard: {},
      createdAt: Date.now(),
    }

    try {
      await set(ref(db, `tournaments/${code}`), data)
      navigate(`/tournament-lobby/${code}`)
    } catch {
      alert('Failed to create tournament. Try again.')
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

        <div className="setup-field">
          <label className="setup-label">Course Name (optional)</label>
          <input className="input" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Championship Course" maxLength={30} />
        </div>

        <button className="btn btn-yellow btn-lg btn-block mt-16" onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : '🏆 Create Tournament'}
        </button>
      </div>
    </>
  )
}
