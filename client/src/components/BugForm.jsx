import { useState } from 'react';
import { createBug } from '../api.js';
import { PRIORITIES, SEVERITIES } from '../constants.js';
import './BugForm.css';

export function BugForm({ users, onSuccess, onClose }) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'Medium',
    severity: 'Major', reportedBy: users[0]?.id ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setLoading(true); setError('');
    try {
      const bug = await createBug(form);
      onSuccess(bug);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="bug-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label className="form-label" htmlFor="bf-title">Title <span className="required" aria-hidden="true">*</span></label>
        <input
          id="bf-title"
          className="form-input"
          type="text"
          placeholder="Short, descriptive bug title"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          required
          aria-required="true"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="bf-desc">Description</label>
        <textarea
          id="bf-desc"
          className="form-textarea"
          placeholder="Describe the bug, steps to reproduce, expected vs actual behaviour…"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="bf-priority">Priority</label>
          <select id="bf-priority" className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="bf-severity">Severity</label>
          <select id="bf-severity" className="form-select" value={form.severity} onChange={e => set('severity', e.target.value)}>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="bf-reporter">Reported by</label>
        <select id="bf-reporter" className="form-select" value={form.reportedBy} onChange={e => set('reportedBy', e.target.value)}>
          {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
        </select>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Creating…' : 'Create Bug'}
        </button>
      </div>
    </form>
  );
}
