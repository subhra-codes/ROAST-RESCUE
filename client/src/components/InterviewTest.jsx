import React, { useState } from 'react';
import { Mic, Send, Sparkles, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import './ReportComponents.css';
import { evaluateInterview } from '../services/analysis.client.js';

export default function InterviewTest({ interviewData, user }) {
  const questions = interviewData?.questions || [];

  const [activeQIdx, setActiveQIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const activeQuestion = questions[activeQIdx] || questions[0];

  const handleEvaluate = async (e) => {
    e?.preventDefault();
    if (!answer.trim()) return;

    setEvaluating(true);
    try {
      const data = evaluateInterview(activeQuestion, answer.trim());
      setEvaluation(data);
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const resetAnswer = () => {
    setAnswer('');
    setEvaluation(null);
  };

  return (
    <section id="interview-test" className="report-section">
      <div className="section-header">
        <div className="section-eyebrow green">
          <Mic size={14} />
          <span>FEATURE 07 — INTERVIEW PRESSURE TEST 🎤</span>
        </div>
        <h2 className="section-title">
          NOW DEFEND YOUR <em>GITHUB.</em>
        </h2>
        <p className="section-desc">
          We generate recruiter-level technical interview questions directly from your public repositories. Answer them to test your interview readiness.
        </p>
      </div>

      <div className="interview-grid">
        {/* Question Panel */}
        <div className="question-card">
          <div className="q-tabs">
            {questions.map((q, idx) => (
              <button
                key={q.id || idx}
                className={`q-tab-btn ${idx === activeQIdx ? 'active' : ''}`}
                onClick={() => {
                  setActiveQIdx(idx);
                  resetAnswer();
                }}
              >
                QUESTION {String(idx + 1).padStart(2, '0')} ({q.repoName})
              </button>
            ))}
          </div>

          <div className="q-body">
            <span className="q-context-tag">{activeQuestion.context}</span>
            <h3 className="q-title">"{activeQuestion.question}"</h3>
          </div>

          <form className="answer-form" onSubmit={handleEvaluate}>
            <label htmlFor="interview-answer-input">YOUR TECHNICAL ANSWER</label>
            <textarea
              id="interview-answer-input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Explain your technical decisions, architecture, trade-offs, performance benefits, or specific tools used..."
              rows={6}
            />
            <div className="answer-form-actions">
              <button type="button" className="btn-secondary" onClick={resetAnswer}>
                <RefreshCw size={14} /> CLEAR
              </button>
              <button type="submit" className="btn-primary" disabled={evaluating || !answer.trim()}>
                {evaluating ? 'EVALUATING ANSWER...' : 'SUBMIT ANSWER FOR EVALUATION'}
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Evaluation Output Panel */}
        <div className="evaluation-card">
          <div className="eval-card-header">
            <Sparkles size={16} className="green" />
            <span>AI RECRUITER EVALUATION</span>
          </div>

          {evaluation ? (
            <div className="eval-results">
              <div className="overall-eval-score">
                <span className="lbl">OVERALL SCORE</span>
                <span className={`score-num ${evaluation.overallScore >= 80 ? 'green' : evaluation.overallScore >= 60 ? 'warning' : 'danger'}`}>
                  {evaluation.overallScore} <span>/ 100</span>
                </span>
              </div>

              {/* Sub Metrics */}
              <div className="eval-metrics-grid">
                <div className="eval-metric-item">
                  <span className="lbl">TECHNICAL DEPTH</span>
                  <div className="bar"><div className="fill" style={{ width: `${evaluation.technicalDepth}%` }} /></div>
                  <span className="val">{evaluation.technicalDepth}</span>
                </div>
                <div className="eval-metric-item">
                  <span className="lbl">SPECIFICITY</span>
                  <div className="bar"><div className="fill" style={{ width: `${evaluation.specificity}%` }} /></div>
                  <span className="val">{evaluation.specificity}</span>
                </div>
                <div className="eval-metric-item">
                  <span className="lbl">CLARITY</span>
                  <div className="bar"><div className="fill" style={{ width: `${evaluation.clarity}%` }} /></div>
                  <span className="val">{evaluation.clarity}</span>
                </div>
                <div className="eval-metric-item">
                  <span className="lbl">EVIDENCE</span>
                  <div className="bar"><div className="fill" style={{ width: `${evaluation.evidence}%` }} /></div>
                  <span className="val">{evaluation.evidence}</span>
                </div>
              </div>

              {/* Feedback Critique */}
              <div className="eval-feedback-box">
                <div className="feedback-hdr">
                  <CheckCircle size={15} className="green" />
                  <span>RECRUITER FEEDBACK</span>
                </div>
                <p className="feedback-text">{evaluation.feedback}</p>
              </div>
            </div>
          ) : (
            <div className="eval-placeholder">
              <Mic size={36} className="placeholder-icon" />
              <p>Submit your answer above to receive real-time recruiter evaluation of your technical depth, clarity, and evidence.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
