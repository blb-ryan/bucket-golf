export function assignGroups(playerIds, groupSize) {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5)
  const groups = []
  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push(shuffled.slice(i, i + groupSize))
  }
  return groups
}

export function swapPlayers(groups, fromGroup, fromIndex, toGroup, toIndex) {
  const newGroups = groups.map(g => [...g])
  const temp = newGroups[fromGroup][fromIndex]
  newGroups[fromGroup][fromIndex] = newGroups[toGroup][toIndex]
  newGroups[toGroup][toIndex] = temp
  return newGroups
}
