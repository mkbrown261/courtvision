import { Hono } from 'hono'
import { db, uid, computeGameStats, SPORT_CONFIGS, type SportType, type SavedTeam, type SavedPlayer, type Game, type GameTeam, type GamePlayer, type GameEvent, type EventType, type User, type UserRole } from '../db'

const api = new Hono()

// ═══════════════════════════════════════════════════════
// AUTH MIDDLEWARE HELPERS
// ═══════════════════════════════════════════════════════

function getUser(c: any): User | null {
  const userId = c.req.header('X-User-Id') || c.req.query('userId')
  if (!userId) return null
  return db.users.get(userId) || null
}

function requireAuth(c: any): { user: User; error?: never } | { user?: never; error: Response } {
  const user = getUser(c)
  if (!user) {
    return { error: c.json({ error: 'Unauthorized: X-User-Id header required' }, 401) }
  }
  return { user }
}

function canAccessTeam(user: User, teamId: string): boolean {
  if (user.role === 'admin') return true
  return user.teamIds.includes(teamId)
}

/**
 * Role permission matrix:
 *   admin          — full access to everything
 *   coach          — read/write own teams + games; manage users on own teams
 *   assistant_coach— read/write own teams + games; cannot delete teams/games
 *   scorekeeper    — read own teams; record events on assigned-team games only
 */
function canWriteTeam(user: User, teamId: string): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'coach') return user.teamIds.includes(teamId)
  if (user.role === 'assistant_coach') return user.teamIds.includes(teamId)
  // scorekeeper: read-only on teams
  return false
}

function canDeleteTeam(user: User, teamId: string): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'coach') return user.teamIds.includes(teamId)
  return false
}

function canCreateGame(user: User, teamASavedId?: string, teamBSavedId?: string): boolean {
  if (user.role === 'admin' || user.role === 'coach' || user.role === 'assistant_coach') return true
  // scorekeeper needs to be on at least one team
  if (user.role === 'scorekeeper') {
    if (teamASavedId && user.teamIds.includes(teamASavedId)) return true
    if (teamBSavedId && user.teamIds.includes(teamBSavedId)) return true
    return false
  }
  return false
}

function canRecordEvent(user: User, game: Game): boolean {
  if (user.role === 'admin' || user.role === 'coach' || user.role === 'assistant_coach') return true
  if (user.role === 'scorekeeper') {
    const hasA = game.teamA.savedTeamId ? user.teamIds.includes(game.teamA.savedTeamId) : false
    const hasB = game.teamB.savedTeamId ? user.teamIds.includes(game.teamB.savedTeamId) : false
    return hasA || hasB
  }
  return false
}

// ═══════════════════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════════════════

// POST /api/auth/register
api.post('/auth/register', async (c) => {
  const { name, email, role = 'coach', pin } = await c.req.json()
  if (!name || !email) return c.json({ error: 'name and email required' }, 400)
  if (!['coach', 'assistant_coach', 'scorekeeper', 'admin'].includes(role)) {
    return c.json({ error: 'role must be coach, assistant_coach, scorekeeper, or admin' }, 400)
  }

  const existing = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase())
  if (existing) return c.json({ error: 'Email already registered' }, 409)

  const user: User = {
    id: uid(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: role as UserRole,
    teamIds: [],
    pin: pin ? String(pin) : undefined,
    createdAt: Date.now()
  }
  db.users.set(user.id, user)
  return c.json({ user: { ...user, pin: undefined } })
})

// POST /api/auth/login
api.post('/auth/login', async (c) => {
  const { email, pin } = await c.req.json()
  if (!email) return c.json({ error: 'email required' }, 400)

  const user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user) return c.json({ error: 'User not found' }, 404)

  if (user.pin && user.pin !== String(pin)) {
    return c.json({ error: 'Invalid PIN' }, 401)
  }

  return c.json({ user: { ...user, pin: undefined }, userId: user.id })
})

// GET /api/auth/me
api.get('/auth/me', (c) => {
  const auth = requireAuth(c)
  if (auth.error) return auth.error
  const { user } = auth
  return c.json({ user: { ...user, pin: undefined } })
})

// GET /api/auth/users  (admin only)
api.get('/auth/users', (c) => {
  const auth = requireAuth(c)
  if (auth.error) return auth.error
  if (auth.user.role !== 'admin') return c.json({ error: 'Admin only' }, 403)
  const users = Array.from(db.users.values()).map(u => ({ ...u, pin: undefined }))
  return c.json({ users })
})

