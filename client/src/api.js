// In development Vite proxies /api → localhost:4000
// In production the React build is served by the same Express server,
// so /api calls go to the same origin automatically.
const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data;
}

// ── Bugs ──────────────────────────────────────────────────────────────────────
export const fetchBugs     = (status)    => request(`/bugs${status ? `?status=${status}` : ''}`);
export const fetchBug      = (id)        => request(`/bugs/${id}`);
export const createBug     = (body)      => request('/bugs',                  { method: 'POST',   body: JSON.stringify(body) });
export const assignBug     = (id, body)  => request(`/bugs/${id}/assign`,     { method: 'POST',   body: JSON.stringify(body) });
export const transitionBug = (id, body)  => request(`/bugs/${id}/transition`, { method: 'POST',   body: JSON.stringify(body) });
export const addComment    = (id, body)  => request(`/bugs/${id}/comments`,   { method: 'POST',   body: JSON.stringify(body) });
export const deleteBug     = (id)        => request(`/bugs/${id}`,            { method: 'DELETE' });

// ── Users ─────────────────────────────────────────────────────────────────────
export const fetchUsers      = ()         => request('/users');
export const fetchDevelopers = ()         => request('/developers');
export const createUser      = (body)     => request('/users',       { method: 'POST',   body: JSON.stringify(body) });
export const updateUser      = (id, body) => request(`/users/${id}`, { method: 'PUT',    body: JSON.stringify(body) });
export const deleteUser      = (id)       => request(`/users/${id}`, { method: 'DELETE' });

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchDashboard = () => request('/dashboard');
