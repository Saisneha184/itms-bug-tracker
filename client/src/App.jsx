import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Board } from './pages/Board.jsx';
import { BugList } from './pages/BugList.jsx';
import { Team } from './pages/Team.jsx';
import { ReportBug } from './pages/ReportBug.jsx';
import './App.css';

export default function App() {
  return (
    <ThemeProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="app-main" id="main-content">
          <div className="app-content">
            <Routes>
              <Route path="/"           element={<Dashboard />} />
              <Route path="/board"      element={<Board />} />
              <Route path="/bugs"       element={<BugList />} />
              <Route path="/bugs/new"   element={<ReportBug />} />
              <Route path="/team"       element={<Team />} />
              <Route path="*"           element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
