export function calculateHoleScore(hits, bucket) {
  return bucket ? hits - 1 : hits
}

export function calculateTotalScore(scores) {
  if (!scores) return 0
  return Object.values(scores).reduce((sum, s) => sum + (s.score ?? 0), 0)
}

export function calculateBucketCount(scores) {
  if (!scores) return 0
  return Object.values(scores).filter(s => s.bucket).length
}
