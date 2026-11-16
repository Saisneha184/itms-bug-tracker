import express    from 'express';
import cors       from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync }    from 'fs';

import { getAllUsers, getDevelopers, getUserById, createUser, updateUser, deleteUser, seedDemoData } from './store.js';
import {
  agentReportBug, agentAssignBug, agentTransition,
  agentComment, agentGetBug, agentListBugs, agentDashboard, agentDeleteBug,
} from './agent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 4000;

// ── CORS ───────────────────────────────────────────────────────────────────────
// In production the React build is served from the same origin, so CORS is only
// needed for local dev or when the client is on a different domain.
const ALLOWED = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server (no origin) and listed origins
    if (!origin || ALLOWED.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

// ── Seed on startup ────────────────────────────────────────────────────────────
seedDemoData();

// ── Helpers ────────────────────────────────────────────────────────────────────
const ok  = (res, data)          => res.json({ success: true,  data });
const err = (res, msg, code=400) => res.status(code).json({ success: false, error: msg });

// ── Users ──────────────────────────────────────────────────────────────────────
app.get('/api/users',      (_, res) => ok(res, getAllUsers()));
app.get('/api/developers', (_, res) => ok(res, getDevelopers()));

app.get('/api/users/:id', (req, res) => {
  const u = getUserById(req.params.id);
  u ? ok(res, u) : err(res, 'User not found', 404);
});

app.post('/api/users', (req, res) => {
  try { ok(res, createUser(req.body)); }
  catch (e) { err(res, e.message); }
});

app.put('/api/users/:id', (req, res) => {
  try { ok(res, updateUser(req.params.id, req.body)); }
  catch (e) { err(res, e.message); }
});

app.delete('/api/users/:id', (req, res) => {
  try { ok(res, deleteUser(req.params.id)); }
  catch (e) { err(res, e.message, 404); }
});

// ── Bugs ───────────────────────────────────────────────────────────────────────
app.get('/api/bugs', (req, res) => {
  try { ok(res, agentListBugs(req.query.status || null)); }
  catch (e) { err(res, e.message); }
});

app.get('/api/bugs/:id', (req, res) => {
  try { ok(res, agentGetBug(req.params.id)); }
  catch (e) { err(res, e.message, 404); }
});

app.post('/api/bugs', (req, res) => {
  try { ok(res, agentReportBug(req.body)); }
  catch (e) { err(res, e.message); }
});

app.post('/api/bugs/:id/assign', (req, res) => {
  try { ok(res, agentAssignBug({ bugId: req.params.id, ...req.body })); }
  catch (e) { err(res, e.message); }
});

app.post('/api/bugs/:id/transition', (req, res) => {
  try { ok(res, agentTransition({ bugId: req.params.id, ...req.body })); }
  catch (e) { err(res, e.message); }
});

app.post('/api/bugs/:id/comments', (req, res) => {
  try { ok(res, agentComment({ bugId: req.params.id, ...req.body })); }
  catch (e) { err(res, e.message); }
});

app.delete('/api/bugs/:id', (req, res) => {
  try { ok(res, agentDeleteBug(req.params.id)); }
  catch (e) { err(res, e.message, 404); }
});

// ── Dashboard ──────────────────────────────────────────────────────────────────
app.get('/api/dashboard', (_, res) => {
  try { ok(res, agentDashboard()); }
  catch (e) { err(res, e.message); }
});

// ── Serve React build (production) ────────────────────────────────────────────
// When deployed as a single service, the Express server also serves the
// pre-built React SPA from ../client/dist
const distPath = join(__dirname, '..', 'client', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback — all non-API routes return index.html
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(PORT, () =>
  console.log(`ITMS Bug Tracker API  →  http://localhost:${PORT}`)
);
