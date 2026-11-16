import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Kanban, List, Bug,
  Users, ChevronRight, PlusCircle, Sun, Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import './Sidebar.css';

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/board',     icon: Kanban,          label: 'Board'       },
  { to: '/bugs',      icon: List,            label: 'Bug List'    },
  { to: '/bugs/new',  icon: PlusCircle,      label: 'Report Bug', highlight: true },
  { to: '/team',      icon: Users,           label: 'Team'        },
];

export function Sidebar() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar__logo">
        <span className="sidebar__logo-icon" aria-hidden="true">🐛</span>
        <div className="sidebar__logo-text">
          <span className="sidebar__logo-name">ITMS</span>
          <span className="sidebar__logo-sub">Bug Tracker</span>
        </div>

        {/* Theme toggle — lives in logo row */}
        <button
          className="theme-toggle"
          onClick={toggle}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark
            ? <Sun  size={15} className="theme-toggle__icon theme-toggle__icon--sun"  />
            : <Moon size={15} className="theme-toggle__icon theme-toggle__icon--moon" />
          }
        </button>
      </div>

      {/* Project chip */}
      <div className="sidebar__project">
        <Bug size={14} className="sidebar__project-icon" aria-hidden="true" />
        <span>ITMS Project</span>
        <ChevronRight size={12} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} aria-hidden="true" />
      </div>

      {/* Nav links */}
      <nav className="sidebar__nav" aria-label="Navigation">
        {NAV.map(({ to, icon: Icon, label, highlight }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}${highlight ? ' sidebar__link--highlight' : ''}`
            }
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <span className="sidebar__version">v1.0.0</span>
        <span className="sidebar__theme-label">
          {isDark ? '🌙 Dark' : '☀️ Light'}
        </span>
      </div>
    </aside>
  );
}
