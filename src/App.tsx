import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
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
import Layout from './components/Layout';

const PrivateRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'Admin' || user.role === 'Lecturer') return <Navigate to="/dashboard" replace />;
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
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/no-project" element={<NoProject />} />
          <Route
            path="/dashboard"
            element={<PrivateRoute roles={['Admin', 'Lecturer']}><Dashboard /></PrivateRoute>}
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
              <PrivateRoute roles={['Admin', 'Lecturer', 'StudentLeader', 'GroupMember']}>
                <ReviewSlots />
              </PrivateRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
