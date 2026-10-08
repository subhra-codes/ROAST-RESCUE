/**
 * Analysis Controller for ROAST / RESCUE
 * Handles full GitHub Career Intelligence pipeline, profile comparison, and interview evaluation.
 */

import { fetchGitHubData } from '../services/github.service.js';
import { calculateBaseMetrics } from '../engines/scoring.engine.js';
import { generateDeveloperDNA } from '../engines/dna.engine.js';
import { analyzeRepoHealth } from '../engines/health.engine.js';
import { simulateRecruiterLens } from '../engines/recruiter.engine.js';
import {
  generateEvidenceRoasts,
  generateInterviewQuestions,
  evaluateInterviewAnswer,
} from '../services/ai.service.js';

export async function getProfileAnalysis(req, res) {
  try {
    const { username } = req.params;
    const { profile, repositories, events, pinnedRepositories, rateLimit } = await fetchGitHubData(username);

    // Keep profile counters consistent with the evidence actually collected.
    // This prevents the public-web fallback from showing a false 0 while the
    // repository collector has successfully recovered real repositories.
    const ownedRepositoryCount = repositories.filter((repo) => !repo.fork).length;
    if (!Number.isFinite(Number(profile.public_repos)) || Number(profile.public_repos) < ownedRepositoryCount) {
      profile.public_repos = ownedRepositoryCount;
    }

    // 1. Base Metrics
    const baseMetrics = calculateBaseMetrics(profile, repositories, events, pinnedRepositories);

    // 2. Developer DNA
    const dna = generateDeveloperDNA(profile, repositories, baseMetrics);

    // 3. Repository Surgery — expose every recovered public repository so the user
    // can navigate the complete project history instead of an arbitrary top-six slice.
    const topRepos = repositories
      .filter((r) => !r.fork)
      .slice()
      .sort((a, b) => {
        const aDate = new Date(a.pushed_at || a.updated_at || a.created_at).getTime() || 0;
        const bDate = new Date(b.pushed_at || b.updated_at || b.created_at).getTime() || 0;
        return bDate - aDate;
      })
      .map((r) => analyzeRepoHealth(r));

    // 4. Recruiter Lens
    const recruiterLens = simulateRecruiterLens(profile, repositories, baseMetrics, dna);

    // 5. Evidence-based Roasts
    const roasts = generateEvidenceRoasts(profile, repositories, baseMetrics, topRepos);

    // 6. Rescue Simulator Metrics
    const currentScore = recruiterLens.firstImpressionScore;
    const rescueFixes = [
      { id: 'readme', label: 'IMPROVE README QUALITY', boost: Math.min(10, Math.max(0, Math.round((100 - baseMetrics.readmeQuality) * 0.15))), desc: 'Add architecture, setup, usage, and technical decision evidence to the strongest projects.' },
      { id: 'curate', label: 'CURATE PINNED REPOSITORIES', boost: baseMetrics.pinnedDataAvailable ? Math.min(7, Math.max(0, 6 - baseMetrics.pinnedRepoCount)) : 0, desc: 'Pin the strongest repositories that best communicate your target engineering profile.' },
      { id: 'demos', label: 'ADD PROJECT DEMOS', boost: Math.min(7, Math.max(0, Math.round((100 - baseMetrics.homepageRatio) * 0.07))), desc: 'Deploy suitable projects and attach live links to their GitHub metadata.' },
      { id: 'archive', label: 'ARCHIVE DEAD PROJECTS', boost: Math.min(5, Math.max(0, Math.round(baseMetrics.inactiveReposCount * 0.6))), desc: 'Archive or de-emphasize inactive low-value projects so strong work is easier to evaluate.' },
      { id: 'bio', label: 'IMPROVE PROFILE BIO', boost: Math.min(4, Math.max(0, Math.round((100 - baseMetrics.profileCompleteness) * 0.04))), desc: 'Write a concise role-focused bio and complete the profile metadata that supports your target role.' },
    ].filter((fix) => fix.boost > 0);
    const maxBoost = rescueFixes.reduce((acc, f) => acc + f.boost, 0);
    const potentialScore = Math.min(99, currentScore + maxBoost);

    // 7. Interview Pressure Test Questions
    const interviewQuestions = generateInterviewQuestions(repositories, baseMetrics);

    res.json({
      user: {
        login: profile.login,
        name: profile.name || profile.login,
        avatar_url: profile.avatar_url,
        bio: profile.bio || '',
        location: profile.location || '',
        public_repos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
        created_at: profile.created_at,
        html_url: profile.html_url,
      },
      metrics: baseMetrics,
      recruiterLens,
      dna,
      roasts,
      repoSurgery: topRepos,
      rescue: {
        currentScore,
        potentialScore,
        fixes: rescueFixes,
      },
      interview: {
        questions: interviewQuestions,
      },
      evidence: {
        pinnedRepositories,
        analyzedReadmes: baseMetrics.readmeEvidenceAnalyzed,
        readmeQuality: baseMetrics.readmeQuality,
        dataSource: rateLimit?.mode === 'public-web-fallback'
          ? 'GitHub public web fallback'
          : `GitHub ${rateLimit?.authenticated ? 'authenticated ' : 'public '}REST API`,
      },
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message || 'Analysis failed.',
      code: status === 404 ? 'GITHUB_USER_NOT_FOUND' : status === 429 ? 'GITHUB_RATE_LIMIT' : 'ANALYSIS_FAILED',
      resetAt: error.resetAt || null,
    });
  }
}

