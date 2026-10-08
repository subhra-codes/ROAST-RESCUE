import React, { useState } from 'react';
import { LifeBuoy, CheckSquare, Square, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import './ReportComponents.css';

export default function RescueSimulator({ rescue, user }) {
  const currentScore = Number.isFinite(rescue?.currentScore) ? rescue.currentScore : 0;
  const initialFixes = rescue?.fixes || [];

  // State to track applied fixes interactively
  const [selectedFixes, setSelectedFixes] = useState(
    initialFixes.map((f) => f.id) // all checked by default to show full potential
  );

  const toggleFix = (id) => {
    setSelectedFixes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const activeBoost = initialFixes
    .filter((f) => selectedFixes.includes(f.id))
    .reduce((acc, f) => acc + f.boost, 0);

  const simulatedScore = Math.min(99, currentScore + activeBoost);

  return (
    <section id="rescue-simulator" className="report-section">
      <div className="section-header">
        <div className="section-eyebrow green">
          <LifeBuoy size={14} />
          <span>FEATURE 05 — RESCUE SIMULATOR 🚑</span>
        </div>
        <h2 className="section-title">
          LET'S <em>FIX IT.</em>
        </h2>
        <p className="section-desc">
          Instead of just pointing out weaknesses, here is your prioritized rescue plan. Toggle actions to simulate your potential recruiter score boost.
        </p>
      </div>

      <div className="rescue-grid">
        {/* Interactive Fixes List */}
        <div className="rescue-fixes-card">
          <div className="card-subtitle">HIGH-IMPACT IMPROVEMENTS</div>
          <div className="fixes-list">
            {initialFixes.map((fix) => {
              const isChecked = selectedFixes.includes(fix.id);
              return (
                <div
                  key={fix.id}
                  className={`fix-row ${isChecked ? 'active' : ''}`}
                  onClick={() => toggleFix(fix.id)}
                >
                  <div className="fix-checkbox">
                    {isChecked ? <CheckSquare size={18} className="icon-checked" /> : <Square size={18} className="icon-unchecked" />}
                  </div>
                  <div className="fix-info">
                    <span className="fix-label">{fix.label}</span>
                    <span className="fix-desc">{fix.desc}</span>
                  </div>
                  <div className="fix-boost-badge">+{fix.boost} PTS</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score Transformation Card */}
        <div className="rescue-score-card">
          <div className="score-transformation-grid">
            <div className="trans-box current">
              <span className="trans-lbl">CURRENT PROFILE</span>
              <span className="trans-score">{currentScore}</span>
              <span className="trans-sub">BASE SCORE</span>
            </div>

            <div className="trans-arrow">
              <TrendingUp size={24} className="green" />
              <span className="boost-sum">+{activeBoost}</span>
            </div>

            <div className="trans-box potential">
              <span className="trans-lbl">POTENTIAL SCORE</span>
              <span className="trans-score green">{simulatedScore}</span>
              <span className="trans-sub">SIMULATED RECRUITER LENS</span>
            </div>
          </div>

          {/* Flow visual */}
          <div className="rescue-flow-diagram">
            <div className="flow-step">CURRENT ({currentScore})</div>
            <span className="flow-line">│</span>
            <div className="flow-step active">├── README & Documentation</div>
            <span className="flow-line">│</span>
            <div className="flow-step active">├── Project Curation & Demos</div>
            <span className="flow-line">│</span>
            <div className="flow-step active">├── Profile & Bio Optimization</div>
            <span className="flow-line">▼</span>
            <div className="flow-step final">POTENTIAL ({simulatedScore})</div>
          </div>

          <div className="rescue-disclaimer">
            <Sparkles size={14} className="green" />
            <span><strong>Potential Score</strong> simulates recruiter perception after implementing prioritized fixes.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
