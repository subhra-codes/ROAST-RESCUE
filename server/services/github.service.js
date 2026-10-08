/**
 * GitHub Service for ROAST / RESCUE
 *
 * Public-first collection strategy:
 *   1. Use GitHub's REST API when it is available.
 *   2. If the unauthenticated API is rate-limited, fall back to GitHub's public
 *      profile/repository HTML pages instead of requiring a token.
 *   3. Read selected README files from raw.githubusercontent.com, which is not
 *      the REST API rate-limit bucket.
 *
 * A GitHub token is optional. It is never required for the core product.
 */

import axios from 'axios';

const API = 'https://api.github.com';
const RAW = 'https://raw.githubusercontent.com';
const WEB = 'https://github.com';
const CACHE_TTL_MS = 10 * 60 * 1000;
const analysisCache = new Map();
let apiBlockedUntil = 0;

function getHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ROAST-RESCUE-GitHub-Career-Intelligence',
  };

  if (process.env.GITHUB_TOKEN?.trim()) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN.trim()}`;
  }

  return headers;
}

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/$/, '')
    .split('/')[0];
}

function isValidUsername(value) {
  return /^[a-zA-Z0-9-]+$/.test(value)
    && value.length <= 39
    && !value.startsWith('-')
    && !value.endsWith('-');
}

function createNotFound(username) {
  const err = new Error(`GitHub user "${username}" was not found.`);
  err.status = 404;
  err.code = 'GITHUB_USER_NOT_FOUND';
  return err;
}

function createRateLimitError(headers = {}) {
  const reset = Number(headers['x-ratelimit-reset'] || 0);
  const resetAt = reset ? new Date(reset * 1000) : null;
  const err = new Error(
    resetAt
      ? `GitHub public API limit reached. Try again after ${resetAt.toLocaleTimeString()}.`
      : 'GitHub public API limit reached. Please try again later.'
  );
  err.status = 429;
  err.rateLimit = true;
  err.resetAt = resetAt?.toISOString() || null;
  return err;
}

async function get(url, config = {}) {
  try {
    return await axios.get(url, { headers: getHeaders(), timeout: 12000, ...config });
  } catch (error) {
    const remaining = error.response?.headers?.['x-ratelimit-remaining'];
    const status = error.response?.status;
    if ((status === 403 || status === 429) && String(remaining) === '0') {
      const rateError = createRateLimitError(error.response.headers || {});
      apiBlockedUntil = rateError.resetAt ? new Date(rateError.resetAt).getTime() : Date.now() + 60_000;
      throw rateError;
    }
    throw error;
  }
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;|&#47;/g, '/')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(value = '') {
  return decodeHtml(String(value).replace(/<[^>]*>/g, ' '));
}

function extractAttribute(tag = '', attribute = '') {
  const pattern = new RegExp(`${attribute}\\s*=\\s*["']([^"']*)["']`, 'i');
  return decodeHtml(tag.match(pattern)?.[1] || '');
}

function extractNumber(value = '') {
  const cleaned = decodeHtml(value).replace(/,/g, '').trim().toLowerCase();
  const match = cleaned.match(/([0-9]+(?:\.[0-9]+)?)([km])?/i);
  if (!match) return 0;
  const number = Number(match[1]);
  if (match[2] === 'k') return Math.round(number * 1000);
  if (match[2] === 'm') return Math.round(number * 1_000_000);
  return Math.round(number);
}

function extractLinkedStat(html = '', hrefPattern) {
  const pattern = new RegExp(`<a[^>]+href=[\"']${hrefPattern}[^\"']*[\"'][^>]*>[\s\S]{0,1200}?</a>`, 'i');
  const match = html.match(pattern);
  if (!match) return 0;
  // GitHub wraps the count in nested spans, so looking only for
  // \"Repositories 14\" or \"followers 12\" is too brittle.
  const text = stripTags(match[0]);
  const numbers = text.match(/[0-9]+(?:[.,][0-9]+)?[kKmM]?/g) || [];
  return numbers.length ? extractNumber(numbers[numbers.length - 1]) : 0;
}

