import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasAnyRole } from '../utils/role';
import { useTheme } from '../contexts/ThemeContext';
import { LayoutDashboard, Users, FolderKanban, LogOut, Upload, ClipboardList, Sun, Moon, ChevronDown, GraduationCap, CalendarRange, ChevronLeft, ChevronRight, BookOpen, CalendarCheck, UserCheck, CalendarClock } from 'lucide-react';
import { Tooltip } from './Tooltip';
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
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'Lecturer', 'Reviewer', 'StudentLeader', 'GroupMember'] },
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
      <aside
        className={`sidebar glass-panel ${isSidebarCollapsed ? 'collapsed' : ''}`}
        style={{
          margin: '1rem 0 1rem 1rem',
          height: 'calc(100vh - 2rem)',
          position: 'relative',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Collapse toggle button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          aria-label={isSidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          style={{
            position: 'absolute',
            top: '1.25rem',
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
            boxShadow: 'var(--shadow-sm)',
            zIndex: 10,
          }}
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand header */}
        <div
          style={{
            padding: '0.5rem 0 1rem 0',
            marginBottom: '0.75rem',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              flexShrink: 0,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            FC
          </div>
          {!isSidebarCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <h2
                className="text-gradient"
                style={{ fontSize: '1rem', margin: 0, lineHeight: 1.25 }}
              >
                FPT Capstones
              </h2>
              <p
                style={{
                  margin: '0.15rem 0 0',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.role || 'Portal'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isSidebarCollapsed ? '0.25rem' : '0.125rem',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: isSidebarCollapsed ? 0 : '0.25rem',
          }}
        >
          {navItems
            .filter(item => user && hasAnyRole(user?.role, item.roles as import('../types').Role[]))
            .map(item => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              const linkElement = (
                /*
                  Một lớp CSS lo cả hai trạng thái. Khi thu gọn, mục đang mở là
                  một ô vuông 40×40 có nền xám nhạt + vạch cam bên trái — không
                  phải một khối cam đặc: trong dải hẹp 64px, khối đặc chiếm gần
                  trọn bề ngang và biến mục đang mở thành cục màu to nhất màn hình.
                */
                <Link
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className="nav-item"
                  data-active={isActive ? 'true' : undefined}
                  data-collapsed={isSidebarCollapsed ? 'true' : undefined}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {!isSidebarCollapsed && (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );

              if (isSidebarCollapsed) {
                return (
                  <Tooltip key={item.path} content={item.label} variant="glass-card" placement="right">
                    {linkElement}
                  </Tooltip>
                );
              }
              return <div key={item.path}>{linkElement}</div>;
            })}
        </nav>

        {/* Sidebar Footer: User Profile Card & Settings Popover */}
        <div
          ref={dropdownRef}
          style={{
            position: 'relative',
            marginTop: 'auto',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-glass)',
          }}
        >
          {dropdownOpen && (
            /*
              Popover neo theo đúng mép của nút mở nó.

              Bản trước đặt `width: 260px` cố định trong khi khung chứa chỉ rộng
              228px (260px sidebar trừ 32px padding), nên nó thừa 32px về bên
              phải và lệch khỏi nút bên dưới. Khi mở rộng thì căng theo cả hai
              mép (`left: 0; right: 0`) để hai mép luôn khớp bất kể sidebar rộng
              bao nhiêu; khi thu gọn thì dải chỉ còn 48px nên phải cho nó tràn
              sang phải theo chiều mở của dải.
            */
            <div
              className="glass-panel animate-fade-in"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 0.6rem)',
                left: 0,
                ...(isSidebarCollapsed ? { width: '248px' } : { right: 0 }),
                padding: '1rem',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                background: 'var(--surface-glass)',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border-glass)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                  }}
                >
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
                {/* `text-overflow: ellipsis` chỉ hiện dấu … khi chính phần tử đó
                    có `overflow: hidden` — đặt ở thẻ cha thì chữ bị cắt cụt. */}
                <div style={{ overflow: 'hidden', minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {user?.fullName}
                  </p>
                  <p
                    title={user?.email}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      margin: '0.15rem 0',
                    }}
                  >
                    {user?.email}
                  </p>
                  <span
                    className="badge"
                    style={{
                      display: 'inline-block',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      padding: '0.125rem 0.5rem',
                      fontSize: '0.7rem',
                      border: '1px solid var(--border-glass)',
                    }}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={toggleTheme}
                  className="theme-toggle"
                  style={{ margin: 0, width: '100%', fontSize: '0.8125rem' }}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  <span style={{ whiteSpace: 'nowrap' }}>
                    {isDark ? 'Giao diện sáng' : 'Giao diện tối'}
                  </span>
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
                    border: '1px solid rgba(220, 38, 38, 0.25)',
                    color: 'var(--danger)',
                    fontSize: '0.85rem',
                    padding: '0.5rem 0.85rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            </div>
          )}

          {isSidebarCollapsed ? (
            <Tooltip content={user?.fullName || 'Tài khoản'} variant="glass-card" placement="right">
              {/* Cùng ô chạm 40×40 như các mục điều hướng, để cả dải thẳng một cột */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label={user?.fullName || 'Tài khoản'}
                style={{
                  width: '40px',
                  height: '40px',
                  margin: '0 auto',
                  borderRadius: 'var(--radius-control, 8px)',
                  border: 'none',
                  background: dropdownOpen ? 'var(--btn-hover-bg)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'background var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}
                >
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                background: dropdownOpen ? 'var(--btn-hover-bg)' : 'transparent',
                border: '1px solid var(--border-glass)',
                padding: '0.5rem 0.65rem',
                borderRadius: '10px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'all var(--transition-fast)',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-glass)';
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  flexShrink: 0,
                }}
              >
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.fullName}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.role}
                </p>
              </div>
              <ChevronDown
                size={15}
                style={{
                  flexShrink: 0,
                  transition: 'transform 0.2s',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                  color: 'var(--text-secondary)',
                }}
              />
            </button>
          )}
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
