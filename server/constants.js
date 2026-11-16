export const STATUS = {
  OPEN:     'Open',
  ASSIGNED: 'Assigned',
  FIXED:    'Fixed',
  CLOSED:   'Closed',
  REOPENED: 'Reopened',
  REJECTED:    'Rejected',
  TRANSFERRED: 'Transferred',
};

export const TRANSITIONS = {
  [STATUS.OPEN]:        [STATUS.ASSIGNED, STATUS.CLOSED, STATUS.REJECTED, STATUS.TRANSFERRED],
  [STATUS.ASSIGNED]:    [STATUS.FIXED, STATUS.REOPENED, STATUS.OPEN],
  [STATUS.FIXED]:       [STATUS.CLOSED, STATUS.REOPENED],
  [STATUS.CLOSED]:      [STATUS.REOPENED],
  [STATUS.REOPENED]:    [STATUS.ASSIGNED, STATUS.FIXED, STATUS.CLOSED],
  [STATUS.REJECTED]:    [STATUS.REOPENED],
  [STATUS.TRANSFERRED]: [STATUS.OPEN, STATUS.ASSIGNED],
};

export const PRIORITY = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' };
export const SEVERITY = { MINOR: 'Minor', MAJOR: 'Major', BLOCKER: 'Blocker' };
export const ROLE     = { REPORTER: 'Reporter', DEVELOPER: 'Developer', QA: 'QA', MANAGER: 'Manager' };
