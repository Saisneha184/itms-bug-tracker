export const STATUS = {
  OPEN:     'Open',
  ASSIGNED: 'Assigned',
  FIXED:    'Fixed',
  CLOSED:   'Closed',
  REOPENED: 'Reopened',
};

export const TRANSITIONS = {
  [STATUS.OPEN]:     [STATUS.ASSIGNED, STATUS.CLOSED],
  [STATUS.ASSIGNED]: [STATUS.FIXED, STATUS.REOPENED, STATUS.OPEN],
  [STATUS.FIXED]:    [STATUS.CLOSED, STATUS.REOPENED],
  [STATUS.CLOSED]:   [STATUS.REOPENED],
  [STATUS.REOPENED]: [STATUS.ASSIGNED, STATUS.FIXED, STATUS.CLOSED],
};

export const PRIORITY = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' };
export const SEVERITY = { MINOR: 'Minor', MAJOR: 'Major', BLOCKER: 'Blocker' };
export const ROLE     = { REPORTER: 'Reporter', DEVELOPER: 'Developer', QA: 'QA', MANAGER: 'Manager' };
