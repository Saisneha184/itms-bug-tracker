import { useState } from 'react';
import { format } from 'date-fns';
import { MessageCircle, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { StatusBadge, PriorityBadge, SeverityBadge } from './Badge.jsx';
import { Avatar } from './Avatar.jsx';
import { assignBug, transitionBug, addComment } from '../api.js';
import { TRANSITIONS } from '../constants.js';
import { Timeline } from './Timeline.jsx';
import './BugDetail.css';

function fmt(d) { return d ? format(new Date(d), 'dd MMM yyyy, HH:mm') : '—'; }

export function BugDetail({ bug: initialBug, users, developers, onUpdate, onDelete }) {
  const [bug,     setBug]     = useState(initialBug);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [working, setWorking] = useState(false);
  const [error,   setError]   = useState('');

  const getUserById = (id) => users.find(u => u.id === id);
  const reporter  = getUserById(bug.reportedBy);
  const assignee  = bug.assignedTo ? getUserById(bug.assignedTo) : null;
  const allowed   = TRANSITIONS[bug.status] ?? [];

  async function handleTransition(toStatus) {
    setWorking(true); setError('');
    try {
      let updated;
      if (toStatus === 'Assigned') {
        const dev = developers[0];
        if (!dev) throw new Error('No developers available');
        updated = await assignBug(bug.id, { assignedTo: dev.id, byUserId: 'u1' });
      } else {
        updated = await transitionBug(bug.id, { toStatus, byUserId: 'u1' });
      }
      setBug(updated);
      onUpdate(updated);
    } catch (e) { setError(e.message); }
    finally { setWorking(false); }
  }

  async function handleAssign(e) {
    const devId = e.target.value;
    if (!devId) return;
    setWorking(true); setError('');
    try {
      const updated = await assignBug(bug.id, { assignedTo: devId, byUserId: 'u1' });
      setBug(updated);
      onUpdate(updated);
    } catch (e) { setError(e.message); }
    finally { setWorking(false); }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true); setError('');
    try {
      const c = await addComment(bug.id, { userId: 'u4', text: comment });
      setBug(b => ({ ...b, comments: [...b.comments, c] }));
      setComment('');
    } catch (e) { setError(e.message); }
    finally { setPosting(false); }
  }

  return (
    <div className="bug-detail">
      {/* Left — main content */}
      <div className="bug-detail__main">
        <div className="bug-detail__id-row">
          <span className="bug-detail__id">{bug.id}</span>
          <StatusBadge status={bug.status} />
        </div>
        <h1 className="bug-detail__title">{bug.title}</h1>

        {/* Transitions */}
        {allowed.length > 0 && (
          <div className="bug-detail__actions">
            {allowed.map(s => (
              <button
                key={s}
                className="btn btn--ghost btn--sm"
                onClick={() => handleTransition(s)}
                disabled={working}
              >
                <ArrowRight size={12} />
                Move to {s}
              </button>
            ))}
            {/* Delete button — right side of action bar */}
            {onDelete && (
              <button
                className="btn btn--ghost btn--sm btn--delete-outline"
                onClick={() => onDelete(bug)}
                style={{ marginLeft: 'auto' }}
                title="Delete this bug"
              >
                <Trash2 size={12} />
                Delete
              </button>
            )}
          </div>
        )}
        {allowed.length === 0 && onDelete && (
          <div className="bug-detail__actions">
            <button
              className="btn btn--ghost btn--sm btn--delete-outline"
              onClick={() => onDelete(bug)}
              title="Delete this bug"
            >
              <Trash2 size={12} />
              Delete Bug
            </button>
          </div>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

        {/* Description */}
        <section className="bug-detail__section" aria-labelledby="desc-heading">
          <h3 id="desc-heading" className="bug-detail__section-title">Description</h3>
          <p className="bug-detail__desc">{bug.description || <span className="text-muted">No description provided.</span>}</p>
        </section>

        {/* Status dates & durations */}
        <Timeline timeline={bug.timeline} users={users} />

        {/* Activity / History */}
        <section className="bug-detail__section" aria-labelledby="activity-heading">
          <h3 id="activity-heading" className="bug-detail__section-title">
            <Clock size={13} /> Activity
          </h3>
          <div className="activity">
            {bug.history.map(h => {
              const actor = getUserById(h.by);
              return (
                <div key={h.id} className="activity__item">
                  <Avatar user={actor} size={24} />
                  <div className="activity__content">
                    <span className="activity__actor">{actor?.name ?? h.by}</span>
                    {' '}
                    {h.from
                      ? <><span className="activity__change">{h.from}</span> <ArrowRight size={10} /> <span className="activity__change">{h.to}</span></>
                      : <span className="activity__change">opened this bug</span>
                    }
                    <div className="activity__comment">{h.comment}</div>
                    <time className="activity__time" dateTime={h.at}>{fmt(h.at)}</time>
                  </div>
                </div>
              );
            })}

            {bug.comments.map(c => {
              const actor = getUserById(c.by);
              return (
                <div key={c.id} className="activity__item">
                  <Avatar user={actor} size={24} />
                  <div className="activity__content">
                    <span className="activity__actor">{actor?.name ?? c.by}</span>
                    {' '}
                    <span className="activity__label">commented</span>
                    <div className="activity__comment-bubble">{c.text}</div>
                    <time className="activity__time" dateTime={c.at}>{fmt(c.at)}</time>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add comment */}
          <form className="comment-form" onSubmit={handleComment}>
            <textarea
              className="form-textarea"
              placeholder="Add a comment…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              aria-label="Add a comment"
            />
            <button type="submit" className="btn btn--primary btn--sm" disabled={posting || !comment.trim()}>
              <MessageCircle size={12} /> {posting ? 'Posting…' : 'Comment'}
            </button>
          </form>
        </section>
      </div>

      {/* Right — meta sidebar */}
      <aside className="bug-detail__sidebar" aria-label="Bug metadata">
        <MetaRow label="Status">
          <StatusBadge status={bug.status} />
        </MetaRow>

        <MetaRow label="Priority">
          <PriorityBadge priority={bug.priority} />
        </MetaRow>

        <MetaRow label="Severity">
          <SeverityBadge severity={bug.severity} />
        </MetaRow>

        <MetaRow label="Reporter">
          <div className="meta-user">
            <Avatar user={reporter} size={22} />
            <span>{reporter?.name ?? bug.reportedBy}</span>
          </div>
        </MetaRow>

        <MetaRow label="Assignee">
          <div className="meta-user">
            {assignee ? (
              <>
                <Avatar user={assignee} size={22} />
                <span>{assignee.name}</span>
              </>
            ) : (
              <span className="text-muted">Unassigned</span>
            )}
          </div>
        </MetaRow>

        {/* Quick assign select */}
        {['Open','Reopened'].includes(bug.status) && (
          <div className="meta-assign">
            <select
              className="form-select"
              defaultValue=""
              onChange={handleAssign}
              aria-label="Assign to developer"
              disabled={working}
            >
              <option value="" disabled>Assign to…</option>
              {developers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        <MetaRow label="Created">
          <time dateTime={bug.createdAt} className="meta-date">{fmt(bug.createdAt)}</time>
        </MetaRow>

        <MetaRow label="Updated">
          <time dateTime={bug.updatedAt} className="meta-date">{fmt(bug.updatedAt)}</time>
        </MetaRow>
      </aside>
    </div>
  );
}

function MetaRow({ label, children }) {
  return (
    <div className="meta-row">
      <span className="meta-label">{label}</span>
      <div className="meta-value">{children}</div>
    </div>
  );
}
