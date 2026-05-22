import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasAnyRole } from '../utils/role';
import { useTheme } from '../contexts/ThemeContext';
import { LayoutDashboard, Users, FolderKanban, LogOut, Upload, ClipboardList, Sun, Moon, ChevronDown, GraduationCap, CalendarRange, ChevronLeft, ChevronRight, BookOpen, CalendarCheck, UserCheck, CalendarClock } from 'lucide-react';
const Layout = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const myProjectPath = user?.groupId ? `/projects/${user.groupId}` : '/no-project';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Lecturer'] },
    { path: '/topics', label: 'Quản lý đồ án', icon: <FolderKanban size={20} />, roles: ['Admin', 'Lecturer'] },
    { path: '/topic-ideas', label: 'Quản lý đề tài', icon: <BookOpen size={20} />, roles: ['Lecturer'] },
    { path: '/admin/users', label: 'Quản lý user', icon: <Users size={20} />, roles: ['Admin'] },
    { path: '/admin/lecturers', label: 'Giảng viên', icon: <GraduationCap size={20} />, roles: ['Admin'] },
    { path: '/admin/semesters', label: 'Lịch trình kỳ', icon: <CalendarRange size={20} />, roles: ['Admin'] },
    { path: '/admin/import', label: 'Import Excel', icon: <Upload size={20} />, roles: ['Admin'] },
    { path: '/admin/reviewers', label: 'Chọn reviewer', icon: <UserCheck size={20} />, roles: ['Admin'] },
    { path: '/admin/scheduling', label: 'Xếp lịch review', icon: <CalendarClock size={20} />, roles: ['Admin'] },
    { path: '/audit-logs', label: 'Audit Logs', icon: <ClipboardList size={20} />, roles: ['Admin'] },
    // Đăng ký slot chỉ hiện cho: StudentLeader/GroupMember (đăng ký nhóm) + Reviewer (GV được admin chỉ định)
    { path: '/reviews/slots', label: 'Đăng ký slot review', icon: <CalendarCheck size={20} />, roles: ['Reviewer', 'StudentLeader', 'GroupMember'] },
    { path: myProjectPath, label: 'Nhóm của tôi', icon: <FolderKanban size={20} />, roles: ['StudentLeader', 'GroupMember', 'Student'] },
  ];

  return (
    <div className="app-container" style={{ height: '100vh', overflow: 'hidden' }}>
      <aside className={`sidebar glass-panel ${isSidebarCollapsed ? 'collapsed' : ''}`} style={{ margin: '1rem 0 1rem 1rem', height: 'calc(100vh - 2rem)', position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '-12px',
            background: 'var(--surface-glass)',
            border: '1px solid var(--border-glass)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            zIndex: 10,
          }}
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div style={{ padding: '1rem 0', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', alignItems: isSidebarCollapsed ? 'center' : 'flex-start' }}>
          {isSidebarCollapsed ? (
            <h2 className="text-gradient" style={{ fontSize: '1.2rem' }}>FC</h2>
          ) : (
            <>
              <h2 className="text-gradient">FPT Capstones</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user?.role}</p>
            </>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navItems
            .filter(item => user && hasAnyRole(user?.role, item.roles as import('../types').Role[]))
            .map(item => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    gap: isSidebarCollapsed ? '0' : '0.75rem',
                    padding: isSidebarCollapsed ? '0.75rem 0' : '0.75rem 1rem',
                    borderRadius: '8px',
                    color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--accent-primary)' : 'transparent',
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                  }}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!isSidebarCollapsed && <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{item.label}</span>}
                </Link>
              );
            })}
        </nav>
      </aside>

      <main className="main-content">
        {/* User Profile Dropdown inside scrollable container */}
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '2.4rem',
            right: '2rem',
            zIndex: 100,
          }}
        >
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              background: 'var(--surface-glass)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-glass)',
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
              color: 'var(--text-primary)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-glass)';
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              color: 'var(--accent-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.8rem'
            }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.fullName}
            </span>
            <ChevronDown
              size={16}
              style={{
                transition: 'transform 0.2s',
                transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                color: 'var(--text-secondary)'
              }}
            />
          </button>

          {dropdownOpen && (
            <div
              className="glass-panel animate-fade-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                right: 0,
                width: '280px',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                // Override bg đục 100% — không cho content phía sau lộ qua dropdown
                background: 'var(--surface-glass)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-glass)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}>
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{user?.fullName}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.email}</p>
                  <span className="badge" style={{ display: 'inline-block', marginTop: '0.35rem', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '0.125rem 0.5rem', fontSize: '0.7rem', border: '1px solid var(--border-glass)' }}>
                    {user?.role}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="theme-toggle"
                  style={{ margin: 0, width: '100%' }}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  {isDark ? 'Giao diện sáng' : 'Giao diện tối'}
                  <span className="theme-toggle-track">
                    <span className={`theme-toggle-thumb ${isDark ? 'dark' : 'light'}`} />
                  </span>
                </button>

                <button
                  onClick={logout}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: 'var(--danger)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LogOut size={18} /> Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
