/**
 * Recruiter Engine for ROAST / RESCUE.
 * This is a transparent simulation, not a prediction of an actual recruiter.
 */

export function simulateRecruiterLens(profile, repos, baseMetrics, dna) {
  const {
    profileCompleteness,
    activeRatio,
    descriptionRatio,
    homepageRatio,
    techDiversityScore,
    docScore,
    pinnedRepoCount,
    pinnedDataAvailable,
    inactiveReposCount,
    ownedRepoCount,
    unknownActivityRepos = 0,
  } = baseMetrics;

  const firstImpressionScore = Math.min(98, Math.max(25, Math.round(
    profileCompleteness * 0.20 +
    activeRatio * 0.20 +
    descriptionRatio * 0.15 +
    homepageRatio * 0.10 +
    docScore * 0.20 +
    techDiversityScore * 0.10 +
    (pinnedDataAvailable ? Math.min(100, pinnedRepoCount * 20) : 50) * 0.05
  )));

  const strongSignals = [];
  const weakSignals = [];

  if (activeRatio >= 60) strongSignals.push('✓ Strong recent project activity & maintenance signal');
  else if (unknownActivityRepos > 0) weakSignals.push(`⚠ Recent activity could not be verified for ${unknownActivityRepos} of ${ownedRepoCount} owned repositories in public-web mode`);
  else weakSignals.push(`⚠ ${inactiveReposCount} of ${ownedRepoCount} owned repositories have no push activity in the last 12 months`);

  if (techDiversityScore >= 60) strongSignals.push(`✓ Broad technology evidence (${baseMetrics.uniqueLanguages.slice(0, 4).join(', ')})`);
  else weakSignals.push('⚠ Technology evidence is concentrated in a narrow language set');

  if (docScore >= 70) strongSignals.push('✓ Strong documentation and project presentation evidence');
  else weakSignals.push('⚠ Documentation is inconsistent across the analyzed repositories');

  if (homepageRatio >= 30) strongSignals.push('✓ Multiple repositories expose live/demo links');
  else weakSignals.push('⚠ Few repositories expose a live demo or deployment link');

  if (profileCompleteness >= 75) strongSignals.push('✓ Profile metadata is professionally complete');
  else weakSignals.push('⚠ Profile bio or supporting metadata is incomplete');

  if (pinnedDataAvailable && pinnedRepoCount >= 3) strongSignals.push(`✓ ${pinnedRepoCount} pinned repositories provide deliberate portfolio curation`);
  else if (pinnedDataAvailable && pinnedRepoCount === 0) weakSignals.push('⚠ No pinned repositories were detected');

  if (strongSignals.length < 3) strongSignals.push('✓ Public repositories provide observable technical evidence');
  if (weakSignals.length < 3) weakSignals.push('⚠ Project presentation could communicate technical depth more clearly');

  let verdict;
  if (firstImpressionScore >= 82) {
    verdict = `Strong technical signal with a ${dna.archetype.toLowerCase()} profile that is easy to evaluate quickly.`;
  } else if (firstImpressionScore >= 65) {
    verdict = 'Technically active, but the profile does not communicate its strongest work quickly enough.';
  } else if (firstImpressionScore >= 50) {
    verdict = 'Developer potential is visible, but weak documentation, curation, or maintenance signals create friction.';
  } else {
    verdict = 'High evaluation friction. Repository curation, documentation, and profile positioning need attention first.';
  }

  return {
    firstImpressionScore,
    strongSignals: strongSignals.slice(0, 3),
    weakSignals: weakSignals.slice(0, 3),
    recruiterVerdict: verdict,
  };
}
