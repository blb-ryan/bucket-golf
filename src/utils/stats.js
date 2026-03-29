export function updatePlayerStats(currentStats, gameResult) {
  const stats = { ...currentStats }
  stats.gamesPlayed = (stats.gamesPlayed || 0) + 1

  if (gameResult.isWinner) {
    stats.wins = (stats.wins || 0) + 1
  } else {
    stats.losses = (stats.losses || 0) + 1
  }

  const totalGames = stats.gamesPlayed
  const prevTotal = (stats.avgScore || 0) * (totalGames - 1)
  stats.avgScore = Math.round(((prevTotal + gameResult.score) / totalGames) * 10) / 10

  if (!stats.bestRound || gameResult.score < stats.bestRound) {
    stats.bestRound = gameResult.score
  }

  stats.buckets = (stats.buckets || 0) + (gameResult.buckets || 0)

  return stats
}
