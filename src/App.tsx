import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { hasAnyRole } from './utils/role';
import type { Role } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TopicManagement from './pages/TopicManagement';
import TopicIdeas from './pages/TopicIdeas';
import AdminUsers from './pages/AdminUsers';
import AdminLecturers from './pages/AdminLecturers';
import AdminImport from './pages/AdminImport';
import AdminSemesters from './pages/AdminSemesters';
import AdminHolidayTemplates from './pages/AdminHolidayTemplates';
import AuditLogs from './pages/AuditLogs';
import ProjectDetail from './pages/ProjectDetail';
import ReviewSlots from './pages/ReviewSlots';
import AdminReviewers from './pages/AdminReviewers';
import AdminScheduling from './pages/AdminScheduling';
import Layout from './components/Layout';

const PrivateRoute = ({ children, roles }: { children: React.ReactNode; roles?: Role[] }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !hasAnyRole(user.role, roles)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // Mọi user có quyền xem dashboard đều landing ở /dashboard (Admin/Lecturer/Reviewer/Student)
  if (hasAnyRole(user.role, ['Admin', 'Lecturer', 'Reviewer', 'StudentLeader', 'GroupMember']))
    return <Navigate to="/dashboard" replace />;
  if (user.groupId) return <Navigate to={`/projects/${user.groupId}`} replace />;
  return <Navigate to="/no-project" replace />;
};

const NoProject = () => (
  <div style={{ padding: '3rem', textAlign: 'center' }}>
    <h2>Chưa có nhóm</h2>
    <p style={{ color: 'var(--text-secondary)' }}>Tài khoản của bạn chưa được gán vào nhóm nào. Liên hệ admin để được hỗ trợ.</p>
  </div>
);

const App = () => {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/no-project" element={<NoProject />} />
            <Route
              path="/dashboard"
              element={<PrivateRoute roles={['Admin', 'Lecturer', 'Reviewer', 'StudentLeader', 'GroupMember']}><Dashboard /></PrivateRoute>}
            />
            <Route
              path="/topics"
              element={<PrivateRoute roles={['Admin', 'Lecturer']}><TopicManagement /></PrivateRoute>}
            />
            <Route
              path="/topic-ideas"
              element={<PrivateRoute roles={['Lecturer']}><TopicIdeas /></PrivateRoute>}
            />
            <Route
              path="/admin/users"
              element={<PrivateRoute roles={['Admin']}><AdminUsers /></PrivateRoute>}
            />
            <Route
              path="/admin/lecturers"
              element={<PrivateRoute roles={['Admin']}><AdminLecturers /></PrivateRoute>}
            />
            <Route
              path="/admin/import"
              element={<PrivateRoute roles={['Admin']}><AdminImport /></PrivateRoute>}
            />
            <Route
              path="/admin/semesters"
              element={<PrivateRoute roles={['Admin']}><AdminSemesters /></PrivateRoute>}
            />
            <Route
              path="/admin/holiday-templates"
              element={<PrivateRoute roles={['Admin']}><AdminHolidayTemplates /></PrivateRoute>}
            />
            <Route
              path="/audit-logs"
              element={<PrivateRoute><AuditLogs /></PrivateRoute>}
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
              element={<PrivateRoute roles={['Admin']}><AdminReviewers /></PrivateRoute>}
            />
            <Route
              path="/admin/scheduling"
              element={<PrivateRoute roles={['Admin']}><AdminScheduling /></PrivateRoute>}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;
