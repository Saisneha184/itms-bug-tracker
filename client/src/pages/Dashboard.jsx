import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboard, fetchBugs } from '../api.js';
import { StatusBadge, PriorityBadge } from '../components/Badge.jsx';
import { STATUS_META } from '../constants.js';
import { format } from 'date-fns';
import { TrendingUp, Bug, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import './Dashboard.css';

const STAT_ICONS = {
  Open:     <Bug size={18} />,
  Assigned: <TrendingUp size={18} />,
  Fixed:    <CheckCircle size={18} />,
  Closed:   <CheckCircle size={18} />,
  Reopened: <RefreshCw size={18} />,
};

export function Dashboard() {
  const [stats,  setStats]  = useState({});
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchBugs()])
      .then(([s, bugs]) => {
        setStats(s);
        setRecent([...bugs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 8));
      })
      .finally(() => setLoading(false));
  }, []);

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  if (loading) return <div className="page-loading" aria-live="polite">Loading dashboard…</div>;

  const statusOrder = ['Open', 'Assigned', 'Fixed', 'Closed', 'Reopened'];

  return (
    <div className="dashboard">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">ITMS project overview — {total} total bug{total !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/bugs/new" className="btn btn--primary">
          + Report Bug
        </Link>
      </header>

      {/* Stat cards */}
      <div className="dash-stats" role="list" aria-label="Bug statistics by status">
        {statusOrder.map(s => {
          const meta  = STATUS_META[s];
          const count = stats[s] ?? 0;
          const pct   = total ? Math.round((count / total) * 100) : 0;
          return (
            <Link
              key={s}
              to={`/bugs?status=${s}`}
              className="stat-card"
              style={{ '--accent-c': meta.color }}
              role="listitem"
              aria-label={`${s}: ${count} bug${count !== 1 ? 's' : ''}`}
            >
              <div className="stat-card__header">
                <span className="stat-card__icon" style={{ color: meta.color }}>{STAT_ICONS[s]}</span>
                <span className="stat-card__label">{s}</span>
              </div>
              <div className="stat-card__count" style={{ color: meta.color }}>{count}</div>
              <div className="stat-card__bar" aria-hidden="true">
                <div
                  className="stat-card__fill"
                  style={{ width: `${pct}%`, background: meta.color }}
                />
              </div>
              <div className="stat-card__pct">{pct}%</div>
            </Link>
          );
        })}
      </div>

      {/* Chart row */}
      <div className="dash-chart-row">
        <section className="dash-chart" aria-labelledby="dist-heading">
          <h2 id="dist-heading" className="section-title">Status Distribution</h2>
          <div className="donut-wrapper" aria-hidden="true">
            <DonutChart stats={stats} total={total} />
          </div>
          <div className="donut-legend">
            {statusOrder.map(s => (
              <div key={s} className="legend-item">
                <span className="legend-dot" style={{ background: STATUS_META[s]?.color }} />
                <span className="legend-label">{s}</span>
                <span className="legend-val">{stats[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent activity */}
        <section className="dash-recent" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="section-title">Recent Bugs</h2>
          <div className="recent-list">
            {recent.map(b => (
              <Link key={b.id} to={`/bugs/${b.id}`} className="recent-item">
                <div className="recent-item__top">
                  <span className="recent-item__id">{b.id}</span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="recent-item__title">{b.title}</div>
                <div className="recent-item__meta">
                  <PriorityBadge priority={b.priority} />
                  <span className="recent-item__time">
                    {format(new Date(b.updatedAt), 'dd MMM, HH:mm')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* Simple SVG donut chart */
function DonutChart({ stats, total }) {
  const statusOrder = ['Open', 'Assigned', 'Fixed', 'Closed', 'Reopened'];
  const r = 60, cx = 70, cy = 70, stroke = 20;
  const circumference = 2 * Math.PI * r;
  if (total === 0) return <svg width="140" height="140"><circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/></svg>;

  let offset = 0;
  const slices = statusOrder.map(s => {
    const count = stats[s] ?? 0;
    const pct   = count / total;
    const dash  = pct * circumference;
    const gap   = circumference - dash;
    const slice = { s, dash, gap, offset, color: STATUS_META[s]?.color };
    offset += dash;
    return slice;
  });

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="Donut chart">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      {slices.map(sl => (
        <circle
          key={sl.s}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={sl.color}
          strokeWidth={stroke}
          strokeDasharray={`${sl.dash} ${sl.gap}`}
          strokeDashoffset={circumference / 4 - sl.offset}
          strokeLinecap="butt"
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontWeight="700">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-muted)" fontSize="10">total</text>
    </svg>
  );
}