// POST /api/auth/assign — admin or coach assigns user to team
api.post('/auth/assign', async (c) => {
  const auth = requireAuth(c)
  if (auth.error) return auth.error
  if (auth.user.role !== 'admin' && auth.user.role !== 'coach') {
    return c.json({ error: 'Coach or admin only' }, 403)
  }
  const { userId, teamId } = await c.req.json()
  const target = db.users.get(userId)
  if (!target) return c.json({ error: 'User not found' }, 404)
  const team = db.teams.get(teamId)
  if (!team) return c.json({ error: 'Team not found' }, 404)

  // Coach can only assign to their own teams
  if (auth.user.role === 'coach' && !canAccessTeam(auth.user, teamId)) {
    return c.json({ error: 'You do not own this team' }, 403)
  }

  if (!target.teamIds.includes(teamId)) target.teamIds.push(teamId)
  db.users.set(target.id, target)
  return c.json({ success: true, user: { ...target, pin: undefined } })
})

// POST /api/auth/revoke — remove a user from a team
api.post('/auth/revoke', async (c) => {
  const auth = requireAuth(c)
  if (auth.error) return auth.error
  if (auth.user.role !== 'admin' && auth.user.role !== 'coach') {
    return c.json({ error: 'Coach or admin only' }, 403)
  }
  const { userId, teamId } = await c.req.json()
  const target = db.users.get(userId)
  if (!target) return c.json({ error: 'User not found' }, 404)

  if (auth.user.role === 'coach' && !canAccessTeam(auth.user, teamId)) {
    return c.json({ error: 'You do not own this team' }, 403)
  }

  target.teamIds = target.teamIds.filter(id => id !== teamId)
  db.users.set(target.id, target)
  return c.json({ success: true, user: { ...target, pin: undefined } })
})

// ═══════════════════════════════════════════════════════
// PARSER ENGINE — structured, deterministic
// ═══════════════════════════════════════════════════════

type ParsedPlayer = {
  name: string
  jerseyNumber: string
  position?: string
  source: string
}

type ParseConflict = {
  type: 'duplicate_jersey' | 'duplicate_name' | 'ambiguous'
  message: string
  players: ParsedPlayer[]
}

type ParseResult = {
  players: ParsedPlayer[]
  conflicts: ParseConflict[]
  skipped: string[]
  raw: string[]
}

/**
 * Step 1 — Normalize: collapse whitespace, remove filler words and punctuation
 * used as separators. Preserves the actual name tokens.
 */
function normalize(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/[,;]+/g, ' ')
    .replace(/\b(the|a|an|and|also|next|then|plus|with|is|number|jersey|no\.?|#)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isNumber(s: string): boolean {
  return /^\d{1,3}$/.test(s.trim())
}

/**
 * Step 2 — Pattern recognition: detect [number][name] or [name][number]
 * with optional position. Returns null when line is unrecognizable.
 */
function extractTokens(line: string): { number: string; name: string; position: string } | null {
  const cleaned = line.trim()
  if (!cleaned) return null

  // Pattern 1: leading number — "23 John Smith" / "#23 John Smith"
  const p1 = /^#?(\d{1,3})\s+([A-Za-z][A-Za-z\-'\.]{1,}(?:\s+[A-Za-z][A-Za-z\-'\.]{1,})*)(?:\s+([A-Z]{1,3}))?$/
  const m1 = cleaned.match(p1)
  if (m1) return { number: m1[1], name: m1[2].trim(), position: m1[3] || '' }

  // Pattern 2: trailing number — "John Smith 23" / "John Smith, 23"
  const p2 = /^([A-Za-z][A-Za-z\-'\.]{1,}(?:\s+[A-Za-z][A-Za-z\-'\.]{1,})*)[,\s]+#?(\d{1,3})(?:\s+([A-Z]{1,3}))?$/
  const m2 = cleaned.match(p2)
  if (m2) return { number: m2[2], name: m2[1].trim(), position: m2[3] || '' }

  // Pattern 3: delimiter-separated — "23, John Smith, SF" or "John Smith, 23, SF"
  const parts = cleaned.split(/[,\t;|]/).map(p => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const numIdx = parts.findIndex(p => isNumber(p))
    if (numIdx === 0 && parts[1]) {
      return { number: parts[0], name: parts[1], position: parts[2] || '' }
    }
    if (numIdx === 1 && parts[0]) {
      return { number: parts[1], name: parts[0], position: parts[2] || '' }
    }
    if (numIdx === 2 && parts[0] && parts[1]) {
      return { number: parts[2], name: parts[0] + ' ' + parts[1], position: parts[3] || '' }
    }
    // No number found — name-only fallback (jersey defaults to '0')
    if (numIdx === -1 && parts.length >= 1) {
      return { number: '0', name: parts[0], position: parts[1] || '' }
    }
  }

  return null
}

