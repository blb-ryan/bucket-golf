import { db, ref, get } from '../firebase'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode() {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}

export async function generateUniqueRoomCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRoomCode()
    const gameSnap = await get(ref(db, `games/${code}`))
    const tourneySnap = await get(ref(db, `tournaments/${code}`))
    if (!gameSnap.exists() && !tourneySnap.exists()) return code
  }
  throw new Error('Could not generate unique room code')
}

export const VALID_CHARS = new Set(CHARS.split(''))
