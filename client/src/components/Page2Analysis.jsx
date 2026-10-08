import React, { useEffect, useMemo, useState } from "react";
import { Github } from "lucide-react";
import "./Page2Analysis.css";
import { getProfileAnalysis } from "../services/analysis.client.js";

const STAGES = [
  { key: "profile", label: "PROFILE DISCOVERED" },
  { key: "repos", label: "REPOSITORIES MAPPED" },
  { key: "tech", label: "TECHNOLOGY SIGNALS EXTRACTED" },
  { key: "docs", label: "DOCUMENTATION INSPECTED" },
  { key: "health", label: "PROJECT HEALTH CALCULATED" },
  { key: "recruiter", label: "RECRUITER LENS SIMULATED" },
];

const SIGNALS = [
  ["profile", "left", "PROFILE"],
  ["repos", "left", "REPOSITORIES"],
  ["tech", "left", "TECHNOLOGIES"],
  ["docs", "right", "DOCUMENTATION"],
  ["health", "right", "PROJECT HEALTH"],
  ["recruiter", "right", "RECRUITER LENS"],
];

function Signal({ side, label, className }) {
  return (
    <div className={`analysis-signal ${side} ${className}`}>
      {side === "left" && <span className="signal-line" />}
      <span>&lt; {label} /&gt;</span>
      {side === "right" && <span className="signal-line" />}
    </div>
  );
}

