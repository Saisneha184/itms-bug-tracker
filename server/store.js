import { v4 as uuidv4 } from 'uuid';
import { STATUS, ROLE } from './constants.js';

let userCounter = 5;

const users = [
  { id: 'u1', name: 'Alice Johnson', role: ROLE.MANAGER,   avatar: 'AJ', email: 'alice@itms.dev',  phone: '+1 555-0101', department: 'Engineering', joinedAt: '2023-01-15T09:00:00.000Z', active: true },
  { id: 'u2', name: 'Bob Smith',     role: ROLE.DEVELOPER, avatar: 'BS', email: 'bob@itms.dev',    phone: '+1 555-0102', department: 'Engineering', joinedAt: '2023-02-20T09:00:00.000Z', active: true },
  { id: 'u3', name: 'Carol White',   role: ROLE.DEVELOPER, avatar: 'CW', email: 'carol@itms.dev',  phone: '+1 555-0103', department: 'Engineering', joinedAt: '2023-03-10T09:00:00.000Z', active: true },
  { id: 'u4', name: 'Dave Brown',    role: ROLE.QA,        avatar: 'DB', email: 'dave@itms.dev',   phone: '+1 555-0104', department: 'Quality',     joinedAt: '2023-04-05T09:00:00.000Z', active: true },
  { id: 'u5', name: 'Eve Davis',     role: ROLE.REPORTER,  avatar: 'ED', email: 'eve@itms.dev',    phone: '+1 555-0105', department: 'Product',     joinedAt: '2023-05-18T09:00:00.000Z', active: true },
];

const bugs = [];
let bugCounter = 0;

// ── Users ──────────────────────────────────────────────────────────────────────
export const getAllUsers   = () => [...users];
export const getUserById  = id => users.find(u => u.id === id) ?? null;
export const getDevelopers = () => users.filter(u => u.role === ROLE.DEVELOPER);

export function createUser({ name, role, email, phone, department }) {
  if (!name?.trim()) throw new Error('Name is required');
  if (!Object.values(ROLE).includes(role)) throw new Error(`Invalid role: ${role}`);
  if (users.find(u => u.email?.toLowerCase() === email?.toLowerCase()))
    throw new Error('A user with this email already exists');

  userCounter += 1;
  const initials = name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const user = {
    id:         `u${userCounter}`,
    name:       name.trim(),
    role,
    avatar:     initials,
    email:      email?.trim() ?? '',
    phone:      phone?.trim() ?? '',
    department: department?.trim() ?? '',
    joinedAt:   new Date().toISOString(),
    active:     true,
  };
  users.push(user);
  return user;
}

export function updateUser(id, { name, role, email, phone, department, active }) {
  const user = getUserById(id);
  if (!user) throw new Error(`User "${id}" not found`);

  // Check email uniqueness (ignore self)
  if (email && users.find(u => u.id !== id && u.email?.toLowerCase() === email.toLowerCase()))
    throw new Error('A user with this email already exists');

  if (name       !== undefined) { user.name       = name.trim(); user.avatar = name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(); }
  if (role       !== undefined) user.role       = role;
  if (email      !== undefined) user.email      = email.trim();
  if (phone      !== undefined) user.phone      = phone.trim();
  if (department !== undefined) user.department = department.trim();
  if (active     !== undefined) user.active     = active;

  return user;
}

export function deleteUser(id) {
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error(`User "${id}" not found`);
  const [removed] = users.splice(idx, 1);
  return removed;
}

// ── Bugs ───────────────────────────────────────────────────────────────────────
export function createBug({ title, description, priority, severity, reportedBy }) {
  bugCounter += 1;
  const bug = {
    id:         `BUG-${String(bugCounter).padStart(4, '0')}`,
    title, description, priority, severity,
    status:     STATUS.OPEN,
    reportedBy,
    assignedTo: null,
    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString(),
    history: [{
      id:      uuidv4(),
      from:    null,
      to:      STATUS.OPEN,
      by:      reportedBy,
      at:      new Date().toISOString(),
      comment: 'Bug reported and opened.',
    }],
    comments: [],
  };
  bugs.push(bug);
  return bug;
}

export const getBugById  = id => bugs.find(b => b.id === id) ?? null;
export const getAllBugs   = (statusFilter = null) =>
  statusFilter ? bugs.filter(b => b.status === statusFilter) : [...bugs];

export function updateBugStatus(bugId, { newStatus, byUserId, assignedTo, comment }) {
  const bug = getBugById(bugId);
  if (!bug) throw new Error(`Bug ${bugId} not found`);
  const prev = bug.status;
  bug.status    = newStatus;
  bug.updatedAt = new Date().toISOString();
  if (assignedTo !== undefined) bug.assignedTo = assignedTo;
  bug.history.push({
    id:      uuidv4(),
    from:    prev,
    to:      newStatus,
    by:      byUserId,
    at:      new Date().toISOString(),
    comment: comment || `Status changed from ${prev} to ${newStatus}.`,
  });
  return bug;
}

