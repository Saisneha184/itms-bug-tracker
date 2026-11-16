import { STATUS_META, PRIORITY_META, SEVERITY_META } from '../constants.js';
import './Badge.css';

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { color: '#8b949e', bg: 'rgba(139,148,158,0.15)', label: status };
  return (
    <span className="badge" style={{ color: meta.color, background: meta.bg, borderColor: `${meta.color}33` }}>
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const meta = PRIORITY_META[priority] ?? { color: '#8b949e', icon: '●' };
  return (
    <span className="priority-badge" style={{ color: meta.color }}>
      <span className="priority-icon">{meta.icon}</span>
      {priority}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const meta = SEVERITY_META[severity] ?? { color: '#8b949e' };
  return (
    <span className="severity-badge" style={{ color: meta.color, borderColor: `${meta.color}44` }}>
      {severity}
    </span>
  );
}
