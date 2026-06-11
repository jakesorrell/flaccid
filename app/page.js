'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { store } from "../lib/firebase";

/* ---------------------------------------------------------------------------
   FLACCID — Short Kings vs Tall Guys @ Pine Dunes
   Hole-by-hole gross entry; net auto-calculated by the difference method.
   Shamble 80% per player · Scramble 35/15 team · Best ball + singles full.
   Live shared sync.
--------------------------------------------------------------------------- */

const KEY = "flcd_cup_v4";
const SHARED = true;
const SETUP_PASSWORD = "FLACCID2026!";

// Firebase store is imported from lib/firebase

const C = {
  paper: "#F3F1E9", panel: "#FFFFFF",
  navy: "#233D6B", navyDeep: "#1A2E50", red: "#B23A2E",
  ink: "#1C2536", inkSoft: "#6B7488",
  line: "rgba(28,37,54,0.13)", lineSoft: "rgba(28,37,54,0.07)",
};
const SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const TEE_COLOR = { Blue: "#3B6FB0", White: "#FFFFFF", Red: "#C0392B" };

const COURSE = {
  name: "Pine Dunes Resort & Golf Club", loc: "Frankston, TX · Par 72",
  tees: [
    { name: "Blue", yards: 6537, rating: 74.0, slope: 135 },
    { name: "White", yards: 5819, rating: 70.1, slope: 129 },
    { name: "Red", yards: 5150, rating: 67.4, slope: 122 },
  ],
  holes: [
    { h: 1, par: 4, si: 11 }, { h: 2, par: 4, si: 17 }, { h: 3, par: 3, si: 15 },
    { h: 4, par: 4, si: 1 }, { h: 5, par: 5, si: 9 }, { h: 6, par: 3, si: 3 },
    { h: 7, par: 4, si: 5 }, { h: 8, par: 4, si: 13 }, { h: 9, par: 5, si: 7 },
    { h: 10, par: 4, si: 8 }, { h: 11, par: 5, si: 4 }, { h: 12, par: 3, si: 12 },
    { h: 13, par: 4, si: 10 }, { h: 14, par: 4, si: 6 }, { h: 15, par: 4, si: 16 },
    { h: 16, par: 3, si: 18 }, { h: 17, par: 4, si: 2 }, { h: 18, par: 5, si: 14 },
  ],
};
const PAR = COURSE.holes.map((h) => h.par);
const SI = COURSE.holes.map((h) => h.si);

const uid = () => Math.random().toString(36).slice(2, 9);
const rev = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const mk = (a, b, time) => ({ id: uid(), a, b, time, scores: {} });

function defaultState() {
  return {
    meta: { title: "FLACCID", updatedAt: rev() },
    teams: { A: { name: "Short Kings", color: "#233D6B" }, B: { name: "Tall Guys", color: "#B23A2E" } },
    players: {
      A: [
        { id: "tyler", name: "Tyler Rozwadowski", hcp: 0.4 }, { id: "ryanm", name: "Ryan Magaziner", hcp: 6.1 },
        { id: "blake", name: "Blake Madden", hcp: 6 }, { id: "kevinm", name: "Kevin Mathis", hcp: 6 },
        { id: "jonathan", name: "Jonathan Timms", hcp: 9 }, { id: "brad", name: "Brad Nasis", hcp: 11 },
        { id: "kaman", name: "Kaman Stark", hcp: 17 }, { id: "harris", name: "Harris Benson", hcp: 18 },
        { id: "brian", name: "Brian Bernstein", hcp: 25 }, { id: "ronb", name: "Ron Benson", hcp: 25 },
      ],
      B: [
        { id: "jakes", name: "Jake Sorrell", hcp: 3.2 }, { id: "samc", name: "Sam Clark", hcp: 3.5 },
        { id: "taylor", name: "Taylor Greenway", hcp: 6 }, { id: "andrew", name: "Andrew Harris", hcp: 9 },
        { id: "jonah", name: "Jonah Jacobsen", hcp: 9.9 }, { id: "keviny", name: "Kevin Yaeger", hcp: 10 },
        { id: "gregs", name: "Greg Sprink", hcp: 13 }, { id: "travis", name: "Travis Dale", hcp: 14 },
        { id: "jakei", name: "Jake Ilten", hcp: 17 }, { id: "matts", name: "Matt Schwartz", hcp: 24 },
        { id: "aaron", name: "Aaron Ragusa", hcp: 27 },
      ],
    },
    rounds: [
      { id: "r1", name: "Shamble", sub: "Fri PM · 2v2", type: "shamble", tee: "Blue", points: 1, note: "", matches: [
        mk(["tyler", "brian"], ["keviny", "aaron"], "12:30 PM"), mk(["harris", "ryanm"], ["gregs", "jakei"], "12:40 PM"),
        mk(["brad", "jonathan"], ["jakes", "taylor"], "12:50 PM"), mk(["kevinm", "blake"], ["travis", "samc"], "1:00 PM"),
        mk(["ronb"], ["matts"], "1:10 PM"),
      ] },
      { id: "r2", name: "Best Ball", sub: "Sat AM · 2v2", type: "bestball", tee: "White", points: 1, note: "Greg Sprink spectates this round.", matches: [
        mk(["tyler", "kevinm"], ["jakes", "keviny"], "8:30 AM"), mk(["brad", "jonathan"], ["jakei", "samc"], "8:40 AM"),
        mk(["ryanm", "blake"], ["jonah", "taylor"], "8:50 AM"), mk(["ronb", "harris"], ["travis", "matts"], "9:00 AM"),
        mk(["kaman", "brian"], ["andrew", "aaron"], "9:10 AM"),
      ] },
      { id: "r3", name: "Scramble", sub: "Sat PM · 2v2", type: "scramble", tee: "Red", points: 1, note: "Jonah Jacobsen spectates this round.", matches: [
        mk(["tyler", "jonathan"], ["jakes", "jakei"], "1:30 PM"), mk(["kevinm", "brad"], ["taylor", "keviny"], "1:40 PM"),
        mk(["blake", "harris"], ["travis", "samc"], "1:50 PM"), mk(["kaman", "ronb"], ["andrew", "aaron"], "2:00 PM"),
        mk(["brian", "ryanm"], ["matts", "gregs"], "2:10 PM"),
      ] },
      { id: "r4", name: "Singles", sub: "Sun AM · 1v1", type: "singles", tee: "Blue", points: 2, note: "Jonah Jacobsen (Tall Guys) draws a bye.", matches: [
        mk(["brian"], ["matts"], "8:30 AM"), mk(["jonathan"], ["travis"], "8:30 AM"), mk(["tyler"], ["andrew"], "8:40 AM"),
        mk(["brad"], ["gregs"], "8:40 AM"), mk(["ryanm"], ["taylor"], "8:50 AM"), mk(["ronb"], ["aaron"], "8:50 AM"),
        mk(["kaman"], ["jakei"], "9:00 AM"), mk(["kevinm"], ["samc"], "9:00 AM"), mk(["blake"], ["jakes"], "9:10 AM"),
        mk(["harris"], ["keviny"], "9:10 AM"),
      ] },
    ],
  };
}


