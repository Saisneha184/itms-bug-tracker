/**
 * ITMS Bug Tracking Agent — Core Agent Logic
 *
 * Handles all state transitions with validation:
 *   Open → Assigned → Fixed → Closed
 *                  ↓              ↓
 *               Reopened ←────────┘
 */

import {
  createBug,
  getBugById,
  updateBugStatus,
  addComment,
  getAllBugs,
  getBugStats,
  getUserById,
  getDevelopers,
} from './store.js';
import { STATUS, TRANSITIONS, PRIORITY, SEVERITY } from './constants.js';

// ─── Validation helpers ───────────────────────────────────────────────────────

function assertBugExists(bugId) {
  const bug = getBugById(bugId);
  if (!bug) throw new Error(`Bug "${bugId}" does not exist.`);
  return bug;
}

function assertTransitionAllowed(bug, targetStatus) {
  const allowed = TRANSITIONS[bug.status] ?? [];
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `Invalid transition: ${bug.status} → ${targetStatus}. ` +
      `Allowed transitions from "${bug.status}": ${allowed.join(', ') || 'none'}.`
    );
  }
}

function assertUserExists(userId) {
  const user = getUserById(userId);
  if (!user) throw new Error(`User "${userId}" does not exist.`);
  return user;
}

// ─── Agent actions ────────────────────────────────────────────────────────────

/**
 * ACTION: Report a new bug (creates it in OPEN state).
 */
export function reportBug({ title, description, priority, severity, reportedBy }) {
  if (!title?.trim())       throw new Error('Bug title is required.');
  if (!description?.trim()) throw new Error('Bug description is required.');
  if (!Object.values(PRIORITY).includes(priority))
    throw new Error(`Invalid priority "${priority}". Use: ${Object.values(PRIORITY).join(', ')}`);
  if (!Object.values(SEVERITY).includes(severity))
    throw new Error(`Invalid severity "${severity}". Use: ${Object.values(SEVERITY).join(', ')}`);

  assertUserExists(reportedBy);

  const bug = createBug({ title, description, priority, severity, reportedBy });
  return { success: true, message: `Bug ${bug.id} created with status: ${STATUS.OPEN}.`, bug };
}

/**
 * ACTION: Assign bug to a developer (Open / Reopened → Assigned).
 */
export function assignBug({ bugId, assignedTo, byUserId, comment }) {
  const bug  = assertBugExists(bugId);
  const devs = getDevelopers().map(d => d.id);

  // Allow assignment from Open or Reopened
  if (bug.status !== STATUS.OPEN && bug.status !== STATUS.REOPENED) {
    throw new Error(`Only bugs in Open or Reopened state can be assigned. Current status: ${bug.status}.`);
  }
  if (!devs.includes(assignedTo)) {
    throw new Error(`User "${assignedTo}" is not a registered developer.`);
  }
  assertUserExists(byUserId);

  const updated = updateBugStatus(bugId, {
    newStatus:  STATUS.ASSIGNED,
    byUserId,
    assignedTo,
    comment:    comment ?? `Bug assigned to ${getUserById(assignedTo).name}.`,
  });
  return { success: true, message: `Bug ${bugId} assigned to ${getUserById(assignedTo).name}.`, bug: updated };
}

/**
 * ACTION: Mark bug as Fixed (Assigned → Fixed).
 */
export function fixBug({ bugId, byUserId, comment }) {
  const bug = assertBugExists(bugId);
  assertTransitionAllowed(bug, STATUS.FIXED);
  assertUserExists(byUserId);

  const updated = updateBugStatus(bugId, {
    newStatus: STATUS.FIXED,
    byUserId,
    comment:   comment ?? 'Bug has been fixed.',
  });
  return { success: true, message: `Bug ${bugId} marked as Fixed.`, bug: updated };
}

/**
 * ACTION: Close a bug (Fixed → Closed, Open → Closed).
 */
export function closeBug({ bugId, byUserId, comment }) {
  const bug = assertBugExists(bugId);
  assertTransitionAllowed(bug, STATUS.CLOSED);
  assertUserExists(byUserId);

  const updated = updateBugStatus(bugId, {
    newStatus: STATUS.CLOSED,
    byUserId,
    comment:   comment ?? 'Bug verified and closed.',
  });
  return { success: true, message: `Bug ${bugId} has been Closed.`, bug: updated };
}

/**
 * ACTION: Reopen a bug (Fixed / Closed → Reopened).
 */
export function reopenBug({ bugId, byUserId, comment }) {
  const bug = assertBugExists(bugId);
  assertTransitionAllowed(bug, STATUS.REOPENED);
  assertUserExists(byUserId);

  const updated = updateBugStatus(bugId, {
    newStatus:  STATUS.REOPENED,
    byUserId,
    assignedTo: null,          // clear assignment so it can be re-assigned
    comment:    comment ?? 'Bug has been reopened for further investigation.',
  });
  return { success: true, message: `Bug ${bugId} has been Reopened.`, bug: updated };
}

/**
 * ACTION: Add a comment to a bug.
 */
export function commentOnBug({ bugId, userId, text }) {
  assertBugExists(bugId);
  assertUserExists(userId);
  if (!text?.trim()) throw new Error('Comment text cannot be empty.');

  const comment = addComment(bugId, { userId, text });
  return { success: true, message: `Comment added to ${bugId}.`, comment };
}

/**
 * QUERY: Get a single bug with full detail.
 */
export function getBug(bugId) {
  const bug = assertBugExists(bugId);
  return { success: true, bug };
}

/**
 * QUERY: List bugs, optionally filtered by status.
 */
export function listBugs(statusFilter = null) {
  const bugs = getAllBugs(statusFilter);
  return { success: true, bugs, total: bugs.length };
}

/**
 * QUERY: Dashboard statistics.
 */
export function getDashboard() {
  const stats = getBugStats();
  const total = Object.values(stats).reduce((s, n) => s + n, 0);
  return { success: true, stats, total };
}

/**
 * QUERY: Get the history/audit trail for a bug.
 */
export function getBugHistory(bugId) {
  const bug = assertBugExists(bugId);
  return { success: true, history: bug.history, comments: bug.comments };
}