/**
 * Step 3 — Validate uniqueness: no duplicate jersey numbers (one-to-one mapping),
 * flag duplicate names. Returns players list + conflicts array.
 */
function runParseEngine(lines: string[]): ParseResult {
  const players: ParsedPlayer[] = []
  const conflicts: ParseConflict[] = []
  const skipped: string[] = []
  const raw: string[] = []

  const jerseyMap: Map<string, ParsedPlayer[]> = new Map()
  const nameMap: Map<string, ParsedPlayer[]> = new Map()

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    raw.push(line)

    // Skip header rows
    if (/^(name|player|#|no|jersey|number|pos|position)/i.test(line)) {
      skipped.push(`Header skipped: "${line}"`)
      continue
    }

    const normalized = normalize(line)
    const tokens = extractTokens(normalized) || extractTokens(line)

    if (!tokens || !tokens.name || tokens.name.length < 2) {
      skipped.push(`Could not parse: "${line}"`)
      continue
    }

    const player: ParsedPlayer = {
      name: tokens.name.trim(),
      jerseyNumber: tokens.number.trim(),
      position: tokens.position?.trim() || undefined,
      source: line
    }

    const jKey = player.jerseyNumber
    const nKey = player.name.toLowerCase()

    if (!jerseyMap.has(jKey)) jerseyMap.set(jKey, [])
    jerseyMap.get(jKey)!.push(player)

    if (!nameMap.has(nKey)) nameMap.set(nKey, [])
    nameMap.get(nKey)!.push(player)

    players.push(player)
  }

  // Detect duplicate jersey numbers (violates one-to-one mapping)
  for (const [jersey, group] of jerseyMap) {
    if (group.length > 1 && jersey !== '0') {
      conflicts.push({
        type: 'duplicate_jersey',
        message: `Jersey #${jersey} assigned to ${group.length} players: ${group.map(p => p.name).join(', ')}`,
        players: group
      })
    }
  }

  // Detect duplicate names
  for (const [, group] of nameMap) {
    if (group.length > 1) {
      conflicts.push({
        type: 'duplicate_name',
        message: `Name "${group[0].name}" appears ${group.length} times`,
        players: group
      })
    }
  }

  return { players, conflicts, skipped, raw }
}

// POST /api/parse — unified structured parser
// Output: { team?: string, players: [{number, name},...], conflicts, skipped, raw, count, hasConflicts }
api.post('/parse', async (c) => {
  const { text, source = 'text', teamName } = await c.req.json()
  if (!text) return c.json({ error: 'text required' }, 400)

  const lines = text.trim().split(/\r?\n/).filter((l: string) => l.trim())
  const result = runParseEngine(lines)

  // Structured output matching the requested JSON shape
  return c.json({
    team: teamName || null,
    players: result.players.map(p => ({ number: parseInt(p.jerseyNumber) || 0, name: p.name, position: p.position })),
    raw_players: result.players,
    conflicts: result.conflicts,
    skipped: result.skipped,
    count: result.players.length,
    hasConflicts: result.conflicts.length > 0,
    source
  })
})

