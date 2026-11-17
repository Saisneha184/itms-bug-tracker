import { useEffect, useState, useCallback } from 'react';
import { fetchBugs, fetchUsers, fetchDevelopers, transitionBug, assignBug } from '../api.js';
import { StatusBadge, PriorityBadge, SeverityBadge } from '../components/Badge.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { Modal } from '../components/Modal.jsx';
import { BugDetail } from '../components/BugDetail.jsx';
import { DeleteBugModal } from '../components/DeleteBugModal.jsx';
import { STATUS_META, TRANSITIONS, CURRENT_USER_ID } from '../constants.js';
import { Plus, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Board.css';

const COLUMNS = ['Open', 'Assigned', 'Fixed', 'Closed', 'Reopened', 'Rejected', 'Transferred'];

export function Board() {
  const [bugs,     setBugs]     = useState([]);
  const [users,    setUsers]    = useState([]);
  const [devs,     setDevs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const load = useCallback(() =>
    Promise.all([fetchBugs(), fetchUsers(), fetchDevelopers()])
      .then(([b, u, d]) => { setBugs(b); setUsers(u); setDevs(d); })
      .finally(() => setLoading(false))
  , []);

  useEffect(() => { load(); }, [load]);

  const getUserById = id => users.find(u => u.id === id);

  function bugsByCol(col) {
    return bugs.filter(b => b.status === col);
  }

  /* ── Drag & drop ────────────────────────────────────────────────────────── */
  function onDragStart(e, bugId) {
    setDragging(bugId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bugId);
  }

  function onDragOver(e, col) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(col);
  }

  function onDragLeave() { setDragOver(null); }

  async function onDrop(e, col) {
    e.preventDefault();
    setDragOver(null);
    const bugId = e.dataTransfer.getData('text/plain');
    if (!bugId) return;
    const bug = bugs.find(b => b.id === bugId);
    if (!bug || bug.status === col) return;

    const allowed = TRANSITIONS[bug.status] ?? [];
    if (!allowed.includes(col)) return;

    try {
      let updated;
      if (col === 'Assigned') {
        const dev = devs[0];
        if (!dev) return;
        updated = await assignBug(bugId, { assignedTo: dev.id, byUserId: CURRENT_USER_ID });
      } else {
        updated = await transitionBug(bugId, { toStatus: col, byUserId: CURRENT_USER_ID });
      }
      setBugs(bs => bs.map(b => b.id === updated.id ? updated : b));
    } catch (_) {}

    setDragging(null);
  }

  function onDragEnd() { setDragging(null); setDragOver(null); }

  function updateBug(updated) {
    setBugs(bs => bs.map(b => b.id === updated.id ? updated : b));
    setSelected(updated);
  }

  function handleDeleted(id) {
    setBugs(bs => bs.filter(b => b.id !== id));
    setSelected(null);
    setToDelete(null);
  }

  if (loading) return <div className="page-loading" aria-live="polite">Loading board…</div>;

  return (
    <div className="board-page">
      <header className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Kanban Board</h1>
          <p className="page-sub">Drag cards between columns to transition bugs</p>
        </div>
        <Link to="/bugs/new" className="btn btn--primary"><Plus size={14} /> Report Bug</Link>
      </header>

      <div className="board" role="list" aria-label="Bug board columns">
        {COLUMNS.map(col => {
          const colBugs = bugsByCol(col);
          const meta    = STATUS_META[col];
          const isOver  = dragOver === col;
          return (
            <div
              key={col}
              className={`board-col${isOver ? ' board-col--over' : ''}`}
              onDragOver={e => onDragOver(e, col)}
              onDragLeave={onDragLeave}
              onDrop={e => onDrop(e, col)}
              role="listitem"
              aria-label={`${col} column, ${colBugs.length} bug${colBugs.length !== 1 ? 's' : ''}`}
            >
              <div className="board-col__header" style={{ '--col-color': meta.color }}>
                <span className="board-col__dot" style={{ background: meta.color }} />
                <span className="board-col__title">{col}</span>
                <span className="board-col__count">{colBugs.length}</span>
              </div>

              <div className="board-col__cards">
                {colBugs.map(bug => {
                  const assignee = bug.assignedTo ? getUserById(bug.assignedTo) : null;
                  return (
                    <div
                      key={bug.id}
                      className={`board-card${dragging === bug.id ? ' board-card--dragging' : ''}`}
                      draggable
                      onDragStart={e => onDragStart(e, bug.id)}
                      onDragEnd={onDragEnd}
                      onClick={() => setSelected(bug)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Bug ${bug.id}: ${bug.title}`}
                      onKeyDown={e => e.key === 'Enter' && setSelected(bug)}
                    >
                      <div className="board-card__grip" aria-hidden="true">
                        <GripVertical size={12} />
                      </div>
                      <div className="board-card__id">{bug.id}</div>
                      <div className="board-card__title">{bug.title}</div>
                      <div className="board-card__badges">
                        <PriorityBadge priority={bug.priority} />
                        <SeverityBadge severity={bug.severity} />
                      </div>
                      <div className="board-card__footer">
                        <Avatar user={assignee} size={22} />
                        {!assignee && <span className="board-card__unassigned">Unassigned</span>}
                      </div>
                    </div>
                  );
                })}
                {colBugs.length === 0 && (
                  <div className="board-col__empty" aria-label="No bugs in this column">Drop here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <Modal title={`${selected.id} — Bug Details`} onClose={() => setSelected(null)} size="xl">
          <BugDetail
            bug={selected}
            users={users}
            developers={devs}
            onUpdate={updateBug}
            onDelete={bug => { setToDelete(bug); setSelected(null); }}
          />
        </Modal>
      )}

      {toDelete && (
        <Modal title="Delete Bug" onClose={() => setToDelete(null)} size="sm">
          <DeleteBugModal
            bug={toDelete}
            onDeleted={handleDeleted}
            onClose={() => setToDelete(null)}
          />
        </Modal>
      )}
    </div>
  );
}
