// ============================================================
// BhoomiSetu — Master Router & Session Guard
// National Land Acquisition & Management Intelligence Platform
// ============================================================
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './layouts/AppLayout';

// Public Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));

// Protected Module Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const ParcelsPage = lazy(() => import('./pages/ParcelsPage'));
const WorkflowPage = lazy(() => import('./pages/WorkflowPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AwardsPage = lazy(() => import('./pages/AwardsPage'));
const CompensationPage = lazy(() => import('./pages/CompensationPage'));
const PossessionPage = lazy(() => import('./pages/PossessionPage'));
const RRPage = lazy(() => import('./pages/RRPage'));
const FamiliesPage = lazy(() => import('./pages/FamiliesPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const MilestonesPage = lazy(() => import('./pages/MilestonesPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const FieldModePage = lazy(() => import('./pages/FieldModePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const DataImportPage = lazy(() => import('./pages/DataImportPage'));
const GovernancePage = lazy(() => import('./pages/GovernancePage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-surface-500 font-medium tracking-wide">Loading BhoomiSetu System...</p>
      </div>
    </div>
  );
}

/**
 * Route guard that strictly requires an authenticated session.
 * Unauthenticated requests are redirected directly to /login with state preserved.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Public route guard for /login: redirects already authenticated users to /dashboard.
 */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route
        path="/"
        element={
          <Suspense fallback={<PageLoader />}>
            <LandingPage />
          </Suspense>
        }
      />

      {/* Public Login Page */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          </PublicOnlyRoute>
        }
      />

      {/* Unauthorized Access Page */}
      <Route
        path="/unauthorized"
        element={
          <Suspense fallback={<PageLoader />}>
            <UnauthorizedPage />
          </Suspense>
        }
      />

      {/* Protected Application Lifecycle Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
        <Route path="projects" element={<Suspense fallback={<PageLoader />}><ProjectsPage /></Suspense>} />
        <Route path="projects/:id" element={<Suspense fallback={<PageLoader />}><ProjectDetailPage /></Suspense>} />
        <Route path="parcels" element={<Suspense fallback={<PageLoader />}><ParcelsPage /></Suspense>} />
        <Route path="workflow" element={<Suspense fallback={<PageLoader />}><WorkflowPage /></Suspense>} />
        <Route path="notifications" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>} />
        <Route path="awards" element={<Suspense fallback={<PageLoader />}><AwardsPage /></Suspense>} />
        <Route path="compensation" element={<Suspense fallback={<PageLoader />}><CompensationPage /></Suspense>} />
        <Route path="possession" element={<Suspense fallback={<PageLoader />}><PossessionPage /></Suspense>} />
        <Route path="rr" element={<Suspense fallback={<PageLoader />}><RRPage /></Suspense>} />
        <Route path="families" element={<Suspense fallback={<PageLoader />}><FamiliesPage /></Suspense>} />
        <Route path="documents" element={<Suspense fallback={<PageLoader />}><DocumentsPage /></Suspense>} />
        <Route path="alerts" element={<Suspense fallback={<PageLoader />}><AlertsPage /></Suspense>} />
        <Route path="milestones" element={<Suspense fallback={<PageLoader />}><MilestonesPage /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
        <Route path="integrations" element={<Suspense fallback={<PageLoader />}><IntegrationsPage /></Suspense>} />
        <Route path="audit" element={<Suspense fallback={<PageLoader />}><AuditPage /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
        <Route path="field-mode" element={<Suspense fallback={<PageLoader />}><FieldModePage /></Suspense>} />
        <Route path="import" element={<Suspense fallback={<PageLoader />}><DataImportPage /></Suspense>} />
        <Route path="data-import" element={<Suspense fallback={<PageLoader />}><DataImportPage /></Suspense>} />
        <Route path="governance" element={<Suspense fallback={<PageLoader />}><GovernancePage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