// POST /api/parse/voice — voice transcript parser with team detection
api.post('/parse/voice', async (c) => {
  const { transcript } = await c.req.json()
  if (!transcript) return c.json({ error: 'transcript required' }, 400)

  // Extract team name from transcript
  const teamMatch = transcript.match(/(?:team|squad|for)\s+([A-Z][a-zA-Z\s]{2,20}?)(?:,|\.|number|jersey|#|\d)/i)
  const detectedTeam = teamMatch ? teamMatch[1].trim() : undefined

  const playerSegments: string[] = []

  // "number 23 John Smith" / "jersey 5 Marcus" / "#12 Kyle"
  const re1 = /(?:number|jersey|#|no\.?)\s*(\d{1,3})\s+([A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+)*)/gi
  let m: RegExpExecArray | null
  while ((m = re1.exec(transcript)) !== null) {
    playerSegments.push(`${m[1]} ${m[2]}`)
  }

  // "John Smith, number 23" / "Marcus Jones 5"
  const re2 = /([A-Z][a-z]+\s+[A-Z][a-z]+)[,\s]+(?:number|jersey|#|no\.?)?\s*(\d{1,3})/g
  while ((m = re2.exec(transcript)) !== null) {
    playerSegments.push(`${m[2]} ${m[1]}`)
  }

  // Deduplicate
  const seen = new Set<string>()
  const uniqueSegments: string[] = []
  for (const seg of playerSegments) {
    const key = seg.toLowerCase().replace(/\s+/g, '')
    if (!seen.has(key)) { seen.add(key); uniqueSegments.push(seg) }
  }

  const result = runParseEngine(uniqueSegments)
  return c.json({
    team: detectedTeam || null,
    players: result.players.map(p => ({ number: parseInt(p.jerseyNumber) || 0, name: p.name, position: p.position })),
    raw_players: result.players,
    conflicts: result.conflicts,
    skipped: result.skipped,
    teamName: detectedTeam,
    count: result.players.length,
    hasConflicts: result.conflicts.length > 0
  })
})

// ═══════════════════════════════════════════════════════
// TEAMS API
// ═══════════════════════════════════════════════════════

api.get('/teams', (c) => {
  const user = getUser(c)
  let teams = Array.from(db.teams.values()).sort((a, b) => b.createdAt - a.createdAt)

  // Scope: non-admin users only see their assigned teams
  if (user && user.role !== 'admin') {
    teams = teams.filter(t => user.teamIds.includes(t.id))
  }

  return c.json({ teams })
})

api.post('/teams', async (c) => {
  const body = await c.req.json()
  const { name, sport = 'basketball', color, coachName, logoInitials } = body
  if (!name) return c.json({ error: 'name required' }, 400)

  const user = getUser(c)
  // Scorekeepers cannot create teams
  if (user && user.role === 'scorekeeper') {
    return c.json({ error: 'Scorekeepers cannot create teams' }, 403)
  }

  const id = uid()
  const initials = logoInitials || name.substring(0, 2).toUpperCase()
  const teamColor = color || '#6C63FF'

  const team: SavedTeam = {
    id, name: name.trim(), sport: sport as SportType,
    color: teamColor, logoInitials: initials,
    coachName, players: [],
    createdAt: Date.now(),
    wins: 0, losses: 0, draws: 0
  }
  db.teams.set(id, team)

  // Auto-assign creator to this team
  if (user && !user.teamIds.includes(id)) {
    user.teamIds.push(id)
    db.users.set(user.id, user)
  }

  return c.json({ team })
})

api.get('/teams/:id', (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)

  // Scope check: user must be assigned to this team (admin sees all)
  const user = getUser(c)
  if (user && !canAccessTeam(user, team.id)) {
    return c.json({ error: 'Access denied: you are not assigned to this team' }, 403)
  }

  return c.json({ team })
})

api.put('/teams/:id', async (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && !canWriteTeam(user, team.id)) {
    return c.json({ error: 'Access denied: insufficient role to modify this team' }, 403)
  }

  const body = await c.req.json()
  const allowed = ['name', 'sport', 'color', 'coachName', 'logoInitials']
  for (const k of allowed) { if (body[k] !== undefined) (team as any)[k] = body[k] }
  db.teams.set(team.id, team)
  return c.json({ team })
})

api.delete('/teams/:id', (c) => {
  const user = getUser(c)
  const teamId = c.req.param('id')
  const team = db.teams.get(teamId)
  if (!team) return c.json({ error: 'Not found' }, 404)

  if (user && !canDeleteTeam(user, teamId)) {
    return c.json({ error: 'Access denied: only coaches and admins can delete teams' }, 403)
  }

  db.teams.delete(teamId)
  return c.json({ success: true })
})

// POST /api/teams/:id/players — add single player with full conflict checks
api.post('/teams/:id/players', async (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && !canWriteTeam(user, team.id)) {
    return c.json({ error: 'Access denied: insufficient role to modify this team' }, 403)
  }

  const { name, jerseyNumber, position } = await c.req.json()
  if (!name || jerseyNumber === undefined || jerseyNumber === '') {
    return c.json({ error: 'name and jerseyNumber required' }, 400)
  }

  const jersey = String(jerseyNumber).trim()
  const playerName = name.trim()

  // Validate jersey is numeric 0-999
  if (!/^\d{1,3}$/.test(jersey)) {
    return c.json({ error: 'jerseyNumber must be 1–3 digits (0–999)' }, 400)
  }

  // Duplicate jersey check (one-to-one mapping)
  const dupJersey = team.players.find(p => p.jerseyNumber === jersey)
  if (dupJersey) {
    return c.json({
      error: `Jersey #${jersey} is already assigned to ${dupJersey.name}`,
      conflict: 'duplicate_jersey',
      existingPlayer: { id: dupJersey.id, name: dupJersey.name, jerseyNumber: dupJersey.jerseyNumber }
    }, 409)
  }

  // Duplicate name check
  const dupName = team.players.find(p => p.name.toLowerCase() === playerName.toLowerCase())
  if (dupName) {
    return c.json({
      error: `"${playerName}" is already on this roster`,
      conflict: 'duplicate_name',
      existingPlayer: { id: dupName.id, name: dupName.name, jerseyNumber: dupName.jerseyNumber }
    }, 409)
  }

  const player: SavedPlayer = {
    id: uid(), name: playerName, jerseyNumber: jersey,
    position: position?.trim() || undefined,
    teamId: team.id, createdAt: Date.now(),
    careerGames: 0, careerStats: {}
  }
  team.players.push(player)
  db.teams.set(team.id, team)
  return c.json({ player })
})

// PUT /api/teams/:id/players/:pid — edit player
api.put('/teams/:id/players/:pid', async (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && !canWriteTeam(user, team.id)) {
    return c.json({ error: 'Access denied: insufficient role to modify this team' }, 403)
  }

  const pid = c.req.param('pid')
  const player = team.players.find(p => p.id === pid)
  if (!player) return c.json({ error: 'Player not found' }, 404)

  const { name, jerseyNumber, position } = await c.req.json()

  if (jerseyNumber !== undefined) {
    const jersey = String(jerseyNumber).trim()
    if (!/^\d{1,3}$/.test(jersey)) {
      return c.json({ error: 'jerseyNumber must be 1–3 digits' }, 400)
    }
    const dup = team.players.find(p => p.id !== pid && p.jerseyNumber === jersey)
    if (dup) {
      return c.json({
        error: `Jersey #${jersey} is already assigned to ${dup.name}`,
        conflict: 'duplicate_jersey',
        existingPlayer: { id: dup.id, name: dup.name, jerseyNumber: dup.jerseyNumber }
      }, 409)
    }
    player.jerseyNumber = jersey
  }

  if (name) {
    const dupName = team.players.find(p => p.id !== pid && p.name.toLowerCase() === name.trim().toLowerCase())
    if (dupName) {
      return c.json({
        error: `"${name.trim()}" already exists on this roster`,
        conflict: 'duplicate_name'
      }, 409)
    }
    player.name = name.trim()
  }

  if (position !== undefined) player.position = position?.trim() || undefined

  db.teams.set(team.id, team)
  return c.json({ player })
})

