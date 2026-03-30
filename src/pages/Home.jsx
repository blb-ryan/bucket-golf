import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../contexts/PlayerContext'
import { db, ref, get } from '../firebase'
import Navigation from '../components/Navigation'
import './Home.css'

const VERSION = 'Mar 30 08:30';

export default function Home() {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [activeGame, setActiveGame] = useState(null)

  // Check for active games on mount
  useEffect(() => {
    if (!player?.id) return
    async function checkActiveGames() {
      // Check localStorage first for fast lookup
      const cached = localStorage.getItem('bucketgolf_active_game')
      if (cached) {
        try {
          const { gameId, type } = JSON.parse(cached)
          if (type === 'tournament') {
            const snap = await get(ref(db, `tournaments/${gameId}`))
            if (snap.exists()) {
              const t = snap.val()
              if (t.playerInfo?.[player.id] && t.status !== 'finished' && t.status !== 'lobby') {
                setActiveGame({ id: gameId, type: 'tournament' })
                return
              }
            }
          } else {
            const snap = await get(ref(db, `games/${gameId}`))
            if (snap.exists()) {
              const g = snap.val()
              if (g.players?.[player.id] && g.status === 'active') {
                setActiveGame({ id: gameId, type: 'game' })
                return
              }
            }
          }
        } catch (err) {
          console.warn('Active game check failed:', err)
        }
      }
      // Clear stale cache
      localStorage.removeItem('bucketgolf_active_game')
      setActiveGame(null)
    }
    checkActiveGames()
  }, [player?.id])

  function resumeGame() {
    if (!activeGame) return
    if (activeGame.type === 'tournament') {
      navigate(`/tournament-round/${activeGame.id}`)
    } else {
      navigate(`/scoring/${activeGame.id}`)
    }
  }

  return (
    <>
      <Navigation title="Bucket Golf" />
      <div className="page grass-bg">
        <div className="home-version-banner">Build: {VERSION}</div>

        {activeGame && (
          <button className="home-resume-banner" onClick={resumeGame}>
            🔴 You have an active game — tap to return
          </button>
        )}

        <div className="home-logo">
          <span className="home-logo-text">BUCKET</span>
          <span className="home-logo-text">GOLF</span>
          <span className="home-logo-sub">SCORECARD</span>
        </div>

        <p className="home-greeting">Hey, {player?.name || 'Golfer'}!</p>

        <div className="home-actions flex-col gap-12">
          <button className="btn btn-red btn-lg btn-block home-quick" onClick={() => navigate('/quick-play')}>
            <span>⚡</span> Quick Play
          </button>

          <button className="btn btn-green btn-lg btn-block" onClick={() => navigate('/game-setup')}>
            <span>🏌️</span> Casual Game
          </button>

          <button className="btn btn-yellow btn-lg btn-block" onClick={() => navigate('/tournament-setup')}>
            <span>🏆</span> Tournament
          </button>

          <button className="btn btn-dark btn-lg btn-block" onClick={() => navigate('/join')}>
            <span>🔗</span> Join Game
          </button>
        </div>

        <div className="home-footer-row mt-20">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/profile')} style={{ flex: 1 }}>
            👤 Profile
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/history')} style={{ flex: 1 }}>
            📊 Games
          </button>
        </div>

        {player?.stats?.gamesPlayed > 0 && (
          <div className="home-stats-bar mt-16">
            <div className="home-stat-item">
              <span className="hs-val">{player.stats.gamesPlayed}</span>
              <span className="hs-lbl">Played</span>
            </div>
            <div className="home-stat-item">
              <span className="hs-val">{player.stats.wins || 0}</span>
              <span className="hs-lbl">Wins</span>
            </div>
            <div className="home-stat-item">
              <span className="hs-val">{player.stats.buckets || 0}</span>
              <span className="hs-lbl">Buckets</span>
            </div>
            <div className="home-stat-item">
              <span className="hs-val">{player.stats.bestRound ?? '—'}</span>
              <span className="hs-lbl">Best</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
