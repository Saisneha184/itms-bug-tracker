import { useEffect, useState, useMemo } from 'react';
import { fetchUsers, fetchBugs, createUser, updateUser, deleteUser } from '../api.js';
import { Avatar } from '../components/Avatar.jsx';
import { StatusBadge } from '../components/Badge.jsx';
import { Modal } from '../components/Modal.jsx';
import {
  UserPlus, Search, Edit2, Trash2, Mail, Phone,
  Building2, ShieldCheck, CheckCircle2, XCircle,
  MoreVertical, Users, ChevronDown, Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { CURRENT_USER_ID } from '../constants.js';
import './Team.css';

const ROLES       = ['Manager', 'Developer', 'QA', 'Reporter'];
const DEPARTMENTS = ['Engineering', 'Quality', 'Product', 'Design', 'DevOps', 'Management'];

const ROLE_META = {
  Manager:   { color: '#8b5cf6', bg: 'rgba(139,91,246,0.15)'  },
  Developer: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)'  },
  QA:        { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)'   },
  Reporter:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
};

// ─── Main component ────────────────────────────────────────────────────────────
export function Team() {
  const [users,   setUsers]   = useState([]);
  const [bugs,    setBugs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [view,    setView]    = useState('grid'); // 'grid' | 'list'
  const [modal,   setModal]   = useState(null);  // null | 'add' | { type:'edit'|'delete'|'view', user }
  const [menuOpen, setMenuOpen] = useState(null); // userId

  const load = () =>
    Promise.all([fetchUsers(), fetchBugs()])
      .then(([u, b]) => { setUsers(u); setBugs(b); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // Close kebab menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  const bugCount = (uid) => ({
    reported: bugs.filter(b => b.reportedBy === uid).length,
    assigned: bugs.filter(b => b.assignedTo === uid).length,
    resolved: bugs.filter(b => b.assignedTo === uid && ['Fixed','Closed'].includes(b.status)).length,
    active:   bugs.filter(b => b.assignedTo === uid && !['Closed'].includes(b.status)),
  });

  const filtered = useMemo(() => users
    .filter(u => roleFilter === 'All' || u.role === roleFilter)
    .filter(u => {
      const q = search.toLowerCase();
      return !q || u.name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q);
    }), [users, roleFilter, search]);

  const roleCounts = useMemo(() =>
    ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {}),
  [users]);

  function handleAdded(user)   { setUsers(u => [...u, user]); setModal(null); }
  function handleUpdated(user) { setUsers(u => u.map(x => x.id === user.id ? user : x)); setModal(null); }
  function handleDeleted(id)   { setUsers(u => u.filter(x => x.id !== id)); setModal(null); }

  if (loading) return <div className="page-loading" aria-live="polite">Loading team…</div>;

  return (
    <div className="team-page">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p  className="page-sub">{users.length} member{users.length !== 1 ? 's' : ''} in ITMS project</p>
        </div>
        <button className="btn btn--primary" onClick={() => setModal('add')}>
          <UserPlus size={14} /> Add Member
        </button>
      </header>

      {/* ── Role stat chips ────────────────────────────────────────────────── */}
      <div className="team-role-chips" role="list" aria-label="Members by role">
        <div className="team-role-chip" role="listitem">
          <Users size={13} />
          <span>All</span>
          <span className="role-chip-count">{users.length}</span>
        </div>
        {ROLES.map(r => (
          <div key={r} className="team-role-chip" role="listitem" style={{ '--rc': ROLE_META[r]?.color }}>
            <span className="role-dot" style={{ background: ROLE_META[r]?.color }} />
            <span>{r}</span>
            <span className="role-chip-count">{roleCounts[r] ?? 0}</span>
          </div>
        ))}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="team-toolbar">
        <div className="search-box">
          <Search size={13} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            className="search-input"
            placeholder="Search by name, email, department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search team members"
          />
        </div>

        <div className="team-toolbar__right">
          {/* Role filter */}
          <div className="role-filter" role="group" aria-label="Filter by role">
            <Filter size={12} style={{ color: 'var(--text-muted)' }} />
            {['All', ...ROLES].map(r => (
              <button
                key={r}
                className={`role-filter__btn${roleFilter === r ? ' role-filter__btn--active' : ''}`}
                onClick={() => setRoleFilter(r)}
                style={roleFilter === r && r !== 'All' ? { color: ROLE_META[r]?.color, borderColor: `${ROLE_META[r]?.color}55`, background: ROLE_META[r]?.bg } : {}}
              >
                {r}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="view-toggle" role="group" aria-label="Switch view">
            <button
              className={`view-btn${view === 'grid' ? ' view-btn--active' : ''}`}
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
              title="Grid view"
            >
              ⊞
            </button>
            <button
              className={`view-btn${view === 'list' ? ' view-btn--active' : ''}`}
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="team-empty" aria-live="polite">
          <Users size={32} style={{ color: 'var(--text-muted)' }} />
          <p>No members found{search ? ` for "${search}"` : ''}.</p>
          <button className="btn btn--primary btn--sm" onClick={() => setModal('add')}>
            <UserPlus size={12} /> Add Member
          </button>
        </div>
      )}

      {/* ── Grid view ─────────────────────────────────────────────────────── */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="team-grid" role="list" aria-label="Team members">
          {filtered.map(user => {
            const bc = bugCount(user.id);
            const roleMeta = ROLE_META[user.role] ?? { color: '#8b949e', bg: 'rgba(139,148,158,0.15)' };
            return (
              <div key={user.id} className="team-card" role="listitem">

                {/* Kebab menu */}
                <div className="team-card__menu">
                  <button
                    className="kebab-btn"
                    aria-label={`Options for ${user.name}`}
                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === user.id ? null : user.id); }}
                  >
                    <MoreVertical size={15} />
                  </button>
                  {menuOpen === user.id && (
                    <div className="kebab-dropdown" role="menu" onClick={e => e.stopPropagation()}>
                      <button role="menuitem" className="kebab-item" onClick={() => { setModal({ type: 'view', user }); setMenuOpen(null); }}>
                        <Users size={13} /> View Profile
                      </button>
                      <button role="menuitem" className="kebab-item" onClick={() => { setModal({ type: 'edit', user }); setMenuOpen(null); }}>
                        <Edit2 size={13} /> Edit Member
                      </button>
                      <button role="menuitem" className="kebab-item kebab-item--danger" disabled={user.id === CURRENT_USER_ID} title={user.id === CURRENT_USER_ID ? 'You cannot remove the account the app runs as' : undefined} onClick={() => { setModal({ type: 'delete', user }); setMenuOpen(null); }}>
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Avatar + name */}
                <div className="team-card__top">
                  <Avatar user={user} size={52} />
                  <div>
                    <div className="team-card__name">{user.name}</div>
                    <span className="role-badge" style={{ color: roleMeta.color, background: roleMeta.bg }}>
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Contact */}
                <div className="team-card__contact">
                  {user.email && (
                    <div className="contact-row">
                      <Mail size={11} aria-hidden="true" />
                      <a href={`mailto:${user.email}`} className="contact-link">{user.email}</a>
                    </div>
                  )}
                  {user.phone && (
                    <div className="contact-row">
                      <Phone size={11} aria-hidden="true" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.department && (
                    <div className="contact-row">
                      <Building2 size={11} aria-hidden="true" />
                      <span>{user.department}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="team-card__stats">
                  <StatBlock val={bc.reported} label="Reported" />
                  <StatBlock val={bc.assigned} label="Assigned" />
                  <StatBlock val={bc.resolved} label="Resolved" color="#22c55e" />
                </div>

                {/* Active bugs */}
                {bc.active.length > 0 && (
                  <div className="team-card__bugs">
                    <div className="team-card__bugs-title">Active bugs</div>
                    {bc.active.slice(0, 3).map(b => (
                      <div key={b.id} className="team-bug-row">
                        <span className="team-bug-id">{b.id}</span>
                        <span className="team-bug-title">{b.title}</span>
                        <StatusBadge status={b.status} />
                      </div>
                    ))}
                    {bc.active.length > 3 && (
                      <div className="team-bug-more">+{bc.active.length - 3} more</div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="team-card__footer">
                  <span className="team-card__joined">
                    Joined {user.joinedAt ? format(new Date(user.joinedAt), 'MMM yyyy') : '—'}
                  </span>
                  <span className={`team-card__status ${user.active !== false ? 'active' : 'inactive'}`}>
                    {user.active !== false ? <><CheckCircle2 size={10} /> Active</> : <><XCircle size={10} /> Inactive</>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List view ─────────────────────────────────────────────────────── */}
      {view === 'list' && filtered.length > 0 && (
        <div className="team-table-wrap">
          <table className="team-table" aria-label="Team members list">
            <thead>
              <tr>
                <th className="team-th">Member</th>
                <th className="team-th">Role</th>
                <th className="team-th">Department</th>
                <th className="team-th">Email</th>
                <th className="team-th">Bugs</th>
                <th className="team-th">Status</th>
                <th className="team-th">Joined</th>
                <th className="team-th" aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const bc = bugCount(user.id);
                const roleMeta = ROLE_META[user.role] ?? { color: '#8b949e', bg: 'rgba(139,148,158,0.15)' };
                return (
                  <tr key={user.id} className="team-tr">
                    <td className="team-td">
                      <div className="team-td__user">
                        <Avatar user={user} size={30} />
                        <span className="team-td__name">{user.name}</span>
                      </div>
                    </td>
                    <td className="team-td">
                      <span className="role-badge" style={{ color: roleMeta.color, background: roleMeta.bg }}>{user.role}</span>
                    </td>
                    <td className="team-td team-td--muted">{user.department || '—'}</td>
                    <td className="team-td team-td--muted">{user.email || '—'}</td>
                    <td className="team-td">
                      <div className="team-td__bugs">
                        <span title="Assigned">{bc.assigned}</span>
                        <span className="team-td__bugs-sep">/</span>
                        <span title="Resolved" style={{ color: '#22c55e' }}>{bc.resolved}</span>
                      </div>
                    </td>
                    <td className="team-td">
                      <span className={`team-status ${user.active !== false ? 'active' : 'inactive'}`}>
                        {user.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="team-td team-td--muted">
                      {user.joinedAt ? format(new Date(user.joinedAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="team-td team-td--actions">
                      <button className="icon-btn" title="Edit" onClick={() => setModal({ type: 'edit', user })} aria-label={`Edit ${user.name}`}>
                        <Edit2 size={13} />
                      </button>
                      <button className="icon-btn icon-btn--danger" title="Remove" disabled={user.id === CURRENT_USER_ID} onClick={() => setModal({ type: 'delete', user })} aria-label={`Remove ${user.name}`}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {modal === 'add' && (
        <Modal title="Add Team Member" onClose={() => setModal(null)} size="md">
          <MemberForm onSave={handleAdded} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit Team Member" onClose={() => setModal(null)} size="md">
          <MemberForm user={modal.user} onSave={handleUpdated} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal?.type === 'delete' && (
        <Modal title="Remove Team Member" onClose={() => setModal(null)} size="sm">
          <DeleteConfirm user={modal.user} onConfirm={handleDeleted} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal?.type === 'view' && (
        <Modal title="Member Profile" onClose={() => setModal(null)} size="md">
          <MemberProfile user={modal.user} bugs={bugs} onEdit={() => setModal({ type: 'edit', user: modal.user })} />
        </Modal>
      )}
    </div>
  );
}

// ─── Add / Edit form ───────────────────────────────────────────────────────────
function MemberForm({ user, onSave, onClose }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    name:       user?.name       ?? '',
    role:       user?.role       ?? 'Developer',
    email:      user?.email      ?? '',
    phone:      user?.phone      ?? '',
    department: user?.department ?? 'Engineering',
    active:     user?.active     ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  function validate() {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const saved = isEdit
        ? await updateUser(user.id, form)
        : await createUser(form);
      onSave(saved);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="member-form" onSubmit={handleSubmit} noValidate>

      {/* Avatar preview */}
      <div className="member-form__avatar-row">
        <Avatar
          user={{ ...user, name: form.name || 'New Member', avatar: form.name.trim().split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || 'NM' }}
          size={56}
        />
        <div>
          <div className="member-form__preview-name">{form.name || <span style={{ color: 'var(--text-muted)' }}>Full name</span>}</div>
          <span className="role-badge" style={{ color: ROLE_META[form.role]?.color, background: ROLE_META[form.role]?.bg }}>
            {form.role}
          </span>
        </div>
      </div>

      <div className="form-divider" />

      {/* Name */}
      <div className="form-group">
        <label className="form-label" htmlFor="mf-name">Full Name <span className="required">*</span></label>
        <input
          id="mf-name"
          className={`form-input${errors.name ? ' form-input--error' : ''}`}
          placeholder="e.g. John Smith"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          aria-required="true"
          aria-describedby={errors.name ? 'mf-name-err' : undefined}
        />
        {errors.name && <span id="mf-name-err" className="form-error-text" role="alert">{errors.name}</span>}
      </div>

      {/* Role + Department */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="mf-role">Role</label>
          <select id="mf-role" className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="mf-dept">Department</label>
          <select id="mf-dept" className="form-select" value={form.department} onChange={e => set('department', e.target.value)}>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Email */}
      <div className="form-group">
        <label className="form-label" htmlFor="mf-email">Email <span className="required">*</span></label>
        <div className="input-icon-wrap">
          <Mail size={13} className="input-icon" aria-hidden="true" />
          <input
            id="mf-email"
            className={`form-input form-input--icon${errors.email ? ' form-input--error' : ''}`}
            type="email"
            placeholder="name@company.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            aria-required="true"
            aria-describedby={errors.email ? 'mf-email-err' : undefined}
          />
        </div>
        {errors.email && <span id="mf-email-err" className="form-error-text" role="alert">{errors.email}</span>}
      </div>

      {/* Phone */}
      <div className="form-group">
        <label className="form-label" htmlFor="mf-phone">Phone <span className="form-optional">(optional)</span></label>
        <div className="input-icon-wrap">
          <Phone size={13} className="input-icon" aria-hidden="true" />
          <input
            id="mf-phone"
            className="form-input form-input--icon"
            type="tel"
            placeholder="+1 555-0100"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
          />
        </div>
      </div>

      {/* Active toggle (edit only) */}
      {isEdit && (
        <div className="form-group">
          <label className="form-label">Status</label>
          <div className="toggle-row">
            <button
              type="button"
              className={`toggle-btn${form.active ? ' toggle-btn--on' : ''}`}
              onClick={() => set('active', !form.active)}
              role="switch"
              aria-checked={form.active}
            >
              <span className="toggle-thumb" />
            </button>
            <span className="toggle-label">{form.active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      )}

      {errors.submit && (
        <div className="form-error-box" role="alert">{errors.submit}</div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading
            ? <><span className="spinner" aria-hidden="true" /> Saving…</>
            : isEdit ? 'Save Changes' : 'Add Member'
          }
        </button>
      </div>
    </form>
  );
}

// ─── Delete confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ user, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteUser(user.id);
      onConfirm(user.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="delete-confirm">
      <div className="delete-confirm__icon" aria-hidden="true">⚠️</div>
      <h3 className="delete-confirm__title">Remove {user.name}?</h3>
      <p className="delete-confirm__body">
        This will remove <strong>{user.name}</strong> ({user.role}) from the ITMS project.
        This action cannot be undone.
      </p>
      {error && <p className="form-error-text" role="alert">{error}</p>}
      <div className="form-actions" style={{ justifyContent: 'center' }}>
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn--danger" onClick={handleDelete} disabled={loading}>
          {loading ? 'Removing…' : 'Yes, Remove'}
        </button>
      </div>
    </div>
  );
}

// ─── Member profile view ───────────────────────────────────────────────────────
function MemberProfile({ user, bugs, onEdit }) {
  const reported = bugs.filter(b => b.reportedBy === user.id);
  const assigned = bugs.filter(b => b.assignedTo === user.id);
  const resolved = assigned.filter(b => ['Fixed','Closed'].includes(b.status));
  const active   = assigned.filter(b => !['Closed'].includes(b.status));
  const roleMeta = ROLE_META[user.role] ?? { color: '#8b949e', bg: 'rgba(139,148,158,0.15)' };

  return (
    <div className="member-profile">
      {/* Hero */}
      <div className="member-profile__hero">
        <Avatar user={user} size={64} />
        <div className="member-profile__info">
          <h2 className="member-profile__name">{user.name}</h2>
          <span className="role-badge" style={{ color: roleMeta.color, background: roleMeta.bg }}>{user.role}</span>
          <span className={`team-status ${user.active !== false ? 'active' : 'inactive'}`} style={{ marginLeft: 8 }}>
            {user.active !== false ? 'Active' : 'Inactive'}
          </span>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={onEdit} style={{ marginLeft: 'auto', alignSelf: 'flex-start' }}>
          <Edit2 size={12} /> Edit
        </button>
      </div>

      {/* Contact details */}
      <div className="member-profile__details">
        <ProfileRow icon={<Mail size={13}/>}      label="Email"      value={user.email      || '—'} />
        <ProfileRow icon={<Phone size={13}/>}     label="Phone"      value={user.phone      || '—'} />
        <ProfileRow icon={<Building2 size={13}/>} label="Department" value={user.department || '—'} />
        <ProfileRow icon={<ShieldCheck size={13}/>} label="Joined"   value={user.joinedAt ? format(new Date(user.joinedAt), 'dd MMMM yyyy') : '—'} />
      </div>

      {/* Bug stats */}
      <div className="member-profile__stats">
        <StatBlock val={reported.length} label="Reported"  />
        <StatBlock val={assigned.length} label="Assigned"  />
        <StatBlock val={resolved.length} label="Resolved" color="#22c55e" />
        <StatBlock val={active.length}   label="Active"   color="#f59e0b" />
      </div>

      {/* Active bugs list */}
      {active.length > 0 && (
        <div className="member-profile__bugs">
          <div className="section-title" style={{ marginBottom: 10 }}>Active Bugs</div>
          {active.map(b => (
            <div key={b.id} className="team-bug-row">
              <span className="team-bug-id">{b.id}</span>
              <span className="team-bug-title">{b.title}</span>
              <StatusBadge status={b.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function StatBlock({ val, label, color }) {
  return (
    <div className="stat-block">
      <span className="stat-block__val" style={color ? { color } : {}}>{val}</span>
      <span className="stat-block__label">{label}</span>
    </div>
  );
}

function ProfileRow({ icon, label, value }) {
  return (
    <div className="profile-row">
      <span className="profile-row__icon">{icon}</span>
      <span className="profile-row__label">{label}</span>
      <span className="profile-row__value">{value}</span>
    </div>
  );
}