api.delete('/teams/:id/players/:pid', (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && !canWriteTeam(user, team.id)) {
    return c.json({ error: 'Access denied: insufficient role to modify this team' }, 403)
  }

  team.players = team.players.filter(p => p.id !== c.req.param('pid'))
  db.teams.set(team.id, team)
  return c.json({ success: true })
})

// POST /api/teams/:id/import — bulk import with full conflict detection + edit-before-save support
api.post('/teams/:id/import', async (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && !canWriteTeam(user, team.id)) {
    return c.json({ error: 'Access denied: insufficient role to modify this team' }, 403)
  }

  const { players, overwriteConflicts = false } = await c.req.json()
  if (!Array.isArray(players)) return c.json({ error: 'players array required' }, 400)

  const added: SavedPlayer[] = []
  const skipped: string[] = []
  const conflicts: { player: any; reason: string; type: string }[] = []

  // First pass: validate all incoming players for internal duplicates
  const incomingJerseys = new Map<string, string>() // jersey -> name
  const incomingNames = new Map<string, string>()   // name -> jersey

  for (const p of players) {
    if (!p.name || (p.jerseyNumber === undefined && p.number === undefined)) {
      skipped.push(`Missing data: ${JSON.stringify(p)}`)
      continue
    }
    const jersey = String(p.jerseyNumber ?? p.number ?? '0').trim()
    const pname = p.name.trim()

    if (incomingJerseys.has(jersey) && jersey !== '0') {
      conflicts.push({ player: p, reason: `Jersey #${jersey} appears more than once in this import`, type: 'duplicate_jersey' })
      continue
    }
    if (incomingNames.has(pname.toLowerCase())) {
      conflicts.push({ player: p, reason: `Name "${pname}" appears more than once in this import`, type: 'duplicate_name' })
      continue
    }
    incomingJerseys.set(jersey, pname)
    incomingNames.set(pname.toLowerCase(), jersey)
  }

  // Second pass: check against existing roster
  for (const p of players) {
    if (!p.name || (p.jerseyNumber === undefined && p.number === undefined)) continue

    const jersey = String(p.jerseyNumber ?? p.number ?? '0').trim()
    const pname = p.name.trim()

    // Skip already flagged as internal conflict
    if (conflicts.some(cc => cc.player === p)) continue

    const dupJersey = team.players.find(ex => ex.jerseyNumber === jersey)
    const dupName = team.players.find(ex => ex.name.toLowerCase() === pname.toLowerCase())

    if (dupJersey && !overwriteConflicts) {
      conflicts.push({ player: p, reason: `Jersey #${jersey} already used by ${dupJersey.name} on this roster`, type: 'duplicate_jersey' })
      continue
    }
    if (dupName && !overwriteConflicts) {
      conflicts.push({ player: p, reason: `"${pname}" already exists on this roster`, type: 'duplicate_name' })
      continue
    }

    // Overwrite: remove the conflicting existing entry
    if (dupJersey && overwriteConflicts) {
      team.players = team.players.filter(ex => ex.id !== dupJersey.id)
    }

    const player: SavedPlayer = {
      id: uid(), name: pname, jerseyNumber: jersey,
      position: p.position?.trim() || undefined,
      teamId: team.id, createdAt: Date.now(),
      careerGames: 0, careerStats: {}
    }
    team.players.push(player)
    added.push(player)
  }

  db.teams.set(team.id, team)
  return c.json({
    added, count: added.length, skipped,
    conflicts, hasConflicts: conflicts.length > 0,
    team: { id: team.id, name: team.name, totalPlayers: team.players.length }
  })
})

