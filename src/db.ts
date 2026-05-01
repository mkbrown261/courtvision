// ═══════════════════════════════════════════════════════════════════
// GAME VISION — PERSISTENT DATA LAYER v3
// ═══════════════════════════════════════════════════════════════════

export type SportType = 'basketball' | 'soccer' | 'football' | 'hockey'
export type Position = string
export type UserRole = 'coach' | 'assistant_coach' | 'scorekeeper' | 'admin'

// ─── User / Auth ───────────────────────────────────────────────────
export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  teamIds: string[]   // teams this user can access
  pin?: string        // simple 4-digit PIN (hashed in prod; plain here for MVP)
  createdAt: number
}

// ─── Team / Player ────────────────────────────────────────────────
export type SavedPlayer = {
  id: string
  name: string
  jerseyNumber: string
  position?: string
  teamId: string
  createdAt: number
  careerGames: number
  careerStats: Record<string, number>
}

export type SavedTeam = {
  id: string
  name: string
  sport: SportType
  color: string
  logoInitials: string
  coachName?: string
  coachId?: string
  players: SavedPlayer[]
  createdAt: number
  wins: number
  losses: number
  draws: number
}

// ─── Game ─────────────────────────────────────────────────────────
export type GamePlayer = {
  id: string
  savedPlayerId: string
  name: string
  jerseyNumber: string
  position?: string
  teamId: string
  gameId: string
}

export type GameTeam = {
  id: string
  savedTeamId?: string
  name: string
  color: string
  players: GamePlayer[]
}

export type GameStatus = 'setup' | 'active' | 'paused' | 'finished'

export type Game = {
  id: string
  name?: string
  sport: SportType
  teamA: GameTeam
  teamB: GameTeam
  status: GameStatus
  createdAt: number
  startedAt?: number
  finishedAt?: number
  location?: string
  notes?: string
  activePlayers: Record<string, number>
}

// ─── Events ───────────────────────────────────────────────────────
export type EventType =
  | 'POINTS' | 'ASSIST' | 'REBOUND' | 'BLOCK' | 'STEAL' | 'TURNOVER' | 'FOUL' | 'FREE_THROW'
  | 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SAVE' | 'SHOT_ON_TARGET' | 'SHOT_OFF_TARGET' | 'CORNER' | 'OFFSIDE'
  | 'TOUCHDOWN' | 'PASS_YARDS' | 'RUSH_YARDS' | 'INTERCEPTION' | 'SACK' | 'FIELD_GOAL' | 'TACKLE' | 'PENALTY'
  | 'SHOT' | 'POWER_PLAY' | 'PENALTY_SHOT' | 'ICING' | 'OFFSIDE_HOCKEY'
  | 'SUB_IN' | 'SUB_OUT'

export type GameEvent = {
  id: string
  gameId: string
  playerId: string
  teamId: string
  type: EventType
  value: number
  timestamp: number
  period?: number
  notes?: string
}

// ─── DB singleton ─────────────────────────────────────────────────
export type DB = {
  users: Map<string, User>
  teams: Map<string, SavedTeam>
  games: Map<string, Game>
  events: GameEvent[]
  version: number
}

declare global { var __GV_DB: DB }

if (!globalThis.__GV_DB) {
  globalThis.__GV_DB = {
    users: new Map(),
    teams: new Map(),
    games: new Map(),
    events: [],
    version: 3
  }
}
// Upgrade: add users map if missing (from v2 → v3)
if (!(globalThis.__GV_DB as any).users) {
  (globalThis.__GV_DB as any).users = new Map()
  globalThis.__GV_DB.version = 3
}

export const db: DB = globalThis.__GV_DB

// ─── Helpers ──────────────────────────────────────────────────────
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function getTeamColor(index: number): string {
  const colors = ['#6C63FF','#FF6B35','#00D4AA','#FF4757','#FFB800','#2196F3','#E91E63','#9C27B0']
  return colors[index % colors.length]
}

// ─── Stats Engine ─────────────────────────────────────────────────
export type PlayerStats = {
  playerId: string; savedPlayerId: string; name: string; jersey: string
  teamId: string; teamName: string
  points: number; assists: number; rebounds: number; blocks: number
  steals: number; turnovers: number; fouls: number; freeThrows: number
  goals: number; yellowCards: number; redCards: number; saves: number; shotsOnTarget: number
  touchdowns: number; passYards: number; rushYards: number; interceptions: number
  sacks: number; fieldGoals: number; tackles: number
  shots: number; powerPlays: number
  minutesPlayed: number; isActive: boolean; subInTime?: number
}

