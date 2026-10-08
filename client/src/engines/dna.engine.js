/**
 * DNA Engine for ROAST / RESCUE
 * Generates the Developer DNA 🧬 metrics, Archetype, and Visual Parameters.
 */

const FRONTEND_LANGS = ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue', 'Svelte', 'Astro'];
const BACKEND_LANGS = ['Python', 'Java', 'Go', 'Rust', 'C#', 'PHP', 'C++', 'Ruby', 'Elixir', 'Kotlin', 'Scala'];
const AI_LANGS = ['Python', 'Jupyter Notebook', 'R', 'Cuda', 'Julia', 'C++'];
const CLOUD_LANGS = ['Go', 'Shell', 'Dockerfile', 'HCL', 'Makefile', 'PowerShell', 'YAML'];

export function generateDeveloperDNA(profile, repos, baseMetrics) {
  const { languageCounts, repoCount, totalStars, totalForks, activityScore, docScore, licenseRatio } = baseMetrics;

  let feCount = 0;
  let beCount = 0;
  let aiCount = 0;
  let cloudCount = 0;

  repos.forEach((repo) => {
    const lang = repo.language;
    const desc = (repo.description || '').toLowerCase();
    const topics = (repo.topics || []).map((t) => t.toLowerCase());
    const name = (repo.name || '').toLowerCase();

    if (lang && FRONTEND_LANGS.includes(lang)) feCount++;
    if (lang && BACKEND_LANGS.includes(lang)) beCount++;
    if (lang && AI_LANGS.includes(lang)) aiCount++;
    if (lang && CLOUD_LANGS.includes(lang)) cloudCount++;

    // Keyword detection in description, topics, name
    if (topics.some((t) => ['react', 'vue', 'nextjs', 'frontend', 'tailwind', 'ui', 'css'].includes(t)) ||
        desc.includes('frontend') || desc.includes('ui') || desc.includes('react')) {
      feCount += 0.5;
    }
    if (topics.some((t) => ['express', 'node', 'api', 'backend', 'django', 'spring', 'postgres', 'mongo'].includes(t)) ||
        desc.includes('api') || desc.includes('backend') || desc.includes('server') || desc.includes('database')) {
      beCount += 0.5;
    }
    if (topics.some((t) => ['machine-learning', 'ai', 'deep-learning', 'pytorch', 'tensorflow', 'llm', 'nlp'].includes(t)) ||
        desc.includes('machine learning') || desc.includes('ai') || desc.includes('neural') || desc.includes('model')) {
      aiCount += 1.5;
    }
    if (topics.some((t) => ['docker', 'kubernetes', 'aws', 'gcp', 'cloud', 'devops', 'terraform'].includes(t)) ||
        desc.includes('docker') || desc.includes('cloud') || desc.includes('k8s') || desc.includes('deploy')) {
      cloudCount += 1.5;
    }
  });

  const totalPoints = Math.max(1, feCount + beCount + aiCount + cloudCount);

  // Sub-scores normalization (30-98 range for realistic Developer DNA profile)
  const calcScore = (count, maxCap = 8) => Math.min(98, Math.max(25, Math.round(35 + (count / maxCap) * 55)));

  const frontend = calcScore(feCount, 6);
  const backend = calcScore(beCount, 6);
  const aiMl = calcScore(aiCount, 4);
  const cloud = calcScore(cloudCount, 4);

  // Open Source score (Stars, Forks, PRs, public contributions)
  const openSource = Math.min(98, Math.max(20, Math.round(30 + totalStars * 3 + totalForks * 4 + licenseRatio * 0.3)));
  
  // Documentation score from base metrics
  const documentation = Math.min(98, Math.max(30, Math.round(docScore * 0.8 + 15)));

  // Activity score from base metrics
  const activity = Math.min(98, Math.max(35, Math.round(activityScore)));

  const dnaScores = {
    Frontend: frontend,
    Backend: backend,
    'AI / ML': aiMl,
    Cloud: cloud,
    'Open Source': openSource,
    Documentation: documentation,
    Activity: activity,
  };


  const evidence = {
    Frontend: repos.filter((r) => FRONTEND_LANGS.includes(r.language) || /frontend|react|vue|next|tailwind|ui/i.test(`${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`)).slice(0, 5).map((r) => r.name),
    Backend: repos.filter((r) => BACKEND_LANGS.includes(r.language) || /backend|api|server|database|node|express|django|spring|mongo|postgres/i.test(`${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`)).slice(0, 5).map((r) => r.name),
    'AI / ML': repos.filter((r) => AI_LANGS.includes(r.language) || /machine[- ]learning|ai|deep[- ]learning|pytorch|tensorflow|llm|nlp|model/i.test(`${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`)).slice(0, 5).map((r) => r.name),
    Cloud: repos.filter((r) => CLOUD_LANGS.includes(r.language) || /docker|kubernetes|aws|gcp|cloud|devops|terraform|deploy/i.test(`${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`)).slice(0, 5).map((r) => r.name),
    'Open Source': repos.filter((r) => (r.stargazers_count || 0) > 0 || (r.forks_count || 0) > 0).sort((a, b) => ((b.stargazers_count || 0) + (b.forks_count || 0)) - ((a.stargazers_count || 0) + (a.forks_count || 0))).slice(0, 5).map((r) => r.name),
    Documentation: repos.filter((r) => r.readmeEvidence?.exists).sort((a, b) => (b.readmeEvidence?.length || 0) - (a.readmeEvidence?.length || 0)).slice(0, 5).map((r) => r.name),
    Activity: repos.filter((r) => r.pushed_at || r.updated_at).sort((a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at)).slice(0, 5).map((r) => r.name),
  };

  // Determine Archetype based on highest scores
  let archetype = 'FULL-STACK BUILDER';
  if (aiMl >= 75 && aiMl > frontend && aiMl > backend) {
    archetype = 'AI / DATA SPECIALIST';
  } else if (frontend >= 80 && frontend > backend + 15) {
    archetype = 'FRONTEND SPECIALIST';
  } else if (backend >= 80 && backend > frontend + 15) {
    archetype = 'BACKEND ARCHITECT';
  } else if (cloud >= 75 && cloud > frontend && cloud > backend) {
    archetype = 'CLOUD & DEVOPS ARCHITECT';
  } else if (openSource >= 80 && totalStars > 15) {
    archetype = 'OPEN SOURCE CONTRIBUTOR';
  } else if (frontend >= 70 && backend >= 70) {
    archetype = 'FULL-STACK BUILDER';
  } else {
    archetype = 'SOFTWARE ENGINEER';
  }

  // Visual parameters for Three.js / Canvas rendering
  const visualInfluence = {
    helixDensity: Math.round((backend + frontend) / 2),
    bondDensity: Math.round((frontend + cloud + aiMl) / 3),
    nodeActivity: activity,
    strandStability: Math.round((documentation + openSource) / 2),
    segmentIntensity: Math.round((frontend + backend + aiMl + cloud) / 4),
    movement: activity >= 75 ? 'HIGH' : activity >= 50 ? 'MEDIUM' : 'STABLE',
  };

  return {
    archetype,
    dnaScores,
    visualInfluence,
    evidence,
  };
}
