import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LayoutDashboard, Users, FolderKanban, LogOut, Upload, ClipboardList, Sun, Moon } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const myProjectPath = user?.groupId ? `/projects/${user.groupId}` : '/no-project';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Lecturer'] },
    { path: '/admin/users', label: 'Quản lý user', icon: <Users size={20} />, roles: ['Admin'] },
    { path: '/admin/import', label: 'Import Excel', icon: <Upload size={20} />, roles: ['Admin'] },
    { path: '/audit-logs', label: 'Audit Logs', icon: <ClipboardList size={20} />, roles: ['Admin', 'Lecturer', 'StudentLeader'] },
    { path: myProjectPath, label: 'Nhóm của tôi', icon: <FolderKanban size={20} />, roles: ['StudentLeader', 'GroupMember', 'Student'] },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar glass-panel" style={{ margin: '1rem 0 1rem 1rem', height: 'calc(100vh - 2rem)' }}>
        <div style={{ padding: '1rem 0', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)' }}>
          <h2 className="text-gradient">FPT Capstones</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user?.role}</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navItems
            .filter(item => user && item.roles.includes(user.role))
            .map(item => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    background: isActive ? 'var(--accent-primary)' : 'transparent',
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                  }}
                >
                  {item.icon}
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                </Link>
              );
            })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-glass)' }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.fullName}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email}</p>
            </div>
          </div>
          <button onClick={toggleTheme} className="theme-toggle">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Giao diện sáng' : 'Giao diện tối'}
            <span className="theme-toggle-track">
              <span className={`theme-toggle-thumb ${isDark ? 'dark' : 'light'}`} />
            </span>
          </button>
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