function migrate(s) {
  let changed = false;
  if (s.meta && (s.meta.title === "FLACCID Cup" || s.meta.title === "FLCD Cup")) { s.meta.title = "FLACCID"; changed = true; }
  const r2 = (s.rounds || []).find((r) => r.id === "r2");
  if (r2) { r2.matches.forEach((m) => { const n = m.b.length; m.b = m.b.filter((id) => id !== "gregs"); if (m.b.length !== n) changed = true; }); if (!r2.note) { r2.note = "Greg Sprink spectates this round."; changed = true; } }
  const r3 = (s.rounds || []).find((r) => r.id === "r3");
  if (r3) { r3.matches.forEach((m) => { const n = m.b.length; m.b = m.b.filter((id) => id !== "jonah"); if (m.b.length !== n) changed = true; }); if (!r3.note) { r3.note = "Jonah Jacobsen spectates this round."; changed = true; } }
  (s.rounds || []).forEach((r) => { if (r.points == null) { r.points = r.id === "r4" ? 2 : 1; changed = true; } });
  return changed;
}

// ---- handicap + scoring engine ----
const findPlayer = (state, id) => state.players.A.find((p) => p.id === id) || state.players.B.find((p) => p.id === id) || null;
const roundHcp = (h) => (h == null ? 0 : Math.round(h));
function strokesOnHole(ph, si) { if (ph <= 0) return 0; const base = Math.floor(ph / 18); const extra = ph % 18; return base + (si <= extra ? 1 : 0); }
function scrambleTeamHcp(hcps) {
  const s = hcps.filter((x) => x != null).map(Number).sort((a, b) => a - b);
  if (s.length === 0) return 0; if (s.length === 1) return Math.round(s[0]);
  const best = s[0], worst = s[s.length - 1];
  return Math.round(0.35 * best + 0.15 * worst); // 35% better + 15% worse
}
// playing handicap (pre-difference) for an entity, by format
function entityPH(round, players) {
  if (round.type === "scramble") return scrambleTeamHcp(players.map((p) => p?.hcp));
  if (round.type === "shamble") return Math.round(0.8 * (players[0]?.hcp ?? 0)); // 80%
  return roundHcp(players[0]?.hcp); // bestball + singles: full
}
function matchEntities(state, round, m) {
  const build = (side) => {
    if (round.type === "scramble") {
      const pls = (m[side] || []).map((id) => findPlayer(state, id)).filter(Boolean);
      return [{ key: side, label: side === "a" ? state.teams.A.name : state.teams.B.name, team: true, players: pls, ph: entityPH(round, pls) }];
    }
    return (m[side] || []).map((id) => { const p = findPlayer(state, id); return { key: id, label: p ? p.name : id, players: [p], ph: entityPH(round, [p]) }; });
  };
  return { a: build("a"), b: build("b") };
}
function computeMatch(state, round, m, basis) {
  const ents = matchEntities(state, round, m);
  const all = [...ents.a, ...ents.b];
  const useDiff = round.type === "singles" || round.type === "scramble"; // single-ball head-to-head: only the higher side gets strokes
  const minPH = useDiff && all.length ? Math.min(...all.map((e) => e.ph)) : 0;
  all.forEach((e) => {
    e.matchStrokes = useDiff ? Math.max(0, e.ph - minPH) : e.ph; // shamble/best ball: each player keeps their own strokes
    e.holeStrokes = SI.map((si) => strokesOnHole(e.matchStrokes, si));
    const arr = m.scores?.[e.key] || [];
    e.gross = SI.map((_, h) => (arr[h] == null ? null : arr[h]));
    e.net = SI.map((_, h) => (arr[h] == null ? null : arr[h] - e.holeStrokes[h]));
  });
  const sideVals = (list) => {
    const gross = Array(18).fill(null), net = Array(18).fill(null);
    for (let h = 0; h < 18; h++) { let bg = null, bn = null; list.forEach((e) => { const g = e.gross[h]; if (g != null) { const n = e.net[h]; if (bg == null || g < bg) bg = g; if (bn == null || n < bn) bn = n; } }); gross[h] = bg; net[h] = bn; }
    return { gross, net };
  };
  const A = sideVals(ents.a), B = sideVals(ents.b);
  const key = basis === "gross" ? "gross" : "net";
  const win = Array(18).fill(null);
  for (let h = 0; h < 18; h++) { const a = A[key][h], b = B[key][h]; if (a != null && b != null) win[h] = a < b ? "A" : b < a ? "B" : "H"; }
  const tally = (s, e) => { let diff = 0, done = 0; for (let h = s; h < e; h++) if (win[h]) { done++; if (win[h] === "A") diff++; else if (win[h] === "B") diff--; } return { diff, done }; };
  const front = tally(0, 9), back = tally(9, 18);
  const backStarted = back.done > 0;
  const turned = backStarted || front.done === 9;     // front nine complete -> lead is halved for the back
  const carry = front.diff / 2;                       // front-nine lead is halved at the turn
  const eff = turned ? carry + back.diff : front.diff;
  const thru = front.done + back.done;
  const played = thru > 0;
  const remaining = Math.max(0, 9 - back.done);                 // back-nine holes left
  const complete = front.done === 9 && back.done === 9;          // all 18 in
  const decidedWin = turned && Math.abs(eff) > remaining;        // lead is safe -> match over
  const over = decidedWin || complete;
  const result = !over ? null : decidedWin ? (eff > 0 ? "A" : "B") : (eff > 0 ? "A" : eff < 0 ? "B" : "H");
  const run = Array(18).fill(null);
  { let acc = 0; for (let h = 0; h < 9; h++) { if (win[h] != null) { acc += win[h] === "A" ? 1 : win[h] === "B" ? -1 : 0; run[h] = acc; } } }
  { let acc = 0; for (let h = 9; h < 18; h++) { if (win[h] != null) { acc += win[h] === "A" ? 1 : win[h] === "B" ? -1 : 0; run[h] = carry + acc; } } }
  return { ents, A, B, win, run, front, back, carry, eff, thru, played, remaining, over, complete, result };
}
function matchScore(state, round, m, basis) { const cm = computeMatch(state, round, m, basis); const p = round.points || 1; if (cm.result === "A") return { a: p, b: 0 }; if (cm.result === "B") return { a: 0, b: p }; if (cm.result === "H") return { a: p / 2, b: p / 2 }; return { a: 0, b: 0 }; }
function roundScore(state, round, basis) { return round.matches.reduce((acc, m) => { const s = matchScore(state, round, m, basis); acc.a += s.a; acc.b += s.b; return acc; }, { a: 0, b: 0 }); }
function totals(state, basis) {
  let a = 0, b = 0, available = 0;
  state.rounds.forEach((r) => { available += r.matches.length * (r.points || 1); const s = roundScore(state, r, basis); a += s.a; b += s.b; });
  return { a, b, available, remaining: available - (a + b), needToWin: available / 2 + 0.5 };
}
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const sum = (arr, s, e) => { let t = 0, any = false; for (let i = s; i < e; i++) if (arr[i] != null) { t += arr[i]; any = true; } return any ? t : ""; };
// match-play status text from a hole differential (A - B)
function statusText(diff, teams) {
  if (diff === 0) return { txt: "AS", who: null };
  const who = diff > 0 ? "A" : "B"; const n = Math.abs(diff);
  return { txt: `${(who === "A" ? teams.A.name : teams.B.name).split(" ")[0]} ${fmt(n)} Up`, who };
}


