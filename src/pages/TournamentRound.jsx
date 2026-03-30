import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, ref, onValue, update, set } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import { calculateTotalScore, calculateBucketCount } from '../utils/scoring'
import { generateUniqueRoomCode } from '../utils/roomCode'
import { assignGroups } from '../utils/groups'
import Navigation from '../components/Navigation'
import './TournamentRound.css'

export default function TournamentRound() {
  const { tournamentId } = useParams()
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState(null)
  const [allGamesData, setAllGamesData] = useState({})
  const [nextGroups, setNextGroups] = useState(null)

  useEffect(() => {
    const tRef = ref(db, `tournaments/${tournamentId}`)
    const unsub = onValue(tRef, snap => {
      if (snap.exists()) {
        const data = snap.val()
        setTournament(data)

        if (data.status === 'finished') {
          navigate(`/tournament-results/${tournamentId}`, { replace: true })
        }
      }
    })
    return () => unsub()
  }, [tournamentId, navigate])

  // Collect all game IDs from tournament rounds (stable string key)
  const allGameIds = useMemo(() => {
    if (!tournament?.rounds) return ''
    const ids = []
    for (const [, round] of Object.entries(tournament.rounds)) {
      if (!round.groups) continue
      for (const [, group] of Object.entries(round.groups)) {
        if (group.gameId) ids.push(group.gameId)
      }
    }
    return ids.sort().join(',')
  }, [JSON.stringify(tournament?.rounds)])

  // Listen to ALL group games across all rounds
  useEffect(() => {
    if (!allGameIds) return
    const ids = allGameIds.split(',')
    const unsubs = ids.map(gameId => {
      return onValue(ref(db, `games/${gameId}`), snap => {
        if (snap.exists()) {
          setAllGamesData(prev => ({ ...prev, [gameId]: snap.val() }))
        }
      })
    })
    return () => unsubs.forEach(u => u())
  }, [allGameIds])

  const isHost = tournament?.host === player.id
  const currentRound = getCurrentRound(tournament?.status)
  const isBetweenRounds = tournament?.status === 'between_rounds'
  const totalRounds = tournament?.settings?.rounds || 1

  // Find my game in the current round
  const myGameId = useMemo(() => {
    if (!tournament?.rounds || !currentRound) return null
    const round = tournament.rounds[currentRound]
    if (!round?.groups) return null
    for (const [, group] of Object.entries(round.groups)) {
      if (group.players?.includes(player.id)) return group.gameId
    }
    return null
  }, [tournament, currentRound, player.id])

  const myGameFinished = myGameId && allGamesData[myGameId]?.status === 'finished'

  // Check if ALL games in current round are finished
  const allGroupsFinished = useMemo(() => {
    if (!tournament?.rounds || !currentRound) return false
    const round = tournament.rounds[currentRound]
    if (!round?.groups) return false
    return Object.values(round.groups).every(g => allGamesData[g.gameId]?.status === 'finished')
  }, [tournament, currentRound, allGamesData])

  // Auto-advance to between_rounds when all groups finish (if auto advancement)
  useEffect(() => {
    if (!allGroupsFinished || !isHost || !currentRound || isBetweenRounds) return
    if (currentRound >= totalRounds) {
      // Final round done — finish tournament
      update(ref(db, `tournaments/${tournamentId}`), { status: 'finished' })
    } else if (tournament?.settings?.advancement === 'auto') {
      update(ref(db, `tournaments/${tournamentId}`), { status: 'between_rounds' })
    }
  }, [allGroupsFinished, isHost, currentRound, totalRounds, isBetweenRounds])

  // Tournament leaderboard across all rounds
  const tournamentLeaderboard = useMemo(() => {
    if (!tournament) return []
    const totals = {}
    const playerInfo = tournament.playerInfo || {}

    for (const [roundNum, round] of Object.entries(tournament.rounds || {})) {
      if (!round.groups) continue
      for (const [, group] of Object.entries(round.groups)) {
        const game = allGamesData[group.gameId]
        if (!game) continue
        for (const pid of group.players || []) {
          if (!totals[pid]) totals[pid] = { total: 0, buckets: 0, rounds: {} }
          const roundScore = calculateTotalScore(game.scores?.[pid])
          const roundBuckets = calculateBucketCount(game.scores?.[pid])
          totals[pid].total += roundScore
          totals[pid].buckets += roundBuckets
          totals[pid].rounds[roundNum] = roundScore
        }
      }
    }

    return Object.entries(totals)
      .map(([pid, data]) => ({
        playerId: pid,
        name: playerInfo[pid]?.name || 'Player',
        emoji: playerInfo[pid]?.emoji || '🔴',
        ...data,
      }))
      .sort((a, b) => a.total - b.total)
      .map((e, i) => ({ ...e, rank: i + 1 }))
  }, [tournament, allGamesData])

  // Navigate to my active group game
  function goToMyGame() {
    if (myGameId && !myGameFinished) {
      navigate(`/scoring/${myGameId}?tournament=${tournamentId}`)
    }
  }

  function generateNextGroups() {
    const g = assignGroups(tournament.players, tournament.settings.groupSize)
    setNextGroups(g)
  }

  async function startNextRound() {
    if (!nextGroups) return
    const nextRoundNum = Object.keys(tournament.rounds || {}).length + 1
    const playerInfo = tournament.playerInfo || {}
    const roundData = { status: 'active', groups: {} }

    for (let i = 0; i < nextGroups.length; i++) {
      const gameCode = await generateUniqueRoomCode()
      const gameData = {
        type: 'tournament',
        tournamentId,
        roundNumber: nextRoundNum,
        groupNumber: i + 1,
        host: nextGroups[i][0],
        status: 'active',
        settings: {
          holes: 9,
          courseName: `Round ${nextRoundNum} - Group ${i + 1}`,
        },
        currentHole: 1,
        players: {},
        scores: {},
        createdAt: Date.now(),
      }

      for (const pid of nextGroups[i]) {
        gameData.players[pid] = {
          joinedAt: Date.now(),
          name: playerInfo[pid]?.name || 'Player',
          emoji: playerInfo[pid]?.emoji || '🔴',
        }
      }

      await set(ref(db, `games/${gameCode}`), gameData)
      roundData.groups[`group_${i + 1}`] = {
        players: nextGroups[i],
        gameId: gameCode,
      }
    }

    await update(ref(db, `tournaments/${tournamentId}`), {
      status: `round_${nextRoundNum}`,
      [`rounds/${nextRoundNum}`]: roundData,
    })
    setNextGroups(null)
  }

  async function finishTournament() {
    await update(ref(db, `tournaments/${tournamentId}`), { status: 'finished' })
  }

  if (!tournament) return <div className="page flex-center"><div className="anim-spin" style={{ fontSize: '2rem' }}>🏆</div></div>

  const roundCount = Object.keys(tournament.rounds || {}).length

  return (
    <>
      <Navigation title={isBetweenRounds ? 'Between Rounds' : `Round ${currentRound || '?'}`} />
      <div className="page">
        {/* Action area */}
        {!isBetweenRounds && myGameId && !myGameFinished && (
          <button className="btn btn-green btn-lg btn-block mb-16" onClick={goToMyGame}>
            ⛳ Go to My Game
          </button>
        )}

        {myGameFinished && !allGroupsFinished && (
          <div className="card text-center mb-16 anim-fade-in">
            <p className="fw-bold">Your group is done!</p>
            <p className="text-sm text-gray mt-8">Waiting for other groups to finish...</p>
          </div>
        )}

        {allGroupsFinished && !isBetweenRounds && isHost && currentRound < totalRounds && (
          <button className="btn btn-yellow btn-lg btn-block mb-16 anim-pop-in" onClick={() => update(ref(db, `tournaments/${tournamentId}`), { status: 'between_rounds' })}>
            Continue to Next Round
          </button>
        )}

        {allGroupsFinished && !isBetweenRounds && isHost && currentRound >= totalRounds && (
          <button className="btn btn-yellow btn-lg btn-block mb-16 anim-pop-in" onClick={finishTournament}>
            🏆 Finish Tournament
          </button>
        )}

        {/* Between rounds: host sets up next round groups */}
        {isBetweenRounds && isHost && (
          <div className="mb-16 anim-fade-in-up">
            <h3 className="mb-12 fw-bold text-center">Round {roundCount + 1} Setup</h3>

            {nextGroups ? (
              <>
                {nextGroups.map((g, gi) => (
                  <div key={gi} className="card mb-8">
                    <div className="fw-bold mb-8 text-sm" style={{ color: 'var(--gray)' }}>Group {gi + 1}</div>
                    {g.map(pid => (
                      <div key={pid} className="flex-row gap-8 mb-8">
                        <span>{tournament.playerInfo?.[pid]?.emoji || '🔴'}</span>
                        <span className="fw-bold">{tournament.playerInfo?.[pid]?.name || 'Player'}</span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex-col gap-8 mt-12">
                  <button className="btn btn-red btn-lg btn-block" onClick={startNextRound}>
                    Start Round {roundCount + 1}
                  </button>
                  <button className="btn btn-outline btn-sm btn-block" onClick={generateNextGroups}>
                    Shuffle Groups
                  </button>
                </div>
              </>
            ) : (
              <button className="btn btn-yellow btn-lg btn-block" onClick={generateNextGroups}>
                Generate Groups
              </button>
            )}
          </div>
        )}

        {isBetweenRounds && !isHost && (
          <div className="card text-center mb-16">
            <p className="fw-bold">Between rounds</p>
            <p className="text-sm text-gray mt-8">Waiting for host to start the next round...</p>
          </div>
        )}

        {/* Tournament leaderboard */}
        <h3 className="mb-12 fw-bold text-center">Tournament Standings</h3>
        <div className="t-leaderboard">
          <div className="t-lb-header" style={{ '--round-count': roundCount }}>
            <span>#</span>
            <span>Player</span>
            {Array.from({ length: roundCount }, (_, i) => (
              <span key={i}>R{i + 1}</span>
            ))}
            <span>Total</span>
          </div>
          {tournamentLeaderboard.map(r => (
            <div
              key={r.playerId}
              className={`t-lb-row ${r.rank === 1 ? 't-lb-leader' : ''} ${r.playerId === player.id ? 't-lb-me' : ''}`}
              style={{ '--round-count': roundCount }}
            >
              <span className="t-lb-rank">{r.rank === 1 ? '👑' : r.rank}</span>
              <span className="t-lb-name">
                <span>{r.emoji}</span> {r.name}
              </span>
              {Array.from({ length: roundCount }, (_, ri) => (
                <span key={ri} className="t-lb-rscore">{r.rounds[ri + 1] ?? '—'}</span>
              ))}
              <span className={`t-lb-total ${r.total <= 0 ? 'score-negative' : ''}`}>
                {r.total >= 0 ? '+' : ''}{r.total}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function getCurrentRound(status) {
  if (!status) return null
  if (status === 'between_rounds') return null
  const match = status.match(/round_(\d+)/)
  return match ? parseInt(match[1]) : null
}
