export function calculateHoleScore(hits, bucket) {
  return bucket ? hits - 2 : hits
}

export function calculateTotalScore(scores) {
  if (!scores) return 0
  return Object.values(scores).reduce((sum, s) => sum + (s.score ?? 0), 0)
}

export function calculateBucketCount(scores) {
  if (!scores) return 0
  return Object.values(scores).filter(s => s.bucket).length
}

export function getRankings(players, allScores) {
  return Object.keys(players)
    .map(pid => ({
      playerId: pid,
      total: calculateTotalScore(allScores?.[pid]),
      buckets: calculateBucketCount(allScores?.[pid]),
    }))
    .sort((a, b) => a.total - b.total)
    .map((entry, i) => ({ ...entry, rank: i + 1 }))
}
