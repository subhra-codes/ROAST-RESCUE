import React from 'react';
import { CheckCircle2, AlertTriangle, Quote, ShieldCheck } from 'lucide-react';
import './ReportComponents.css';

export default function RecruiterLens({ data, user }) {
  const { firstImpressionScore, strongSignals, weakSignals, recruiterVerdict } = data || {};
  const score = Number.isFinite(firstImpressionScore) ? firstImpressionScore : 0;

  // Color grade based on score
  const scoreColor = score >= 80 ? '#7CFF6B' : score >= 65 ? '#FFB84D' : '#FF5C5C';

  return (
    <section id="recruiter-lens" className="report-section">
      <div className="section-header">
        <div className="section-eyebrow">
          <ShieldCheck size={14} />
          <span>FEATURE 01 — RECRUITER 30-SECOND LENS</span>
        </div>
        <h2 className="section-title">
          YOUR GITHUB RECRUITER REPORT<span>.</span>
        </h2>
        <p className="section-desc">
          If a technical recruiter opened @{user?.login || 'username'} for 30 seconds, here is what they would notice first.
        </p>
      </div>

      <div className="recruiter-grid">
        {/* Main Score Card */}
        <div className="score-card">
          <div className="score-label">FIRST IMPRESSION SCORE</div>
          <div className="score-circle-wrapper">
            <svg className="score-circle-svg" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" className="score-bg" />
              <circle
                cx="60"
                cy="60"
                r="52"
                className="score-fg"
                style={{
                  strokeDasharray: 326,
                  strokeDashoffset: 326 - (326 * score) / 100,
                  stroke: scoreColor,
                }}
              />
            </svg>
            <div className="score-number-display">
              <span className="score-value" style={{ color: scoreColor }}>{score}</span>
              <span className="score-denom">/ 100</span>
            </div>
          </div>
          <div className="score-status-badge">
            {score >= 80 ? 'HIGH RECRUITER APPEAL' : score >= 65 ? 'MODERATE RECRUITER APPEAL' : 'NEEDS IMMEDIATE RESCUE'}
          </div>
        </div>

        {/* Signals Column */}
        <div className="signals-card">
          <div className="signals-group">
            <div className="signals-group-title green">
              <CheckCircle2 size={16} />
              <span>STRONG SIGNALS</span>
            </div>
            <ul className="signals-list">
              {(strongSignals || []).map((signal, idx) => (
                <li key={idx} className="signal-item strong">
                  <span className="bullet">✓</span>
                  <span>{signal.replace(/^✓\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="signals-group">
            <div className="signals-group-title warning">
              <AlertTriangle size={16} />
              <span>WEAK SIGNALS</span>
            </div>
            <ul className="signals-list">
              {(weakSignals || []).map((signal, idx) => (
                <li key={idx} className="signal-item weak">
                  <span className="bullet">⚠</span>
                  <span>{signal.replace(/^⚠\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recruiter Verdict Card */}
        <div className="verdict-card">
          <div className="verdict-header">
            <Quote size={20} className="verdict-icon" />
            <span>RECRUITER VERDICT</span>
          </div>
          <blockquote className="verdict-text">
            "{recruiterVerdict || 'No recruiter simulation is available yet.'}"
          </blockquote>
          <div className="verdict-footer">
            <span className="notice-tag">NOTE</span>
            <span>Simulated lens based on observable public GitHub signals and deterministic scoring.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
