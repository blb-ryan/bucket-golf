import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../contexts/PlayerContext'
import Navigation from '../components/Navigation'
import './Home.css'

const VERSION = 'Mar 30 06:42';

export default function Home() {
  const { player } = usePlayer()
  const navigate = useNavigate()

  return (
    <>
      <Navigation title="Bucket Golf" />
      <div className="page grass-bg">
        <div className="home-hero anim-fade-in">
          <div className="home-bucket">🪣</div>
          <h2 className="home-greeting">Hey, {player?.name || 'Golfer'}!</h2>
          <p className="home-subtitle">Ready to play?</p>
        </div>

        <div className="home-actions flex-col gap-12 anim-fade-in-up">
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

        <div className="home-footer flex-row gap-12 mt-24">
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/profile')} style={{ flex: 1 }}>
            👤 My Profile
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/history')} style={{ flex: 1 }}>
            📊 My Games
          </button>
        </div>

        {player?.stats?.gamesPlayed > 0 && (
          <div className="home-stats card mt-16 anim-fade-in stagger-3">
            <div className="home-stats-grid">
              <div className="home-stat">
                <div className="home-stat-value">{player.stats.gamesPlayed}</div>
                <div className="home-stat-label">Games</div>
              </div>
              <div className="home-stat">
                <div className="home-stat-value">{player.stats.wins || 0}</div>
                <div className="home-stat-label">Wins</div>
              </div>
              <div className="home-stat">
                <div className="home-stat-value">{player.stats.buckets || 0}</div>
                <div className="home-stat-label">Buckets</div>
              </div>
              <div className="home-stat">
                <div className="home-stat-value">{player.stats.bestRound ?? '—'}</div>
                <div className="home-stat-label">Best</div>
              </div>
            </div>
          </div>
        )}

        <div className="home-version">{VERSION}</div>
      </div>
    </>
  )
}
