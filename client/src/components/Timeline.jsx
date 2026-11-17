import { format } from 'date-fns';
import { ArrowRight, Timer } from 'lucide-react';
import { StatusBadge } from './Badge.jsx';
import './Timeline.css';

/** Human-readable duration, e.g. "2d 4h 10m", "3h 5m", "42m 9s". */
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

const fmt = d => (d ? format(new Date(d), 'dd MMM yyyy, HH:mm') : '—');

/**
 * Shows status dates and durations for one bug.
 * `timeline` is the object returned by the server (see server/timeline.js).
 */
export function Timeline({ timeline, users = [] }) {
  if (!timeline) return null;
  const { summary, transitions, statusDates, totalMs, ongoing, currentStatus } = timeline;
  const userName = id => users.find(u => u.id === id)?.name ?? id;

  const milestones = [
    { label: 'Open → Fixed',         value: summary.openToFixedMs },
    {
      label: `Fixed → ${summary.fixedResolvedAs ?? 'Closed / Reopened'}`,
      value: summary.fixedToResolvedMs,
    },
    { label: 'Open → Rejected',      value: summary.openToRejectedMs },
    { label: 'Open → Transferred',   value: summary.openToTransferredMs },
  ];

  return (
    <section className="timeline" aria-labelledby="timeline-heading">
      <h3 id="timeline-heading" className="timeline__title">
        <Timer size={13} /> Timeline
      </h3>

      <div className="timeline__total">
        <span className="timeline__label">
          {ongoing ? 'Open for' : 'Resolved in'}
        </span>
        <strong className="timeline__value">{formatDuration(totalMs)}</strong>
        {ongoing && <span className="timeline__hint">(still {currentStatus.toLowerCase()})</span>}
      </div>

      <div className="timeline__milestones">
        {milestones.map(m => (
          <div key={m.label} className="timeline__milestone">
            <span className="timeline__label">{m.label}</span>
            <strong className="timeline__value">{formatDuration(m.value)}</strong>
          </div>
        ))}
      </div>

      <h4 className="timeline__subtitle">First reached</h4>
      <ul className="timeline__dates">
        {Object.entries(statusDates).map(([status, at]) => (
          <li key={status}>
            <StatusBadge status={status} />
            <time dateTime={at}>{fmt(at)}</time>
          </li>
        ))}
      </ul>

      <h4 className="timeline__subtitle">Every status change</h4>
      {transitions.length === 0 ? (
        <p className="text-muted">No status changes yet.</p>
      ) : (
        <ol className="timeline__log">
          {transitions.map((t, i) => (
            <li key={`${t.at}-${i}`} className="timeline__entry">
              <div className="timeline__entry-head">
                <span className="timeline__change">
                  {t.from} <ArrowRight size={10} /> {t.to}
                </span>
                <time dateTime={t.at}>{fmt(t.at)}</time>
              </div>
              <div className="timeline__entry-meta">
                by {userName(t.by)} · spent {formatDuration(t.timeInFromStatusMs)} in {t.from}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
