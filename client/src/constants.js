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
  Open:        ['Assigned', 'Closed', 'Rejected', 'Transferred'],
  Assigned:    ['Fixed', 'Reopened', 'Open'],
  Fixed:       ['Closed', 'Reopened'],
  Closed:      ['Reopened'],
  Reopened:    ['Assigned', 'Fixed', 'Closed'],
  Rejected:    ['Reopened'],
  Transferred: ['Open', 'Assigned'],
};

export const STATUS_META = {
  Open:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  label: 'Open'     },
  Assigned: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  label: 'Assigned' },
  Fixed:    { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   label: 'Fixed'    },
  Closed:   { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   label: 'Closed'   },
  Reopened: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   label: 'Reopened' },
  Rejected:    { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: 'Rejected'    },
  Transferred: { color: '#ec4899', bg: 'rgba(236,72,153,0.15)', label: 'Transferred' },
};

export const PRIORITY_META = {
  Low:      { color: '#6b7280', icon: '▼' },
  Medium:   { color: '#f59e0b', icon: '●' },
  High:     { color: '#ef4444', icon: '▲' },
  Critical: { color: '#dc2626', icon: '‼' },
};

export const SEVERITY_META = {
  Minor:   { color: '#6b7280' },
  Major:   { color: '#f59e0b' },
  Blocker: { color: '#dc2626' },
};

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const SEVERITIES  = ['Minor', 'Major', 'Blocker'];
