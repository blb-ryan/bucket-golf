import { createContext, useContext, useState, useEffect } from 'react'
import { db, auth, ref, set, get, update, signInAnonymously, onAuthStateChanged } from '../firebase'
import { getPlayerEmoji } from '../utils/emojis'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(null)
  const [uid, setUid] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        try {
          await signInAnonymously(auth)
        } catch (e) {
          console.error('Anonymous sign-in failed:', e)
          setLoading(false)
        }
        return
      }

      setUid(user.uid)
      try {
        const snap = await get(ref(db, `players/${user.uid}`))
        if (snap.exists()) {
          setPlayer({ id: user.uid, ...snap.val() })
        } else {
          setPlayer(null)
        }
      } catch (e) {
        console.warn('Could not load player:', e)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function createProfile(name, phone) {
    if (!uid) throw new Error('NOT_AUTHENTICATED')
    const cleanPhone = (phone || '').replace(/\D/g, '')
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

    await set(ref(db, `players/${uid}`), playerData)

    const full = { id: uid, ...playerData }
    setPlayer(full)
    return full
  }

  async function updateName(newName) {
    if (!player || !uid) return
    await update(ref(db, `players/${uid}`), { name: newName })
    setPlayer({ ...player, name: newName })
  }

  async function updateStats(newStats) {
    if (!player || !uid) return
    await update(ref(db, `players/${uid}/stats`), newStats)
    setPlayer({ ...player, stats: newStats })
  }

  async function addGameToHistory(entry) {
    if (!player || !uid) return
    const history = [...(player.gameHistory || []), entry].slice(-50)
    await update(ref(db, `players/${uid}`), { gameHistory: history })
    setPlayer({ ...player, gameHistory: history })
  }

  async function logout() {
    try {
      await auth.signOut()
    } catch (e) {
      console.warn('Sign-out failed:', e)
    }
    setPlayer(null)
    setUid(null)
  }

  return (
    <PlayerContext.Provider value={{
      player, loading, createProfile, updateName, updateStats, addGameToHistory, logout,
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
