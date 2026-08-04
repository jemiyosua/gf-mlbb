import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Trophy, Users, Calendar, Zap, Crown, ChevronRight, Menu, X,
  Clock, MapPin, Swords, ChevronDown, Radio, Flag, Lock, Plus, Trash2, Check
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA                                                              */
/* ------------------------------------------------------------------ */

const EVENT = {
  cluster: "Golden Flower",
  tema: "HUT RI KE-81",
};

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

function Nav({ page, go, showBracket }) {
  const [open, setOpen] = useState(false);
  const items = [
    { id: "home", label: "Beranda" },
    { id: "bracket", label: "Bagan Turnamen", hidden: !showBracket },
    { id: "schedule", label: "Jadwal & Hasil" },
    { id: "players", label: "Peserta" },
    { id: "register", label: "Pendaftaran" },
  ].filter((it) => !it.hidden);

  return (
    <header className="nx-nav">
      <div className="nx-nav-inner">
        <button className="nx-brand" onClick={() => { go("home"); setOpen(false); }}>
          <span className="nx-brand-mark"><Zap size={18} strokeWidth={2.5} /></span>
          <span className="nx-brand-text">GOLDEN<span className="nx-brand-accent">FLOWER</span></span>
        </button>
        <nav className="nx-nav-links">
          {items.map((it) => (
            <button key={it.id} className={`nx-nav-link ${page === it.id ? "is-active" : ""}`} onClick={() => go(it.id)}>{it.label}</button>
          ))}
        </nav>
        <button className="nx-nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="nx-nav-mobile">
          {items.map((it) => (
            <button key={it.id} className={`nx-nav-mobile-link ${page === it.id ? "is-active" : ""}`} onClick={() => { go(it.id); setOpen(false); }}>
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
/*  BRACKET (with Spin Wheel)                                          */
/* ------------------------------------------------------------------ */

function Bracket({ go }) {
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
          setUnassigned([...result]);
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
      const emptyTeams = [];
      for (let i = 0; i < totalTeams; i++) emptyTeams.push({ id: i + 1, name: `Tim ${i + 1}`, members: [] });
      setTeams(emptyTeams);
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

  const assignToTeam = () => {
    if (!selectedPlayer) return;
    setTeams((prev) => {
      const updated = [...prev];
      let idx = currentTeamIdx;
      for (let i = 0; i < updated.length; i++) {
        const checkIdx = (currentTeamIdx + i) % updated.length;
        if (updated[checkIdx].members.length < TEAM_SIZE) { idx = checkIdx; break; }
      }
      updated[idx] = { ...updated[idx], members: [...updated[idx].members, selectedPlayer] };
      setCurrentTeamIdx((idx + 1) % updated.length);
      return updated;
    });
    setUnassigned((prev) => prev.filter((p) => p.id !== selectedPlayer.id));
    setSelectedPlayer(null);
  };

  const resetSpin = () => {
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
  const allAssigned = unassigned.length === 0 && players.length > 0;
  const filledTeams = teams.filter((t) => t.members.length > 0);
  const bracketSize = filledTeams.length <= 1 ? 2 : Math.pow(2, Math.ceil(Math.log2(filledTeams.length)));

  const generateRounds = () => {
    const rounds = [];
    let currentSlots = bracketSize;
    let roundIndex = 0;
    while (currentSlots >= 2) {
      const matchCount = currentSlots / 2;
      const matches = [];
      for (let i = 0; i < matchCount; i++) {
        if (roundIndex === 0) {
          const teamA = filledTeams[i * 2] || null;
          const teamB = filledTeams[i * 2 + 1] || null;
          matches.push({ teamA, teamB });
        } else { matches.push({ teamA: null, teamB: null }); }
      }
      let roundLabel;
      if (currentSlots === 2) roundLabel = "Grand Final";
      else if (currentSlots === 4) roundLabel = "Semifinal";
      else if (currentSlots === 8) roundLabel = "Perempat Final";
      else roundLabel = `Babak ${roundIndex + 1}`;
      rounds.push({ label: roundLabel, matches });
      currentSlots = currentSlots / 2;
      roundIndex++;
    }
    return rounds;
  };

  return (
    <section id="bracket" className="nx-page">
      <HexField dense />
      <div className="nx-page-inner" style={{ paddingTop: "60px" }}>
        <div className="nx-section-head" style={{ textAlign: "center" }}>
          <span className="nx-section-eyebrow">Format Eliminasi Tunggal</span>
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

            {/* SPIN WHEEL + SUSUNAN TIM (SIDE BY SIDE) */}
            <div className="nx-spin-layout">
              {!allAssigned && (
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
                        <button className="nx-btn nx-btn-primary" onClick={assignToTeam}>Masukkan ke Tim {currentTeamIdx + 1} <ChevronRight size={16} /></button>
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

            {allAssigned && (
              <>
                <div style={{ marginTop: "50px", borderTop: "1px solid var(--line)", paddingTop: "30px" }}>
                  <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Bagan Pertandingan</h3>
                </div>
                <div className="nx-bracket-container">
                  {generateRounds().map((round, rIdx) => (
                    <div className="nx-bracket-round" key={rIdx}>
                      <div className="nx-bracket-round-label">{round.label}</div>
                      <div className="nx-bracket-matches">
                        {round.matches.map((match, mIdx) => (
                          <div className="nx-bracket-match" key={mIdx}>
                            <div className={`nx-bracket-team ${match.teamA ? "" : "is-bye"}`}>
                              <span className="nx-bracket-team-name">{match.teamA ? match.teamA.name : (rIdx === 0 ? "BYE" : "TBD")}</span>
                            </div>
                            <div className="nx-bracket-vs">VS</div>
                            <div className={`nx-bracket-team ${match.teamB ? "" : "is-bye"}`}>
                              <span className="nx-bracket-team-name">{match.teamB ? match.teamB.name : (rIdx === 0 ? "BYE" : "TBD")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
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

function Register() {
  const [status, setStatus] = useState("idle");
  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [nickname, setNickname] = useState("");
  const [gameId, setGameId] = useState("");
  const [server, setServer] = useState("");
  const [clusterRumah, setClusterRumah] = useState("");
  const [blokRumah, setBlokRumah] = useState("");
  const [nomorRumah, setNomorRumah] = useState("");

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
      if (data.errorcode === 0) {
        setStatus("success");
      } else if (data.errorcode === 1) {
        setStatus("idle");
        alert(`❌ ${data.errormessage}`);
      } else {
        setStatus("idle");
        alert(`❌ ${data.responsemessage}`);
      }
    } catch (err) {
      setStatus("idle");
      alert(`❌ Pendaftaran Gagal!\n\n${err.message}\n\nSilakan coba lagi.`);
    }
  };

  if (status === "success") {
    return (
      <section id="register" className="nx-page">
        <HexField dense />
        <div className="nx-page-inner" style={{ textAlign: "center", paddingTop: "80px" }}>
          <Trophy size={48} className="nx-cta-icon" style={{ margin: "0 auto 20px" }} />
          <h2>Pendaftaran Berhasil!</h2>
          <p className="nx-section-desc" style={{ textAlign: "center" }}><strong>{nama}</strong> telah berhasil terdaftar dalam Turnamen E-Sports Cluster Golden Flower.</p>
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
              <option value="Cluster Golden Flower">Cluster Golden Flower</option>
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
/*  APP SHELL                                                          */
/* ------------------------------------------------------------------ */

export default function NexusClashApp() {
  const [page, setPage] = useState("home");
  const [showBracket, setShowBracket] = useState(true);

  const go = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="nx-root">
      <style>{CSS}</style>
      <Nav page={page} go={go} showBracket={showBracket} />
      <ClusterRibbon />
      {page === "register" ? (
        <Register />
      ) : page === "players" ? (
        <Players />
      ) : page === "bracket" ? (
        <Bracket go={go} />
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
.nx-brand-mark { width: 32px; height: 32px; display: grid; place-items: center; background: linear-gradient(145deg, rgba(11,128,244,0.12), rgba(11,128,244,0.08)); border: 1px solid rgba(11,128,244,0.4); border-radius: 8px; color: var(--cyan); }
.nx-brand-text { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 15px; color: var(--text); letter-spacing: 0.06em; }
.nx-brand-accent { color: var(--magenta); }
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
.nx-hero-cta { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 52px; opacity: 0; transform: translateY(8px); }
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
.nx-section-desc { color: var(--muted); margin-top: 12px; font-size: 15px; max-width: 520px; margin-left: auto; margin-right: auto; }

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
.nx-bracket-teams-grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; max-width: 1000px; margin: 0 auto; }
.nx-bracket-team-card { background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; width: 220px; }
.nx-bracket-team-card.is-active { border-color: var(--primary); box-shadow: 0 0 12px rgba(11, 128, 244, 0.3); }
.nx-bracket-team-card-head { background: var(--bg-panel-2); padding: 10px 14px; font-size: 13px; font-weight: 700; color: var(--primary); border-bottom: 1px solid var(--line); text-align: center; }
.nx-bracket-team-members { list-style: none; padding: 10px 14px; margin: 0; text-align: center; }
.nx-bracket-team-members li { padding: 5px 0; font-size: 13px; color: var(--text); border-bottom: 1px solid rgba(255,255,255,0.05); }
.nx-bracket-team-members li:last-child { border-bottom: none; }
.nx-bracket-slot-empty { color: var(--muted); font-style: italic; opacity: 0.6; }

/* ---------- SPIN WHEEL ---------- */
.nx-spin-layout { display: flex; gap: 30px; margin-top: 40px; align-items: flex-start; }
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