function DNAVisualization({ progress }) {
  const particles = useMemo(() => Array.from({ length: 90 }, (_, i) => ({
    x: 3 + ((i * 37) % 94),
    y: 3 + ((i * 61) % 94),
    r: 1.1 + (i % 5) * 0.55,
    green: i % 5 === 0,
    delay: `${(i % 16) * -0.22}s`,
  })), []);

  const network = useMemo(() => {
    const nodes = Array.from({ length: 68 }, (_, i) => {
      const t = i / 67;
      const y = 30 + t * 740;
      const center = 305 + Math.sin(t * Math.PI * 5.8) * 10;
      const spread = 100 + Math.sin(t * Math.PI * 5.8) * 72;
      const side = i % 2 === 0 ? -1 : 1;
      return {
        x: center + side * spread * (0.45 + ((i * 17) % 55) / 100),
        y,
        r: 1.5 + (i % 4) * 0.75,
        green: i % 3 !== 1,
      };
    });

    const links = [];
    for (let i = 0; i < nodes.length; i += 1) {
      const next = i + (i % 3 === 0 ? 2 : 1);
      if (next < nodes.length) links.push([nodes[i], nodes[next]]);
      if (i % 7 === 0 && i + 8 < nodes.length) links.push([nodes[i], nodes[i + 8]]);
    }
    return { nodes, links };
  }, []);

  const helix = useMemo(() => {
    const count = 92;
    const height = 790;
    const center = 305;
    const radius = 115;
    const turns = Math.PI * 5.8;
    const a = [];
    const b = [];
    const bonds = [];

    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      const y = t * height;
      const angle = t * turns;
      const x1 = center + radius * Math.sin(angle);
      const x2 = center - radius * Math.sin(angle);
      a.push([x1, y]);
      b.push([x2, y]);
      if (i % 3 === 0) bonds.push({ x1, x2, y });
    }

    const path = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    return { a: path(a), b: path(b), bonds, aPts: a, bPts: b };
  }, []);

  return (
    <div className="analysis-visual">
      <div className="cinematic-grid" />
      <div className="cinematic-glow" />

      <svg className="network-svg" viewBox="0 0 610 820" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {network.links.map(([p1, p2], i) => (
          <line key={`link-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="network-link" />
        ))}
        {network.nodes.map((p, i) => (
          <circle key={`node-${i}`} cx={p.x} cy={p.y} r={p.r} className={`network-node ${p.green ? 'green' : ''}`} />
        ))}
      </svg>

      <div className="dna-cinematic">
        <svg className="dna-svg" viewBox="0 0 610 820" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <filter id="cinematicGlow">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <linearGradient id="cinematicGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7cff6b" stopOpacity=".22" />
              <stop offset=".45" stopColor="#7cff6b" />
              <stop offset="1" stopColor="#7cff6b" stopOpacity=".4" />
            </linearGradient>
            <linearGradient id="cinematicWhite" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f5f8f5" stopOpacity=".28" />
              <stop offset=".48" stopColor="#e7eee8" />
              <stop offset="1" stopColor="#e7eee8" stopOpacity=".28" />
            </linearGradient>
          </defs>

          <path d={helix.a} className="cinematic-strand green-strand" filter="url(#cinematicGlow)" />
          <path d={helix.b} className="cinematic-strand white-strand" />

          {helix.bonds.map((b, i) => (
            <line key={`bond-${i}`} x1={b.x1} y1={b.y} x2={b.x2} y2={b.y} className={`cinematic-bond ${i % 4 === 0 ? 'hot' : ''}`} />
          ))}

          {helix.aPts.map(([x, y], i) => (
            <circle key={`a-${i}`} cx={x} cy={y} r={i % 5 === 0 ? 3.5 : 2} className="helix-node green-node" />
          ))}
          {helix.bPts.map(([x, y], i) => (
            <circle key={`b-${i}`} cx={x} cy={y} r={i % 6 === 0 ? 3.3 : 1.9} className="helix-node white-node" />
          ))}
        </svg>
      </div>

      {particles.map((p, i) => (
        <i key={i} className={`cinematic-particle ${p.green ? 'green' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.r * 2}px`, height: `${p.r * 2}px`, animationDelay: p.delay }} />
      ))}

      <div className="orbit-github github-1"><Github size={21} /></div>
      <div className="orbit-github github-2"><Github size={22} /></div>
      <div className="orbit-github github-3"><Github size={19} /></div>

      {SIGNALS.map(([key, side, label]) => (
        <Signal key={key} side={side} label={label} className={`signal-${key}`} />
      ))}
    </div>
  );
}

export default function Page2Analysis({ username = "username", onComplete, onInvalid }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setCurrentStage(0);
      setAnalysisResult(null);
      setAnalysisError('');
      try {
        let data;
        try {
          data = await getProfileAnalysis(username);
        } catch (error) {
          if (error?.status === 404 || error?.code === 'GITHUB_USER_NOT_FOUND') {
            onInvalid?.({ error: error.message, code: error.code });
            return;
          }
          throw error;
        }
        if (isMounted) {
          if (!data?.user?.login || !data?.recruiterLens || !data?.dna) {
            throw new Error('GitHub analysis returned incomplete data. No report was generated.');
          }
          setAnalysisResult(data);
        }
      } catch (err) {
        console.warn('API fetch error during scan:', err);
        if (isMounted) setAnalysisError(err.message || 'GitHub analysis could not be completed.');
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [username, retryKey, onInvalid]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStage((value) => {
        if (value >= STAGES.length - 1) {
          clearInterval(timer);
          return value;
        }
        return value + 1;
      });
    }, 900);

    return () => clearInterval(timer);
  }, []);

  const progress = analysisError ? 100 : Math.round(
    ((currentStage + 1) / STAGES.length) * 100
  );

  useEffect(() => {
    if (currentStage === STAGES.length - 1 && analysisResult && !analysisError) {
      const done = setTimeout(() => onComplete?.(analysisResult), 500);
      return () => clearTimeout(done);
    }
  }, [currentStage, analysisResult, onComplete]);

  return (
    <main className="analysis-page">
      <header className="analysis-header">
        <div className="analysis-brand">
          <div className="analysis-logo">
            R<span>/</span>R
          </div>
          <span className="header-divider" />
          <span className="brand-label">GITHUB CAREER INTELLIGENCE</span>
        </div>

        <div className="analysis-nav">
          <span>HOW IT WORKS</span>
          <span className="header-divider" />
          <Github size={23} strokeWidth={1.8} />
        </div>
      </header>

      <section className="analysis-content">
        <div className="analysis-left">
          <div className="analysis-kicker">
            <span>ANALYSIS IN PROGRESS</span>
            <i />
          </div>

          <h1 className="analysis-title">
            ANALYZING
            <span>@{username}</span>
          </h1>

          <h2 className="analysis-subtitle">
            READING THE
            <br />
            SIGNAL<span>.</span>
          </h2>

          <div className="stage-list">
            {STAGES.map((stage, index) => {
              const completed = index < currentStage;
              const active = index === currentStage;

              return (
                <div
                  className={`stage-row ${
                    completed ? "completed" : ""
                  } ${active ? "active" : ""}`}
                  key={stage.key}
                >
                  <span className="stage-dot">
                    {completed || active ? "●" : "○"}
                  </span>
                  <span className="stage-name">{stage.label}</span>
                  <span className="stage-state">
                    {completed
                      ? "COMPLETE"
                      : active
                      ? "SCANNING"
                      : "WAITING"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="progress-row">
            <div className="progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
            <strong>{progress}%</strong>
          </div>

          {analysisError && (
            <div style={{ marginTop: 18, maxWidth: 560, color: '#ff8f8f', fontSize: 12, letterSpacing: '0.08em' }}>
              ANALYSIS ERROR — {analysisError} <button type="button" onClick={() => { setAnalysisError(''); setAnalysisResult(null); setCurrentStage(0); setRetryKey((value) => value + 1); }} style={{ marginLeft: 8, background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '5px 9px', cursor: 'pointer' }}>RETRY</button>
            </div>
          )}
        </div>

        <DNAVisualization progress={progress} />
      </section>

      <footer className="analysis-footer">
        <div className="footer-links">
          <span>RECRUITER LENS</span>
          <b>•</b>
          <span>DEVELOPER DNA</span>
          <b>•</b>
          <span>ROAST</span>
          <b>•</b>
          <span>RESCUE</span>
          <b>•</b>
          <span>INTERVIEW TEST</span>
        </div>

        <div className="footer-status">
          <span className="mouse">
            <i />
          </span>
          <span>ANALYZING...<br />PLEASE WAIT</span>
        </div>
      </footer>
    </main>
  );
}
