import { Hono } from 'hono'
import { db, uid, computeGameStats, SPORT_CONFIGS, type SportType, type SavedTeam, type SavedPlayer, type Game, type GameTeam, type GamePlayer, type GameEvent, type EventType } from '../db'

const api = new Hono()

// ═══════════════════════════════════════════════════════
// TEAMS API
// ═══════════════════════════════════════════════════════

// GET /api/teams
api.get('/teams', (c) => {
  const teams = Array.from(db.teams.values()).sort((a, b) => b.createdAt - a.createdAt)
  return c.json({ teams })
})

// POST /api/teams
api.post('/teams', async (c) => {
  const body = await c.req.json()
  const { name, sport = 'basketball', color, coachName, logoInitials } = body
  if (!name) return c.json({ error: 'name required' }, 400)

  const id = uid()
  const initials = logoInitials || name.substring(0, 2).toUpperCase()
  const teamColor = color || '#6C63FF'

  const team: SavedTeam = {
    id, name, sport: sport as SportType,
    color: teamColor, logoInitials: initials,
    coachName, players: [],
    createdAt: Date.now(),
    wins: 0, losses: 0, draws: 0
  }
  db.teams.set(id, team)
  return c.json({ team })
})

// GET /api/teams/:id
api.get('/teams/:id', (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)
  return c.json({ team })
})

// PUT /api/teams/:id
api.put('/teams/:id', async (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json()
  Object.assign(team, body)
  db.teams.set(team.id, team)
  return c.json({ team })
})

// DELETE /api/teams/:id
api.delete('/teams/:id', (c) => {
  db.teams.delete(c.req.param('id'))
  return c.json({ success: true })
})

// POST /api/teams/:id/players — add player to saved team
api.post('/teams/:id/players', async (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)

  const { name, jerseyNumber, position } = await c.req.json()
  if (!name || !jerseyNumber) return c.json({ error: 'name and jerseyNumber required' }, 400)

  const player: SavedPlayer = {
    id: uid(), name, jerseyNumber, position,
    teamId: team.id, createdAt: Date.now(),
    careerGames: 0, careerStats: {}
  }
  team.players.push(player)
  db.teams.set(team.id, team)
  return c.json({ player })
})

// DELETE /api/teams/:id/players/:pid
api.delete('/teams/:id/players/:pid', (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)
  team.players = team.players.filter(p => p.id !== c.req.param('pid'))
  db.teams.set(team.id, team)
  return c.json({ success: true })
})

// POST /api/teams/:id/import — bulk import players from CSV/text parse
api.post('/teams/:id/import', async (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)

  const { players } = await c.req.json() // [{name, jerseyNumber, position}]
  if (!Array.isArray(players)) return c.json({ error: 'players array required' }, 400)

  const added: SavedPlayer[] = []
  for (const p of players) {
    if (!p.name || !p.jerseyNumber) continue
    const player: SavedPlayer = {
      id: uid(), name: p.name.trim(), jerseyNumber: String(p.jerseyNumber).trim(),
      position: p.position,
      teamId: team.id, createdAt: Date.now(),
      careerGames: 0, careerStats: {}
    }
    team.players.push(player)
    added.push(player)
  }
  db.teams.set(team.id, team)
  return c.json({ added, count: added.length })
})

// GET /api/teams/:id/stats — aggregated career stats for a team
api.get('/teams/:id/stats', (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)

  // Find all finished games this team participated in
  const teamGames = Array.from(db.games.values()).filter(g =>
    g.status === 'finished' &&
    (g.teamA.savedTeamId === team.id || g.teamB.savedTeamId === team.id)
  )

  const playerAggregates: Record<string, { player: SavedPlayer; games: number; pts: number; ast: number; reb: number; goals: number; min: number }> = {}
  for (const p of team.players) {
    playerAggregates[p.id] = { player: p, games: 0, pts: 0, ast: 0, reb: 0, goals: 0, min: 0 }
  }

  for (const game of teamGames) {
    const stats = computeGameStats(game.id)
    for (const s of stats.playerStats) {
      const agg = playerAggregates[s.savedPlayerId]
      if (agg) {
        agg.games++
        agg.pts += s.points
        agg.ast += s.assists
        agg.reb += s.rebounds
        agg.goals += s.goals
        agg.min += s.minutesPlayed
      }
    }
  }

  return c.json({ team, games: teamGames.length, playerAggregates: Object.values(playerAggregates) })
})

// ═══════════════════════════════════════════════════════
// GAMES API
// ═══════════════════════════════════════════════════════

// GET /api/games
api.get('/games', (c) => {
  const games = Array.from(db.games.values()).sort((a, b) => b.createdAt - a.createdAt)
  return c.json({ games })
})

