export function createGameData(player, { type = 'casual', holes = 9 } = {}) {
  return {
    type,
    host: player.id,
    status: 'lobby',
    settings: { holes },
    currentHole: 1,
    players: {
      [player.id]: { joinedAt: Date.now(), name: player.name, emoji: player.emoji },
    },
    scores: {},
    createdAt: Date.now(),
  }
}
