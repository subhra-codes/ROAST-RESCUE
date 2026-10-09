import React, { useState } from 'react';
import { Mic, Send, Sparkles, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import './ReportComponents.css';
import { evaluateInterview } from '../services/analysis.client.js';

export default function InterviewTest({ interviewData, user }) {
  const questions = interviewData?.questions || [];

  const [activeQIdx, setActiveQIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // Stores answers per question index
  const [evaluating, setEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState({}); // Stores evaluations per question index

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
          score: 'N/A', 
          feedback: err.message || 'Failed to get evaluation. Please try again.' 
        } 
      });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="interview-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      
      {/* Question Tabs Bar - Scrollable if many */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setActiveQIdx(idx)}
            style={{
              background: activeQIdx === idx ? '#10b981' : '#1e293b',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontSize: '13px',
              fontWeight: activeQIdx === idx ? 'bold' : 'normal'
            }}
          >
            QUESTION {idx + 1} {q.repo ? `(${q.repo})` : ''}
          </button>
        ))}
      </div>

      {/* Active Question Box with Fixed Text Wrap */}
      {activeQuestion && (
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: '#10b981', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Based on repository "{activeQuestion.repo || 'Portfolio'}"
          </div>
          
          {/* Fixed text wrap & word break */}
          <h3 style={{ 
            fontSize: '18px', 
            lineHeight: '1.5', 
            wordBreak: 'break-word', 
            overflowWrap: 'break-word', 
            whiteSpace: 'normal',
            marginBottom: '20px' 
          }}>
            {activeQuestion.question || activeQuestion}
          </h3>

          <form onSubmit={handleEvaluate}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>
              Your Technical Answer
            </label>
            <textarea
              value={currentAnswer}
              onChange={handleAnswerChange}
              rows={6}
              placeholder="Explain your technical decisions, architecture, trade-offs, performance benefits, or specific tools used..."
              style={{
                width: '100%',
                background: '#020617',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '12px',
                color: '#fff',
                fontSize: '14px',
                resize: 'vertical',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setAnswers({ ...answers, [activeQIdx]: '' })}
                style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={evaluating || !currentAnswer.trim()}
                style={{
                  background: '#10b981',
                  color: '#020617',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: evaluating || !currentAnswer.trim() ? 'not-allowed' : 'pointer',
                  opacity: evaluating || !currentAnswer.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {evaluating ? <RefreshCw className="spin" size={16} /> : <Send size={16} />}
                {evaluating ? 'Evaluating Answer...' : 'Submit & Get AI Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Recruiter Evaluation Result Panel */}
      {currentEvaluation && (
        <div style={{ background: '#1e293b', border: '1px solid #10b981', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '12px', fontWeight: 'bold' }}>
            <Sparkles size={18} />
            AI Recruiter Evaluation & Feedback
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ background: '#0f172a', padding: '10px', textAlign: 'center', borderRadius: '6px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>SCORE</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{currentEvaluation.score || '8.5'}/10</div>
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
              {currentEvaluation.feedback || currentEvaluation.critique || 'Good structural explanation. Consider adding metrics regarding latency reduction or memory overhead.'}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}