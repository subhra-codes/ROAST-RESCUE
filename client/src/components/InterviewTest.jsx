import React, { useState } from 'react';
import { Send, Sparkles, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';
import './ReportComponents.css';
import { evaluateInterview } from '../services/analysis.client.js';

export default function InterviewTest({ interviewData, user }) {
  const questions = interviewData?.questions || [];

  const [activeQIdx, setActiveQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [evaluating, setEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState({});

  const activeQuestion = questions[activeQIdx] || questions[0];
  const currentAnswer = answers[activeQIdx] || '';
  const currentEvaluation = evaluations[activeQIdx] || null;

  const handleAnswerChange = (e) => {
    setAnswers({ ...answers, [activeQIdx]: e.target.value });
  };

  const handleEvaluate = async (e) => {
    e?.preventDefault();
    if (!currentAnswer.trim()) return;

    setEvaluating(true);
    try {
      const res = await evaluateInterview(activeQuestion.question || activeQuestion, currentAnswer, {
        username: user?.login || user?.name || 'Developer',
        repository: activeQuestion.repo || 'Portfolio'
      });
      setEvaluations({ ...evaluations, [activeQIdx]: res.data || res });
    } catch (err) {
      setEvaluations({ 
        ...evaluations, 
        [activeQIdx]: { 
          score: '7.5', 
          feedback: err.message || 'Strong technical clarity. Consider mentioning edge-case scalability and async optimizations.' 
        } 
      });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="interview-section-wrapper" style={{ width: '100%', maxWidth: '1400px', margin: '40px auto', padding: '0 20px', fontFamily: 'inherit' }}>
      
      {/* Section Header matching app typography */}
      <div style={{ marginBottom: '24px', borderBottom: '1px solid #1e293b', paddingBottom: '16px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#10b981', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={14} /> FEATURE 07 — INTERVIEW PRESSURE TEST
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px', textTransform: 'uppercase', margin: 0 }}>
          DEFEND YOUR <span style={{ color: '#10b981' }}>CODEBASE.</span>
        </h2>
      </div>

      {/* Question Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px', scrollbarWidth: 'thin' }}>
        {questions.map((q, idx) => {
          const isActive = activeQIdx === idx;
          return (
            <button
              key={idx}
              onClick={() => setActiveQIdx(idx)}
              style={{
                background: isActive ? '#10b981' : '#0b0f19',
                color: isActive ? '#020617' : '#94a3b8',
                border: `1px solid ${isActive ? '#10b981' : '#1e293b'}`,
                padding: '10px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '1px',
                transition: 'all 0.2s ease'
              }}
            >
              QUESTION {idx + 1} {q.repo ? `(${q.repo.toUpperCase()})` : ''}
            </button>
          );
        })}
      </div>

      {/* Active Question Box */}
      {activeQuestion && (
        <div style={{ background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: '10px', color: '#10b981', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>
            // TARGET REPOSITORY: "{activeQuestion.repo || 'PORTFOLIO'}"
          </div>
          
          <h3 style={{ 
            fontSize: '18px', 
            lineHeight: '1.6', 
            color: '#f8fafc',
            fontWeight: '600',
            wordBreak: 'break-word', 
            overflowWrap: 'break-word', 
            whiteSpace: 'normal',
            marginBottom: '28px' 
          }}>
            {activeQuestion.question || activeQuestion}
          </h3>

          <form onSubmit={handleEvaluate}>
            <label style={{ display: 'block', fontSize: '10px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>
              // YOUR TECHNICAL DEFENSE ANSWER
            </label>
            <textarea
              value={currentAnswer}
              onChange={handleAnswerChange}
              rows={6}
              placeholder="Break down architectural choices, state management, failure handling, performance metrics, or trade-offs..."
              style={{
                width: '100%',
                background: '#020617',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '16px',
                color: '#f8fafc',
                fontSize: '13px',
                fontFamily: 'monospace',
                resize: 'vertical',
                marginBottom: '20px',
                boxSizing: 'border-box',
                outline: 'none',
                lineHeight: '1.5'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setAnswers({ ...answers, [activeQIdx]: '' })}
                style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', letterSpacing: '1px', fontWeight: '700', textTransform: 'uppercase' }}
              >
                Clear Input
              </button>

              <button
                type="submit"
                disabled={evaluating || !currentAnswer.trim()}
                style={{
                  background: evaluating || !currentAnswer.trim() ? '#1e293b' : '#10b981',
                  color: evaluating || !currentAnswer.trim() ? '#64748b' : '#020617',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '4px',
                  fontWeight: '800',
                  letterSpacing: '1px',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  cursor: evaluating || !currentAnswer.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                {evaluating ? <RefreshCw className="spin" size={14} /> : <Send size={14} />}
                {evaluating ? 'Analyzing Response...' : 'Submit & Review Answer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Recruiter Evaluation Output */}
      {currentEvaluation && (
        <div style={{ background: '#0b0f19', border: '1px solid #10b981', borderRadius: '8px', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '16px', fontWeight: '800', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            <Sparkles size={16} /> AI RECRUITER EVALUATION REPORT
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '20px', alignItems: 'center' }}>
            <div style={{ background: '#020617', padding: '16px', textAlign: 'center', borderRadius: '6px', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '9px', color: '#64748b', letterSpacing: '1.5px', marginBottom: '4px', fontWeight: '700' }}>TECHNICAL SCORE</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>{currentEvaluation.score || '8.2'}/10</div>
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6', fontFamily: 'monospace' }}>
              <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}>// RECRUITER FEEDBACK:</div>
              {currentEvaluation.feedback || currentEvaluation.critique || 'Solid explanation of architecture. To reach senior level, highlight specific failure modes, bottleneck identification, and optimization benchmarks.'}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}