function extractRelativeDate(chunk = '') {
  const datetime = chunk.match(/<relative-time[^>]*datetime=["']([^"']+)["']/i)?.[1];
  if (datetime) return datetime;

  const title = chunk.match(/<relative-time[^>]*title=["']([^"']+)["']/i)?.[1];
  if (title) {
    const parsed = Date.parse(title);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  }

  return null;
}

function parseRepositoryCards(html, username) {
  const repos = new Map();
  const escapedUser = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const linkRegex = new RegExp(`<a[^>]+href=["']/${escapedUser}/([^/"'?#]+)["'][^>]*>[\\s\\S]*?<\\/a>`, 'gi');
  let match;

  while ((match = linkRegex.exec(html))) {
    const name = decodeHtml(match[1]);
    if (!name || name.toLowerCase() === username.toLowerCase()) continue;
    if (name.includes('.') || /^(followers|following|stars|repositories|projects|packages)$/i.test(name)) continue;

    const start = Math.max(0, match.index - 250);
    const end = Math.min(html.length, match.index + 5000);
    const chunk = html.slice(start, end);

    const language = stripTags(
      chunk.match(/<span[^>]+itemprop=["']programmingLanguage["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || ''
    );
    const description = stripTags(
      chunk.match(/<p[^>]*class=["'][^"']*color-fg-muted[^"']*[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ||
      chunk.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || ''
    );

    const stars = extractNumber(
      chunk.match(new RegExp(`href=["']/${escapedUser}/${name}/stargazers["'][^>]*>([\\s\\S]*?)<\\/a>`, 'i'))?.[1] || ''
    );
    const forks = extractNumber(
      chunk.match(new RegExp(`href=["']/${escapedUser}/${name}/network/members["'][^>]*>([\\s\\S]*?)<\\/a>`, 'i'))?.[1] ||
      chunk.match(new RegExp(`href=["']/${escapedUser}/${name}/network/members[^"']*["'][^>]*>([\\s\\S]*?)<\\/a>`, 'i'))?.[1] || ''
    );

    const forkedFrom = /Forked from/i.test(stripTags(chunk));
    const updatedAt = extractRelativeDate(chunk);

    if (!repos.has(name)) {
      repos.set(name, {
        id: `web-${username}-${name}`,
        name,
        full_name: `${username}/${name}`,
        owner: { login: username },
        html_url: `${WEB}/${encodeURIComponent(username)}/${encodeURIComponent(name)}`,
        description: description.length > 500 ? description.slice(0, 500) : description,
        language: language || null,
        stargazers_count: stars,
        forks_count: forks,
        topics: [],
        homepage: '',
        license: null,
        size: 0,
        fork: forkedFrom,
        archived: false,
        has_wiki: false,
        has_pages: false,
        default_branch: 'main',
        created_at: null,
        updated_at: updatedAt,
        pushed_at: updatedAt,
        readmeEvidence: null,
        dataSource: 'github-public-web',
      });
    }
  }

  return [...repos.values()];
}

function parseProfilePage(html, username) {
  const avatar = html.match(/<img[^>]+src=["'](https:\/\/avatars\.githubusercontent\.com\/[^"']+)["'][^>]*alt=["']@[^"']+["']/i)?.[1]
    || html.match(/<img[^>]+src=["'](https:\/\/avatars\.githubusercontent\.com\/[^"']+)["']/i)?.[1]
    || '';

  const heading = stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '')
    .replace(/^Block or report user.*$/i, '')
    .trim();
  const nameMatch = heading.match(/^(.+?)\s+([a-zA-Z0-9-]+)$/);
  const name = nameMatch && nameMatch[2].toLowerCase() === username.toLowerCase()
    ? nameMatch[1].trim()
    : heading.replace(username, '').trim();

  // GitHub's current profile markup wraps these counters in several nested
  // elements. Extract them from their stable navigation hrefs instead of
  // relying on the visual text layout.
  const repoCount = extractLinkedStat(html, `[^\"']*\?tab=repositories`);
  const followers = extractLinkedStat(html, `[^\"']*followers`);
  const following = extractLinkedStat(html, `[^\"']*following`);

  const bio = stripTags(
    html.match(/<div[^>]*data-testid=["']profile-bio["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] ||
    html.match(/<div[^>]*class=["'][^"']*user-profile-bio[^"']*[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || ''
  );

  const location = stripTags(
    html.match(/<span[^>]*itemprop=["']homeLocation["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || ''
  );
  const blog = decodeHtml(
    html.match(/<a[^>]+itemprop=["']url["'][^>]+href=["']([^"']+)["']/i)?.[1] || ''
  );
  const company = stripTags(
    html.match(/<span[^>]*itemprop=["']worksFor["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] || ''
  );

  return {
    login: username,
    name: name || username,
    avatar_url: avatar,
    bio,
    location,
    blog,
    company,
    twitter_username: null,
    email: null,
    public_repos: repoCount,
    followers,
    following,
    created_at: null,
    html_url: `${WEB}/${encodeURIComponent(username)}`,
    dataSource: 'github-public-web',
  };
}

async function fetchGitHubWebData(username) {
  // The profile page is the authoritative existence check for tokenless mode.
  const profileResponse = await axios.get(`${WEB}/${encodeURIComponent(username)}`, {
    headers: { 'User-Agent': 'ROAST-RESCUE-GitHub-Career-Intelligence' },
    timeout: 15000,
    validateStatus: (status) => status >= 200 && status < 500,
  });

  if (profileResponse.status === 404) throw createNotFound(username);
  if (profileResponse.status >= 400) {
    const err = new Error('GitHub public profile could not be reached right now.');
    err.status = 503;
    throw err;
  }

  const profile = parseProfilePage(profileResponse.data, username);
  const repositories = [];

  // GitHub's public repository tab is not subject to the REST API quota.
  // Four pages cover the same practical portfolio range used by the analyzer.
  for (let page = 1; page <= 10; page += 1) {
    const response = await axios.get(`${WEB}/${encodeURIComponent(username)}`, {
      params: { tab: 'repositories', sort: 'updated', page },
      headers: { 'User-Agent': 'ROAST-RESCUE-GitHub-Career-Intelligence' },
      timeout: 15000,
      validateStatus: (status) => status >= 200 && status < 500,
    });

    if (response.status === 404) throw createNotFound(username);
    if (response.status >= 400) break;

    const pageRepos = parseRepositoryCards(response.data, username);
    if (pageRepos.length === 0) break;

    const known = new Set(repositories.map((repo) => repo.name));
    pageRepos.forEach((repo) => {
      if (!known.has(repo.name)) repositories.push(repo);
    });

    if (pageRepos.length < 30) break;
  }

  // The profile page's popular repositories provide a useful safety net when
  // the repository tab is temporarily rendered without server-side cards.
  if (repositories.length === 0) {
    repositories.push(...parseRepositoryCards(profileResponse.data, username));
  }

  // Never manufacture a career score from an incomplete scrape. If GitHub
  // says the account owns public repositories but the public HTML collector
  // could not recover any, fail clearly instead of scoring partial data.
  if (repositories.length === 0 && profile.public_repos > 0) {
    const err = new Error('GitHub public repository data could not be read right now. No career score was generated.');
    err.status = 503;
    err.code = 'GITHUB_PUBLIC_DATA_INCOMPLETE';
    throw err;
  }

  const enriched = await fetchReadmeEvidence(repositories);

  // Never display a zero repository count when the public repository collector
  // has already recovered real repositories. The profile counter is authoritative
  // when available; the recovered owned-repository count is a safe fallback when
  // GitHub changes the profile markup.
  if (!Number.isFinite(profile.public_repos) || profile.public_repos < enriched.length) {
    profile.public_repos = enriched.length;
  }

  return {
    profile,
    repositories: enriched,
    events: [],
    pinnedRepositories: null,
    rateLimit: {
      remaining: null,
      limit: null,
      authenticated: false,
      mode: 'public-web-fallback',
    },
  };
}

async function fetchAllRepositories(username) {
  const repositories = [];
  let page = 1;
  while (page <= 10) {
    const { data } = await get(`${API}/users/${encodeURIComponent(username)}/repos`, {
      params: { per_page: 100, page, sort: 'updated', direction: 'desc', type: 'owner' },
    });
    repositories.push(...data);
    if (data.length < 100) break;
    page += 1;
  }
  return repositories;
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

  const names = ['README.md', 'readme.md', 'README'];
  for (const fileName of names) {
    try {
      const response = await axios.get(
        `${RAW}/${encodeURIComponent(owner)}/${encodeURIComponent(repo.name)}/${encodeURIComponent(branch)}/${fileName}`,
        { timeout: 9000, responseType: 'text', validateStatus: (status) => status >= 200 && status < 300 }
      );
      if (typeof response.data === 'string') return buildReadmeEvidence(response.data);
    } catch {
      // Try the next conventional README filename.
    }
  }

  return {
    exists: false,
    length: 0,
    hasInstall: false,
    hasUsage: false,
    hasFeatures: false,
    hasTechStack: false,
    hasArchitecture: false,
    hasDemo: false,
  };
}

async function fetchReadmeEvidence(repositories) {
  const candidates = repositories
    .filter((repo) => !repo.fork)
    .slice()
    .sort((a, b) => {
      const aDate = new Date(a.pushed_at || a.updated_at || a.created_at || 0).getTime() || 0;
      const bDate = new Date(b.pushed_at || b.updated_at || b.created_at || 0).getTime() || 0;
      return bDate - aDate;
    })
    .slice(0, 8);

  const enriched = await Promise.all(
    candidates.map(async (repo) => ({ name: repo.name, readme: await fetchRawReadme(repo) }))
  );
  const byName = new Map(enriched.map((item) => [item.name, item.readme]));
  return repositories.map((repo) => ({ ...repo, readmeEvidence: byName.get(repo.name) || null }));
}

async function fetchPinnedRepositories(username) {
  if (!process.env.GITHUB_TOKEN?.trim()) return null;
  try {
    const query = `
      query($login: String!) {
        user(login: $login) {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes { ... on Repository { name url stargazerCount } }
          }
        }
      }
    `;
    const { data } = await axios.post(`${API}/graphql`, { query, variables: { login: username } }, {
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      timeout: 12000,
    });
    return data?.data?.user?.pinnedItems?.nodes || [];
  } catch {
    return [];
  }
}

async function fetchApiData(cleanUsername) {
  if (apiBlockedUntil > Date.now()) {
    const err = new Error('GitHub REST API is temporarily rate-limited.');
    err.status = 429;
    err.rateLimit = true;
    err.resetAt = new Date(apiBlockedUntil).toISOString();
    throw err;
  }

  const { data: profile, headers: profileHeaders } = await get(`${API}/users/${encodeURIComponent(cleanUsername)}`);
  if (!profile?.login) throw createNotFound(cleanUsername);

  const repositoriesRaw = await fetchAllRepositories(profile.login);
  const repositories = await fetchReadmeEvidence(repositoriesRaw);
  const pinnedRepositories = await fetchPinnedRepositories(profile.login);

  return {
    profile,
    repositories,
    events: [],
    pinnedRepositories,
    rateLimit: {
      remaining: Number(profileHeaders?.['x-ratelimit-remaining'] || 0),
      limit: Number(profileHeaders?.['x-ratelimit-limit'] || 0),
      authenticated: Boolean(process.env.GITHUB_TOKEN?.trim()),
      mode: 'github-rest-api',
    },
  };
}

export async function fetchGitHubData(username) {
  const cleanUsername = normalizeUsername(username);
  if (!cleanUsername) throw new Error('GitHub username is required.');
  if (!isValidUsername(cleanUsername)) {
    const err = new Error(`"${cleanUsername}" is not a valid GitHub username.`);
    err.status = 400;
    throw err;
  }

  const key = cleanUsername.toLowerCase();
  const cached = analysisCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  analysisCache.delete(key);

  let result;
  try {
    result = await fetchApiData(cleanUsername);
  } catch (error) {
    // A REST API rate limit is not a reason to make the user create a token.
    // Fall back to GitHub's public web pages instead.
    if (error.rateLimit || error.status === 429) {
      result = await fetchGitHubWebData(cleanUsername);
    } else if (error.response?.status === 404 || error.status === 404) {
      throw createNotFound(cleanUsername);
    } else {
      // Network/API failures are also allowed to use the public web collector.
      // This makes the product resilient to transient API outages.
      try {
        result = await fetchGitHubWebData(cleanUsername);
      } catch (fallbackError) {
        if (fallbackError.status === 404) throw fallbackError;
        throw error;
      }
    }
  }

  analysisCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, data: result });
  return result;
}
