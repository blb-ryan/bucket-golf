const EMOJIS = ['🔴', '🟢', '🔵', '🟡', '🟠', '🟣', '⚪', '🟤', '💜', '💚', '💛', '🧡', '❤️', '💙', '🩷', '🩵']

export function getPlayerEmoji(index) {
  return EMOJIS[index % EMOJIS.length]
}
