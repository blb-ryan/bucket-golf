import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db, ref, onValue, update, set, remove } from '../firebase'
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
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    const tRef = ref(db, `tournaments/${tournamentId}`)
    const unsub = onValue(tRef, snap => {
      if (!snap.exists()) {
        navigate('/', { replace: true })
        return
      }
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
  const playerInfo = tournament?.playerInfo || {}
  const playerList = Object.keys(playerInfo)

  async function leaveTournament() {
    await update(ref(db, `tournaments/${tournamentId}/playerInfo/${player.id}`), null)
    navigate('/')
  }

  async function cancelTournament() {
    await remove(ref(db, `tournaments/${tournamentId}`))
    navigate('/')
  }

  function generateGroups() {
    const g = assignGroups(playerList, tournament.settings.groupSize)
    setGroups(g)
    setShowGroups(true)
  }

  async function startRound() {
    if (!groups || starting) return
    setStarting(true)
    try {
      const roundNum = 1
      const roundData = { status: 'active', groups: {} }

      // Generate all room codes in parallel
      const codes = await Promise.all(groups.map(() => generateUniqueRoomCode()))

      // Create all group games in parallel
      await Promise.all(groups.map((group, i) => {
        const gameData = {
          type: 'tournament',
          tournamentId,
          roundNumber: roundNum,
          groupNumber: i + 1,
          host: group[0],
          status: 'active',
          settings: { holes: 9, scoringMode: tournament.settings?.scoringMode || 'total' },
          currentHole: 1,
          players: {},
          scores: {},
          createdAt: Date.now(),
        }
        for (const pid of group) {
          gameData.players[pid] = {
            joinedAt: Date.now(),
            name: playerInfo[pid]?.name || 'Player',
            emoji: playerInfo[pid]?.emoji || '🔴',
          }
        }
        roundData.groups[`group_${i + 1}`] = { players: group, gameId: codes[i] }
        return set(ref(db, `games/${codes[i]}`), gameData)
      }))

      await update(ref(db, `tournaments/${tournamentId}`), {
        status: `round_${roundNum}`,
        [`rounds/${roundNum}`]: roundData,
      })
    } catch {
      setStarting(false)
    }
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
            <button className="btn btn-red btn-lg btn-block" onClick={startRound} disabled={starting}>
              {starting ? 'Starting...' : 'Start Round 1'}
            </button>
            <button className="btn btn-outline btn-sm btn-block" onClick={generateGroups}>
              Shuffle Groups
            </button>
          </div>
        )}

        {!isHost && (
          <>
            <p className="text-center text-sm text-gray mt-24">
              Waiting for host to start the tournament...
            </p>
            <button className="btn btn-outline btn-sm btn-block mt-12" onClick={leaveTournament}>
              Leave Tournament
            </button>
          </>
        )}

        {isHost && (
          <button className="btn btn-outline btn-sm btn-block mt-24" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={cancelTournament}>
            Cancel Tournament
          </button>
        )}
      </div>
    </>
  )
}
