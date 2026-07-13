import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Lightbulb, 
  Users, 
  UserCheck, 
  FileUp, 
  Calendar, 
  Settings, 
  Clock, 
  UserSquare2, 
  GitBranch, 
  CalendarRange, 
  LogOut, 
  Menu,
  Compass,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { hasAnyRole } from '../utils/role';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    showToast(`Đã chuyển sang giao diện ${newTheme === 'light' ? 'Sáng' : 'Xanh đêm'}`, 'info');
  };

  if (!user) return null;

  const handleLogout = () => {
    logout();
    showToast('Đăng xuất thành công', 'success');
  };

  // Define sidebar menu items based on role
  const menuItems = [
    {
      label: 'Tổng quan',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Lecturer', 'Reviewer', 'StudentLeader', 'GroupMember'],
    },
    {
      label: 'Đề tài đồ án',
      path: '/topics',
      icon: BookOpen,
      roles: ['Admin', 'Lecturer'],
    },
    {
      label: 'Ý tưởng đề tài',
      path: '/topic-ideas',
      icon: Lightbulb,
      roles: ['Lecturer'],
    },
    {
      label: 'Đăng ký Slot Chấm',
      path: '/reviews/slots',
      icon: CalendarRange,
      roles: ['Admin', 'Reviewer', 'StudentLeader', 'GroupMember'],
    },
    {
      label: 'Nhóm đồ án',
      path: user.groupId ? `/projects/${user.groupId}` : '/no-project',
      icon: Compass,
      roles: ['StudentLeader', 'GroupMember'],
      customCheck: () => true
    },
    // Admin Sections
    {
      label: 'Quản lý Người dùng',
      path: '/admin/users',
      icon: Users,
      roles: ['Admin'],
    },
    {
      label: 'Quản lý Giảng viên',
      path: '/admin/lecturers',
      icon: UserSquare2,
      roles: ['Admin'],
    },
    {
      label: 'Nhập dữ liệu Excel',
      path: '/admin/import',
      icon: FileUp,
      roles: ['Admin'],
    },
    {
      label: 'Quản lý Học kỳ',
      path: '/admin/semesters',
      icon: Calendar,
      roles: ['Admin'],
    },
    {
      label: 'Mẫu Ngày lễ',
      path: '/admin/holiday-templates',
      icon: Settings,
      roles: ['Admin'],
    },
    {
      label: 'Hội đồng Chấm',
      path: '/admin/reviewers',
      icon: UserCheck,
      roles: ['Admin'],
    },
    {
      label: 'Thuật toán Xếp lịch',
      path: '/admin/scheduling',
      icon: GitBranch,
      roles: ['Admin'],
    },
    {
      label: 'Lịch sử hệ thống',
      path: '/audit-logs',
      icon: Clock,
      roles: ['Admin', 'Lecturer', 'Reviewer', 'StudentLeader', 'GroupMember'],
    },
  ];

  const filteredItems = menuItems.filter(item => 
    hasAnyRole(user.role, item.roles as any) && (!item.customCheck || item.customCheck())
  );

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'Admin': return 'Quản trị viên';
      case 'Lecturer': return 'Giảng viên';
      case 'Reviewer': return 'Hội đồng chấm';
      case 'StudentLeader': return 'Trưởng nhóm';
      case 'GroupMember': return 'Thành viên nhóm';
      default: return role;
    }
  };

  return (
    <div className="ds-layout-container">
      {/* Sidebar Panel */}
      <aside className={`ds-sidebar ${sidebarOpen ? 'open' : 'closed'} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="ds-sidebar-brand">
          {!sidebarCollapsed && <h2>FPT Capstone</h2>}
          <button
            className="ds-sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
            title={sidebarCollapsed ? 'Mở rộng' : 'Thu nhỏ'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="ds-sidebar-nav">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`ds-nav-item ${isActive ? 'active' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} className="ds-nav-icon" />
                {!sidebarCollapsed && <span className="ds-nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="ds-sidebar-footer">
          <div className="ds-user-badge">
            <div className="ds-user-avatar">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="ds-user-info">
                <span className="ds-user-name">{user.fullName}</span>
                <span className="ds-user-role">{getRoleLabel(user.role)}</span>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="ds-logout-btn" title={sidebarCollapsed ? 'Đăng xuất' : undefined}>
            <LogOut size={16} />
            {!sidebarCollapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="ds-main-viewport">
        {/* Header bar */}
        <header className="ds-header">
          <div className="ds-header-left">
            {!sidebarOpen && (
              <button className="ds-menu-trigger-btn" onClick={() => setSidebarOpen(true)} aria-label="Mở thanh điều hướng">
                <Menu size={20} />
              </button>
            )}
            <h1 className="ds-header-title">
              {filteredItems.find(item => location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path)))?.label || 'Dự án'}
            </h1>
          </div>

          <div className="ds-header-right" style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={toggleTheme} 
              className="ds-theme-toggle-btn"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-muted)',
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color var(--transition-fast), color var(--transition-fast)',
                marginRight: '12px'
              }}
              title={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            {user.groupId && (
              <span className="ds-group-badge">Nhóm {user.groupId}</span>
            )}
          </div>
        </header>

        {/* Content Viewport with animations */}
        <main className="ds-content-container">
          <div key={location.pathname} className="ds-page-transition-wrapper">
            <Outlet />
          </div>
        </main>
      </div>

      <style>{`
        .ds-layout-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background-color: var(--color-surface);
        }

        /* Sidebar styling */
        .ds-sidebar {
          width: 280px;
          height: 100%;
          /* Light: warm ivory gradient; Dark: overridden below */
          background: linear-gradient(
            180deg,
            var(--color-bg) 0%,
            color-mix(in oklch, var(--color-primary) 3%, var(--color-bg)) 100%
          );
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          transition: width var(--transition-normal);
          flex-shrink: 0;
          z-index: 1000;
          overflow: hidden;
        }

        /* Dark mode sidebar: glassmorphism floating panel */
        [data-theme="dark"] .ds-sidebar {
          background: linear-gradient(
            160deg,
            oklch(0.22 0.024 42 / 0.92) 0%,
            oklch(0.15 0.014 42 / 0.96) 55%,
            oklch(0.17 0.020 42 / 0.94) 100%
          );
          backdrop-filter: blur(20px) saturate(150%);
          -webkit-backdrop-filter: blur(20px) saturate(150%);
          border-right: 1px solid oklch(0.38 0.08 42 / 0.35);
          box-shadow: 4px 0 24px oklch(0.14 0.012 42 / 0.8);
        }

        .ds-sidebar.collapsed {
          width: 68px;
        }

        .ds-sidebar.closed {
          width: 0;
          border-right: none;
        }

        .ds-sidebar-brand {
          padding: 20px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--color-border);
          min-height: 72px;
          overflow: hidden;
          position: relative;
        }

        /* Orange accent bar at top of brand area in dark mode */
        [data-theme="dark"] .ds-sidebar-brand::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(to right, var(--color-primary), transparent);
        }

        .ds-sidebar.collapsed .ds-sidebar-brand {
          justify-content: center;
          padding: 20px 0;
        }

        .ds-sidebar-brand h2 {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          white-space: nowrap;
          /* FPT Orange → deep red gradient on the text */
          background: linear-gradient(135deg, oklch(0.70 0.20 42), oklch(0.52 0.22 25));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .ds-sidebar-toggle-btn {
          display: flex;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-muted);
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .ds-sidebar-toggle-btn:hover {
          background-color: color-mix(in oklch, var(--color-primary) 8%, transparent);
          color: var(--color-primary);
        }

        .ds-theme-toggle-btn:hover {
          background-color: var(--color-border);
          color: var(--color-ink);
        }

        .ds-sidebar-nav {
          flex: 1;
          padding: 16px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .ds-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 12px;
          text-decoration: none;
          color: var(--color-muted);
          border-radius: var(--radius-md);
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          border-left: 3px solid transparent;
          white-space: nowrap;
          overflow: hidden;
          transition: background-color var(--transition-fast), color var(--transition-fast),
                      transform var(--transition-fast), border-color var(--transition-fast);
        }

        .ds-sidebar.collapsed .ds-nav-item {
          justify-content: center;
          padding: 11px 0;
          border-left: none;
          border-radius: var(--radius-md);
        }

        .ds-sidebar.collapsed .ds-nav-item.active {
          background: color-mix(in oklch, var(--color-primary) 12%, transparent);
        }

        .ds-nav-item:hover {
          background-color: color-mix(in oklch, var(--color-primary) 6%, transparent);
          color: var(--color-ink);
          transform: translateX(3px);
          border-left-color: color-mix(in oklch, var(--color-primary) 40%, transparent);
        }

        .ds-sidebar.collapsed .ds-nav-item:hover {
          transform: none;
        }

        .ds-nav-item.active {
          background: linear-gradient(
            to right,
            color-mix(in oklch, var(--color-primary) 12%, transparent),
            color-mix(in oklch, var(--color-primary) 4%, transparent)
          );
          color: var(--color-primary);
          border-left-color: var(--color-primary);
        }

        /* Orange dot badge on active item */
        .ds-nav-item.active::after {
          content: '';
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-primary);
          margin-left: auto;
          flex-shrink: 0;
          box-shadow: 0 0 6px var(--color-primary);
        }

        .ds-sidebar.collapsed .ds-nav-item.active::after {
          display: none;
        }

        .ds-nav-icon {
          flex-shrink: 0;
        }

        .ds-sidebar-footer {
          padding: 16px 10px;
          border-top: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow: hidden;
        }

        .ds-user-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
        }

        .ds-sidebar.collapsed .ds-user-badge {
          justify-content: center;
        }

        .ds-sidebar.collapsed .ds-logout-btn {
          justify-content: center;
          padding: 10px 0;
        }

        .ds-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, oklch(0.70 0.20 42), oklch(0.55 0.22 30));
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          box-shadow: 0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-primary);
          flex-shrink: 0;
        }

        .ds-user-info {
          display: flex;
          flex-direction: column;
        }

        .ds-user-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--color-ink);
        }

        .ds-user-role {
          font-size: 0.8rem;
          color: var(--color-muted);
        }

        .ds-logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-muted);
          border-radius: var(--radius-sm);
          font-family: 'Roboto', sans-serif;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast),
                      border-color var(--transition-fast);
        }

        .ds-logout-btn:hover {
          background-color: color-mix(in oklch, var(--color-primary) 8%, transparent);
          border-color: color-mix(in oklch, var(--color-primary) 30%, transparent);
          color: var(--color-primary);
        }

        /* Viewport Styling */
        .ds-main-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background-color: var(--color-surface);
        }

        /* Dark mode: subtle radial orange glow in top-right corner */
        [data-theme="dark"] .ds-main-viewport {
          background-image: radial-gradient(
            ellipse 60% 40% at 90% 0%,
            color-mix(in oklch, var(--color-primary) 6%, transparent),
            transparent 70%
          );
        }

        .ds-header {
          height: 72px;
          background-color: var(--color-bg);
          /* Animated shimmer: subtle orange-gold gradient moving across */
          background-image: linear-gradient(
            90deg,
            transparent 0%,
            color-mix(in oklch, var(--color-primary) 5%, transparent) 30%,
            color-mix(in oklch, var(--color-accent) 4%, transparent) 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: ds-header-shimmer 6s ease-in-out infinite;
          /* Orange accent underline */
          border-bottom: none;
          box-shadow:
            0 1px 0 0 var(--color-border),
            0 2px 0 0 color-mix(in oklch, var(--color-primary) 35%, transparent);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          flex-shrink: 0;
        }

        @keyframes ds-header-shimmer {
          0%   { background-position: 200% 0; }
          50%  { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .ds-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ds-menu-trigger-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-ink);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast);
        }

        .ds-menu-trigger-btn:hover {
          background-color: var(--color-surface);
        }

        .ds-header-title {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .ds-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ds-header-email {
          color: var(--color-muted);
          font-size: 0.9rem;
        }

        .ds-group-badge {
          background-color: color-mix(in oklch, var(--color-primary) 10%, transparent);
          color: var(--color-primary);
          padding: 4px 12px;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 700;
          border: 1px solid color-mix(in oklch, var(--color-primary) 25%, transparent);
          letter-spacing: 0.3px;
        }

        .ds-content-container {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          position: relative;
        }

        /* Page transition slide-up + fade-in */
        .ds-page-transition-wrapper {
          animation: ds-page-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          height: 100%;
        }

        @keyframes ds-page-in {
          from {
            transform: translateY(12px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Responsive Mobile settings */
        @media (max-width: 768px) {
          .ds-sidebar {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
          }
          .ds-sidebar.open {
            width: 280px;
          }
          .ds-sidebar-toggle-btn {
            display: flex;
          }
          .ds-header {
            padding: 0 16px;
          }
          .ds-content-container {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
