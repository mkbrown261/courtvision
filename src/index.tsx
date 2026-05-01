import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

app.use('*', cors())
app.use('/static/*', serveStatic({ root: './' }))

// ─── In-Memory Data Store (KV-compatible schema) ───────────────────────────
// All data stored in globalThis so it persists across requests in the same Worker instance
declare global {
  var __SPORTS_DB: {
    games: Map<string, Game>
    players: Map<string, Player>
    events: GameEvent[]
  }
}

if (!globalThis.__SPORTS_DB) {
  globalThis.__SPORTS_DB = {
    games: new Map(),
    players: new Map(),
    events: []
  }
}

const DB = globalThis.__SPORTS_DB

// ─── Types ─────────────────────────────────────────────────────────────────
type Player = {
  id: string
  name: string
  jerseyNumber: string
  teamId: string
  gameId: string
}

type Team = {
  id: string
  name: string
  players: Player[]
}

type GameStatus = 'setup' | 'active' | 'finished'

type Game = {
  id: string
  teamA: Team
  teamB: Team
  status: GameStatus
  createdAt: number
  startedAt?: number
  finishedAt?: number
  sport: string
  activePlayers: { [playerId: string]: number } // playerId -> timeIn (ms)
}

type GameEventType = 'POINTS' | 'ASSIST' | 'REBOUND' | 'TURNOVER' | 'FOUL' | 'SUB_IN' | 'SUB_OUT' | 'BLOCK' | 'STEAL'

type GameEvent = {
  id: string
  gameId: string
  playerId: string
  type: GameEventType
  value: number
  timestamp: number
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function getGameStats(gameId: string) {
  const game = DB.games.get(gameId)
  if (!game) return null

  const events = DB.events.filter(e => e.gameId === gameId)
  const allPlayers = [...game.teamA.players, ...game.teamB.players]

  const statsMap: Record<string, {
    playerId: string, name: string, jersey: string, teamId: string, teamName: string,
    points: number, assists: number, rebounds: number, turnovers: number,
    fouls: number, blocks: number, steals: number, minutesPlayed: number
  }> = {}

  for (const p of allPlayers) {
    const teamName = game.teamA.players.find(x => x.id === p.id) ? game.teamA.name : game.teamB.name
    statsMap[p.id] = {
      playerId: p.id, name: p.name, jersey: p.jerseyNumber,
      teamId: p.teamId, teamName,
      points: 0, assists: 0, rebounds: 0, turnovers: 0,
      fouls: 0, blocks: 0, steals: 0, minutesPlayed: 0
    }
  }

  // Calculate minutes from SUB events
  const subEvents = events.filter(e => e.type === 'SUB_IN' || e.type === 'SUB_OUT')
  const subInMap: Record<string, number> = {}

  for (const e of subEvents.sort((a, b) => a.timestamp - b.timestamp)) {
    if (e.type === 'SUB_IN') {
      subInMap[e.playerId] = e.timestamp
    } else if (e.type === 'SUB_OUT' && subInMap[e.playerId]) {
      const mins = (e.timestamp - subInMap[e.playerId]) / 60000
      if (statsMap[e.playerId]) statsMap[e.playerId].minutesPlayed += mins
      delete subInMap[e.playerId]
    }
  }

  // Add minutes for still-active players
  const now = Date.now()
  for (const [pid, timeIn] of Object.entries(subInMap)) {
    if (statsMap[pid]) statsMap[pid].minutesPlayed += (now - timeIn) / 60000
  }

  // Tally stat events
  for (const e of events) {
    if (!statsMap[e.playerId]) continue
    switch (e.type) {
      case 'POINTS': statsMap[e.playerId].points += e.value; break
      case 'ASSIST': statsMap[e.playerId].assists += 1; break
      case 'REBOUND': statsMap[e.playerId].rebounds += 1; break
      case 'TURNOVER': statsMap[e.playerId].turnovers += 1; break
      case 'FOUL': statsMap[e.playerId].fouls += 1; break
      case 'BLOCK': statsMap[e.playerId].blocks += 1; break
      case 'STEAL': statsMap[e.playerId].steals += 1; break
    }
  }

  const stats = Object.values(statsMap)
  const teamAStats = stats.filter(s => game.teamA.players.find(p => p.id === s.playerId))
  const teamBStats = stats.filter(s => game.teamB.players.find(p => p.id === s.playerId))

  const teamAScore = teamAStats.reduce((s, p) => s + p.points, 0)
  const teamBScore = teamBStats.reduce((s, p) => s + p.points, 0)

  return { stats, teamAStats, teamBStats, teamAScore, teamBScore, events }
}

// ─── API Routes ────────────────────────────────────────────────────────────

// POST /api/games — create game
app.post('/api/games', async (c) => {
  const body = await c.req.json()
  const { teamAName, teamBName, sport = 'basketball' } = body

  if (!teamAName || !teamBName) return c.json({ error: 'Team names required' }, 400)

  const gameId = uid()
  const teamAId = uid()
  const teamBId = uid()

  const game: Game = {
    id: gameId,
    sport,
    status: 'setup',
    createdAt: Date.now(),
    teamA: { id: teamAId, name: teamAName, players: [] },
    teamB: { id: teamBId, name: teamBName, players: [] },
    activePlayers: {}
  }

  DB.games.set(gameId, game)
  return c.json({ game })
})

// GET /api/games — list games
app.get('/api/games', (c) => {
  const games = Array.from(DB.games.values()).sort((a, b) => b.createdAt - a.createdAt)
  return c.json({ games })
})

// GET /api/games/:id — get game
app.get('/api/games/:id', (c) => {
  const game = DB.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)
  return c.json({ game })
})

// POST /api/games/:id/players — add player
app.post('/api/games/:id/players', async (c) => {
  const game = DB.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)

  const { name, jerseyNumber, team } = await c.req.json()
  if (!name || !jerseyNumber || !team) return c.json({ error: 'name, jerseyNumber, team required' }, 400)

  const teamObj = team === 'A' ? game.teamA : game.teamB
  const player: Player = {
    id: uid(), name, jerseyNumber,
    teamId: teamObj.id, gameId: game.id
  }
  teamObj.players.push(player)
  DB.games.set(game.id, game)
  DB.players.set(player.id, player)
  return c.json({ player })
})

// DELETE /api/games/:id/players/:playerId
app.delete('/api/games/:id/players/:playerId', (c) => {
  const game = DB.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)
  const pid = c.req.param('playerId')
  game.teamA.players = game.teamA.players.filter(p => p.id !== pid)
  game.teamB.players = game.teamB.players.filter(p => p.id !== pid)
  DB.games.set(game.id, game)
  return c.json({ success: true })
})

// POST /api/games/:id/start
app.post('/api/games/:id/start', (c) => {
  const game = DB.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)
  game.status = 'active'
  game.startedAt = Date.now()
  DB.games.set(game.id, game)
  return c.json({ game })
})

// POST /api/games/:id/finish
app.post('/api/games/:id/finish', (c) => {
  const game = DB.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)
  game.status = 'finished'
  game.finishedAt = Date.now()
  DB.games.set(game.id, game)
  return c.json({ game })
})

