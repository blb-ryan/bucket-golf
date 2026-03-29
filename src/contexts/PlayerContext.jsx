import { createContext, useContext, useState, useEffect } from 'react'
import { db, ref, set, get, update } from '../firebase'
import { getPlayerEmoji } from '../utils/emojis'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = localStorage.getItem('bucketgolf_player')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setPlayer(parsed)
        refreshFromFirebase(parsed.id)
      } catch {
        localStorage.removeItem('bucketgolf_player')
      }
    }
    setLoading(false)
  }, [])

  async function refreshFromFirebase(playerId) {
    try {
      const snap = await get(ref(db, `players/${playerId}`))
      if (snap.exists()) {
        const data = { id: playerId, ...snap.val() }
        setPlayer(data)
        localStorage.setItem('bucketgolf_player', JSON.stringify(data))
      }
    } catch (e) {
      console.warn('Could not refresh player from Firebase:', e)
    }
  }

  async function createProfile(name, phone) {
    const cleanPhone = phone.replace(/\D/g, '')
    const existingSnap = await get(ref(db, `phoneIndex/${cleanPhone}`))
    if (existingSnap.exists()) {
      throw new Error('PHONE_EXISTS')
    }

    const playerId = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const playerData = {
      name,
      phone: cleanPhone,
      emoji: getPlayerEmoji(Date.now() % 16),
      createdAt: Date.now(),
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        avgScore: 0,
        bestRound: null,
        buckets: 0,
      },
      gameHistory: [],
    }

    await set(ref(db, `players/${playerId}`), playerData)
    await set(ref(db, `phoneIndex/${cleanPhone}`), playerId)

    const full = { id: playerId, ...playerData }
    setPlayer(full)
    localStorage.setItem('bucketgolf_player', JSON.stringify(full))
    return full
  }

  async function recoverProfile(phone) {
    const cleanPhone = phone.replace(/\D/g, '')
    const snap = await get(ref(db, `phoneIndex/${cleanPhone}`))
    if (!snap.exists()) {
      throw new Error('NOT_FOUND')
    }
    const playerId = snap.val()
    const playerSnap = await get(ref(db, `players/${playerId}`))
    if (!playerSnap.exists()) {
      throw new Error('NOT_FOUND')
    }
    const full = { id: playerId, ...playerSnap.val() }
    setPlayer(full)
    localStorage.setItem('bucketgolf_player', JSON.stringify(full))
    return full
  }

  async function updateName(newName) {
    if (!player) return
    await update(ref(db, `players/${player.id}`), { name: newName })
    const updated = { ...player, name: newName }
    setPlayer(updated)
    localStorage.setItem('bucketgolf_player', JSON.stringify(updated))
  }

  async function updateStats(newStats) {
    if (!player) return
    await update(ref(db, `players/${player.id}/stats`), newStats)
    const updated = { ...player, stats: newStats }
    setPlayer(updated)
    localStorage.setItem('bucketgolf_player', JSON.stringify(updated))
  }

  async function addGameToHistory(entry) {
    if (!player) return
    const history = [...(player.gameHistory || []), entry].slice(-50)
    await update(ref(db, `players/${player.id}`), { gameHistory: history })
    const updated = { ...player, gameHistory: history }
    setPlayer(updated)
    localStorage.setItem('bucketgolf_player', JSON.stringify(updated))
  }

  function logout() {
    setPlayer(null)
    localStorage.removeItem('bucketgolf_player')
  }

  return (
    <PlayerContext.Provider value={{
      player, loading, createProfile, recoverProfile, updateName, updateStats, addGameToHistory, logout, refreshFromFirebase: () => player && refreshFromFirebase(player.id)
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider')
  return ctx
}
