/**
 * AI Service for ROAST / RESCUE
 * Generates evidence-backed roasts, interview pressure test questions, and evaluates candidate responses.
 */

export function generateEvidenceRoasts(profile, repos, baseMetrics) {
  const roasts = [];
  const { ownedRepoCount, inactiveReposCount, homepageRatio, profileCompleteness, docScore, readmeEvidenceAnalyzed, pinnedRepoCount, pinnedDataAvailable } = baseMetrics;
  const analyzed = Math.max(readmeEvidenceAnalyzed, 0);

  if (inactiveReposCount > 0) {
    roasts.push({
      id: 'commitment-issues',
      number: '01',
      title: 'YOUR REPOSITORIES HAVE COMMITMENT ISSUES.',
      evidence: `${inactiveReposCount} of ${ownedRepoCount} owned repositories have no push activity in the last 12 months.`,
      whyItMatters: 'A large inactive backlog can make strong work harder to find and can look like a collection of unfinished experiments.',
      rescue: 'Archive or de-emphasize low-value inactive projects and keep the strongest maintained work prominent.',
    });
  }

  if (docScore < 70 || analyzed > 0) {
    const weakReadmes = analyzed > 0 ? Math.max(0, analyzed - Math.round((baseMetrics.readmeQuality / 100) * analyzed)) : 0;
    roasts.push({
      id: 'unprepared-readme',
      number: '02',
      title: 'YOUR README WALKED INTO THE INTERVIEW WITHOUT PREPARING.',
      evidence: analyzed > 0
        ? `${weakReadmes} of ${analyzed} inspected README files fall short of the documentation signals this analyzer checks.`
        : 'README content could not be inspected for the strongest documentation signals.',
      whyItMatters: 'A recruiter should be able to understand the project, setup, stack, and purpose without reverse-engineering the repository.',
      rescue: 'Add a concise overview, features, tech stack, setup, usage, architecture, and demo evidence to your strongest repositories.',
    });
  }

  if (homepageRatio < 40) {
    roasts.push({
      id: 'ghost-deployments',
      number: '03',
      title: 'YOUR PROJECTS ARE LIVING IN HIDE-AND-SEEK MODE.',
      evidence: `${homepageRatio}% of owned repositories expose a homepage or deployment URL in GitHub metadata.`,
      whyItMatters: 'Hiring teams often evaluate a project before they are willing to clone it. A working demo makes the result immediately verifiable.',
      rescue: 'Deploy suitable projects and add their live URLs to the repository homepage field and README.',
    });
  }

  if (profileCompleteness < 80) {
    roasts.push({
      id: 'ghost-bio',
      number: '04',
      title: 'YOUR PROFILE BIO IS PLAYING THE SILENT TYPE.',
      evidence: !profile.bio?.trim()
        ? `@${profile.login} has no profile bio set on GitHub.`
        : `The profile completeness score is ${profileCompleteness}/100 based on observable profile metadata.`,
      whyItMatters: 'The profile header is one of the first places a recruiter can understand your role and technical positioning.',
      rescue: 'Write a concise role-focused bio and complete the supporting profile metadata that matters for your target role.',
    });
  }

  if (pinnedDataAvailable && pinnedRepoCount < 3) {
    roasts.push({
      id: 'portfolio-curation',
      number: String(Math.min(9, roasts.length + 1)).padStart(2, '0'),
      title: 'YOUR BEST WORK SHOULD NOT PLAY HIDE-AND-SEEK.',
      evidence: pinnedRepoCount === 0
        ? 'No pinned repositories were detected.'
        : `Only ${pinnedRepoCount} pinned repositories were detected.`,
      whyItMatters: 'Curation controls which projects a visitor sees before they browse the rest of the repository list.',
      rescue: 'Pin the projects that best demonstrate your target role, strongest engineering decisions, and clearest outcomes.',
    });
  }

  if (roasts.length === 0) {
    roasts.push({
      id: 'strong-signal',
      number: '01',
      title: 'YOUR GITHUB IS MAKING A PRETTY STRONG CASE.',
      evidence: `The observable profile signals combine to a documentation score of ${docScore}/100 with strong repository maintenance evidence.`,
      whyItMatters: 'Strong profiles still benefit from deliberate curation and keeping evidence current.',
      rescue: 'Keep the strongest repositories maintained, documented, deployed where appropriate, and aligned with your target role.',
    });
  }

  return roasts.slice(0, 5);
}