// GET /api/teams/:id/stats — career stats aggregated across finished games
api.get('/teams/:id/stats', (c) => {
  const team = db.teams.get(c.req.param('id'))
  if (!team) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && !canAccessTeam(user, team.id)) {
    return c.json({ error: 'Access denied: you are not assigned to this team' }, 403)
  }

  const teamGames = Array.from(db.games.values()).filter(g =>
    g.status === 'finished' &&
    (g.teamA.savedTeamId === team.id || g.teamB.savedTeamId === team.id)
  )

  const playerAggregates: Record<string, any> = {}
  for (const p of team.players) {
    playerAggregates[p.id] = { player: p, games: 0, pts: 0, ast: 0, reb: 0, goals: 0, min: 0 }
  }

  for (const game of teamGames) {
    const stats = computeGameStats(game.id)
    for (const s of stats.playerStats) {
      const agg = playerAggregates[s.savedPlayerId]
      if (agg) {
        agg.games++; agg.pts += s.points; agg.ast += s.assists
        agg.reb += s.rebounds; agg.goals += s.goals; agg.min += s.minutesPlayed
      }
    }
  }

  return c.json({ team, games: teamGames.length, playerAggregates: Object.values(playerAggregates) })
})

// ═══════════════════════════════════════════════════════
// GAMES API
// ═══════════════════════════════════════════════════════

api.get('/games', (c) => {
  const user = getUser(c)
  let games = Array.from(db.games.values()).sort((a, b) => b.createdAt - a.createdAt)

  // Scorekeepers only see games for their assigned teams
  if (user && user.role === 'scorekeeper') {
    games = games.filter(g =>
      (g.teamA.savedTeamId && user.teamIds.includes(g.teamA.savedTeamId)) ||
      (g.teamB.savedTeamId && user.teamIds.includes(g.teamB.savedTeamId))
    )
  }

  return c.json({ games })
})

