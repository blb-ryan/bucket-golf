import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, ref, set } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import { generateRoomCode } from '../utils/roomCode'
import Navigation from '../components/Navigation'
import './GameSetup.css'

export default function GameSetup() {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [holes, setHoles] = useState(9)
  const [courseName, setCourseName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    const code = generateRoomCode()
    const gameData = {
      type: 'casual',
      host: player.id,
      status: 'lobby',
      settings: {
        holes,
        courseName: courseName.trim() || 'Backyard Course',
      },
      currentHole: 1,
      players: {
        [player.id]: {
          joinedAt: Date.now(),
          name: player.name,
          emoji: player.emoji,
        },
      },
      scores: {},
      createdAt: Date.now(),
    }

    try {
      await set(ref(db, `games/${code}`), gameData)
      navigate(`/lobby/${code}`)
    } catch {
      alert('Failed to create game. Try again.')
    }
    setLoading(false)
  }

  return (
    <>
      <Navigation title="Casual Game" showBack />
      <div className="page">
        <div className="setup-form anim-fade-in-up">
          <h2 className="page-title">Game Settings</h2>

          <div className="setup-field">
            <label className="setup-label">Number of Holes</label>
            <div className="holes-picker">
              {[3, 6, 9, 12, 18].map(n => (
                <button
                  key={n}
                  className={`holes-option ${holes === n ? 'holes-active' : ''}`}
                  onClick={() => setHoles(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={1}
              max={18}
              value={holes}
              onChange={e => setHoles(Number(e.target.value))}
              className="holes-slider"
            />
            <p className="text-center text-sm text-gray">{holes} hole{holes !== 1 ? 's' : ''}</p>
          </div>

          <div className="setup-field">
            <label className="setup-label">Course Name (optional)</label>
            <input
              className="input"
              value={courseName}
              onChange={e => setCourseName(e.target.value)}
              placeholder="Backyard Course"
              maxLength={30}
            />
          </div>

          <button className="btn btn-green btn-lg btn-block mt-24" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create Game'}
          </button>
        </div>
      </div>
    </>
  )
}
