import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export default function BucketAnimation({ trigger, isNegativeOne = false }) {
  useEffect(() => {
    if (!trigger) return

    if (isNegativeOne) {
      // Big celebration for -1 score
      const duration = 2000
      const end = Date.now() + duration
      const colors = ['#E53935', '#FFD600', '#43A047', '#FF9800']

      ;(function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors,
        })
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors,
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      })()
    } else {
      // Normal bucket celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E53935', '#FFD600', '#43A047', '#FF9800', '#FFFFFF'],
      })
    }
  }, [trigger, isNegativeOne])

  return null
}

export function celebrateWinner() {
  const duration = 3000
  const end = Date.now() + duration

  ;(function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: ['#FFD600', '#FF9800', '#E53935'],
    })
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: ['#FFD600', '#FF9800', '#E53935'],
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

export function celebrateChampion() {
  const duration = 5000
  const end = Date.now() + duration
  const colors = ['#FFD600', '#FF9800', '#E53935', '#43A047', '#FFFFFF']

  ;(function frame() {
    confetti({
      particleCount: 8,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.6 },
      colors,
      gravity: 0.8,
    })
    confetti({
      particleCount: 8,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.6 },
      colors,
      gravity: 0.8,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
