import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, ref, set } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import { generateUniqueRoomCode } from '../utils/roomCode'
import { createGameData } from '../utils/gameFactory'
import Navigation from '../components/Navigation'
import './GameSetup.css'

export default function GameSetup() {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [holes, setHoles] = useState(9)
  const [scoringMode, setScoringMode] = useState('total')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const code = await generateUniqueRoomCode()
      await set(ref(db, `games/${code}`), createGameData(player, { type: 'casual', holes, scoringMode }))
      navigate(`/lobby/${code}`)
    } catch {
      setError('Failed to create game. Try again.')
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
            <label className="setup-label">Scoring Method</label>
            <div className="mode-picker">
              <button className={`mode-option ${scoringMode === 'total' ? 'mode-active' : ''}`} onClick={() => setScoringMode('total')}>
                <span className="mode-icon">🎯</span>
                <span className="mode-name">Total Points</span>
              </button>
              <button className={`mode-option ${scoringMode === 'golf' ? 'mode-active' : ''}`} onClick={() => setScoringMode('golf')}>
                <span className="mode-icon">⛳</span>
                <span className="mode-name">Traditional Golf</span>
              </button>
            </div>
            <p className="text-center text-sm text-gray mt-8">
              {scoringMode === 'total' ? 'Lowest total hits wins' : 'Par 3 per hole — score relative to par'}
            </p>
          </div>

          <div className="setup-field">
            <label className="setup-label">Number of Holes</label>
            <div className="holes-picker">
              {[3, 6, 9, 12, 18].map(n => (
                <button key={n} className={`holes-option ${holes === n ? 'holes-active' : ''}`} onClick={() => setHoles(n)}>
                  {n}
                </button>
              ))}
            </div>
            <input type="range" min={1} max={18} value={holes} onChange={e => setHoles(Number(e.target.value))} className="holes-slider" />
            <p className="text-center text-sm text-gray">{holes} hole{holes !== 1 ? 's' : ''}</p>
          </div>

          {error && <p className="text-red text-sm text-center">{error}</p>}

          <button className="btn btn-green btn-lg btn-block mt-24" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create Game'}
          </button>
        </div>
      </div>
    </>
  )
}
