/**
 * Deterministic scoring engine for ROAST / RESCUE.
 * All core profile signals are calculated from observable GitHub data.
 */

function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateBaseMetrics(profile, repos, events = [], pinnedRepositories = []) {
  const repoCount = repos.length;
  const ownedRepos = repos.filter((repo) => !repo.fork);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  let totalStars = 0;
  let totalForks = 0;
  let reposWithDescription = 0;
  let reposWithHomepage = 0;
  let reposWithLicense = 0;
  let activeRepos12Months = 0;
  let readmeExists = 0;
  let readmeStrong = 0;
  let readmeInstall = 0;
  let readmeUsage = 0;
  let readmeFeatures = 0;
  let readmeTechStack = 0;
  let readmeArchitecture = 0;
  let readmeDemo = 0;

  ownedRepos.forEach((repo) => {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;

    if (repo.description?.trim().length > 5) reposWithDescription++;
    if (repo.homepage?.trim()) reposWithHomepage++;
    if (repo.license) reposWithLicense++;

    const updatedAt = safeDate(repo.pushed_at || repo.updated_at || repo.created_at);
    if (updatedAt && updatedAt >= oneYearAgo) activeRepos12Months++;

    const readme = repo.readmeEvidence;
    if (readme?.exists) {
      readmeExists++;
      if (readme.length >= 400) readmeStrong++;
      if (readme.hasInstall) readmeInstall++;
      if (readme.hasUsage) readmeUsage++;
      if (readme.hasFeatures) readmeFeatures++;
      if (readme.hasTechStack) readmeTechStack++;
      if (readme.hasArchitecture) readmeArchitecture++;
      if (readme.hasDemo) readmeDemo++;
    }
  });

  const denominator = Math.max(ownedRepos.length, 1);
  const descriptionRatio = reposWithDescription / denominator;
  const homepageRatio = reposWithHomepage / denominator;
  const licenseRatio = reposWithLicense / denominator;
  const activeRatio = ownedRepos.length > 0 ? activeRepos12Months / ownedRepos.length : 0;

  // Event activity is useful, but it should not overpower repository maintenance.
  const recentEvents = events.filter((event) => {
    const created = safeDate(event.created_at);
    return created && created >= oneYearAgo;
  }).length;
  const activityScore = ownedRepos.length === 0
    ? 20
    : Math.min(100, Math.round(activeRatio * 70 + Math.min(recentEvents, 50) * 0.6));

  const languageCounts = {};
  ownedRepos.forEach((repo) => {
    if (repo.language) languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
  });

  const uniqueLanguages = Object.keys(languageCounts);
  const techDiversityScore = Math.min(
    100,
    Math.round(uniqueLanguages.length * 12 + Math.min(ownedRepos.length, 10) * 3)
  );

  // README quality is based on actual README contents for the top maintained repositories,
  // not merely the presence of a repository description.
  const analyzedReadmes = ownedRepos.filter((repo) => repo.readmeEvidence).length;
  const readmeDenominator = Math.max(analyzedReadmes, 1);
  const readmeQuality = analyzedReadmes === 0 ? 0 : Math.round(
    (readmeExists / readmeDenominator) * 20 +
    (readmeStrong / readmeDenominator) * 20 +
    (readmeInstall / readmeDenominator) * 12 +
    (readmeUsage / readmeDenominator) * 10 +
    (readmeFeatures / readmeDenominator) * 10 +
    (readmeTechStack / readmeDenominator) * 10 +
    (readmeArchitecture / readmeDenominator) * 10 +
    (readmeDemo / readmeDenominator) * 8
  );

  const descriptionScore = Math.round(descriptionRatio * 100);
  const documentationScore = Math.round(
    readmeQuality * 0.75 + descriptionScore * 0.15 + licenseRatio * 100 * 0.10
  );

  let profileScore = 20;
  if (profile.avatar_url) profileScore += 10;
  if (profile.bio?.trim().length > 10) profileScore += 20;
  if (profile.name) profileScore += 15;
  if (profile.location) profileScore += 10;
  if (profile.blog) profileScore += 10;
  if (profile.twitter_username) profileScore += 5;
  if (profile.company) profileScore += 5;
  if (profile.email) profileScore += 5;
  profileScore = Math.min(100, profileScore);

  const unknownActivityRepos = ownedRepos.filter((repo) => !safeDate(repo.pushed_at || repo.updated_at || repo.created_at)).length;
  const inactiveReposCount = Math.max(0, ownedRepos.length - activeRepos12Months - unknownActivityRepos);

  return {
    repoCount,
    ownedRepoCount: ownedRepos.length,
    totalStars,
    totalForks,
    profileCompleteness: profileScore,
    activeRepos12Months,
    inactiveReposCount,
    unknownActivityRepos,
    descriptionRatio: descriptionScore,
    homepageRatio: Math.round(homepageRatio * 100),
    licenseRatio: Math.round(licenseRatio * 100),
    activeRatio: Math.round(activeRatio * 100),
    activityScore,
    recentEvents,
    uniqueLanguages,
    languageCounts,
    techDiversityScore,
    docScore: Math.min(100, documentationScore),
    readmeQuality: Math.min(100, readmeQuality),
    readmeEvidenceAnalyzed: analyzedReadmes,
    readmeExists,
    readmeStrong,
    readmeInstall,
    readmeUsage,
    readmeFeatures,
    readmeTechStack,
    readmeArchitecture,
    readmeDemo,
    pinnedDataAvailable: Array.isArray(pinnedRepositories),
    pinnedRepoCount: Array.isArray(pinnedRepositories) ? pinnedRepositories.length : 0,
  };
}