function Dot({ color, size = 11, ring = "#fff" }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: 999, background: color, boxShadow: `0 0 0 1.5px ${ring}`, flex: "none" }} />;
}
function Flag({ size = 34 }) {
  const h = Math.round(size * 1.2);
  return (
    <svg width={size} height={h} viewBox="0 0 34 40" aria-hidden="true">
      <ellipse cx="17" cy="35.5" rx="11" ry="2.8" fill={C.navy} opacity="0.14" />
      <ellipse cx="17" cy="34.5" rx="8.5" ry="2.2" fill="#3F7E59" />
      <rect x="16.1" y="5" width="1.9" height="30" rx="0.9" fill={C.navy} />
      <circle cx="17" cy="5" r="2.1" fill={C.navy} />
      <path d="M18 5 L31 9 L18 13 Z" fill={C.red} />
    </svg>
  );
}
function TeePill({ tee }) {
  const c = TEE_COLOR[tee] || "#888";
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: C.inkSoft }}>
    <span style={{ width: 11, height: 11, borderRadius: 999, background: c, border: tee === "White" ? "1px solid rgba(28,37,54,0.35)" : "none", display: "inline-block" }} />{tee} tees
  </span>;
}
function PointsPill({ points }) {
  if (!points || points === 1) return null;
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, color: "#fff", background: C.red, borderRadius: 999 }}>{points} PTS / MATCH</span>;
}

export default function Page() {
  const [state, setState] = useState(null);
  const [mode, setMode] = useState("board");
  const [activeRound, setActiveRound] = useState(0);
  const [synced, setSynced] = useState(false);
  const [openCards, setOpenCards] = useState({});
  const [setupUnlocked, setSetupUnlocked] = useState(false);
  const revRef = useRef(null), editingRef = useRef(false), mounted = useRef(true);
  const basis = "net"; // gross entry only; net auto-calculated

  useEffect(() => {
    mounted.current = true;
    (async () => {
      let s = await store.get();
      if (!s) { s = defaultState(); await store.set(s); }
      else if (migrate(s)) { s.meta.updatedAt = rev(); await store.set(s); }
      if (!mounted.current) return;
      revRef.current = s.meta.updatedAt; setState(s); setSynced(true);
    })();
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    const id = setInterval(async () => {
      if (editingRef.current) return; const s = await store.get(); if (!s || !mounted.current) return;
      if (s.meta.updatedAt !== revRef.current) { revRef.current = s.meta.updatedAt; setState(s); }
    }, 4000);
    return () => clearInterval(id);
  }, []);
  const commit = useCallback((updater) => {
    setState((prev) => { const next = typeof updater === "function" ? updater(prev) : updater; next.meta = { ...next.meta, updatedAt: rev() }; revRef.current = next.meta.updatedAt; store.set(next); return next; });
  }, []);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const t = useMemo(() => (state ? totals(state, basis) : null), [state]);

  if (!state) return <div style={{ minHeight: "100vh", background: C.paper, color: C.ink, display: "grid", placeItems: "center", fontFamily: SANS }}>Loading the board…</div>;

  const round = state.rounds[activeRound];
  const beginEdit = () => (editingRef.current = true);
  const endEdit = () => (editingRef.current = false);

  const setTitle = (v) => commit((p) => { const n = clone(p); n.meta.title = v; return n; });
  const setTeam = (side, patch) => commit((p) => { const n = clone(p); n.teams[side] = { ...n.teams[side], ...patch }; return n; });
  const addPlayer = (side, name, hcp) => { const nm = name.trim(); if (!nm) return; commit((p) => { const n = clone(p); n.players[side].push({ id: uid(), name: nm, hcp: hcp === "" || hcp == null ? null : Number(hcp) }); return n; }); };
  const removePlayer = (side, id) => commit((p) => { const n = clone(p); n.players[side] = n.players[side].filter((x) => x.id !== id); n.rounds.forEach((r) => r.matches.forEach((m) => { m.a = m.a.filter((x) => x !== id); m.b = m.b.filter((x) => x !== id); if (m.scores) delete m.scores[id]; })); return n; });
  const addMatch = (ri) => commit((p) => { const n = clone(p); n.rounds[ri].matches.push(mk([], [], "")); return n; });
  const removeMatch = (ri, mid) => commit((p) => { const n = clone(p); n.rounds[ri].matches = n.rounds[ri].matches.filter((m) => m.id !== mid); return n; });
  const setMatchPlayer = (ri, mid, side, slot, pid) => commit((p) => { const n = clone(p); const m = n.rounds[ri].matches.find((x) => x.id === mid); const arr = [...m[side]]; arr[slot] = pid || undefined; m[side] = arr.filter((x) => x !== undefined && x !== ""); return n; });
  const setScore = (ri, mid, ekey, hole, value) => commit((p) => {
    const n = clone(p); const m = n.rounds[ri].matches.find((x) => x.id === mid);
    if (!m.scores) m.scores = {}; if (!m.scores[ekey]) m.scores[ekey] = Array(18).fill(null);
    const v = value === "" || value == null ? null : Math.max(1, Math.min(15, parseInt(value, 10) || 0)) || null;
    m.scores[ekey][hole] = v; return n;
  });
  const toggleCard = (id) => setOpenCards((o) => ({ ...o, [id]: !o[id] }));
  const clinched = t.a >= t.needToWin ? "A" : t.b >= t.needToWin ? "B" : null;

  const tabBtn = (active) => ({ flex: 1, padding: "11px 0", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, letterSpacing: 0.3, border: `1px solid ${active ? C.navy : C.line}`, background: active ? C.navy : C.panel, color: active ? "#fff" : C.ink });

  return (
    <div style={{ minHeight: "100vh", background: C.paper, color: C.ink, fontFamily: SANS }}>
      <div style={{ height: 4, background: C.navy }} />
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "22px 16px 64px" }}>
        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}><Flag size={34} /></div>
          <input value={state.meta.title} onChange={(e) => setTitle(e.target.value)} onFocus={beginEdit} onBlur={endEdit} aria-label="Tournament name"
            style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 700, lineHeight: 1.05, color: C.navy, background: "transparent", border: "none", textAlign: "center", width: "100%", outline: "none", letterSpacing: 3, textTransform: "uppercase" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 6 }}>
            <span style={{ height: 2, width: 26, background: C.red }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, color: C.navy }}>PINE DUNES RESORT &amp; GOLF CLUB</span>
            <span style={{ height: 2, width: 26, background: C.red }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 5 }}>
            <span style={{ height: 1, width: 16, background: C.navy }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 2, color: C.red }}>EST. 2020</span>
            <span style={{ height: 1, width: 16, background: C.navy }} />
          </div>
        </div>

        <Hero state={state} t={t} clinched={clinched} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12, color: C.inkSoft, margin: "12px 0 16px" }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: synced ? "#2E8B57" : C.red, display: "inline-block" }} />
          Live · share the link so anyone can view & enter scores
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["board", "Board"], ["records", "Records"], ["course", "Course"], ["setup", setupUnlocked ? "Setup" : "Setup 🔒"]].map(([k, label]) => (
            <button key={k} onClick={() => setMode(k)} style={tabBtn(mode === k)}>{label}</button>
          ))}
        </div>

        {(mode === "board" || mode === "setup") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 14 }}>
            {state.rounds.map((r, i) => { const rs = roundScore(state, r, basis); const on = i === activeRound; return (
              <button key={r.id} onClick={() => setActiveRound(i)} style={{ padding: "9px 4px", borderRadius: 9, cursor: "pointer", textAlign: "center", border: `1px solid ${on ? C.navy : C.line}`, background: on ? "rgba(35,61,107,0.07)" : C.panel, color: C.ink }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.1 }}>{r.name}</div>
                <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2 }}>{r.sub}</div>
                <div style={{ fontSize: 12, marginTop: 4, fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{fmt(rs.a)}–{fmt(rs.b)}</div>
              </button>
            ); })}
          </div>
        )}

        {mode === "board" && <BoardRound state={state} round={round} ri={activeRound} basis={basis} setScore={setScore} openCards={openCards} toggleCard={toggleCard} beginEdit={beginEdit} endEdit={endEdit} />}
        {mode === "records" && <RecordsView state={state} />}
        {mode === "course" && <CourseView state={state} />}
        {mode === "setup" && !setupUnlocked && <PasswordGate onUnlock={() => setSetupUnlocked(true)} />}
        {mode === "setup" && setupUnlocked && <Setup state={state} ri={activeRound} round={round} setTeam={setTeam} addPlayer={addPlayer} removePlayer={removePlayer} addMatch={addMatch} removeMatch={removeMatch} setMatchPlayer={setMatchPlayer} beginEdit={beginEdit} endEdit={endEdit} />}
      </div>
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, boxShadow: "0 1px 2px rgba(28,37,54,0.05)", ...style }}>{children}</div>;
}