api.post('/games', async (c) => {
  const body = await c.req.json()
  const { teamAName, teamBName, teamASavedId, teamBSavedId, sport = 'basketball', name, location } = body

  if (!teamAName || !teamBName) return c.json({ error: 'Team names required' }, 400)

  const user = getUser(c)
  if (user && !canCreateGame(user, teamASavedId, teamBSavedId)) {
    return c.json({ error: 'Access denied: you must be assigned to at least one team to create a game' }, 403)
  }

  // Scope check: if a saved team is referenced, confirm user can access it
  if (user && teamASavedId) {
    const tA = db.teams.get(teamASavedId)
    if (tA && !canAccessTeam(user, teamASavedId)) {
      return c.json({ error: `Access denied: you are not assigned to team "${tA.name}"` }, 403)
    }
  }
  if (user && teamBSavedId) {
    const tB = db.teams.get(teamBSavedId)
    if (tB && !canAccessTeam(user, teamBSavedId)) {
      return c.json({ error: `Access denied: you are not assigned to team "${tB.name}"` }, 403)
    }
  }

  const gameId = uid()

  const buildGameTeam = (savedId: string | undefined, fallbackName: string, teamSlot: 'A' | 'B'): GameTeam => {
    const saved = savedId ? db.teams.get(savedId) : undefined
    const teamId = uid()
    const players: GamePlayer[] = (saved?.players || []).map(p => ({
      id: uid(), savedPlayerId: p.id, name: p.name,
      jerseyNumber: p.jerseyNumber, position: p.position,
      teamId, gameId
    }))
    return {
      id: teamId, savedTeamId: savedId,
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

api.get('/games/:id', (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && user.role === 'scorekeeper') {
    const hasA = game.teamA.savedTeamId ? user.teamIds.includes(game.teamA.savedTeamId) : false
    const hasB = game.teamB.savedTeamId ? user.teamIds.includes(game.teamB.savedTeamId) : false
    if (!hasA && !hasB) return c.json({ error: 'Access denied: you are not assigned to either team in this game' }, 403)
  }

  return c.json({ game })
})

api.post('/games/:id/players', async (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && !canRecordEvent(user, game)) {
    return c.json({ error: 'Access denied: insufficient permissions for this game' }, 403)
  }

  const { name, jerseyNumber, team, position, savedPlayerId } = await c.req.json()
  if (!name || !jerseyNumber || !team) return c.json({ error: 'name, jerseyNumber, team required' }, 400)

  const teamObj = team === 'A' ? game.teamA : game.teamB

  // Duplicate jersey check within game team
  const dup = teamObj.players.find(p => p.jerseyNumber === String(jerseyNumber).trim())
  if (dup) {
    return c.json({
      error: `Jersey #${jerseyNumber} is already in use by ${dup.name}`,
      conflict: 'duplicate_jersey'
    }, 409)
  }

  const player: GamePlayer = {
    id: uid(), savedPlayerId: savedPlayerId || uid(),
    name: name.trim(), jerseyNumber: String(jerseyNumber).trim(),
    position: position?.trim(), teamId: teamObj.id, gameId: game.id
  }
  teamObj.players.push(player)
  db.games.set(game.id, game)
  return c.json({ player })
})

api.delete('/games/:id/players/:pid', (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && !canRecordEvent(user, game)) {
    return c.json({ error: 'Access denied' }, 403)
  }

  const pid = c.req.param('pid')
  game.teamA.players = game.teamA.players.filter(p => p.id !== pid)
  game.teamB.players = game.teamB.players.filter(p => p.id !== pid)
  db.games.set(game.id, game)
  return c.json({ success: true })
})

api.post('/games/:id/start', (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && !canRecordEvent(user, game)) {
    return c.json({ error: 'Access denied' }, 403)
  }

  game.status = 'active'; game.startedAt = Date.now()
  db.games.set(game.id, game)
  return c.json({ game })
})

api.post('/games/:id/finish', (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && user.role === 'scorekeeper' && !canRecordEvent(user, game)) {
    return c.json({ error: 'Access denied' }, 403)
  }

  game.status = 'finished'; game.finishedAt = Date.now()
  db.games.set(game.id, game)

  const stats = computeGameStats(game.id)
  const aTeam = game.teamA.savedTeamId ? db.teams.get(game.teamA.savedTeamId) : undefined
  const bTeam = game.teamB.savedTeamId ? db.teams.get(game.teamB.savedTeamId) : undefined
  if (aTeam && bTeam) {
    if (stats.teamAScore > stats.teamBScore) { aTeam.wins++; bTeam.losses++ }
    else if (stats.teamBScore > stats.teamAScore) { bTeam.wins++; aTeam.losses++ }
    else { aTeam.draws++; bTeam.draws++ }
    db.teams.set(aTeam.id, aTeam); db.teams.set(bTeam.id, bTeam)
  }

  return c.json({ game, stats })
})

