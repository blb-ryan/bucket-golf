import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, ref, onValue, update, set } from '../firebase'
import { usePlayer } from '../contexts/PlayerContext'
import { generateUniqueRoomCode } from '../utils/roomCode'
import { assignGroups } from '../utils/groups'
import Navigation from '../components/Navigation'
import RoomCode from '../components/RoomCode'
import PlayerCard from '../components/PlayerCard'

export default function TournamentLobby() {
  const { tournamentId } = useParams()
  const { player } = usePlayer()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState(null)
  const [groups, setGroups] = useState(null)
  const [showGroups, setShowGroups] = useState(false)

  useEffect(() => {
    const tRef = ref(db, `tournaments/${tournamentId}`)
    const unsub = onValue(tRef, snap => {
      if (snap.exists()) {
        const data = snap.val()
        setTournament(data)

        // If tournament moved to a round, navigate to round view
        if (data.status && data.status.startsWith('round_')) {
          navigate(`/tournament-round/${tournamentId}`, { replace: true })
        }
        if (data.status === 'finished') {
          navigate(`/tournament-results/${tournamentId}`, { replace: true })
        }
      }
    })
    return () => unsub()
  }, [tournamentId, navigate])

  const isHost = tournament?.host === player.id
  const playerList = tournament?.players || []
  const playerInfo = tournament?.playerInfo || {}

  function generateGroups() {
    const g = assignGroups(playerList, tournament.settings.groupSize)
    setGroups(g)
    setShowGroups(true)
  }

  async function startRound() {
    if (!groups) return

    const roundNum = 1
    const roundData = { status: 'active', groups: {} }

    for (let i = 0; i < groups.length; i++) {
      const gameCode = await generateUniqueRoomCode()
      const gameData = {
        type: 'tournament',
        tournamentId,
        roundNumber: roundNum,
        groupNumber: i + 1,
        host: groups[i][0],
        status: 'active',
        settings: {
          holes: 9,
          courseName: `Round ${roundNum} - Group ${i + 1}`,
        },
        currentHole: 1,
        players: {},
        scores: {},
        createdAt: Date.now(),
      }

      for (const pid of groups[i]) {
        gameData.players[pid] = {
          joinedAt: Date.now(),
          name: playerInfo[pid]?.name || 'Player',
          emoji: playerInfo[pid]?.emoji || '🔴',
        }
      }

      await set(ref(db, `games/${gameCode}`), gameData)

      roundData.groups[`group_${i + 1}`] = {
        players: groups[i],
        gameId: gameCode,
      }
    }

    await update(ref(db, `tournaments/${tournamentId}`), {
      status: `round_${roundNum}`,
      [`rounds/${roundNum}`]: roundData,
    })
  }

  if (!tournament) return <div className="page flex-center"><div className="anim-spin" style={{ fontSize: '2rem' }}>🏆</div></div>

  return (
    <>
      <Navigation title="Tournament Lobby" showBack />
      <div className="page">
        <RoomCode code={tournamentId} />

        <div className="text-center mt-12 text-sm text-gray">
          {tournament.settings.rounds} round{tournament.settings.rounds > 1 ? 's' : ''} •
          Groups of {tournament.settings.groupSize} •
          {tournament.settings.rounds * 9} total holes
        </div>

        <h3 className="mt-20 mb-12 fw-bold">Players ({playerList.length})</h3>
        <div className="flex-col gap-8">
          {playerList.map(pid => (
            <PlayerCard
              key={pid}
              name={playerInfo[pid]?.name || 'Player'}
              emoji={playerInfo[pid]?.emoji}
              isHost={tournament.host === pid}
            />
          ))}
        </div>

        {showGroups && groups && (
          <div className="mt-20 anim-fade-in-up">
            <h3 className="mb-12 fw-bold">Groups for Round 1</h3>
            {groups.map((g, gi) => (
              <div key={gi} className="card mb-8">
                <div className="fw-bold mb-8 text-sm" style={{ color: 'var(--gray)' }}>Group {gi + 1}</div>
                {g.map(pid => (
                  <div key={pid} className="flex-row gap-8 mb-8">
                    <span>{playerInfo[pid]?.emoji || '🔴'}</span>
                    <span className="fw-bold">{playerInfo[pid]?.name || 'Player'}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {isHost && !showGroups && playerList.length >= 2 && (
          <button className="btn btn-yellow btn-lg btn-block mt-24" onClick={generateGroups}>
            Generate Groups
          </button>
        )}

        {isHost && !showGroups && playerList.length < 2 && (
          <p className="text-center text-sm text-gray mt-24">
            Need at least 2 players to start. Share the room code!
          </p>
        )}

        {isHost && showGroups && (
          <div className="flex-col gap-8 mt-16">
            <button className="btn btn-red btn-lg btn-block" onClick={startRound}>
              Start Round 1
            </button>
            <button className="btn btn-outline btn-sm btn-block" onClick={generateGroups}>
              Shuffle Groups
            </button>
          </div>
        )}

        {!isHost && (
          <p className="text-center text-sm text-gray mt-24">
            Waiting for host to start the tournament...
          </p>
        )}
      </div>
    </>
  )
}