function Hero({ state, t, clinched }) {
  const A = state.teams.A, B = state.teams.B; const denom = t.available || 1;
  const aPct = (t.a / denom) * 100, bPct = (t.b / denom) * 100;
  return (
    <Card style={{ padding: "18px 16px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div style={{ textAlign: "left", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}><Dot color={A.color} /><span style={{ fontSize: 13, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{A.name}</span></div>
          <div style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: A.color }}>{fmt(t.a)}</div>
        </div>
        <div style={{ textAlign: "center", paddingBottom: 8 }}><div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: C.inkSoft }}>vs</div></div>
        <div style={{ textAlign: "right", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, justifyContent: "flex-end" }}><span style={{ fontSize: 13, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{B.name}</span><Dot color={B.color} /></div>
          <div style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: B.color }}>{fmt(t.b)}</div>
        </div>
      </div>
      <div style={{ position: "relative", height: 16, borderRadius: 999, background: "rgba(28,37,54,0.08)", marginTop: 16, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${aPct}%`, background: A.color, transition: "width .4s ease" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${bPct}%`, background: B.color, transition: "width .4s ease" }} />
        <div style={{ position: "absolute", left: "50%", top: -3, bottom: -3, width: 2, background: C.navy, transform: "translateX(-1px)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 12, color: C.inkSoft }}>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{t.available} pts in play</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(t.remaining)} remaining</span>
      </div>
      <div style={{ textAlign: "center", marginTop: 12 }}>
        {t.available === 0 ? <span style={{ fontSize: 12.5, color: C.inkSoft }}>Add matchups in Setup to start</span>
          : clinched ? <span style={{ display: "inline-block", padding: "6px 14px", borderRadius: 999, background: C.navy, color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: 0.4 }}>🏆 {state.teams[clinched].name} clinches the cup</span>
          : <span style={{ fontSize: 12.5, color: C.inkSoft }}>{fmt(t.needToWin)} points to win the cup</span>}
      </div>
    </Card>
  );
}

function BoardRound({ state, round, ri, basis, setScore, openCards, toggleCard, beginEdit, endEdit }) {
  const rs = roundScore(state, round, basis);
  return (
    <div>
      <Card style={{ padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: SERIF, fontSize: 20, color: C.navy }}>{round.name}</div>
          <div style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(rs.a)} – {fmt(rs.b)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: C.inkSoft }}>{round.sub}</span><TeePill tee={round.tee} /><PointsPill points={round.points} />
        </div>
        {round.note ? <div style={{ fontSize: 11.5, color: C.red, marginTop: 8, fontWeight: 600 }}>{round.note}</div> : null}
      </Card>
      {round.matches.length === 0 ? <Empty title="No matches yet" body={`Add ${round.name} matches in the Setup tab.`} /> : (
        <div style={{ display: "grid", gap: 12 }}>
          {round.matches.map((m, idx) => <MatchCard key={m.id} state={state} round={round} m={m} idx={idx} ri={ri} basis={basis} setScore={setScore} open={!!openCards[m.id]} toggle={() => toggleCard(m.id)} beginEdit={beginEdit} endEdit={endEdit} />)}
        </div>
      )}
    </div>
  );
}

