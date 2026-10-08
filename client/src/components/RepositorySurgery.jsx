import React, { useState } from 'react';
import { Stethoscope, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink, Star, GitFork } from 'lucide-react';
import './ReportComponents.css';

export default function RepositorySurgery({ repoSurgery, user }) {
  const reports = repoSurgery || [];

  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeRepo = reports[selectedIdx] || reports[0];

  return (
    <section id="repository-surgery" className="report-section">
      <div className="section-header">
        <div className="section-eyebrow green">
          <Stethoscope size={14} />
          <span>FEATURE 04 — REPOSITORY SURGERY 🩺</span>
        </div>
        <h2 className="section-title">
          YOUR PROJECTS NEED A <em>CHECKUP.</em>
        </h2>
        <p className="section-desc">
          Individual project health scores, diagnostic findings, and actionable prescriptions for @{user?.login || 'username'}'s top repositories.
        </p>
      </div>

      <div className="surgery-layout">
        {/* Repo selector list */}
        <div className="surgery-repo-list">
          <div className="repo-list-title">SELECT PROJECT TO DIAGNOSE</div>
          {reports.map((repo, idx) => (
            <button
              key={idx}
              className={`repo-item-btn ${idx === selectedIdx ? 'active' : ''}`}
              onClick={() => setSelectedIdx(idx)}
            >
              <div className="repo-item-meta">
                <span className="repo-name">{repo.name}</span>
                <span className="repo-lang">{repo.language}</span>
              </div>
              <div className="repo-item-score">
                <span className={`health-badge ${repo.overallHealth >= 80 ? 'green' : repo.overallHealth >= 60 ? 'warning' : 'danger'}`}>
                  {repo.overallHealth} / 100
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Repo Diagnosis Card */}
        {activeRepo && (
          <div className="surgery-diagnosis-card">
            <div className="surgery-header-bar">
              <div>
                <h3 className="active-repo-name">{activeRepo.name}</h3>
                <div className="active-repo-tags">
                  <span className="lang-tag">{activeRepo.language}</span>
                  {activeRepo.stars > 0 && <span className="stat-tag"><Star size={12} /> {activeRepo.stars}</span>}
                  {activeRepo.forks > 0 && <span className="stat-tag"><GitFork size={12} /> {activeRepo.forks}</span>}
                  {activeRepo.homepage && (
                    <a href={activeRepo.homepage} target="_blank" rel="noreferrer" className="demo-link">
                      <ExternalLink size={12} /> Live Demo
                    </a>
                  )}
                </div>
              </div>
              <div className="overall-score-box">
                <span className="score-lbl">PROJECT HEALTH</span>
                <span className="score-val">{activeRepo.overallHealth} <span>/ 100</span></span>
              </div>
            </div>

            {/* Health Breakdown Bars */}
            <div className="health-bars-grid">
              {Object.entries(activeRepo.breakdown || {}).map(([key, val]) => {
                const blocksCount = Math.round((val / 100) * 10);
                const filled = '█'.repeat(blocksCount);
                const empty = '░'.repeat(10 - blocksCount);
                return (
                  <div key={key} className="health-bar-row">
                    <span className="lbl">{key.toUpperCase()}</span>
                    <span className="blocks">{filled}<span className="empty-blocks">{empty}</span></span>
                    <span className="val">{val}</span>
                  </div>
                );
              })}
            </div>

            {/* Diagnosis: Strong vs Weak */}
            <div className="diagnosis-split">
              <div className="diag-box green">
                <div className="diag-title">
                  <CheckCircle2 size={15} />
                  <span>STRONG</span>
                </div>
                <ul>
                  {(activeRepo.diagnosis?.strong || []).map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>

              <div className="diag-box warning">
                <div className="diag-title">
                  <AlertTriangle size={15} />
                  <span>WEAK</span>
                </div>
                <ul>
                  {(activeRepo.diagnosis?.weak || []).map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Prescription */}
            <div className="prescription-box">
              <div className="presc-title">PRESCRIPTION</div>
              <ol className="presc-list">
                {(activeRepo.prescription || []).map((item, i) => (
                  <li key={i}>
                    <span className="num">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
