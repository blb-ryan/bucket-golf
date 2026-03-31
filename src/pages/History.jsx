import { usePlayer } from '../contexts/PlayerContext'
import Navigation from '../components/Navigation'
import './History.css'

export default function History() {
  const { player } = usePlayer()
  const history = [...(player?.gameHistory || [])].reverse()

  return (
    <>
      <Navigation title="My Games" showBack />
      <div className="page">
        {history.length === 0 ? (
          <div className="text-center mt-24">
            <div style={{ fontSize: '3rem' }}>🏌️</div>
            <p className="mt-12 fw-bold">No games yet</p>
            <p className="text-sm text-gray mt-8">Play a game to see your history here!</p>
          </div>
        ) : (
          <div className="flex-col gap-8">
            {history.map((g, i) => (
              <div key={i} className="history-card card anim-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex-between">
                  <div>
                    <span className="history-type">
                      {g.type === 'tournament' ? '🏆' : g.type === 'quickPlay' ? '⚡' : '🏌️'}
                      {' '}
                      {g.type === 'tournament' ? 'Tournament' : g.type === 'quickPlay' ? 'Quick Play' : 'Casual'}
                    </span>
                    <div className="history-date text-sm text-gray">
                      {new Date(g.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`history-result ${g.result === 'win' ? 'history-win' : 'history-loss'}`}>
                      {g.result === 'win' ? 'WIN' : 'LOSS'}
                    </div>
                    <div className="history-score">
                      {g.score === 0 ? 'E' : g.score > 0 ? `+${g.score}` : g.score}
                      {g.scoringMode === 'golf' && <span className="text-sm text-gray"> (golf)</span>}
                    </div>
                  </div>
                </div>
                {g.placement && (
                  <div className="text-sm text-gray mt-8">Placed #{g.placement}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
