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
  blok: "Marigold",
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
/*  HEX-GRID CANVAS BACKGROUND (signature element)                    */
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
          hue: Math.random() > 0.5 ? "11,128,244" : "11,128,244",
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
        if (p.y < -20) {
          p.y = h + 20;
          p.x = Math.random() * w;
        }
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

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
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

function Nav({ page, go }) {
  const [open, setOpen] = useState(false);
  const items = [
    { id: "home", label: "Beranda" },
    { id: "bracket", label: "Bagan Turnamen" },
    { id: "schedule", label: "Jadwal & Hasil" },
    { id: "register", label: "Pendaftaran" },
  ];
  return (
    <header className="nx-nav">
      <div className="nx-nav-inner">
        <button className="nx-brand" onClick={() => { go("home"); setOpen(false); }}>
          <span className="nx-brand-mark"><Zap size={18} strokeWidth={2.5} /></span>
          <span className="nx-brand-text">GOLDEN<span className="nx-brand-accent">FLOWER</span></span>
        </button>

        <nav className="nx-nav-links">
          {items.map((it) => (
            <button
              key={it.id}
              className={`nx-nav-link ${page === it.id ? "is-active" : ""}`}
              onClick={() => go(it.id)}
            >
              {it.label}
            </button>
          ))}
        </nav>

        <button className="nx-nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="nx-nav-mobile">
          {items.map((it) => (
            <button
              key={it.id}
              className={`nx-nav-mobile-link ${page === it.id ? "is-active" : ""}`}
              onClick={() => { go(it.id); setOpen(false); }}
            >
              {it.label}
              <ChevronRight size={16} />
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
  const text = `MERDEKA! ${EVENT.tema} \u2014 TURNAMEN E-SPORTS CLUSTER ${EVENT.cluster.toUpperCase()}, BLOK ${EVENT.blok.toUpperCase()} \u2022 MERAH PUTIH BERKIBAR \u2022`;
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
    <>
      <section id="home" className="nx-hero">
        <HexField />
        <div className="nx-hero-scan" aria-hidden="true" />
        <div className={`nx-hero-content ${revealed ? "is-revealed" : ""}`}>
          <div className="nx-eyebrow">
            <Radio size={13} className="nx-eyebrow-dot" />
            TURNAMEN E-SPORTS &middot; {EVENT.tema} &middot; 8 TIM
          </div>

          <h1 className="nx-hero-title">
            <span className="nx-title-line nx-title-slam-left">GOLDEN FLOWER</span>
            <span className="nx-title-line nx-title-slam-right">CLUSTER MARIGOLD</span>
          </h1>

          <p className="nx-hero-sub">
            Delapan tim terbaik dari Blok {EVENT.blok}. Satu bagan eliminasi tunggal. Satu takhta juara,
            digelar dalam semarak {EVENT.tema} menuju Grand Final 2026.
          </p>

          <div className="nx-hero-cta">
            <button className="nx-btn nx-btn-primary" onClick={() => go("bracket")}>
              <Swords size={18} />
              Lihat Bagan Turnamen
            </button>
            <button className="nx-btn nx-btn-ghost" onClick={() => go("schedule")}>
              <Calendar size={18} />
              Jadwal &amp; Hasil
            </button>
          </div>

          <div className="nx-hero-stats">
            <CountStat value={8} label="Tim Bertanding" />
            <CountStat value={7} label="Total Pertandingan" />
            <CountStat value={3} label="Babak Eliminasi" />
            <CountStat value={1} label="Grand Final" />
          </div>
        </div>

        <div className="nx-scroll-cue" aria-hidden="true">
          <ChevronDown size={20} />
        </div>
      </section>

      <section className="nx-teams-strip">
        <div className="nx-section-head">
          <span className="nx-section-eyebrow">Kontestan</span>
          <h2>Delapan Tim, Satu Perebutan Takhta</h2>
        </div>
        <div style={{ padding: "40px 20px", background: "var(--bg-panel)", borderRadius: "var(--radius)", border: "1px dashed var(--line)", textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
          <Users size={42} className="nx-cta-icon" style={{ margin: "0 auto 16px", opacity: 0.5 }} />
          <h3 style={{ marginBottom: "10px", fontSize: "20px" }}>Slot Peserta Belum Penuh</h3>
          <p className="nx-section-desc" style={{ maxWidth: "480px", margin: "0 auto" }}>Daftar tim yang bertanding akan ditampilkan di sini setelah seluruh slot terisi dan divalidasi oleh panitia.</p>
        </div>
      </section>

      <section className="nx-cta-band">
        <HexField dense />
        <div className="nx-cta-band-inner">
          <Swords size={30} className="nx-cta-icon" />
          <h3>Pendaftaran Segera Ditutup.</h3>
          <p>Persiapkan tim Anda untuk pertempuran e-sports terbesar di Cluster Golden Flower.</p>
          <button className="nx-btn nx-btn-primary" onClick={() => go("register")}>
            Daftar Sekarang <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  BRACKET                                                            */
/* ------------------------------------------------------------------ */

function MatchCard({ m, highlight }) {
  const A = team(m.a);
  const B = team(m.b);
  const winner = winnerOf(m);
  const meta = STATUS_META[m.status];

  const Side = ({ t, score, isWinner }) => (
    <div className={`nx-mc-side ${isWinner ? "is-winner" : ""} ${m.status !== "done" ? "is-pending" : ""}`}>
      <span className="nx-mc-dot" style={{ background: t.color }} />
      <span className="nx-mc-tag">{t.tag}</span>
      <span className="nx-mc-name">{t.name}</span>
      <span className="nx-mc-score">{score !== null ? score : "&mdash;"}</span>
      {isWinner && <Crown size={13} className="nx-mc-crown" />}
    </div>
  );

  return (
    <div className={`nx-matchcard ${highlight ? "nx-matchcard-final" : ""}`}>
      <div className="nx-mc-head">
        <span>{m.label}</span>
        <span className={`nx-badge ${meta.cls}`}>{meta.label}</span>
      </div>
      <Side t={A} score={m.status === "done" ? m.scoreA : null} isWinner={winner === m.a} />
      <Side t={B} score={m.status === "done" ? m.scoreB : null} isWinner={winner === m.b} />
      <div className="nx-mc-foot">
        <Clock size={12} /> {m.date} &middot; {m.time}
      </div>
    </div>
  );
}

function Bracket({ go }) {
  const qf = MATCHES.filter((m) => m.round === "QF");
  const sf = MATCHES.filter((m) => m.round === "SF");
  const gf = MATCHES.find((m) => m.round === "GF");
  const champion = winnerOf(gf);

  return (
    <section id="bracket" className="nx-page">
      <HexField dense />
      <div className="nx-page-inner" style={{ textAlign: "center", paddingTop: "60px" }}>
        <div className="nx-section-head">
          <span className="nx-section-eyebrow">Format Eliminasi Tunggal</span>
          <h1>Bagan Turnamen</h1>
        </div>
        
        <div style={{ padding: "60px 20px", background: "var(--bg-panel)", borderRadius: "var(--radius)", border: "1px dashed var(--line)", marginTop: "40px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
          <Lock size={48} className="nx-cta-icon" style={{ margin: "0 auto 20px", opacity: 0.5 }} />
          <h2 style={{ marginBottom: "10px" }}>Segera Hadir</h2>
          <p className="nx-section-desc">Bagan turnamen akan diundi dan diumumkan setelah periode pendaftaran ditutup.</p>
          <button className="nx-btn nx-btn-primary" style={{ marginTop: "30px" }} onClick={() => go("register")}>
            Daftarkan Tim Anda Sekarang <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  SCHEDULE                                                           */
/* ------------------------------------------------------------------ */

function Schedule() {
  const [filter, setFilter] = useState("all");

  const filtered = MATCHES.filter(
    (m) => filter === "all" || m.a === filter || m.b === filter
  );

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
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "30px" }}>
            <span className="nx-chip"><Calendar size={14} /> Pengumuman: 20 Jul 2026</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  REGISTER                                                          */
/* ------------------------------------------------------------------ */

function Register() {
  const [status, setStatus] = useState("idle");
  const [pic, setPic] = useState("");
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([
    { id: 1, nickname: "", gameId: "", server: "" },
    { id: 2, nickname: "", gameId: "", server: "" },
    { id: 3, nickname: "", gameId: "", server: "" },
    { id: 4, nickname: "", gameId: "", server: "" },
    { id: 5, nickname: "", gameId: "", server: "" },
  ]);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const addMember = () => {
    const newId = Math.max(...members.map(m => m.id), 0) + 1;
    setMembers([...members, { id: newId, nickname: "", gameId: "", server: "" }]);
  };

  const removeMember = (index) => {
    if (members.length > 5) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validasi Nama PIC
    if (!pic.trim()) {
      alert("❌ Form tidak lengkap!\n\nBagian yang harus diisi:\n- Nama PIC (Penanggung Jawab) wajib diisi");
      document.getElementById("picInput")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Validasi Nama Tim
    if (!teamName.trim()) {
      alert("❌ Form tidak lengkap!\n\nBagian yang harus diisi:\n- Nama Tim wajib diisi");
      document.getElementById("teamInput")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Validasi Anggota Tim
    let emptyMemberFields = [];
    members.forEach((member, index) => {
      if (!member.nickname.trim()) {
        emptyMemberFields.push(`Anggota ${index + 1}: Nickname Game`);
      }
      if (!member.gameId.toString().trim()) {
        emptyMemberFields.push(`Anggota ${index + 1}: ID Game`);
      }
      if (!member.server.toString().trim()) {
        emptyMemberFields.push(`Anggota ${index + 1}: Server Game`);
      }
    });

    if (emptyMemberFields.length > 0) {
      const fieldList = emptyMemberFields.slice(0, 5).join("\n");
      const moreText = emptyMemberFields.length > 5 ? `\n... dan ${emptyMemberFields.length - 5} field lainnya` : "";
      alert(`❌ Form tidak lengkap!\n\nBagian yang harus diisi:\n${fieldList}${moreText}`);
      document.getElementById("membersSection")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Validasi Syarat & Ketentuan
    if (!agreeTerms) {
      alert("❌ Form tidak lengkap!\n\nBagian yang harus diisi:\n- Checkbox \"Saya telah membaca dan menyetujui semua syarat dan ketentuan di atas\" wajib dicentang");
      document.getElementById("termsSection")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setStatus("submitting");
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        alert(`✅ PENDAFTARAN BERHASIL!\n\nTim: ${teamName}\nPIC: ${pic}\n\nTerima kasih telah mendaftar di Turnamen E-Sports Cluster Golden Flower. Kami akan menghubungi Anda segera dengan detail lebih lanjut.`);
      }, 500);
    }, 1500);
  };

  if (status === "success") {
    return (
      <section id="register" className="nx-page">
        <HexField dense />
        <div className="nx-page-inner" style={{ textAlign: "center", paddingTop: "80px" }}>
          <Trophy size={48} className="nx-cta-icon" style={{ margin: "0 auto 20px" }} />
          <h2>Pendaftaran Berhasil!</h2>
          <p className="nx-section-desc">Tim <strong>{teamName}</strong> telah terdaftar dalam Turnamen E-Sports Cluster Golden Flower.</p>
          <button className="nx-btn nx-btn-primary" style={{ marginTop: "30px" }} onClick={() => {
            setStatus("idle");
            setPic("");
            setTeamName("");
            setMembers([
              { id: 1, nickname: "", gameId: "", server: "" },
              { id: 2, nickname: "", gameId: "", server: "" },
              { id: 3, nickname: "", gameId: "", server: "" },
              { id: 4, nickname: "", gameId: "", server: "" },
              { id: 5, nickname: "", gameId: "", server: "" },
            ]);
            setAgreeTerms(false);
          }}>
            Daftar Tim Lain
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="register" className="nx-page">
      <HexField dense />
      <div className="nx-page-inner">
        <div className="nx-section-head">
          <span className="nx-section-eyebrow">Pendaftaran Tim</span>
          <h1>Daftarkan Tim Anda</h1>
          <p className="nx-section-desc">Isi formulir di bawah ini untuk berpartisipasi dalam perebutan takhta juara.</p>
        </div>

        <form className="nx-form" onSubmit={handleSubmit}>
          <div className="nx-form-divider">Data Penanggung Jawab</div>
          
          <div className="nx-form-group">
            <label>Nama PIC (Penanggung Jawab)</label>
            <input 
              id="picInput"
              required 
              type="text" 
              className="nx-input" 
              placeholder="Masukkan nama lengkap PIC"
              value={pic}
              onChange={(e) => setPic(e.target.value)}
            />
          </div>

          <div className="nx-form-divider">Data Tim</div>

          <div className="nx-form-group">
            <label>Nama Tim</label>
            <input 
              id="teamInput"
              required 
              type="text" 
              className="nx-input" 
              placeholder="Misal: Crimson Wolves"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>

          <div className="nx-form-divider">Data Anggota Tim</div>
          
          <div id="membersSection" style={{ marginBottom: "20px" }}>
            {members.map((member, index) => (
              <div key={member.id} style={{ marginBottom: "16px", padding: "16px", background: "var(--bg-panel)", borderRadius: "8px", border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Anggota {index + 1}</span>
                  {members.length > 5 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: "0" }}
                      title="Hapus anggota"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="nx-form-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  <div className="nx-form-group">
                    <label>Nickname Game</label>
                    <input 
                      required 
                      type="text" 
                      className="nx-input" 
                      placeholder="Masukkan nickname game"
                      value={member.nickname}
                      onChange={(e) => handleMemberChange(index, "nickname", e.target.value)}
                    />
                  </div>
                  <div className="nx-form-group">
                    <label>ID Game</label>
                    <input 
                      required 
                      type="number" 
                      className="nx-input" 
                      placeholder="Masukkan ID game"
                      value={member.gameId}
                      onChange={(e) => handleMemberChange(index, "gameId", e.target.value)}
                    />
                  </div>
                  <div className="nx-form-group">
                    <label>Server Game</label>
                    <input 
                      required 
                      type="number" 
                      className="nx-input" 
                      placeholder="Masukkan nomor server"
                      value={member.server}
                      onChange={(e) => handleMemberChange(index, "server", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addMember}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              padding: "12px 16px",
              background: "rgba(11,128,244,0.08)",
              border: "1px dashed rgba(11,128,244,0.35)",
              borderRadius: "8px",
              color: "var(--primary)",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "24px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(11,128,244,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(11,128,244,0.08)";
            }}
          >
            <Plus size={16} />
            Tambah Anggota
          </button>

          <div className="nx-form-divider">Syarat &amp; Ketentuan</div>

          <div id="termsSection" style={{ 
            padding: "16px", 
            background: "var(--bg-panel)", 
            borderRadius: "8px", 
            border: "1px solid var(--line)",
            marginBottom: "20px",
            maxHeight: "250px",
            overflowY: "auto",
            fontSize: "13px",
            lineHeight: "1.6",
            color: "var(--muted)"
          }}>
            <h4 style={{ marginTop: "0", marginBottom: "10px", color: "var(--text)", fontSize: "14px", fontWeight: "700" }}>Syarat dan Ketentuan Mengikuti Turnamen</h4>
            <ul style={{ marginLeft: "20px", marginBottom: "10px" }}>
              <li style={{ marginBottom: "8px" }}>Peserta harus berusia minimal 18 tahun atau mendapat izin dari orang tua/wali.</li>
              <li style={{ marginBottom: "8px" }}>Setiap tim terdiri dari minimum 5 (lima) anggota yang telah terdaftar.</li>
              <li style={{ marginBottom: "8px" }}>Peserta harus memiliki akun game yang valid dan verifikasi dari panitia.</li>
              <li style={{ marginBottom: "8px" }}>Peserta wajib mematuhi peraturan turnamen yang telah ditentukan oleh panitia.</li>
              <li style={{ marginBottom: "8px" }}>Peserta tidak diperbolehkan menggunakan cheat, hack, atau modifikasi game ilegal.</li>
              <li style={{ marginBottom: "8px" }}>Pelanggaran akan mengakibatkan diskualifikasi tanpa pengembalian biaya pendaftaran.</li>
              <li style={{ marginBottom: "8px" }}>Panitia berhak mengubah jadwal, format, atau peraturan jika diperlukan dengan pemberitahuan sebelumnya.</li>
              <li style={{ marginBottom: "8px" }}>Dengan mendaftar, peserta setuju untuk mengizinkan penggunaan foto/video untuk keperluan dokumentasi turnamen.</li>
              <li style={{ marginBottom: "8px" }}>Keputusan panitia bersifat final dan tidak dapat digugat.</li>
            </ul>
          </div>

          <div className="nx-form-group" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <input 
              type="checkbox" 
              id="agreeTerms"
              required
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              style={{ width: "20px", height: "20px", cursor: "pointer" }}
            />
            <label htmlFor="agreeTerms" style={{ margin: "0", fontSize: "13px", color: "var(--text)", cursor: "pointer", fontWeight: "500" }}>
              Saya telah membaca dan menyetujui semua syarat dan ketentuan di atas
            </label>
          </div>

          <div className="nx-form-action">
            <button type="submit" className="nx-btn nx-btn-primary" disabled={status === "submitting" || !agreeTerms}>
              {status === "submitting" ? "Mengirim..." : "Kirim Pendaftaran"}
              <ChevronRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  APP SHELL                                                          */
/* ------------------------------------------------------------------ */

export default function NexusClashApp() {
  const [page, setPage] = useState("home");

  const go = useCallback((p) => {
    setPage(p);
    const target = document.getElementById(p);
    if (target && p !== "register") {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="nx-root">
      <style>{CSS}</style>
      <Nav page={page} go={go} />
      <ClusterRibbon />
      {page === "register" ? (
        <Register />
      ) : (
        <>
          <Home go={go} />
          <Bracket go={go} />
          <Schedule />
        </>
      )}
      <footer className="nx-footer">
        <span>GOLDEN FLOWER CLUSTER MARIGOLD &copy; 2026</span>
        <span>Dipersembahkan oleh Warga Cluster {EVENT.cluster} &middot; Blok {EVENT.blok} &mdash; dalam rangka {EVENT.tema}</span>
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
  --gold: var(--on-primary);
  --merah: var(--primary);
  --putih: var(--on-primary);
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

html, body, #root {
  min-height: 100%;
  background: var(--bg-void);
}
.nx-root * { box-sizing: border-box; }
.nx-root h1, .nx-root h2, .nx-root h3 { font-family: 'Montserrat', sans-serif; margin: 0; letter-spacing: 0.02em; }
.nx-root p { margin: 0; }
.nx-root button { font-family: inherit; cursor: pointer; }
.nx-hero, .nx-page { scroll-margin-top: 110px; }

/* ---------- NAV ---------- */
.nx-nav {
  position: sticky; top: 0; z-index: 50;
  background: rgba(3,10,20,0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.nx-nav-inner {
  max-width: 1180px; margin: 0 auto; padding: 14px 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.nx-brand { display: flex; align-items: center; gap: 8px; background: none; border: none; padding: 0; }
.nx-brand-mark {
  width: 32px; height: 32px; display: grid; place-items: center;
  background: linear-gradient(145deg, rgba(11,128,244,0.12), rgba(11,128,244,0.08));
  border: 1px solid rgba(11,128,244,0.4); border-radius: 8px; color: var(--cyan);
}
.nx-brand-text { font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 15px; color: var(--text); letter-spacing: 0.06em; }
.nx-brand-accent { color: var(--magenta); }
.nx-nav-links { display: flex; gap: 6px; }
.nx-nav-link {
  background: none; border: none; color: var(--muted); font-weight: 600; font-size: 15px;
  padding: 8px 14px; border-radius: 6px; position: relative; transition: color 0.2s;
  letter-spacing: 0.02em;
}
.nx-nav-link:hover { color: var(--text); }
.nx-nav-link.is-active { color: var(--cyan); }
.nx-nav-link.is-active::after {
  content: ""; position: absolute; left: 14px; right: 14px; bottom: 2px; height: 2px;
  background: var(--cyan); box-shadow: 0 0 8px var(--cyan); border-radius: 2px;
}
.nx-nav-burger { display: none; background: none; border: none; color: var(--text); }
.nx-nav-mobile { display: none; }

@media (max-width: 760px) {
  .nx-nav-links { display: none; }
  .nx-nav-burger { display: block; }
  .nx-nav-mobile { display: flex; flex-direction: column; border-top: 1px solid var(--line); }
  .nx-nav-mobile-link {
    display: flex; justify-content: space-between; align-items: center;
    background: none; border: none; color: var(--muted); font-weight: 600; font-size: 15px;
    padding: 14px 24px; border-bottom: 1px solid var(--line);
  }
  .nx-nav-mobile-link.is-active { color: var(--cyan); }
}

/* ---------- CLUSTER RIBBON ---------- */
.nx-ribbon {
  position: relative; z-index: 30; overflow: hidden;
  background: linear-gradient(90deg, var(--primary), var(--primary));
  border-top: 2px solid var(--on-primary); border-bottom: 2px solid var(--on-primary);
}
.nx-ribbon-track {
  display: flex; width: max-content; animation: nxMarquee 26s linear infinite;
}
.nx-ribbon-item {
  display: flex; align-items: center; gap: 8px; white-space: nowrap;
  font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
  color: var(--putih); padding: 8px 28px 8px 0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.45);
}
.nx-ribbon-item svg { color: var(--putih); flex-shrink: 0; }

.nx-cluster-badge {
  display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--putih);
  background: linear-gradient(90deg, var(--primary), var(--primary));
  border-radius: 999px; padding: 6px 15px; margin-bottom: 14px;
  box-shadow: 0 6px 18px -6px rgba(2,62,138,0.6);
  opacity: 0; transform: translateY(8px);
}
.is-revealed .nx-cluster-badge { animation: nxFadeUp 0.6s 0.02s ease forwards; }

/* ---------- HERO ---------- */
.nx-hero {
  position: relative; min-height: 92vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; overflow: hidden;
  padding: 80px 20px 40px;
}
.nx-hexfield { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
.nx-hero-scan {
  position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: linear-gradient(180deg, transparent 0%, rgba(11,128,244,0.05) 50%, transparent 100%);
  background-size: 100% 6px; opacity: 0.5; mix-blend-mode: screen;
}
.nx-hero::before {
  content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background: radial-gradient(ellipse 60% 50% at 50% 40%, rgba(3,10,20,0) 0%, rgba(3,10,20,0.9) 100%);
}
.nx-hero-content { position: relative; z-index: 2; max-width: 780px; text-align: center; }

.nx-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 700; letter-spacing: 0.18em; color: var(--cyan);
  border: 1px solid rgba(11,128,244,0.18); border-radius: 999px; padding: 6px 16px;
  background: rgba(11,128,244,0.06); margin-bottom: 26px;
  opacity: 0; transform: translateY(8px);
}
.nx-eyebrow-dot { color: var(--magenta); animation: nxBlink 1.6s ease-in-out infinite; }
.is-revealed .nx-eyebrow { animation: nxFadeUp 0.6s 0.15s ease forwards; }

.nx-hero-title {
  font-size: clamp(26px, 7vw, 68px); font-weight: 900; line-height: 1.08; margin: 0 0 22px;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  letter-spacing: -0.01em;
}
.nx-title-line {
  display: inline-block; opacity: 0; max-width: 100%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary) 55%, var(--primary) 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 0 46px rgba(11,128,244,0.25);
}
.nx-title-line + .nx-title-line {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary) 55%, var(--primary) 100%);
  -webkit-background-clip: text; background-clip: text;
  text-shadow: 0 0 46px rgba(11,128,244,0.25);
}
.is-revealed .nx-title-slam-left { animation: nxSlamLeft 0.75s 0.25s cubic-bezier(.2,.9,.25,1.1) forwards; }
.is-revealed .nx-title-slam-right { animation: nxSlamRight 0.75s 0.4s cubic-bezier(.2,.9,.25,1.1) forwards; }

.nx-hero-sub {
  font-size: 18px; color: var(--muted); line-height: 1.6; max-width: 560px; margin: 0 auto 32px;
  opacity: 0; transform: translateY(8px);
}
.is-revealed .nx-hero-sub { animation: nxFadeUp 0.6s 0.7s ease forwards; }

.nx-hero-cta { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 52px;
  opacity: 0; transform: translateY(8px);
}
.is-revealed .nx-hero-cta { animation: nxFadeUp 0.6s 0.82s ease forwards; }

.nx-btn {
  display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px;
  letter-spacing: 0.02em; padding: 13px 26px; border-radius: 8px; border: 1px solid transparent;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease; white-space: nowrap;
}
.nx-btn:active { transform: scale(0.97); }
.nx-btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary)); color: var(--on-primary);
  box-shadow: 0 0 0 1px rgba(11,128,244,0.4), 0 10px 30px -8px rgba(11,128,244,0.55);
}
.nx-btn-primary:hover { box-shadow: 0 0 0 1px rgba(11,128,244,0.6), 0 14px 34px -6px rgba(11,128,244,0.7); }
.nx-btn-ghost {
  background: rgba(11,128,244,0.06); color: var(--text); border-color: var(--line);
}
.nx-btn-ghost:hover { border-color: rgba(11,128,244,0.5); color: var(--cyan); }

.nx-hero-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-width: 560px; margin: 0 auto;
  opacity: 0; transform: translateY(8px);
}
.is-revealed .nx-hero-stats { animation: nxFadeUp 0.6s 0.95s ease forwards; }
.nx-stat { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.nx-stat-num { font-family: 'Montserrat', sans-serif; font-size: 26px; font-weight: 800; color: var(--text); }
.nx-stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; text-align: center; }

.nx-scroll-cue {
  position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%); z-index: 2;
  color: var(--muted); animation: nxBob 1.8s ease-in-out infinite;
}

/* ---------- TEAMS STRIP ---------- */
.nx-teams-strip { max-width: 1180px; margin: 0 auto; padding: 70px 24px 40px; position: relative; z-index: 2; }
.nx-section-head { text-align: center; margin-bottom: 36px; }
.nx-section-eyebrow {
  display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; color: var(--magenta);
  text-transform: uppercase; margin-bottom: 10px;
}
.nx-section-head h1, .nx-section-head h2 { font-size: clamp(26px, 4vw, 38px); }
.nx-section-desc { color: var(--muted); margin-top: 12px; font-size: 15px; max-width: 520px; margin-left: auto; margin-right: auto; }

.nx-teams-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
.nx-team-chip {
  display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: var(--bg-panel);
  border: 1px solid var(--line); border-radius: var(--radius); position: relative; overflow: hidden;
  animation: nxFadeUp 0.5s ease both; animation-delay: var(--d);
}
.nx-team-chip::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--tc);
}
.nx-team-tag {
  font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 700; border: 1px solid; border-radius: 5px;
  padding: 3px 7px; letter-spacing: 0.05em;
}
.nx-team-name { font-weight: 600; font-size: 15px; }

/* ---------- CTA BAND ---------- */
.nx-cta-band { position: relative; margin-top: 40px; padding: 70px 24px; overflow: hidden; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.nx-cta-band-inner { position: relative; z-index: 2; max-width: 560px; margin: 0 auto; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.nx-cta-icon { color: var(--primary); filter: drop-shadow(0 0 12px rgba(11,128,244,0.3)); }
.nx-cta-band-inner h3 { font-size: clamp(20px, 3vw, 28px); }
.nx-cta-band-inner p { color: var(--muted); margin-bottom: 14px; }

/* ---------- GENERIC PAGE ---------- */
.nx-page { position: relative; min-height: 70vh; padding: 60px 20px 90px; }
.nx-page-inner { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; }

/* ---------- BRACKET ---------- */
.nx-bracket { display: flex; gap: 26px; overflow-x: auto; padding-bottom: 20px; align-items: stretch; }
.nx-bracket-col { flex: 1; min-width: 260px; display: flex; flex-direction: column; }
.nx-bracket-col-head {
  font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.1em;
  color: var(--cyan); text-transform: uppercase; text-align: center; margin-bottom: 16px;
  padding-bottom: 10px; border-bottom: 1px solid var(--line);
}
.nx-bracket-col-matches { display: flex; flex-direction: column; gap: 18px; flex: 1; }
.nx-round-qf { justify-content: space-between; }
.nx-round-sf { justify-content: space-around; padding-top: 46px; }
.nx-round-gf { justify-content: center; padding-top: 46px; gap: 26px; }

.nx-matchcard {
  background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 12px 14px; position: relative; transition: border-color 0.2s;
}
.nx-matchcard:hover { border-color: rgba(11,128,244,0.4); }
.nx-matchcard-final { border-color: rgba(11,128,244,0.35); box-shadow: 0 0 26px -8px rgba(11,128,244,0.15); }
.nx-mc-head { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--muted); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
.nx-mc-side { display: flex; align-items: center; gap: 8px; padding: 7px 0; font-size: 14px; font-weight: 600; }
.nx-mc-side.is-pending { opacity: 0.55; }
.nx-mc-side + .nx-mc-side { border-top: 1px solid var(--line); }
.nx-mc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.nx-mc-tag { font-family: 'Montserrat', sans-serif; font-size: 10px; color: var(--muted); }
.nx-mc-name { flex: 1; }
.nx-mc-score { font-family: 'Montserrat', sans-serif; font-weight: 700; color: var(--muted); }
.nx-mc-side.is-winner .nx-mc-score { color: var(--cyan); }
.nx-mc-side.is-winner .nx-mc-name { color: var(--text); }
.nx-mc-crown { color: var(--primary); }
.nx-mc-foot { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--muted); margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--line); }

.nx-champion-slot {
  display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px;
  border: 1px dashed rgba(11,128,244,0.35); border-radius: var(--radius); color: var(--primary);
  font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 13px; text-align: center;
  background: rgba(11,128,244,0.04);
}

.nx-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.06em; padding: 4px 9px; border-radius: 999px; }
.st-done { color: var(--primary); background: rgba(11,128,244,0.08); border: 1px solid rgba(11,128,244,0.18); }
.st-live { color: var(--primary); background: rgba(11,128,244,0.12); border: 1px solid rgba(11,128,244,0.4); animation: nxPulseBadge 1.4s ease-in-out infinite; }
.st-upcoming { color: var(--primary); background: rgba(11,128,244,0.08); border: 1px solid rgba(11,128,244,0.18); }

.nx-page-cta { margin-top: 30px; text-align: center; }

/* ---------- SCHEDULE ---------- */
.nx-filter-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
.nx-chip {
  display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--muted);
  background: var(--bg-panel); border: 1px solid var(--line); border-radius: 999px; padding: 8px 14px;
  transition: all 0.15s;
}
.nx-chip:hover { color: var(--text); }
.nx-chip.is-active { color: var(--cyan); border-color: rgba(11,128,244,0.5); background: rgba(11,128,244,0.06); }
.nx-chip-dot { width: 7px; height: 7px; border-radius: 50%; }

.nx-schedule-list { display: flex; flex-direction: column; gap: 10px; }
.nx-sched-row {
  display: grid; grid-template-columns: 140px 1fr auto auto; gap: 16px; align-items: center;
  background: var(--bg-panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 18px;
}
.nx-sched-round { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--muted); font-weight: 600; }
.nx-sched-round-tag { font-family: 'Montserrat', sans-serif; font-size: 11px; color: var(--cyan); }
.nx-sched-main { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 14px; }
.nx-sched-team { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; color: var(--muted); }
.nx-sched-team.is-winner { color: var(--text); }
.nx-sched-team-r { justify-content: flex-end; text-align: right; }
.nx-sched-score { display: flex; align-items: center; gap: 8px; font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 16px; }
.nx-sched-vs { font-size: 10px; color: var(--muted); }
.nx-sched-meta { display: flex; flex-direction: column; gap: 3px; font-size: 12px; color: var(--muted); }
.nx-sched-meta span { display: flex; align-items: center; gap: 6px; }

@media (max-width: 900px) {
  .nx-sched-row { grid-template-columns: 1fr; }
  .nx-sched-meta { flex-direction: row; flex-wrap: wrap; gap: 12px; }
}

/* ---------- FORM ---------- */
.nx-form { max-width: 600px; margin: 40px auto 0; display: flex; flex-direction: column; gap: 24px; background: var(--bg-panel); padding: 32px; border-radius: var(--radius); border: 1px solid var(--line); }
.nx-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 600px) { .nx-form-grid { grid-template-columns: 1fr; } }
.nx-form-group { display: flex; flex-direction: column; gap: 8px; }
.nx-form-group label { font-size: 13px; font-weight: 700; color: var(--muted); letter-spacing: 0.05em; text-transform: uppercase; }
.nx-input { background: var(--bg-void); border: 1px solid var(--line); border-radius: 8px; padding: 12px 16px; color: var(--text); font-family: inherit; font-size: 15px; transition: border-color 0.2s; outline: none; width: 100%; }
.nx-input:focus { border-color: var(--cyan); box-shadow: 0 0 0 1px rgba(11,128,244,0.4); }
.nx-input::placeholder { color: rgba(122,138,174,0.4); }
.nx-color-picker { display: flex; align-items: center; gap: 12px; }
.nx-color-input { -webkit-appearance: none; -moz-appearance: none; appearance: none; width: 44px; height: 44px; padding: 0; border: none; border-radius: 8px; cursor: pointer; background: none; }
.nx-color-input::-webkit-color-swatch-wrapper { padding: 0; }
.nx-color-input::-webkit-color-swatch { border: 1px solid var(--line); border-radius: 8px; }
.nx-color-input::-moz-color-swatch { border: 1px solid var(--line); border-radius: 8px; }
.nx-color-hint { font-size: 13px; color: var(--muted); }
.nx-form-divider { display: flex; align-items: center; text-align: center; color: var(--muted); font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin: 10px 0; }
.nx-form-divider::before, .nx-form-divider::after { content: ''; flex: 1; border-bottom: 1px dashed var(--line); }
.nx-form-divider::before { margin-right: 14px; }
.nx-form-divider::after { margin-left: 14px; }
.nx-form-action { margin-top: 10px; display: flex; justify-content: flex-end; }

/* ---------- FOOTER ---------- */
.nx-footer {
  border-top: 1px solid var(--line); padding: 22px 24px; display: flex; justify-content: space-between;
  flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--muted); position: relative; z-index: 2;
}

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
`
