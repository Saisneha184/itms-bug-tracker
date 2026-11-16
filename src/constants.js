/**
 * ITMS Bug Tracking Agent — Constants
 * Defines all valid statuses, transitions, priorities, and severities.
 */

// ─── Bug Statuses ─────────────────────────────────────────────────────────────
export const STATUS = {
  OPEN:     'Open',
  ASSIGNED: 'Assigned',
  FIXED:    'Fixed',
  CLOSED:   'Closed',
  REOPENED: 'Reopened',
};

/**
 * Valid status transitions.
 * Key = current status, Value = array of statuses it can move to.
 */
export const TRANSITIONS = {
  [STATUS.OPEN]:     [STATUS.ASSIGNED, STATUS.CLOSED],
  [STATUS.ASSIGNED]: [STATUS.FIXED, STATUS.REOPENED, STATUS.OPEN],
  [STATUS.FIXED]:    [STATUS.CLOSED, STATUS.REOPENED],
  [STATUS.CLOSED]:   [STATUS.REOPENED],
  [STATUS.REOPENED]: [STATUS.ASSIGNED, STATUS.FIXED, STATUS.CLOSED],
};

// ─── Priority Levels ──────────────────────────────────────────────────────────
export const PRIORITY = {
  LOW:      'Low',
  MEDIUM:   'Medium',
  HIGH:     'High',
  CRITICAL: 'Critical',
};

// ─── Severity Levels ──────────────────────────────────────────────────────────
export const SEVERITY = {
  MINOR:    'Minor',
  MAJOR:    'Major',
  BLOCKER:  'Blocker',
};

// ─── Roles ────────────────────────────────────────────────────────────────────
export const ROLE = {
  REPORTER: 'Reporter',
  DEVELOPER: 'Developer',
  QA:        'QA',
  MANAGER:   'Manager',
};
