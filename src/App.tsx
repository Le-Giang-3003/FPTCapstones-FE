import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { hasAnyRole } from './utils/role';
import type { Role } from './types';
import Layout from './components/Layout';

// Route-based Code Splitting (Dynamic Lazy Loading)
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TopicManagement = lazy(() => import('./pages/TopicManagement'));
const TopicIdeas = lazy(() => import('./pages/TopicIdeas'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminLecturers = lazy(() => import('./pages/AdminLecturers'));
const AdminImport = lazy(() => import('./pages/AdminImport'));
const AdminSemesters = lazy(() => import('./pages/AdminSemesters'));
const AdminHolidayTemplates = lazy(() => import('./pages/AdminHolidayTemplates'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ReviewSlots = lazy(() => import('./pages/ReviewSlots'));
const AdminReviewers = lazy(() => import('./pages/AdminReviewers'));
const AdminScheduling = lazy(() => import('./pages/AdminScheduling'));

const PrivateRoute = ({ children, roles }: { children: React.ReactNode; roles?: Role[] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        fontFamily: 'Montserrat', 
        fontWeight: 700 
      }}>
        Đang tải...
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !hasAnyRole(user.role, roles)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  if (hasAnyRole(user.role, ['Admin', 'Lecturer', 'Reviewer', 'StudentLeader', 'GroupMember'])) {
    return <Navigate to="/dashboard" replace />;
  }
  
  if (user.groupId) {
    return <Navigate to={`/projects/${user.groupId}`} replace />;
  }
  
  return <Navigate to="/no-project" replace />;
};

const NoProject = () => (
  <div style={{ padding: '3rem', textAlign: 'center' }}>
    <h2>Chưa có nhóm đồ án</h2>
    <p style={{ color: 'var(--color-muted)', marginTop: '8px' }}>
      Tài khoản của bạn chưa được gán vào nhóm nào trong học kỳ này. Vui lòng liên hệ Admin để được hỗ trợ.
    </p>
  </div>
);

const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'Montserrat',
    fontWeight: 700,
    color: 'var(--color-primary)'
  }}>
    Đang tải dữ liệu trang...
  </div>
);

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/no-project" element={<NoProject />} />
              
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute roles={['Admin', 'Lecturer', 'Reviewer', 'StudentLeader', 'GroupMember']}>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/topics"
                element={
                  <PrivateRoute roles={['Admin', 'Lecturer']}>
                    <TopicManagement />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/topic-ideas"
                element={
                  <PrivateRoute roles={['Lecturer']}>
                    <TopicIdeas />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/admin/users"
                element={
                  <PrivateRoute roles={['Admin']}>
                    <AdminUsers />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/admin/lecturers"
                element={
                  <PrivateRoute roles={['Admin']}>
                    <AdminLecturers />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/admin/import"
                element={
                  <PrivateRoute roles={['Admin']}>
                    <AdminImport />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/admin/semesters"
                element={
                  <PrivateRoute roles={['Admin']}>
                    <AdminSemesters />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/admin/holiday-templates"
                element={
                  <PrivateRoute roles={['Admin']}>
                    <AdminHolidayTemplates />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/audit-logs"
                element={
                  <PrivateRoute>
                    <AuditLogs />
                  </PrivateRoute>
                }
              />
              
              <Route path="/projects/:id" element={<ProjectDetail />} />
              
              <Route
                path="/reviews/slots"
                element={
                  <PrivateRoute roles={['Admin', 'Reviewer', 'StudentLeader', 'GroupMember']}>
                    <ReviewSlots />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/admin/reviewers"
                element={
                  <PrivateRoute roles={['Admin']}>
                    <AdminReviewers />
                  </PrivateRoute>
                }
              />
              
              <Route
                path="/admin/scheduling"
                element={
                  <PrivateRoute roles={['Admin']}>
                    <AdminScheduling />
                  </PrivateRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  );
};

export default App;
