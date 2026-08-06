import React, { useState, useEffect, useRef, useCallback, Component } from "react";
import {
  Trophy, Users, Calendar, Zap, Crown, ChevronRight, Menu, X,
  Clock, MapPin, Swords, ChevronDown, Radio, Flag, Lock, Plus, Trash2, Check
} from "lucide-react";
import logoGF from "./assets/assets/logo_golden_flower.PNG";

/* ------------------------------------------------------------------ */
/*  ERROR BOUNDARY                                                     */
/* ------------------------------------------------------------------ */

class ErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}
	
	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: "40px", textAlign: "center", color: "#FF4D4D", background: "#030A14", minHeight: "50vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
				<h2 style={{ color: "#fff", marginBottom: "10px" }}>Terjadi Kesalahan</h2>
				<p style={{ fontSize: "14px", maxWidth: "500px" }}>{this.state.error?.message || "Unknown error"}</p>
				<button onClick={() => this.setState({ hasError: false, error: null })} style={{ marginTop: "20px", padding: "10px 20px", background: "#0B80F4", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}>Coba Lagi</button>
				</div>
			);
		}
		return this.props.children;
	}
}

/* ------------------------------------------------------------------ */
/*  DATA                                                              */
/* ------------------------------------------------------------------ */

const EVENT = {
	cluster: "Golden Flower",
	tema: "HUT RI KE-81",
};

// Default settings (bisa diubah lewat panel admin)
const DEFAULT_SETTINGS = {
	registrationOpen: false,
	showBracket: true,
	showMatches: true,
};

// Admin password
const ADMIN_PASSWORD = "sautmp27";

const TEAMS = [
	{ id: "cw", name: "Crimson Wolves",  tag: "CRW", color: "#FF2E63" },
	{ id: "fv", name: "Frost Vipers",    tag: "FRV", color: "#00D9FF" },
	{ id: "vs", name: "Void Sentinels",  tag: "VOS", color: "#8B6BFF" },
	{ id: "gh", name: "Golden Hydra",    tag: "GLH", color: "#FFC93C" },
	{ id: "ip", name: "Iron Phoenix",    tag: "IRP", color: "#FF8A3D" },
	{ id: "sb", name: "Storm Breakers",  tag: "STB", color: "#00FFA3" },
	{ id: "sr", name: "Shadow Reapers",  tag: "SHR", color: "#C24BFF" },
	{ id: "nt", name: "Neon Tigers",     tag: "NGT", color: "#FF4D8D" },
];

const team = (id) => TEAMS.find((t) => t.id === id);

const MATCHES = [
	{ id: "qf1", round: "QF", label: "Perempat Final 1", a: "cw", b: "fv", scoreA: 2, scoreB: 1, status: "done", date: "10 Jul 2026", time: "19:00 WIB" },
	{ id: "qf2", round: "QF", label: "Perempat Final 2", a: "vs", b: "gh", scoreA: 2, scoreB: 0, status: "done", date: "10 Jul 2026", time: "21:00 WIB" },
	{ id: "qf3", round: "QF", label: "Perempat Final 3", a: "ip", b: "sb", scoreA: 1, scoreB: 2, status: "done", date: "11 Jul 2026", time: "19:00 WIB" },
	{ id: "qf4", round: "QF", label: "Perempat Final 4", a: "sr", b: "nt", scoreA: 2, scoreB: 0, status: "done", date: "11 Jul 2026", time: "21:00 WIB" },
	{ id: "sf1", round: "SF", label: "Semifinal 1", a: "cw", b: "vs", scoreA: 2, scoreB: 1, status: "done", date: "15 Jul 2026", time: "19:00 WIB" },
	{ id: "sf2", round: "SF", label: "Semifinal 2", a: "sb", b: "sr", scoreA: 1, scoreB: 2, status: "done", date: "15 Jul 2026", time: "21:00 WIB" },
	{ id: "gf", round: "GF", label: "Grand Final", a: "cw", b: "sr", scoreA: null, scoreB: null, status: "upcoming", date: "27 Jul 2026", time: "20:00 WIB" },
];

const winnerOf = (m) => {
	if (m.status !== "done") return null;
	return m.scoreA > m.scoreB ? m.a : m.b;
};

const ROUND_LABEL = { QF: "Perempat Final", SF: "Semifinal", GF: "Grand Final" };
const STATUS_META = {
	done:     { label: "SELESAI",   cls: "st-done" },
	live:     { label: "LIVE",      cls: "st-live" },
	upcoming: { label: "MENDATANG", cls: "st-upcoming" },
};

/* ------------------------------------------------------------------ */
/*  HEX-GRID CANVAS BACKGROUND                                        */
/* ------------------------------------------------------------------ */

