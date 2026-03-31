import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PlayerProvider, usePlayer } from './contexts/PlayerContext'
import Home from './pages/Home'
import Profile from './pages/Profile'
import JoinGame from './pages/JoinGame'
import GameSetup from './pages/GameSetup'
import Lobby from './pages/Lobby'
import Scoring from './pages/Scoring'
import GameResults from './pages/GameResults'
import TournamentSetup from './pages/TournamentSetup'
import TournamentLobby from './pages/TournamentLobby'
import TournamentRound from './pages/TournamentRound'
import TournamentResults from './pages/TournamentResults'
import History from './pages/History'
import './styles/global.css'
import './styles/animations.css'

function AppRoutes() {
  const { player, loading } = usePlayer()

  if (loading) {
    return (
      <div className="page flex-center" style={{ minHeight: '100dvh' }}>
        <div className="text-center">
          <div style={{ fontSize: '3rem', animation: 'bounce 1s ease infinite' }}>🪣</div>
          <p className="mt-12 fw-bold">Loading...</p>
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <Routes>
        <Route path="*" element={<Profile />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/join" element={<JoinGame />} />
      <Route path="/game-setup" element={<GameSetup />} />
      <Route path="/lobby/:gameId" element={<Lobby />} />
      <Route path="/scoring/:gameId" element={<Scoring />} />
      <Route path="/results/:gameId" element={<GameResults />} />
      <Route path="/tournament-setup" element={<TournamentSetup />} />
      <Route path="/tournament-lobby/:tournamentId" element={<TournamentLobby />} />
      <Route path="/tournament-round/:tournamentId" element={<TournamentRound />} />
      <Route path="/tournament-results/:tournamentId" element={<TournamentResults />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/bucket-golf">
      <PlayerProvider>
        <AppRoutes />
      </PlayerProvider>
    </BrowserRouter>
  )
}