export function generateInterviewQuestions(repos) {
  const questions = [];
  const topRepos = repos
    .filter((repo) => !repo.fork)
    .slice()
    .sort((a, b) => {
      const aDate = new Date(a.pushed_at || a.updated_at || a.created_at || 0).getTime() || 0;
      const bDate = new Date(b.pushed_at || b.updated_at || b.created_at || 0).getTime() || 0;
      return bDate - aDate;
    })
    .slice(0, 5);

  const pushQuestion = (repo, type, question, contextExtra = '') => {
    questions.push({
      id: `q-${repo.id || repo.name}-${type}`,
      repoName: repo.name,
      question,
      context: `Based on repository "${repo.name}".${contextExtra}`,
    });
  };

  topRepos.forEach((repo) => {
    const name = repo.name;
    const lang = repo.language || 'the primary technology visible in this repository';
    const topics = (repo.topics || []).filter(Boolean).slice(0, 4);
    const stackHint = topics.length ? ` Technology signals include ${topics.join(', ')}.` : '';
    const readme = repo.readmeEvidence || {};
    const hasDemo = Boolean(repo.homepage) || Boolean(readme.hasDemo);

    pushQuestion(repo, 'architecture', `Walk me through the architecture of ${name}. Why did you choose ${lang}, what are the main components or data flows, and what trade-off does that architecture introduce?`, stackHint);

    if (hasDemo) {
      pushQuestion(repo, 'production', `${name} exposes a live/demo signal. What happens between a user request and the final response in production, and where would you look first if latency suddenly increased?`, stackHint);
    } else if (readme.hasArchitecture) {
      pushQuestion(repo, 'design', `Your README documents architecture for ${name}. Which architectural decision would you change first if the project had 10× more users, and why?`, stackHint);
    } else {
      pushQuestion(repo, 'scale', `If ${name} had 10× its current workload, what part of the system would become the bottleneck first and how would you prove that before changing the architecture?`, stackHint);
    }

    pushQuestion(repo, 'debugging', `Tell me about a failure or difficult bug you would expect in ${name}. How would you isolate the root cause, what logs or measurements would you inspect, and how would you verify the fix?`, stackHint);
    pushQuestion(repo, 'tradeoff', `What alternative implementation could have been used in ${name}, why did you reject it, and what measurable consequence did your final choice have?`, stackHint);

    if (readme.hasInstall || readme.hasUsage) {
      pushQuestion(repo, 'onboarding', `A new engineer joins the team and must run ${name} locally. Explain the setup path, the most important dependency or environment decision, and one improvement you would make to the developer experience.`, stackHint);
    }
  });

  if (questions.length === 0) {
    questions.push({
      id: 'q-default-architecture',
      repoName: 'General Architecture',
      question: 'Walk me through your most complex project. What architectural decision had the biggest impact, what trade-off did it introduce, and how did you validate the result?',
      context: 'Based on your public GitHub portfolio.',
    });
    questions.push({
      id: 'q-default-debugging',
      repoName: 'General Engineering',
      question: 'Describe a difficult technical problem you solved. How did you isolate the root cause, what evidence guided your decision, and how did you verify the final solution?',
      context: 'Based on your public GitHub portfolio.',
    });
  }

  return questions.slice(0, 12);
}

export function evaluateInterviewAnswer(questionObj, userAnswer) {
  const text = String(userAnswer || '').trim();
  const normalized = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (!text || wordCount < 5) {
    return {
      technicalDepth: 30,
      specificity: 25,
      clarity: 40,
      evidence: 20,
      overallScore: 28,
      verdict: 'Answer too brief.',
      feedback: 'Your answer was too short to demonstrate technical understanding. Explain the architecture, the reason for your choice, and what evidence supports it.',
    };
  }

  const techTerms = ['architecture', 'performance', 'cache', 'database', 'async', 'latency', 'schema', 'api', 'state', 'component', 'memory', 'query', 'scale', 'tradeoff', 'trade-off', 'test', 'docker', 'redux', 'mongo', 'postgres', 'redis', 'react', 'index', 'queue', 'error', 'failure', 'security'];
  const matches = techTerms.filter((term) => normalized.includes(term)).length;
  const hasWhy = /\b(because|reason|chose|trade[- ]off|instead|rather than)\b/i.test(text);
  const hasEvidence = /\b\d+(?:\.\d+)?\s*(?:%|ms|s|sec|x|requests|users|records|mb|gb)?\b/i.test(text);
  const hasConcreteAction = /\b(implemented|built|measured|tested|deployed|debugged|optimized|reduced|increased|designed|used|configured)\b/i.test(text);

  const technicalDepth = Math.min(95, Math.max(42, 44 + matches * 5 + (wordCount > 45 ? 10 : 0) + (hasWhy ? 8 : 0)));
  const specificity = Math.min(95, Math.max(38, 42 + matches * 5 + (hasConcreteAction ? 8 : 0) + (hasWhy ? 6 : 0)));
  const clarity = Math.min(95, Math.max(48, wordCount >= 20 && wordCount <= 150 ? 88 : wordCount > 150 ? 72 : 62));
  const evidence = Math.min(95, Math.max(30, 42 + (hasEvidence ? 38 : 0) + (hasConcreteAction ? 8 : 0)));

  const overallScore = Math.round(
    technicalDepth * 0.3 + specificity * 0.3 + clarity * 0.2 + evidence * 0.2
  );

  let feedback;
  if (overallScore >= 80) {
    feedback = 'Strong answer. You connected technical choices with rationale and supporting evidence. In a real interview, keep this level of specificity while staying concise.';
  } else if (overallScore >= 65) {
    feedback = 'Your answer has a solid technical foundation, but it would be stronger with a clearer trade-off, a concrete implementation detail, and measurable evidence where available.';
  } else {
    feedback = 'Your response covers the basics but lacks project-specific evidence. Explain WHY you chose the approach, what alternative you rejected, and what changed after implementation.';
  }

  return { technicalDepth, specificity, clarity, evidence, overallScore, feedback };
}
