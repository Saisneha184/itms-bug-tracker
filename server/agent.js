import {
  createBug, getBugById, updateBugStatus, addComment,
  getAllBugs, getBugStats, getUserById, getDevelopers, deleteBug,
} from './store.js';
import { STATUS, TRANSITIONS, PRIORITY, SEVERITY } from './constants.js';

function assertBug(id)    { const b = getBugById(id); if (!b) throw new Error(`Bug "${id}" not found`); return b; }
function assertUser(id)   { const u = getUserById(id); if (!u) throw new Error(`User "${id}" not found`); return u; }
function assertTransition(bug, to) {
  const ok = TRANSITIONS[bug.status] ?? [];
  if (!ok.includes(to)) throw new Error(`Cannot transition ${bug.status} → ${to}. Allowed: ${ok.join(', ')}`);
}

export function agentReportBug({ title, description, priority, severity, reportedBy }) {
  if (!title?.trim())  throw new Error('Title is required');
  if (!Object.values(PRIORITY).includes(priority)) throw new Error(`Invalid priority: ${priority}`);
  if (!Object.values(SEVERITY).includes(severity)) throw new Error(`Invalid severity: ${severity}`);
  assertUser(reportedBy);
  return createBug({ title, description, priority, severity, reportedBy });
}

export function agentAssignBug({ bugId, assignedTo, byUserId, comment }) {
  const bug  = assertBug(bugId);
  if (![STATUS.OPEN, STATUS.REOPENED].includes(bug.status))
    throw new Error(`Can only assign Open/Reopened bugs. Current: ${bug.status}`);
  const devIds = getDevelopers().map(d => d.id);
  if (!devIds.includes(assignedTo)) throw new Error(`${assignedTo} is not a developer`);
  assertUser(byUserId);
  return updateBugStatus(bugId, {
    newStatus: STATUS.ASSIGNED, byUserId, assignedTo,
    comment: comment || `Assigned to ${getUserById(assignedTo).name}.`,
  });
}

export function agentTransition({ bugId, toStatus, byUserId, assignedTo, comment }) {
  const bug = assertBug(bugId);
  assertTransition(bug, toStatus);
  assertUser(byUserId);
  return updateBugStatus(bugId, {
    newStatus:  toStatus,
    byUserId,
    assignedTo: toStatus === STATUS.REOPENED ? null : assignedTo,
    comment,
  });
}

export function agentComment({ bugId, userId, text }) {
  assertBug(bugId);
  assertUser(userId);
  if (!text?.trim()) throw new Error('Comment cannot be empty');
  return addComment(bugId, { userId, text });
}

export const agentGetBug     = id => assertBug(id);
export const agentListBugs   = f  => getAllBugs(f);
export const agentDashboard  = ()  => getBugStats();
export const agentDeleteBug  = id  => { assertBug(id); return deleteBug(id); };
