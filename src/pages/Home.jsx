import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../contexts/PlayerContext'
import Navigation from '../components/Navigation'
import './Home.css'

const VERSION = 'Mar 30 06:55';

export default function Home() {
  const { player } = usePlayer()
  const navigate = useNavigate()

  return (
    <>
      <Navigation title="Bucket Golf" />
      <div className="page home-page grass-bg">
        <div className="home-version-banner">Build: {VERSION}</div>

        <div className="home-logo">
          <span className="home-logo-text">BUCKET</span>
          <span className="home-logo-text">GOLF</span>
          <span className="home-logo-sub">SCORECARD</span>
        </div>

        <p className="home-greeting">Hey, {player?.name || 'Golfer'}!</p>

        <div className="home-actions flex-col gap-8">
          <button className="btn btn-red btn-block home-quick" onClick={() => navigate('/quick-play')}>
            <span>⚡</span> Quick Play
          </button>
          <button className="btn btn-green btn-block" onClick={() => navigate('/game-setup')}>
            <span>🏌️</span> Casual Game
          </button>
          <div className="home-actions-row">
            <button className="btn btn-yellow btn-block" onClick={() => navigate('/tournament-setup')}>
              🏆 Tournament
            </button>
            <button className="btn btn-dark btn-block" onClick={() => navigate('/join')}>
              🔗 Join Game
            </button>
          </div>
        </div>

        <div className="home-footer-row">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/profile')} style={{ flex: 1 }}>
            👤 Profile
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/history')} style={{ flex: 1 }}>
            📊 Games
          </button>
        </div>

        {player?.stats?.gamesPlayed > 0 && (
          <div className="home-stats-bar">
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