export function computeGameStats(gameId: string): {
  playerStats: PlayerStats[]
  teamAScore: number; teamBScore: number
  teamAStats: PlayerStats[]; teamBStats: PlayerStats[]
  events: GameEvent[]; eventCount: number
} {
  const game = db.games.get(gameId)
  if (!game) return { playerStats:[], teamAScore:0, teamBScore:0, teamAStats:[], teamBStats:[], events:[], eventCount:0 }

  const events = db.events.filter(e => e.gameId === gameId)
  const allPlayers = [...game.teamA.players, ...game.teamB.players]
  const statsMap: Record<string, PlayerStats> = {}

  for (const p of allPlayers) {
    const isA = game.teamA.players.some(x => x.id === p.id)
    statsMap[p.id] = {
      playerId: p.id, savedPlayerId: p.savedPlayerId, name: p.name, jersey: p.jerseyNumber,
      teamId: p.teamId, teamName: isA ? game.teamA.name : game.teamB.name,
      points:0, assists:0, rebounds:0, blocks:0, steals:0, turnovers:0, fouls:0, freeThrows:0,
      goals:0, yellowCards:0, redCards:0, saves:0, shotsOnTarget:0,
      touchdowns:0, passYards:0, rushYards:0, interceptions:0, sacks:0, fieldGoals:0, tackles:0,
      shots:0, powerPlays:0, minutesPlayed:0, isActive:false
    }
  }

  const subInTimes: Record<string,number> = {}
  const sorted = [...events].sort((a,b) => a.timestamp - b.timestamp)
  for (const e of sorted) {
    if (e.type === 'SUB_IN') subInTimes[e.playerId] = e.timestamp
    else if (e.type === 'SUB_OUT' && subInTimes[e.playerId]) {
      if (statsMap[e.playerId]) statsMap[e.playerId].minutesPlayed += (e.timestamp - subInTimes[e.playerId]) / 60000
      delete subInTimes[e.playerId]
    }
  }
  const now = Date.now()
  for (const [pid, t] of Object.entries(subInTimes)) {
    if (statsMap[pid]) { statsMap[pid].minutesPlayed += (now - t) / 60000; statsMap[pid].isActive = true; statsMap[pid].subInTime = t }
  }

  for (const e of events) {
    const s = statsMap[e.playerId]; if (!s) continue
    switch (e.type) {
      case 'POINTS': s.points += e.value; break
      case 'ASSIST': s.assists += 1; break
      case 'REBOUND': s.rebounds += 1; break
      case 'BLOCK': s.blocks += 1; break
      case 'STEAL': s.steals += 1; break
      case 'TURNOVER': s.turnovers += 1; break
      case 'FOUL': s.fouls += 1; break
      case 'FREE_THROW': s.freeThrows += e.value; s.points += e.value; break
      case 'GOAL': s.goals += 1; break
      case 'YELLOW_CARD': s.yellowCards += 1; break
      case 'RED_CARD': s.redCards += 1; break
      case 'SAVE': s.saves += 1; break
      case 'SHOT_ON_TARGET': s.shotsOnTarget += 1; break
      case 'TOUCHDOWN': s.touchdowns += 1; s.points += 6; break
      case 'FIELD_GOAL': s.fieldGoals += 1; s.points += 3; break
      case 'PASS_YARDS': s.passYards += e.value; break
      case 'RUSH_YARDS': s.rushYards += e.value; break
      case 'INTERCEPTION': s.interceptions += 1; break
      case 'SACK': s.sacks += 1; break
      case 'TACKLE': s.tackles += 1; break
      case 'SHOT': s.shots += 1; break
      case 'POWER_PLAY': s.powerPlays += 1; break
    }
  }

  const playerStats = Object.values(statsMap)
  const teamAIds = new Set(game.teamA.players.map(p => p.id))
  const teamBIds = new Set(game.teamB.players.map(p => p.id))
  const teamAStats = playerStats.filter(s => teamAIds.has(s.playerId))
  const teamBStats = playerStats.filter(s => teamBIds.has(s.playerId))

  let teamAScore = 0, teamBScore = 0
  if (game.sport === 'basketball' || game.sport === 'football') {
    teamAScore = teamAStats.reduce((s,p) => s + p.points, 0)
    teamBScore = teamBStats.reduce((s,p) => s + p.points, 0)
  } else {
    teamAScore = teamAStats.reduce((s,p) => s + p.goals, 0)
    teamBScore = teamBStats.reduce((s,p) => s + p.goals, 0)
  }

  return { playerStats, teamAScore, teamBScore, teamAStats, teamBStats, events, eventCount: events.length }
}

// ─── Sport Configs ────────────────────────────────────────────────
export type StatAction = {
  key: EventType; label: string; icon: string; color: string
  promptValue?: boolean; valueOptions?: number[]; defaultValue?: number
}

export type SportConfig = {
  name: string; emoji: string; actions: StatAction[]
  scoringStat: string; periods: string[]
  tableColumns: { key: string; label: string }[]
}