// POST /api/games/:id/events — log stat event
app.post('/api/games/:id/events', async (c) => {
  const game = DB.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)

  const { playerId, type, value = 1 } = await c.req.json()
  if (!playerId || !type) return c.json({ error: 'playerId and type required' }, 400)

  const event: GameEvent = {
    id: uid(), gameId: game.id,
    playerId, type, value,
    timestamp: Date.now()
  }

  // Track active players for minutes
  if (type === 'SUB_IN') {
    game.activePlayers[playerId] = event.timestamp
    DB.games.set(game.id, game)
  } else if (type === 'SUB_OUT') {
    delete game.activePlayers[playerId]
    DB.games.set(game.id, game)
  }

  DB.events.push(event)
  const statsData = getGameStats(game.id)
  return c.json({ event, stats: statsData })
})

// DELETE /api/games/:id/events/last — undo last event
app.delete('/api/games/:id/events/last', (c) => {
  const gameId = c.req.param('id')
  const gameEvents = DB.events.filter(e => e.gameId === gameId)
  if (gameEvents.length === 0) return c.json({ error: 'No events to undo' }, 400)

  const last = gameEvents[gameEvents.length - 1]
  const idx = DB.events.findIndex(e => e.id === last.id)
  if (idx !== -1) DB.events.splice(idx, 1)

  const statsData = getGameStats(gameId)
  return c.json({ removed: last, stats: statsData })
})

// GET /api/games/:id/stats — get live stats
app.get('/api/games/:id/stats', (c) => {
  const statsData = getGameStats(c.req.param('id'))
  if (!statsData) return c.json({ error: 'Not found' }, 404)
  return c.json(statsData)
})

// GET /api/games/:id/summary — post-game summary
app.get('/api/games/:id/summary', (c) => {
  const game = DB.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)

  const statsData = getGameStats(game.id)!
  const { stats, teamAScore, teamBScore } = statsData

  const topScorer = [...stats].sort((a, b) => b.points - a.points)[0]
  const topAssist = [...stats].sort((a, b) => b.assists - a.assists)[0]
  const topRebounder = [...stats].sort((a, b) => b.rebounds - a.rebounds)[0]

  const winner = teamAScore > teamBScore ? game.teamA.name
    : teamBScore > teamAScore ? game.teamB.name : 'Tie'

  return c.json({
    game, teamAScore, teamBScore, winner,
    topScorer, topAssist, topRebounder,
    stats,
    duration: game.finishedAt && game.startedAt
      ? Math.round((game.finishedAt - game.startedAt) / 60000)
      : null
  })
})

// ─── Serve SPA ─────────────────────────────────────────────────────────────
app.get('*', (c) => {
  return c.html(getHTML())
})

function getHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <title>CourtVision — AI Sports Tracker</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --primary: #6C63FF;
      --primary-dark: #5a52e0;
      --accent: #FF6B35;
      --accent2: #00D4AA;
      --bg: #0A0A0F;
      --bg2: #13131A;
      --bg3: #1C1C27;
      --bg4: #252535;
      --border: rgba(255,255,255,0.08);
      --text: #F0F0FF;
      --text2: #9090AA;
      --text3: #606075;
      --success: #00D4AA;
      --danger: #FF4757;
      --warning: #FFB800;
      --card-radius: 16px;
      --btn-radius: 12px;
    }
    html, body { height: 100%; overflow: hidden; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; -webkit-tap-highlight-color: transparent; }
    #app { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

    /* ── Scrollbars ── */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg2); }
    ::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 4px; }

    /* ── Nav ── */
    .nav { background: var(--bg2); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 20px; height: 60px; flex-shrink: 0; gap: 8px; position: relative; z-index: 100; }
    .nav-logo { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 1px; color: var(--primary); display: flex; align-items: center; gap: 8px; }
    .nav-logo i { color: var(--accent); font-size: 20px; }
    .nav-tabs { display: flex; gap: 4px; margin-left: auto; }
    .nav-tab { padding: 7px 16px; border-radius: 8px; border: none; background: transparent; color: var(--text2); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; font-family: inherit; }
    .nav-tab:hover { background: var(--bg3); color: var(--text); }
    .nav-tab.active { background: var(--primary); color: white; }
    .nav-tab i { font-size: 12px; }

    /* ── Views ── */
    .view { display: none; flex: 1; overflow: hidden; }
    .view.active { display: flex; flex-direction: column; }

    /* ── Dashboard ── */
    .dashboard { padding: 24px; overflow-y: auto; gap: 24px; }
    .dashboard-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
    .dashboard-title { font-size: 22px; font-weight: 800; }
    .dashboard-subtitle { color: var(--text2); font-size: 14px; margin-top: 2px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--card-radius); padding: 20px; }
    .stat-card .label { color: var(--text2); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-card .value { font-size: 36px; font-weight: 800; margin-top: 4px; }
    .stat-card .sub { color: var(--text2); font-size: 12px; margin-top: 2px; }
    .games-list { display: flex; flex-direction: column; gap: 12px; }
    .game-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--card-radius); padding: 16px 20px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 16px; }
    .game-card:hover { border-color: var(--primary); background: var(--bg3); transform: translateY(-1px); }
    .game-card-teams { flex: 1; }
    .game-card-title { font-weight: 700; font-size: 15px; }
    .game-card-meta { color: var(--text2); font-size: 12px; margin-top: 3px; }
    .game-card-score { font-size: 22px; font-weight: 800; color: var(--accent); font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-active { background: rgba(0,212,170,0.15); color: var(--success); }
    .badge-finished { background: rgba(144,144,170,0.15); color: var(--text2); }
    .badge-setup { background: rgba(255,184,0,0.15); color: var(--warning); }

    /* ── New Game Modal / Setup ── */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
    .modal-overlay.hidden { display: none; }
    .modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 20px; width: 100%; max-width: 680px; max-height: 88vh; overflow-y: auto; }
    .modal-header { padding: 24px 24px 0; display: flex; align-items: center; justify-content: space-between; }
    .modal-title { font-size: 20px; font-weight: 800; }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 0 24px 24px; display: flex; gap: 12px; justify-content: flex-end; }
    .close-btn { width: 36px; height: 36px; border-radius: 50%; background: var(--bg3); border: none; color: var(--text2); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.2s; }
    .close-btn:hover { background: var(--bg4); color: var(--text); }

    /* ── Forms ── */
    .form-group { margin-bottom: 16px; }
    .form-label { font-size: 13px; font-weight: 600; color: var(--text2); margin-bottom: 6px; display: block; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-input { width: 100%; background: var(--bg3); border: 1.5px solid var(--border); border-radius: 10px; padding: 11px 14px; color: var(--text); font-size: 15px; font-family: inherit; outline: none; transition: border-color 0.2s; }
    .form-input:focus { border-color: var(--primary); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .teams-setup { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
    @media(max-width: 600px) { .teams-setup { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } }
    .team-setup-card { background: var(--bg3); border: 1.5px solid var(--border); border-radius: var(--card-radius); padding: 16px; }
    .team-setup-card.team-a { border-top: 3px solid var(--primary); }
    .team-setup-card.team-b { border-top: 3px solid var(--accent); }
    .team-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .team-label.a { color: var(--primary); }
    .team-label.b { color: var(--accent); }
    .players-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; max-height: 200px; overflow-y: auto; }
    .player-item { display: flex; align-items: center; gap: 10px; background: var(--bg4); border-radius: 8px; padding: 8px 10px; }
    .player-jersey { width: 32px; height: 32px; border-radius: 8px; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; flex-shrink: 0; }
    .player-jersey.b { background: var(--accent); }
    .player-name { flex: 1; font-size: 14px; font-weight: 500; }
    .del-btn { width: 24px; height: 24px; border-radius: 6px; background: transparent; border: none; color: var(--text3); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: all 0.2s; }
    .del-btn:hover { background: rgba(255,71,87,0.15); color: var(--danger); }
    .add-player-row { display: grid; grid-template-columns: 70px 1fr auto; gap: 8px; margin-top: 10px; align-items: end; }
    .add-player-row .form-input { padding: 9px 12px; font-size: 14px; }
    .section-divider { display: flex; align-items: center; gap: 12px; color: var(--text3); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 16px; }
    .section-divider::before, .section-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

    /* ── Buttons ── */
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 20px; border-radius: var(--btn-radius); border: none; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s; font-family: inherit; white-space: nowrap; user-select: none; -webkit-user-select: none; }
    .btn:active { transform: scale(0.96); }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-accent { background: var(--accent); color: white; }
    .btn-accent:hover { background: #e55a28; }
    .btn-success { background: var(--success); color: var(--bg); }
    .btn-ghost { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }
    .btn-ghost:hover { background: var(--bg4); color: var(--text); }
    .btn-danger { background: rgba(255,71,87,0.15); color: var(--danger); border: 1px solid rgba(255,71,87,0.3); }
    .btn-danger:hover { background: var(--danger); color: white; }
    .btn-sm { padding: 7px 14px; font-size: 12px; border-radius: 8px; }
    .btn-lg { padding: 14px 28px; font-size: 16px; border-radius: 14px; }
    .btn-icon { width: 36px; height: 36px; padding: 0; border-radius: 10px; }
    .btn-block { width: 100%; }

    /* ── Game Tracker ── */
    .tracker-layout { display: grid; grid-template-rows: auto 1fr auto; height: 100%; overflow: hidden; }
    .tracker-header { background: var(--bg2); border-bottom: 1px solid var(--border); padding: 12px 20px; display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
    .scoreboard { display: flex; align-items: center; gap: 20px; flex: 1; justify-content: center; }
    .score-team { text-align: center; min-width: 120px; }
    .score-team-name { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text2); }
    .score-num { font-family: 'Bebas Neue', sans-serif; font-size: 52px; line-height: 1; color: var(--text); }
    .score-num.a { color: #a89fff; }
    .score-num.b { color: #ff9f7f; }
    .score-separator { font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: var(--text3); }
    .tracker-timer { font-size: 12px; color: var(--text2); text-align: center; }
    .tracker-body { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0; overflow: hidden; }
    .team-panel { display: flex; flex-direction: column; overflow: hidden; }
    .team-panel-header { padding: 10px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
    .team-panel-header.a { color: #a89fff; background: rgba(108,99,255,0.05); }
    .team-panel-header.b { color: #ff9f7f; background: rgba(255,107,53,0.05); }
    .players-grid { display: flex; flex-direction: column; gap: 6px; padding: 10px; overflow-y: auto; flex: 1; }
    .player-btn { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--bg3); border: 1.5px solid var(--border); border-radius: 10px; cursor: pointer; transition: all 0.15s; user-select: none; -webkit-user-select: none; width: 100%; text-align: left; }
    .player-btn:hover { border-color: var(--primary); background: rgba(108,99,255,0.08); }
    .player-btn.selected-a { border-color: #a89fff !important; background: rgba(108,99,255,0.18) !important; box-shadow: 0 0 0 2px rgba(108,99,255,0.3); }
    .player-btn.selected-b { border-color: #ff9f7f !important; background: rgba(255,107,53,0.18) !important; box-shadow: 0 0 0 2px rgba(255,107,53,0.3); }
    .player-btn.active-player::after { content: '▶'; font-size: 8px; color: var(--success); margin-left: auto; }
    .player-btn-jersey { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; flex-shrink: 0; background: var(--bg4); color: var(--text); }
    .player-btn.selected-a .player-btn-jersey { background: var(--primary); color: white; }
    .player-btn.selected-b .player-btn-jersey { background: var(--accent); color: white; }
    .player-btn-info { flex: 1; min-width: 0; }
    .player-btn-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .player-btn-stats { font-size: 11px; color: var(--text2); margin-top: 1px; }
    .action-panel { width: 200px; background: var(--bg2); border-left: 1px solid var(--border); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow-y: auto; padding: 10px; gap: 8px; flex-shrink: 0; }
    .action-panel-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text3); padding: 4px 0; text-align: center; }
    .selected-player-display { background: var(--bg3); border-radius: 10px; padding: 10px; text-align: center; border: 1px solid var(--border); margin-bottom: 4px; }
    .selected-player-display .sp-jersey { font-size: 24px; font-weight: 900; font-family: 'Bebas Neue', sans-serif; }
    .selected-player-display .sp-name { font-size: 12px; color: var(--text2); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .selected-player-display.team-a .sp-jersey { color: #a89fff; }
    .selected-player-display.team-b .sp-jersey { color: #ff9f7f; }
    .action-btn { width: 100%; padding: 11px; border-radius: 10px; border: 1.5px solid var(--border); background: var(--bg3); color: var(--text); font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; display: flex; align-items: center; gap: 8px; font-family: inherit; }
    .action-btn:hover:not(:disabled) { border-color: var(--primary); background: rgba(108,99,255,0.1); transform: translateY(-1px); }
    .action-btn:active:not(:disabled) { transform: scale(0.97); }
    .action-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .action-btn .action-icon { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .action-btn.pts .action-icon { background: rgba(255,184,0,0.2); }
    .action-btn.ast .action-icon { background: rgba(0,212,170,0.2); }
    .action-btn.reb .action-icon { background: rgba(108,99,255,0.2); }
    .action-btn.tov .action-icon { background: rgba(255,71,87,0.2); }
    .action-btn.foul .action-icon { background: rgba(255,107,53,0.2); }
    .action-btn.blk .action-icon { background: rgba(0,150,255,0.2); }
    .action-btn.stl .action-icon { background: rgba(255,200,50,0.2); }
    .action-btn.sub-in .action-icon { background: rgba(0,212,100,0.2); }
    .action-btn.sub-out .action-icon { background: rgba(255,71,87,0.2); }
    .points-picker { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
    .pts-btn { padding: 10px 0; border-radius: 10px; border: 1.5px solid var(--border); background: var(--bg3); color: var(--text); font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.15s; font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.5px; }
    .pts-btn:hover { background: var(--warning); border-color: var(--warning); color: var(--bg); }
    .pts-btn:active { transform: scale(0.95); }
    .tracker-footer { background: var(--bg2); border-top: 1px solid var(--border); padding: 10px 20px; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .undo-toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: var(--bg4); border: 1px solid var(--border); border-radius: 12px; padding: 10px 18px; font-size: 13px; display: flex; align-items: center; gap: 10px; z-index: 500; box-shadow: 0 8px 24px rgba(0,0,0,0.4); opacity: 0; pointer-events: none; transition: opacity 0.3s; }
    .undo-toast.visible { opacity: 1; pointer-events: auto; }

    /* ── Stats View ── */
    .stats-view { padding: 20px; overflow-y: auto; }
    .stats-tabs { display: flex; gap: 8px; margin-bottom: 20px; }
    .stats-tab { padding: 8px 18px; border-radius: 10px; border: 1.5px solid var(--border); background: transparent; color: var(--text2); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .stats-tab.active { background: var(--primary); border-color: var(--primary); color: white; }
    .stats-table { width: 100%; border-collapse: collapse; }
    .stats-table th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text3); text-align: right; padding: 8px 10px; border-bottom: 1px solid var(--border); }
    .stats-table th:first-child { text-align: left; }
    .stats-table td { padding: 10px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; text-align: right; }
    .stats-table td:first-child { text-align: left; font-weight: 600; }
    .stats-table tr:hover td { background: var(--bg3); }
    .stats-table .leader { color: var(--warning); font-weight: 800; }
    .player-cell { display: flex; align-items: center; gap: 10px; }
    .player-cell-jersey { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; background: var(--bg4); }
    .team-a-j { background: rgba(108,99,255,0.3) !important; color: #a89fff; }
    .team-b-j { background: rgba(255,107,53,0.3) !important; color: #ff9f7f; }

    /* ── Summary View ── */
    .summary-view { padding: 20px; overflow-y: auto; gap: 20px; display: flex; flex-direction: column; }
    .summary-score { background: linear-gradient(135deg, var(--bg3), var(--bg2)); border: 1px solid var(--border); border-radius: 20px; padding: 24px; text-align: center; }
    .summary-score .winner-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--success); margin-bottom: 8px; }
    .summary-score .final-score { font-family: 'Bebas Neue', sans-serif; font-size: 72px; line-height: 1; letter-spacing: 2px; }
    .summary-score .final-score span.a { color: #a89fff; }
    .summary-score .final-score span.sep { color: var(--text3); margin: 0 8px; }
    .summary-score .final-score span.b { color: #ff9f7f; }
    .summary-score .team-names { color: var(--text2); font-size: 14px; margin-top: 8px; }
    .summary-leaders { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .leader-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--card-radius); padding: 16px; }
    .leader-card .lc-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text3); }
    .leader-card .lc-name { font-size: 15px; font-weight: 700; margin-top: 4px; }
    .leader-card .lc-value { font-size: 28px; font-weight: 900; color: var(--warning); font-family: 'Bebas Neue', sans-serif; letter-spacing: 1px; }
    .leader-card .lc-team { font-size: 11px; color: var(--text2); }

    /* ── Empty state ── */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 60px 20px; text-align: center; }
    .empty-state i { font-size: 48px; color: var(--text3); }
    .empty-state h3 { font-size: 18px; font-weight: 700; }
    .empty-state p { color: var(--text2); font-size: 14px; max-width: 280px; line-height: 1.5; }

    /* ── Toast ── */
    .toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
    .toast { background: var(--bg4); border: 1px solid var(--border); border-radius: 12px; padding: 12px 18px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); animation: slideIn 0.3s ease; max-width: 300px; }
    .toast.success { border-color: rgba(0,212,170,0.4); }
    .toast.error { border-color: rgba(255,71,87,0.4); }
    .toast i.success { color: var(--success); }
    .toast i.error { color: var(--danger); }
    @keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    /* ── Loader ── */
    .loader { display: inline-block; width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.15); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Points picker animation ── */
    .pts-picker-wrapper { display: none; padding-top: 4px; }
    .pts-picker-wrapper.visible { display: block; }
    .section-title { font-size: 16px; font-weight: 800; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .action-panel { width: 160px; }
      .action-btn { font-size: 12px; padding: 9px; }
      .player-btn { padding: 8px 10px; }
      .score-num { font-size: 40px; }
      .nav-tab span { display: none; }
    }
    @media (max-width: 520px) {
      .action-panel { width: 140px; }
      .tracker-body { grid-template-columns: 1fr auto 1fr; }
    }
  </style>
</head>
<body>
<div id="app">
  <!-- Nav -->
  <nav class="nav">
    <div class="nav-logo"><i class="fas fa-basketball"></i> CourtVision</div>
    <div class="nav-tabs">
      <button class="nav-tab active" onclick="showView('dashboard')" id="tab-dashboard">
        <i class="fas fa-house"></i><span>Dashboard</span>
      </button>
      <button class="nav-tab" onclick="showView('tracker')" id="tab-tracker">
        <i class="fas fa-play-circle"></i><span>Live Game</span>
      </button>
      <button class="nav-tab" onclick="showView('stats')" id="tab-stats">
        <i class="fas fa-chart-bar"></i><span>Stats</span>
      </button>
    </div>
  </nav>

  <!-- Dashboard View -->
  <div class="view active" id="view-dashboard">
    <div class="dashboard">
      <div class="dashboard-header">
        <div>
          <div class="dashboard-title">Game Center</div>
          <div class="dashboard-subtitle">Real-time stat tracking for every game</div>
        </div>
        <button class="btn btn-primary" onclick="showNewGameModal()">
          <i class="fas fa-plus"></i> New Game
        </button>
      </div>
      <div style="height:20px"></div>
      <div class="stats-grid" id="overview-stats">
        <div class="stat-card"><div class="label">Total Games</div><div class="value" id="stat-total">0</div></div>
        <div class="stat-card"><div class="label">Active</div><div class="value" id="stat-active" style="color:var(--success)">0</div></div>
        <div class="stat-card"><div class="label">Finished</div><div class="value" id="stat-finished">0</div></div>
        <div class="stat-card"><div class="label">Players Tracked</div><div class="value" id="stat-players">0</div></div>
      </div>
      <div class="section-divider">Recent Games</div>
      <div class="games-list" id="games-list">
        <div class="empty-state">
          <i class="fas fa-basketball"></i>
          <h3>No games yet</h3>
          <p>Create your first game to start tracking stats in real time.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Tracker View -->
  <div class="view" id="view-tracker">
    <div id="tracker-no-game" class="empty-state" style="flex:1">
      <i class="fas fa-play-circle"></i>
      <h3>No active game</h3>
      <p>Create or select a game from the Dashboard to begin tracking.</p>
      <button class="btn btn-primary" onclick="showView('dashboard')"><i class="fas fa-arrow-left"></i> Go to Dashboard</button>
    </div>
    <div id="tracker-main" style="display:none; height:100%; overflow:hidden;">
      <div class="tracker-layout">
        <!-- Scoreboard Header -->
        <div class="tracker-header">
          <button class="btn btn-ghost btn-sm" onclick="showView('dashboard')"><i class="fas fa-arrow-left"></i></button>
          <div class="scoreboard">
            <div class="score-team">
              <div class="score-team-name" id="score-name-a">TEAM A</div>
              <div class="score-num a" id="score-a">0</div>
            </div>
            <div class="score-separator">—</div>
            <div class="score-team">
              <div class="score-team-name" id="score-name-b">TEAM B</div>
              <div class="score-num b" id="score-b">0</div>
            </div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <div class="tracker-timer" id="game-timer">00:00</div>
            <button class="btn btn-ghost btn-sm" onclick="undoLast()" title="Undo last action"><i class="fas fa-undo"></i></button>
            <button class="btn btn-sm" id="finish-game-btn" style="background:rgba(255,71,87,0.15);color:var(--danger);border:1px solid rgba(255,71,87,0.3);" onclick="confirmFinishGame()">
              <i class="fas fa-flag-checkered"></i> End
            </button>
          </div>
        </div>

        <!-- Main Body: Team A | Actions | Team B -->
        <div class="tracker-body">
          <!-- Team A -->
          <div class="team-panel">
            <div class="team-panel-header a" id="panel-label-a">TEAM A</div>
            <div class="players-grid" id="players-a"></div>
          </div>

          <!-- Action Panel -->
          <div class="action-panel">
            <div class="action-panel-title">Actions</div>
            <div class="selected-player-display" id="selected-display">
              <div style="color:var(--text3); font-size:12px; padding:8px 0;">
                <i class="fas fa-hand-pointer"></i><br/>Select a player
              </div>
            </div>

            <div id="action-buttons" style="display:flex;flex-direction:column;gap:6px;">
              <!-- Points -->
              <button class="action-btn pts" id="btn-pts" onclick="togglePointsPicker()" disabled>
                <span class="action-icon">🏀</span> Points
              </button>
              <div class="pts-picker-wrapper" id="pts-picker">
                <div class="points-picker">
                  <button class="pts-btn" onclick="logEvent('POINTS',1)">1</button>
                  <button class="pts-btn" onclick="logEvent('POINTS',2)">2</button>
                  <button class="pts-btn" onclick="logEvent('POINTS',3)">3</button>
                </div>
              </div>

              <button class="action-btn ast" onclick="logEvent('ASSIST')" disabled>
                <span class="action-icon">🎯</span> Assist
              </button>
              <button class="action-btn reb" onclick="logEvent('REBOUND')" disabled>
                <span class="action-icon">🔄</span> Rebound
              </button>
              <button class="action-btn blk" onclick="logEvent('BLOCK')" disabled>
                <span class="action-icon">🛡️</span> Block
              </button>
              <button class="action-btn stl" onclick="logEvent('STEAL')" disabled>
                <span class="action-icon">⚡</span> Steal
              </button>
              <button class="action-btn tov" onclick="logEvent('TURNOVER')" disabled>
                <span class="action-icon">🚫</span> Turnover
              </button>
              <button class="action-btn foul" onclick="logEvent('FOUL')" disabled>
                <span class="action-icon">⚠️</span> Foul
              </button>
              <div style="height:1px; background:var(--border); margin:2px 0;"></div>
              <button class="action-btn sub-in" onclick="logEvent('SUB_IN')" disabled>
                <span class="action-icon">✅</span> Sub In
              </button>
              <button class="action-btn sub-out" onclick="logEvent('SUB_OUT')" disabled>
                <span class="action-icon">❌</span> Sub Out
              </button>
            </div>
          </div>

          <!-- Team B -->
          <div class="team-panel">
            <div class="team-panel-header b" id="panel-label-b">TEAM B</div>
            <div class="players-grid" id="players-b"></div>
          </div>
        </div>

        <!-- Footer -->
        <div class="tracker-footer">
          <span style="font-size:12px;color:var(--text3);">
            <i class="fas fa-bolt" style="color:var(--warning)"></i>
            Tap player → tap action → done
          </span>
          <div style="flex:1"></div>
          <span id="event-count" style="font-size:12px;color:var(--text3);">0 events</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Stats View -->
  <div class="view" id="view-stats">
    <div class="stats-view">
      <div id="stats-no-game" class="empty-state">
        <i class="fas fa-chart-bar"></i>
        <h3>No game selected</h3>
        <p>Select a game from the Dashboard to view stats.</p>
        <button class="btn btn-primary" onclick="showView('dashboard')"><i class="fas fa-arrow-left"></i> Dashboard</button>
      </div>
      <div id="stats-content" style="display:none">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
          <div>
            <div class="section-title" id="stats-game-title" style="margin-bottom:0">—</div>
            <div id="stats-game-score" style="font-size:13px;color:var(--text2);margin-top:2px;"></div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost btn-sm" onclick="showView('dashboard')"><i class="fas fa-arrow-left"></i> Back</button>
            <button class="btn btn-sm btn-success" id="btn-view-summary" onclick="showSummary()" style="display:none"><i class="fas fa-trophy"></i> Summary</button>
          </div>
        </div>
        <div class="stats-tabs">
          <button class="stats-tab active" onclick="setStatsTab('all')">All Players</button>
          <button class="stats-tab" id="tab-team-a-label" onclick="setStatsTab('a')">Team A</button>
          <button class="stats-tab" id="tab-team-b-label" onclick="setStatsTab('b')">Team B</button>
        </div>
        <div style="overflow-x:auto;">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>PTS</th>
                <th>AST</th>
                <th>REB</th>
                <th>BLK</th>
                <th>STL</th>
                <th>TOV</th>
                <th>FOUL</th>
                <th>MIN</th>
              </tr>
            </thead>
            <tbody id="stats-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- New Game Modal -->
<div class="modal-overlay hidden" id="new-game-modal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title"><i class="fas fa-plus-circle" style="color:var(--primary)"></i> New Game Setup</div>
      <button class="close-btn" onclick="hideNewGameModal()"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Sport</label>
        <select class="form-input" id="game-sport">
          <option value="basketball">🏀 Basketball</option>
          <option value="soccer">⚽ Soccer</option>
          <option value="football">🏈 Football</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Team A Name</label>
          <input class="form-input" type="text" id="team-a-name" placeholder="e.g. Lakers" maxlength="30"/>
        </div>
        <div class="form-group">
          <label class="form-label">Team B Name</label>
          <input class="form-input" type="text" id="team-b-name" placeholder="e.g. Celtics" maxlength="30"/>
        </div>
      </div>

      <div class="teams-setup">
        <!-- Team A players -->
        <div class="team-setup-card team-a">
          <div class="team-label a"><i class="fas fa-users"></i> Team A Roster</div>
          <div class="players-list" id="modal-players-a"></div>
          <div class="add-player-row">
            <input class="form-input" type="text" id="a-jersey" placeholder="#" maxlength="3"/>
            <input class="form-input" type="text" id="a-name" placeholder="Player name" maxlength="30"/>
            <button class="btn btn-primary btn-sm" onclick="addModalPlayer('A')"><i class="fas fa-plus"></i></button>
          </div>
        </div>
        <!-- Team B players -->
        <div class="team-setup-card team-b">
          <div class="team-label b"><i class="fas fa-users"></i> Team B Roster</div>
          <div class="players-list" id="modal-players-b"></div>
          <div class="add-player-row">
            <input class="form-input" type="text" id="b-jersey" placeholder="#" maxlength="3"/>
            <input class="form-input" type="text" id="b-name" placeholder="Player name" maxlength="30"/>
            <button class="btn btn-accent btn-sm" onclick="addModalPlayer('B')"><i class="fas fa-plus"></i></button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="hideNewGameModal()">Cancel</button>
      <button class="btn btn-primary btn-lg" id="create-game-btn" onclick="createGame()">
        <i class="fas fa-basketball"></i> Create Game & Start Tracking
      </button>
    </div>
  </div>
</div>

<!-- Summary Modal -->
<div class="modal-overlay hidden" id="summary-modal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title"><i class="fas fa-trophy" style="color:var(--warning)"></i> Game Summary</div>
      <button class="close-btn" onclick="document.getElementById('summary-modal').classList.add('hidden')"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body" id="summary-body"></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="document.getElementById('summary-modal').classList.add('hidden')">Close</button>
    </div>
  </div>
</div>

<!-- Toast Container -->
<div class="toast-container" id="toast-container"></div>

<script>
// ═══════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════
let currentGameId = null
let selectedPlayerId = null
let selectedPlayerTeam = null // 'A' or 'B'
let liveStats = {}
let currentGame = null
let timerInterval = null
let statsTabFilter = 'all'
let games = []
let ptsPicker = false

// Temp modal state
let modalPlayers = { A: [], B: [] }

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'))
  document.getElementById('view-' + name).classList.add('active')
  document.getElementById('tab-' + name)?.classList.add('active')

  if (name === 'stats' && currentGameId) renderStatsView()
  if (name === 'dashboard') loadDashboard()
}

// ═══════════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════════
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)
  const r = await fetch(path, opts)
  return r.json()
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
async function loadDashboard() {
  const data = await api('GET', '/api/games')
  games = data.games || []

  const total = games.length
  const active = games.filter(g => g.status === 'active').length
  const finished = games.filter(g => g.status === 'finished').length
  const players = games.reduce((s, g) => s + (g.teamA?.players?.length||0) + (g.teamB?.players?.length||0), 0)

  document.getElementById('stat-total').textContent = total
  document.getElementById('stat-active').textContent = active
  document.getElementById('stat-finished').textContent = finished
  document.getElementById('stat-players').textContent = players

  const list = document.getElementById('games-list')
  if (games.length === 0) {
    list.innerHTML = \`<div class="empty-state"><i class="fas fa-basketball"></i><h3>No games yet</h3><p>Create your first game to start tracking stats in real time.</p></div>\`
    return
  }

  list.innerHTML = games.map(g => {
    const statusBadge = g.status === 'active'
      ? '<span class="badge badge-active"><i class="fas fa-circle"></i>&nbsp;Live</span>'
      : g.status === 'finished'
      ? '<span class="badge badge-finished">Finished</span>'
      : '<span class="badge badge-setup">Setup</span>'
    const date = new Date(g.createdAt).toLocaleDateString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
    return \`<div class="game-card" onclick="openGame('\${g.id}')">
      <div class="game-card-teams">
        <div class="game-card-title">\${esc(g.teamA.name)} vs \${esc(g.teamB.name)}</div>
        <div class="game-card-meta">\${g.sport.charAt(0).toUpperCase()+g.sport.slice(1)} &bull; \${date} &bull; \${(g.teamA.players?.length||0)+(g.teamB.players?.length||0)} players</div>
      </div>
      \${statusBadge}
      <div style="text-align:right">
        <div class="game-card-score" id="card-score-\${g.id}">—</div>
      </div>
    </div>\`
  }).join('')

  // Load scores async
  games.forEach(async g => {
    if (g.status !== 'setup') {
      const s = await api('GET', \`/api/games/\${g.id}/stats\`)
      const el = document.getElementById(\`card-score-\${g.id}\`)
      if (el) el.textContent = \`\${s.teamAScore||0} — \${s.teamBScore||0}\`
    }
  })
}

async function openGame(id) {
  const data = await api('GET', \`/api/games/\${id}\`)
  currentGame = data.game
  currentGameId = id

  if (currentGame.status === 'finished') {
    showView('stats')
    document.getElementById('btn-view-summary').style.display = 'flex'
    return
  }

  if (currentGame.status === 'setup') {
    // Open game straight into tracker and auto-start
    await api('POST', \`/api/games/\${id}/start\`)
    currentGame.status = 'active'
  }

  loadTracker()
  showView('tracker')
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW GAME MODAL
// ═══════════════════════════════════════════════════════════════════════════
function showNewGameModal() {
  modalPlayers = { A: [], B: [] }
  document.getElementById('team-a-name').value = ''
  document.getElementById('team-b-name').value = ''
  document.getElementById('modal-players-a').innerHTML = ''
  document.getElementById('modal-players-b').innerHTML = ''
  document.getElementById('a-jersey').value = ''
  document.getElementById('a-name').value = ''
  document.getElementById('b-jersey').value = ''
  document.getElementById('b-name').value = ''
  document.getElementById('new-game-modal').classList.remove('hidden')
  setTimeout(() => document.getElementById('team-a-name').focus(), 100)
}

function hideNewGameModal() {
  document.getElementById('new-game-modal').classList.add('hidden')
}

function addModalPlayer(team) {
  const jersey = document.getElementById(team.toLowerCase() + '-jersey').value.trim()
  const name = document.getElementById(team.toLowerCase() + '-name').value.trim()
  if (!jersey || !name) { showToast('Enter jersey number and name', 'error'); return }

  modalPlayers[team].push({ jersey, name })
  document.getElementById(team.toLowerCase() + '-jersey').value = ''
  document.getElementById(team.toLowerCase() + '-name').value = ''
  renderModalPlayers(team)
  document.getElementById(team.toLowerCase() + '-jersey').focus()
}

function removeModalPlayer(team, idx) {
  modalPlayers[team].splice(idx, 1)
  renderModalPlayers(team)
}

function renderModalPlayers(team) {
  const container = document.getElementById('modal-players-' + team.toLowerCase())
  const isA = team === 'A'
  container.innerHTML = modalPlayers[team].map((p, i) => \`
    <div class="player-item">
      <div class="player-jersey \${isA ? '' : 'b'}">\${esc(p.jersey)}</div>
      <div class="player-name">\${esc(p.name)}</div>
      <button class="del-btn" onclick="removeModalPlayer('\${team}', \${i})"><i class="fas fa-times"></i></button>
    </div>
  \`).join('')
}

// Enter key support
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const modal = document.getElementById('new-game-modal')
    if (!modal.classList.contains('hidden')) {
      if (document.activeElement.id === 'a-name') addModalPlayer('A')
      else if (document.activeElement.id === 'b-name') addModalPlayer('B')
    }
  }
  if (e.key === 'Escape') {
    document.getElementById('new-game-modal').classList.add('hidden')
    document.getElementById('summary-modal').classList.add('hidden')
  }
})

async function createGame() {
  const teamAName = document.getElementById('team-a-name').value.trim()
  const teamBName = document.getElementById('team-b-name').value.trim()
  const sport = document.getElementById('game-sport').value

  if (!teamAName || !teamBName) { showToast('Enter both team names', 'error'); return }

  const btn = document.getElementById('create-game-btn')
  btn.innerHTML = '<div class="loader"></div> Creating...'
  btn.disabled = true

  const data = await api('POST', '/api/games', { teamAName, teamBName, sport })
  if (!data.game) { showToast('Failed to create game', 'error'); btn.innerHTML = '🏀 Create Game & Start Tracking'; btn.disabled = false; return }

  const gameId = data.game.id
  currentGameId = gameId

  // Add all modal players
  const addPromises = [
    ...modalPlayers.A.map(p => api('POST', \`/api/games/\${gameId}/players\`, { name: p.name, jerseyNumber: p.jersey, team: 'A' })),
    ...modalPlayers.B.map(p => api('POST', \`/api/games/\${gameId}/players\`, { name: p.name, jerseyNumber: p.jersey, team: 'B' }))
  ]
  await Promise.all(addPromises)

  // Start the game
  const startData = await api('POST', \`/api/games/\${gameId}/start\`)
  currentGame = startData.game

  hideNewGameModal()
  btn.innerHTML = '<i class="fas fa-basketball"></i> Create Game & Start Tracking'
  btn.disabled = false

  showToast('Game created! Let\\'s go! 🏀', 'success')
  loadTracker()
  showView('tracker')
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKER
// ═══════════════════════════════════════════════════════════════════════════
async function loadTracker() {
  if (!currentGameId) return

  const data = await api('GET', \`/api/games/\${currentGameId}\`)
  currentGame = data.game

  document.getElementById('tracker-no-game').style.display = 'none'
  document.getElementById('tracker-main').style.display = 'block'

  document.getElementById('score-name-a').textContent = currentGame.teamA.name
  document.getElementById('score-name-b').textContent = currentGame.teamB.name
  document.getElementById('panel-label-a').textContent = currentGame.teamA.name.toUpperCase()
  document.getElementById('panel-label-b').textContent = currentGame.teamB.name.toUpperCase()

  renderPlayerButtons()
  await refreshStats()
  startTimer()
}

function renderPlayerButtons() {
  renderTeamButtons('a', currentGame.teamA.players)
  renderTeamButtons('b', currentGame.teamB.players)
}

function renderTeamButtons(side, players) {
  const container = document.getElementById('players-' + side)
  if (!players || players.length === 0) {
    container.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:10px;text-align:center;">No players added</div>'
    return
  }
  container.innerHTML = players.map(p => {
    const s = liveStats[p.id] || {}
    const isSelected = selectedPlayerId === p.id
    const selClass = isSelected ? (side === 'a' ? 'selected-a' : 'selected-b') : ''
    return \`<button class="player-btn \${selClass}" id="pbtn-\${p.id}" onclick="selectPlayer('\${p.id}', '\${side.toUpperCase()}')">
      <div class="player-btn-jersey">\${esc(p.jerseyNumber)}</div>
      <div class="player-btn-info">
        <div class="player-btn-name">\${esc(p.name)}</div>
        <div class="player-btn-stats">\${s.points||0}pts · \${s.assists||0}ast · \${s.rebounds||0}reb</div>
      </div>
    </button>\`
  }).join('')
}

function selectPlayer(id, team) {
  selectedPlayerId = id
  selectedPlayerTeam = team

  // Deselect all, select current
  document.querySelectorAll('.player-btn').forEach(b => {
    b.classList.remove('selected-a', 'selected-b')
  })
  const btn = document.getElementById('pbtn-' + id)
  if (btn) btn.classList.add(team === 'A' ? 'selected-a' : 'selected-b')

  // Update selected display
  const players = [...(currentGame?.teamA?.players||[]), ...(currentGame?.teamB?.players||[])]
  const player = players.find(p => p.id === id)
  const display = document.getElementById('selected-display')
  if (player) {
    display.className = 'selected-player-display team-' + team.toLowerCase()
    display.innerHTML = \`<div class="sp-jersey">#\${esc(player.jerseyNumber)}</div><div class="sp-name">\${esc(player.name)}</div>\`
  }

  // Enable action buttons
  document.querySelectorAll('#action-buttons button').forEach(b => b.disabled = false)
  ptsPicker = false
  document.getElementById('pts-picker').classList.remove('visible')
}

function togglePointsPicker() {
  if (!selectedPlayerId) return
  ptsPicker = !ptsPicker
  document.getElementById('pts-picker').classList.toggle('visible', ptsPicker)
}

async function logEvent(type, value = 1) {
  if (!selectedPlayerId) { showToast('Select a player first', 'error'); return }
  if (!currentGameId) return

  ptsPicker = false
  document.getElementById('pts-picker').classList.remove('visible')

  const data = await api('POST', \`/api/games/\${currentGameId}/events\`, {
    playerId: selectedPlayerId, type, value
  })

  if (data.stats) {
    updateLiveStats(data.stats)
    showEventFeedback(type, value)
  }
}

function showEventFeedback(type, value) {
  const labels = { POINTS: \`+\${value} PTS\`, ASSIST: '+AST', REBOUND: '+REB', BLOCK: '+BLK', STEAL: '+STL', TURNOVER: 'TOV', FOUL: 'FOUL', SUB_IN: 'SUB IN ✅', SUB_OUT: 'SUB OUT ❌' }
  showToast(labels[type] || type, 'success')
}

function updateLiveStats(statsData) {
  if (!statsData) return

  // Update scores
  document.getElementById('score-a').textContent = statsData.teamAScore || 0
  document.getElementById('score-b').textContent = statsData.teamBScore || 0

  // Build lookup
  statsData.stats?.forEach(s => { liveStats[s.playerId] = s })

  // Update player button sub-labels
  const allPlayers = [...(currentGame?.teamA?.players||[]), ...(currentGame?.teamB?.players||[])]
  allPlayers.forEach(p => {
    const s = liveStats[p.id] || {}
    const btn = document.getElementById('pbtn-' + p.id)
    if (btn) {
      const statsEl = btn.querySelector('.player-btn-stats')
      if (statsEl) statsEl.textContent = \`\${s.points||0}pts · \${s.assists||0}ast · \${s.rebounds||0}reb\`
    }
  })

  // Event count
  const evtCount = statsData.events?.length || 0
  document.getElementById('event-count').textContent = \`\${evtCount} event\${evtCount!==1?'s':''}\`
}

async function refreshStats() {
  if (!currentGameId) return
  const data = await api('GET', \`/api/games/\${currentGameId}/stats\`)
  updateLiveStats(data)
}

async function undoLast() {
  if (!currentGameId) return
  const data = await api('DELETE', \`/api/games/\${currentGameId}/events/last\`)
  if (data.removed) {
    updateLiveStats(data.stats)
    showToast('Last action undone', 'success')
  } else {
    showToast('Nothing to undo', 'error')
  }
}

async function confirmFinishGame() {
  if (!confirm('End this game and generate final stats?')) return
  await api('POST', \`/api/games/\${currentGameId}/finish\`)
  currentGame.status = 'finished'
  clearInterval(timerInterval)
  showToast('Game finished! 🏆', 'success')
  document.getElementById('btn-view-summary').style.display = 'flex'
  showView('stats')
}

function startTimer() {
  clearInterval(timerInterval)
  const startedAt = currentGame?.startedAt || Date.now()
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000)
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0')
    const s = (elapsed % 60).toString().padStart(2, '0')
    document.getElementById('game-timer').textContent = \`\${m}:\${s}\`
  }, 1000)
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS VIEW
// ═══════════════════════════════════════════════════════════════════════════
async function renderStatsView() {
  if (!currentGameId) return
  const data = await api('GET', \`/api/games/\${currentGameId}/stats\`)
  const game = currentGame

  document.getElementById('stats-no-game').style.display = 'none'
  document.getElementById('stats-content').style.display = 'block'

  if (game) {
    document.getElementById('stats-game-title').innerHTML = \`<i class="fas fa-basketball" style="color:var(--warning)"></i> \${esc(game.teamA.name)} vs \${esc(game.teamB.name)}\`
    document.getElementById('stats-game-score').textContent = \`\${data.teamAScore||0} — \${data.teamBScore||0} &bull; \${game.status}\`
    document.getElementById('tab-team-a-label').textContent = game.teamA.name
    document.getElementById('tab-team-b-label').textContent = game.teamB.name
  }

  if (game?.status === 'finished') {
    document.getElementById('btn-view-summary').style.display = 'flex'
  }

  renderStatsTable(data.stats || [], data)
}

function setStatsTab(filter) {
  statsTabFilter = filter
  document.querySelectorAll('.stats-tab').forEach((t, i) => {
    t.classList.toggle('active', ['all','a','b'][i] === filter)
  })
  // Re-render with current data
  api('GET', \`/api/games/\${currentGameId}/stats\`).then(data => renderStatsTable(data.stats || [], data))
}

function renderStatsTable(stats, data) {
  let filtered = stats
  if (statsTabFilter === 'a' && currentGame) {
    const aIds = new Set(currentGame.teamA.players.map(p => p.id))
    filtered = stats.filter(s => aIds.has(s.playerId))
  } else if (statsTabFilter === 'b' && currentGame) {
    const bIds = new Set(currentGame.teamB.players.map(p => p.id))
    filtered = stats.filter(s => bIds.has(s.playerId))
  }

  const maxPts = Math.max(...filtered.map(s => s.points), 0)
  const maxAst = Math.max(...filtered.map(s => s.assists), 0)
  const maxReb = Math.max(...filtered.map(s => s.rebounds), 0)

  const isA = (s) => currentGame?.teamA?.players?.find(p => p.id === s.playerId)

  const tbody = document.getElementById('stats-tbody')
  tbody.innerHTML = filtered.sort((a,b) => b.points - a.points).map(s => {
    const teamClass = isA(s) ? 'team-a-j' : 'team-b-j'
    return \`<tr>
      <td>
        <div class="player-cell">
          <div class="player-cell-jersey \${teamClass}">\${esc(s.jersey)}</div>
          <div>
            <div style="font-weight:600">\${esc(s.name)}</div>
            <div style="font-size:11px;color:var(--text3)">\${esc(s.teamName||'')}</div>
          </div>
        </div>
      </td>
      <td class="\${s.points===maxPts && maxPts>0?'leader':''}">\${s.points}</td>
      <td class="\${s.assists===maxAst && maxAst>0?'leader':''}">\${s.assists}</td>
      <td class="\${s.rebounds===maxReb && maxReb>0?'leader':''}">\${s.rebounds}</td>
      <td>\${s.blocks}</td>
      <td>\${s.steals}</td>
      <td>\${s.turnovers}</td>
      <td>\${s.fouls}</td>
      <td>\${s.minutesPlayed > 0 ? s.minutesPlayed.toFixed(1) : '—'}</td>
    </tr>\`
  }).join('')
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════
async function showSummary() {
  if (!currentGameId) return
  const data = await api('GET', \`/api/games/\${currentGameId}/summary\`)

  const modal = document.getElementById('summary-modal')
  const body = document.getElementById('summary-body')

  const winnerColor = data.winner === data.game?.teamA?.name ? '#a89fff' : data.winner === data.game?.teamB?.name ? '#ff9f7f' : 'var(--text2)'

  body.innerHTML = \`
    <div class="summary-view" style="padding:0">
      <div class="summary-score">
        <div class="winner-label"><i class="fas fa-trophy"></i> &nbsp;\${esc(data.winner)} wins!</div>
        <div class="final-score">
          <span class="a">\${data.teamAScore}</span>
          <span class="sep">—</span>
          <span class="b">\${data.teamBScore}</span>
        </div>
        <div class="team-names">\${esc(data.game?.teamA?.name||'')} vs \${esc(data.game?.teamB?.name||'')}</div>
        \${data.duration ? \`<div style="color:var(--text3);font-size:12px;margin-top:6px;">Duration: \${data.duration} min</div>\` : ''}
      </div>

      <div style="height:16px"></div>
      <div style="font-size:13px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Game Leaders</div>
      <div class="summary-leaders">
        \${leaderCard('Top Scorer', data.topScorer, 'points', 'PTS', 'fas fa-star')}
        \${leaderCard('Top Assists', data.topAssist, 'assists', 'AST', 'fas fa-hands-helping')}
        \${leaderCard('Top Rebounder', data.topRebounder, 'rebounds', 'REB', 'fas fa-basketball')}
      </div>
    </div>
  \`
  modal.classList.remove('hidden')
}

function leaderCard(label, player, stat, unit, icon) {
  if (!player) return \`<div class="leader-card"><div class="lc-label">\${label}</div><div class="lc-name" style="color:var(--text3)">—</div></div>\`
  return \`<div class="leader-card">
    <div class="lc-label"><i class="\${icon}" style="margin-right:4px"></i>\${label}</div>
    <div class="lc-name">\${esc(player.name)}</div>
    <div class="lc-value">\${player[stat]}<span style="font-size:14px;color:var(--text2)">\${unit}</span></div>
    <div class="lc-team">\${esc(player.teamName||'')}</div>
  </div>\`
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
function esc(str) {
  if (!str) return ''
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container')
  const toast = document.createElement('div')
  toast.className = \`toast \${type}\`
  toast.innerHTML = \`<i class="fas \${type==='success'?'fa-check-circle':'fa-exclamation-circle'} \${type}"></i>\${esc(msg)}\`
  container.appendChild(toast)
  setTimeout(() => { toast.style.opacity='0'; toast.style.transform='translateX(40px)'; toast.style.transition='all 0.3s'; setTimeout(() => toast.remove(), 300) }, 2200)
}

// ═══════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════
loadDashboard()
</script>
</body>
</html>`
}

export default app
