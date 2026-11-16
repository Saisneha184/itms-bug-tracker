/**
 * ITMS Bug Tracking Agent — In-memory Store
 * Manages bugs and users. Can be swapped for a DB adapter without changing the agent logic.
 */

import { v4 as uuidv4 } from 'uuid';
import { STATUS, ROLE } from './constants.js';

// ─── Seed users ───────────────────────────────────────────────────────────────
const users = [
  { id: 'u1', name: 'Alice Johnson',  role: ROLE.MANAGER   },
  { id: 'u2', name: 'Bob Smith',      role: ROLE.DEVELOPER },
  { id: 'u3', name: 'Carol White',    role: ROLE.DEVELOPER },
  { id: 'u4', name: 'Dave Brown',     role: ROLE.QA        },
  { id: 'u5', name: 'Eve Davis',      role: ROLE.REPORTER  },
];

// ─── Bug storage ──────────────────────────────────────────────────────────────
const bugs = [];

// ─── User helpers ─────────────────────────────────────────────────────────────
export function getAllUsers() {
  return [...users];
}

export function getUserById(id) {
  return users.find(u => u.id === id) ?? null;
}

export function getDevelopers() {
  return users.filter(u => u.role === ROLE.DEVELOPER);
}

// ─── Bug CRUD ─────────────────────────────────────────────────────────────────

/**
 * Create a new bug in OPEN state.
 */
export function createBug({ title, description, priority, severity, reportedBy }) {
  const bug = {
    id:          `BUG-${String(bugs.length + 1).padStart(4, '0')}`,
    title,
    description,
    priority,
    severity,
    status:      STATUS.OPEN,
    reportedBy,          // user id
    assignedTo:  null,   // user id
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
    history:     [
      {
        from:      null,
        to:        STATUS.OPEN,
        by:        reportedBy,
        at:        new Date().toISOString(),
        comment:   'Bug reported and opened.',
      },
    ],
    comments:    [],
  };
  bugs.push(bug);
  return bug;
}

/**
 * Find a bug by its ID string (e.g. "BUG-0001").
 */
export function getBugById(id) {
  return bugs.find(b => b.id === id) ?? null;
}

/**
 * Return all bugs, optionally filtered by status.
 */
export function getAllBugs(statusFilter = null) {
  if (statusFilter) return bugs.filter(b => b.status === statusFilter);
  return [...bugs];
}

/**
 * Persist a status transition onto a bug.
 */
export function updateBugStatus(bugId, { newStatus, byUserId, assignedTo = null, comment = '' }) {
  const bug = getBugById(bugId);
  if (!bug) throw new Error(`Bug ${bugId} not found.`);

  const prevStatus = bug.status;
  bug.status    = newStatus;
  bug.updatedAt = new Date().toISOString();

  if (assignedTo !== undefined) bug.assignedTo = assignedTo;

  bug.history.push({
    from:    prevStatus,
    to:      newStatus,
    by:      byUserId,
    at:      new Date().toISOString(),
    comment: comment || `Status changed from ${prevStatus} to ${newStatus}.`,
  });

  return bug;
}

/**
 * Add a comment to a bug.
 */
export function addComment(bugId, { userId, text }) {
  const bug = getBugById(bugId);
  if (!bug) throw new Error(`Bug ${bugId} not found.`);

  const comment = {
    id:   uuidv4(),
    by:   userId,
    at:   new Date().toISOString(),
    text,
  };
  bug.comments.push(comment);
  bug.updatedAt = new Date().toISOString();
  return comment;
}

/**
 * Summary statistics grouped by status.
 */
export function getBugStats() {
  const stats = {};
  for (const b of bugs) {
    stats[b.status] = (stats[b.status] ?? 0) + 1;
  }
  return stats;
}
