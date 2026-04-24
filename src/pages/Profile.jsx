import { useState } from 'react'
import { usePlayer } from '../contexts/PlayerContext'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import './Profile.css'

export default function Profile() {
  const { player, createProfile, updateName, logout } = usePlayer()
  const navigate = useNavigate()

  if (!player) return <ProfileSetup createProfile={createProfile} />

  return <ProfileView player={player} updateName={updateName} logout={logout} navigate={navigate} />
}

function ProfileSetup({ createProfile }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setLoading(true)
    setError('')
    try {
      await createProfile(name.trim(), phone)
    } catch (err) {
      if (err.message === 'NOT_AUTHENTICATED') setError('Still connecting. Try again in a moment.')
      else setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  return (
    <>
      <Navigation title="Bucket Golf" />
      <div className="page grass-bg">
        <div className="profile-setup anim-fade-in-up">
          <div className="profile-setup-hero">
            <div className="profile-setup-icon">🪣</div>
            <h2>Welcome to Bucket Golf!</h2>
            <p className="text-gray">Create your player profile to get started</p>
          </div>

          <form className="flex-col gap-12 mt-16" onSubmit={handleCreate}>
            <input className="input" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} maxLength={20} />
            <input className="input" placeholder="Phone Number (optional)" value={phone} onChange={e => setPhone(e.target.value)} type="tel" />
            {error && <p className="text-red text-sm text-center">{error}</p>}
            <button className="btn btn-red btn-lg btn-block mt-8" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Profile'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

function ProfileView({ player, updateName, logout, navigate }) {
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState(player.name)
  const stats = player.stats || {}
  const winPct = stats.gamesPlayed ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0

  async function saveName() {
    if (newName.trim() && newName.trim() !== player.name) {
      await updateName(newName.trim())
    }
    setEditing(false)
  }

  async function handleSwitchProfile() {
    await logout()
    navigate('/')
  }

  return (
    <>
      <Navigation title="My Profile" showBack />
      <div className="page">
        <div className="profile-header card anim-fade-in">
          <div className="profile-emoji">{player.emoji || '🔴'}</div>
          {editing ? (
            <div className="flex-row gap-8">
              <input className="input" value={newName} onChange={e => setNewName(e.target.value)} maxLength={20} autoFocus />
              <button className="btn btn-green btn-sm" onClick={saveName}>Save</button>
            </div>
          ) : (
            <div className="profile-name-row" onClick={() => setEditing(true)}>
              <h2 className="profile-name">{player.name}</h2>
              <span className="profile-edit">✏️</span>
            </div>
          )}
          {player.phone && (
            <p className="text-sm text-gray mt-8">📱 {player.phone?.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}</p>
          )}
        </div>

        <h3 className="mt-24 mb-12 fw-bold">Lifetime Stats</h3>
        <div className="profile-stats-grid">
          <div className="profile-stat-card card">
            <div className="pstat-val">{stats.gamesPlayed || 0}</div>
            <div className="pstat-lbl">Games Played</div>
          </div>
          <div className="profile-stat-card card">
            <div className="pstat-val text-green">{stats.wins || 0}</div>
            <div className="pstat-lbl">Wins</div>
          </div>
          <div className="profile-stat-card card">
            <div className="pstat-val">{winPct}%</div>
            <div className="pstat-lbl">Win Rate</div>
          </div>
          <div className="profile-stat-card card">
            <div className="pstat-val">{stats.avgScore || '—'}</div>
            <div className="pstat-lbl">Avg Score</div>
          </div>
          <div className="profile-stat-card card">
            <div className="pstat-val text-green">{stats.bestRound ?? '—'}</div>
            <div className="pstat-lbl">Best Round</div>
          </div>
          <div className="profile-stat-card card">
            <div className="pstat-val text-red">{stats.buckets || 0}</div>
            <div className="pstat-lbl">🪣 Buckets</div>
          </div>
        </div>

        <button className="btn btn-outline btn-block mt-24" onClick={handleSwitchProfile}>
          Switch Profile
        </button>
      </div>
    </>
  )
}
