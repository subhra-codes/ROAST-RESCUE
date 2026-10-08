/**
 * Browser GitHub client for ROAST / RESCUE.
 *
 * IMPORTANT:
 * VITE_GITHUB_TOKEN is embedded in a static browser build. It is NOT a secret.
 * Use a narrowly-scoped read-only GitHub token if you enable it.
 * For a production secret, use the existing server/ implementation instead.
 */

const API = 'https://api.github.com';
const RAW = 'https://raw.githubusercontent.com';
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

const TOKEN = String(import.meta.env.VITE_GITHUB_TOKEN || '').trim();

function headers(extra = {}) {
  const base = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (TOKEN) base.Authorization = `Bearer ${TOKEN}`;
  return { ...base, ...extra };
}

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/$/, '')
    .split('/')[0];
}

function validUsername(value) {
  return /^[a-zA-Z0-9-]+$/.test(value) &&
    value.length <= 39 &&
    !value.startsWith('-') &&
    !value.endsWith('-');
}

function fail(message, status = 500, code = 'GITHUB_ERROR') {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

async function githubFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: headers(options.headers || {}),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw fail('GitHub user or resource was not found.', 404, 'GITHUB_USER_NOT_FOUND');
    }
    if (response.status === 401) {
      throw fail('The configured GitHub token is invalid or expired.', 401, 'GITHUB_TOKEN_INVALID');
    }
    if (response.status === 403 || response.status === 429) {
      const reset = response.headers.get('x-ratelimit-reset');
      const resetAt = reset ? new Date(Number(reset) * 1000) : null;
      const message = resetAt
        ? `GitHub API rate limit reached. Try again after ${resetAt.toLocaleTimeString()}.`
        : 'GitHub API rate limit reached. Check your GitHub token configuration.';
      const error = fail(message, 429, 'GITHUB_RATE_LIMIT');
      error.resetAt = resetAt?.toISOString() || null;
      throw error;
    }
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.message ? ` ${body.message}` : '';
    } catch {}
    throw fail(`GitHub API request failed.${detail}`, response.status);
  }

  return response;
}

async function getJson(url) {
  const response = await githubFetch(url);
  return {
    data: await response.json(),
    headers: response.headers,
  };
}

function buildReadmeEvidence(text) {
  return {
    exists: true,
    length: text.length,
    hasInstall: /(^|\n)#{1,6}\s*(installation|install|setup|getting started)|npm install|pip install|docker compose|docker run/i.test(text),
    hasUsage: /(^|\n)#{1,6}\s*(usage|use|how to use|getting started|quick start)/i.test(text),
    hasFeatures: /(^|\n)#{1,6}\s*(features|key features|what it does)/i.test(text),
    hasTechStack: /(^|\n)#{1,6}\s*(tech( |-)stack|technologies|built with|technology)/i.test(text),
    hasArchitecture: /(^|\n)#{1,6}\s*(architecture|system design|workflow|structure)/i.test(text),
    hasDemo: /(https?:\/\/[^\s)]+|live demo|deployed at|deployment)/i.test(text),
  };
}

async function fetchRawReadme(repo) {
  const owner = repo.owner?.login;
  const branch = repo.default_branch || 'main';
  if (!owner || !repo.name) return null;

  for (const fileName of ['README.md', 'readme.md', 'README']) {
    try {
      const response = await fetch(
        `${RAW}/${encodeURIComponent(owner)}/${encodeURIComponent(repo.name)}/${encodeURIComponent(branch)}/${fileName}`,
        { headers: { 'User-Agent': 'ROAST-RESCUE-GitHub-Career-Intelligence' } }
      );
      if (response.ok) return buildReadmeEvidence(await response.text());
    } catch {}
  }

  return {
    exists: false, length: 0, hasInstall: false, hasUsage: false,
    hasFeatures: false, hasTechStack: false, hasArchitecture: false, hasDemo: false,
  };
}

async function enrichReadmes(repositories) {
  const candidates = repositories
    .filter((repo) => !repo.fork)
    .slice()
    .sort((a, b) => {
      const ad = new Date(a.pushed_at || a.updated_at || a.created_at || 0).getTime() || 0;
      const bd = new Date(b.pushed_at || b.updated_at || b.created_at || 0).getTime() || 0;
      return bd - ad;
    })
    .slice(0, 8);

  const enriched = await Promise.all(
    candidates.map(async (repo) => ({ name: repo.name, readme: await fetchRawReadme(repo) }))
  );
  const byName = new Map(enriched.map((item) => [item.name, item.readme]));
  return repositories.map((repo) => ({ ...repo, readmeEvidence: byName.get(repo.name) || null }));
}

async function fetchRepositories(username) {
  const repositories = [];
  for (let page = 1; page <= 10; page += 1) {
    const { data } = await getJson(
      `${API}/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated&direction=desc&type=owner`
    );
    repositories.push(...data);
    if (data.length < 100) break;
  }
  return repositories;
}

async function fetchPinnedRepositories(username) {
  if (!TOKEN) return null;
  const query = `
    query($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes { ... on Repository { name url stargazerCount } }
        }
      }
    }
  `;
  try {
    const response = await githubFetch(`${API}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { login: username } }),
    });
    const data = await response.json();
    return data?.data?.user?.pinnedItems?.nodes || [];
  } catch {
    return [];
  }
}

export async function fetchGitHubData(username) {
  const clean = normalizeUsername(username);
  if (!clean) throw fail('GitHub username is required.', 400);
  if (!validUsername(clean)) throw fail(`"${clean}" is not a valid GitHub username.`, 400);

  const key = clean.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const { data: profile, headers: profileHeaders } = await getJson(
    `${API}/users/${encodeURIComponent(clean)}`
  );
  if (!profile?.login) throw fail(`GitHub user "${clean}" was not found.`, 404, 'GITHUB_USER_NOT_FOUND');

  const repositories = await enrichReadmes(await fetchRepositories(profile.login));
  const pinnedRepositories = await fetchPinnedRepositories(profile.login);

  const data = {
    profile,
    repositories,
    events: [],
    pinnedRepositories,
    rateLimit: {
      remaining: Number(profileHeaders.get('x-ratelimit-remaining') || 0),
      limit: Number(profileHeaders.get('x-ratelimit-limit') || 0),
      authenticated: Boolean(TOKEN),
      mode: 'github-rest-api-browser',
    },
  };

  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data });
  return data;
}

export function isBrowserGitHubTokenConfigured() {
  return Boolean(TOKEN);
}