export function addComment(bugId, { userId, text }) {
  const bug = getBugById(bugId);
  if (!bug) throw new Error(`Bug ${bugId} not found`);
  const c = { id: uuidv4(), by: userId, at: new Date().toISOString(), text };
  bug.comments.push(c);
  bug.updatedAt = new Date().toISOString();
  return c;
}

export function deleteBug(id) {
  const idx = bugs.findIndex(b => b.id === id);
  if (idx === -1) throw new Error(`Bug "${id}" not found`);
  const [removed] = bugs.splice(idx, 1);
  return removed;
}

export function getBugStats() {
  return bugs.reduce((acc, b) => ({ ...acc, [b.status]: (acc[b.status] ?? 0) + 1 }), {});
}

// ── Seed demo data ─────────────────────────────────────────────────────────────
export function seedDemoData() {
  if (bugs.length > 0) return; // already seeded

  const b1 = createBug({ title: 'Login page crashes on empty password', description: 'When user submits the login form with an empty password field, the page throws an uncaught JS error and becomes unresponsive.', priority: 'Critical', severity: 'Blocker', reportedBy: 'u5' });
  const b2 = createBug({ title: 'Dashboard chart not rendering in Safari', description: 'The D3 chart on the dashboard page renders correctly in Chrome but is completely blank in Safari 16+.', priority: 'High', severity: 'Major', reportedBy: 'u4' });
  const b3 = createBug({ title: 'Export to CSV strips special characters', description: 'Exporting records with accented characters (é, ü, ñ) produces garbled output in the CSV file.', priority: 'Medium', severity: 'Major', reportedBy: 'u5' });
  const b4 = createBug({ title: 'Tooltip flickers on slow hover', description: 'The info tooltip on the settings page flickers when the mouse moves slowly across the trigger element.', priority: 'Low', severity: 'Minor', reportedBy: 'u4' });
  const b5 = createBug({ title: 'Pagination resets on table sort', description: 'Clicking a column header to sort a table resets the current page number back to page 1 unexpectedly.', priority: 'Medium', severity: 'Major', reportedBy: 'u5' });
  const b6 = createBug({ title: 'User profile image not uploading', description: 'Profile image upload silently fails for PNG files larger than 2MB. No error message is displayed.', priority: 'High', severity: 'Major', reportedBy: 'u4' });

  updateBugStatus(b1.id, { newStatus: 'Assigned', byUserId: 'u1', assignedTo: 'u2', comment: 'Highest priority — Bob please handle immediately.' });
  updateBugStatus(b2.id, { newStatus: 'Assigned', byUserId: 'u1', assignedTo: 'u3', comment: 'Carol, please investigate Safari compatibility.' });
  updateBugStatus(b3.id, { newStatus: 'Assigned', byUserId: 'u1', assignedTo: 'u2', comment: 'Assigned to Bob for CSV encoder investigation.' });
  updateBugStatus(b5.id, { newStatus: 'Assigned', byUserId: 'u1', assignedTo: 'u3', comment: 'Carol, sort + pagination fix.' });
  updateBugStatus(b6.id, { newStatus: 'Assigned', byUserId: 'u1', assignedTo: 'u2', comment: 'Bob, check the upload size limit.' });

  updateBugStatus(b2.id, { newStatus: 'Fixed', byUserId: 'u3', comment: 'Replaced SVG foreignObject with HTML fallback for Safari.' });
  updateBugStatus(b5.id, { newStatus: 'Fixed', byUserId: 'u3', comment: 'Reset page index to 0 in sort handler.' });
  updateBugStatus(b6.id, { newStatus: 'Fixed', byUserId: 'u2', comment: 'Increased upload limit to 10MB and added client-side validation.' });

  updateBugStatus(b2.id, { newStatus: 'Closed', byUserId: 'u4', comment: 'Verified on Safari 16 — chart renders correctly.' });
  updateBugStatus(b6.id, { newStatus: 'Closed', byUserId: 'u4', comment: 'Upload working. Closing.' });

  updateBugStatus(b1.id, { newStatus: 'Fixed', byUserId: 'u2', comment: 'Added null-check guard on password field.' });
  updateBugStatus(b1.id, { newStatus: 'Reopened', byUserId: 'u4', comment: 'Still crashes with whitespace-only password. Reopened.' });

  addComment(b3.id, { userId: 'u2', text: 'Looking into the CSV encoder — might be a BOM issue with the file encoding.' });
  addComment(b4.id, { userId: 'u4', text: 'Low priority but noticeable. Will pick up next sprint.' });
  addComment(b1.id, { userId: 'u1', text: 'This is blocking the release. Needs immediate attention.' });
}