function HexField({ dense }) {
	const canvasRef = useRef(null);
	const rafRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		let w, h, dpr;
		let hexes = [];
		let pulses = [];
		let t = 0;

		const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		function buildHexes() {
			hexes = [];
			const size = dense ? 46 : 58;
			const hexW = size * Math.sqrt(3);
			const hexH = size * 2 * 0.75;
			const cols = Math.ceil(w / hexW) + 2;
			const rows = Math.ceil(h / hexH) + 2;
			for (let r = -1; r < rows; r++) {
				for (let c = -1; c < cols; c++) {
					const x = c * hexW + (r % 2 ? hexW / 2 : 0);
					const y = r * hexH;
					hexes.push({ x, y, size, seed: Math.random() * Math.PI * 2 });
				}
			}
			pulses = [];
			const pulseCount = dense ? 5 : 8;
			for (let i = 0; i < pulseCount; i++) {
				pulses.push({
					x: Math.random() * w,
					y: h + Math.random() * h,
					speed: 0.18 + Math.random() * 0.28,
					drift: (Math.random() - 0.5) * 0.15,
					r: 1.4 + Math.random() * 1.8,
					hue: "11,128,244",
					delay: Math.random() * 300,
				});
			}
		}

		function resize() {
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			w = canvas.clientWidth;
			h = canvas.clientHeight;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			buildHexes();
		}

		function drawHex(cx, cy, size) {
			ctx.beginPath();
			for (let i = 0; i < 6; i++) {
				const a = (Math.PI / 3) * i + Math.PI / 6;
				const px = cx + size * Math.cos(a);
				const py = cy + size * Math.sin(a);
				if (i === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			ctx.closePath();
			ctx.stroke();
		}

		function frame() {
			t += 1;
			ctx.clearRect(0, 0, w, h);
			hexes.forEach((hx) => {
				const glow = 0.045 + 0.035 * Math.sin(t * 0.012 + hx.seed);
				ctx.strokeStyle = `rgba(0, 217, 255, ${Math.max(glow, 0.015)})`;
				ctx.lineWidth = 1;
				drawHex(hx.x, hx.y, hx.size);
			});
			pulses.forEach((p) => {
				if (p.delay > 0) { p.delay -= 1; return; }
				p.y -= p.speed * 2.2;
				p.x += p.drift;
				if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
				const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 22);
				grad.addColorStop(0, `rgba(${p.hue}, 0.55)`);
				grad.addColorStop(1, `rgba(${p.hue}, 0)`);
				ctx.fillStyle = grad;
				ctx.beginPath();
				ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = `rgba(${p.hue}, 0.9)`;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fill();
			});
			if (!reduced) rafRef.current = requestAnimationFrame(frame);
		}

		resize();
		window.addEventListener("resize", resize);
		frame();
		if (reduced) { ctx.clearRect(0, 0, w, h); }
		return () => { window.removeEventListener("resize", resize); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
	}, [dense]);

	return <canvas ref={canvasRef} className="nx-hexfield" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/*  COUNT-UP STAT                                                     */
/* ------------------------------------------------------------------ */

function CountStat({ value, label, suffix = "" }) {
	const [n, setN] = useState(0);
	const ref = useRef(null);
	const done = useRef(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(
		(entries) => {
			entries.forEach((e) => {
			if (e.isIntersecting && !done.current) {
				done.current = true;
				const start = performance.now();
				const dur = 1100;
				const tick = (now) => {
				const p = Math.min((now - start) / dur, 1);
				const eased = 1 - Math.pow(1 - p, 3);
				setN(Math.round(eased * value));
				if (p < 1) requestAnimationFrame(tick);
				};
				requestAnimationFrame(tick);
			}
			});
		},
		{ threshold: 0.4 }
		);
		io.observe(el);
		return () => io.disconnect();
	}, [value]);

	return (
		<div className="nx-stat" ref={ref}>
			<div className="nx-stat-num">{n}{suffix}</div>
			<div className="nx-stat-label">{label}</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  NAV                                                                */
/* ------------------------------------------------------------------ */

function Nav({ page, go, showBracket, showMatches, isAdmin, onAdminLogin }) {
	const [open, setOpen] = useState(false);
	const items = [
		{ id: "home", label: "Beranda" },
		{ id: "bracket", label: "Bagan Turnamen", hidden: !showBracket },
		{ id: "matches", label: "Pertandingan", hidden: !showMatches },
		{ id: "schedule", label: "Jadwal & Hasil" },
		{ id: "players", label: "Peserta" },
		{ id: "register", label: "Pendaftaran" },
		{ id: "admin", label: isAdmin ? "⚙ Admin" : "Admin" },
	].filter((it) => !it.hidden);

	const handleNavClick = (id) => {
		if (id === "admin" && !isAdmin) {
			const pwd = prompt("Masukkan password admin:");
			if (pwd === ADMIN_PASSWORD) {
				onAdminLogin();
				go("admin");
			}
		} else {
			go(id);
		}
		setOpen(false);
	};

	return (
		<header className="nx-nav">
		<div className="nx-nav-inner">
			<button className="nx-brand" onClick={() => { go("home"); setOpen(false); }}>
			<img src={logoGF} alt="Golden Flower" className="nx-brand-logo" />
			<span className="nx-brand-text">GOLDEN<span className="nx-brand-accent">FLOWER</span></span>
			</button>
			<nav className="nx-nav-links">
			{items.map((it) => (
				<button key={it.id} className={`nx-nav-link ${page === it.id ? "is-active" : ""}`} onClick={() => handleNavClick(it.id)}>{it.label}</button>
			))}
			</nav>
			<button className="nx-nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
			{open ? <X size={22} /> : <Menu size={22} />}
			</button>
		</div>
		{open && (
			<div className="nx-nav-mobile">
			{items.map((it) => (
				<button key={it.id} className={`nx-nav-mobile-link ${page === it.id ? "is-active" : ""}`} onClick={() => handleNavClick(it.id)}>
				{it.label}<ChevronRight size={16} />
				</button>
			))}
			</div>
		)}
		</header>
	);
}

/* ------------------------------------------------------------------ */
/*  CLUSTER / INDEPENDENCE RIBBON                                      */
/* ------------------------------------------------------------------ */

function ClusterRibbon() {
	const text = `MERDEKA! ${EVENT.tema} \u2014 TURNAMEN E-SPORTS CLUSTER ${EVENT.cluster.toUpperCase()} \u2022 MERAH PUTIH BERKIBAR \u2022`;
	return (
		<div className="nx-ribbon" role="note" aria-label="Informasi penyelenggara">
			<div className="nx-ribbon-track">
				<span className="nx-ribbon-item"><Flag size={13} />{text}</span>
				<span className="nx-ribbon-item"><Flag size={13} />{text}</span>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  HOME                                                               */
/* ------------------------------------------------------------------ */

function Home({ go }) {
	const [revealed, setRevealed] = useState(false);
	useEffect(() => {
		const id = requestAnimationFrame(() => setTimeout(() => setRevealed(true), 60));
		return () => cancelAnimationFrame(id);
	}, []);

	return (
		<section id="home" className="nx-hero">
			<HexField />
			<div className="nx-hero-scan" aria-hidden="true" />
			<div className={`nx-hero-content ${revealed ? "is-revealed" : ""}`}>
				<div className="nx-eyebrow">
					<Radio size={13} className="nx-eyebrow-dot" />
				TURNAMEN E-SPORTS &middot; {EVENT.tema}
				</div>
				<h1 className="nx-hero-title">
					<span className="nx-title-line nx-title-slam-left">GOLDEN FLOWER</span>
				</h1>
				<div className="nx-hero-cta">
					<button className="nx-btn nx-btn-primary" onClick={() => go("players")}>
						<Users size={18} />
						Lihat Peserta
					</button>
					<button className="nx-btn nx-btn-ghost" onClick={() => go("schedule")}>
						<Calendar size={18} />
						Jadwal &amp; Hasil
					</button>
				</div>
			</div>
		</section>
	);
}

/* ------------------------------------------------------------------ */
/*  TOURNAMENT BRACKET (Eliminasi - Visual Bracket Style)              */
/* ------------------------------------------------------------------ */

function TournamentBracket({ teams, totalTeams, matches, onUpdate, isAdmin }) {
	const [activeMatch, setActiveMatch] = useState(null);
	const [updating, setUpdating] = useState(false);

	const API_BRACKET = "https://api.ipl-q.com/api/v1/web/BracketMLBB";

	const getApiMatchByCode = (code) => {
		if (!matches) return null;
		return matches.find((m) => m.match_code === code);
	};

	const recordGame = async (matchId, gameNumber, winnerTeamId) => {
		if (updating) return;
		setUpdating(true);
		try {
		const response = await fetch(API_BRACKET, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ method: "UPDATE_SCORE", match_id: matchId, game_number: gameNumber, game_winner: winnerTeamId }),
		});
		if (response.ok) {
			const data = await response.json();
			if (data.error_code === "0") {
			if (onUpdate) onUpdate();
			setActiveMatch(null);
			} else { alert(`❌ ${data.error_message}`); }
		}
		} catch (err) { alert(`❌ ${err.message}`); }
		finally { setUpdating(false); }
	};

	const getTeamName = (id) => {
		if (!id || id === 0) return "TBD";
		const t = teams.find((tm) => tm.id === id);
		return t ? t.name : `Tim ${id}`;
	};

	// Group matches by round
	const matchesByRound = {};
	if (matches) {
		matches.forEach((m) => {
			if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
			matchesByRound[m.round].push(m);
		});
		// Sort each round by match_order
		Object.keys(matchesByRound).forEach((r) => {
		matchesByRound[r].sort((a, b) => a.match_order - b.match_order);
		});
	}

	const roundOrder = ["round1", "quarter", "semi", "final"];
	const activeRounds = roundOrder.filter((r) => matchesByRound[r] && matchesByRound[r].length > 0);

	const roundLabels = { round1: "Babak 1", quarter: "Perempat Final", semi: "Semifinal", final: "Final" };

	const finalMatch = matchesByRound["final"] ? matchesByRound["final"][0] : null;
	const champion = finalMatch && finalMatch.winner ? teams.find((t) => t.id === finalMatch.winner) : null;

	if (activeRounds.length === 0) {
		return <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}><p>Belum ada data pertandingan.</p></div>;
	}

	// Render a single match card
	const renderMatch = (apiMatch, showConnector = true, isLast = false) => {
		if (!apiMatch) return null;
		const hasBothTeams = apiMatch.team_a > 0 && apiMatch.team_b > 0;
		const isDone = apiMatch.status === "done";
		const isClickable = isAdmin && hasBothTeams && !isDone;
		const matchWinner = apiMatch.winner || 0;

		return (
		<div className="nx-tourney-match-wrapper" key={apiMatch.id}>
			<div
			className={`nx-tourney-match ${isClickable ? "is-clickable" : ""} ${isDone ? "is-done" : ""}`}
			onClick={() => isClickable && setActiveMatch(apiMatch)}
			>
			<div className={`nx-tourney-slot nx-tourney-slot-top ${apiMatch.team_a === 0 ? "is-bye" : ""} ${matchWinner === apiMatch.team_a && matchWinner !== 0 ? "is-winner" : ""}`}>
				<span className="nx-tourney-name">{apiMatch.team_a === 0 ? "TBD" : getTeamName(apiMatch.team_a)}</span>
				<span className="nx-tourney-score">{hasBothTeams ? (isDone ? apiMatch.score_a : "—") : "—"}</span>
			</div>
			<div className={`nx-tourney-slot nx-tourney-slot-bot ${apiMatch.team_b === 0 ? "is-bye" : ""} ${matchWinner === apiMatch.team_b && matchWinner !== 0 ? "is-winner" : ""}`}>
				<span className="nx-tourney-name">{apiMatch.team_b === 0 ? "TBD" : getTeamName(apiMatch.team_b)}</span>
				<span className="nx-tourney-score">{hasBothTeams ? (isDone ? apiMatch.score_b : "—") : "—"}</span>
			</div>
			</div>
			{showConnector && !isLast && <div className="nx-tourney-arm-right" />}
		</div>
		);
	};

	return (
		<div className="nx-tourney">
		<div className="nx-tourney-header">
			{activeRounds.map((r) => (
			<div className="nx-tourney-round-label" key={r}>{roundLabels[r]}</div>
			))}
			<div className="nx-tourney-round-label nx-tourney-champ-label">
			<Trophy size={14} /> Champion
			</div>
		</div>

		<div className="nx-tourney-bracket">
			{activeRounds.map((roundKey, rIdx) => {
			const roundMatches = matchesByRound[roundKey] || [];
			const isLastRound = rIdx === activeRounds.length - 1;
			return (
				<div className="nx-tourney-round" key={roundKey}>
				{roundMatches.map((apiMatch) => renderMatch(apiMatch, !isLastRound, isLastRound))}
				</div>
			);
			})}

			<div className="nx-tourney-round nx-tourney-champion-round">
			<div className="nx-tourney-match-wrapper">
				<div className="nx-tourney-champion">
				<Crown size={22} style={{ color: "#FFC93C" }} />
				<span className="nx-tourney-champion-text">{champion ? champion.name : "TBD"}</span>
				</div>
			</div>
			</div>
		</div>

		{/* Score Input Modal */}
		{activeMatch && (
			<div className="nx-tourney-modal-overlay" onClick={() => setActiveMatch(null)}>
			<div className="nx-tourney-modal" onClick={(e) => e.stopPropagation()}>
				<div className="nx-tourney-modal-header">
				<div>
					<h4>{activeMatch.round === "final" ? "Grand Final" : activeMatch.match_code}</h4>
					<span className="nx-league-bo3-badge" style={{ marginTop: "4px", display: "inline-block" }}>
					{activeMatch.round === "final" ? "BEST OF 5" : "BEST OF 3"}
					</span>
				</div>
				<button className="nx-tourney-modal-close" onClick={() => setActiveMatch(null)}><X size={18} /></button>
				</div>
				<div className="nx-tourney-modal-scoreboard">
				<div className={`nx-tourney-modal-team ${activeMatch.winner === activeMatch.team_a ? "is-winner" : ""}`}>
					<span className="nx-tourney-modal-name">{getTeamName(activeMatch.team_a)}</span>
					<span className="nx-tourney-modal-score">{activeMatch.score_a}</span>
				</div>
				<span className="nx-tourney-modal-vs">VS</span>
				<div className={`nx-tourney-modal-team ${activeMatch.winner === activeMatch.team_b ? "is-winner" : ""}`}>
					<span className="nx-tourney-modal-name">{getTeamName(activeMatch.team_b)}</span>
					<span className="nx-tourney-modal-score">{activeMatch.score_b}</span>
				</div>
				</div>
				<div className="nx-tourney-modal-games">
				{(() => {
					const isFinal = activeMatch.round === "final";
					const totalGames = isFinal ? 5 : 3;
					const winThreshold = isFinal ? 3 : 2;
					const gameWinners = [activeMatch.game1_winner, activeMatch.game2_winner, activeMatch.game3_winner, activeMatch.game4_winner || 0, activeMatch.game5_winner || 0];
					return Array.from({ length: totalGames }, (_, i) => i + 1).map((gameNum) => {
					const gameWinner = gameWinners[gameNum - 1];
					const isPlayed = gameWinner && gameWinner !== 0;
					const gamesPlayed = gameWinners.filter((g) => g && g !== 0).length;
					const isCurrent = activeMatch.status !== "done" && gameNum === gamesPlayed + 1 && activeMatch.score_a < winThreshold && activeMatch.score_b < winThreshold;
					const isSkipped = (activeMatch.score_a >= winThreshold || activeMatch.score_b >= winThreshold) && !isPlayed;
					return (
						<div className={`nx-league-game ${isPlayed ? "is-played" : ""} ${isCurrent ? "is-current" : ""} ${isSkipped ? "is-skipped" : ""}`} key={gameNum}>
						<span className="nx-league-game-label">Game {gameNum}</span>
						{isPlayed ? (
							<span className="nx-league-game-winner">
							<Crown size={10} /> {getTeamName(gameWinner)}
							</span>
						) : isSkipped ? (
							<span className="nx-league-game-skip">—</span>
						) : isCurrent ? (
							<div className="nx-league-game-btns">
							<button className="nx-league-game-btn" disabled={updating} onClick={() => recordGame(activeMatch.id, gameNum, activeMatch.team_a)}>{getTeamName(activeMatch.team_a)}</button>
							<button className="nx-league-game-btn" disabled={updating} onClick={() => recordGame(activeMatch.id, gameNum, activeMatch.team_b)}>{getTeamName(activeMatch.team_b)}</button>
							</div>
						) : (
							<span className="nx-league-game-pending">Menunggu</span>
						)}
						</div>
					);
					});
				})()}
				</div>
				{activeMatch.status === "done" && (
				<div className="nx-league-match-result" style={{ marginTop: "16px" }}>
					<Trophy size={14} />
					<span>Pemenang: <strong>{getTeamName(activeMatch.winner)}</strong></span>
					<span className="nx-league-match-score-final">({activeMatch.score_a} - {activeMatch.score_b})</span>
				</div>
				)}
			</div>
			</div>
		)}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  LEAGUE BRACKET (3 Teams Round-Robin)                               */
/* ------------------------------------------------------------------ */

function LeagueBracket({ teams, matches, onUpdate, isAdmin }) {
  const [updating, setUpdating] = useState(false);

  const API_BRACKET = "https://api.ipl-q.com/api/v1/web/BracketMLBB";

  // Map API matches to display format
  const getTeamById = (id) => teams.find((t) => t.id === id);

  const matchList = matches.map((m) => ({
    ...m,
    teamAData: getTeamById(m.team_a),
    teamBData: getTeamById(m.team_b),
    games: [m.game1_winner, m.game2_winner, m.game3_winner],
    finished: m.status === "done",
  }));

  const recordGame = async (matchId, gameNumber, winnerTeamId) => {
    if (updating) return;
    setUpdating(true);
    try {
      const response = await fetch(API_BRACKET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "UPDATE_SCORE",
          match_id: matchId,
          game_number: gameNumber,
          game_winner: winnerTeamId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.error_code === "0") {
          onUpdate(); // Refresh data
        } else {
          alert(`❌ ${data.error_message}`);
        }
      }
    } catch (err) {
      alert(`❌ Gagal update skor: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Calculate wins per team
  const winsMap = {};
  const gameWinsMap = {};
  const gameLossesMap = {};
  teams.forEach((t) => { winsMap[t.id] = 0; gameWinsMap[t.id] = 0; gameLossesMap[t.id] = 0; });

  matchList.forEach((m) => {
    if (m.finished && m.winner) {
      winsMap[m.winner] = (winsMap[m.winner] || 0) + 1;
    }
    m.games.forEach((g) => {
      if (g && g !== 0) {
        if (g === m.team_a) { gameWinsMap[m.team_a]++; gameLossesMap[m.team_b]++; }
        else if (g === m.team_b) { gameWinsMap[m.team_b]++; gameLossesMap[m.team_a]++; }
      }
    });
  });

  const allMatchesPlayed = matchList.every((m) => m.finished);
  const standings = teams
    .map((t) => ({ ...t, wins: winsMap[t.id] || 0, gameWins: gameWinsMap[t.id] || 0, gameLosses: gameLossesMap[t.id] || 0 }))
    .sort((a, b) => b.wins - a.wins || (b.gameWins - b.gameLosses) - (a.gameWins - a.gameLosses));

  const getRank = (wins) => {
    if (wins === 2) return { rank: 1, emoji: "🥇", label: "Juara 1" };
    if (wins === 1) return { rank: 2, emoji: "🥈", label: "Juara 2" };
    return { rank: 3, emoji: "🥉", label: "Juara 3" };
  };

  return (
    <div className="nx-league-wrap">
      <div className="nx-league-matches">
        {matchList.map((match, idx) => {
          const currentGame = match.games.filter((g) => g && g !== 0).length + 1;
          return (
            <div className={`nx-league-match-card ${match.finished ? "is-finished" : ""}`} key={match.id}>
              <div className="nx-league-match-header">
                <div className="nx-league-match-label">Pertandingan {idx + 1}</div>
                <span className="nx-league-bo3-badge">BO3</span>
              </div>

              <div className="nx-league-scoreboard">
                <div className={`nx-league-score-team ${match.winner === match.team_a ? "is-winner" : ""}`}>
                  <span className="nx-league-score-name">{match.teamAData?.name || `Tim ${match.team_a}`}</span>
                  <span className="nx-league-score-num">{match.score_a}</span>
                </div>
                <div className="nx-league-score-divider">
                  {match.finished ? <Crown size={16} style={{ color: "#FFC93C" }} /> : <span>—</span>}
                </div>
                <div className={`nx-league-score-team ${match.winner === match.team_b ? "is-winner" : ""}`}>
                  <span className="nx-league-score-num">{match.score_b}</span>
                  <span className="nx-league-score-name">{match.teamBData?.name || `Tim ${match.team_b}`}</span>
                </div>
              </div>

              <div className="nx-league-games">
                {[1, 2, 3].map((gameNum) => {
                  const gameWinner = match.games[gameNum - 1];
                  const isPlayed = gameWinner && gameWinner !== 0;
                  const isCurrent = !match.finished && gameNum === currentGame;
                  const isSkipped = match.finished && !isPlayed;
                  return (
                    <div className={`nx-league-game ${isPlayed ? "is-played" : ""} ${isCurrent ? "is-current" : ""} ${isSkipped ? "is-skipped" : ""}`} key={gameNum}>
                      <span className="nx-league-game-label">Game {gameNum}</span>
                      {isPlayed ? (
                        <span className="nx-league-game-winner">
                          <Crown size={10} /> {gameWinner === match.team_a ? (match.teamAData?.name || `Tim ${match.team_a}`) : (match.teamBData?.name || `Tim ${match.team_b}`)}
                        </span>
                      ) : isSkipped ? (
                        <span className="nx-league-game-skip">—</span>
                      ) : isCurrent && isAdmin ? (
                        <div className="nx-league-game-btns">
                          <button className="nx-league-game-btn" disabled={updating} onClick={() => recordGame(match.id, gameNum, match.team_a)}>
                            {match.teamAData?.name || `Tim ${match.team_a}`}
                          </button>
                          <button className="nx-league-game-btn" disabled={updating} onClick={() => recordGame(match.id, gameNum, match.team_b)}>
                            {match.teamBData?.name || `Tim ${match.team_b}`}
                          </button>
                        </div>
                      ) : (
                        <span className="nx-league-game-pending">Menunggu</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {match.finished && (
                <div className="nx-league-match-result">
                  <Trophy size={14} />
                  <span>Pemenang: <strong>{match.winner === match.team_a ? (match.teamAData?.name) : (match.teamBData?.name)}</strong></span>
                  <span className="nx-league-match-score-final">({match.score_a} - {match.score_b})</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="nx-league-standings">
        <h4 style={{ textAlign: "center", marginBottom: "16px", color: "var(--primary)" }}>Klasemen & Statistik</h4>
        <table className="nx-league-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tim</th>
              <th>Match (M/K)</th>
              <th>Game (M/K)</th>
              <th>Selisih Game</th>
              {allMatchesPlayed && <th>Peringkat</th>}
            </tr>
          </thead>
          <tbody>
            {standings.map((t, idx) => {
              const matchLosses = (teams.length - 1) - t.wins;
              const gameDiff = t.gameWins - t.gameLosses;
              const rankInfo = allMatchesPlayed ? getRank(t.wins) : null;
              return (
                <tr key={t.id} className={allMatchesPlayed && rankInfo.rank === 1 ? "is-champion" : ""}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td>
                    <span style={{ color: "#00FFA3", fontWeight: 700 }}>{t.wins}</span>
                    <span style={{ color: "var(--muted)" }}> / </span>
                    <span style={{ color: "#FF4D4D", fontWeight: 700 }}>{matchLosses}</span>
                  </td>
                  <td>
                    <span style={{ color: "#00FFA3", fontWeight: 700 }}>{t.gameWins}</span>
                    <span style={{ color: "var(--muted)" }}> / </span>
                    <span style={{ color: "#FF4D4D", fontWeight: 700 }}>{t.gameLosses}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: gameDiff > 0 ? "#00FFA3" : gameDiff < 0 ? "#FF4D4D" : "var(--muted)" }}>
                    {gameDiff > 0 ? `+${gameDiff}` : gameDiff}
                  </td>
                  {allMatchesPlayed && (
                    <td>
                      <span className={`nx-league-rank rank-${rankInfo.rank}`}>
                        {rankInfo.emoji} {rankInfo.label}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!allMatchesPlayed && (
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "12px", marginTop: "12px" }}>
            Klik nama tim pemenang tiap game. Format BO3: tim pertama yang menang 2 game memenangkan pertandingan.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BRACKET (with Spin Wheel)                                          */
/* ------------------------------------------------------------------ */

function Bracket({ go, isAdmin }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const TEAM_SIZE = 5;

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch("https://api.ipl-q.com/api/v1/web/SubmitRegisterMLBB", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "SELECT" }),
        });
        if (!response.ok) throw new Error(`Request gagal dengan status ${response.status}`);
        const data = await response.json();
        if (data.error_code === "0") {
          const result = data.result || [];
          setPlayers(result);
          // Pisahkan pemain yang sudah punya tim dan yang belum
          const unassignedPlayers = result.filter((p) => !p.nomor_team || p.nomor_team === "0" || p.nomor_team === "");
          setUnassigned(unassignedPlayers);
        } else {
          setError(data.error_message || "Gagal mengambil data");
        }
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (players.length > 0 && teams.length === 0) {
      const totalTeams = Math.ceil(players.length / TEAM_SIZE);
      const initialTeams = [];
      for (let i = 0; i < totalTeams; i++) {
        initialTeams.push({ id: i + 1, name: `Tim ${i + 1}`, members: [] });
      }
      // Masukkan pemain yang sudah punya nomor_team ke tim masing-masing
      players.forEach((p) => {
        if (p.nomor_team && p.nomor_team !== "0" && p.nomor_team !== "") {
          const tIdx = parseInt(p.nomor_team, 10) - 1;
          if (tIdx >= 0 && tIdx < initialTeams.length) {
            initialTeams[tIdx].members.push(p);
          }
        }
      });
      setTeams(initialTeams);

      // Set currentTeamIdx ke tim pertama yang belum penuh
      const firstAvailable = initialTeams.findIndex((t) => t.members.length < TEAM_SIZE);
      if (firstAvailable >= 0) setCurrentTeamIdx(firstAvailable);
    }
  }, [players]);

  const drawWheel = useCallback((angle) => {
    const canvas = canvasRef.current;
    if (!canvas || unassigned.length === 0) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const sliceAngle = (2 * Math.PI) / unassigned.length;
    ctx.clearRect(0, 0, size, size);
    const colors = ["#FF2E63", "#00D9FF", "#8B6BFF", "#FFC93C", "#FF8A3D", "#00FFA3", "#C24BFF", "#FF4D8D", "#0B80F4", "#22D1EE"];
    unassigned.forEach((player, i) => {
      const startAngle = angle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px Poppins, sans-serif";
      const label = player.nickname.length > 10 ? player.nickname.slice(0, 10) + ".." : player.nickname;
      ctx.fillText(label, radius - 14, 4);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = "#061221";
    ctx.fill();
    ctx.strokeStyle = "#0B80F4";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(center - 12, 4);
    ctx.lineTo(center + 12, 4);
    ctx.lineTo(center, 22);
    ctx.closePath();
    ctx.fillStyle = "#FF2E63";
    ctx.fill();
  }, [unassigned]);

  useEffect(() => { drawWheel(currentAngle); }, [currentAngle, drawWheel]);

  const spinWheel = () => {
    if (spinning || unassigned.length === 0) return;
    setSpinning(true);
    setSelectedPlayer(null);
    const sliceAngle = (2 * Math.PI) / unassigned.length;
    const extraSpins = (5 + Math.random() * 5) * 2 * Math.PI;
    const randomOffset = Math.random() * 2 * Math.PI;
    const targetAngle = currentAngle + extraSpins + randomOffset;
    const startAngle = currentAngle;
    const duration = 4000;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const angle = startAngle + (targetAngle - startAngle) * eased;
      setCurrentAngle(angle);
      if (progress < 1) { animRef.current = requestAnimationFrame(animate); }
      else {
        const finalAngle = angle % (2 * Math.PI);
        const arrowAngle = (2 * Math.PI - finalAngle + Math.PI * 1.5) % (2 * Math.PI);
        const winnerIdx = Math.floor(arrowAngle / sliceAngle) % unassigned.length;
        setSelectedPlayer(unassigned[winnerIdx]);
        setSpinning(false);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  const [assigning, setAssigning] = useState(false);

  const assignToTeam = async () => {
    if (!selectedPlayer || assigning) return;

    // Tentukan tim tujuan
    let targetIdx = currentTeamIdx;
    for (let i = 0; i < teams.length; i++) {
      const checkIdx = (currentTeamIdx + i) % teams.length;
      if (teams[checkIdx].members.length < TEAM_SIZE) { targetIdx = checkIdx; break; }
    }
    const nomorTeam = targetIdx + 1;

    setAssigning(true);
    try {
      const response = await fetch("https://api.ipl-q.com/api/v1/web/SubmitRegisterMLBB", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "UPDATE",
          nomor_team: String(nomorTeam),
          id: selectedPlayer.id,
        }),
      });

      if (!response.ok) throw new Error(`Request gagal dengan status ${response.status}`);
      const data = await response.json();

      if (data.error_code === "0") {
        const refetchResponse = await fetch("https://api.ipl-q.com/api/v1/web/SubmitRegisterMLBB", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "SELECT" }),
        });
        if (refetchResponse.ok) {
			const refetchData = await refetchResponse.json();
			if (refetchData.error_code === "0") {
				const result = refetchData.result || [];
				setPlayers(result);

				const totalTeamsCount = Math.ceil(result.length / TEAM_SIZE);
				const updatedTeams = [];
				for (let i = 0; i < totalTeamsCount; i++) {
					updatedTeams.push({ id: i + 1, name: `Tim ${i + 1}`, members: [] });
				}
				result.forEach((p) => {
					if (p.nomor_team) {
						const tIdx = parseInt(p.nomor_team, 10) - 1;
						if (tIdx >= 0 && tIdx < updatedTeams.length) {
							updatedTeams[tIdx].members.push(p);
						}
					}
				});
				setTeams(updatedTeams);

				const unassignedPlayers = result.filter((p) => !p.nomor_team || p.nomor_team === "0" || p.nomor_team === "");
				setUnassigned(unassignedPlayers);

				let nextIdx = (targetIdx + 1) % updatedTeams.length;
				for (let i = 0; i < updatedTeams.length; i++) {
					const checkIdx = (targetIdx + 1 + i) % updatedTeams.length;
					if (updatedTeams[checkIdx].members.length < TEAM_SIZE) { nextIdx = checkIdx; break; }
				}
				setCurrentTeamIdx(nextIdx);
			}
        }
        setSelectedPlayer(null);
      } else {
        alert(`❌ Gagal memasukkan ke tim!\n\n${data.error_message}`);
      }
    } catch (err) {
      alert(`❌ Gagal memasukkan ke tim!\n\n${err.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const resetSpin = async () => {
    // Reset nomor_team semua peserta ke 0 via API
    try {
      const promises = players.map((p) =>
        fetch("https://api.ipl-q.com/api/v1/web/SubmitRegisterMLBB", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "UPDATE", nomor_team: "0", id: p.id }),
        })
      );
      await Promise.all(promises);
    } catch (err) { /* ignore */ }

    setUnassigned([...players]);
    const totalTeams = Math.ceil(players.length / TEAM_SIZE);
    const emptyTeams = [];
    for (let i = 0; i < totalTeams; i++) emptyTeams.push({ id: i + 1, name: `Tim ${i + 1}`, members: [] });
    setTeams(emptyTeams);
    setCurrentTeamIdx(0);
    setSelectedPlayer(null);
    setCurrentAngle(0);
  };

  const totalPlayers = players.length;
  const totalTeams = Math.ceil(totalPlayers / TEAM_SIZE);
  const allAssigned = unassigned.length === 0 && players.length > 0 && teams.length > 0;

  return (
    <section id="bracket" className="nx-page">
      <HexField dense />
      <div className="nx-page-inner" style={{ paddingTop: "60px" }}>
        <div className="nx-section-head" style={{ textAlign: "center" }}>
          <span className="nx-section-eyebrow">Pengundian Tim</span>
          <h1>Bagan Turnamen</h1>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}><p>Memuat data...</p></div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#FF4D4D" }}><p>{error}</p></div>
        ) : totalPlayers < 2 ? (
          <div style={{ padding: "60px 20px", background: "var(--bg-panel)", borderRadius: "var(--radius)", border: "1px dashed var(--line)", marginTop: "40px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
            <Lock size={48} className="nx-cta-icon" style={{ margin: "0 auto 20px", opacity: 0.5 }} />
            <h2 style={{ marginBottom: "10px" }}>Belum Cukup Peserta</h2>
            <p className="nx-section-desc">Bagan turnamen akan ditampilkan setelah peserta mencukupi.</p>
            <button className="nx-btn nx-btn-primary" style={{ marginTop: "30px" }} onClick={() => go("register")}>Daftarkan Diri Anda <ChevronRight size={16} /></button>
          </div>
        ) : (
          <>
            <div className="nx-bracket-info">
              <span className="nx-chip"><Users size={14} /> {totalPlayers} Peserta</span>
              <span className="nx-chip"><Swords size={14} /> {totalTeams} Tim ({TEAM_SIZE} pemain/tim)</span>
              <span className="nx-chip"><Check size={14} /> {totalPlayers - unassigned.length} Sudah Ditempatkan</span>
            </div>

            <div className={`nx-spin-layout ${!isAdmin ? "is-viewer" : ""}`}>
              {!allAssigned && isAdmin && (
                <div className="nx-spin-section">
                  <h3 style={{ textAlign: "center", marginBottom: "8px" }}>Putar Roda untuk Menentukan Tim</h3>
                  <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "13px", marginBottom: "24px" }}>
                    Pemain akan masuk ke <strong style={{ color: "var(--primary)" }}>Tim {currentTeamIdx + 1}</strong> &mdash; Sisa: {unassigned.length} pemain
                  </p>
                  <div className="nx-spin-wheel-wrap">
                    <canvas ref={canvasRef} width={320} height={320} className="nx-spin-canvas" />
                  </div>
                  <div className="nx-spin-controls">
                    {!selectedPlayer ? (
                      <button className="nx-btn nx-btn-primary" onClick={spinWheel} disabled={spinning}>
                        {spinning ? "Memutar..." : "Putar Roda"}<Zap size={16} />
                      </button>
                    ) : (
                      <div className="nx-spin-result">
                        <p style={{ marginBottom: "12px" }}>
                          Terpilih: <strong style={{ color: "var(--primary)", fontSize: "18px" }}>{selectedPlayer.nickname}</strong>
                          <span style={{ color: "var(--muted)", fontSize: "13px", marginLeft: "8px" }}>({selectedPlayer.nama})</span>
                        </p>
                        <button className="nx-btn nx-btn-primary" onClick={assignToTeam} disabled={assigning}>
                          {assigning ? "Menyimpan..." : `Masukkan ke Tim ${currentTeamIdx + 1}`} <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                    <button className="nx-btn nx-btn-ghost" onClick={resetSpin} style={{ marginTop: "10px" }}>Reset Semua</button>
                  </div>
                </div>
              )}
              <div className="nx-spin-teams">
                <h3 style={{ marginBottom: "20px", textAlign: "center" }}>
                  {allAssigned ? "Susunan Tim (Final)" : "Susunan Tim (Sedang Berlangsung)"}
                </h3>
                <div className="nx-bracket-teams-grid">
                  {teams.map((t) => (
                    <div className={`nx-bracket-team-card ${currentTeamIdx === t.id - 1 && !allAssigned ? "is-active" : ""}`} key={t.id}>
                      <div className="nx-bracket-team-card-head">{t.name} ({t.members.length}/{TEAM_SIZE})</div>
                      <ul className="nx-bracket-team-members">
                        {t.members.map((m) => (<li key={m.id}>{m.nickname}</li>))}
                        {t.members.length < TEAM_SIZE && (<li className="nx-bracket-slot-empty">+{TEAM_SIZE - t.members.length} slot kosong</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {allAssigned && isAdmin && (
              <BracketDraw teams={teams} go={go} />
            )}
          </>
        )}
      	</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  BRACKET DRAW (Pengundian Lawan)                                    */
/* ------------------------------------------------------------------ */

function BracketDraw({ teams, go }) {
  const [shuffledTeams, setShuffledTeams] = useState([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [drawDone, setDrawDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingSeeds, setExistingSeeds] = useState([]);
  const shuffleIntervalRef = useRef(null);

  const API_URL = "https://api.ipl-q.com/api/v1/web/BracketMLBB";

  const totalTeams = teams.length;
  const isLeague = totalTeams === 3;

  // Cek apakah sudah ada data seed tersimpan
  useEffect(() => {
    const fetchSeeds = async () => {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "SELECT_SEEDS" }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.error_code === "0" && data.seeds && data.seeds.length > 0) {
            setExistingSeeds(data.seeds);
            // Susun ulang tim sesuai seed
            const ordered = data.seeds
              .sort((a, b) => a.seed_position - b.seed_position)
              .map((s) => teams.find((t) => t.id === s.nomor_team))
              .filter(Boolean);
            if (ordered.length > 0 && ordered.length === teams.length) {
              setShuffledTeams(ordered);
              setDrawDone(true);
              setSaved(true);
            }
          }
        }
      } catch (err) { /* ignore - API mungkin belum ready */ }
    };
    if (teams.length > 1) fetchSeeds();
  }, [teams]);

  // Shuffle function (Fisher-Yates)
  const shuffleArray = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startShuffle = () => {
    setIsShuffling(true);
    setDrawDone(false);
    setSaved(false);
    setShuffleCount(0);

    let count = 0;
    const maxShuffles = 20;
    const baseSpeed = 80;

    const doShuffle = () => {
      count++;
      setShuffledTeams(shuffleArray(teams));
      setShuffleCount(count);

      if (count < maxShuffles) {
        const delay = baseSpeed + (count > 14 ? (count - 14) * 80 : 0);
        shuffleIntervalRef.current = setTimeout(doShuffle, delay);
      } else {
        setIsShuffling(false);
        setDrawDone(true);
      }
    };

    doShuffle();
  };

  const saveToAPI = async () => {
    if (shuffledTeams.length === 0) return;
    setSaving(true);

    try {
      // 1. Simpan seed
      const seeds = shuffledTeams.map((t, idx) => ({
        nomor_team: String(t.id),
        seed_position: idx + 1,
      }));

      const seedResponse = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "SAVE_SEEDS", seeds }),
      });

      if (!seedResponse.ok) throw new Error("Gagal menyimpan seed");
      const seedData = await seedResponse.json();
      if (seedData.error_code !== "0") throw new Error(seedData.error_message || "Gagal menyimpan seed");

      // 2. Generate dan simpan match untuk semua round
      if (isLeague) {
        // Liga: simpan semua pasangan round robin
        const matchPairs = getMatchPairs();
        for (let i = 0; i < matchPairs.length; i++) {
          const pair = matchPairs[i];
          const matchPayload = {
            method: "SAVE_MATCH",
            match_code: `LIGA-${i + 1}`,
            round: "league",
            team_a: pair.teamA ? pair.teamA.id : 0,
            team_b: pair.teamB ? pair.teamB.id : 0,
            match_order: i + 1,
          };
          const matchResponse = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(matchPayload),
          });
          if (!matchResponse.ok) throw new Error(`Gagal menyimpan match LIGA-${i + 1}`);
        }
      } else {
        // Eliminasi: generate bracket sesuai jumlah tim
        // Tim yang BYE langsung masuk round lebih tinggi tanpa bertanding
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalTeams)));
        const numByes = bracketSize - totalTeams;
        
        // Atur seeding: tim awal mendapat BYE, tim akhir bertanding round 1
        const byeTeams = shuffledTeams.slice(0, numByes);
        const playingTeams = shuffledTeams.slice(numByes);

        // Susun semua rounds dan match codes dulu
        // Round 2 slots: [bye1, bye2, ..., TBD, TBD, ...]
        const round2Size = bracketSize / 2;
        const round2Slots = [];
        let byeIdx = 0;
        for (let i = 0; i < round2Size; i++) {
          if (byeIdx < byeTeams.length) {
            round2Slots.push(byeTeams[byeIdx].id);
            byeIdx++;
          } else {
            round2Slots.push(0);
          }
        }

        // Generate all match codes per round
        const allRounds = []; // [{roundName, matches: [{code, teamA, teamB, order, nextMatchCode, nextSlot}]}]
        
        // Round 1 (hanya match yang ada tim)
        const round1RoundName = bracketSize === 4 ? "semi" : bracketSize === 8 ? "quarter" : "round1";
        const round1Matches = [];
        let r1Order = 0;
        for (let i = 0; i < playingTeams.length; i += 2) {
          r1Order++;
          let code;
          if (round1RoundName === "semi") code = `SF-${r1Order}`;
          else if (round1RoundName === "quarter") code = `QF-${r1Order}`;
          else code = `R1-${r1Order}`;
          round1Matches.push({ code, teamA: playingTeams[i]?.id || 0, teamB: playingTeams[i + 1]?.id || 0, order: r1Order });
        }

        // Round 2+: generate matches from round2Slots
        const laterRounds = [];
        let currentSlots = round2Slots;
        while (currentSlots.length >= 2) {
          const matchCount = currentSlots.length / 2;
          let roundName;
          if (currentSlots.length === 2) roundName = "final";
          else if (currentSlots.length === 4) roundName = "semi";
          else roundName = "quarter";

          const roundMatches = [];
          const nextSlots = [];
          let order = 0;
          for (let i = 0; i < matchCount; i++) {
            order++;
            let code;
            if (roundName === "final") code = "GF";
            else if (roundName === "semi") code = `SF-${order}`;
            else code = `QF-${order}`;
            roundMatches.push({ code, teamA: currentSlots[i * 2] || 0, teamB: currentSlots[i * 2 + 1] || 0, order });
            nextSlots.push(0);
          }
          laterRounds.push({ roundName, matches: roundMatches });
          currentSlots = nextSlots;
        }

        // Tentukan next_match_code untuk round 1 matches
        // Round 1 winners masuk ke posisi TBD (0) di round2Slots
        // Cari posisi TBD di round2Slots dan mapping ke match di round 2
        const tdbPositions = []; // index di round2Slots yang nilainya 0
        for (let i = 0; i < round2Slots.length; i++) {
          if (round2Slots[i] === 0) tdbPositions.push(i);
        }

        // Setiap round1 match (urutan ke-n) feed ke tdbPositions[n]
        for (let i = 0; i < round1Matches.length; i++) {
          if (i < tdbPositions.length && laterRounds.length > 0) {
            const tdbPos = tdbPositions[i];
            const targetMatchIdx = Math.floor(tdbPos / 2); // match ke berapa di round 2
            const targetSlot = tdbPos % 2 === 0 ? "a" : "b"; // slot a atau b
            if (targetMatchIdx < laterRounds[0].matches.length) {
              round1Matches[i].nextMatchCode = laterRounds[0].matches[targetMatchIdx].code;
              round1Matches[i].nextSlot = targetSlot;
            }
          }
        }

        // Tentukan next_match_code untuk later rounds
        for (let rIdx = 0; rIdx < laterRounds.length; rIdx++) {
          const nextRound = rIdx < laterRounds.length - 1 ? laterRounds[rIdx + 1] : null;
          for (let mIdx = 0; mIdx < laterRounds[rIdx].matches.length; mIdx++) {
            if (nextRound) {
              const nextMatchIdx = Math.floor(mIdx / 2);
              if (nextMatchIdx < nextRound.matches.length) {
                laterRounds[rIdx].matches[mIdx].nextMatchCode = nextRound.matches[nextMatchIdx].code;
                laterRounds[rIdx].matches[mIdx].nextSlot = mIdx % 2 === 0 ? "a" : "b";
              }
            }
          }
        }

        // Gabungkan semua rounds
        allRounds.push({ roundName: round1RoundName, matches: round1Matches });
        laterRounds.forEach((r) => allRounds.push(r));

        // Simpan semua match ke API
        for (let rIdx = 0; rIdx < allRounds.length; rIdx++) {
          const round = allRounds[rIdx];
          for (let mIdx = 0; mIdx < round.matches.length; mIdx++) {
            const match = round.matches[mIdx];
            const res = await fetch(API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                method: "SAVE_MATCH",
                match_code: match.code,
                round: round.roundName,
                team_a: match.teamA,
                team_b: match.teamB,
                match_order: match.order,
                next_match_code: match.nextMatchCode || "",
                next_slot: match.nextSlot || "",
              }),
            });
            if (!res.ok) throw new Error(`Gagal menyimpan match ${match.code}`);
          }
        }
      }

      setSaved(true);
    } catch (err) {
      alert(`❌ Gagal menyimpan!\n\n${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetDraw = async () => {
    setShuffledTeams([]);
    setDrawDone(false);
    setSaved(false);
    setShuffleCount(0);
    setExistingSeeds([]);
    if (shuffleIntervalRef.current) clearTimeout(shuffleIntervalRef.current);

    // Reset di API juga
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "RESET" }),
      });
    } catch (err) { /* ignore */ }
  };

  // Generate match pairs from shuffled order
  const getMatchPairs = () => {
    if (shuffledTeams.length === 0) return [];
    if (isLeague) {
      const pairs = [];
      for (let i = 0; i < shuffledTeams.length; i++) {
        for (let j = i + 1; j < shuffledTeams.length; j++) {
          pairs.push({ teamA: shuffledTeams[i], teamB: shuffledTeams[j] });
        }
      }
      return pairs;
    }
    // Bracket eliminasi: pad ke power of 2, BYE di akhir
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(shuffledTeams.length)));
    const padded = [...shuffledTeams];
    while (padded.length < bracketSize) padded.push(null); // null = BYE
    const pairs = [];
    for (let i = 0; i < padded.length; i += 2) {
      const tA = padded[i];
      const tB = padded[i + 1] !== undefined ? padded[i + 1] : null;
      // Skip double BYE
      if (!tA && !tB) continue;
      pairs.push({ teamA: tA, teamB: tB });
    }
    return pairs;
  };

  if (teams.length < 2) return null;

  return (
    <div className="nx-draw-section">
      <div className="nx-draw-header">
        <Swords size={20} style={{ color: "var(--primary)" }} />
        <h3>Pengundian Lawan</h3>
        <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "6px" }}>
          {isLeague
            ? "Acak urutan pertandingan liga (semua tim saling bertemu)"
            : "Acak posisi tim di bracket untuk menentukan lawan"
          }
        </p>
      </div>

      {/* Shuffling Animation - Grid of team cards */}
      <div className={`nx-draw-grid ${isShuffling ? "is-shuffling" : ""}`}>
        {(shuffledTeams.length > 0 ? shuffledTeams : teams).filter(Boolean).map((t, idx) => {
          const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalTeams)));
          const numByes = bracketSize - totalTeams;
          const isByeTeam = drawDone && !isLeague && idx < numByes;
          return (
            <div
              className={`nx-draw-team-card ${drawDone ? "is-final" : ""} ${isByeTeam ? "is-bye-card" : ""}`}
              key={t.id}
              style={{ animationDelay: drawDone ? `${idx * 0.1}s` : "0s" }}
            >
              <span className="nx-draw-team-seed">{idx + 1}</span>
              <span className="nx-draw-team-name">{t.name}</span>
              {isByeTeam && <span className="nx-draw-bye-badge">BYE</span>}
            </div>
          );
        })}
      </div>

      {/* Match Pairs Result */}
      {drawDone && !isLeague && (
        <div className="nx-draw-results">
          <h4 style={{ textAlign: "center", color: "var(--primary)", marginBottom: "16px" }}>
            Hasil Pengundian Bracket
          </h4>

          {/* Tim yang mendapat BYE */}
          {(() => {
            const bracketSize = Math.pow(2, Math.ceil(Math.log2(shuffledTeams.length)));
            const numByes = bracketSize - shuffledTeams.length;
            const byeTeamsList = shuffledTeams.slice(0, numByes);
            const playingTeamsList = shuffledTeams.slice(numByes);

            return (
              <>
                {byeTeamsList.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                      Langsung Maju (BYE) — {byeTeamsList.length} tim
                    </p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {byeTeamsList.map((t) => (
                        <span key={t.id} className="nx-chip" style={{ borderColor: "rgba(0,255,163,0.3)", color: "#00FFA3" }}>
                          <Crown size={12} /> {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tim yang bertanding round pertama */}
                <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Pertandingan Babak Pertama
                </p>
                <div className="nx-draw-pairs">
                  {(() => {
                    const pairs = [];
                    for (let i = 0; i < playingTeamsList.length; i += 2) {
                      pairs.push({ teamA: playingTeamsList[i], teamB: playingTeamsList[i + 1] || null });
                    }
                    return pairs.map((pair, idx) => (
                      <div className="nx-draw-pair" key={idx}>
                        <span className="nx-draw-pair-label">Match {idx + 1}</span>
                        <div className="nx-draw-pair-teams">
                          <span className="nx-draw-pair-team">{pair.teamA ? pair.teamA.name : "TBD"}</span>
                          <span className="nx-draw-pair-vs">VS</span>
                          <span className="nx-draw-pair-team">{pair.teamB ? pair.teamB.name : "TBD"}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Liga format - tampilkan semua match */}
      {drawDone && isLeague && (
        <div className="nx-draw-results">
          <h4 style={{ textAlign: "center", color: "var(--primary)", marginBottom: "16px" }}>
            Urutan Pertandingan
          </h4>
          <div className="nx-draw-pairs">
            {getMatchPairs().map((pair, idx) => (
              <div className="nx-draw-pair" key={idx}>
                <span className="nx-draw-pair-label">Match {idx + 1}</span>
                <div className="nx-draw-pair-teams">
                  <span className="nx-draw-pair-team">{pair.teamA ? pair.teamA.name : "TBD"}</span>
                  <span className="nx-draw-pair-vs">VS</span>
                  <span className="nx-draw-pair-team">{pair.teamB ? pair.teamB.name : "TBD"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="nx-draw-controls">
        {!drawDone ? (
          <button
            className="nx-btn nx-btn-primary"
            onClick={startShuffle}
            disabled={isShuffling}
          >
            {isShuffling ? `Mengacak... (${shuffleCount})` : "Acak Lawan"}
            <Zap size={16} />
          </button>
        ) : (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            {!saved ? (
              <>
                <button className="nx-btn nx-btn-ghost" onClick={resetDraw}>
                  Acak Ulang
                </button>
                <button className="nx-btn nx-btn-primary" onClick={saveToAPI} disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan & Lanjutkan"}
                  <Check size={16} />
                </button>
              </>
            ) : (
              <>
                <button className="nx-btn nx-btn-ghost" onClick={resetDraw}>
                  Reset & Acak Ulang
                </button>
                <button className="nx-btn nx-btn-primary" onClick={() => go("matches")}>
                  <Swords size={16} /> Lihat Bracket Pertandingan
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {saved && (
        <p style={{ textAlign: "center", color: "#00FFA3", fontSize: "13px", marginTop: "12px" }}>
          ✓ Data bracket berhasil disimpan
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MATCHES (Bracket Pertandingan - Halaman Sendiri)                   */
/* ------------------------------------------------------------------ */

function Matches({ isAdmin }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [seeds, setSeeds] = useState([]);
  const TEAM_SIZE = 5;

  const API_REGISTER = "https://api.ipl-q.com/api/v1/web/SubmitRegisterMLBB";
  const API_BRACKET = "https://api.ipl-q.com/api/v1/web/BracketMLBB";

  const fetchData = async () => {
    try {
      // Fetch players + seeds + matches in parallel
      const [playersRes, seedsRes, matchesRes] = await Promise.all([
        fetch(API_REGISTER, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method: "SELECT" }) }),
        fetch(API_BRACKET, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method: "SELECT_SEEDS" }) }),
        fetch(API_BRACKET, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method: "SELECT_MATCHES" }) }),
      ]);

      // Process players
      if (playersRes.ok) {
        const playersData = await playersRes.json();
        if (playersData.error_code === "0") {
          const result = playersData.result || [];
          setPlayers(result);
          const teamMap = {};
          result.forEach((p) => {
            if (p.nomor_team && p.nomor_team !== "0" && p.nomor_team !== "") {
              const tNum = parseInt(p.nomor_team, 10);
              if (tNum > 0) {
                if (!teamMap[tNum]) teamMap[tNum] = { id: tNum, name: `Tim ${tNum}`, members: [] };
                teamMap[tNum].members.push(p);
              }
            }
          });
          setTeams(Object.values(teamMap).sort((a, b) => a.id - b.id));
        }
      }

      // Process seeds
      if (seedsRes.ok) {
        const seedsData = await seedsRes.json();
        if (seedsData.error_code === "0" && seedsData.seeds) {
          setSeeds(seedsData.seeds);
        }
      }

      // Process matches
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        if (matchesData.error_code === "0" && matchesData.matches) {
          setMatches(matchesData.matches);
        }
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalTeams = teams.length;
  const hasMatches = matches.length > 0;

  // Sort teams by seed position if seeds exist
  const getSeededTeams = () => {
    if (seeds.length === 0) return teams;
    return seeds
      .sort((a, b) => a.seed_position - b.seed_position)
      .map((s) => teams.find((t) => t.id === s.nomor_team))
      .filter(Boolean);
  };

  return (
    <section id="matches" className="nx-page">
      <HexField dense />
      <div className="nx-page-inner" style={{ paddingTop: "60px" }}>
        <div className="nx-section-head" style={{ textAlign: "center" }}>
          <span className="nx-section-eyebrow">
            {totalTeams === 3 ? "Format Liga Round Robin • BO3" : "Format Eliminasi Tunggal"}
          </span>
          <h1>Bracket Pertandingan</h1>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}><p>Memuat data...</p></div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#FF4D4D" }}><p>{error}</p></div>
        ) : totalTeams < 2 ? (
          <div style={{ padding: "60px 20px", background: "var(--bg-panel)", borderRadius: "var(--radius)", border: "1px dashed var(--line)", marginTop: "40px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
            <Lock size={48} className="nx-cta-icon" style={{ margin: "0 auto 20px", opacity: 0.5 }} />
            <h2 style={{ marginBottom: "10px" }}>Belum Ada Tim</h2>
            <p className="nx-section-desc">Bracket pertandingan akan ditampilkan setelah proses pengundian tim selesai.</p>
          </div>
        ) : !hasMatches ? (
          <div style={{ padding: "60px 20px", background: "var(--bg-panel)", borderRadius: "var(--radius)", border: "1px dashed var(--line)", marginTop: "40px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
            <Swords size={48} className="nx-cta-icon" style={{ margin: "0 auto 20px", opacity: 0.5 }} />
            <h2 style={{ marginBottom: "10px" }}>Menunggu Pengundian</h2>
            <p className="nx-section-desc">Bracket pertandingan akan ditampilkan setelah proses pengundian lawan selesai di halaman Bagan Turnamen.</p>
          </div>
        ) : (
          <>
            <div className="nx-bracket-info">
              <span className="nx-chip"><Users size={14} /> {players.length} Peserta</span>
              <span className="nx-chip"><Swords size={14} /> {totalTeams} Tim</span>
              <span className="nx-chip"><Trophy size={14} /> {totalTeams === 3 ? "Round Robin BO3" : "Eliminasi"}</span>
            </div>

            {totalTeams === 3 && (
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <p style={{ color: "var(--muted)", fontSize: "13px" }}>
                  Semua tim saling bertemu dengan format <strong style={{ color: "var(--primary)" }}>Best of 3 (BO3)</strong>. Penentuan juara berdasarkan jumlah kemenangan match:<br />
                  🥇 2x Menang = Juara 1 &nbsp;|&nbsp; 🥈 1x Menang = Juara 2 &nbsp;|&nbsp; 🥉 0x Menang = Juara 3
                </p>
              </div>
            )}

            {totalTeams === 3 ? (
              <LeagueBracket teams={teams} matches={matches} onUpdate={fetchData} isAdmin={isAdmin} />
            ) : (
              <TournamentBracket teams={getSeededTeams()} totalTeams={totalTeams} matches={matches} onUpdate={fetchData} isAdmin={isAdmin} />
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SCHEDULE                                                           */
/* ------------------------------------------------------------------ */

function Schedule() {
  return (
    <section id="schedule" className="nx-page">
      <HexField dense />
      <div className="nx-page-inner" style={{ textAlign: "center", paddingTop: "60px" }}>
        <div className="nx-section-head">
          <span className="nx-section-eyebrow">Live Tracking</span>
          <h1>Jadwal &amp; Hasil Pertandingan</h1>
        </div>
        <div style={{ padding: "60px 20px", background: "var(--bg-panel)", borderRadius: "var(--radius)", border: "1px dashed var(--line)", marginTop: "40px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
          <Clock size={48} className="nx-cta-icon" style={{ margin: "0 auto 20px", opacity: 0.5 }} />
          <h2 style={{ marginBottom: "10px" }}>Belum Tersedia</h2>
          <p className="nx-section-desc">Jadwal pertandingan akan dirilis segera setelah proses pengundian bagan selesai.</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "30px" }}>
            <span className="nx-chip"><Calendar size={14} /> 8 - 9 Agustus 2026</span>
            <span className="nx-chip"><MapPin size={14} /> Sport Club Golden Flower</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PLAYERS (LIST PEMAIN TERDAFTAR)                                   */
/* ------------------------------------------------------------------ */

function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch("https://api.ipl-q.com/api/v1/web/SubmitRegisterMLBB", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "SELECT" }),
        });
        if (!response.ok) throw new Error(`Request gagal dengan status ${response.status}`);
        const data = await response.json();
        if (data.error_code === "0") { setPlayers(data.result || []); }
        else { setError(data.error_message || "Gagal mengambil data pemain"); }
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchPlayers();
  }, []);

  return (
    <section id="players" className="nx-page">
      <HexField dense />
      <div className="nx-page-inner">
        <div className="nx-section-head">
          <span className="nx-section-eyebrow">Peserta Terdaftar</span>
          <h1>Daftar Pemain</h1>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}><p>Memuat data pemain...</p></div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#FF4D4D" }}><p>{error}</p></div>
        ) : players.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}><p>Belum ada pemain yang terdaftar.</p></div>
        ) : (
          <div className="nx-players-table-wrap">
            <table className="nx-players-table">
              <thead>
                <tr><th>No</th><th>Nama</th><th>Nickname</th><th>Cluster</th><th>Tanggal Daftar</th></tr>
              </thead>
              <tbody>
                {players.map((player, idx) => (
                  <tr key={player.id}><td>{idx + 1}</td><td>{player.nama}</td><td>{player.nickname}</td><td>{player.cluster}</td><td>{player.tanggal_daftar}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  REGISTER                                                          */
/* ------------------------------------------------------------------ */

function Register({ registrationOpen }) {
	const [status, setStatus] = useState("idle");
	const [nama, setNama] = useState("");
	const [noHp, setNoHp] = useState("");
	const [nickname, setNickname] = useState("");
	const [gameId, setGameId] = useState("");
	const [server, setServer] = useState("");
	const [clusterRumah, setClusterRumah] = useState("");
	const [blokRumah, setBlokRumah] = useState("");
	const [nomorRumah, setNomorRumah] = useState("");

	if (!registrationOpen) {
		return (
			<section id="register" className="nx-page">
				<HexField dense />
				<div className="nx-page-inner" style={{ textAlign: "center", paddingTop: "80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
					<Lock size={48} className="nx-cta-icon" style={{ margin: "0 auto 20px", opacity: 0.5 }} />
					<h2>Pendaftaran Ditutup</h2>
					<p className="nx-section-desc" style={{ textAlign: "center", marginTop: "12px", alignSelf: "center" }}>
						Pendaftaran peserta untuk Turnamen E-Sports Cluster Golden Flower telah ditutup.<br />
						Terima kasih atas antusiasme seluruh peserta!
					</p>
					<div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "30px" }}>
						<span className="nx-chip"><Calendar size={14} /> 8 - 9 Agustus 2026</span>
						<span className="nx-chip"><MapPin size={14} /> Sport Club Golden Flower</span>
					</div>
				</div>
			</section>
		);
	}

	const handleSubmit = async () => {
		if (!nama.trim()) { alert("❌ Form tidak lengkap!\n\nNama wajib diisi"); return; }
		if (!noHp.trim()) { alert("❌ Form tidak lengkap!\n\nNomor WA wajib diisi"); return; }
		if (!nickname.trim()) { alert("❌ Form tidak lengkap!\n\nNickname Akun wajib diisi"); return; }
		if (!gameId.toString().trim()) { alert("❌ Form tidak lengkap!\n\nID Game wajib diisi"); return; }
		if (!server.toString().trim()) { alert("❌ Form tidak lengkap!\n\nServer Game wajib diisi"); return; }
		if (!clusterRumah.trim()) { alert("❌ Form tidak lengkap!\n\nCluster Rumah wajib dipilih"); return; }
		if (!blokRumah.trim()) { alert("❌ Form tidak lengkap!\n\nBlok Rumah wajib diisi"); return; }
		if (!nomorRumah.trim()) { alert("❌ Form tidak lengkap!\n\nNomor Rumah wajib diisi"); return; }

		setStatus("submitting");
		try {
			const payload = {
				method: "INSERT",
				nama: nama.trim(),
				nomor_wa: noHp.trim(),
				nickname: nickname.trim(),
				game_id: gameId.trim(),
				game_server: server.trim(),
				cluster_rumah: clusterRumah.trim(),
				blok_rumah: blokRumah.trim(),
				nomor_rumah: nomorRumah.trim(),
			};
			const response = await fetch("https://api.ipl-q.com/api/v1/web/SubmitRegisterMLBB", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!response.ok) {
				const errData = await response.json().catch(() => null);
				throw new Error(errData?.responsemessage || `Request gagal dengan status ${response.status}`);
			}
			const data = await response.json();
			if (data.error_code === "0" || data.errorcode === 0) {
				setStatus("success");
			} else if (data.error_code === "1" || data.errorcode === 1) {
				setStatus("idle");
				alert(`❌ ${data.error_message || data.errormessage || "Pendaftaran gagal"}`);
			} else {
				setStatus("idle");
				alert(`❌ ${data.error_message || data.responsemessage || "Pendaftaran gagal"}`);
			}
		} catch (err) {
			setStatus("idle");
			const isNetworkError = err.message === "Failed to fetch" || err.name === "TypeError";
			if (isNetworkError) {
				alert(`❌ Pendaftaran Gagal!\n\nTidak dapat terhubung ke server. Pastikan koneksi internet Anda stabil dan coba lagi.\n\nJika masalah berlanjut, coba nonaktifkan ad-blocker atau gunakan jaringan lain.`);
			} else {
				alert(`❌ Pendaftaran Gagal!\n\n${err.message}\n\nSilakan coba lagi.`);
			}
		}
	};

	if (status === "success") {
		return (
			<section id="register" className="nx-page">
				<HexField dense />
				<div className="nx-page-inner" style={{ textAlign: "center", paddingTop: "80px" }}>
					<Trophy size={48} className="nx-cta-icon" style={{ margin: "0 auto 20px" }} />
					<h2>Pendaftaran Berhasil!</h2>
					<button className="nx-btn nx-btn-primary" style={{ marginTop: "30px" }} onClick={() => {
						setStatus("idle"); setNama(""); setNoHp(""); setNickname(""); setGameId(""); setServer(""); setClusterRumah(""); setBlokRumah(""); setNomorRumah("");
					}}>Daftar Peserta Lain</button>
				</div>
			</section>
		);
	}

	return (
		<section id="register" className="nx-page">
			<HexField dense />
			<div className="nx-page-inner">
				<div className="nx-section-head">
					<span className="nx-section-eyebrow">Pendaftaran Peserta</span>
					<h1>Daftarkan Diri Anda</h1>
				</div>
				<div className="nx-form">
					<div className="nx-form-divider">Data Peserta</div>
					<div className="nx-form-group">
						<label>Nama</label>
						<input id="namaInput" type="text" className="nx-input" placeholder="Masukkan nama lengkap Anda" value={nama} onChange={(e) => setNama(e.target.value)} />
					</div>
					<div className="nx-form-group">
						<label>Nomor WA Aktif</label>
						<input id="hpInput" type="text" className="nx-input" placeholder="Contoh: 081234567890" value={noHp} onChange={(e) => setNoHp(e.target.value)} />
					</div>
					<div className="nx-form-group">
						<label>Nickname Akun Game</label>
						<input id="nicknameInput" type="text" className="nx-input" placeholder="Masukkan nickname akun game Anda" value={nickname} onChange={(e) => setNickname(e.target.value)} />
					</div>
					<div className="nx-form-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
						<div className="nx-form-group">
						<label>ID Game</label>
						<input id="gameIdInput" type="number" className="nx-input" placeholder="Masukkan ID game" value={gameId} onChange={(e) => setGameId(e.target.value)} />
						</div>
						<div className="nx-form-group">
						<label>Server Game</label>
						<input id="serverInput" type="number" className="nx-input" placeholder="Masukkan nomor server" value={server} onChange={(e) => setServer(e.target.value)} />
						</div>
					</div>
					<div className="nx-form-group">
						<label>Cluster Rumah</label>
						<select id="clusterInput" className="nx-input" value={clusterRumah} onChange={(e) => setClusterRumah(e.target.value)}>
						<option value="" disabled>Pilih cluster rumah Anda</option>
						<option value="Cluster Marigold">Cluster Marigold</option>
						<option value="Cluster Camelia">Cluster Camelia</option>
						</select>
					</div>
					<div className="nx-form-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
						<div className="nx-form-group">
							<label>Blok Rumah</label>
							<input id="blokInput" type="text" className="nx-input" placeholder="Contoh: A, B, C" value={blokRumah} onChange={(e) => setBlokRumah(e.target.value)} />
						</div>
						<div className="nx-form-group">
							<label>Nomor Rumah</label>
							<input id="nomorRumahInput" type="text" className="nx-input" placeholder="Contoh: 10, 25" value={nomorRumah} onChange={(e) => setNomorRumah(e.target.value)} />
						</div>
					</div>
					<div className="nx-form-action">
						<button type="button" className="nx-btn nx-btn-primary" disabled={status === "submitting"} onClick={handleSubmit}>
						{status === "submitting" ? "Mengirim..." : "Kirim Pendaftaran"}<ChevronRight size={16} />
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}

/* ------------------------------------------------------------------ */
/*  ADMIN PANEL                                                        */
/* ------------------------------------------------------------------ */

function AdminPanel({ settings, setSettings, onLogout }) {
  const [saving, setSaving] = useState(false);
  const API_URL = "https://api.ipl-q.com/api/v1/web/BracketMLBB";

  const toggleSetting = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStorage.setItem("gf_settings", JSON.stringify(updated));

    // Simpan ke API
    setSaving(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "SAVE_SETTINGS",
          registration_open: updated.registrationOpen ? 1 : 0,
          show_bracket: updated.showBracket ? 1 : 0,
          show_matches: updated.showMatches ? 1 : 0,
        }),
      });
    } catch (err) { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <section id="admin" className="nx-page">
      <HexField dense />
      <div className="nx-page-inner" style={{ paddingTop: "60px", maxWidth: "600px", margin: "0 auto" }}>
        <div className="nx-section-head" style={{ textAlign: "center" }}>
          <span className="nx-section-eyebrow">Panel Kontrol</span>
          <h1>Admin</h1>
        </div>
        <div className="nx-form" style={{ marginTop: "30px" }}>
          <div className="nx-form-divider">Pengaturan Website</div>

          <div className="nx-admin-toggle">
            <div>
              <strong>Pendaftaran Peserta</strong>
              <p style={{ color: "var(--muted)", fontSize: "12px", margin: "4px 0 0" }}>Buka/tutup form pendaftaran peserta baru</p>
            </div>
            <button className={`nx-toggle-btn ${settings.registrationOpen ? "is-on" : ""}`} onClick={() => toggleSetting("registrationOpen")}>
              <span className="nx-toggle-knob" />
              <span className="nx-toggle-label">{settings.registrationOpen ? "BUKA" : "TUTUP"}</span>
            </button>
          </div>

          <div className="nx-admin-toggle">
            <div>
              <strong>Bagan Turnamen</strong>
              <p style={{ color: "var(--muted)", fontSize: "12px", margin: "4px 0 0" }}>Tampilkan halaman bagan turnamen & pengundian</p>
            </div>
            <button className={`nx-toggle-btn ${settings.showBracket ? "is-on" : ""}`} onClick={() => toggleSetting("showBracket")}>
              <span className="nx-toggle-knob" />
              <span className="nx-toggle-label">{settings.showBracket ? "TAMPIL" : "SEMBUNYI"}</span>
            </button>
          </div>

          <div className="nx-admin-toggle">
            <div>
              <strong>Halaman Pertandingan</strong>
              <p style={{ color: "var(--muted)", fontSize: "12px", margin: "4px 0 0" }}>Tampilkan halaman bracket pertandingan</p>
            </div>
            <button className={`nx-toggle-btn ${settings.showMatches ? "is-on" : ""}`} onClick={() => toggleSetting("showMatches")}>
              <span className="nx-toggle-knob" />
              <span className="nx-toggle-label">{settings.showMatches ? "TAMPIL" : "SEMBUNYI"}</span>
            </button>
          </div>

          <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
            <button className="nx-btn nx-btn-ghost" onClick={onLogout} style={{ width: "100%", justifyContent: "center" }}>
              Keluar dari Admin
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  APP SHELL                                                         */
/* ------------------------------------------------------------------ */

export default function NexusClashApp() {
  const [page, setPage] = useState("home");
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem("gf_admin") === "true");
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("gf_settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const go = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Fetch settings dari API saat load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("https://api.ipl-q.com/api/v1/web/BracketMLBB", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "GET_SETTINGS" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.error_code === "0" && data.settings) {
            const s = {
              registrationOpen: data.settings.registration_open === 1,
              showBracket: data.settings.show_bracket === 1,
              showMatches: data.settings.show_matches === 1,
            };
            setSettings(s);
            localStorage.setItem("gf_settings", JSON.stringify(s));
          }
        }
      } catch (err) { /* gunakan default/localStorage */ }
    };
    fetchSettings();
  }, []);

  const handleAdminLogin = () => {
    setIsAdmin(true);
    localStorage.setItem("gf_admin", "true");
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("gf_admin");
    setPage("home");
  };

  return (
    <div className="nx-root">
      <style>{CSS}</style>
      <Nav page={page} go={go} showBracket={settings.showBracket} showMatches={settings.showMatches} isAdmin={isAdmin} onAdminLogin={handleAdminLogin} />
      <ClusterRibbon />
      {page === "admin" && isAdmin ? (
        <AdminPanel settings={settings} setSettings={setSettings} onLogout={handleAdminLogout} />
      ) : page === "register" ? (
        <Register registrationOpen={settings.registrationOpen} />
      ) : page === "players" ? (
        <Players />
      ) : page === "bracket" ? (
        <ErrorBoundary><Bracket go={go} isAdmin={isAdmin} /></ErrorBoundary>
      ) : page === "matches" ? (
        <ErrorBoundary><Matches isAdmin={isAdmin} /></ErrorBoundary>
      ) : page === "schedule" ? (
        <Schedule />
      ) : (
        <Home go={go} />
      )}
      <footer className="nx-footer">
        <span>GOLDEN FLOWER &copy; 2026</span>
        <span>Dipersembahkan oleh Warga Cluster {EVENT.cluster} &mdash; dalam rangka {EVENT.tema}</span>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STYLES                                                             */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Poppins:wght@400;500;600;700&display=swap');

.nx-root {
  --primary: #0B80F4;
  --on-primary: #FFFFFF;
  --bg-void: #030A14;
  --bg-panel: #061221;
  --bg-panel-2: #0B1E36;
  --line: rgba(11,128,244,0.24);
  --cyan: var(--primary);
  --magenta: var(--primary);
  --text: var(--on-primary);
  --muted: rgba(255,255,255,0.75);
  --radius: 10px;
  font-family: 'Poppins', sans-serif;
  background: var(--bg-void);
  color: var(--text);
  min-height: 100vh;
  position: relative;
  isolation: isolate;
}
html, body, #root { min-height: 100%; background: var(--bg-void); }
.nx-root * { box-sizing: border-box; }
.nx-root h1, .nx-root h2, .nx-root h3 { font-family: 'Montserrat', sans-serif; margin: 0; letter-spacing: 0.02em; }
.nx-root p { margin: 0; }
.nx-root button { font-family: inherit; cursor: pointer; }
.nx-hero, .nx-page { scroll-margin-top: 110px; }

/* ---------- NAV ---------- */
.nx-nav { position: sticky; top: 0; z-index: 50; background: rgba(3,10,20,0.92); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
.nx-nav-inner { max-width: 1180px; margin: 0 auto; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
.nx-brand { display: flex; align-items: center; gap: 8px; background: none; border: none; padding: 0; }
.nx-brand-mark { width: 32px; height: 32px; display: grid; place-items: center; background: linear-gradient(145deg, rgba(196,214,60,0.12), rgba(168,191,48,0.08)); border: 1px solid rgba(196,214,60,0.4); border-radius: 8px; }
.nx-brand-logo { width: 32px; height: 32px; object-fit: contain; border-radius: 6px; }
.nx-brand-text { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 15px; color: var(--text); letter-spacing: 0.06em; }
.nx-brand-accent { color: #C4D63C; }
.nx-nav-links { display: flex; gap: 6px; }
.nx-nav-link { background: none; border: none; color: var(--muted); font-weight: 600; font-size: 15px; padding: 8px 14px; border-radius: 6px; position: relative; transition: color 0.2s; letter-spacing: 0.02em; }
.nx-nav-link:hover { color: var(--text); }
.nx-nav-link.is-active { color: var(--cyan); }
.nx-nav-link.is-active::after { content: ""; position: absolute; left: 14px; right: 14px; bottom: 2px; height: 2px; background: var(--cyan); box-shadow: 0 0 8px var(--cyan); border-radius: 2px; }
.nx-nav-burger { display: none; background: none; border: none; color: var(--text); }
.nx-nav-mobile { display: none; }
@media (max-width: 760px) {
  .nx-nav-links { display: none; }
  .nx-nav-burger { display: block; }
  .nx-nav-mobile { display: flex; flex-direction: column; border-top: 1px solid var(--line); }
  .nx-nav-mobile-link { display: flex; justify-content: space-between; align-items: center; background: none; border: none; color: var(--muted); font-weight: 600; font-size: 15px; padding: 14px 24px; border-bottom: 1px solid var(--line); }
  .nx-nav-mobile-link.is-active { color: var(--cyan); }
}

/* ---------- CLUSTER RIBBON ---------- */
.nx-ribbon { position: relative; z-index: 30; overflow: hidden; background: linear-gradient(90deg, var(--primary), var(--primary)); border-top: 2px solid var(--on-primary); border-bottom: 2px solid var(--on-primary); }
.nx-ribbon-track { display: flex; width: max-content; animation: nxMarquee 26s linear infinite; }
.nx-ribbon-item { display: flex; align-items: center; gap: 8px; white-space: nowrap; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: var(--on-primary); padding: 8px 28px 8px 0; text-shadow: 0 1px 2px rgba(0,0,0,0.45); }
.nx-ribbon-item svg { color: var(--on-primary); flex-shrink: 0; }

/* ---------- HERO ---------- */
.nx-hero { position: relative; min-height: 92vh; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; padding: 80px 20px 40px; }
.nx-hexfield { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
.nx-hero-scan { position: absolute; inset: 0; z-index: 1; pointer-events: none; background: linear-gradient(180deg, transparent 0%, rgba(11,128,244,0.05) 50%, transparent 100%); background-size: 100% 6px; opacity: 0.5; mix-blend-mode: screen; }
.nx-hero::before { content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none; background: radial-gradient(ellipse 60% 50% at 50% 40%, rgba(3,10,20,0) 0%, rgba(3,10,20,0.9) 100%); }
.nx-hero-content { position: relative; z-index: 2; max-width: 780px; text-align: center; }
.nx-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; color: var(--cyan); border: 1px solid rgba(11,128,244,0.18); border-radius: 999px; padding: 6px 16px; background: rgba(11,128,244,0.06); margin-bottom: 26px; opacity: 0; transform: translateY(8px); }
.nx-eyebrow-dot { color: var(--magenta); animation: nxBlink 1.6s ease-in-out infinite; }
.is-revealed .nx-eyebrow { animation: nxFadeUp 0.6s 0.15s ease forwards; }
.nx-hero-title { font-size: clamp(26px, 7vw, 68px); font-weight: 900; line-height: 1.08; margin: 0 0 40px; display: flex; flex-direction: column; align-items: center; gap: 2px; letter-spacing: -0.01em; }
.nx-title-line { display: inline-block; opacity: 0; max-width: 100%; background: linear-gradient(135deg, var(--primary) 0%, var(--primary) 55%, var(--primary) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 46px rgba(11,128,244,0.25); }
.is-revealed .nx-title-slam-left { animation: nxSlamLeft 0.75s 0.25s cubic-bezier(.2,.9,.25,1.1) forwards; }
.is-revealed .nx-title-slam-right { animation: nxSlamRight 0.75s 0.4s cubic-bezier(.2,.9,.25,1.1) forwards; }
.nx-hero-cta { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-top: 30px; opacity: 0; transform: translateY(8px); }
.is-revealed .nx-hero-cta { animation: nxFadeUp 0.6s 0.82s ease forwards; }
.nx-btn { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.02em; padding: 13px 26px; border-radius: 8px; border: 1px solid transparent; transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; white-space: nowrap; }
.nx-btn:active { transform: scale(0.97); }
.nx-btn-primary { background: linear-gradient(135deg, var(--primary), var(--primary)); color: var(--on-primary); box-shadow: 0 0 0 1px rgba(11,128,244,0.4), 0 10px 30px -8px rgba(11,128,244,0.55); }
.nx-btn-primary:hover { box-shadow: 0 0 0 1px rgba(11,128,244,0.6), 0 14px 34px -6px rgba(11,128,244,0.7); }
.nx-btn-ghost { background: rgba(11,128,244,0.06); color: var(--text); border-color: var(--line); }
.nx-btn-ghost:hover { border-color: rgba(11,128,244,0.5); color: var(--cyan); }
.nx-hero-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-width: 560px; margin: 0 auto; opacity: 0; transform: translateY(8px); }
.is-revealed .nx-hero-stats { animation: nxFadeUp 0.6s 0.95s ease forwards; }
.nx-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.nx-stat-num { font-family: 'Montserrat', sans-serif; font-size: 26px; font-weight: 800; color: var(--text); }
.nx-stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; text-align: center; }
.nx-scroll-cue { position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%); z-index: 2; color: var(--muted); animation: nxBob 1.8s ease-in-out infinite; }

/* ---------- SECTION HEADS ---------- */
.nx-section-head { text-align: center; margin-bottom: 36px; }
.nx-section-eyebrow { display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; color: var(--magenta); text-transform: uppercase; margin-bottom: 10px; }
.nx-section-head h1, .nx-section-head h2 { font-size: clamp(26px, 4vw, 38px); }
.nx-section-desc { color: var(--muted); margin-top: 12px; font-size: 15px; max-width: 520px; margin-left: auto; margin-right: auto; text-align: center; }

/* ---------- GENERIC PAGE ---------- */
.nx-page { position: relative; min-height: 70vh; padding: 60px 20px 90px; }
.nx-page-inner { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; }

/* ---------- CTA BAND ---------- */
.nx-cta-band { position: relative; margin-top: 40px; padding: 70px 24px; overflow: hidden; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.nx-cta-band-inner { position: relative; z-index: 2; max-width: 560px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.nx-cta-icon { color: var(--primary); filter: drop-shadow(0 0 12px rgba(11,128,244,0.3)); }

/* ---------- CHIP ---------- */
.nx-chip { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--muted); background: var(--bg-panel); border: 1px solid var(--line); border-radius: 999px; padding: 8px 14px; transition: all 0.15s; }

/* ---------- FORM ---------- */
.nx-form { max-width: 600px; margin: 40px auto 0; display: flex; flex-direction: column; gap: 24px; background: var(--bg-panel); padding: 32px; border-radius: var(--radius); border: 1px solid var(--line); }
.nx-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 600px) { .nx-form-grid { grid-template-columns: 1fr; } }
.nx-form-group { display: flex; flex-direction: column; gap: 8px; }
.nx-form-group label { font-size: 13px; font-weight: 700; color: var(--muted); letter-spacing: 0.05em; text-transform: uppercase; }
.nx-input { background: var(--bg-void); border: 1px solid var(--line); border-radius: 8px; padding: 12px 16px; color: var(--text); font-family: inherit; font-size: 15px; transition: border-color 0.2s; outline: none; width: 100%; }
.nx-input:focus { border-color: var(--cyan); box-shadow: 0 0 0 1px rgba(11,128,244,0.4); }
.nx-input::placeholder { color: rgba(122,138,174,0.4); }
.nx-form-divider { display: flex; align-items: center; text-align: center; color: var(--muted); font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin: 10px 0; }
.nx-form-divider::before, .nx-form-divider::after { content: ''; flex: 1; border-bottom: 1px dashed var(--line); }
.nx-form-divider::before { margin-right: 14px; }
.nx-form-divider::after { margin-left: 14px; }
.nx-form-action { margin-top: 10px; display: flex; justify-content: flex-end; }

/* ---------- PLAYERS TABLE ---------- */
.nx-players-table-wrap { margin-top: 30px; overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--line); background: var(--bg-panel); }
.nx-players-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.nx-players-table thead { background: var(--bg-panel-2); }
.nx-players-table th { padding: 14px 16px; text-align: left; font-weight: 600; color: var(--primary); font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--line); }
.nx-players-table td { padding: 12px 16px; border-bottom: 1px solid var(--line); color: var(--text); }
.nx-players-table tbody tr:last-child td { border-bottom: none; }
.nx-players-table tbody tr:hover { background: rgba(11, 128, 244, 0.06); }

/* ---------- BRACKET ---------- */
.nx-bracket-info { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-top: 30px; }
.nx-bracket-container { display: flex; gap: 20px; overflow-x: auto; padding: 40px 0; align-items: flex-start; justify-content: center; }
.nx-bracket-round { min-width: 200px; flex-shrink: 0; }
.nx-bracket-round-label { text-align: center; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); margin-bottom: 16px; padding: 8px 12px; background: var(--bg-panel-2); border-radius: var(--radius); border: 1px solid var(--line); }
.nx-bracket-matches { display: flex; flex-direction: column; gap: 12px; }
.nx-bracket-match { background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
.nx-bracket-team { padding: 8px 10px; border-radius: 6px; background: var(--bg-panel-2); }
.nx-bracket-team.is-bye { opacity: 0.4; border: 1px dashed var(--line); background: transparent; }
.nx-bracket-team-name { font-size: 13px; font-weight: 600; color: var(--text); }
.nx-bracket-vs { text-align: center; font-size: 10px; font-weight: 700; color: var(--primary); padding: 2px 0; }
.nx-bracket-teams-detail { margin-top: 50px; padding-top: 30px; border-top: 1px solid var(--line); text-align: center; }
.nx-bracket-teams-grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; max-width: 1200px; margin: 0 auto; }
.nx-bracket-team-card { background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; width: 180px; }
.nx-bracket-team-card.is-active { border-color: var(--primary); box-shadow: 0 0 12px rgba(11, 128, 244, 0.3); }
.nx-bracket-team-card-head { background: var(--bg-panel-2); padding: 10px 14px; font-size: 13px; font-weight: 700; color: var(--primary); border-bottom: 1px solid var(--line); text-align: center; }
.nx-bracket-team-members { list-style: none; padding: 10px 14px; margin: 0; text-align: center; }
.nx-bracket-team-members li { padding: 5px 0; font-size: 13px; color: var(--text); border-bottom: 1px solid rgba(255,255,255,0.05); }
.nx-bracket-team-members li:last-child { border-bottom: none; }
.nx-bracket-slot-empty { color: var(--muted); font-style: italic; opacity: 0.6; }

/* ---------- SPIN WHEEL ---------- */
.nx-spin-layout { display: flex; gap: 30px; margin-top: 40px; align-items: flex-start; }
.nx-spin-layout.is-viewer { justify-content: center; }
.nx-spin-layout.is-viewer .nx-spin-teams { flex: none; width: 100%; }
.nx-spin-section { flex: 0 0 400px; padding: 30px 20px; background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--radius); }
.nx-spin-teams { flex: 1; min-width: 0; }
@media (max-width: 800px) {
  .nx-spin-layout { flex-direction: column; }
  .nx-spin-section { flex: none; width: 100%; }
}
.nx-spin-wheel-wrap { display: flex; justify-content: center; margin-bottom: 24px; }
.nx-spin-canvas { border-radius: 50%; box-shadow: 0 0 30px rgba(11, 128, 244, 0.2); }
.nx-spin-controls { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.nx-spin-result { text-align: center; padding: 16px; background: var(--bg-panel-2); border-radius: var(--radius); border: 1px solid var(--line); }

/* ---------- BRACKET DRAW ---------- */
.nx-draw-section { margin-top: 50px; border-top: 1px solid var(--line); padding-top: 30px; }
.nx-draw-header { text-align: center; margin-bottom: 24px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.nx-draw-header h3 { margin: 0; }
.nx-draw-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-bottom: 24px; padding: 20px; background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--radius); min-height: 80px; transition: border-color 0.3s; }
.nx-draw-grid.is-shuffling { border-color: var(--primary); box-shadow: 0 0 16px rgba(11,128,244,0.15); }
.nx-draw-team-card { display: flex; align-items: center; gap: 10px; padding: 12px 18px; background: var(--bg-panel-2); border: 1px solid var(--line); border-radius: 8px; transition: all 0.15s; }
.nx-draw-team-card.is-final { border-color: rgba(0,255,163,0.4); animation: nxDrawPop 0.4s ease forwards; }
.nx-draw-team-seed { font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 800; color: var(--primary); min-width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; background: rgba(11,128,244,0.1); border-radius: 50%; }
.nx-draw-team-name { font-size: 14px; font-weight: 600; color: var(--text); white-space: nowrap; }
.nx-draw-team-card.is-bye-card { border-color: rgba(0,255,163,0.3); background: rgba(0,255,163,0.04); }
.nx-draw-bye-badge { font-size: 9px; font-weight: 800; color: #00FFA3; background: rgba(0,255,163,0.15); padding: 2px 6px; border-radius: 4px; letter-spacing: 0.05em; }
.nx-draw-results { margin-bottom: 24px; padding: 20px; background: var(--bg-panel); border: 1px solid rgba(0,255,163,0.2); border-radius: var(--radius); animation: nxFadeUp 0.5s ease forwards; }
.nx-draw-pairs { display: flex; flex-direction: column; gap: 12px; }
.nx-draw-pair { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--bg-panel-2); border-radius: 8px; border: 1px solid var(--line); }
.nx-draw-pair-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--primary); min-width: 55px; }
.nx-draw-pair-teams { display: flex; align-items: center; gap: 10px; flex: 1; justify-content: center; }
.nx-draw-pair-team { font-size: 14px; font-weight: 600; color: var(--text); }
.nx-draw-pair-vs { font-size: 11px; font-weight: 800; color: var(--primary); padding: 3px 8px; background: rgba(11,128,244,0.1); border-radius: 4px; }
.nx-draw-controls { text-align: center; margin-top: 20px; }
@keyframes nxDrawPop { from { transform: scale(0.95); opacity: 0.7; } to { transform: scale(1); opacity: 1; } }
@media (max-width: 500px) {
  .nx-draw-grid { padding: 14px; gap: 8px; }
  .nx-draw-team-card { padding: 10px 12px; }
  .nx-draw-team-name { font-size: 12px; }
  .nx-draw-pair { flex-direction: column; gap: 6px; align-items: flex-start; }
  .nx-draw-pair-teams { width: 100%; }
}

/* ---------- TOURNAMENT BRACKET ---------- */
.nx-tourney { margin-top: 40px; overflow-x: auto; padding-bottom: 20px; }
.nx-tourney-header { display: flex; gap: 0; margin-bottom: 16px; padding: 0 10px; }
.nx-tourney-round-label { text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--primary); padding: 10px 8px; background: var(--bg-panel-2); border: 1px solid var(--line); border-radius: var(--radius); margin: 0 16px; display: flex; align-items: center; justify-content: center; gap: 6px; flex: 1; min-width: 0; }
.nx-tourney-champ-label { flex: 0.6; }
.nx-tourney-bracket { display: flex; align-items: stretch; padding: 0 10px; }
.nx-tourney-round { display: flex; flex-direction: column; justify-content: space-around; flex: 1; min-width: 170px; padding: 0 4px; }
.nx-tourney-match-wrapper { display: flex; align-items: center; flex: 1; position: relative; }
.nx-tourney-match { flex: 1; background: var(--bg-panel); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
.nx-tourney-match.is-bye-match { opacity: 0.5; border-style: dashed; }
.nx-tourney-slot { display: flex; align-items: center; gap: 6px; padding: 10px 12px; transition: background 0.15s; }
.nx-tourney-slot-top { border-bottom: 1px solid var(--line); }
.nx-tourney-slot:hover { background: rgba(11,128,244,0.05); }
.nx-tourney-slot.is-bye { opacity: 0.4; }
.nx-tourney-slot.is-winner { background: rgba(0,255,163,0.06); }
.nx-tourney-slot.is-winner .nx-tourney-name { color: #00FFA3; }
.nx-tourney-slot.is-winner .nx-tourney-score { color: #00FFA3; }
.nx-tourney-seed { font-size: 10px; font-weight: 700; color: var(--muted); min-width: 16px; text-align: center; }
.nx-tourney-name { flex: 1; font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nx-tourney-score { font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 800; color: var(--muted); min-width: 20px; text-align: center; }

/* Connector arm from match to next round */
.nx-tourney-arm-right { width: 28px; flex-shrink: 0; position: relative; }
.nx-tourney-arm-right::before { content: ""; position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: var(--line); }

/* Vertical connectors for bracket tree lines */
.nx-tourney-round:not(:first-child) .nx-tourney-match-wrapper::before { content: ""; position: absolute; left: -4px; top: 0; bottom: 50%; width: 2px; background: var(--line); }
.nx-tourney-round:not(:first-child) .nx-tourney-match-wrapper::after { content: ""; position: absolute; left: -4px; top: 50%; bottom: 0; width: 2px; background: var(--line); }
.nx-tourney-round:not(:first-child) .nx-tourney-match-wrapper:first-child::before { display: none; }
.nx-tourney-round:not(:first-child) .nx-tourney-match-wrapper:last-child::after { display: none; }
/* Horizontal arm entering match from left connector */
.nx-tourney-round:not(:first-child) .nx-tourney-match-wrapper .nx-tourney-match::before { content: ""; position: absolute; left: -32px; top: 50%; width: 28px; height: 2px; background: var(--line); z-index: 1; }

.nx-tourney-champion-round { min-width: 120px; max-width: 140px; flex: 0.6; padding: 0 4px; }
.nx-tourney-champion { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px 14px; background: linear-gradient(135deg, rgba(255,201,60,0.08), rgba(255,201,60,0.02)); border: 2px solid rgba(255,201,60,0.3); border-radius: var(--radius); height: 100%; min-height: 80px; }
.nx-tourney-champion-text { font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 800; color: #FFC93C; }

/* Clickable matches */
.nx-tourney-match.is-clickable { cursor: pointer; border-color: var(--primary); }
.nx-tourney-match.is-clickable:hover { box-shadow: 0 0 12px rgba(11,128,244,0.3); transform: translateY(-1px); }
.nx-tourney-match.is-done { border-color: rgba(0,255,163,0.3); }

/* Score Input Modal */
.nx-tourney-modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
.nx-tourney-modal { background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 28px; max-width: 520px; width: 100%; position: relative; animation: nxFadeUp 0.25s ease; }
.nx-tourney-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.nx-tourney-modal-header h4 { font-size: 16px; color: var(--primary); margin: 0; }
.nx-tourney-modal-close { background: none; border: none; color: var(--muted); cursor: pointer; padding: 6px; border-radius: 6px; transition: all 0.15s; }
.nx-tourney-modal-close:hover { color: var(--text); background: rgba(255,255,255,0.08); }
.nx-tourney-modal-scoreboard { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 20px; background: var(--bg-panel-2); border-radius: 10px; margin-bottom: 20px; border: 1px solid var(--line); }
.nx-tourney-modal-team { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.nx-tourney-modal-team.is-winner .nx-tourney-modal-name { color: #00FFA3; }
.nx-tourney-modal-team.is-winner .nx-tourney-modal-score { color: #00FFA3; text-shadow: 0 0 12px rgba(0,255,163,0.4); }
.nx-tourney-modal-name { font-size: 14px; font-weight: 700; color: var(--text); text-align: center; }
.nx-tourney-modal-score { font-family: 'Montserrat', sans-serif; font-size: 32px; font-weight: 900; color: var(--text); }
.nx-tourney-modal-vs { font-size: 13px; font-weight: 800; color: var(--primary); padding: 6px 12px; background: rgba(11,128,244,0.08); border: 1px solid rgba(11,128,244,0.2); border-radius: 6px; }
.nx-tourney-modal-games { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; }
@media (max-width: 400px) { .nx-tourney-modal-games { grid-template-columns: repeat(3, 1fr); } }

@media (max-width: 700px) {
  .nx-tourney-round { min-width: 130px; }
  .nx-tourney-slot { padding: 8px 8px; }
  .nx-tourney-name { font-size: 11px; }
  .nx-tourney-header { flex-wrap: nowrap; }
  .nx-tourney-round-label { font-size: 9px; padding: 8px 4px; min-width: 0; margin: 0 8px; }
  .nx-tourney-arm-right { width: 20px; }
}

/* ---------- LEAGUE (ROUND ROBIN) ---------- */
.nx-league-wrap { max-width: 750px; margin: 30px auto 0; display: flex; flex-direction: column; gap: 30px; }
.nx-league-matches { display: flex; flex-direction: column; gap: 20px; }
.nx-league-match-card { background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; transition: border-color 0.2s; }
.nx-league-match-card.is-finished { border-color: rgba(0,255,163,0.3); }
.nx-league-match-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.nx-league-match-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--primary); }
.nx-league-bo3-badge { font-size: 10px; font-weight: 800; color: var(--text); background: rgba(11,128,244,0.15); border: 1px solid rgba(11,128,244,0.3); padding: 3px 8px; border-radius: 4px; letter-spacing: 0.05em; }
.nx-league-scoreboard { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 16px; padding: 14px 0; background: var(--bg-panel-2); border-radius: 8px; }
.nx-league-score-team { display: flex; align-items: center; gap: 12px; }
.nx-league-score-team.is-winner .nx-league-score-name { color: #00FFA3; }
.nx-league-score-team.is-winner .nx-league-score-num { color: #00FFA3; text-shadow: 0 0 10px rgba(0,255,163,0.4); }
.nx-league-score-name { font-size: 14px; font-weight: 600; color: var(--text); }
.nx-league-score-num { font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 900; color: var(--text); }
.nx-league-score-divider { color: var(--muted); font-size: 18px; }
.nx-league-games { display: flex; gap: 8px; margin-bottom: 14px; }
.nx-league-game { flex: 1; padding: 10px 8px; background: var(--bg-void); border: 1px solid var(--line); border-radius: 8px; display: flex; flex-direction: column; align-items: center; gap: 6px; min-height: 70px; justify-content: center; }
.nx-league-game.is-played { border-color: rgba(0,255,163,0.3); background: rgba(0,255,163,0.03); }
.nx-league-game.is-current { border-color: var(--primary); background: rgba(11,128,244,0.05); box-shadow: 0 0 8px rgba(11,128,244,0.15); }
.nx-league-game.is-skipped { opacity: 0.35; }
.nx-league-game-label { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
.nx-league-game-winner { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: #00FFA3; }
.nx-league-game-skip { color: var(--muted); font-size: 13px; }
.nx-league-game-pending { color: var(--muted); font-size: 11px; font-style: italic; }
.nx-league-game-btns { display: flex; flex-direction: column; gap: 4px; width: 100%; }
.nx-league-game-btn { font-size: 11px; font-weight: 600; padding: 6px 8px; border-radius: 5px; border: 1px solid var(--line); background: var(--bg-panel); color: var(--text); cursor: pointer; transition: all 0.15s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nx-league-game-btn:hover { border-color: var(--primary); background: rgba(11,128,244,0.1); color: var(--primary); }
.nx-league-match-result { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; background: rgba(0,255,163,0.06); border: 1px solid rgba(0,255,163,0.2); border-radius: 8px; font-size: 13px; color: #00FFA3; }
.nx-league-match-score-final { color: var(--muted); font-weight: 600; }
.nx-league-reset-btn { display: block; margin: 12px auto 0; background: none; border: none; font-size: 11px; color: var(--muted); cursor: pointer; text-decoration: underline; opacity: 0.7; transition: opacity 0.15s; }
.nx-league-reset-btn:hover { opacity: 1; color: #FF4D4D; }
.nx-league-standings { background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; }
.nx-league-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.nx-league-table thead { background: var(--bg-panel-2); }
.nx-league-table th { padding: 12px 10px; text-align: center; font-weight: 600; color: var(--primary); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--line); }
.nx-league-table td { padding: 12px 10px; text-align: center; border-bottom: 1px solid var(--line); color: var(--text); }
.nx-league-table tbody tr:last-child td { border-bottom: none; }
.nx-league-table tbody tr:hover { background: rgba(11, 128, 244, 0.06); }
.nx-league-table tbody tr.is-champion { background: rgba(0, 255, 163, 0.06); }
.nx-league-rank { font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 6px; white-space: nowrap; }
.nx-league-rank.rank-1 { color: #FFC93C; background: rgba(255,201,60,0.1); }
.nx-league-rank.rank-2 { color: #C0C0C0; background: rgba(192,192,192,0.1); }
.nx-league-rank.rank-3 { color: #CD7F32; background: rgba(205,127,50,0.1); }
@media (max-width: 500px) {
  .nx-league-games { flex-direction: column; }
  .nx-league-scoreboard { gap: 10px; }
  .nx-league-score-name { font-size: 12px; }
  .nx-league-score-num { font-size: 22px; }
  .nx-league-table th, .nx-league-table td { padding: 10px 6px; font-size: 12px; }
}

/* ---------- ADMIN ---------- */
.nx-admin-toggle { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--line); }
.nx-admin-toggle:last-of-type { border-bottom: none; }
.nx-toggle-btn { position: relative; width: 80px; height: 36px; border-radius: 18px; border: 2px solid var(--line); background: var(--bg-void); cursor: pointer; transition: all 0.25s; display: flex; align-items: center; padding: 0 6px; }
.nx-toggle-btn.is-on { border-color: #00FFA3; background: rgba(0,255,163,0.1); }
.nx-toggle-knob { width: 24px; height: 24px; border-radius: 50%; background: var(--muted); transition: all 0.25s; flex-shrink: 0; }
.nx-toggle-btn.is-on .nx-toggle-knob { background: #00FFA3; transform: translateX(38px); }
.nx-toggle-label { position: absolute; left: 0; right: 0; text-align: center; font-size: 8px; font-weight: 800; letter-spacing: 0.08em; color: var(--muted); pointer-events: none; }
.nx-toggle-btn.is-on .nx-toggle-label { color: #00FFA3; }

/* ---------- FOOTER ---------- */
.nx-footer { border-top: 1px solid var(--line); padding: 22px 24px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--muted); position: relative; z-index: 2; }

/* ---------- KEYFRAMES ---------- */
@keyframes nxFadeUp { to { opacity: 1; transform: translateY(0); } }
@keyframes nxMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes nxSlamLeft { from { opacity: 0; transform: translateX(-70px) rotate(-3deg); } to { opacity: 1; transform: translateX(0) rotate(0); } }
@keyframes nxSlamRight { from { opacity: 0; transform: translateX(70px) rotate(3deg); } to { opacity: 1; transform: translateX(0) rotate(0); } }
@keyframes nxBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
@keyframes nxBob { 0%, 100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 8px); } }
@keyframes nxPulseBadge { 0%, 100% { box-shadow: 0 0 0 0 rgba(11,128,244,0.5); } 50% { box-shadow: 0 0 0 5px rgba(11,128,244,0); } }

@media (prefers-reduced-motion: reduce) {
  .nx-root * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
}
`;
