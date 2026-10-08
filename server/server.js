import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import analysisRoutes from './routes/analysis.routes.js';
import { fetchGitHubData } from './services/github.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => {
  res.json({ ok: true, service: 'roast-rescue-api', githubMode: process.env.GITHUB_TOKEN?.trim() ? 'optional-authenticated' : 'public-first' });
});

// Legacy route for direct profile & repos fetch
app.get('/api/github/:username', async (req, res) => {
  try {
    const data = await fetchGitHubData(req.params.username);
    res.json({ profile: data.profile, repositories: data.repositories });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Full Career Intelligence routes
app.use('/api', analysisRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ROAST / RESCUE API running on http://localhost:${PORT}`);
});
