/**
 * ITMS Bug Tracker — Bug timeline
 *
 * Derives, from a bug's history, the date of every status change and the
 * durations between the lifecycle milestones the team tracks:
 *
 *   Open → Fixed                 (openToFixedMs)
 *   Fixed → Closed / Reopened    (fixedToResolvedMs)
 *   Open → Rejected              (openToRejectedMs)
 *   Open → Transferred           (openToTransferredMs)
 *   Whole bug, open to resolved  (totalMs)
 *
 * Every duration is computed from timestamps already stored in bug.history,
 * so nothing extra needs to be persisted.
 */

import { STATUS } from './constants.js';

const RESOLVED_STATES = [STATUS.CLOSED, STATUS.REJECTED, STATUS.TRANSFERRED];

const toMs = iso => new Date(iso).getTime();

/**
 * Human-readable duration, e.g. "2d 4h 10m", "3h 5m", "42m 9s", "12s".
 * Returns '—' for missing values.
 */
export function formatDuration(ms) {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '—';
  const total = Math.max(0, Math.round(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Build the timeline for a bug.
 *
 * @param {object} bug   Bug as stored (must include history and createdAt)
 * @param {Date}   now   Reference time for bugs that are still unresolved
 */
export function buildTimeline(bug, now = new Date()) {
  const history = bug.history ?? [];
  const opened  = history[0] ?? { to: STATUS.OPEN, at: bug.createdAt };

  // firstAt[status] = first moment the bug reached that status
  const firstAt = { [opened.to]: opened.at };

  // Every status change, with the time spent in the status it left.
  const transitions = [];
  let enteredCurrentAt = toMs(opened.at);

  for (const h of history.slice(1)) {
    const at = toMs(h.at);
    transitions.push({
      from:               h.from,
      to:                 h.to,
      at:                 h.at,
      by:                 h.by,
      comment:            h.comment,
      timeInFromStatusMs: at - enteredCurrentAt,
    });
    enteredCurrentAt = at;
    if (!firstAt[h.to]) firstAt[h.to] = h.at;
  }

  const elapsedFromOpen = status =>
    firstAt[status] ? toMs(firstAt[status]) - toMs(opened.at) : null;

  // First exit from Fixed decides whether it was closed or reopened.
  const fixedExit = transitions.find(t => t.from === STATUS.FIXED);
  const fixedToResolvedMs = firstAt[STATUS.FIXED] && fixedExit
    ? toMs(fixedExit.at) - toMs(firstAt[STATUS.FIXED])
    : null;

  // Whole-bug duration: creation until the last resolution, or until now.
  const isResolved = RESOLVED_STATES.includes(bug.status);
  const endMs = isResolved && history.length
    ? toMs(history[history.length - 1].at)
    : now.getTime();

  return {
    currentStatus: bug.status,
    statusDates:   firstAt,           // first time each status was reached
    transitions,                      // every status change, in order
    summary: {
      openToFixedMs:        elapsedFromOpen(STATUS.FIXED),
      fixedToResolvedMs,
      fixedResolvedAs:      fixedExit ? fixedExit.to : null,
      openToRejectedMs:     elapsedFromOpen(STATUS.REJECTED),
      openToTransferredMs:  elapsedFromOpen(STATUS.TRANSFERRED),
    },
    totalMs:  endMs - toMs(opened.at),
    ongoing:  !isResolved,
  };
}
