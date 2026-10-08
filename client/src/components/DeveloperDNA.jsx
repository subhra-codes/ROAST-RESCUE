import React, { useState } from 'react';
import { Dna, Activity, Cpu, Layers, Code, GitCommit, FileText } from 'lucide-react';
import './ReportComponents.css';

const SKILL_ICONS = {
  Frontend: <Code size={16} />,
  Backend: <Layers size={16} />,
  'AI / ML': <Cpu size={16} />,
  Cloud: <Activity size={16} />,
  'Open Source': <GitCommit size={16} />,
  Documentation: <FileText size={16} />,
  Activity: <Activity size={16} />,
};

export default function DeveloperDNA({ dna, user }) {
  const archetype = dna?.archetype || 'ANALYSIS UNAVAILABLE';
  const scores = dna?.dnaScores || {};
  const visual = dna?.visualInfluence || { helixDensity: 0, bondDensity: 0, nodeActivity: 0, strandStability: 0, segmentIntensity: 0, movement: 'STABLE' };
  const evidence = dna?.evidence || {};
  const [selectedSignal, setSelectedSignal] = useState(null);
  const selectedEvidence = selectedSignal ? (evidence[selectedSignal] || []) : [];

  return (
    <section id="developer-dna" className="report-section">
      <div className="section-header">
        <div className="section-eyebrow">
          <Dna size={14} />
          <span>FEATURE 02 — DEVELOPER DNA 🧬</span>
        </div>
        <h2 className="section-title">
          YOUR VISUAL SIGNATURE<span>.</span>
        </h2>
        <p className="section-desc">
          Instead of raw statistics, your public GitHub activity translates into your Developer DNA identity.
        </p>
      </div>

      <div className="dna-report-grid">
        {/* DNA Identity & Bars */}
        <div className="dna-identity-card">
          <div className="archetype-banner">
            <span className="archetype-label">DEVELOPER IDENTITY</span>
            <h3 className="archetype-title">{archetype}</h3>
          </div>

          <div className="dna-bars-container">
            {Object.entries(scores).map(([key, val]) => {
              const icon = SKILL_ICONS[key] || <Code size={16} />;
              const blocksCount = Math.round((val / 100) * 10);
              const filledBlocks = '█'.repeat(blocksCount);
              const emptyBlocks = '░'.repeat(10 - blocksCount);

              return (
                <div
                  key={key}
                  className="dna-bar-row"
                  onClick={() => setSelectedSignal(key)}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedSignal(key); }}
                  role="button"
                  tabIndex={0}
                  title="Inspect GitHub evidence"
                >
                  <div className="bar-meta">
                    <span className="bar-icon">{icon}</span>
                    <span className="bar-name">{key}</span>
                  </div>
                  <div className="bar-visual-track">
                    <div className="bar-visual-fill" style={{ width: `${val}%` }} />
                  </div>
                  <div className="bar-blocks">{filledBlocks}<span className="empty-blocks">{emptyBlocks}</span></div>
                  <span className="bar-val">{val}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signal Visual Influence Matrix */}
        <div className="dna-matrix-card">
          <div className="card-subtitle">HOW SIGNALS INFLUENCE YOUR DNA</div>

          <div className="matrix-grid">
            <div className="matrix-item">
              <span className="matrix-signal">Technical Depth</span>
              <span className="matrix-arrow">→</span>
              <span className="matrix-effect">Helix Density ({visual.helixDensity}%)</span>
            </div>
            <div className="matrix-item">
              <span className="matrix-signal">Tech Diversity</span>
              <span className="matrix-arrow">→</span>
              <span className="matrix-effect">Bond Density ({visual.bondDensity}%)</span>
            </div>
            <div className="matrix-item">
              <span className="matrix-signal">Activity Level</span>
              <span className="matrix-arrow">→</span>
              <span className="matrix-effect">Node Activity ({visual.nodeActivity}%)</span>
            </div>
            <div className="matrix-item">
              <span className="matrix-signal">Consistency</span>
              <span className="matrix-arrow">→</span>
              <span className="matrix-effect">Strand Stability ({visual.strandStability}%)</span>
            </div>
            <div className="matrix-item">
              <span className="matrix-signal">Recent Momentum</span>
              <span className="matrix-arrow">→</span>
              <span className="matrix-effect">Movement ({visual.movement})</span>
            </div>
            <div className="matrix-item">
              <span className="matrix-signal">Tech Evidence</span>
              <span className="matrix-arrow">→</span>
              <span className="matrix-effect">Orbiting Particles</span>
            </div>
          </div>

          <div className="dna-summary-quote">
            {selectedSignal ? (
              <>
                <strong>{selectedSignal} EVIDENCE:</strong>{' '}
                {selectedEvidence.length > 0 ? selectedEvidence.join(' · ') : 'No matching repository evidence was detected in the analyzed public data.'}
              </>
            ) : (
              <>
                "Your GitHub data suggests you operate as a <strong>{archetype}</strong>{Object.keys(scores).length ? <> with high focus on <strong>{Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b)}</strong></> : ''}." Click any DNA signal to inspect the repositories supporting it.
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
