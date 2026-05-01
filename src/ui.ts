export function getHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<title>Game Vision — Sports Intelligence Platform</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Bebas+Neue&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --primary:#6C63FF;--primary-dark:#5a52e0;--primary-glow:rgba(108,99,255,0.25);
  --accent:#FF6B35;--accent2:#00D4AA;--accent3:#FFB800;
  --bg:#08080F;--bg2:#111118;--bg3:#1A1A24;--bg4:#22222F;--bg5:#2C2C3C;
  --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);
  --text:#EEEEFF;--text2:#8888AA;--text3:#55556A;
  --success:#00D4AA;--danger:#FF4757;--warning:#FFB800;
  --r-card:16px;--r-btn:10px;--r-input:10px;
  --shadow:0 8px 32px rgba(0,0,0,0.5);
}
html,body{height:100%;overflow:hidden;background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;-webkit-tap-highlight-color:transparent}
#app{height:100vh;display:flex;flex-direction:column;overflow:hidden}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--bg5);border-radius:4px}

/* ── LAYOUT ── */
.shell{display:flex;flex:1;overflow:hidden}
.sidebar{width:220px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;transition:width 0.2s}
.sidebar.collapsed{width:60px}
.sidebar-logo{padding:18px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border)}
.logo-icon{width:36px;height:36px;background:var(--primary);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
.logo-text{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px;white-space:nowrap;overflow:hidden}
.logo-sub{font-size:9px;color:var(--text3);letter-spacing:2px;text-transform:uppercase;white-space:nowrap;overflow:hidden}
.sidebar-nav{flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
.nav-item{display:flex;align-items:center;gap:12px;padding:10px 10px;border-radius:10px;cursor:pointer;transition:all 0.15s;color:var(--text2);font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;border:none;background:transparent;font-family:inherit;width:100%;text-align:left}
.nav-item:hover{background:var(--bg3);color:var(--text)}
.nav-item.active{background:var(--primary-glow);color:var(--primary);font-weight:600}
.nav-item i{width:18px;text-align:center;flex-shrink:0;font-size:14px}
.nav-section{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--text3);padding:12px 10px 6px;white-space:nowrap;overflow:hidden}
.sidebar-footer{padding:12px 8px;border-top:1px solid var(--border)}
.main-content{flex:1;overflow:hidden;display:flex;flex-direction:column}

/* ── TOPBAR ── */
.topbar{background:var(--bg2);border-bottom:1px solid var(--border);padding:0 20px;height:54px;display:flex;align-items:center;gap:12px;flex-shrink:0}
.topbar-title{font-size:16px;font-weight:700;flex:1}
.topbar-sub{font-size:12px;color:var(--text3);margin-top:1px}
.live-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(0,212,170,0.12);color:var(--success);padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
.live-dot{width:6px;height:6px;background:var(--success);border-radius:50%;animation:pulse 1.2s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.8)}}

/* ── USER PILL ── */
.user-pill{display:flex;align-items:center;gap:7px;background:var(--bg3);border:1px solid var(--border);border-radius:20px;padding:5px 11px;font-size:12px;cursor:pointer}
.user-pill:hover{border-color:var(--primary)}
.role-badge{font-size:9px;padding:2px 6px;border-radius:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.3px}
.role-coach{background:rgba(108,99,255,0.2);color:var(--primary)}
.role-assistant_coach{background:rgba(0,212,170,0.2);color:var(--success)}
.role-scorekeeper{background:rgba(255,184,0,0.2);color:var(--warning)}
.role-admin{background:rgba(255,71,87,0.2);color:var(--danger)}

/* ── VIEWS ── */
.view{display:none;flex:1;overflow:hidden;flex-direction:column}
.view.active{display:flex}
.scroll-area{overflow-y:auto;padding:20px;flex:1}

/* ── CARDS ── */
.card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r-card)}
.card-header{padding:16px 18px 0;display:flex;align-items:center;justify-content:space-between}
.card-body{padding:16px 18px}
.card-title{font-size:14px;font-weight:700}
.card-sub{font-size:12px;color:var(--text2);margin-top:2px}

/* ── STAT TILES ── */
.tile-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px}
.tile{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r-card);padding:16px 18px;position:relative;overflow:hidden}
.tile::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--tile-color,var(--primary))}
.tile .t-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text2)}
.tile .t-value{font-size:32px;font-weight:900;margin-top:4px;line-height:1;color:var(--tile-color,var(--text))}
.tile .t-sub{font-size:11px;color:var(--text3);margin-top:3px}
.tile-icon{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:28px;opacity:0.08}

/* ── BUTTONS ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 16px;border-radius:var(--r-btn);border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:inherit;white-space:nowrap;user-select:none;-webkit-user-select:none}
.btn:active{transform:scale(0.96)}
.btn-primary{background:var(--primary);color:#fff}.btn-primary:hover{background:var(--primary-dark)}
.btn-accent{background:var(--accent);color:#fff}.btn-accent:hover{background:#e55a28}
.btn-success{background:rgba(0,212,170,0.15);color:var(--success);border:1px solid rgba(0,212,170,0.3)}.btn-success:hover{background:var(--success);color:var(--bg)}
.btn-ghost{background:var(--bg3);color:var(--text2);border:1px solid var(--border)}.btn-ghost:hover{background:var(--bg4);color:var(--text)}
.btn-danger{background:rgba(255,71,87,0.12);color:var(--danger);border:1px solid rgba(255,71,87,0.25)}.btn-danger:hover{background:var(--danger);color:#fff}
.btn-warning{background:rgba(255,184,0,0.12);color:var(--warning);border:1px solid rgba(255,184,0,0.25)}.btn-warning:hover{background:var(--warning);color:var(--bg)}
.btn-sm{padding:6px 12px;font-size:12px;border-radius:8px}
.btn-lg{padding:12px 22px;font-size:15px;border-radius:12px}
.btn-icon{width:34px;height:34px;padding:0;border-radius:9px}
.btn-block{width:100%}
.btn:disabled{opacity:0.35;cursor:not-allowed;transform:none!important}

/* ── FORMS ── */
.form-group{margin-bottom:14px}
.form-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text2);display:block;margin-bottom:5px}
.form-input{width:100%;background:var(--bg3);border:1.5px solid var(--border);border-radius:var(--r-input);padding:10px 13px;color:var(--text);font-size:14px;font-family:inherit;outline:none;transition:border-color 0.2s}
.form-input:focus{border-color:var(--primary)}
.form-input::placeholder{color:var(--text3)}
select.form-input{cursor:pointer}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
textarea.form-input{resize:vertical;min-height:80px;line-height:1.5}

/* ── MODAL ── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(6px)}
.modal-overlay.hidden{display:none}
.modal{background:var(--bg2);border:1px solid var(--border2);border-radius:20px;width:100%;max-width:660px;max-height:90vh;overflow-y:auto;box-shadow:var(--shadow)}
.modal-lg{max-width:820px}
.modal-header{padding:22px 22px 0;display:flex;align-items:center;justify-content:space-between}
.modal-title{font-size:18px;font-weight:800;display:flex;align-items:center;gap:9px}
.modal-body{padding:20px 22px}
.modal-footer{padding:0 22px 22px;display:flex;gap:10px;justify-content:flex-end}
.close-btn{width:32px;height:32px;border-radius:50%;background:var(--bg3);border:none;color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all 0.2s;flex-shrink:0}
.close-btn:hover{background:var(--bg4);color:var(--text)}

/* ── BADGE ── */
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px}
.badge-live{background:rgba(0,212,170,0.15);color:var(--success)}
.badge-finished{background:rgba(100,100,130,0.2);color:var(--text2)}
.badge-setup{background:rgba(255,184,0,0.15);color:var(--warning)}
.badge-primary{background:rgba(108,99,255,0.2);color:var(--primary)}
.badge-danger{background:rgba(255,71,87,0.15);color:var(--danger)}