api.post('/games/:id/events', async (c) => {
  const game = db.games.get(c.req.param('id'))
  if (!game) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && !canRecordEvent(user, game)) {
    return c.json({ error: 'Access denied: you are not permitted to record events for this game' }, 403)
  }

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

  if (type === 'SUB_IN') game.activePlayers[playerId] = event.timestamp
  else if (type === 'SUB_OUT') delete game.activePlayers[playerId]

  db.events.push(event)
  db.games.set(game.id, game)

  return c.json({ event, stats: computeGameStats(game.id) })
})

api.delete('/games/:id/events/last', (c) => {
  const gameId = c.req.param('id')
  const game = db.games.get(gameId)
  if (!game) return c.json({ error: 'Not found' }, 404)

  const user = getUser(c)
  if (user && !canRecordEvent(user, game)) {
    return c.json({ error: 'Access denied' }, 403)
  }

  const idxs = db.events.map((e, i) => e.gameId === gameId ? i : -1).filter(i => i !== -1)
  if (!idxs.length) return c.json({ error: 'No events' }, 400)
  const last = db.events[idxs[idxs.length - 1]]
  db.events.splice(idxs[idxs.length - 1], 1)

  if (last.type === 'SUB_IN') {
    if (game) { delete game.activePlayers[last.playerId]; db.games.set(gameId, game) }
  }
  return c.json({ removed: last, stats: computeGameStats(gameId) })
})

api.get('/games/:id/stats', (c) => {
  return c.json(computeGameStats(c.req.param('id')))
})

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
    topSaves: ['soccer', 'hockey'].includes(game.sport) ? sorted('saves')[0] : undefined,
    playerStats,
    duration: game.finishedAt && game.startedAt
      ? Math.round((game.finishedAt - game.startedAt) / 60000) : null,
    sportConfig: cfg
  })
})

// ═══════════════════════════════════════════════════════
// LEGACY INGESTION (kept for backward compat)
// ═══════════════════════════════════════════════════════

api.post('/ingest/csv', async (c) => {
  const { text } = await c.req.json()
  if (!text) return c.json({ error: 'text required' }, 400)
  const lines = text.trim().split(/\r?\n/).filter((l: string) => l.trim())
  const result = runParseEngine(lines)
  return c.json({ players: result.players, errors: result.skipped, count: result.players.length })
})

api.post('/ingest/voice', async (c) => {
  const { transcript } = await c.req.json()
  if (!transcript) return c.json({ error: 'transcript required' }, 400)
  const players: { name: string; jerseyNumber: string }[] = []
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
  return c.json({ players, count: players.length })
})

// ═══════════════════════════════════════════════════════
// SPORTS & DASHBOARD
// ═══════════════════════════════════════════════════════

api.get('/sports', (c) => {
  const configs = Object.entries(SPORT_CONFIGS).map(([key, val]) => ({
    id: key, name: val.name, emoji: val.emoji, actionCount: val.actions.length
  }))
  return c.json({ configs })
})

api.get('/dashboard', (c) => {
  const user = getUser(c)
  let teams = Array.from(db.teams.values())
  let games = Array.from(db.games.values())

  // Scope to user's teams if not admin
  if (user && user.role !== 'admin') {
    teams = teams.filter(t => user.teamIds.includes(t.id))
    games = games.filter(g =>
      (g.teamA.savedTeamId && user.teamIds.includes(g.teamA.savedTeamId)) ||
      (g.teamB.savedTeamId && user.teamIds.includes(g.teamB.savedTeamId)) ||
      user.role !== 'scorekeeper' // coaches/assistant coaches see all games
    )
  }

  const totalPlayers = teams.reduce((s, t) => s + t.players.length, 0)
  const activeGames = games.filter(g => g.status === 'active')
  const finishedGames = games.filter(g => g.status === 'finished')
  const recentGames = [...games].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)

  return c.json({
    totals: {
      teams: teams.length, players: totalPlayers, games: games.length,
      activeGames: activeGames.length, finishedGames: finishedGames.length,
      events: db.events.length
    },
    recentGames, activeGames
  })
})

export default api
