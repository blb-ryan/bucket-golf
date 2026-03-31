export function createGameData(player, { type = 'casual', holes = 9, scoringMode = 'total' } = {}) {
  return {
    type,
    host: player.id,
    status: 'lobby',
    settings: { holes, scoringMode },
    currentHole: 1,
    players: {
      [player.id]: { joinedAt: Date.now(), name: player.name, emoji: player.emoji },
    },
    scores: {},
    createdAt: Date.now(),
  }
}