/* ── TEAM LIST ── */
.team-list{display:flex;flex-direction:column;gap:10px}
.team-row{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all 0.15s}
.team-row:hover{border-color:var(--primary);background:var(--bg4)}
.team-avatar{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;flex-shrink:0;color:#fff;font-family:'Bebas Neue',sans-serif;letter-spacing:1px}
.team-info{flex:1;min-width:0}
.team-name{font-weight:700;font-size:15px}
.team-meta{font-size:12px;color:var(--text2);margin-top:2px}
.team-record{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;color:var(--text2);flex-shrink:0}

/* ── PLAYER TABLE ── */
.player-list{display:flex;flex-direction:column;gap:6px}
.player-row{display:flex;align-items:center;gap:12px;background:var(--bg3);border-radius:10px;padding:9px 12px;border:1px solid transparent;transition:all 0.15s}
.player-row:hover{border-color:var(--border2)}
.player-jersey{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0;background:var(--bg4)}
.player-details{flex:1;min-width:0}
.player-name-text{font-weight:600;font-size:13px}
.player-pos{font-size:11px;color:var(--text3);margin-top:1px}

/* ── GAME CARDS ── */
.game-card{background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:16px;cursor:pointer;transition:all 0.15s}
.game-card:hover{border-color:var(--primary);transform:translateY(-1px);box-shadow:0 4px 16px rgba(108,99,255,0.1)}
.game-vs{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.game-team-name{font-weight:700;font-size:14px;flex:1}
.game-team-name.right{text-align:right}
.game-score-block{font-family:'Bebas Neue',sans-serif;font-size:32px;line-height:1;letter-spacing:1px;text-align:center;min-width:70px}
.game-score-a{color:#a89fff}.game-score-b{color:#ff9f7f}
.game-meta{display:flex;align-items:center;gap:8px;font-size:11px;color:var(--text3)}

/* ── TRACKER LAYOUT ── */
.tracker-wrap{display:flex;flex-direction:column;height:100%;overflow:hidden}
.tracker-header{background:var(--bg2);border-bottom:1px solid var(--border);padding:10px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0}
.scoreboard{display:flex;align-items:center;gap:16px;flex:1;justify-content:center}
.score-side{text-align:center;min-width:110px}
.score-team-name{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text2)}
.score-num{font-family:'Bebas Neue',sans-serif;font-size:56px;line-height:1}
.score-num.a{color:#a89fff}.score-num.b{color:#ff9f7f}
.score-sep{font-family:'Bebas Neue',sans-serif;font-size:30px;color:var(--text3)}
.tracker-body{flex:1;display:grid;grid-template-columns:1fr 190px 1fr;overflow:hidden}
.team-col{display:flex;flex-direction:column;overflow:hidden}
.team-col-header{padding:8px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid var(--border);flex-shrink:0}
.team-col-header.a{color:#a89fff;background:rgba(108,99,255,0.05)}
.team-col-header.b{color:#ff9f7f;background:rgba(255,107,53,0.05)}
.players-scroll{overflow-y:auto;flex:1;padding:8px}
.player-btn{display:flex;align-items:center;gap:9px;padding:9px 10px;background:var(--bg3);border:1.5px solid var(--border);border-radius:10px;cursor:pointer;transition:all 0.12s;width:100%;text-align:left;margin-bottom:5px}
.player-btn:hover{border-color:var(--primary);background:var(--bg4)}
.player-btn.sel-a{border-color:#a89fff!important;background:rgba(108,99,255,0.15)!important;box-shadow:0 0 0 2px rgba(108,99,255,0.25)}
.player-btn.sel-b{border-color:#ff9f7f!important;background:rgba(255,107,53,0.15)!important;box-shadow:0 0 0 2px rgba(255,107,53,0.25)}
.player-btn.on-court::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--success);flex-shrink:0}
.pbtn-jersey{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;background:var(--bg4);flex-shrink:0;color:var(--text)}
.sel-a .pbtn-jersey{background:var(--primary);color:#fff}
.sel-b .pbtn-jersey{background:var(--accent);color:#fff}
.pbtn-info{flex:1;min-width:0}
.pbtn-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pbtn-mini{font-size:10px;color:var(--text2)}

/* ── ACTION PANEL ── */
.action-col{background:var(--bg2);border-left:1px solid var(--border);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:8px;gap:6px;overflow-y:auto}
.action-col-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text3);text-align:center;padding:3px 0}
.sel-display{background:var(--bg3);border-radius:10px;padding:10px;text-align:center;border:1px solid var(--border);flex-shrink:0}
.sel-display.team-a .sd-num{color:#a89fff}
.sel-display.team-b .sd-num{color:#ff9f7f}
.sd-num{font-family:'Bebas Neue',sans-serif;font-size:28px;line-height:1}
.sd-name{font-size:11px;color:var(--text2);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.act-btn{display:flex;align-items:center;gap:8px;padding:9px 8px;border-radius:9px;border:1.5px solid var(--border);background:var(--bg3);color:var(--text);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.12s;font-family:inherit;width:100%}
.act-btn:hover:not(:disabled){border-color:var(--primary);background:rgba(108,99,255,0.1);transform:translateY(-1px)}
.act-btn:active:not(:disabled){transform:scale(0.97)}
.act-btn:disabled{opacity:0.3;cursor:not-allowed}
.act-icon{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
.pts-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;padding-top:2px}
.pts-btn{padding:10px 0;border-radius:9px;border:1.5px solid var(--border);background:var(--bg3);color:var(--text);font-size:18px;font-weight:900;cursor:pointer;transition:all 0.12s;font-family:'Bebas Neue',sans-serif}
.pts-btn:hover{background:var(--warning);border-color:var(--warning);color:var(--bg)}
.pts-btn:active{transform:scale(0.94)}
.act-divider{height:1px;background:var(--border);margin:2px 0;flex-shrink:0}
.tracker-footer{background:var(--bg2);border-top:1px solid var(--border);padding:8px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0}

/* ── STATS TABLE ── */
.stats-table-wrap{overflow-x:auto}
.stbl{width:100%;border-collapse:collapse}
.stbl th{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text3);text-align:right;padding:8px 10px;border-bottom:1px solid var(--border)}
.stbl th:first-child{text-align:left}
.stbl td{padding:9px 10px;border-bottom:1px solid rgba(255,255,255,0.03);font-size:12px;text-align:right;transition:background 0.1s}
.stbl td:first-child{text-align:left}
.stbl tr:hover td{background:var(--bg3)}
.stbl .ldr{color:var(--warning);font-weight:800}
.pcell{display:flex;align-items:center;gap:9px}
.pj{width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0}
.pj-a{background:rgba(108,99,255,0.25);color:#a89fff}
.pj-b{background:rgba(255,107,53,0.25);color:#ff9f7f}

/* ── INGESTION TABS ── */
.ing-tabs{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
.ing-tab{padding:7px 14px;border-radius:8px;border:1.5px solid var(--border);background:transparent;color:var(--text2);font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:inherit;display:flex;align-items:center;gap:6px}
.ing-tab.active{background:var(--primary);border-color:var(--primary);color:#fff}
.ing-panel{display:none}.ing-panel.active{display:block}
.drop-zone{border:2px dashed var(--border2);border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:all 0.2s;background:var(--bg3)}
.drop-zone:hover,.drop-zone.drag-over{border-color:var(--primary);background:rgba(108,99,255,0.05)}
.drop-zone i{font-size:32px;color:var(--text3);margin-bottom:8px}
.drop-zone p{color:var(--text2);font-size:13px}
.preview-list{margin-top:12px;display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto}
.preview-item{display:flex;align-items:center;gap:10px;background:var(--bg4);border-radius:8px;padding:7px 10px;font-size:12px;border:1px solid transparent}
.preview-item.conflict{border-color:rgba(255,71,87,0.4);background:rgba(255,71,87,0.08)}
.preview-item.warning{border-color:rgba(255,184,0,0.4);background:rgba(255,184,0,0.08)}
.preview-jersey{width:28px;height:28px;border-radius:6px;background:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;flex-shrink:0}
.preview-jersey.conflict-j{background:var(--danger)}
.conflict-box{background:rgba(255,71,87,0.08);border:1px solid rgba(255,71,87,0.3);border-radius:10px;padding:12px 14px;margin-top:10px}
.conflict-title{font-size:12px;font-weight:700;color:var(--danger);margin-bottom:8px;display:flex;align-items:center;gap:6px}
.conflict-item{font-size:12px;color:var(--text2);padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
.conflict-item:last-child{border-bottom:none}

/* ── EDIT BEFORE SAVE ── */
.edit-save-table{width:100%;border-collapse:collapse;margin-top:12px}
.edit-save-table th{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text3);padding:7px 8px;border-bottom:1px solid var(--border);text-align:left}
.edit-save-table td{padding:5px 4px;border-bottom:1px solid rgba(255,255,255,0.03)}
.edit-save-table tr.has-conflict td{background:rgba(255,71,87,0.06)}
.edit-save-table .mini-input{width:100%;background:var(--bg4);border:1.5px solid var(--border);border-radius:6px;padding:5px 8px;color:var(--text);font-size:12px;font-family:inherit;outline:none}
.edit-save-table .mini-input:focus{border-color:var(--primary)}
.edit-save-table .mini-input.err{border-color:var(--danger)}

/* ── ROSTER CONFIRMATION ── */
.roster-confirm{background:rgba(0,212,170,0.08);border:1px solid rgba(0,212,170,0.3);border-radius:10px;padding:10px 14px;margin-top:8px;font-size:13px;display:flex;align-items:center;gap:8px;color:var(--success)}
.roster-confirm i{flex-shrink:0}

/* ── DASHBOARD CHARTS ── */
.perf-bar-wrap{display:flex;flex-direction:column;gap:8px}
.perf-bar-row{display:flex;align-items:center;gap:10px}
.perf-bar-label{width:100px;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0}
.perf-bar-track{flex:1;height:8px;background:var(--bg4);border-radius:4px;overflow:hidden}
.perf-bar-fill{height:100%;border-radius:4px;transition:width 0.6s ease;background:var(--primary)}
.perf-bar-val{font-size:12px;color:var(--text2);width:32px;text-align:right;flex-shrink:0}

/* ── COACH ANALYTICS ── */
.analytics-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.insight-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r-card);padding:16px}
.insight-title{font-size:13px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:7px;color:var(--text)}
.insight-title i{color:var(--primary)}

/* ── ROSTER SPLIT ── */
.roster-split{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:600px){.roster-split{grid-template-columns:1fr}.form-row{grid-template-columns:1fr}.form-row-3{grid-template-columns:1fr 1fr}}
.roster-panel{background:var(--bg3);border:1.5px solid var(--border);border-radius:14px;padding:14px}
.roster-panel.pa{border-top:3px solid var(--primary)}
.roster-panel.pb{border-top:3px solid var(--accent)}
.rp-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;display:flex;align-items:center;gap:7px}
.rp-label.a{color:var(--primary)}.rp-label.b{color:var(--accent)}
.rp-players{display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;margin-bottom:10px}
.rp-player{display:flex;align-items:center;gap:8px;background:var(--bg4);border-radius:8px;padding:7px 9px}
.rp-jersey{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;color:#fff}
.rp-jersey.a{background:var(--primary)}.rp-jersey.b{background:var(--accent)}
.rp-name{flex:1;font-size:13px;font-weight:500}
.add-row{display:grid;grid-template-columns:64px 1fr auto;gap:6px;align-items:end}

/* ── SPORT SELECTOR ── */
.sport-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
@media(max-width:480px){.sport-grid{grid-template-columns:repeat(2,1fr)}}
.sport-tile{padding:14px;border-radius:12px;border:2px solid var(--border);background:var(--bg3);cursor:pointer;transition:all 0.15s;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.sport-tile:hover{border-color:var(--primary);background:var(--bg4)}
.sport-tile.sel{border-color:var(--primary);background:rgba(108,99,255,0.12)}
.sport-tile .sp-emoji{font-size:28px}
.sport-tile .sp-name{font-size:12px;font-weight:600;color:var(--text2)}
.sport-tile.sel .sp-name{color:var(--primary)}

/* ── VOICE UI ── */
.voice-btn{width:80px;height:80px;border-radius:50%;background:var(--primary);border:none;color:#fff;font-size:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;margin:0 auto;transition:all 0.2s;box-shadow:0 0 0 0 rgba(108,99,255,0.4)}
.voice-btn.recording{background:var(--danger);animation:voicePulse 1s infinite}
@keyframes voicePulse{0%{box-shadow:0 0 0 0 rgba(255,71,87,0.5)}100%{box-shadow:0 0 0 20px rgba(255,71,87,0)}}
.voice-transcript{background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px;min-height:60px;font-size:13px;color:var(--text2);margin-top:12px;font-style:italic;line-height:1.6}

/* ── SECTION HEADER ── */
.sec-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.sec-title{font-size:16px;font-weight:800;display:flex;align-items:center;gap:8px}
.sec-sub{font-size:12px;color:var(--text2);margin-top:2px}
.divider{height:1px;background:var(--border);margin:16px 0}

/* ── TABS ── */
.tab-bar{display:flex;gap:6px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:0}
.tab-btn{padding:8px 16px;border:none;background:transparent;color:var(--text2);font-size:13px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all 0.15s;font-family:inherit}
.tab-btn.active{color:var(--primary);border-bottom-color:var(--primary)}
.tab-btn:hover:not(.active){color:var(--text)}
.tab-panel{display:none}.tab-panel.active{display:block}

/* ── TOAST ── */
.toast-box{position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:7px;pointer-events:none}
.toast{background:var(--bg4);border:1px solid var(--border2);border-radius:12px;padding:11px 16px;font-size:13px;font-weight:500;display:flex;align-items:center;gap:9px;box-shadow:var(--shadow);pointer-events:auto;animation:tIn 0.3s ease;max-width:340px}
.toast.ok{border-color:rgba(0,212,170,0.3)}.toast.ok i{color:var(--success)}
.toast.err{border-color:rgba(255,71,87,0.3)}.toast.err i{color:var(--danger)}
.toast.info{border-color:rgba(108,99,255,0.3)}.toast.info i{color:var(--primary)}
.toast.warn{border-color:rgba(255,184,0,0.3)}.toast.warn i{color:var(--warning)}
@keyframes tIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}

/* ── LOADER ── */
.spin{display:inline-block;width:16px;height:16px;border:2.5px solid rgba(255,255,255,0.15);border-top-color:#fff;border-radius:50%;animation:sp 0.7s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:50px 20px;text-align:center}
.empty-state i{font-size:40px;color:var(--text3)}
.empty-state h3{font-size:16px;font-weight:700}
.empty-state p{color:var(--text2);font-size:13px;max-width:260px;line-height:1.5}

/* ── SUMMARY ── */
.summary-score-big{text-align:center;padding:24px;background:linear-gradient(135deg,var(--bg3),var(--bg2));border-radius:var(--r-card);border:1px solid var(--border)}
.ssb-winner{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--success);margin-bottom:8px}
.ssb-score{font-family:'Bebas Neue',sans-serif;font-size:80px;line-height:1;letter-spacing:2px}
.ssb-teams{font-size:13px;color:var(--text2);margin-top:6px}
.leaders-row{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-top:16px}
.leader-tile{background:var(--bg3);border-radius:12px;padding:14px}
.lt-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text3)}
.lt-name{font-size:14px;font-weight:700;margin-top:4px}
.lt-val{font-family:'Bebas Neue',sans-serif;font-size:34px;color:var(--warning);letter-spacing:1px}
.lt-team{font-size:11px;color:var(--text3)}

/* ── AUTH VIEW ── */
.auth-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg);padding:20px}
.auth-card{background:var(--bg2);border:1px solid var(--border2);border-radius:24px;padding:36px;width:100%;max-width:400px}
.auth-logo{text-align:center;margin-bottom:28px}
.auth-logo .logo-icon{width:56px;height:56px;border-radius:16px;font-size:28px;margin:0 auto 12px}
.auth-logo h1{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px}
.auth-logo p{font-size:13px;color:var(--text2);margin-top:4px}
.role-selector{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
.role-opt{padding:10px;border-radius:10px;border:2px solid var(--border);background:var(--bg3);cursor:pointer;text-align:center;transition:all 0.15s}
.role-opt:hover{border-color:var(--primary)}
.role-opt.sel{border-color:var(--primary);background:rgba(108,99,255,0.12)}
.role-opt .ro-icon{font-size:20px;margin-bottom:4px}
.role-opt .ro-name{font-size:12px;font-weight:600}
.role-opt .ro-desc{font-size:10px;color:var(--text3);margin-top:2px}

/* ── MOBILE ── */
@media(max-width:768px){
  .sidebar{display:none}
  .topbar{padding:0 12px}
  .tracker-body{grid-template-columns:1fr 150px 1fr}
  .scroll-area{padding:12px}
  .tile-grid{grid-template-columns:1fr 1fr}
  .analytics-grid{grid-template-columns:1fr}
}
</style>
</head>
<body>
<div id="app">
  <!-- AUTH SCREEN (shown when no user) -->
  <div id="auth-screen" class="auth-wrap" style="display:none;position:fixed;inset:0;z-index:2000">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="logo-icon" style="background:var(--primary);display:flex;align-items:center;justify-content:center">👁️</div>
        <h1>Game Vision</h1>
        <p>Sports Intelligence Platform</p>
      </div>
      <div id="auth-form-wrap">
        <!-- Tabs -->
        <div class="tab-bar" style="margin-bottom:18px">
          <button class="tab-btn active" onclick="showAuthTab('login')">Sign In</button>
          <button class="tab-btn" onclick="showAuthTab('register')">Create Account</button>
        </div>
        <!-- Login -->
        <div id="auth-login" class="tab-panel active">
          <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="login-email" type="email" placeholder="coach@team.com" autocomplete="email"/></div>
          <div class="form-group"><label class="form-label">PIN (optional)</label><input class="form-input" id="login-pin" type="password" placeholder="4-digit PIN" maxlength="4" inputmode="numeric"/></div>
          <button class="btn btn-primary btn-block btn-lg" onclick="doLogin()"><i class="fas fa-sign-in-alt"></i> Sign In</button>
          <p style="text-align:center;margin-top:12px;font-size:12px;color:var(--text3)">No account? Use quick access below or create one.</p>
          <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="guestAccess()"><i class="fas fa-user"></i> Quick Access (no account)</button>
        </div>
        <!-- Register -->
        <div id="auth-register" class="tab-panel">
          <div class="form-group"><label class="form-label">Your Name</label><input class="form-input" id="reg-name" placeholder="Coach Smith"/></div>
          <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="reg-email" type="email" placeholder="coach@team.com"/></div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <div class="role-selector">
              <div class="role-opt sel" data-role="coach" onclick="selectRegRole('coach')"><div class="ro-icon">🏆</div><div class="ro-name">Coach</div><div class="ro-desc">Manage team &amp; analytics</div></div>
              <div class="role-opt" data-role="assistant_coach" onclick="selectRegRole('assistant_coach')"><div class="ro-icon">📋</div><div class="ro-name">Asst. Coach</div><div class="ro-desc">Help manage games</div></div>
              <div class="role-opt" data-role="scorekeeper" onclick="selectRegRole('scorekeeper')"><div class="ro-icon">📊</div><div class="ro-name">Scorekeeper</div><div class="ro-desc">Track live stats</div></div>
              <div class="role-opt" data-role="admin" onclick="selectRegRole('admin')"><div class="ro-icon">⚙️</div><div class="ro-name">Admin</div><div class="ro-desc">Full access</div></div>
            </div>
          </div>
          <div class="form-group"><label class="form-label">PIN (optional, 4 digits)</label><input class="form-input" id="reg-pin" type="password" placeholder="Optional 4-digit PIN" maxlength="4" inputmode="numeric"/></div>
          <button class="btn btn-primary btn-block btn-lg" onclick="doRegister()"><i class="fas fa-user-plus"></i> Create Account</button>
        </div>
      </div>
    </div>
  </div>

  <div class="shell">
    <!-- SIDEBAR -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">👁️</div>
        <div>
          <div class="logo-text">Game Vision</div>
          <div class="logo-sub">Sports Intelligence</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">Platform</div>
        <button class="nav-item active" data-view="dashboard"><i class="fas fa-house"></i> Dashboard</button>
        <button class="nav-item" data-view="teams"><i class="fas fa-shield-halved"></i> Teams</button>
        <button class="nav-item" data-view="games"><i class="fas fa-list"></i> Games</button>
        <div class="nav-section">Game Day</div>
        <button class="nav-item" data-view="tracker"><i class="fas fa-play-circle"></i> Live Tracker</button>
        <button class="nav-item" data-view="ingestion"><i class="fas fa-database"></i> Data Ingestion</button>
        <div class="nav-section">Intelligence</div>
        <button class="nav-item" data-view="analytics"><i class="fas fa-chart-line"></i> Coach Analytics</button>
        <button class="nav-item" data-view="stats"><i class="fas fa-table"></i> Stats Center</button>
      </nav>
      <div class="sidebar-footer">
        <button class="nav-item" onclick="showNewGameModal()"><i class="fas fa-plus-circle"></i> New Game</button>
      </div>
    </aside>

    <!-- MAIN -->
    <div class="main-content">
      <div class="topbar" id="topbar">
        <button class="btn btn-ghost btn-icon" id="mobile-menu-btn" onclick="toggleSidebar()" style="display:none"><i class="fas fa-bars"></i></button>
        <div style="flex:1">
          <div class="topbar-title" id="topbar-title">Dashboard</div>
        </div>
        <div id="topbar-actions"></div>
        <div id="user-pill-wrap"></div>
      </div>

      <!-- VIEW: DASHBOARD -->
      <div class="view active" id="view-dashboard">
        <div class="scroll-area">
          <div class="tile-grid" id="dash-tiles">
            <div class="tile" style="--tile-color:var(--primary)"><div class="t-label">Teams</div><div class="t-value" id="d-teams">0</div><i class="fas fa-shield-halved tile-icon"></i></div>
            <div class="tile" style="--tile-color:var(--accent2)"><div class="t-label">Players</div><div class="t-value" id="d-players">0</div><i class="fas fa-users tile-icon"></i></div>
            <div class="tile" style="--tile-color:var(--warning)"><div class="t-label">Games</div><div class="t-value" id="d-games">0</div><i class="fas fa-basketball tile-icon"></i></div>
            <div class="tile" style="--tile-color:var(--success)"><div class="t-label">Live Now</div><div class="t-value" id="d-live">0</div><i class="fas fa-circle tile-icon"></i></div>
          </div>
          <div id="active-games-section" style="display:none;margin-bottom:20px">
            <div class="sec-header"><div class="sec-title"><i class="fas fa-circle" style="color:var(--success);font-size:10px"></i> Live Games</div></div>
            <div id="active-games-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px"></div>
          </div>
          <div class="sec-header">
            <div><div class="sec-title"><i class="fas fa-clock-rotate-left"></i> Recent Games</div></div>
            <button class="btn btn-primary btn-sm" onclick="showNewGameModal()"><i class="fas fa-plus"></i> New Game</button>
          </div>
          <div id="recent-games-list"></div>
          <div class="divider"></div>
          <div class="sec-header"><div class="sec-title"><i class="fas fa-trophy"></i> Top Performers</div></div>
          <div id="top-performers"></div>
        </div>
      </div>

      <!-- VIEW: TEAMS -->
      <div class="view" id="view-teams">
        <div class="scroll-area">
          <div class="sec-header">
            <div>
              <div class="sec-title"><i class="fas fa-shield-halved"></i> Team Roster</div>
              <div class="sec-sub">Create a team to build a roster — select any team to manage players</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="showCreateTeamModal()"><i class="fas fa-plus"></i> New Team</button>
          </div>
          <div id="teams-list-container"></div>
        </div>
      </div>

      <!-- VIEW: TEAM DETAIL -->
      <div class="view" id="view-team-detail">
        <div class="scroll-area">
          <div class="sec-header" id="team-detail-header"></div>
          <div class="tab-bar">
            <button class="tab-btn active" onclick="setTeamTab('roster')">Roster</button>
            <button class="tab-btn" onclick="setTeamTab('stats')">Career Stats</button>
            <button class="tab-btn" onclick="setTeamTab('games')">Game History</button>
          </div>
          <div id="team-tab-roster" class="tab-panel active"></div>
          <div id="team-tab-stats" class="tab-panel"></div>
          <div id="team-tab-games" class="tab-panel"></div>
        </div>
      </div>

      <!-- VIEW: GAMES -->
      <div class="view" id="view-games">
        <div class="scroll-area">
          <div class="sec-header">
            <div><div class="sec-title"><i class="fas fa-list"></i> All Games</div></div>
            <button class="btn btn-primary btn-sm" onclick="showNewGameModal()"><i class="fas fa-plus"></i> New Game</button>
          </div>
          <div id="all-games-list"></div>
        </div>
      </div>

      <!-- VIEW: LIVE TRACKER -->
      <div class="view" id="view-tracker">
        <div id="no-game-msg" class="empty-state" style="flex:1">
          <i class="fas fa-play-circle"></i>
          <h3>No active game</h3>
          <p>Create or select a game to start tracking live stats.</p>
          <button class="btn btn-primary" onclick="showNewGameModal()"><i class="fas fa-plus"></i> New Game</button>
        </div>
        <div id="tracker-ui" class="tracker-wrap" style="display:none"></div>
      </div>

      <!-- VIEW: DATA INGESTION -->
      <div class="view" id="view-ingestion">
        <div class="scroll-area">
          <div class="sec-header">
            <div><div class="sec-title"><i class="fas fa-database"></i> Universal Data Ingestion</div><div class="sec-sub">Import roster data from any source</div></div>
          </div>
          <div style="margin-bottom:16px">
            <label class="form-label">Target Team (optional — creates new if blank)</label>
            <select class="form-input" id="ingest-target-team" style="max-width:300px">
              <option value="">— Create new team from import —</option>
            </select>
          </div>
          <div class="ing-tabs">
            <button class="ing-tab active" onclick="setIngTab('csv')"><i class="fas fa-file-csv"></i> CSV / Text</button>
            <button class="ing-tab" onclick="setIngTab('voice')"><i class="fas fa-microphone"></i> Voice Input</button>
            <button class="ing-tab" onclick="setIngTab('manual')"><i class="fas fa-keyboard"></i> Quick Entry</button>
            <button class="ing-tab" onclick="setIngTab('photo')"><i class="fas fa-camera"></i> Photo / OCR</button>
          </div>

          <!-- CSV Panel -->
          <div class="ing-panel active" id="ing-csv">
            <div class="card"><div class="card-body">
              <p style="font-size:13px;color:var(--text2);margin-bottom:10px">Paste CSV, roster text, or upload a file. Supported formats: <code style="color:var(--primary)">#,Name,Position</code> &nbsp; <code style="color:var(--primary)">Name,#</code> &nbsp; <code style="color:var(--primary)">23 John Smith</code></p>
              <div class="drop-zone" id="drop-zone" onclick="document.getElementById('csv-file-input').click()">
                <i class="fas fa-file-upload"></i>
                <p>Drop a CSV/TXT file here, or <strong>click to browse</strong></p>
              </div>
              <input type="file" id="csv-file-input" accept=".csv,.txt" style="display:none"/>
              <div style="height:10px"></div>
              <textarea class="form-input" id="csv-text" placeholder="Paste roster here...&#10;23, LeBron James, SF&#10;3, Anthony Davis, C&#10;..." style="height:120px;font-family:monospace;font-size:13px"></textarea>
              <div style="display:flex;gap:8px;margin-top:10px">
                <button class="btn btn-primary" onclick="parseAndPreviewCSV()"><i class="fas fa-wand-magic-sparkles"></i> Parse Roster</button>
                <button class="btn btn-ghost" onclick="document.getElementById('csv-text').value=''">Clear</button>
              </div>
              <div id="csv-parse-result" style="margin-top:12px"></div>
            </div></div>
          </div>

          <!-- Voice Panel -->
          <div class="ing-panel" id="ing-voice">
            <div class="card"><div class="card-body" style="text-align:center">
              <p style="font-size:13px;color:var(--text2);margin-bottom:16px">Speak naturally: <em>"Number 23 John Smith, number 5 Marcus Lee..."</em></p>
              <button class="voice-btn" id="voice-btn" onclick="toggleVoice()"><i class="fas fa-microphone" id="voice-icon"></i></button>
              <p style="font-size:12px;color:var(--text3);margin-top:10px" id="voice-status">Tap to start recording</p>
              <div class="voice-transcript" id="voice-transcript">Your transcript will appear here...</div>
              <div style="display:flex;gap:8px;margin-top:12px;justify-content:center">
                <button class="btn btn-primary" onclick="parseAndPreviewVoice()"><i class="fas fa-wand-magic-sparkles"></i> Parse Players</button>
                <button class="btn btn-ghost" onclick="clearVoice()">Clear</button>
              </div>
              <div id="voice-parse-result" style="margin-top:12px;text-align:left"></div>
            </div></div>
          </div>

          <!-- Manual Panel -->
          <div class="ing-panel" id="ing-manual">
            <div class="card"><div class="card-body">
              <p style="font-size:13px;color:var(--text2);margin-bottom:14px">Add players one by one. Select a target team above, or a new team will be created on save.</p>
              <div class="form-row-3">
                <div class="form-group"><label class="form-label">#</label><input class="form-input" type="text" id="m-jersey" placeholder="23" maxlength="3" inputmode="numeric"/></div>
                <div class="form-group"><label class="form-label">Name</label><input class="form-input" type="text" id="m-name" placeholder="Player name"/></div>
                <div class="form-group"><label class="form-label">Position</label><input class="form-input" type="text" id="m-pos" placeholder="PG, SG..."/></div>
              </div>
              <button class="btn btn-primary" onclick="addManualPlayer()"><i class="fas fa-plus"></i> Add Player</button>
              <div id="manual-preview" class="preview-list" style="margin-top:12px"></div>
              <div id="manual-actions" style="display:none;margin-top:10px"></div>
            </div></div>
          </div>

          <!-- Photo OCR Panel -->
          <div class="ing-panel" id="ing-photo">
            <div class="card"><div class="card-body" style="text-align:center">
              <i class="fas fa-camera" style="font-size:40px;color:var(--text3);display:block;margin-bottom:12px"></i>
              <p style="color:var(--text2);font-size:13px;margin-bottom:16px">Upload a photo of a roster sheet. We'll attempt to extract player names and numbers.</p>
              <div class="drop-zone" onclick="document.getElementById('ocr-file-input').click()" id="ocr-drop">
                <i class="fas fa-image"></i>
                <p>Drop roster photo here or <strong>click to upload</strong></p>
                <p style="font-size:11px;margin-top:6px;color:var(--text3)">JPG, PNG, HEIC supported</p>
              </div>
              <input type="file" id="ocr-file-input" accept="image/*" style="display:none" onchange="handleOCRFile(event)"/>
              <div id="ocr-preview-img" style="margin-top:12px"></div>
              <div id="ocr-result" style="margin-top:12px"></div>
            </div></div>
          </div>
        </div>
      </div>

      <!-- VIEW: ANALYTICS -->
      <div class="view" id="view-analytics">
        <div class="scroll-area">
          <div class="sec-header">
            <div><div class="sec-title"><i class="fas fa-chart-line"></i> Coach Intelligence Dashboard</div><div class="sec-sub">Data-driven decisions for every coach</div></div>
            <select class="form-input" id="analytics-team-sel" style="max-width:220px" onchange="loadAnalytics()">
              <option value="">Select a team...</option>
            </select>
          </div>
          <div id="analytics-content">
            <div class="empty-state"><i class="fas fa-chart-line"></i><h3>Select a team</h3><p>Choose a team above to view coaching analytics and player insights.</p></div>
          </div>
        </div>
      </div>

      <!-- VIEW: STATS CENTER -->
      <div class="view" id="view-stats">
        <div class="scroll-area">
          <div class="sec-header">
            <div><div class="sec-title"><i class="fas fa-table"></i> Stats Center</div></div>
            <div style="display:flex;gap:8px;align-items:center">
              <select class="form-input" id="stats-game-sel" style="max-width:260px" onchange="loadStatsForGame()">
                <option value="">Select a game...</option>
              </select>
              <button class="btn btn-success btn-sm" id="btn-show-summary" style="display:none" onclick="showSummaryModal()"><i class="fas fa-trophy"></i> Summary</button>
            </div>
          </div>
          <div id="stats-content">
            <div class="empty-state"><i class="fas fa-table"></i><h3>Select a game</h3><p>Choose a game to view the full stats breakdown.</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══ MODAL: NEW GAME ════════════════════════════════════════════════ -->
<div class="modal-overlay hidden" id="modal-new-game">
  <div class="modal modal-lg">
    <div class="modal-header">
      <div class="modal-title"><i class="fas fa-plus-circle" style="color:var(--primary)"></i> New Game Setup</div>
      <button class="close-btn" onclick="closeModal('modal-new-game')"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Select Sport</label>
        <div class="sport-grid" id="sport-grid">
          <div class="sport-tile sel" data-sport="basketball" onclick="selectSport('basketball')"><div class="sp-emoji">🏀</div><div class="sp-name">Basketball</div></div>
          <div class="sport-tile" data-sport="soccer" onclick="selectSport('soccer')"><div class="sp-emoji">⚽</div><div class="sp-name">Soccer</div></div>
          <div class="sport-tile" data-sport="football" onclick="selectSport('football')"><div class="sp-emoji">🏈</div><div class="sp-name">Football</div></div>
          <div class="sport-tile" data-sport="hockey" onclick="selectSport('hockey')"><div class="sp-emoji">🏒</div><div class="sp-name">Hockey</div></div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Game Name (optional)</label><input class="form-input" id="ng-name" placeholder="e.g. Championship Game"/></div>
        <div class="form-group"><label class="form-label">Location (optional)</label><input class="form-input" id="ng-location" placeholder="e.g. Main Gym"/></div>
      </div>
      <div class="divider"></div>
      <div class="roster-split">
        <!-- Team A -->
        <div class="roster-panel pa">
          <div class="rp-label a"><i class="fas fa-shield-halved"></i> Team A</div>
          <div class="form-group" style="margin-bottom:8px">
            <label class="form-label">Load Saved Team</label>
            <select class="form-input" id="ng-team-a-saved" onchange="loadSavedTeamIntoSlot('A')" style="font-size:13px">
              <option value="">— Enter manually —</option>
            </select>
          </div>
          <div id="ng-roster-confirm-a"></div>
          <div class="form-group" style="margin-bottom:8px">
            <input class="form-input" id="ng-team-a-name" placeholder="Team A name" style="font-size:14px;font-weight:600"/>
          </div>
          <div class="rp-players" id="ng-players-a"></div>
          <div class="add-row">
            <input class="form-input" id="ng-a-j" placeholder="#" maxlength="3" inputmode="numeric"/>
            <input class="form-input" id="ng-a-n" placeholder="Player name"/>
            <button class="btn btn-primary btn-sm" onclick="addNGPlayer('A')"><i class="fas fa-plus"></i></button>
          </div>
        </div>
        <!-- Team B -->
        <div class="roster-panel pb">
          <div class="rp-label b"><i class="fas fa-shield-halved"></i> Team B</div>
          <div class="form-group" style="margin-bottom:8px">
            <label class="form-label">Load Saved Team</label>
            <select class="form-input" id="ng-team-b-saved" onchange="loadSavedTeamIntoSlot('B')" style="font-size:13px">
              <option value="">— Enter manually —</option>
            </select>
          </div>
          <div id="ng-roster-confirm-b"></div>
          <div class="form-group" style="margin-bottom:8px">
            <input class="form-input" id="ng-team-b-name" placeholder="Team B name" style="font-size:14px;font-weight:600"/>
          </div>
          <div class="rp-players" id="ng-players-b"></div>
          <div class="add-row">
            <input class="form-input" id="ng-b-j" placeholder="#" maxlength="3" inputmode="numeric"/>
            <input class="form-input" id="ng-b-n" placeholder="Player name"/>
            <button class="btn btn-accent btn-sm" onclick="addNGPlayer('B')"><i class="fas fa-plus"></i></button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('modal-new-game')">Cancel</button>
      <button class="btn btn-primary btn-lg" id="btn-create-game" onclick="createGame()"><i class="fas fa-play"></i> Create & Start Tracking</button>
    </div>
  </div>
</div>

<!-- ═══ MODAL: CREATE TEAM ════════════════════════════════════════════ -->
<div class="modal-overlay hidden" id="modal-create-team">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title"><i class="fas fa-shield-halved" style="color:var(--primary)"></i> Create Team</div>
      <button class="close-btn" onclick="closeModal('modal-create-team')"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Team Name</label><input class="form-input" id="ct-name" placeholder="e.g. Eagles"/></div>
        <div class="form-group"><label class="form-label">Coach Name</label><input class="form-input" id="ct-coach" placeholder="e.g. Coach Smith"/></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Sport</label>
          <select class="form-input" id="ct-sport">
            <option value="basketball">🏀 Basketball</option>
            <option value="soccer">⚽ Soccer</option>
            <option value="football">🏈 Football</option>
            <option value="hockey">🏒 Hockey</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Team Color</label>
          <input class="form-input" type="color" id="ct-color" value="#6C63FF" style="height:42px;padding:4px 8px;cursor:pointer"/>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('modal-create-team')">Cancel</button>
      <button class="btn btn-primary" onclick="createTeam()"><i class="fas fa-check"></i> Create Team</button>
    </div>
  </div>
</div>

<!-- ═══ MODAL: EDIT BEFORE SAVE (conflict resolution) ═══════════════ -->
<div class="modal-overlay hidden" id="modal-edit-before-save">
  <div class="modal modal-lg">
    <div class="modal-header">
      <div class="modal-title"><i class="fas fa-pen-to-square" style="color:var(--primary)"></i> Review &amp; Edit Before Saving</div>
      <button class="close-btn" onclick="closeModal('modal-edit-before-save')"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div id="ebs-summary" style="margin-bottom:14px"></div>
      <div id="ebs-conflicts" style="margin-bottom:14px"></div>
      <div style="overflow-x:auto">
        <table class="edit-save-table" id="ebs-table">
          <thead><tr><th style="width:50px">#</th><th>Name</th><th style="width:80px">Jersey</th><th style="width:80px">Position</th><th style="width:28px"></th></tr></thead>
          <tbody id="ebs-tbody"></tbody>
        </table>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('modal-edit-before-save')">Cancel</button>
      <button class="btn btn-warning" id="ebs-btn-overwrite" style="display:none" onclick="confirmSaveOverwrite()"><i class="fas fa-triangle-exclamation"></i> Save (Overwrite Conflicts)</button>
      <button class="btn btn-primary" id="ebs-btn-save" onclick="confirmSave()"><i class="fas fa-save"></i> Save to Team</button>
    </div>
  </div>
</div>

<!-- ═══ MODAL: ADD PLAYER TO TEAM ════════════════════════════════════ -->
<div class="modal-overlay hidden" id="modal-add-player">
  <div class="modal" style="max-width:460px">
    <div class="modal-header">
      <div class="modal-title"><i class="fas fa-user-plus" style="color:var(--primary)"></i> Add Player</div>
      <button class="close-btn" onclick="closeModal('modal-add-player')"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Jersey #</label><input class="form-input" id="ap-jersey" placeholder="23" maxlength="3" inputmode="numeric"/></div>
        <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="ap-name" placeholder="Player name"/></div>
      </div>
      <div class="form-group"><label class="form-label">Position (optional)</label><input class="form-input" id="ap-pos" placeholder="PG, SG, SF..."/></div>
      <div id="ap-conflict-msg" style="display:none" class="conflict-box"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal('modal-add-player')">Cancel</button>
      <button class="btn btn-primary" onclick="submitAddPlayer()"><i class="fas fa-plus"></i> Add Player</button>
    </div>
  </div>
</div>

<!-- ═══ MODAL: SUMMARY ════════════════════════════════════════════════ -->
<div class="modal-overlay hidden" id="modal-summary">
  <div class="modal modal-lg">
    <div class="modal-header">
      <div class="modal-title"><i class="fas fa-trophy" style="color:var(--warning)"></i> Game Summary</div>
      <button class="close-btn" onclick="closeModal('modal-summary')"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body" id="summary-modal-body"></div>
    <div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal('modal-summary')">Close</button></div>
  </div>
</div>

<!-- ═══ MODAL: VALUE INPUT ════════════════════════════════════════════ -->
<div class="modal-overlay hidden" id="modal-value">
  <div class="modal" style="max-width:320px">
    <div class="modal-header">
      <div class="modal-title" id="value-modal-title">Enter Value</div>
      <button class="close-btn" onclick="closeModal('modal-value')"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div id="value-options-grid" style="display:grid;gap:10px;grid-template-columns:repeat(3,1fr)"></div>
      <div id="value-free-input" style="display:none;margin-top:8px">
        <input class="form-input" type="number" id="value-input-num" placeholder="Enter value..." min="0" style="font-size:20px;text-align:center"/>
        <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="confirmValueInput()">Confirm</button>
      </div>
    </div>
  </div>
</div>

<div class="toast-box" id="toast-box"></div>

<script>
// ═══════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════
const S = {
  currentView: 'dashboard',
  currentUser: null,
  currentGame: null,
  currentGameId: null,
  currentTeamId: null,
  liveStats: {},
  selectedPlayerId: null,
  selectedTeam: null,
  ngSport: 'basketball',
  ngPlayersA: [],
  ngPlayersB: [],
  timerInterval: null,
  voiceRecognition: null,
  isRecording: false,
  voiceTranscript: '',
  pendingEventType: null,
  pendingEventConfig: null,
  manualPlayers: [],
  statsGameId: null,
  analyticsTeamId: null,
  // Edit-before-save state
  ebsPlayers: [],
  ebsTeamId: null,
  ebsConflicts: [],
  currentAddPlayerTeamId: null,
  regRole: 'coach',
}

// ═══════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════
function initAuth() {
  const stored = sessionStorage.getItem('gv_user')
  if (stored) {
    try {
      S.currentUser = JSON.parse(stored)
      renderUserPill()
      return
    } catch(e) {}
  }
  document.getElementById('auth-screen').style.display = 'flex'
}

function showAuthTab(tab) {
  document.querySelectorAll('#auth-form-wrap .tab-btn').forEach((b,i) => {
    b.classList.toggle('active', (i===0&&tab==='login')||(i===1&&tab==='register'))
  })
  document.getElementById('auth-login').classList.toggle('active', tab==='login')
  document.getElementById('auth-register').classList.toggle('active', tab==='register')
}

function selectRegRole(role) {
  S.regRole = role
  document.querySelectorAll('.role-opt').forEach(r => r.classList.toggle('sel', r.dataset.role === role))
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim()
  if (!email) { toast('Enter your email','err'); return }
  const pin = document.getElementById('login-pin').value.trim()
  const d = await api('POST', '/auth/login', { email, pin: pin || undefined })
  if (d.error) { toast(d.error, 'err'); return }
  setUser(d.user)
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim()
  const email = document.getElementById('reg-email').value.trim()
  const pin = document.getElementById('reg-pin').value.trim()
  if (!name || !email) { toast('Name and email required','err'); return }
  const d = await api('POST', '/auth/register', { name, email, role: S.regRole, pin: pin || undefined })
  if (d.error) { toast(d.error, 'err'); return }
  setUser(d.user)
  toast('Account created! Welcome, ' + name, 'ok')
}

function guestAccess() {
  setUser({ id: 'guest', name: 'Guest', email: 'guest', role: 'coach', teamIds: [] })
}

function setUser(user) {
  S.currentUser = user
  sessionStorage.setItem('gv_user', JSON.stringify(user))
  document.getElementById('auth-screen').style.display = 'none'
  renderUserPill()
  loadDashboard()
}

function renderUserPill() {
  if (!S.currentUser) return
  const u = S.currentUser
  const roleLabel = {coach:'Coach',assistant_coach:'Asst. Coach',scorekeeper:'Scorekeeper',admin:'Admin'}[u.role] || u.role
  const wrap = document.getElementById('user-pill-wrap')
  if (wrap) wrap.innerHTML = \`<div class="user-pill" onclick="showUserMenu(event)">
    <i class="fas fa-user-circle" style="color:var(--primary)"></i>
    <span style="font-weight:600">\${esc(u.name)}</span>
    <span class="role-badge role-\${u.role}">\${roleLabel}</span>
    <i class="fas fa-chevron-down" style="font-size:10px;color:var(--text3)"></i>
  </div>\`
}

function showUserMenu(e) {
  e.stopPropagation()
  const existing = document.getElementById('user-menu')
  if (existing) { existing.remove(); return }
  const menu = document.createElement('div')
  menu.id = 'user-menu'
  menu.style.cssText = 'position:fixed;top:54px;right:12px;background:var(--bg2);border:1px solid var(--border2);border-radius:12px;padding:8px;z-index:500;min-width:180px;box-shadow:var(--shadow)'
  menu.innerHTML = \`
    <div style="padding:8px 10px;font-size:12px;color:var(--text3);border-bottom:1px solid var(--border);margin-bottom:6px">
      <div style="font-weight:700;color:var(--text)">\${esc(S.currentUser?.name||'')}</div>
      <div>\${esc(S.currentUser?.email||'')}</div>
    </div>
    <button class="nav-item" style="font-size:12px" onclick="document.getElementById('user-menu')?.remove();signOut()"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
  \`
  document.body.appendChild(menu)
  setTimeout(() => document.addEventListener('click', () => document.getElementById('user-menu')?.remove(), {once:true}), 50)
}

function signOut() {
  S.currentUser = null
  sessionStorage.removeItem('gv_user')
  document.getElementById('user-pill-wrap').innerHTML = ''
  document.getElementById('auth-screen').style.display = 'flex'
}

function getAuthHeaders() {
  if (!S.currentUser || S.currentUser.id === 'guest') return {}
  return { 'X-User-Id': S.currentUser.id }
}

// ═══════════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════════
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.querySelectorAll('.nav-item[data-view]').forEach(n => n.classList.remove('active'))
  const view = document.getElementById('view-' + name)
  if (!view) return
  view.classList.add('active')
  document.querySelector('[data-view="'+name+'"]')?.classList.add('active')
  S.currentView = name
  const titles = {
    dashboard:'Dashboard', teams:'Teams & Rosters', games:'All Games',
    tracker:'Live Tracker', ingestion:'Data Ingestion', analytics:'Coach Analytics',
    stats:'Stats Center', 'team-detail':'Team Detail'
  }
  document.getElementById('topbar-title').textContent = titles[name] || name
  document.getElementById('topbar-actions').innerHTML = ''
  if (name === 'dashboard') loadDashboard()
  if (name === 'teams') loadTeamsView()
  if (name === 'games') loadGamesView()
  if (name === 'stats') loadStatsSelectors()
  if (name === 'analytics') loadAnalyticsSelectors()
}

document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view))
})

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed')
}

// ═══════════════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════════════
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
  }
  if (body) opts.body = JSON.stringify(body)
  try {
    const r = await fetch('/api' + path, opts)
    return r.json()
  } catch(e) { toast('Network error','err'); return {} }
}

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
async function loadDashboard() {
  const d = await api('GET', '/dashboard')
  if (!d.totals) return

  document.getElementById('d-teams').textContent = d.totals.teams
  document.getElementById('d-players').textContent = d.totals.players
  document.getElementById('d-games').textContent = d.totals.games
  document.getElementById('d-live').textContent = d.totals.activeGames

  const actSec = document.getElementById('active-games-section')
  if (d.activeGames?.length) {
    actSec.style.display = 'block'
    document.getElementById('active-games-list').innerHTML = d.activeGames.map(g => gameCardHTML(g, true)).join('')
  } else {
    actSec.style.display = 'none'
  }

  const rgl = document.getElementById('recent-games-list')
  if (!d.recentGames?.length) {
    rgl.innerHTML = '<div class="empty-state"><i class="fas fa-basketball"></i><h3>No games yet</h3><p>Create your first game to begin tracking.</p></div>'
  } else {
    rgl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">' +
      d.recentGames.map(g => gameCardHTML(g)).join('') + '</div>'
  }

  loadTopPerformers(d.recentGames || [])
}

function gameCardHTML(g, isLive = false) {
  const status = g.status === 'active'
    ? '<span class="badge badge-live"><i class="fas fa-circle" style="font-size:7px"></i> Live</span>'
    : g.status === 'finished' ? '<span class="badge badge-finished">Finished</span>'
    : '<span class="badge badge-setup">Setup</span>'
  const sport = {basketball:'🏀',soccer:'⚽',football:'🏈',hockey:'🏒'}[g.sport] || '🏀'
  const date = new Date(g.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})
  return \`<div class="game-card" onclick="openGame('\${g.id}')">
    <div class="game-vs">
      <div class="game-team-name">\${esc(g.teamA?.name||'Team A')}</div>
      <div class="game-score-block"><span class="game-score-a" id="gs-a-\${g.id}">—</span> <span style="color:var(--text3)">:</span> <span class="game-score-b" id="gs-b-\${g.id}">—</span></div>
      <div class="game-team-name right">\${esc(g.teamB?.name||'Team B')}</div>
    </div>
    <div class="game-meta">\${sport} \${cap(g.sport)} &bull; \${date} \${status} \${g.name ? '&bull; '+esc(g.name) : ''}</div>
  </div>\`
}

async function loadTopPerformers(recentGames) {
  const finished = recentGames.filter(g => g.status === 'finished')
  if (!finished.length) {
    document.getElementById('top-performers').innerHTML = '<p style="color:var(--text3);font-size:13px">Complete games will show top performers here.</p>'
    return
  }
  const allStats = []
  for (const g of finished.slice(0,3)) {
    const s = await api('GET', \`/games/\${g.id}/stats\`)
    if (s.playerStats) {
      s.playerStats.forEach(p => allStats.push({...p, gameName: \`\${g.teamA?.name} vs \${g.teamB?.name}\`}))
      const sa = document.getElementById(\`gs-a-\${g.id}\`)
      const sb = document.getElementById(\`gs-b-\${g.id}\`)
      if (sa) sa.textContent = s.teamAScore ?? '—'
      if (sb) sb.textContent = s.teamBScore ?? '—'
    }
  }
  const top5 = allStats.sort((a,b) => (b.points||b.goals||0) - (a.points||a.goals||0)).slice(0,5)
  const container = document.getElementById('top-performers')
  if (!top5.length) { container.innerHTML = ''; return }
  container.innerHTML = '<div class="perf-bar-wrap">' +
    top5.map(p => {
      const val = p.points || p.goals || 0
      const max = top5[0].points || top5[0].goals || 1
      return \`<div class="perf-bar-row">
        <div class="perf-bar-label">\${esc(p.name)}</div>
        <div class="perf-bar-track"><div class="perf-bar-fill" style="width:\${Math.round((val/max)*100)}%"></div></div>
        <div class="perf-bar-val">\${val}</div>
      </div>\`
    }).join('') + '</div>'
}

// ═══════════════════════════════════════════════════════════════════════
// TEAMS
// ═══════════════════════════════════════════════════════════════════════
async function loadTeamsView() {
  const d = await api('GET', '/teams')
  const container = document.getElementById('teams-list-container')
  if (!d.teams?.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-shield-halved"></i><h3>No teams yet</h3><p>Create a team to build a roster.</p><button class="btn btn-primary" onclick="showCreateTeamModal()"><i class="fas fa-plus"></i> Create Team</button></div>'
    return
  }
  container.innerHTML = '<div class="team-list">' + d.teams.map(t => \`
    <div class="team-row" onclick="openTeamDetail('\${t.id}')">
      <div class="team-avatar" style="background:\${t.color}">\${esc(t.logoInitials)}</div>
      <div class="team-info">
        <div class="team-name">\${esc(t.name)}</div>
        <div class="team-meta">\${sportEmoji(t.sport)} \${cap(t.sport)} &bull; \${t.players.length} players \${t.coachName ? '&bull; Coach: '+esc(t.coachName) : ''}</div>
      </div>
      <div class="team-record" style="color:\${t.color}">\${t.wins}W-\${t.losses}L</div>
      <button class="btn btn-ghost btn-icon btn-sm" onclick="event.stopPropagation();deleteTeam('\${t.id}')" title="Delete team"><i class="fas fa-trash"></i></button>
    </div>
  \`).join('') + '</div>'
}

async function openTeamDetail(teamId) {
  S.currentTeamId = teamId
  const d = await api('GET', \`/teams/\${teamId}\`)
  const team = d.team
  if (!team) return

  document.getElementById('team-detail-header').innerHTML = \`
    <div>
      <div class="sec-title">
        <div class="team-avatar" style="background:\${team.color};width:36px;height:36px;font-size:14px">\${esc(team.logoInitials)}</div>
        \${esc(team.name)}
        <span class="badge badge-primary">\${sportEmoji(team.sport)} \${cap(team.sport)}</span>
      </div>
      <div class="sec-sub">\${team.players.length} players \${team.coachName ? '&bull; '+esc(team.coachName) : ''} &bull; \${team.wins}W-\${team.losses}L-\${team.draws}D</div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-ghost btn-sm" onclick="showView('teams')"><i class="fas fa-arrow-left"></i> Back</button>
      <button class="btn btn-primary btn-sm" onclick="showAddPlayerModal('\${teamId}')"><i class="fas fa-plus"></i> Add Player</button>
    </div>
  \`

  renderTeamRoster(team)
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', i===0))
  document.querySelectorAll('.tab-panel').forEach((p,i) => p.classList.toggle('active', i===0))
  showView('team-detail')
  loadTeamCareerStats(teamId)
}

function renderTeamRoster(team) {
  const c = document.getElementById('team-tab-roster')
  if (!team.players.length) {
    c.innerHTML = '<div class="empty-state"><i class="fas fa-user-plus"></i><h3>No players yet</h3><p>Add players to build your roster.</p></div>'
    return
  }
  // Sort by jersey number
  const sorted = [...team.players].sort((a,b) => parseInt(a.jerseyNumber)||0 - (parseInt(b.jerseyNumber)||0))
  c.innerHTML = '<div class="player-list">' + sorted.map(p => \`
    <div class="player-row">
      <div class="player-jersey" style="background:\${team.color}22;color:\${team.color}">\${esc(p.jerseyNumber)}</div>
      <div class="player-details">
        <div class="player-name-text">\${esc(p.name)}</div>
        <div class="player-pos">\${p.position || 'No position'} &bull; \${p.careerGames} career games</div>
      </div>
      <button class="btn btn-ghost btn-icon btn-sm" onclick="editPlayerInline('\${team.id}','\${p.id}','\${esc(p.jerseyNumber)}','\${esc(p.name)}','\${esc(p.position||'')}')"><i class="fas fa-pen"></i></button>
      <button class="btn btn-danger btn-icon btn-sm" onclick="deletePlayerFromTeam('\${team.id}','\${p.id}')"><i class="fas fa-times"></i></button>
    </div>
  \`).join('') + '</div>'
}

async function loadTeamCareerStats(teamId) {
  const d = await api('GET', \`/teams/\${teamId}/stats\`)
  const c = document.getElementById('team-tab-stats')
  if (!d.playerAggregates?.length) {
    c.innerHTML = '<p style="color:var(--text3);font-size:13px;padding:20px">No game data yet.</p>'; return
  }
  const sorted = [...d.playerAggregates].sort((a,b) => (b.pts||b.goals||0)-(a.pts||a.goals||0))
  const maxPts = Math.max(...sorted.map(p => p.pts||p.goals||0), 1)
  c.innerHTML = '<div class="perf-bar-wrap">' + sorted.map(p => {
    const val = p.pts || p.goals || 0
    return \`<div class="perf-bar-row" style="margin-bottom:8px">
      <div class="perf-bar-label">\${esc(p.player.name)}</div>
      <div class="perf-bar-track"><div class="perf-bar-fill" style="width:\${Math.round((val/maxPts)*100)}%;background:\${d.team.color}"></div></div>
      <div class="perf-bar-val">\${val}</div>
    </div>\`
  }).join('') + '</div>'
}

function setTeamTab(name) {
  const tabs = {roster:0, stats:1, games:2}
  const idx = tabs[name] ?? 0
  document.querySelectorAll('.tab-btn').forEach((b,i) => b.classList.toggle('active', i===idx))
  document.querySelectorAll('.tab-panel').forEach((p,i) => p.classList.toggle('active', i===idx))
}

function showCreateTeamModal() {
  document.getElementById('ct-name').value = ''
  document.getElementById('ct-coach').value = ''
  openModal('modal-create-team')
}

async function createTeam() {
  const name = document.getElementById('ct-name').value.trim()
  if (!name) { toast('Team name required','err'); return }
  const sport = document.getElementById('ct-sport').value
  const color = document.getElementById('ct-color').value
  const coachName = document.getElementById('ct-coach').value.trim()
  const d = await api('POST', '/teams', { name, sport, color, coachName, logoInitials: name.substring(0,2).toUpperCase() })
  if (d.team) {
    toast('Team created!','ok')
    closeModal('modal-create-team')
    loadTeamsView()
    refreshIngestionTargets()
    refreshNewGameDropdowns()
  }
}

async function deleteTeam(id) {
  if (!confirm('Delete this team and all its roster data?')) return
  await api('DELETE', \`/teams/\${id}\`)
  toast('Team deleted','ok')
  loadTeamsView()
}

async function deletePlayerFromTeam(teamId, playerId) {
  if (!confirm('Remove this player from the roster?')) return
  const d = await api('DELETE', \`/teams/\${teamId}/players/\${playerId}\`)
  if (d.error) { toast(d.error, 'err'); return }
  toast('Player removed','ok')
  openTeamDetail(teamId)
}

function showAddPlayerModal(teamId) {
  S.currentAddPlayerTeamId = teamId
  document.getElementById('ap-jersey').value = ''
  document.getElementById('ap-name').value = ''
  document.getElementById('ap-pos').value = ''
  document.getElementById('ap-conflict-msg').style.display = 'none'
  openModal('modal-add-player')
  setTimeout(() => document.getElementById('ap-jersey').focus(), 100)
}

async function submitAddPlayer() {
  const teamId = S.currentAddPlayerTeamId
  if (!teamId) return
  const jerseyNumber = document.getElementById('ap-jersey').value.trim()
  const name = document.getElementById('ap-name').value.trim()
  const position = document.getElementById('ap-pos').value.trim()
  if (!jerseyNumber || !name) { toast('Jersey and name required','err'); return }

  const d = await api('POST', \`/teams/\${teamId}/players\`, { name, jerseyNumber, position: position||undefined })
  if (d.error) {
    const msg = document.getElementById('ap-conflict-msg')
    msg.style.display = 'block'
    if (d.conflict === 'duplicate_jersey') {
      msg.innerHTML = \`<div class="conflict-title"><i class="fas fa-triangle-exclamation"></i> Jersey Conflict</div><div class="conflict-item">\${esc(d.error)}</div><div class="conflict-item" style="margin-top:6px;color:var(--text3)">Please use a different jersey number.</div>\`
      document.getElementById('ap-jersey').classList.add('err') // field highlight
      setTimeout(() => document.getElementById('ap-jersey').classList.remove('err'), 2000)
    } else if (d.conflict === 'duplicate_name') {
      msg.innerHTML = \`<div class="conflict-title"><i class="fas fa-triangle-exclamation"></i> Duplicate Name</div><div class="conflict-item">\${esc(d.error)}</div>\`
    } else {
      toast(d.error, 'err')
    }
    return
  }
  toast('Player added!','ok')
  closeModal('modal-add-player')
  openTeamDetail(teamId)
}

async function editPlayerInline(teamId, playerId, jersey, name, pos) {
  const newJersey = prompt('Jersey number:', jersey)
  if (newJersey === null) return
  const newName = prompt('Player name:', name)
  if (newName === null) return
  const newPos = prompt('Position (optional):', pos)
  if (newPos === null) return

  const d = await api('PUT', \`/teams/\${teamId}/players/\${playerId}\`, {
    jerseyNumber: newJersey.trim(),
    name: newName.trim(),
    position: newPos.trim() || undefined
  })
  if (d.error) { toast(d.error, 'err'); return }
  toast('Player updated','ok')
  openTeamDetail(teamId)
}

// ═══════════════════════════════════════════════════════════════════════
// GAMES VIEW
// ═══════════════════════════════════════════════════════════════════════
async function loadGamesView() {
  const d = await api('GET', '/games')
  const container = document.getElementById('all-games-list')
  if (!d.games?.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-basketball"></i><h3>No games yet</h3><p>Create a game to start tracking.</p><button class="btn btn-primary" onclick="showNewGameModal()"><i class="fas fa-plus"></i> New Game</button></div>'
    return
  }
  container.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">' +
    d.games.map(g => gameCardHTML(g)).join('') + '</div>'
  d.games.forEach(async g => {
    if (g.status !== 'setup') {
      const s = await api('GET', \`/games/\${g.id}/stats\`)
      const sa = document.getElementById(\`gs-a-\${g.id}\`)
      const sb = document.getElementById(\`gs-b-\${g.id}\`)
      if (sa) sa.textContent = s.teamAScore ?? '—'
      if (sb) sb.textContent = s.teamBScore ?? '—'
    }
  })
}

async function openGame(id) {
  const d = await api('GET', \`/games/\${id}\`)
  S.currentGame = d.game
  S.currentGameId = id
  if (!d.game) return

  if (d.game.status === 'setup') {
    await api('POST', \`/games/\${id}/start\`)
    S.currentGame.status = 'active'
  }
  if (d.game.status === 'finished') {
    S.statsGameId = id
    loadStatsSelectors()
    showView('stats')
    document.getElementById('btn-show-summary').style.display = 'flex'
    setTimeout(() => loadStatsForGame(), 100)
    return
  }
  buildTrackerUI()
  showView('tracker')
}

// ═══════════════════════════════════════════════════════════════════════
// NEW GAME MODAL
// ═══════════════════════════════════════════════════════════════════════
async function showNewGameModal() {
  S.ngSport = 'basketball'
  S.ngPlayersA = []
  S.ngPlayersB = []
  document.getElementById('ng-name').value = ''
  document.getElementById('ng-location').value = ''
  document.getElementById('ng-team-a-name').value = ''
  document.getElementById('ng-team-b-name').value = ''
  document.getElementById('ng-players-a').innerHTML = ''
  document.getElementById('ng-players-b').innerHTML = ''
  document.getElementById('ng-roster-confirm-a').innerHTML = ''
  document.getElementById('ng-roster-confirm-b').innerHTML = ''
  document.querySelectorAll('.sport-tile').forEach(t => t.classList.toggle('sel', t.dataset.sport === 'basketball'))
  await refreshNewGameDropdowns()
  openModal('modal-new-game')
}

async function refreshNewGameDropdowns() {
  const d = await api('GET', '/teams')
  const teams = d.teams || []
  const makeOpts = () => '<option value="">— Enter manually —</option>' +
    teams.map(t => \`<option value="\${t.id}">\${esc(t.name)} (\${sportEmoji(t.sport)} \${t.players.length} players)</option>\`).join('')
  const sa = document.getElementById('ng-team-a-saved')
  const sb = document.getElementById('ng-team-b-saved')
  if (sa) sa.innerHTML = makeOpts()
  if (sb) sb.innerHTML = makeOpts()
}

function selectSport(sport) {
  S.ngSport = sport
  document.querySelectorAll('.sport-tile').forEach(t => t.classList.toggle('sel', t.dataset.sport === sport))
  // Re-trigger roster load to keep confirm banners in sync
  ;['A','B'].forEach(slot => {
    const sel = document.getElementById(\`ng-team-\${slot.toLowerCase()}-saved\`)
    if (sel && sel.value) loadSavedTeamIntoSlot(slot)
  })
}

async function loadSavedTeamIntoSlot(slot) {
  const sel = document.getElementById(\`ng-team-\${slot.toLowerCase()}-saved\`)
  const id = sel.value
  const confirmEl = document.getElementById(\`ng-roster-confirm-\${slot.toLowerCase()}\`)

  if (!id) {
    confirmEl.innerHTML = ''
    const arr = slot === 'A' ? S.ngPlayersA : S.ngPlayersB
    arr.length = 0
    renderNGPlayers(slot)
    return
  }

  const d = await api('GET', \`/teams/\${id}\`)
  const team = d.team
  if (!team) return

  document.getElementById(\`ng-team-\${slot.toLowerCase()}-name\`).value = team.name
  const arr = slot === 'A' ? S.ngPlayersA : S.ngPlayersB
  arr.length = 0
  team.players.forEach(p => arr.push({ jersey: p.jerseyNumber, name: p.name, savedPlayerId: p.id }))
  renderNGPlayers(slot)

  // Visual confirmation
  confirmEl.innerHTML = \`<div class="roster-confirm">
    <i class="fas fa-check-circle"></i>
    <span>Roster loaded: <strong>\${team.players.length} \${team.players.length === 1 ? "player" : "players"}</strong> — <em>\${esc(team.name)}</em></span>
  </div>\`
}

function addNGPlayer(slot) {
  const j = document.getElementById(\`ng-\${slot.toLowerCase()}-j\`).value.trim()
  const n = document.getElementById(\`ng-\${slot.toLowerCase()}-n\`).value.trim()
  if (!j || !n) { toast('Enter jersey and name','err'); return }

  const arr = slot === 'A' ? S.ngPlayersA : S.ngPlayersB

  // Duplicate jersey check within this slot
  if (arr.find(p => p.jersey === j)) {
    toast(\`Jersey #\${j} already in this roster\`, 'err'); return
  }

  arr.push({ jersey: j, name: n })
  document.getElementById(\`ng-\${slot.toLowerCase()}-j\`).value = ''
  document.getElementById(\`ng-\${slot.toLowerCase()}-n\`).value = ''
  document.getElementById(\`ng-\${slot.toLowerCase()}-j\`).focus()
  renderNGPlayers(slot)
}

function removeNGPlayer(slot, idx) {
  const arr = slot === 'A' ? S.ngPlayersA : S.ngPlayersB
  arr.splice(idx, 1)
  renderNGPlayers(slot)
}

function renderNGPlayers(slot) {
  const arr = slot === 'A' ? S.ngPlayersA : S.ngPlayersB
  const c = document.getElementById(\`ng-players-\${slot.toLowerCase()}\`)
  c.innerHTML = arr.map((p,i) => \`<div class="rp-player">
    <div class="rp-jersey \${slot.toLowerCase()}">\${esc(p.jersey)}</div>
    <div class="rp-name">\${esc(p.name)}</div>
    <button class="btn btn-ghost btn-icon btn-sm" onclick="removeNGPlayer('\${slot}',\${i})"><i class="fas fa-times"></i></button>
  </div>\`).join('')
}

async function createGame() {
  const teamAName = document.getElementById('ng-team-a-name').value.trim()
  const teamBName = document.getElementById('ng-team-b-name').value.trim()
  if (!teamAName || !teamBName) { toast('Enter both team names','err'); return }

  const btn = document.getElementById('btn-create-game')
  btn.innerHTML = '<div class="spin"></div> Creating...'
  btn.disabled = true

  const teamASavedId = document.getElementById('ng-team-a-saved').value || undefined
  const teamBSavedId = document.getElementById('ng-team-b-saved').value || undefined
  const name = document.getElementById('ng-name').value.trim() || undefined
  const location = document.getElementById('ng-location').value.trim() || undefined

  const d = await api('POST', '/games', {
    teamAName, teamBName, teamASavedId, teamBSavedId,
    sport: S.ngSport, name, location
  })

  if (!d.game) {
    toast(d.error || 'Failed to create game','err')
    btn.innerHTML = '<i class="fas fa-play"></i> Create & Start Tracking'
    btn.disabled = false
    return
  }

  const gid = d.game.id
  S.currentGameId = gid

  // Add extra players (those not from saved team)
  const tasks = [
    ...S.ngPlayersA.filter(p => !p.savedPlayerId).map(p =>
      api('POST', \`/games/\${gid}/players\`, { name: p.name, jerseyNumber: p.jersey, team: 'A' })
    ),
    ...S.ngPlayersB.filter(p => !p.savedPlayerId).map(p =>
      api('POST', \`/games/\${gid}/players\`, { name: p.name, jerseyNumber: p.jersey, team: 'B' })
    )
  ]
  await Promise.all(tasks)

  const startD = await api('POST', \`/games/\${gid}/start\`)
  S.currentGame = startD.game

  closeModal('modal-new-game')
  btn.innerHTML = '<i class="fas fa-play"></i> Create & Start Tracking'
  btn.disabled = false
  toast('Game started! 🎮','ok')
  buildTrackerUI()
  showView('tracker')
}

// ═══════════════════════════════════════════════════════════════════════
// TRACKER UI
// ═══════════════════════════════════════════════════════════════════════
function buildTrackerUI() {
  const game = S.currentGame
  if (!game) return
  document.getElementById('no-game-msg').style.display = 'none'
  const wrap = document.getElementById('tracker-ui')
  wrap.style.display = 'flex'

  const cfg = getConfig()
  const actions = cfg.actions

  wrap.innerHTML = \`
    <div class="tracker-wrap">
      <div class="tracker-header">
        <button class="btn btn-ghost btn-sm" onclick="showView('dashboard')"><i class="fas fa-arrow-left"></i></button>
        <div class="scoreboard">
          <div class="score-side">
            <div class="score-team-name" id="sn-a">\${esc(game.teamA.name)}</div>
            <div class="score-num a" id="sc-a">0</div>
          </div>
          <div class="score-sep">–</div>
          <div class="score-side">
            <div class="score-team-name" id="sn-b">\${esc(game.teamB.name)}</div>
            <div class="score-num b" id="sc-b">0</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <div id="game-clock" style="font-size:11px;color:var(--text3);min-width:36px;text-align:center">00:00</div>
          <button class="btn btn-ghost btn-icon btn-sm" onclick="undoLast()" title="Undo"><i class="fas fa-rotate-left"></i></button>
          <button class="btn btn-danger btn-sm" onclick="finishGame()"><i class="fas fa-flag-checkered"></i> End</button>
        </div>
      </div>

      <div class="tracker-body">
        <div class="team-col">
          <div class="team-col-header a" id="tch-a">\${esc(game.teamA.name)}</div>
          <div class="players-scroll" id="pl-a"></div>
        </div>
        <div class="action-col">
          <div class="action-col-title">Actions</div>
          <div class="sel-display" id="sel-display"><div style="color:var(--text3);font-size:11px;padding:6px 0;text-align:center"><i class="fas fa-hand-pointer"></i><br/>Select player</div></div>
          <div id="act-btns">
            \${actions.map(a => \`
              <button class="act-btn" id="abt-\${a.key}" onclick="handleAction('\${a.key}')" disabled>
                <span class="act-icon" style="background:\${a.color}22">\${a.icon}</span>
                <span>\${a.label}</span>
              </button>
              \${a.key === 'POINTS' ? '<div id="pts-picker" style="display:none"><div class="pts-grid"><button class="pts-btn" onclick="logStat(\\'POINTS\\',1)">1</button><button class="pts-btn" onclick="logStat(\\'POINTS\\',2)">2</button><button class="pts-btn" onclick="logStat(\\'POINTS\\',3)">3</button></div></div>' : ''}
            \`).join('')}
            <div class="act-divider"></div>
            <button class="act-btn" id="abt-SUB_IN" onclick="handleAction('SUB_IN')" disabled><span class="act-icon" style="background:#00d4aa22">✅</span> Sub In</button>
            <button class="act-btn" id="abt-SUB_OUT" onclick="handleAction('SUB_OUT')" disabled><span class="act-icon" style="background:#ff475722">❌</span> Sub Out</button>
          </div>
        </div>
        <div class="team-col">
          <div class="team-col-header b" id="tch-b">\${esc(game.teamB.name)}</div>
          <div class="players-scroll" id="pl-b"></div>
        </div>
      </div>

      <div class="tracker-footer">
        <span style="font-size:11px;color:var(--text3)"><i class="fas fa-bolt" style="color:var(--warning)"></i> Tap player → tap action → done</span>
        <div style="flex:1"></div>
        <span id="evt-count" style="font-size:11px;color:var(--text3)">0 events</span>
      </div>
    </div>
  \`

  S.selectedPlayerId = null
  S.liveStats = {}
  renderPlayerBtns()
  refreshLiveStats()
  startClock()
}

function getConfig() {
  const sport = S.currentGame?.sport || 'basketball'
  const configs = {
    basketball: { actions: [
      {key:'POINTS',label:'Points',icon:'🏀',color:'#FFB800',promptValue:true,valueOptions:[1,2,3]},
      {key:'ASSIST',label:'Assist',icon:'🎯',color:'#00D4AA'},
      {key:'REBOUND',label:'Rebound',icon:'🔄',color:'#6C63FF'},
      {key:'BLOCK',label:'Block',icon:'🛡️',color:'#2196F3'},
      {key:'STEAL',label:'Steal',icon:'⚡',color:'#FFD700'},
      {key:'TURNOVER',label:'Turnover',icon:'🚫',color:'#FF4757'},
      {key:'FOUL',label:'Foul',icon:'⚠️',color:'#FF6B35'},
    ]},
    soccer: { actions: [
      {key:'GOAL',label:'Goal',icon:'⚽',color:'#00D4AA'},
      {key:'ASSIST',label:'Assist',icon:'🎯',color:'#6C63FF'},
      {key:'SHOT_ON_TARGET',label:'Shot On',icon:'🥅',color:'#2196F3'},
      {key:'SAVE',label:'Save',icon:'🧤',color:'#FF6B35'},
      {key:'FOUL',label:'Foul',icon:'⚠️',color:'#FF6B35'},
      {key:'YELLOW_CARD',label:'Yellow Card',icon:'🟨',color:'#FFB800'},
      {key:'RED_CARD',label:'Red Card',icon:'🟥',color:'#FF4757'},
    ]},
    football: { actions: [
      {key:'TOUCHDOWN',label:'Touchdown',icon:'🏈',color:'#00D4AA'},
      {key:'FIELD_GOAL',label:'Field Goal',icon:'🥅',color:'#FFB800'},
      {key:'PASS_YARDS',label:'Pass Yds',icon:'➡️',color:'#6C63FF',promptValue:true,defaultValue:10},
      {key:'RUSH_YARDS',label:'Rush Yds',icon:'🏃',color:'#2196F3',promptValue:true,defaultValue:5},
      {key:'TACKLE',label:'Tackle',icon:'💪',color:'#9C27B0'},
      {key:'SACK',label:'Sack',icon:'🔨',color:'#FF4757'},
      {key:'INTERCEPTION',label:'Interception',icon:'🎣',color:'#E91E63'},
    ]},
    hockey: { actions: [
      {key:'GOAL',label:'Goal',icon:'🥅',color:'#00D4AA'},
      {key:'ASSIST',label:'Assist',icon:'🎯',color:'#6C63FF'},
      {key:'SHOT',label:'Shot',icon:'🏒',color:'#2196F3'},
      {key:'SAVE',label:'Save',icon:'🧤',color:'#FF6B35'},
      {key:'BLOCK',label:'Block',icon:'🛡️',color:'#9C27B0'},
      {key:'FOUL',label:'Penalty',icon:'⚠️',color:'#FF4757'},
    ]}
  }
  return configs[sport] || configs.basketball
}

function renderPlayerBtns() {
  const game = S.currentGame
  if (!game) return
  renderTeamBtns('a', game.teamA.players)
  renderTeamBtns('b', game.teamB.players)
}

function renderTeamBtns(side, players) {
  const c = document.getElementById('pl-' + side)
  if (!c) return
  if (!players?.length) {
    c.innerHTML = '<p style="color:var(--text3);font-size:11px;padding:10px;text-align:center">No players</p>'
    return
  }
  c.innerHTML = players.map(p => {
    const s = S.liveStats[p.id] || {}
    const isSelected = S.selectedPlayerId === p.id
    const selClass = isSelected ? (side === 'a' ? 'sel-a' : 'sel-b') : ''
    const isActive = S.currentGame?.activePlayers?.[p.id] !== undefined
    return \`<button class="player-btn \${selClass} \${isActive?'on-court':''}" id="pb-\${p.id}" onclick="selectPlayer('\${p.id}','\${side.toUpperCase()}')">
      <div class="pbtn-jersey">\${esc(p.jerseyNumber)}</div>
      <div class="pbtn-info">
        <div class="pbtn-name">\${esc(p.name)}</div>
        <div class="pbtn-mini">\${statSummary(s, S.currentGame?.sport)}</div>
      </div>
    </button>\`
  }).join('')
}

function statSummary(s, sport) {
  if (!s || !sport) return '—'
  if (sport === 'basketball') return \`\${s.points||0}pts · \${s.assists||0}ast · \${s.rebounds||0}reb\`
  if (sport === 'soccer') return \`\${s.goals||0}g · \${s.assists||0}a · \${s.saves||0}sv\`
  if (sport === 'football') return \`\${s.touchdowns||0}td · \${s.passYards||0}pyd\`
  if (sport === 'hockey') return \`\${s.goals||0}g · \${s.assists||0}a · \${s.shots||0}sh\`
  return '—'
}

function selectPlayer(id, team) {
  S.selectedPlayerId = id
  S.selectedTeam = team
  document.querySelectorAll('.player-btn').forEach(b => b.classList.remove('sel-a','sel-b'))
  const btn = document.getElementById('pb-' + id)
  if (btn) btn.classList.add(team === 'A' ? 'sel-a' : 'sel-b')

  const players = [...(S.currentGame?.teamA?.players||[]),...(S.currentGame?.teamB?.players||[])]
  const player = players.find(p => p.id === id)
  const disp = document.getElementById('sel-display')
  if (player && disp) {
    disp.className = 'sel-display team-' + team.toLowerCase()
    disp.innerHTML = \`<div class="sd-num">#\${esc(player.jerseyNumber)}</div><div class="sd-name">\${esc(player.name)}</div>\`
  }

  document.querySelectorAll('.act-btn').forEach(b => b.disabled = false)
  const pp = document.getElementById('pts-picker')
  if (pp) pp.style.display = 'none'
}

function handleAction(key) {
  if (!S.selectedPlayerId) { toast('Select a player first','err'); return }
  const cfg = getConfig()
  const action = cfg.actions.find(a => a.key === key) || {key, promptValue: false}

  if (key === 'POINTS') {
    const pp = document.getElementById('pts-picker')
    if (pp) pp.style.display = pp.style.display === 'none' ? 'block' : 'none'
    return
  }

  if (action.promptValue && action.key !== 'POINTS') {
    S.pendingEventType = key
    S.pendingEventConfig = action
    showValueModal(action)
    return
  }

  logStat(key, 1)
}

function showValueModal(action) {
  document.getElementById('value-modal-title').textContent = action.label
  const grid = document.getElementById('value-options-grid')
  const freeInput = document.getElementById('value-free-input')

  if (action.valueOptions) {
    grid.style.display = 'grid'
    freeInput.style.display = 'none'
    grid.innerHTML = action.valueOptions.map(v => \`
      <button class="pts-btn" style="font-size:22px" onclick="logStat('\${action.key}',\${v});closeModal('modal-value')">\${v}</button>
    \`).join('')
  } else {
    grid.style.display = 'none'
    freeInput.style.display = 'block'
    document.getElementById('value-input-num').value = action.defaultValue || ''
  }
  openModal('modal-value')
}

function confirmValueInput() {
  const val = parseFloat(document.getElementById('value-input-num').value)
  if (isNaN(val)) { toast('Enter a valid number','err'); return }
  logStat(S.pendingEventType, val)
  closeModal('modal-value')
}

async function logStat(type, value = 1) {
  if (!S.selectedPlayerId) { toast('Select a player first','err'); return }
  const pp = document.getElementById('pts-picker')
  if (pp) pp.style.display = 'none'

  const d = await api('POST', \`/games/\${S.currentGameId}/events\`, {
    playerId: S.selectedPlayerId, type, value
  })
  if (d.stats) {
    updateLiveStats(d.stats)
    const labels = {
      POINTS:\`+\${value}pts\`, ASSIST:'+AST', REBOUND:'+REB', BLOCK:'+BLK', STEAL:'+STL',
      TURNOVER:'TOV', FOUL:'FOUL', GOAL:'+GOAL', YELLOW_CARD:'YC', RED_CARD:'RC',
      SAVE:'+SAVE', SHOT_ON_TARGET:'+SOT', TOUCHDOWN:'+TD', FIELD_GOAL:'+FG',
      TACKLE:'+TKL', SACK:'+SCK', INTERCEPTION:'+INT', SHOT:'+SHOT',
      SUB_IN:'SUB IN ✅', SUB_OUT:'SUB OUT ❌',
      PASS_YARDS:\`+\${value}yds\`, RUSH_YARDS:\`+\${value}yds\`
    }
    toast(labels[type] || type, 'ok')
  }
}

function updateLiveStats(data) {
  if (!data) return
  document.getElementById('sc-a').textContent = data.teamAScore ?? 0
  document.getElementById('sc-b').textContent = data.teamBScore ?? 0
  data.playerStats?.forEach(s => { S.liveStats[s.playerId] = s })

  const all = [...(S.currentGame?.teamA?.players||[]),...(S.currentGame?.teamB?.players||[])]
  all.forEach(p => {
    const btn = document.getElementById('pb-' + p.id)
    if (btn) {
      const mini = btn.querySelector('.pbtn-mini')
      if (mini) mini.textContent = statSummary(S.liveStats[p.id]||{}, S.currentGame?.sport)
    }
  })

  const ec = document.getElementById('evt-count')
  if (ec) ec.textContent = \`\${data.eventCount||0} events\`
}

async function refreshLiveStats() {
  if (!S.currentGameId) return
  const d = await api('GET', \`/games/\${S.currentGameId}/stats\`)
  updateLiveStats(d)
}

async function undoLast() {
  const d = await api('DELETE', \`/games/\${S.currentGameId}/events/last\`)
  if (d.removed) { updateLiveStats(d.stats); toast('Undone ↩','info') }
  else toast('Nothing to undo','err')
}

async function finishGame() {
  if (!confirm('End game and generate final stats?')) return
  await api('POST', \`/games/\${S.currentGameId}/finish\`)
  clearInterval(S.timerInterval)
  toast('Game complete! 🏆','ok')
  S.statsGameId = S.currentGameId
  loadStatsSelectors()
  showView('stats')
  document.getElementById('btn-show-summary').style.display = 'flex'
  setTimeout(() => loadStatsForGame(), 100)
}

function startClock() {
  clearInterval(S.timerInterval)
  const t0 = S.currentGame?.startedAt || Date.now()
  S.timerInterval = setInterval(() => {
    const el = document.getElementById('game-clock')
    if (!el) { clearInterval(S.timerInterval); return }
    const s = Math.floor((Date.now() - t0) / 1000)
    el.textContent = \`\${Math.floor(s/60).toString().padStart(2,'0')}:\${(s%60).toString().padStart(2,'0')}\`
  }, 1000)
}

// ═══════════════════════════════════════════════════════════════════════
// DATA INGESTION — STRUCTURED PARSER ENGINE
// ═══════════════════════════════════════════════════════════════════════
function setIngTab(name) {
  document.querySelectorAll('.ing-tab').forEach(t => t.classList.toggle('active', t.getAttribute('onclick').includes("'"+name+"'")))
  document.querySelectorAll('.ing-panel').forEach(p => p.classList.toggle('active', p.id === 'ing-'+name))
}

async function refreshIngestionTargets() {
  const d = await api('GET', '/teams')
  const sel = document.getElementById('ingest-target-team')
  if (!sel) return
  sel.innerHTML = '<option value="">— Create new team from import —</option>' +
    (d.teams||[]).map(t => \`<option value="\${t.id}">\${esc(t.name)}</option>\`).join('')
}

// ─── CSV ─────────────────────────────────────────────
async function parseAndPreviewCSV() {
  const text = document.getElementById('csv-text').value.trim()
  if (!text) { toast('Paste CSV text first','err'); return }
  const d = await api('POST', '/parse', { text, source: 'csv' })
  renderParseResult(d, 'csv-parse-result')
}

const dz = document.getElementById('drop-zone')
if (dz) {
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over') })
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'))
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('drag-over')
    const f = e.dataTransfer.files[0]
    if (f) readFileIntoCSV(f)
  })
}
document.getElementById('csv-file-input')?.addEventListener('change', e => {
  const f = e.target.files?.[0]
  if (f) readFileIntoCSV(f)
})

function readFileIntoCSV(file) {
  const reader = new FileReader()
  reader.onload = e => {
    document.getElementById('csv-text').value = e.target.result
    parseAndPreviewCSV()
  }
  reader.readAsText(file)
}

// ─── VOICE ────────────────────────────────────────────
function toggleVoice() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    toast('Speech recognition not supported. Try Chrome.','err'); return
  }
  if (S.isRecording) stopVoice(); else startVoice()
}

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  S.voiceRecognition = new SR()
  S.voiceRecognition.continuous = true
  S.voiceRecognition.interimResults = true
  S.voiceRecognition.lang = 'en-US'
  S.voiceRecognition.onresult = e => {
    let final = '', interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript
      else interim += e.results[i][0].transcript
    }
    S.voiceTranscript += final
    document.getElementById('voice-transcript').textContent = S.voiceTranscript + (interim ? ' [' + interim + ']' : '')
  }
  S.voiceRecognition.onerror = () => { stopVoice(); toast('Voice error','err') }
  S.voiceRecognition.start()
  S.isRecording = true
  document.getElementById('voice-btn').classList.add('recording')
  document.getElementById('voice-icon').className = 'fas fa-stop'
  document.getElementById('voice-status').textContent = '🔴 Recording... tap to stop'
}

function stopVoice() {
  S.voiceRecognition?.stop()
  S.isRecording = false
  document.getElementById('voice-btn').classList.remove('recording')
  document.getElementById('voice-icon').className = 'fas fa-microphone'
  document.getElementById('voice-status').textContent = 'Tap to start recording'
}

function clearVoice() {
  stopVoice()
  S.voiceTranscript = ''
  document.getElementById('voice-transcript').textContent = 'Your transcript will appear here...'
  document.getElementById('voice-parse-result').innerHTML = ''
}

async function parseAndPreviewVoice() {
  const transcript = S.voiceTranscript || document.getElementById('voice-transcript').textContent
  if (!transcript || transcript.includes('Your transcript')) { toast('Record or type a transcript first','err'); return }
  const d = await api('POST', '/parse/voice', { transcript })
  renderParseResult(d, 'voice-parse-result')
  if (d.teamName) toast(\`Team detected: "\${d.teamName}" — you can use it as target team\`, 'info')
}

// ─── MANUAL ───────────────────────────────────────────
function addManualPlayer() {
  const j = document.getElementById('m-jersey').value.trim()
  const n = document.getElementById('m-name').value.trim()
  const p = document.getElementById('m-pos').value.trim()
  if (!j || !n) { toast('Enter jersey and name','err'); return }

  // Duplicate check
  if (S.manualPlayers.find(mp => mp.jerseyNumber === j)) {
    toast(\`Jersey #\${j} already in list\`, 'warn'); return
  }

  S.manualPlayers.push({ jerseyNumber: j, name: n, position: p || undefined })
  document.getElementById('m-jersey').value = ''
  document.getElementById('m-name').value = ''
  document.getElementById('m-pos').value = ''
  document.getElementById('m-jersey').focus()
  renderManualPreview()
}

function renderManualPreview() {
  const c = document.getElementById('manual-preview')
  const actions = document.getElementById('manual-actions')
  c.innerHTML = S.manualPlayers.map((p,i) => \`
    <div class="preview-item">
      <div class="preview-jersey">\${esc(p.jerseyNumber)}</div>
      <span style="flex:1"><strong>\${esc(p.name)}</strong>\${p.position ? ' · '+esc(p.position) : ''}</span>
      <button class="btn btn-ghost btn-icon btn-sm" onclick="S.manualPlayers.splice(\${i},1);renderManualPreview()"><i class="fas fa-times"></i></button>
    </div>
  \`).join('')

  if (S.manualPlayers.length > 0) {
    actions.style.display = 'block'
    actions.innerHTML = \`<button class="btn btn-success" onclick="openEditBeforeSave(S.manualPlayers, null)"><i class="fas fa-eye"></i> Review & Save \${S.manualPlayers.length} Players</button>\`
  } else {
    actions.style.display = 'none'
  }
}

// ─── OCR ──────────────────────────────────────────────
function handleOCRFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = e => {
    const img = document.createElement('img')
    img.src = e.target.result
    img.style.cssText = 'max-width:100%;border-radius:8px;margin-bottom:10px'
    document.getElementById('ocr-preview-img').innerHTML = ''
    document.getElementById('ocr-preview-img').appendChild(img)
    document.getElementById('ocr-result').innerHTML = \`
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
        <i class="fas fa-magnifying-glass" style="color:var(--primary);font-size:24px;margin-bottom:8px;display:block"></i>
        <p style="font-size:13px;color:var(--text2)">Image uploaded! For best results, copy the roster text and use <strong style="color:var(--text)">CSV / Text</strong> ingestion instead.</p>
        <p style="font-size:12px;color:var(--text3);margin-top:6px">Full AI-powered OCR is available with Cloudflare AI Vision integration (Phase 2).</p>
        <button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="setIngTab('csv')"><i class="fas fa-file-csv"></i> Switch to CSV Import</button>
      </div>
    \`
  }
  reader.readAsDataURL(file)
}

// ═══════════════════════════════════════════════════════════════════════
// PARSE RESULT RENDERER — shows preview + conflict UI + edit-before-save
// ═══════════════════════════════════════════════════════════════════════
function renderParseResult(result, containerId) {
  const c = document.getElementById(containerId)
  if (!result || !c) return

  // Normalize: /parse returns {number,name} while legacy returns {jerseyNumber,name}
  const rawPlayers = result.players || []
  const players = rawPlayers.map(p => ({
    ...p,
    jerseyNumber: String(p.jerseyNumber !== undefined ? p.jerseyNumber : (p.number !== undefined ? p.number : '0')),
    number: undefined
  }))
  const conflicts = result.conflicts || []
  const skipped = result.skipped || []

  if (!players.length) {
    c.innerHTML = '<p style="color:var(--danger);font-size:13px;padding:8px"><i class="fas fa-circle-exclamation"></i> No players could be parsed. Check your format: use <code>#,Name</code> or <code>23 John Smith</code>.</p>'
    return
  }

  let html = \`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
    <div style="font-size:13px;font-weight:700"><i class="fas fa-users" style="color:var(--success)"></i> \${players.length} players parsed\${conflicts.length ? \` <span style="color:var(--danger)">(\${conflicts.length} conflicts)</span>\` : ''}</div>
    <button class="btn btn-primary btn-sm" onclick="openEditBeforeSave(\${JSON.stringify(players).replace(/</g,'\\\\u003c')}, null)"><i class="fas fa-eye"></i> Review & Save</button>
  </div>\`

  // Conflict summary
  if (conflicts.length) {
    html += '<div class="conflict-box"><div class="conflict-title"><i class="fas fa-triangle-exclamation"></i> Conflicts Detected — Edit before saving</div>'
    html += conflicts.map(cc => \`<div class="conflict-item">⚠️ \${esc(cc.message)}</div>\`).join('')
    html += '</div>'
  }

  // Player preview list
  html += '<div class="preview-list">'
  html += players.map(p => {
    const hasConflict = conflicts.some(cc => cc.players?.some(cp => cp.name === p.name && String(cp.jerseyNumber !== undefined ? cp.jerseyNumber : (cp.number !== undefined ? cp.number : '')) === p.jerseyNumber))
    return \`<div class="preview-item \${hasConflict ? 'conflict' : ''}">
      <div class="preview-jersey \${hasConflict ? 'conflict-j' : ''}">\${esc(p.jerseyNumber)}</div>
      <span style="flex:1"><strong>\${esc(p.name)}</strong>\${p.position ? ' · <span style="color:var(--text3)">'+esc(p.position)+'</span>' : ''}</span>
      \${hasConflict ? '<span class="badge badge-danger" style="font-size:10px">conflict</span>' : ''}
    </div>\`
  }).join('')
  html += '</div>'

  // Skipped lines
  if (skipped.length) {
    html += \`<details style="margin-top:8px"><summary style="font-size:11px;color:var(--text3);cursor:pointer">\${skipped.length} line(s) skipped</summary><div style="font-size:11px;color:var(--text3);padding:8px;line-height:1.8">\${skipped.map(s => esc(s)).join('<br/>')}</div></details>\`
  }

  c.innerHTML = html
}

// ═══════════════════════════════════════════════════════════════════════
// EDIT BEFORE SAVE — conflict resolution + inline editing
// ═══════════════════════════════════════════════════════════════════════
function openEditBeforeSave(players, teamId) {
  // Normalize all players: ensure jerseyNumber is always a string
  S.ebsPlayers = players.map(p => ({
    name: String(p.name || '').trim(),
    jerseyNumber: String(p.jerseyNumber !== undefined ? p.jerseyNumber : (p.number !== undefined ? p.number : '0')).trim(),
    position: p.position || ''
  }))
  S.ebsTeamId = teamId || document.getElementById('ingest-target-team')?.value || null
  S.ebsConflicts = []
  renderEBSTable()
  openModal('modal-edit-before-save')
}

function renderEBSTable() {
  const tbody = document.getElementById('ebs-tbody')
  const summaryEl = document.getElementById('ebs-summary')
  const conflictsEl = document.getElementById('ebs-conflicts')

  summaryEl.innerHTML = \`<p style="font-size:13px;color:var(--text2)">Review and edit player data below before saving. All fields are editable.</p>\`

  if (S.ebsConflicts.length) {
    conflictsEl.innerHTML = '<div class="conflict-box"><div class="conflict-title"><i class="fas fa-triangle-exclamation"></i> Server Conflicts — Edit to Resolve</div>' +
      S.ebsConflicts.map(cc => \`<div class="conflict-item">⚠️ \${esc(cc.player?.name||'Player')}: \${esc(cc.reason)}</div>\`).join('') +
      '</div>'
    document.getElementById('ebs-btn-overwrite').style.display = 'flex'
  } else {
    conflictsEl.innerHTML = ''
    document.getElementById('ebs-btn-overwrite').style.display = 'none'
  }

  // Check local duplicate jerseys
  const jerseyCount = {}
  S.ebsPlayers.forEach(p => { const jk = String(p.jerseyNumber || '0'); jerseyCount[jk] = (jerseyCount[jk]||0)+1 })

  tbody.innerHTML = S.ebsPlayers.map((p,i) => {
    const jk = String(p.jerseyNumber || '0')
    const hasDupJ = (jerseyCount[jk]||0) > 1
    const hasServerConflict = S.ebsConflicts.some(cc => cc.player?.name === p.name && String(cc.player?.jerseyNumber || cc.player?.number || '') === jk)
    const rowClass = (hasDupJ || hasServerConflict) ? 'has-conflict' : ''
    return \`<tr class="\${rowClass}">
      <td style="color:var(--text3)">\${i+1}</td>
      <td><input class="mini-input \${hasServerConflict||hasDupJ?'err':''}" data-idx="\${i}" data-field="name" value="\${esc(p.name)}" onchange="ebsUpdate(\${i},'name',this.value)"/></td>
      <td><input class="mini-input \${hasDupJ?'err':''}" data-idx="\${i}" data-field="jerseyNumber" value="\${esc(jk)}" onchange="ebsUpdate(\${i},'jerseyNumber',this.value)" style="width:60px;text-align:center"/></td>
      <td><input class="mini-input" data-idx="\${i}" data-field="position" value="\${esc(p.position||'')}" onchange="ebsUpdate(\${i},'position',this.value)" placeholder="—"/></td>
      <td><button class="btn btn-danger btn-icon btn-sm" onclick="ebsRemove(\${i})" style="width:24px;height:24px"><i class="fas fa-times"></i></button></td>
    </tr>\`
  }).join('')
}

function ebsUpdate(i, field, val) {
  S.ebsPlayers[i][field] = val.trim()
  // Re-check for dup jerseys without full re-render
  const jerseyCount = {}
  S.ebsPlayers.forEach(p => { const k = String(p.jerseyNumber||'0'); jerseyCount[k] = (jerseyCount[k]||0)+1 })
  document.querySelectorAll('#ebs-tbody tr').forEach((row, ri) => {
    const hasConflict = (jerseyCount[String(S.ebsPlayers[ri]?.jerseyNumber||'0')]||0) > 1
    row.classList.toggle('has-conflict', hasConflict)
    const jerseyInput = row.querySelector('[data-field="jerseyNumber"]')
    if (jerseyInput) jerseyInput.classList.toggle('err', hasConflict)
  })
}

function ebsRemove(i) {
  S.ebsPlayers.splice(i, 1)
  renderEBSTable()
}

async function confirmSave() {
  await doEBSSave(false)
}

async function confirmSaveOverwrite() {
  await doEBSSave(true)
}

async function doEBSSave(overwriteConflicts) {
  if (!S.ebsPlayers.length) { toast('No players to save','err'); return }

  // Re-normalize before save (defensive: cleans any stale 'number' fields)
  S.ebsPlayers = S.ebsPlayers.map(p => ({
    name: String(p.name || '').trim(),
    jerseyNumber: String(p.jerseyNumber !== undefined ? p.jerseyNumber : (p.number !== undefined ? p.number : '0')).trim(),
    position: p.position || ''
  }))

  // Local duplicate jersey check
  const jerseySet = new Set()
  for (const p of S.ebsPlayers) {
    if (jerseySet.has(p.jerseyNumber)) {
      toast(\`Duplicate jersey #\${p.jerseyNumber} — please fix before saving\`, 'err')
      return
    }
    jerseySet.add(p.jerseyNumber)
  }

  let teamId = S.ebsTeamId

  if (teamId) {
    const d = await api('POST', \`/teams/\${teamId}/import\`, { players: S.ebsPlayers, overwriteConflicts })
    if (d.hasConflicts && !overwriteConflicts) {
      S.ebsConflicts = d.conflicts || []
      renderEBSTable()
      toast(\`\${d.conflicts.length} conflict(s) found — review and resolve or choose "Save (Overwrite)"\`, 'warn')
      return
    }
    toast(\`✅ Saved \${d.count} player\${d.count !== 1 ? 's' : ''} to team!\`, 'ok')
    closeModal('modal-edit-before-save')
  } else {
    const teamName = prompt('New team name:')
    if (!teamName?.trim()) return
    const td = await api('POST', '/teams', {
      name: teamName.trim(), sport: 'basketball',
      color: '#6C63FF', logoInitials: teamName.trim().substring(0,2).toUpperCase()
    })
    if (!td.team) { toast('Failed to create team','err'); return }
    teamId = td.team.id
    S.ebsTeamId = teamId

    const d = await api('POST', \`/teams/\${teamId}/import\`, { players: S.ebsPlayers, overwriteConflicts })
    toast(\`✅ Created "\${teamName}" with \${d.count} player\${d.count !== 1 ? 's' : ''}!\`, 'ok')
    closeModal('modal-edit-before-save')
  }

  // Clean up source state
  S.manualPlayers = []
  renderManualPreview()
  refreshIngestionTargets()
  refreshNewGameDropdowns()
  document.getElementById('csv-parse-result').innerHTML = ''
  document.getElementById('voice-parse-result').innerHTML = ''
}

// ═══════════════════════════════════════════════════════════════════════
// STATS CENTER
// ═══════════════════════════════════════════════════════════════════════
async function loadStatsSelectors() {
  const d = await api('GET', '/games')
  const sel = document.getElementById('stats-game-sel')
  const finished = (d.games||[]).filter(g => g.status !== 'setup')
  sel.innerHTML = '<option value="">Select a game...</option>' +
    finished.map(g => \`<option value="\${g.id}" \${g.id===S.statsGameId?'selected':''}>\${esc(g.teamA?.name)} vs \${esc(g.teamB?.name)} (\${g.status})</option>\`).join('')
  if (S.statsGameId) loadStatsForGame()
}

async function loadStatsForGame() {
  const sel = document.getElementById('stats-game-sel')
  const id = sel?.value || S.statsGameId
  if (!id) return
  S.statsGameId = id

  const [gameD, statsD] = await Promise.all([
    api('GET', \`/games/\${id}\`),
    api('GET', \`/games/\${id}/stats\`)
  ])
  const game = gameD.game
  const stats = statsD
  if (!game) return

  S.currentGame = game
  const cfg = getConfig()
  document.getElementById('stats-content').innerHTML = buildStatsTable(game, stats, cfg)
  if (game.status === 'finished') document.getElementById('btn-show-summary').style.display = 'flex'
}

function buildStatsTable(game, stats, cfg) {
  const cols = cfg.tableColumns || [{key:'points',label:'PTS'},{key:'assists',label:'AST'},{key:'rebounds',label:'REB'},{key:'minutesPlayed',label:'MIN'}]
  const aIds = new Set(game.teamA.players.map(p => p.id))
  const maxes = {}
  cols.forEach(c => { maxes[c.key] = Math.max(...(stats.playerStats||[]).map(s => s[c.key]||0), 0) })

  const playerRow = (s) => {
    const isA = aIds.has(s.playerId)
    return \`<tr>
      <td><div class="pcell">
        <div class="pj \${isA?'pj-a':'pj-b'}">\${esc(s.jersey)}</div>
        <div><div style="font-weight:600;font-size:13px">\${esc(s.name)}</div><div style="font-size:10px;color:var(--text3)">\${esc(s.teamName||'')}</div></div>
      </div></td>
      \${cols.map(c => \`<td class="\${s[c.key]===maxes[c.key]&&maxes[c.key]>0?'ldr':''}">\${c.key==='minutesPlayed'?(s[c.key]>0?s[c.key].toFixed(1):'—'):(s[c.key]??0)}</td>\`).join('')}
    </tr>\`
  }

  return \`
    <div style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div>
        <div style="font-size:15px;font-weight:800">\${esc(game.teamA.name)} vs \${esc(game.teamB.name)}</div>
        <div style="font-size:12px;color:var(--text2)">\${sportEmoji(game.sport)} \${cap(game.sport)} · \${new Date(game.createdAt).toLocaleDateString()}</div>
      </div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:42px;letter-spacing:2px">
        <span style="color:#a89fff">\${stats.teamAScore||0}</span>
        <span style="color:var(--text3)"> — </span>
        <span style="color:#ff9f7f">\${stats.teamBScore||0}</span>
      </div>
    </div>
    <div class="stats-table-wrap">
      <table class="stbl">
        <thead><tr><th>Player</th>\${cols.map(c=>'<th>'+c.label+'</th>').join('')}</tr></thead>
        <tbody>\${(stats.playerStats||[]).sort((a,b)=>(b[cols[0].key]||0)-(a[cols[0].key]||0)).map(playerRow).join('')}</tbody>
      </table>
    </div>
  \`
}

async function showSummaryModal() {
  const id = S.statsGameId || S.currentGameId
  if (!id) return
  const d = await api('GET', \`/games/\${id}/summary\`)
  if (!d.game) return

  const cfg = d.sportConfig || {scoringStat:'points'}
  const scoreLabel = {basketball:'PTS',soccer:'Goals',football:'PTS',hockey:'Goals'}[d.game.sport] || 'PTS'

  document.getElementById('summary-modal-body').innerHTML = \`
    <div>
      <div class="summary-score-big">
        <div class="ssb-winner"><i class="fas fa-trophy"></i> &nbsp;\${esc(d.winner)} Wins!</div>
        <div class="ssb-score">
          <span style="color:#a89fff">\${d.teamAScore}</span>
          <span style="color:var(--text3)"> — </span>
          <span style="color:#ff9f7f">\${d.teamBScore}</span>
        </div>
        <div class="ssb-teams">\${esc(d.game.teamA?.name)} vs \${esc(d.game.teamB?.name)}</div>
        \${d.duration?'<div style="font-size:12px;color:var(--text3);margin-top:4px">Duration: '+d.duration+' min</div>':''}
      </div>
      <div class="leaders-row">
        \${leaderTile('Top '+scoreLabel, d.topScorer, cfg.scoringStat, scoreLabel)}
        \${leaderTile('Top Assists', d.topAssist, 'assists', 'AST')}
        \${d.topRebounder ? leaderTile('Top Rebounds', d.topRebounder, 'rebounds', 'REB') : ''}
        \${d.topSaves ? leaderTile('Top Saves', d.topSaves, 'saves', 'SV') : ''}
      </div>
    </div>
  \`
  openModal('modal-summary')
}

function leaderTile(label, player, stat, unit) {
  if (!player) return ''
  return \`<div class="leader-tile">
    <div class="lt-label">\${label}</div>
    <div class="lt-name">\${esc(player.name)}</div>
    <div class="lt-val">\${player[stat]||0}<span style="font-size:14px;color:var(--text2);margin-left:2px">\${unit}</span></div>
    <div class="lt-team">\${esc(player.teamName||'')}</div>
  </div>\`
}

// ═══════════════════════════════════════════════════════════════════════
// COACH ANALYTICS
// ═══════════════════════════════════════════════════════════════════════
async function loadAnalyticsSelectors() {
  const d = await api('GET', '/teams')
  const sel = document.getElementById('analytics-team-sel')
  sel.innerHTML = '<option value="">Select a team...</option>' +
    (d.teams||[]).map(t => \`<option value="\${t.id}" \${t.id===S.analyticsTeamId?'selected':''}>\${esc(t.name)}</option>\`).join('')
  if (S.analyticsTeamId) loadAnalytics()
}

async function loadAnalytics() {
  const sel = document.getElementById('analytics-team-sel')
  const id = sel.value
  if (!id) return
  S.analyticsTeamId = id

  const [teamD, statsD] = await Promise.all([
    api('GET', \`/teams/\${id}\`),
    api('GET', \`/teams/\${id}/stats\`)
  ])

  const team = teamD.team
  const stats = statsD
  const content = document.getElementById('analytics-content')

  if (!team) { content.innerHTML = '<div class="empty-state"><i class="fas fa-triangle-exclamation"></i><h3>Team not found</h3></div>'; return }
  if (!stats.games) {
    content.innerHTML = \`<div class="empty-state"><i class="fas fa-chart-line"></i><h3>No game data yet</h3><p>Play games with "\${esc(team.name)}" to generate analytics.</p></div>\`
    return
  }

  const agg = stats.playerAggregates || []
  const sorted = [...agg].sort((a,b) => (b.pts||b.goals||0)-(a.pts||a.goals||0))
  const maxPts = Math.max(...sorted.map(p=>p.pts||p.goals||0), 1)
  const efficient = [...agg].filter(p => p.min > 0).map(p => ({
    ...p,
    ppm: ((p.pts||p.goals||0) / p.min).toFixed(2),
    apm: (p.ast / p.min).toFixed(2),
  })).sort((a,b) => b.ppm - a.ppm)
  const highUsage = [...agg].sort((a,b) => b.min - a.min).slice(0,5)
  const topAssisters = [...agg].sort((a,b) => b.ast - a.ast).slice(0,5)

  content.innerHTML = \`
    <div class="analytics-grid">
      <div class="insight-card">
        <div class="insight-title"><i class="fas fa-star"></i> Scoring Leaders</div>
        <div class="perf-bar-wrap">
          \${sorted.slice(0,6).map(p => {
            const val = p.pts||p.goals||0
            return \`<div class="perf-bar-row">
              <div class="perf-bar-label">\${esc(p.player.name)}</div>
              <div class="perf-bar-track"><div class="perf-bar-fill" style="width:\${Math.round((val/maxPts)*100)}%;background:\${team.color}"></div></div>
              <div class="perf-bar-val">\${val}</div>
            </div>\`
          }).join('')}
        </div>
      </div>
      <div class="insight-card">
        <div class="insight-title"><i class="fas fa-bolt"></i> Pts per Minute <span style="font-size:11px;color:var(--text3);font-weight:400">(efficiency)</span></div>
        \${efficient.length ? '<div class="perf-bar-wrap">' +
          efficient.slice(0,5).map(p => \`<div class="perf-bar-row">
            <div class="perf-bar-label">\${esc(p.player.name)}</div>
            <div class="perf-bar-track"><div class="perf-bar-fill" style="width:\${Math.min(100, Math.round(p.ppm*100))}%;background:var(--accent2)"></div></div>
            <div class="perf-bar-val">\${p.ppm}</div>
          </div>\`).join('') + '</div>'
        : '<p style="color:var(--text3);font-size:12px">Not enough minutes data yet.</p>'}
      </div>
      <div class="insight-card">
        <div class="insight-title"><i class="fas fa-clock"></i> Court Time Leaders</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          \${highUsage.map(p => \`<div style="display:flex;align-items:center;justify-content:space-between;font-size:13px">
            <span style="font-weight:600">\${esc(p.player.name)}</span>
            <span style="color:var(--warning);font-weight:700">\${p.min.toFixed(0)}m</span>
          </div>\`).join('')}
        </div>
        \${highUsage[0]?.min > 30 ? '<p style="font-size:11px;color:var(--danger);margin-top:10px;padding:6px;background:rgba(255,71,87,0.08);border-radius:6px">⚠️ '+esc(highUsage[0].player.name)+' may be overplayed ('+highUsage[0].min.toFixed(0)+'+ min). Consider rotation.</p>' : ''}
      </div>
      <div class="insight-card">
        <div class="insight-title"><i class="fas fa-hands-helping"></i> Playmakers (Assists)</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          \${topAssisters.filter(p=>p.ast>0).map(p => \`<div style="display:flex;align-items:center;justify-content:space-between;font-size:13px">
            <span style="font-weight:600">\${esc(p.player.name)}</span>
            <span style="color:var(--accent2);font-weight:700">\${p.ast} AST</span>
          </div>\`).join('')}
        </div>
        \${topAssisters.every(p=>p.ast===0) ? '<p style="color:var(--text3);font-size:12px">No assist data yet.</p>' : ''}
      </div>
      <div class="insight-card" style="grid-column:1/-1">
        <div class="insight-title"><i class="fas fa-brain"></i> AI Coach Insights</div>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;line-height:1.6">
          \${generateInsights(agg, team, stats.games)}
        </div>
      </div>
    </div>
  \`
}

function generateInsights(agg, team, gamesPlayed) {
  const insights = []
  const sorted = [...agg].sort((a,b) => (b.pts||b.goals||0)-(a.pts||a.goals||0))
  const topScorer = sorted[0]
  const efficient = [...agg].filter(p=>p.min>0).sort((a,b) => ((b.pts||b.goals||0)/b.min) - ((a.pts||a.goals||0)/a.min))[0]
  const overplayed = [...agg].sort((a,b)=>b.min-a.min)[0]

  if (topScorer && (topScorer.pts||topScorer.goals||0) > 0)
    insights.push(\`<div style="padding:8px 12px;background:rgba(108,99,255,0.08);border-radius:8px;border-left:3px solid var(--primary)">🏅 <strong>\${esc(topScorer.player.name)}</strong> leads scoring with \${topScorer.pts||topScorer.goals||0} total pts across \${gamesPlayed} game\${gamesPlayed!==1?'s':''}.</div>\`)

  if (efficient && efficient !== topScorer && efficient.min > 2)
    insights.push(\`<div style="padding:8px 12px;background:rgba(0,212,170,0.08);border-radius:8px;border-left:3px solid var(--success)">⚡ <strong>\${esc(efficient.player.name)}</strong> is most efficient at \${((efficient.pts||efficient.goals||0)/efficient.min).toFixed(2)} pts/min — consider more court time.</div>\`)

  if (overplayed && overplayed.min > 40)
    insights.push(\`<div style="padding:8px 12px;background:rgba(255,71,87,0.08);border-radius:8px;border-left:3px solid var(--danger)">⚠️ <strong>\${esc(overplayed.player.name)}</strong> has \${overplayed.min.toFixed(0)} total minutes — monitor fatigue and rotation patterns.</div>\`)

  const zeroTime = agg.filter(p=>p.min===0&&p.games===0)
  if (zeroTime.length > 0)
    insights.push(\`<div style="padding:8px 12px;background:rgba(255,184,0,0.08);border-radius:8px;border-left:3px solid var(--warning)">📊 \${zeroTime.length} player\${zeroTime.length!==1?'s':''} (\${esc(zeroTime.slice(0,2).map(p=>p.player.name).join(', '))}\${zeroTime.length>2?'...':''}) have no game time recorded yet.</div>\`)

  if (!insights.length)
    insights.push('<div style="color:var(--text3)">Play more games to generate intelligent coaching insights.</div>')

  return insights.join('')
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function cap(s) { return s ? s.charAt(0).toUpperCase()+s.slice(1) : '' }
function sportEmoji(s) { return {basketball:'🏀',soccer:'⚽',football:'🏈',hockey:'🏒'}[s]||'🏅' }

function toast(msg, type='ok') {
  const box = document.getElementById('toast-box')
  const t = document.createElement('div')
  t.className = 'toast ' + type
  const icon = {ok:'fa-check-circle',err:'fa-circle-exclamation',info:'fa-info-circle',warn:'fa-triangle-exclamation'}[type]||'fa-info-circle'
  t.innerHTML = \`<i class="fas \${icon}"></i>\${esc(msg)}\`
  box.appendChild(t)
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(40px)'; t.style.transition='all 0.3s'; setTimeout(()=>t.remove(),300) }, 3000)
}

function openModal(id) { document.getElementById(id)?.classList.remove('hidden') }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden') }

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'))
  if (e.key === 'Enter' && e.target.id === 'ng-a-n') addNGPlayer('A')
  if (e.key === 'Enter' && e.target.id === 'ng-b-n') addNGPlayer('B')
  if (e.key === 'Enter' && e.target.id === 'm-name') addManualPlayer()
  if (e.key === 'Enter' && e.target.id === 'ap-name') submitAddPlayer()
})

// Mobile detection
if (window.innerWidth < 768) {
  document.getElementById('mobile-menu-btn').style.display = 'flex'
}

// ═══════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════
initAuth()
refreshIngestionTargets()
</script>
</body>
</html>`
}
