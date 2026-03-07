import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import EmployeeList from './components/EmployeeList';
import AttendanceList from './components/AttendanceList';
import Login from './components/Login';
import PWABadge from '../src/PWABadge';
import './App.css';

// ── Protected Route wrapper ───────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// ── NavBar (only shown when authenticated) ────────────────────────────────────
function NavBar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isHome = location.pathname === '/';

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <header className="hrms-header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <span className="brand-name">HRMS <span className="brand-lite">Lite</span></span>
            <span className="brand-tagline">Human Resource Management</span>
          </div>
        </div>

        <nav className="header-nav">
          {!isHome && (
            <Link to="/" className="nav-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Employees
            </Link>
          )}

          {/* User info + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
                }}>
                  {getInitials(user.username)}
                </div>
                <div style={{ lineHeight: 1.2, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    {user.username}
                  </span>
                  <span style={{
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
                    fontWeight: 600,
                    color: user.role === 'admin' ? 'var(--blue)' : 'var(--ink-4)'
                  }}>
                    {user.role}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={logout}
              title="Sign out"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: '1.5px solid var(--border)',
                borderRadius: 8, padding: '6px 11px',
                fontSize: 12.5, fontWeight: 600, color: 'var(--ink-3)',
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--red)';
                e.currentTarget.style.color = 'var(--red)';
                e.currentTarget.style.background = 'var(--red-lt)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--ink-3)';
                e.currentTarget.style.background = 'none';
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

// ── Authenticated shell (header + content + footer) ───────────────────────────
function AuthenticatedShell() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute><EmployeeList /></ProtectedRoute>
          } />
          <Route path="/attendance/:employeeId" element={
            <ProtectedRoute><AttendanceList /></ProtectedRoute>
          } />
          {/* Catch-all → home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>HRMS Lite © {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { isAuthenticated, initializing } = useAuth();

  // Don't render any routes until we've confirmed auth state from localStorage.
  // Without this guard the ProtectedRoute fires before the token is available
  // and immediately redirects to /login on every page reload.
  if (initializing) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--surface-2, #f8fafc)'
      }}>
        <div style={{ textAlign: 'center', color: 'var(--ink-3, #94a3b8)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 8px' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: 13 }}>Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      {/* Everything else goes through the authenticated shell */}
      <Route path="/*" element={
        isAuthenticated ? <AuthenticatedShell /> : <Navigate to="/login" replace />
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
      <PWABadge />
    </Router>
  );
}

export default App;

// import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
// import EmployeeList from './components/EmployeeList';
// import AttendanceList from './components/AttendanceList';
// import './App.css';

// function NavBar() {
//   const location = useLocation();
//   const isHome = location.pathname === '/';

//   return (
//     <header className="hrms-header">
//       <div className="header-inner">
//         <div className="brand">
//           <div className="brand-icon">
//             <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//               <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
//               <circle cx="9" cy="7" r="4"/>
//               <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
//               <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
//             </svg>
//           </div>
//           <div>
//             <span className="brand-name">HRMS <span className="brand-lite">Lite</span></span>
//             <span className="brand-tagline">Human Resource Management</span>
//           </div>
//         </div>
//         <nav className="header-nav">
//           {!isHome && (
//             <Link to="/" className="nav-link">
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                 <polyline points="15 18 9 12 15 6"/>
//               </svg>
//               Employees
//             </Link>
//           )}
//           <div className="nav-badge">Admin</div>
//         </nav>
//       </div>
//     </header>
//   );
// }

// function App() {
//   return (
//     <Router>
//       <div className="app-shell">
//         <NavBar />
//         <main className="main-content">
//           <Routes>
//             <Route path="/" element={<EmployeeList />} />
//             <Route path="/attendance/:employeeId" element={<AttendanceList />} />
//           </Routes>
//         </main>
//         <footer className="app-footer">
//           <span>HRMS Lite © {new Date().getFullYear()}</span>
//         </footer>
//       </div>
//     </Router>
//   );
// }

// export default App;