# CourtVision — AI Sports Tracking System

## Project Overview
- **Name**: CourtVision
- **Goal**: Real-time sports stat tracking system replacing paper stat sheets
- **Sport**: Basketball (MVP), with Soccer/Football modular support planned
- **Target Users**: Scorekeepers, Coaches, Scouts

## Features (Phase 1 MVP — Complete)
- ✅ Game setup in under 60 seconds (team names + roster)
- ✅ 1–2 tap stat entry during live games
- ✅ Real-time scoreboard (live point tallies)
- ✅ Player stat tracking: Points (1/2/3), Assists, Rebounds, Blocks, Steals, Turnovers, Fouls
- ✅ Sub In / Sub Out with automatic minutes-played calculation
- ✅ Undo last action
- ✅ Live stats table with team filtering + stat leaders highlighted
- ✅ Post-game summary with winner, top scorer, top assister, top rebounder
- ✅ Dashboard with game history + live scores
- ✅ Zero-friction UX — no typing during gameplay

## URLs
- **Production**: https://courtvision.pages.dev
- **Live Sandbox Preview**: https://3000-i74ftlsgvroferl3tkcao-0e616f0a.sandbox.novita.ai

## Tech Stack
- **Backend**: Hono (TypeScript) on Cloudflare Workers
- **Frontend**: Vanilla JS SPA served from Hono (single bundle)
- **Styling**: Custom CSS with Inter + Bebas Neue fonts + FontAwesome icons
- **Build**: Vite + @hono/vite-build
- **Deploy**: Cloudflare Pages via Wrangler

## Data Architecture
```
Game { id, teamA, teamB, status, sport, activePlayers, timestamps }
Team { id, name, players[] }
Player { id, name, jerseyNumber, teamId, gameId }
GameEvent { id, gameId, playerId, type, value, timestamp }
```
- **Storage**: In-memory (globalThis) — Cloudflare Worker instance scope
- **Event Types**: POINTS | ASSIST | REBOUND | BLOCK | STEAL | TURNOVER | FOUL | SUB_IN | SUB_OUT

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/games | Create new game |
| GET | /api/games | List all games |
| GET | /api/games/:id | Get game details |
| POST | /api/games/:id/players | Add player to team |
| POST | /api/games/:id/start | Start game |
| POST | /api/games/:id/finish | End game |
| POST | /api/games/:id/events | Log stat event |
| DELETE | /api/games/:id/events/last | Undo last event |
| GET | /api/games/:id/stats | Live stats |
| GET | /api/games/:id/summary | Post-game summary |

## User Guide
1. **Dashboard** → Click "New Game"
2. Enter team names and add players (jersey # + name)
3. Click "Create Game & Start Tracking"
4. **Live Game**: Tap a player button → tap action → done
5. For Points: tap "Points" → choose 1 / 2 / 3
6. Use "End Game" button to finish and view summary
7. **Stats tab** shows full stat breakdown per player

## Deployment
- **Platform**: Cloudflare Pages
- **Status**: ✅ Active
- **Last Updated**: 2026-05-01

## Roadmap
- Phase 2: Persistent D1 database storage
- Phase 3: Multi-sport config (Soccer, Football)
- Phase 4: AI video analysis pipeline (MediaPipe + OpenCV)
- Phase 5: Scout dashboard, player profiles, recruiting tools
