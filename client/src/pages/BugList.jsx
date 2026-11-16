import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchBugs, fetchUsers, fetchDevelopers } from '../api.js';
import { StatusBadge, PriorityBadge, SeverityBadge } from '../components/Badge.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { Modal } from '../components/Modal.jsx';
import { BugForm } from '../components/BugForm.jsx';
import { BugDetail } from '../components/BugDetail.jsx';
import { DeleteBugModal } from '../components/DeleteBugModal.jsx';
import { format } from 'date-fns';
import { Search, Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import './BugList.css';

const STATUSES = ['All', 'Open', 'Assigned', 'Fixed', 'Closed', 'Reopened'];

export function BugList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bugs,     setBugs]     = useState([]);
  const [users,    setUsers]    = useState([]);
  const [devs,     setDevs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [sort,     setSort]     = useState({ key: 'updatedAt', dir: 'desc' });
  const [modal,    setModal]    = useState(null); // 'create' | 'detail' | 'delete'
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const statusFilter = searchParams.get('status') ?? 'All';

  const load = useCallback(() =>
    Promise.all([fetchBugs(), fetchUsers(), fetchDevelopers()])
      .then(([b, u, d]) => { setBugs(b); setUsers(u); setDevs(d); })
      .finally(() => setLoading(false))
  , []);

  useEffect(() => { load(); }, [load]);

  const getUserById = id => users.find(u => u.id === id);

  function setStatusFilter(s) {
    s === 'All' ? searchParams.delete('status') : searchParams.set('status', s);
    setSearchParams(searchParams);
  }

  function toggleSort(key) {
    setSort(s => s.key === key
      ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' }
    );
  }

  const filtered = bugs
    .filter(b => statusFilter === 'All' || b.status === statusFilter)
    .filter(b => {
      const q = search.toLowerCase();
      return !q || b.title.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let va = a[sort.key], vb = b[sort.key];
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ?  1 : -1;
      return 0;
    });

  function handleCreated(bug) { setBugs(bs => [bug, ...bs]); setModal(null); }
  function handleUpdated(bug) { setBugs(bs => bs.map(b => b.id === bug.id ? bug : b)); setSelected(bug); }
  function handleDeleted(id)  { setBugs(bs => bs.filter(b => b.id !== id)); setModal(null); setToDelete(null); }

  function openDelete(e, bug) {
    e.stopPropagation(); // don't open the detail modal
    setToDelete(bug);
    setModal('delete');
  }

  if (loading) return <div className="page-loading" aria-live="polite">Loading bugs…</div>;

  return (
    <div className="bug-list-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Bug List</h1>
          <p className="page-sub">{filtered.length} of {bugs.length} bug{bugs.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setModal('create')}>
          <Plus size={14} /> Report Bug
        </button>
      </header>

      {/* Toolbar */}
      <div className="bug-list__toolbar">
        <div className="search-box">
          <Search size={13} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            className="search-input"
            placeholder="Search bugs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search bugs"
          />
        </div>

        <div className="status-tabs" role="tablist" aria-label="Filter by status">
          {STATUSES.map(s => (
            <button
              key={s}
              role="tab"
              aria-selected={statusFilter === s}
              className={`status-tab${statusFilter === s ? ' status-tab--active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
              <span className="status-tab__count">
                {s === 'All' ? bugs.length : bugs.filter(b => b.status === s).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bug-table-wrap">
        <table className="bug-table" aria-label="Bug list">
          <thead>
            <tr>
              <Th label="ID"       col="id"        sort={sort} toggle={toggleSort} />
              <Th label="Title"    col="title"     sort={sort} toggle={toggleSort} />
              <Th label="Status"   col="status"    sort={sort} toggle={toggleSort} />
              <Th label="Priority" col="priority"  sort={sort} toggle={toggleSort} />
              <Th label="Severity" col="severity"  sort={sort} toggle={toggleSort} />
              <th className="bug-table__th">Assignee</th>
              <Th label="Updated"  col="updatedAt" sort={sort} toggle={toggleSort} />
              <th className="bug-table__th bug-table__th--action" aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="bug-table__empty">No bugs found.</td></tr>
            )}
            {filtered.map(bug => {
              const assignee = bug.assignedTo ? getUserById(bug.assignedTo) : null;
              return (
                <tr
                  key={bug.id}
                  className="bug-table__row"
                  onClick={() => { setSelected(bug); setModal('detail'); }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View bug ${bug.id}`}
                  onKeyDown={e => e.key === 'Enter' && (setSelected(bug), setModal('detail'))}
                >
                  <td className="bug-table__td bug-table__id">{bug.id}</td>
                  <td className="bug-table__td bug-table__title">{bug.title}</td>
                  <td className="bug-table__td"><StatusBadge status={bug.status} /></td>
                  <td className="bug-table__td"><PriorityBadge priority={bug.priority} /></td>
                  <td className="bug-table__td"><SeverityBadge severity={bug.severity} /></td>
                  <td className="bug-table__td">
                    <div className="bug-table__assignee">
                      <Avatar user={assignee} size={22} />
                      <span>{assignee?.name ?? <span className="text-muted">—</span>}</span>
                    </div>
                  </td>
                  <td className="bug-table__td bug-table__time">
                    {format(new Date(bug.updatedAt), 'dd MMM, HH:mm')}
                  </td>
                  {/* Delete action */}
                  <td className="bug-table__td bug-table__td--action" onClick={e => e.stopPropagation()}>
                    <button
                      className="del-row-btn"
                      title={`Delete ${bug.id}`}
                      aria-label={`Delete bug ${bug.id}`}
                      onClick={e => openDelete(e, bug)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal === 'create' && (
        <Modal title="Report New Bug" onClose={() => setModal(null)} size="md">
          <BugForm users={users} onSuccess={handleCreated} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal === 'detail' && selected && (
        <Modal
          title={`${selected.id} — Bug Details`}
          onClose={() => { setModal(null); setSelected(null); }}
          size="xl"
        >
          <BugDetail
            bug={selected}
            users={users}
            developers={devs}
            onUpdate={handleUpdated}
            onDelete={bug => { setModal('delete'); setToDelete(bug); }}
          />
        </Modal>
      )}

      {modal === 'delete' && toDelete && (
        <Modal title="Delete Bug" onClose={() => { setModal(null); setToDelete(null); }} size="sm">
          <DeleteBugModal
            bug={toDelete}
            onDeleted={handleDeleted}
            onClose={() => { setModal(null); setToDelete(null); }}
          />
        </Modal>
      )}
    </div>
  );
}

function Th({ label, col, sort, toggle }) {
  const active = sort.key === col;
  return (
    <th
      className={`bug-table__th bug-table__th--sortable${active ? ' active' : ''}`}
      onClick={() => toggle(col)}
    >
      <span>{label}</span>
      <span aria-hidden="true">
        {active
          ? (sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
          : <ChevronUp size={11} style={{ opacity: 0.3 }} />}
      </span>
    </th>
  );
}
