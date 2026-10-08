import React from 'react';
import { Flame, AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react';
import './ReportComponents.css';

export default function RoastSection({ roasts, user }) {
  const items = roasts || [
    {
      id: 'commitment-issues',
      number: '01',
      title: 'YOUR REPOSITORIES HAVE COMMITMENT ISSUES.',
      evidence: '9 of 23 repositories have received no commits in the last 12 months.',
      whyItMatters: 'Recruiters may interpret a large number of abandoned repositories as unfinished or experimental work.',
      rescue: 'Archive low-value repositories and highlight your strongest maintained projects.',
    },
    {
      id: 'unprepared-readme',
      number: '02',
      title: 'YOUR README WALKED INTO THE INTERVIEW WITHOUT PREPARING.',
      evidence: '8 of 14 analyzed repositories have no meaningful project documentation.',
      whyItMatters: 'Without a clear README, technical evaluators cannot verify your contribution or understand the project architecture.',
      rescue: 'Add a clean README template with installation instructions, features, and tech stack details.',
    },
  ];

  return (
    <section id="roast" className="report-section">
      <div className="section-header">
        <div className="section-eyebrow danger">
          <Flame size={14} />
          <span>FEATURE 03 — EVIDENCE-BASED ROAST 🔥</span>
        </div>
        <h2 className="section-title">
          OK. LET'S BE <em>HONEST.</em>
        </h2>
        <p className="section-desc">
          Every roast is strictly backed by actual GitHub evidence from @{user?.login || 'username'}. No random insults — only earned truths.
        </p>
      </div>

      <div className="roasts-list">
        {items.map((roast, index) => (
          <div key={roast.id || index} className="roast-card">
            <div className="roast-card-header">
              <span className="roast-number">{roast.number || `0${index + 1}`}</span>
              <h3 className="roast-title">{roast.title}</h3>
            </div>

            <div className="roast-evidence-box">
              <span className="evidence-badge">EVIDENCE</span>
              <p className="evidence-text">{roast.evidence}</p>
            </div>

            <div className="roast-details-grid">
              <div className="roast-detail-col">
                <div className="detail-header warning">
                  <HelpCircle size={14} />
                  <span>WHY IT MATTERS</span>
                </div>
                <p className="detail-text">{roast.whyItMatters}</p>
              </div>

              <div className="roast-detail-col">
                <div className="detail-header green">
                  <ShieldCheck size={14} />
                  <span>RESCUE STEP</span>
                </div>
                <p className="detail-text">{roast.rescue}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