export const SPORT_CONFIGS: Record<SportType, SportConfig> = {
  basketball: {
    name: 'Basketball', emoji: '🏀',
    actions: [
      { key:'POINTS', label:'Points', icon:'🏀', color:'#FFB800', promptValue:true, valueOptions:[1,2,3] },
      { key:'ASSIST', label:'Assist', icon:'🎯', color:'#00D4AA' },
      { key:'REBOUND', label:'Rebound', icon:'🔄', color:'#6C63FF' },
      { key:'BLOCK', label:'Block', icon:'🛡️', color:'#2196F3' },
      { key:'STEAL', label:'Steal', icon:'⚡', color:'#FFD700' },
      { key:'TURNOVER', label:'Turnover', icon:'🚫', color:'#FF4757' },
      { key:'FOUL', label:'Foul', icon:'⚠️', color:'#FF6B35' },
      { key:'FREE_THROW', label:'Free Throw', icon:'🎳', color:'#E8C547', promptValue:true, valueOptions:[0,1] },
    ],
    scoringStat: 'points', periods: ['Q1','Q2','Q3','Q4','OT'],
    tableColumns: [
      {key:'points',label:'PTS'},{key:'assists',label:'AST'},{key:'rebounds',label:'REB'},
      {key:'blocks',label:'BLK'},{key:'steals',label:'STL'},{key:'turnovers',label:'TOV'},
      {key:'fouls',label:'FOUL'},{key:'minutesPlayed',label:'MIN'}
    ]
  },
  soccer: {
    name: 'Soccer', emoji: '⚽',
    actions: [
      { key:'GOAL', label:'Goal', icon:'⚽', color:'#00D4AA' },
      { key:'ASSIST', label:'Assist', icon:'🎯', color:'#6C63FF' },
      { key:'SHOT_ON_TARGET', label:'Shot On', icon:'🥅', color:'#2196F3' },
      { key:'SHOT_OFF_TARGET', label:'Shot Off', icon:'↗️', color:'#607D8B' },
      { key:'SAVE', label:'Save', icon:'🧤', color:'#FF6B35' },
      { key:'FOUL', label:'Foul', icon:'⚠️', color:'#FF6B35' },
      { key:'YELLOW_CARD', label:'Yellow Card', icon:'🟨', color:'#FFB800' },
      { key:'RED_CARD', label:'Red Card', icon:'🟥', color:'#FF4757' },
    ],
    scoringStat: 'goals', periods: ['1H','2H','ET1','ET2','PKS'],
    tableColumns: [
      {key:'goals',label:'G'},{key:'assists',label:'A'},{key:'shotsOnTarget',label:'SOT'},
      {key:'saves',label:'SV'},{key:'fouls',label:'FL'},{key:'yellowCards',label:'YC'},
      {key:'redCards',label:'RC'},{key:'minutesPlayed',label:'MIN'}
    ]
  },
  football: {
    name: 'Football', emoji: '🏈',
    actions: [
      { key:'TOUCHDOWN', label:'Touchdown', icon:'🏈', color:'#00D4AA' },
      { key:'FIELD_GOAL', label:'Field Goal', icon:'🥅', color:'#FFB800' },
      { key:'PASS_YARDS', label:'Pass Yds', icon:'➡️', color:'#6C63FF', promptValue:true, defaultValue:10 },
      { key:'RUSH_YARDS', label:'Rush Yds', icon:'🏃', color:'#2196F3', promptValue:true, defaultValue:5 },
      { key:'TACKLE', label:'Tackle', icon:'💪', color:'#9C27B0' },
      { key:'SACK', label:'Sack', icon:'🔨', color:'#FF4757' },
      { key:'INTERCEPTION', label:'Interception', icon:'🎣', color:'#E91E63' },
      { key:'PENALTY', label:'Penalty', icon:'🚩', color:'#FF6B35' },
    ],
    scoringStat: 'points', periods: ['Q1','Q2','Q3','Q4','OT'],
    tableColumns: [
      {key:'touchdowns',label:'TD'},{key:'passYards',label:'PASS'},{key:'rushYards',label:'RUSH'},
      {key:'tackles',label:'TKL'},{key:'sacks',label:'SCK'},{key:'interceptions',label:'INT'},
      {key:'fieldGoals',label:'FG'},{key:'minutesPlayed',label:'MIN'}
    ]
  },
  hockey: {
    name: 'Hockey', emoji: '🏒',
    actions: [
      { key:'GOAL', label:'Goal', icon:'🥅', color:'#00D4AA' },
      { key:'ASSIST', label:'Assist', icon:'🎯', color:'#6C63FF' },
      { key:'SHOT', label:'Shot', icon:'🏒', color:'#2196F3' },
      { key:'SAVE', label:'Save', icon:'🧤', color:'#FF6B35' },
      { key:'BLOCK', label:'Block', icon:'🛡️', color:'#9C27B0' },
      { key:'FOUL', label:'Penalty', icon:'⚠️', color:'#FF4757' },
      { key:'POWER_PLAY', label:'Power Play', icon:'⚡', color:'#FFB800' },
    ],
    scoringStat: 'goals', periods: ['P1','P2','P3','OT'],
    tableColumns: [
      {key:'goals',label:'G'},{key:'assists',label:'A'},{key:'shots',label:'SH'},
      {key:'saves',label:'SV'},{key:'blocks',label:'BLK'},{key:'fouls',label:'PEN'},
      {key:'minutesPlayed',label:'MIN'}
    ]
  }
}
