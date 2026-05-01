# Game Vision — Sports Intelligence Platform

## Project Overview
- **Name**: Game Vision
- **Previous Name**: CourtVision
- **Goal**: Complete sports data ecosystem replacing paper stat tracking
- **Target Users**: Coaches, Scorekeepers, Scouts
- **Devices**: iPad (primary), Mobile, Web

## Live URLs
- **Production (Cloudflare)**: https://courtvision-7k6.pages.dev
- **GitHub**: https://github.com/mkbrown261/courtvision

## Core Systems Built
1. ✅ Universal Data Ingestion Engine (CSV, Voice, Manual, Photo/OCR placeholder)
2. ✅ Team & Player Persistence Layer (saved teams, career stats, win/loss records)
3. ✅ Multi-Sport Intelligence Engine (Basketball, Soccer, Football, Hockey)
4. ✅ Real-Time Player Tracking (Sub In/Out, minutes played, on-court state)
5. ✅ Ultra-Fast Stat Entry UX (1-2 taps, no typing during gameplay)
6. ✅ Coach Intelligence Dashboard (scoring leaders, efficiency/min, overplay alerts, AI insights)
7. ✅ Ecosystem Connection (Coach → Team → Scorekeeper → Game → Coach Dashboard)

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/dashboard | Platform overview stats |
| GET/POST | /api/teams | List / Create teams |
| GET/PUT/DELETE | /api/teams/:id | Team management |
| POST | /api/teams/:id/players | Add player to saved team |
| POST | /api/teams/:id/import | Bulk import players |
| GET | /api/teams/:id/stats | Career stats aggregation |
| GET/POST | /api/games | List / Create games |
| POST | /api/games/:id/start | Start game |
| POST | /api/games/:id/finish | End game + update W/L |
| POST | /api/games/:id/events | Log stat event |
| DELETE | /api/games/:id/events/last | Undo last event |
| GET | /api/games/:id/stats | Live stats |
| GET | /api/games/:id/summary | Post-game summary |
| POST | /api/ingest/csv | Parse CSV/text into players |
| POST | /api/ingest/voice | Parse voice transcript into players |
| GET | /api/sports | Sport configs (actions, scoring, columns) |

## Tech Stack
- **Backend**: Hono (TypeScript) — modular routes in src/routes/api.ts
- **Data Layer**: src/db.ts — types, sport configs, stats engine
- **Frontend**: src/ui.ts — full SPA (~2500 lines vanilla JS)
- **Build**: Vite + @hono/vite-build → Cloudflare Pages
- **Storage**: globalThis in-memory (Worker instance scope)

## Sports Support
| Sport | Scoring | Key Stats |
|-------|---------|-----------|
| 🏀 Basketball | Points | PTS/AST/REB/BLK/STL/TOV/FOUL |
| ⚽ Soccer | Goals | G/A/SOT/SV/FL/YC/RC |
| 🏈 Football | TD+FG | TD/PASS/RUSH/TKL/SCK/INT |
| 🏒 Hockey | Goals | G/A/SH/SV/BLK/PEN |

## Deployment
- **Platform**: Cloudflare Pages
- **Project Name**: courtvision (courtvision-7k6.pages.dev)
- **Status**: ✅ Active
- **Last Updated**: 2026-05-01

## Roadmap (Next Phases)
- Phase 2: Cloudflare D1 persistent database (data survives Worker restarts)
- Phase 3: Auth system (Coach login, team ownership)
- Phase 4: AI video analysis (MediaPipe + OpenCV pipeline)
- Phase 5: Scout dashboard, player profiles, NIL/recruiting tools