export async function compareProfiles(req, res) {
  try {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'Both user1 and user2 query parameters are required.' });
    }

    if (String(user1).trim().toLowerCase() === String(user2).trim().toLowerCase()) {
      return res.status(400).json({ error: 'Choose a different GitHub profile to compare against your own.' });
    }

    const data1 = await fetchGitHubData(user1);
    const data2 = await fetchGitHubData(user2);

    const base1 = calculateBaseMetrics(data1.profile, data1.repositories, data1.events, data1.pinnedRepositories);
    const base2 = calculateBaseMetrics(data2.profile, data2.repositories, data2.events, data2.pinnedRepositories);

    const dna1 = generateDeveloperDNA(data1.profile, data1.repositories, base1);
    const dna2 = generateDeveloperDNA(data2.profile, data2.repositories, base2);

    // Find differentiators
    const scores1 = dna1.dnaScores;
    const scores2 = dna2.dnaScores;

    let maxDiffKey1 = 'Backend';
    let maxDiffVal1 = -999;
    let maxDiffKey2 = 'Frontend';
    let maxDiffVal2 = -999;

    Object.keys(scores1).forEach((key) => {
      const diff1 = scores1[key] - scores2[key];
      if (diff1 > maxDiffVal1) {
        maxDiffVal1 = diff1;
        maxDiffKey1 = key;
      }
      const diff2 = scores2[key] - scores1[key];
      if (diff2 > maxDiffVal2) {
        maxDiffVal2 = diff2;
        maxDiffKey2 = key;
      }
    });

    const gapKey = maxDiffKey2;
    const gapAmount = Math.max(0, scores2[gapKey] - scores1[gapKey]);
    const yourEdgeAmount = Math.max(0, scores1[maxDiffKey1] - scores2[maxDiffKey1]);

    const comparison = gapAmount > 0
      ? {
          biggestGap: `${gapKey} evidence is your biggest relative weakness (-${gapAmount} pts).`,
          catchUpPlan: [
            `Build 1 high-quality ${gapKey} project featuring modern practices`,
            'Document project architecture and add deployment/demo links',
            'Include concrete technical results or benchmarks in README',
            'Make the repository portfolio-ready and pin it to your profile',
          ],
        }
      : {
          biggestGap: 'No major score gap favors the compared profile across the measured DNA dimensions.',
          catchUpPlan: [
            'Keep your strongest repositories actively maintained',
            'Document technical decisions and measurable outcomes',
            'Strengthen the lowest-scoring DNA dimension with project evidence',
            'Curate your profile so the strongest signal is immediately visible',
          ],
        };

    res.json({
      user1: {
        login: data1.profile.login,
        avatar_url: data1.profile.avatar_url,
        archetype: dna1.archetype,
        scores: scores1,
        differentiator: `${maxDiffKey1} is your strongest relative differentiator (+${yourEdgeAmount} pts).`,
      },
      user2: {
        login: data2.profile.login,
        avatar_url: data2.profile.avatar_url,
        archetype: dna2.archetype,
        scores: scores2,
        differentiator: `${maxDiffKey2} is their strongest relative differentiator (+${Math.max(0, scores2[maxDiffKey2] - scores1[maxDiffKey2])} pts).`,
      },
      comparison,
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message || 'Comparison failed.',
      code: status === 404 ? 'GITHUB_USER_NOT_FOUND' : status === 429 ? 'GITHUB_RATE_LIMIT' : 'COMPARISON_FAILED',
      resetAt: error.resetAt || null,
    });
  }
}

export function evaluateInterview(req, res) {
  try {
    const { question, answer } = req.body;
    const evaluation = evaluateInterviewAnswer(question, answer);
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ error: 'Evaluation failed.' });
  }
}
