# ROAST / RESCUE — GitHub Career Intelligence

ROAST / RESCUE analyzes public GitHub evidence and turns it into a recruiter-style report: Recruiter Lens, Developer DNA, evidence-based Roast, Repository Surgery, Rescue Simulator, DNA Compare, and Interview Pressure Test.

## Architecture

```text
GitHub Public API (preferred)
      │
      ├── rate limit / outage → GitHub Public Web fallback
      │
      ↓
GitHub Data Normalizer
      ↓
Deterministic Signal Extraction
      ├── Profile / repository metrics
      ├── README evidence
      ├── Activity / technology signals
      └── Pinned repositories (authenticated GraphQL when token is configured)
      ↓
Scoring / DNA / Health / Recruiter Engines
      ↓
Evidence-backed Roast + Interview evaluation
      ↓
React Career Intelligence Report
```

The underlying scores are calculated deterministically from observable GitHub data. The natural-language outputs are generated from those signals; the application does not invent repository evidence.

## Run locally

### 1. Backend

```powershell
cd server
npm install
copy .env.example .env
npm run dev
```

The API runs on `http://localhost:5000`.

### 2. GitHub access

**No GitHub token is required for normal use.** The collector is public-first: it uses the GitHub REST API when available and automatically falls back to GitHub's public profile/repository web pages when the REST API is rate-limited or temporarily unavailable. Selected README files are read from public raw content. The report is never generated from fallback/demo data. The backend also caches analyses briefly to reduce repeated API requests.

For the separate Express backend, an optional token can be placed in `server/.env`:

```env
GITHUB_TOKEN=your_token_here
PORT=5000
```

In backend mode the token stays server-side, increases GitHub API capacity, and enables authenticated pinned-repository data. For the GitHub Pages-only mode, use the `ROAST_RESCUE_GITHUB_TOKEN` Actions secret described below; that static-build token is necessarily visible in the deployed browser bundle.

If a username does not exist, the profile lookup stops before scoring begins and the report is never generated for that input.

### 3. Frontend

```powershell
cd client
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`. `VITE_API_URL` defaults to `http://localhost:5000`.

## Implemented features

1. **Recruiter 30-Second Lens** — deterministic first-impression simulation with strong/weak signals and verdict.
2. **Developer DNA** — Frontend, Backend, AI/ML, Cloud, Open Source, Documentation, and Activity signals with an archetype.
3. **Evidence-Based Roast** — every roast references measurable GitHub evidence.
4. **Repository Surgery** — top repositories receive activity, README, presentation, completeness, documentation, diagnosis, and prescriptions.
5. **Rescue Simulator** — interactive prioritized fixes and Potential Score simulation.
6. **DNA Compare** — compares two real public profiles and calculates relative differentiators/gaps.
7. **Interview Pressure Test** — questions are generated from actual repositories and answers receive technical-depth, specificity, clarity, and evidence scoring.

## Accuracy / reliability fixes

- Page 2 now waits for the real analysis result before transitioning to the report, eliminating the previous timing race that could show fallback data.
- Repository collection is paginated instead of stopping at the first 100 repositories.
- README analysis inspects actual README content for installation, usage, features, tech stack, architecture, demo, and documentation depth signals.
- Repository health uses README evidence instead of treating a short GitHub description as a README.
- Pinned repository evidence is only scored when authenticated pinned-data access is available.
- Public mode no longer spends GitHub REST API requests fetching every README; selected README files are read from public raw content instead.
- Unknown or invalid GitHub usernames are rejected before any scoring engine runs.
- DNA Compare and Interview Pressure Test remain the final two report sections, after Rescue, with no visual redesign.
- Comparison gaps no longer fabricate a minimum five-point difference.
- Hard-coded demo/fallback report values were removed so real analyses do not silently display fictional scores.
- API URL is configurable through `client/.env` for deployment.

## Design preservation

The existing landing page, analysis page, typography, colors, CSS system, component structure, and visual styling are retained. Functional changes are implemented in the data/API/scoring layer and existing components without redesigning the approved pages.

## GitHub Pages deployment

The frontend now contains the same deterministic analysis pipeline as the Express backend, so the GitHub Pages build can run without a separately hosted server.

For the static GitHub Pages build, configure a repository secret:

1. GitHub repository → **Settings → Secrets and variables → Actions → Secrets**
2. Create `ROAST_RESCUE_GITHUB_TOKEN`
3. Put your GitHub **fine-grained, read-only** token there.
4. Push to `main` and the Pages workflow will inject it during the build.

**Security note:** because this is a static browser application, `VITE_GITHUB_TOKEN` is compiled into the JavaScript bundle and can be viewed by anyone who opens the deployed site. Do **not** use a token with write, delete, admin, or private-repository permissions. A narrowly scoped read-only token is strongly recommended. For a truly secret token, deploy the existing `server/` API separately and leave the token only in `server/.env`.

The existing `VITE_API_URL` variable and Express backend remain available for deployments that use a separate backend.

## Google AI Studio / Cloud Run deployment

The repository root is deployment-ready for Google AI Studio Build mode. The root `package.json` owns the build/start commands so AI Studio does not have to discover the nested `client/` and `server/` packages.

- `npm run build` builds the existing React app into `client/dist`.
- `npm start` starts the existing Express server and serves the built React app plus `/api` from the same origin.
- `npm run dev` starts the Vite preview on port 3000 and the API on port 5000.
- The production frontend uses relative `/api` requests, so no localhost URL is baked into the deployed build.
- The Vite base path is `/` for Cloud Run; the previous GitHub Pages-only `/Roast-Rescue/` base is not used by the Cloud Run deployment.

For AI Studio, add `GITHUB_TOKEN` as a server-side secret if you want authenticated GitHub API access. Do not create a `VITE_GITHUB_TOKEN` secret for the deployed app because `VITE_*` variables are bundled into browser JavaScript.
