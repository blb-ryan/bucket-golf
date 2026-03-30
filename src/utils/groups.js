export function assignGroups(playerIds, groupSize) {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5)
  const groups = []
  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push(shuffled.slice(i, i + groupSize))
  }
  return groups
}
