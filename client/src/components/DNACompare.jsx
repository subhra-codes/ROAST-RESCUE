import React, { useState } from 'react';
import { Swords, Search, ArrowRight, ShieldAlert, Award, Zap } from 'lucide-react';
import './ReportComponents.css';
import { compareProfiles } from '../services/analysis.client.js';

export default function DNACompare({ currentUser, currentScores, currentArchetype }) {
  const [targetUsername, setTargetUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comparisonData, setComparisonData] = useState(null);

  const myScores = currentScores || {};

  const handleCompare = async (e) => {
    e?.preventDefault();
    if (!targetUsername.trim()) return;

    setLoading(true);
    setError('');

    try {
      const cleanUser = targetUsername.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/^@/, '').replace(/\/$/, '').split('/')[0];
      if (!/^[a-zA-Z0-9-]+$/.test(cleanUser) || cleanUser.length > 39) {
        throw new Error('Enter a valid GitHub username or profile URL.');
      }
      const data = await compareProfiles(currentUser, cleanUser);
      setComparisonData(data);
      setTargetUsername(cleanUser);
    } catch (err) {
      setError(err.message || 'Unable to fetch comparison data for that user.');
    } finally {
      setLoading(false);
    }
  };

  const otherScores = comparisonData?.user2?.scores || {};

  const otherUser = comparisonData?.user2?.login || targetUsername || 'SELECT PROFILE';
  const otherArchetype = comparisonData?.user2?.archetype || 'AWAITING COMPARISON';

  return (
    <section id="dna-compare" className="report-section">
      <div className="section-header">
        <div className="section-eyebrow green">
          <Swords size={14} />
          <span>FEATURE 06 — DNA COMPARE ⚔️</span>
        </div>
        <h2 className="section-title">
          TWO DEVELOPERS. <em>TWO SIGNALS.</em>
        </h2>
        <p className="section-desc">
          Compare your Developer DNA against another public GitHub profile or industry benchmark to discover your relative edge and gaps.
        </p>
      </div>

      {/* Comparison Input Form */}
      <form className="compare-input-form" onSubmit={handleCompare}>
        <div className="compare-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            placeholder="Enter rival or benchmark username (e.g. torvalds, gaearon)"
            aria-label="Compare GitHub username"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'COMPARING...' : 'COMPARE DNA'}
            <ArrowRight size={16} />
          </button>
        </div>
        {error && <div className="compare-error">{error}</div>}
      </form>

      <div className="compare-dual-grid">
        {/* Left Column: Your DNA */}
        <div className="compare-dna-card">
          <div className="card-user-header">
            <span className="user-tag">YOUR DNA</span>
            <h3 className="user-handle">@{currentUser || 'you'}</h3>
            <span className="archetype-pill">{currentArchetype || 'AWAITING ANALYSIS'}</span>
          </div>

          <div className="compare-bars-list">
            {Object.entries(myScores).map(([key, val]) => (
              <div key={key} className="compare-bar-row">
                <div className="bar-meta">
                  <span className="lbl">{key}</span>
                  <span className="val">{val}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill green" style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Other DNA */}
        <div className="compare-dna-card">
          <div className="card-user-header">
            <span className="user-tag target">COMPARED DNA</span>
            <h3 className="user-handle">@{otherUser}</h3>
            <span className="archetype-pill target">{otherArchetype}</span>
          </div>

          <div className="compare-bars-list">
            {Object.entries(otherScores).map(([key, val]) => (
              <div key={key} className="compare-bar-row">
                <div className="bar-meta">
                  <span className="lbl">{key}</span>
                  <span className="val">{val}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill target" style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Differentiators */}
      <div className="compare-analysis-grid">
        <div className="analysis-box green">
          <div className="box-header">
            <Award size={16} />
            <span>YOUR DIFFERENTIATOR</span>
          </div>
          <p className="box-body">
            {comparisonData?.user1?.differentiator || 'Compare another public profile to calculate your evidence-based differentiator.'}
          </p>
        </div>

        <div className="analysis-box target">
          <div className="box-header">
            <Zap size={16} />
            <span>THEIR DIFFERENTIATOR</span>
          </div>
          <p className="box-body">
            {comparisonData?.user2?.differentiator || "The compared profile's strongest observable signal will appear here."}
          </p>
        </div>

        <div className="analysis-box warning full-width">
          <div className="box-header">
            <ShieldAlert size={16} />
            <span>BIGGEST GAP & CATCH-UP PLAN</span>
          </div>
          <p className="box-body highlight">
            {comparisonData?.comparison?.biggestGap || 'Run a comparison to identify your biggest relative gap.'}
          </p>

          <ol className="catchup-list">
            {(comparisonData?.comparison?.catchUpPlan || [
              'Build 1 strong AI/ML or specialized technical project featuring clean architecture',
              'Document technical decisions and performance benchmarks in the README',
              'Attach live demo links or executable notebooks to demonstrate proof of work',
              'Make the repository portfolio-ready and pin it prominently to your profile',
            ]).map((step, idx) => (
              <li key={idx}>
                <span className="step-num">0{idx + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