function SideNames({ state, ids, align }) {
  return <div style={{ display: "grid", gap: 2, textAlign: align }}>
    {ids.length === 0 && <span style={{ fontSize: 14, color: C.inkSoft }}>—</span>}
    {ids.map((id) => { const p = findPlayer(state, id); if (!p) return null; return <div key={id} style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{p.name}<span style={{ color: C.inkSoft, fontWeight: 500 }}> · {fmt(p.hcp)}</span></div>; })}
  </div>;
}
function StatusChip({ label, diff, teams }) {
  const st = statusText(diff, teams);
  let bg = "rgba(28,37,54,0.06)", col = C.inkSoft;
  if (st.who === "A") { bg = teams.A.color; col = "#fff"; } else if (st.who === "B") { bg = teams.B.color; col = "#fff"; } else { bg = "rgba(28,37,54,0.06)"; col = C.ink; }
  return <div style={{ borderRadius: 8, background: bg, color: col, padding: "6px 4px", textAlign: "center" }}>
    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, opacity: 0.85, textTransform: "uppercase" }}>{label}</div>
    <div style={{ fontSize: 11.5, fontWeight: 800, marginTop: 1 }}>{st.txt}</div>
  </div>;
}

function MatchCard({ state, round, m, idx, ri, basis, setScore, open, toggle, beginEdit, endEdit }) {
  const A = state.teams.A, B = state.teams.B;
  const cm = useMemo(() => computeMatch(state, round, m, basis), [state, round, m, basis]);
  const ov = statusText(cm.eff, state.teams);
  const ptTxt = cm.result === "A" ? `${A.name.split(" ")[0]} +1` : cm.result === "B" ? `${B.name.split(" ")[0]} +1` : cm.result === "H" ? "½ each" : "1 pt · in play";
  const who = cm.over ? cm.result : ov.who;
  const ovBg = who === "A" ? A.color : who === "B" ? B.color : "rgba(28,37,54,0.08)";
  const ovCol = who === "A" || who === "B" ? "#fff" : C.ink;
  let statusLine, statusSub;
  if (!cm.over) { statusLine = !cm.played || cm.eff === 0 ? "All Square" : ov.txt; statusSub = `· thru ${cm.thru}`; }
  else if (cm.result === "H") { statusLine = "Halved"; statusSub = "· FINAL"; }
  else { const wn = (cm.result === "A" ? A.name : B.name).split(" ")[0]; const mg = fmt(Math.abs(cm.eff)); statusLine = cm.remaining > 0 ? `${wn} win ${mg} & ${cm.remaining}` : `${wn} win ${mg} Up`; statusSub = "· FINAL"; }
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.inkSoft, textTransform: "uppercase" }}>Match {idx + 1}{m.time ? ` · ${m.time}` : ""}</span>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: cm.result === "A" ? A.color : cm.result === "B" ? B.color : C.inkSoft }}>{ptTxt}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "start", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 7 }}><Dot color={A.color} size={9} ring={C.panel} /><SideNames state={state} ids={m.a} align="left" /></div>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", color: C.inkSoft, fontSize: 13, paddingTop: 1 }}>v</span>
        <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}><SideNames state={state} ids={m.b} align="right" /><Dot color={B.color} size={9} ring={C.panel} /></div>
      </div>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 999, background: ovBg, color: ovCol, fontWeight: 800, fontSize: 13 }}>
          {statusLine} <span style={{ fontWeight: 600, opacity: 0.85 }}>{statusSub}</span>
        </span>
      </div>
      {cm.over && !cm.complete && <div style={{ textAlign: "center", marginTop: -2, marginBottom: 8, fontSize: 11, color: C.inkSoft }}>Match decided — you can still post the remaining holes.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
        <StatusChip label="Front 9 result" diff={cm.front.diff} teams={state.teams} />
        <StatusChip label="Carry to back (½)" diff={cm.carry} teams={state.teams} />
      </div>
      <button onClick={toggle} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: `1px solid ${C.line}`, background: open ? "rgba(35,61,107,0.05)" : C.panel, color: C.navy, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
        {open ? "Hide scorecard ▲" : "Enter / view scorecard ▼"}
      </button>
      {open && <Scorecard state={state} round={round} m={m} ri={ri} basis={basis} cm={cm} setScore={setScore} beginEdit={beginEdit} endEdit={endEdit} />}
    </Card>
  );
}

