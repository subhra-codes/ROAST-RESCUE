/**
 * Health Engine for ROAST / RESCUE
 * Calculates individual repository health scores, diagnoses, and prescriptions.
 */

export function analyzeRepoHealth(repo) {
  const name = repo.name || 'Untitled Project';
  const desc = (repo.description || '').trim();
  const homepage = (repo.homepage || '').trim();
  const topics = repo.topics || [];
  const language = repo.language || 'Unknown';
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const size = repo.size || 0;
  const readme = repo.readmeEvidence || null;

  const now = new Date();
  const updatedAt = new Date(repo.pushed_at || repo.updated_at || repo.created_at);
  const hasActivityDate = !Number.isNaN(updatedAt.getTime());
  const monthsDiff = hasActivityDate ? (now - updatedAt) / (1000 * 60 * 60 * 24 * 30.44) : null;

  // 1. Activity (0 - 100). Unknown dates are treated conservatively.
  let activityScore = hasActivityDate ? 95 - Math.min(75, Math.max(0, Math.round(monthsDiff * 6))) : 35;
  if (activityScore < 20) activityScore = 20;

  // 2. README & Docs (0 - 100)
  let readmeScore = readme?.exists ? 45 : 15;
  if (readme?.length >= 400) readmeScore += 15;
  if (readme?.hasInstall) readmeScore += 8;
  if (readme?.hasUsage) readmeScore += 7;
  if (readme?.hasFeatures) readmeScore += 5;
  if (readme?.hasTechStack) readmeScore += 5;
  if (readme?.hasArchitecture) readmeScore += 10;
  if (repo.has_wiki || repo.has_pages) readmeScore += 5;
  readmeScore = Math.min(100, readmeScore);

  // 3. Presentation (0 - 100)
  let presentationScore = 40;
  if (desc.length > 10) presentationScore += 25;
  if (homepage) presentationScore += 25;
  if (topics.length >= 2) presentationScore += 10;

  // 4. Completeness (0 - 100)
  let completenessScore = size > 50 ? 75 : 45;
  if (language !== 'Unknown') completenessScore += 15;
  if (stars > 0 || forks > 0) completenessScore += 10;
  completenessScore = Math.min(100, completenessScore);

  // 5. Documentation (0 - 100)
  let docScore = Math.round((readmeScore + presentationScore) / 2);

  const overallHealth = Math.round(
    activityScore * 0.25 +
    readmeScore * 0.25 +
    presentationScore * 0.2 +
    completenessScore * 0.15 +
    docScore * 0.15
  );

  // Diagnosis
  const strongPoints = [];
  const weakPoints = [];

  if (!hasActivityDate) weakPoints.push('⚠ Recent activity date could not be verified from the public repository listing');
  else if (activityScore >= 70) strongPoints.push('✓ Active development');
  else weakPoints.push('⚠ Project inactive for over 6 months');

  if (language !== 'Unknown') strongPoints.push(`✓ Clear technology stack (${language})`);
  else weakPoints.push('⚠ Primary language not detected');

  if (desc.length > 15) strongPoints.push('✓ Concise project description');
  else weakPoints.push('⚠ Missing or vague repository description');

  if (readme?.exists && readme.length >= 400) strongPoints.push('✓ README contains substantial documentation');
  else weakPoints.push('⚠ README is missing or too thin for a strong project presentation');

  if (homepage) strongPoints.push('✓ Live deployment / demo link attached');
  else weakPoints.push('⚠ No live demo or deployment link provided');

  if (topics.length > 0) strongPoints.push('✓ Relevant topic tags configured');
  else weakPoints.push('⚠ Repository topics are not configured');

  // Ensure balanced diagnosis lists
  if (strongPoints.length === 0) strongPoints.push('✓ Repository uploaded to GitHub');
  if (weakPoints.length === 0) weakPoints.push('⚠ License file not detected');

  // Prescription
  const prescription = [
    homepage ? 'Maintain and update live demo environment' : 'Add live demo / production deployment link in repository header',
    readme?.hasArchitecture ? 'Document key technical decisions and trade-offs in the README' : 'Structure README with installation guide, architecture diagram, and features',
    topics.length > 0 ? 'Add technical benchmarks or performance metrics' : 'Add relevant topic tags to improve discoverability',
    'Explain technical choices & architectural decisions in the documentation',
  ];

  return {
    name,
    language,
    stars,
    forks,
    homepage,
    overallHealth,
    breakdown: {
      Activity: activityScore,
      README: readmeScore,
      Presentation: presentationScore,
      Completeness: completenessScore,
      Documentation: docScore,
    },
    diagnosis: {
      strong: strongPoints.slice(0, 3),
      weak: weakPoints.slice(0, 3),
    },
    prescription,
  };
}