// POST /api/games
api.post('/games', async (c) => {
  const body = await c.req.json()
  const { teamAName, teamBName, teamASavedId, teamBSavedId, sport = 'basketball', name, location } = body

  if (!teamAName || !teamBName) return c.json({ error: 'Team names required' }, 400)

  const gameId = uid()

  // Build team rosters — from saved teams or blank
  const buildGameTeam = (savedId: string | undefined, fallbackName: string, teamSlot: 'A' | 'B'): GameTeam => {
    const saved = savedId ? db.teams.get(savedId) : undefined
    const teamId = uid()
    const players: GamePlayer[] = (saved?.players || []).map(p => ({
      id: uid(), savedPlayerId: p.id, name: p.name,
      jerseyNumber: p.jerseyNumber, position: p.position,
      teamId, gameId
    }))
    return {
      id: teamId,
      savedTeamId: savedId,
      name: saved?.name || fallbackName,
      color: saved?.color || (teamSlot === 'A' ? '#6C63FF' : '#FF6B35'),
      players
    }
  }

  const game: Game = {
    id: gameId, name, sport: sport as SportType, location,
    status: 'setup',
    teamA: buildGameTeam(teamASavedId, teamAName, 'A'),
    teamB: buildGameTeam(teamBSavedId, teamBName, 'B'),
    createdAt: Date.now(),
    activePlayers: {}
  }

  db.games.set(gameId, game)
  return c.json({ game })
})

// GET /api/games/:id
api.get('/games/:id', (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)
  return c.json({ game })
})

// POST /api/games/:id/players — add player to game team
api.post('/games/:id/players', async (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)
  const { name, jerseyNumber, team, position, savedPlayerId } = await c.req.json()
  if (!name || !jerseyNumber || !team) return c.json({ error: 'name, jerseyNumber, team required' }, 400)

  const teamObj = team === 'A' ? game.teamA : game.teamB
  const player: GamePlayer = {
    id: uid(), savedPlayerId: savedPlayerId || uid(),
    name, jerseyNumber, position, teamId: teamObj.id, gameId: game.id
  }
  teamObj.players.push(player)
  db.games.set(game.id, game)
  return c.json({ player })
})

// DELETE /api/games/:id/players/:pid
api.delete('/games/:id/players/:pid', (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)
  const pid = c.req.param('pid')
  game.teamA.players = game.teamA.players.filter(p => p.id !== pid)
  game.teamB.players = game.teamB.players.filter(p => p.id !== pid)
  db.games.set(game.id, game)
  return c.json({ success: true })
})

// POST /api/games/:id/start
api.post('/games/:id/start', (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)
  game.status = 'active'
  game.startedAt = Date.now()
  db.games.set(game.id, game)
  return c.json({ game })
})

// POST /api/games/:id/finish
api.post('/games/:id/finish', (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)
  game.status = 'finished'
  game.finishedAt = Date.now()
  db.games.set(game.id, game)

  // Update win/loss on saved teams
  const stats = computeGameStats(game.id)
  const aTeam = game.teamA.savedTeamId ? db.teams.get(game.teamA.savedTeamId) : undefined
  const bTeam = game.teamB.savedTeamId ? db.teams.get(game.teamB.savedTeamId) : undefined
  if (aTeam && bTeam) {
    if (stats.teamAScore > stats.teamBScore) { aTeam.wins++; bTeam.losses++ }
    else if (stats.teamBScore > stats.teamAScore) { bTeam.wins++; aTeam.losses++ }
    else { aTeam.draws++; bTeam.draws++ }
    db.teams.set(aTeam.id, aTeam)
    db.teams.set(bTeam.id, bTeam)
  }

  return c.json({ game, stats })
})

// POST /api/games/:id/events
api.post('/games/:id/events', async (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)

  const { playerId, type, value = 1, period, notes } = await c.req.json()
  if (!playerId || !type) return c.json({ error: 'playerId and type required' }, 400)

  const allPlayers = [...game.teamA.players, ...game.teamB.players]
  const player = allPlayers.find(p => p.id === playerId)
  if (!player) return c.json({ error: 'Player not found in game' }, 404)

  const event: GameEvent = {
    id: uid(), gameId: game.id, playerId,
    teamId: player.teamId, type: type as EventType,
    value: Number(value), timestamp: Date.now(), period, notes
  }

  if (type === 'SUB_IN') { game.activePlayers[playerId] = event.timestamp }
  else if (type === 'SUB_OUT') { delete game.activePlayers[playerId] }

  db.events.push(event)
  db.games.set(game.id, game)

  const statsData = computeGameStats(game.id)
  return c.json({ event, stats: statsData })
})

// DELETE /api/games/:id/events/last
api.delete('/games/:id/events/last', (c) => {
  const gameId = c.req.param('id')
  const idxs = db.events.map((e, i) => e.gameId === gameId ? i : -1).filter(i => i !== -1)
  if (!idxs.length) return c.json({ error: 'No events' }, 400)
  const last = db.events[idxs[idxs.length - 1]]
  db.events.splice(idxs[idxs.length - 1], 1)

  // Revert sub state
  if (last.type === 'SUB_IN') {
    const game = db.games.get(gameId)
    if (game) { delete game.activePlayers[last.playerId]; db.games.set(gameId, game) }
  }
  return c.json({ removed: last, stats: computeGameStats(gameId) })
})