function Scorecard({ state, round, m, ri, basis, cm, setScore, beginEdit, endEdit }) {
  const A = state.teams.A, B = state.teams.B;
  const key = "net";
  const cellBase = { padding: "4px 3px", textAlign: "center", fontSize: 13, fontVariantNumeric: "tabular-nums", borderRight: `1px solid ${C.lineSoft}`, minWidth: 38 };
  const sumCell = { ...cellBase, fontWeight: 800, background: "rgba(28,37,54,0.05)" };
  const labelCell = { padding: "4px 10px", fontSize: 12, textAlign: "left", whiteSpace: "nowrap", borderRight: `1px solid ${C.lineSoft}`, position: "sticky", left: 0, background: C.panel, zIndex: 1 };
  const FRONT = [0, 1, 2, 3, 4, 5, 6, 7, 8], BACK = [9, 10, 11, 12, 13, 14, 15, 16, 17];
  const toPar = (n) => (n === 0 ? "E" : n > 0 ? `+${n}` : `${n}`);
  const totFor = (e) => { let g = 0, p = 0, net = 0, any = false; for (let h = 0; h < 18; h++) { if (e.gross[h] != null) { any = true; g += e.gross[h]; p += PAR[h]; net += e.net[h]; } } return any ? { g, p, net } : null; };
  const ScoreTotal = ({ v, par }) => v == null ? "" : <span>{v} <span style={{ fontSize: 10.5, fontWeight: 700, color: v - par < 0 ? "#2E7D32" : C.inkSoft }}>({toPar(v - par)})</span></span>;

  const HoleRow = ({ label, render, out, inn, tot, net, style, lstyle }) => (
    <tr style={style}>
      <td style={{ ...labelCell, ...lstyle }}>{label}</td>
      {FRONT.map((h) => <td key={h} style={cellBase}>{render(h)}</td>)}
      <td style={sumCell}>{out}</td>
      {BACK.map((h) => <td key={h} style={cellBase}>{render(h)}</td>)}
      <td style={sumCell}>{inn}</td>
      <td style={{ ...sumCell, minWidth: 62, background: "rgba(35,61,107,0.12)" }}>{tot}</td>
      <td style={{ ...sumCell, minWidth: 62, background: "rgba(35,61,107,0.06)" }}>{net}</td>
    </tr>
  );

  const InputCell = (e, h) => {
    const arr = m.scores?.[e.key]; const v = arr ? arr[h] : null;
    const st = e.holeStrokes[h];
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        {st > 0 && <div style={{ position: "absolute", top: -4, right: -3, display: "flex", gap: 1, zIndex: 2 }}>
          {Array.from({ length: Math.min(st, 2) }).map((_, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: 999, background: C.navyDeep, boxShadow: "0 0 0 1.5px #fff" }} />)}
        </div>}
        <input value={v == null ? "" : v} onChange={(ev) => setScore(ri, m.id, e.key, h, ev.target.value)} onFocus={beginEdit} onBlur={endEdit} inputMode="numeric"
          style={{ width: 34, textAlign: "center", border: `1px solid rgba(28,37,54,0.22)`, borderRadius: 6, padding: "6px 0", fontSize: 14.5, fontWeight: 600, color: C.ink, background: "#fff", outline: "none" }} />
      </div>
    );
  };
  const entRows = (ents, color) => ents.map((e) => {
    const arr = m.scores?.[e.key] || [];
    return <HoleRow key={e.key}
      label={<span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: color, marginRight: 6 }} />{e.label} <span style={{ color: C.inkSoft }}>({e.matchStrokes === e.ph ? e.ph : `${e.ph}→+${e.matchStrokes}`})</span></span>}
      render={(h) => InputCell(e, h)} out={sum(arr, 0, 9)} inn={sum(arr, 9, 18)}
      tot={(() => { const T = totFor(e); return T ? <ScoreTotal v={T.g} par={T.p} /> : ""; })()}
      net={(() => { const T = totFor(e); return T ? <ScoreTotal v={T.net} par={T.p} /> : ""; })()} />;
  });
  const sideNetRow = (vals, label) => <HoleRow label={<span style={{ fontWeight: 700 }}>{label}</span>} style={{ background: "rgba(28,37,54,0.03)" }}
    render={(h) => (vals[h] == null ? "" : vals[h])} out={sum(vals, 0, 9)} inn={sum(vals, 9, 18)} tot={sum(vals, 0, 18)} />;
  const resultRow = () => <HoleRow label={<span style={{ fontWeight: 700, color: C.inkSoft }}>Hole won</span>} style={{ borderTop: `2px solid ${C.line}` }}
    render={(h) => { const w = cm.win[h]; if (!w) return ""; const c = w === "A" ? A.color : w === "B" ? B.color : C.inkSoft; const tx = w === "H" ? "½" : w; return <span style={{ display: "inline-block", minWidth: 18, color: "#fff", background: c, borderRadius: 4, fontSize: 11.5, fontWeight: 800, padding: "2px 0" }}>{tx}</span>; }}
    out="" inn="" tot="" />;
  const statusRow = () => <HoleRow label={<span style={{ fontWeight: 700, color: C.inkSoft }}>Match</span>} style={{ background: "rgba(35,61,107,0.05)" }}
    render={(h) => { const d = cm.run[h]; if (d == null) return ""; if (d === 0) return <span style={{ fontSize: 11, fontWeight: 800, color: C.inkSoft }}>AS</span>; const c = d > 0 ? A.color : B.color; return <span style={{ fontSize: 12, fontWeight: 800, color: c }}>{Math.abs(d)}{d > 0 ? "▲" : "▼"}</span>; }}
    out="" inn="" tot="" />;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${C.line}` }}>
        <table style={{ borderCollapse: "collapse", background: C.panel, color: C.ink, minWidth: 860 }}>
          <thead><HoleRow label={<span style={{ color: "#fff", fontWeight: 800 }}>Hole</span>} lstyle={{ background: C.navy, color: "#fff" }} render={(h) => COURSE.holes[h].h} out="OUT" inn="IN" tot="TOT" net="NET" /></thead>
          <tbody>
            <HoleRow label="Par" render={(h) => PAR[h]} out={36} inn={36} tot={72} />
            <HoleRow label={<span style={{ color: C.inkSoft }}>Stroke index</span>} style={{ background: "rgba(178,58,46,0.06)" }} render={(h) => SI[h]} out="" inn="" tot="" />
            <tr><td colSpan={23} style={{ padding: "5px 10px", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "#fff", background: A.color }}>{A.name}</td></tr>
            {entRows(cm.ents.a, A.color)}
            {sideNetRow(cm.A[key], `${A.name.split(" ")[0]} best net`)}
            <tr><td colSpan={23} style={{ padding: "5px 10px", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: "#fff", background: B.color }}>{B.name}</td></tr>
            {entRows(cm.ents.b, B.color)}
            {sideNetRow(cm.B[key], `${B.name.split(" ")[0]} best net`)}
            {resultRow()}
            {statusRow()}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 8, lineHeight: 1.5 }}>
        Enter <b>gross scores only</b> — net is calculated automatically. Navy dots mark each hole where that player/team gets a stroke. Singles &amp; scramble: only the higher side gets strokes. Shamble (80%) &amp; best ball: every player gets their own strokes. Match row: ▲ = {A.name.split(" ")[0]} up, ▼ = {B.name.split(" ")[0]} up, AS = all square — the front-nine lead is halved at the turn.
      </div>
    </div>
  );
}

function CourseView({ state }) {
  const out = COURSE.holes.slice(0, 9), inn = COURSE.holes.slice(9);
  const cell = { padding: "8px 7px", textAlign: "center", fontSize: 13, fontVariantNumeric: "tabular-nums", borderRight: `1px solid ${C.lineSoft}` };
  const head = { ...cell, fontWeight: 800, background: C.navy, color: "#fff", borderRight: "1px solid rgba(255,255,255,0.15)" };
  const rowLabel = { padding: "8px 11px", fontSize: 12.5, fontWeight: 700, color: C.inkSoft, textAlign: "left", whiteSpace: "nowrap", borderRight: `1px solid ${C.lineSoft}` };
  const Nine = ({ holes, label, total }) => (
    <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.line}`, marginBottom: 12 }}>
      <table style={{ borderCollapse: "collapse", width: "100%", background: C.panel, color: C.ink, minWidth: 480 }}>
        <thead><tr><th style={{ ...head, textAlign: "left" }}>Hole</th>{holes.map((h) => <th key={h.h} style={head}>{h.h}</th>)}<th style={head}>{label}</th></tr></thead>
        <tbody>
          <tr><td style={rowLabel}>Par</td>{holes.map((h) => <td key={h.h} style={cell}>{h.par}</td>)}<td style={{ ...cell, fontWeight: 800 }}>{total}</td></tr>
          <tr style={{ background: "rgba(178,58,46,0.06)" }}><td style={rowLabel}>Hcp (stroke index)</td>{holes.map((h) => <td key={h.h} style={cell}>{h.si}</td>)}<td style={cell}>—</td></tr>
        </tbody>
      </table>
    </div>
  );
  return (
    <div>
      <Card style={{ padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ fontFamily: SERIF, fontSize: 20, color: C.navy }}>{COURSE.name}</div><div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{COURSE.loc}</div>
      </Card>
      <SectionLabel>Tees by round</SectionLabel>
      <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
        {state.rounds.map((r) => <Card key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px" }}>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name} <span style={{ color: C.inkSoft }}>· {r.sub}</span></span><TeePill tee={r.tee} /></Card>)}
      </div>
      <SectionLabel>Tee ratings (men)</SectionLabel>
      <div style={{ overflowX: "auto", borderRadius: 12, border: `1px solid ${C.line}`, margin: "6px 0 16px" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", background: C.panel, color: C.ink }}>
          <thead><tr><th style={{ ...head, textAlign: "left" }}>Tee</th><th style={head}>Yards</th><th style={head}>Rating</th><th style={head}>Slope</th></tr></thead>
          <tbody>{COURSE.tees.map((te) => <tr key={te.name}>
            <td style={{ ...rowLabel, display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 12, height: 12, borderRadius: 999, background: TEE_COLOR[te.name], border: te.name === "White" ? "1px solid #bbb" : "none", display: "inline-block" }} />{te.name}</td>
            <td style={cell}>{te.yards.toLocaleString()}</td><td style={cell}>{te.rating}</td><td style={{ ...cell, borderRight: "none" }}>{te.slope}</td></tr>)}</tbody>
        </table>
      </div>
      <SectionLabel>Scorecard</SectionLabel>
      <div style={{ marginTop: 6 }}><Nine holes={out} label="OUT" total={36} /><Nine holes={inn} label="IN" total={36} /></div>
      <div style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.5 }}>Par 72 · 6,537 yds from the Blue tees. Singles &amp; scramble use the difference method (only the higher side gets strokes, on the hardest holes). Shamble (80% per player) &amp; best ball (full) let each player keep their own strokes, best net ball counts. Scramble team handicap = round(35% of the better + 15% of the worse). Ratings vary by source — confirm with the pro shop before settling bets.</div>
    </div>
  );
}

function Setup(props) {
  const { state, ri, round, setTeam, addPlayer, removePlayer, addMatch, removeMatch, setMatchPlayer, beginEdit, endEdit } = props;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <SectionLabel>Teams &amp; rosters <span style={{ color: C.inkSoft, fontWeight: 600 }}>· 🔒 handicaps locked</span></SectionLabel>
      <div style={{ display: "grid", gap: 12 }}>
        {["A", "B"].map((side) => <TeamEditor key={side} side={side} team={state.teams[side]} players={state.players[side]} setTeam={setTeam} addPlayer={addPlayer} removePlayer={removePlayer} beginEdit={beginEdit} endEdit={endEdit} />)}
      </div>
      <SectionLabel>{round.name} matchups <span style={{ color: C.inkSoft, fontWeight: 500 }}>· {round.sub} · {round.tee} tees</span></SectionLabel>
      {round.matches.length === 0 && <div style={{ fontSize: 13, color: C.inkSoft }}>No matchups yet for this round.</div>}
      <div style={{ display: "grid", gap: 10 }}>{round.matches.map((m, idx) => <MatchupBuilder key={m.id} m={m} idx={idx} ri={ri} state={state} round={round} setMatchPlayer={setMatchPlayer} removeMatch={removeMatch} />)}</div>
      <button onClick={() => addMatch(ri)} style={{ padding: "12px 0", borderRadius: 10, border: `1px dashed ${C.navy}`, background: C.panel, color: C.navy, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Add a matchup to {round.name}</button>
    </div>
  );
}
function SectionLabel({ children }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: C.navy, marginTop: 4 }}>
    <span style={{ width: 14, height: 2, background: C.red, display: "inline-block" }} />{children}
  </div>;
}

