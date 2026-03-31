const PAR = 3

export function calculateHoleScore(hits, bucket) {
  return bucket ? hits - 1 : hits
}

export function displayHoleScore(rawScore, mode) {
  if (mode === 'golf') return rawScore - PAR
  return rawScore
}

export function formatScore(score) {
  if (score === 0) return 'E'
  return score > 0 ? `+${score}` : `${score}`
}

export function calculateTotalScore(scores, mode) {
  if (!scores) return 0
  const entries = Object.values(scores)
  const rawTotal = entries.reduce((sum, s) => sum + (s.score ?? 0), 0)
  if (mode === 'golf') return rawTotal - (PAR * entries.length)
  return rawTotal
}

export function calculateBucketCount(scores) {
  if (!scores) return 0
  return Object.values(scores).filter(s => s.bucket).length
}
