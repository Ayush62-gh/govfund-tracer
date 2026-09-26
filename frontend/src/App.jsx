import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AuthProvider, useAuth, ROLE_DASHBOARD_PATH } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { DataProvider, useData } from './context/DataContext';
import { ROLES } from './services/rbacService';

import Header    from './components/common/Header';
import Sidebar   from './components/common/Sidebar';
import Footer    from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import AccessDenied   from './components/common/AccessDenied';

import Login             from './pages/Login';
import Dashboard         from './pages/Dashboard';
import AlertsCenter      from './pages/AlertsCenter';
import FinancialAnalytics from './pages/FinancialAnalytics';
import WorkTracker       from './pages/WorkTracker';
import PredictiveInsights from './pages/PredictiveInsights';
import Reports           from './pages/Reports';
import AdminPanel        from './pages/AdminPanel';
import NotFound          from './pages/NotFound';

import { CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

// ---------------------------------------------------------------------------
// RoleDashboardRedirect
// Redirects authenticated users who land on "/" to their role-specific path.
// ---------------------------------------------------------------------------
const RoleDashboardRedirect = () => {
  const { isAuthenticated, currentRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const path = ROLE_DASHBOARD_PATH[currentRole] || '/dashboard/mp';
  return <Navigate to={path} replace />;
};

// ---------------------------------------------------------------------------
// RoleDashboardRoute
// Renders a dashboard route that is only accessible by the correct role.
// All other authenticated users see the 403 AccessDenied screen.
// ---------------------------------------------------------------------------
const RoleDashboardRoute = ({ allowedRole, children }) => {
  const { isAuthenticated, currentRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (currentRole !== allowedRole) {
    return (
      <AccessDenied
        requiredRoles={[allowedRole]}
        customMessage={`The dashboard at this URL is restricted to the '${allowedRole.toUpperCase()}' role. Your current role is '${currentRole?.toUpperCase()}'. You have been redirected to your authorized dashboard.`}
      />
    );
  }

  return children;
};

// ---------------------------------------------------------------------------
// AuthRedirect — send already-authenticated users away from /login
// ---------------------------------------------------------------------------
const AuthRedirect = ({ children }) => {
  const { isAuthenticated, currentRole } = useAuth();
  if (isAuthenticated && currentRole) {
    const path = ROLE_DASHBOARD_PATH[currentRole] || '/';
    return <Navigate to={path} replace />;
  }
  return children;
};

// ---------------------------------------------------------------------------
// Protected Application Shell
// ---------------------------------------------------------------------------
const ProtectedLayout = ({ isDarkMode, toggleDarkMode }) => {
  const { isAuthenticated } = useAuth();
  const { toastMessage }    = useData();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up no-print max-w-md">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700 text-xs font-medium">
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'info'    && <Info          className="w-4 h-4 text-blue-400 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toastMessage.type === 'error'   && <ShieldAlert   className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{toastMessage.message}</span>
          </div>
        </div>
      )}

      <Header
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onToggleMobileSidebar={() => setMobileSidebarOpen(p => !p)}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          <Routes>

            {/* ── Root: redirect to role-specific dashboard ── */}
            <Route path="/"  element={<RoleDashboardRedirect />} />

            {/* ── Role-scoped dashboard routes ─────────────────── */}
            {/*  Each path is only accessible to the matching role.  */}
            {/*  Wrong role → 403 AccessDenied screen.               */}

            <Route
              path="/dashboard/mp"
              element={
                <RoleDashboardRoute allowedRole={ROLES.MP}>
                  <Dashboard />
                </RoleDashboardRoute>
              }
            />

            <Route
              path="/dashboard/district"
              element={
                <RoleDashboardRoute allowedRole={ROLES.DISTRICT}>
                  <Dashboard />
                </RoleDashboardRoute>
              }
            />

            <Route
              path="/dashboard/state"
              element={
                <RoleDashboardRoute allowedRole={ROLES.STATE}>
                  <Dashboard />
                </RoleDashboardRoute>
              }
            />

            <Route
              path="/dashboard/ministry"
              element={
                <RoleDashboardRoute allowedRole={ROLES.MINISTRY}>
                  <Dashboard />
                </RoleDashboardRoute>
              }
            />

            <Route
              path="/dashboard/admin"
              element={
                <RoleDashboardRoute allowedRole={ROLES.ADMIN}>
                  <AdminPanel />
                </RoleDashboardRoute>
              }
            />

            {/* ── Shared functional routes (all authenticated roles) ── */}
            <Route path="/alerts"     element={<AlertsCenter />} />
            <Route path="/financials" element={<FinancialAnalytics />} />
            <Route path="/tracker"    element={<WorkTracker />} />
            <Route path="/predictive" element={<PredictiveInsights />} />
            <Route path="/reports"    element={<Reports />} />
            <Route path="/districts"  element={<FinancialAnalytics />} />
            <Route path="/states"     element={<FinancialAnalytics />} />

            {/* ── Admin Panel: requires Admin or Ministry role ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MINISTRY]}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>

      <Footer />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Root App
// ---------------------------------------------------------------------------
export const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() =>
    localStorage.getItem('mplads_theme') === 'dark'
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mplads_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mplads_theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <Routes>
              {/* Login — redirect authenticated users away */}
              <Route
                path="/login"
                element={
                  <AuthRedirect>
                    <Login />
                  </AuthRedirect>
                }
              />

              {/* All protected app routes */}
              <Route
                path="/*"
                element={
                  <ProtectedLayout
                    isDarkMode={isDarkMode}
                    toggleDarkMode={() => setIsDarkMode(p => !p)}
                  />
                }
              />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
};

export default App;