// GET /api/games/:id/stats
api.get('/games/:id/stats', (c) => {
  const stats = computeGameStats(c.req.param('id'))
  return c.json(stats)
})

// GET /api/games/:id/summary
api.get('/games/:id/summary', (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)
  const stats = computeGameStats(game.id)
  const { playerStats, teamAScore, teamBScore } = stats

  const sorted = (key: keyof typeof playerStats[0]) =>
    [...playerStats].sort((a, b) => (b[key] as number) - (a[key] as number))

  const cfg = SPORT_CONFIGS[game.sport]
  const scoringKey = cfg.scoringStat as keyof typeof playerStats[0]

  return c.json({
    game, teamAScore, teamBScore,
    winner: teamAScore > teamBScore ? game.teamA.name : teamBScore > teamAScore ? game.teamB.name : 'Tie',
    topScorer: sorted(scoringKey)[0],
    topAssist: sorted('assists')[0],
    topRebounder: game.sport === 'basketball' ? sorted('rebounds')[0] : undefined,
    topSaves: ['soccer','hockey'].includes(game.sport) ? sorted('saves')[0] : undefined,
    playerStats,
    duration: game.finishedAt && game.startedAt
      ? Math.round((game.finishedAt - game.startedAt) / 60000) : null,
    sportConfig: cfg
  })
})

// ═══════════════════════════════════════════════════════
// INGESTION API — parse CSV / voice text
// ═══════════════════════════════════════════════════════

// POST /api/ingest/csv  — parse CSV text into player list
api.post('/ingest/csv', async (c) => {
  const { text, delimiter = 'auto' } = await c.req.json()
  if (!text) return c.json({ error: 'text required' }, 400)

  const lines = text.trim().split(/\r?\n/).filter((l: string) => l.trim())
  const players: { name: string; jerseyNumber: string; position?: string }[] = []
  const errors: string[] = []

  for (const line of lines) {
    // Try comma, tab, semicolon
    const parts = line.split(/[,\t;]/).map((p: string) => p.trim()).filter(Boolean)
    if (parts.length < 2) { errors.push(`Skipped: "${line}"`); continue }

    // Detect which part is jersey (numeric)
    let jersey = '', name = '', position = ''
    const numIdx = parts.findIndex((p: string) => /^\d+$/.test(p))
    if (numIdx === 0) {
      jersey = parts[0]; name = parts[1]; position = parts[2] || ''
    } else if (numIdx === 1) {
      name = parts[0]; jersey = parts[1]; position = parts[2] || ''
    } else {
      name = parts[0]; jersey = parts[1] || '0'; position = parts[2] || ''
    }

    if (name && jersey) players.push({ name, jerseyNumber: jersey, position: position || undefined })
  }

  return c.json({ players, errors, count: players.length })
})

// POST /api/ingest/voice — parse voice transcript into player list
api.post('/ingest/voice', async (c) => {
  const { transcript } = await c.req.json()
  if (!transcript) return c.json({ error: 'transcript required' }, 400)

  const players: { name: string; jerseyNumber: string }[] = []

  // Patterns: "number 23 John Smith", "#23 John Smith", "23 John Smith", "jersey 5 Marcus"
  const patterns = [
    /(?:number|jersey|#|no\.?)\s*(\d{1,3})\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /(\d{1,3})\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,
  ]

  const seen = new Set<string>()
  for (const pattern of patterns) {
    let m
    while ((m = pattern.exec(transcript)) !== null) {
      const jersey = m[1], name = m[2].trim()
      const key = `${jersey}:${name}`
      if (!seen.has(key)) { seen.add(key); players.push({ jerseyNumber: jersey, name }) }
    }
  }

  // Also parse "Name, Number" format
  const nameNumPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)[,\s]+(?:number|#|no\.?)?\s*(\d{1,3})/gi
  let m2
  while ((m2 = nameNumPattern.exec(transcript)) !== null) {
    const name = m2[1].trim(), jersey = m2[2]
    const key = `${jersey}:${name}`
    if (!seen.has(key)) { seen.add(key); players.push({ name, jerseyNumber: jersey }) }
  }

  return c.json({ players, count: players.length })
})

// GET /api/sports — return sport configs
api.get('/sports', (c) => {
  const configs = Object.entries(SPORT_CONFIGS).map(([key, val]) => ({
    id: key, name: val.name, emoji: val.emoji,
    actionCount: val.actions.length
  }))
  return c.json({ configs })
})

// GET /api/dashboard — overview stats
api.get('/dashboard', (c) => {
  const teams = Array.from(db.teams.values())
  const games = Array.from(db.games.values())
  const totalPlayers = teams.reduce((s, t) => s + t.players.length, 0)
  const activeGames = games.filter(g => g.status === 'active')
  const finishedGames = games.filter(g => g.status === 'finished')
  const recentGames = games.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)

  return c.json({
    totals: {
      teams: teams.length,
      players: totalPlayers,
      games: games.length,
      activeGames: activeGames.length,
      finishedGames: finishedGames.length,
      events: db.events.length
    },
    recentGames,
    activeGames
  })
})

export default api