function TeamEditor({ side, team, players, setTeam, addPlayer, removePlayer, beginEdit, endEdit }) {
  const [name, setName] = useState(""); const [hcp, setHcp] = useState("");
  const submit = () => { addPlayer(side, name, hcp); setName(""); setHcp(""); };
  const PALETTE = [["#233D6B", "Navy"], ["#B23A2E", "Crimson"], ["#2E6B4F", "Forest"], ["#B8860B", "Brass"], ["#3F4A5A", "Slate"], ["#C2622A", "Sunset"], ["#1E6B73", "Teal"], ["#6B3A5B", "Plum"]];
  return (
    <Card style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Dot color={team.color} size={14} ring={C.panel} />
        <input value={team.name} onChange={(e) => setTeam(side, { name: e.target.value })} onFocus={beginEdit} onBlur={endEdit} style={{ flex: 1, background: "transparent", border: "none", borderBottom: `1px solid ${C.line}`, color: C.ink, fontSize: 16, fontWeight: 700, padding: "4px 0", outline: "none" }} />
        <span style={{ fontSize: 11.5, color: C.inkSoft }}>{players.length} players</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {PALETTE.map(([hex, nm]) => <button key={hex} onClick={() => setTeam(side, { color: hex })} aria-label={nm} style={{ width: 24, height: 24, borderRadius: 999, background: hex, cursor: "pointer", border: team.color === hex ? `2px solid ${C.ink}` : "2px solid transparent", outline: "none" }} />)}
      </div>
      <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
        {players.map((p) => <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(28,37,54,0.04)", borderRadius: 8, padding: "7px 8px 7px 10px", gap: 8 }}>
          <span style={{ fontSize: 14, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
          <span style={{ fontSize: 12, color: C.inkSoft, fontVariantNumeric: "tabular-nums" }}>hcp {p.hcp == null ? "—" : fmt(p.hcp)}</span>
          <button onClick={() => removePlayer(side, p.id)} aria-label={`Remove ${p.name}`} style={{ background: "transparent", border: "none", color: C.inkSoft, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
        </div>)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} onFocus={beginEdit} onBlur={endEdit} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="Add player" style={{ flex: 1, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, color: C.ink, padding: "9px 11px", fontSize: 14, outline: "none" }} />
        <input value={hcp} onChange={(e) => setHcp(e.target.value)} onFocus={beginEdit} onBlur={endEdit} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="hcp" inputMode="decimal" style={{ width: 56, textAlign: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, color: C.ink, padding: "9px 6px", fontSize: 14, outline: "none" }} />
        <button onClick={submit} style={{ padding: "0 16px", borderRadius: 8, background: team.color, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Add</button>
      </div>
    </Card>
  );
}

function MatchupBuilder({ m, idx, ri, state, round, setMatchPlayer, removeMatch }) {
  const A = state.teams.A, B = state.teams.B;
  const base = round.type === "singles" ? 1 : 2;
  const slots = round.type === "singles" ? 1 : Math.min(3, Math.max(base, m.a.length, m.b.length));
  const slotArr = Array.from({ length: slots });
  return (
    <Card style={{ padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.inkSoft, textTransform: "uppercase" }}>Match {idx + 1}{m.time ? ` · ${m.time}` : ""}</span>
        <button onClick={() => removeMatch(ri, m.id)} style={{ background: "transparent", border: "none", color: C.red, cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>remove</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center" }}>
        <div style={{ display: "grid", gap: 6 }}>{slotArr.map((_, s) => <PlayerSelect key={s} color={A.color} options={state.players.A} value={m.a[s] || ""} onChange={(v) => setMatchPlayer(ri, m.id, "a", s, v)} />)}</div>
        <span style={{ fontFamily: SERIF, fontStyle: "italic", color: C.inkSoft, fontSize: 14 }}>v</span>
        <div style={{ display: "grid", gap: 6 }}>{slotArr.map((_, s) => <PlayerSelect key={s} color={B.color} options={state.players.B} value={m.b[s] || ""} onChange={(v) => setMatchPlayer(ri, m.id, "b", s, v)} />)}</div>
      </div>
    </Card>
  );
}
function PlayerSelect({ color, options, value, onChange }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Dot color={color} size={9} ring={C.panel} />
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, background: "#fff", color: C.ink, border: `1px solid ${C.line}`, borderRadius: 7, padding: "8px 6px", fontSize: 13, outline: "none", maxWidth: "100%" }}>
      <option value="">— pick —</option>{options.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select></div>;
}

function computeRecords(state) {
  const rec = {};
  const ensure = (id, side) => { if (!rec[id]) { const p = findPlayer(state, id); rec[id] = { id, name: p ? p.name : id, hcp: p ? p.hcp : null, side, played: 0, w: 0, l: 0, h: 0, pts: 0 }; } return rec[id]; };
  state.rounds.forEach((r) => r.matches.forEach((m) => {
    const cm = computeMatch(state, r, m, "net");
    const pp = r.points || 1;
    m.a.forEach((id) => { const e = ensure(id, "A"); if (cm.result) { e.played++; if (cm.result === "A") { e.w++; e.pts += pp; } else if (cm.result === "B") { e.l++; } else { e.h++; e.pts += pp / 2; } } });
    m.b.forEach((id) => { const e = ensure(id, "B"); if (cm.result) { e.played++; if (cm.result === "B") { e.w++; e.pts += pp; } else if (cm.result === "A") { e.l++; } else { e.h++; e.pts += pp / 2; } } });
  }));
  return rec;
}

function RecordsView({ state }) {
  const rec = useMemo(() => computeRecords(state), [state]);
  const teamPts = (side) => { let t = 0; state.rounds.forEach((r) => { const rs = roundScore(state, r, "net"); t += side === "A" ? rs.a : rs.b; }); return t; };
  const rows = (side) => state.players[side]
    .map((p) => rec[p.id] || { id: p.id, name: p.name, hcp: p.hcp, played: 0, w: 0, l: 0, h: 0, pts: 0 })
    .sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name));
  const cell = { padding: "8px 9px", fontSize: 13.5, fontVariantNumeric: "tabular-nums", borderTop: `1px solid ${C.lineSoft}` };
  const th = { padding: "8px 9px", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", color: C.inkSoft };
  const Section = ({ side }) => {
    const team = state.teams[side];
    return (
      <Card style={{ overflow: "hidden", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: team.color, color: "#fff" }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{team.name}</span>
          <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(teamPts(side))} pts</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={{ ...th, textAlign: "left" }}>Player</th>
            <th style={{ ...th, textAlign: "center" }}>Pld</th>
            <th style={{ ...th, textAlign: "center" }}>W–L–H</th>
            <th style={{ ...th, textAlign: "right" }}>Pts</th>
          </tr></thead>
          <tbody>
            {rows(side).map((e) => (
              <tr key={e.id}>
                <td style={{ ...cell, textAlign: "left", fontWeight: 600 }}>{e.name}<span style={{ color: C.inkSoft, fontWeight: 500 }}> · {e.hcp == null ? "—" : fmt(e.hcp)}</span></td>
                <td style={{ ...cell, textAlign: "center" }}>{e.played}</td>
                <td style={{ ...cell, textAlign: "center" }}>{e.w}–{e.l}–{e.h}</td>
                <td style={{ ...cell, textAlign: "right", fontWeight: 800 }}>{fmt(e.pts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    );
  };
  return (
    <div>
      <SectionLabel>Player records</SectionLabel>
      <div style={{ margin: "10px 0 12px", fontSize: 11.5, color: C.inkSoft, lineHeight: 1.5 }}>
        Pts = matches won (a halved match counts ½). Sunday singles count for 2 points each; all other matches are 1 point. Results only count once a match is clinched or all 18 holes are in. In team matches both partners are credited with the result, so a side's player points add up to more than its cup total.
      </div>
      <Section side="A" />
      <Section side="B" />
    </div>
  );
}

function PasswordGate({ onUnlock }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const submit = () => { if (pw === SETUP_PASSWORD) { setErr(false); onUnlock(); } else { setErr(true); setPw(""); } };
  return (
    <Card style={{ padding: "28px 22px", textAlign: "center", maxWidth: 400, margin: "16px auto" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="10" width="16" height="11" rx="2" fill={C.navy} />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke={C.navy} strokeWidth="2" fill="none" />
          <circle cx="12" cy="15.5" r="1.6" fill="#fff" />
        </svg>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 20, color: C.navy, marginBottom: 6 }}>Setup is locked</div>
      <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 16, lineHeight: 1.5 }}>
        Players don’t need this — anyone can view the board and post scores. The password is just for tournament setup (rosters, pairings, etc.).
      </div>
      <input type="password" value={pw} autoFocus onChange={(e) => { setPw(e.target.value); setErr(false); }} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="Password"
        style={{ width: "100%", padding: "11px 12px", fontSize: 15, border: `1px solid ${err ? C.red : C.line}`, borderRadius: 8, outline: "none", marginBottom: 10, boxSizing: "border-box", background: "#fff" }} />
      {err && <div style={{ fontSize: 12, color: C.red, marginBottom: 10, fontWeight: 600 }}>Incorrect password</div>}
      <button onClick={submit} style={{ width: "100%", padding: "11px 0", borderRadius: 8, background: C.navy, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Unlock setup</button>
    </Card>
  );
}

function Empty({ title, body }) {
  return <Card style={{ padding: "26px 18px", textAlign: "center", borderStyle: "dashed" }}>
    <div style={{ fontFamily: SERIF, fontSize: 19, marginBottom: 6, color: C.navy }}>{title}</div><div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5 }}>{body}</div></Card>;
}
