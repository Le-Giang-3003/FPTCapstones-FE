# Components


## File: src\components\Layout.tsx
```typescript

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
    { path: '/topics', label: 'Quáº£n lÃ½ Ä‘á»“ Ã¡n', icon: <FolderKanban size={20} />, roles: ['Admin', 'Lecturer'] },
    { path: '/topic-ideas', label: 'Quáº£n lÃ½ Ä‘á» tÃ i', icon: <BookOpen size={20} />, roles: ['Lecturer'] },
    { path: '/admin/users', label: 'Quáº£n lÃ½ user', icon: <Users size={20} />, roles: ['Admin'] },
    { path: '/admin/lecturers', label: 'Giáº£ng viÃªn', icon: <GraduationCap size={20} />, roles: ['Admin'] },
    { path: '/admin/semesters', label: 'Lá»‹ch trÃ¬nh ká»³', icon: <CalendarRange size={20} />, roles: ['Admin'] },
    { path: '/admin/import', label: 'Import Excel', icon: <Upload size={20} />, roles: ['Admin'] },
    { path: '/admin/reviewers', label: 'Chá»n reviewer', icon: <UserCheck size={20} />, roles: ['Admin'] },
    { path: '/admin/scheduling', label: 'Xáº¿p lá»‹ch review', icon: <CalendarClock size={20} />, roles: ['Admin'] },
    { path: '/audit-logs', label: 'Audit Logs', icon: <ClipboardList size={20} />, roles: ['Admin'] },
    // ÄÄƒng kÃ½ slot chá»‰ hiá»‡n cho: StudentLeader/GroupMember (Ä‘Äƒng kÃ½ nhÃ³m) + Reviewer (GV Ä‘Æ°á»£c admin chá»‰ Ä‘á»‹nh)
    { path: '/reviews/slots', label: 'ÄÄƒng kÃ½ slot review', icon: <CalendarCheck size={20} />, roles: ['Reviewer', 'StudentLeader', 'GroupMember'] },
    { path: myProjectPath, label: 'NhÃ³m cá»§a tÃ´i', icon: <FolderKanban size={20} />, roles: ['StudentLeader', 'GroupMember', 'Student'] },
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
              const linkElement = (
                <Link
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
                >
                  {item.icon}
                  {!isSidebarCollapsed && <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{item.label}</span>}
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
                // Override bg Ä‘á»¥c 100% â€” khÃ´ng cho content phÃ­a sau lá»™ qua dropdown
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
                  {isDark ? 'Giao diá»‡n sÃ¡ng' : 'Giao diá»‡n tá»‘i'}
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
                  <LogOut size={18} /> ÄÄƒng xuáº¥t
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
```


## File: src\components\Tooltip.tsx
```typescript

import React, { type ReactNode, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

type TooltipVariant = 'color-match' | 'glass-card';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  variant?: TooltipVariant;
  
  // Custom colors for 'color-match' variant
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  shadowColor?: string;
  blur?: boolean;
  
  // Placement (default to top center for color-match, left side for glass-card)
  placement?: 'top' | 'left' | 'right' | 'bottom';
  
  // Additional classes
  className?: string;
  style?: React.CSSProperties; // add passing style to container
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  variant = 'color-match', 
  bgColor = '#fbbf24', 
  textColor = '#18181b', 
  borderColor,
  shadowColor,
  blur = false,
  placement,
  className = '',
  style
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0, isReady: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const effectivePlacement = placement || (variant === 'glass-card' ? 'left' : 'top');

  const updateCoords = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      isReady: true,
    });
  };

  const handleMouseEnter = () => {
    if (className.includes('no-tooltip-hover')) return;
    updateCoords();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [isVisible]);

  const inlineStyles: React.CSSProperties & { [key: string]: any } = {};

  if (variant === 'color-match') {
    inlineStyles['--tooltip-bg'] = bgColor;
    inlineStyles['--tooltip-color'] = textColor;
    if (borderColor) inlineStyles['--tooltip-border'] = `1px solid ${borderColor}`;
    if (shadowColor) inlineStyles['--tooltip-shadow'] = `0 4px 12px ${shadowColor}`;
    if (blur) inlineStyles['--tooltip-blur'] = 'blur(8px)';
  }

  const portalContent = isVisible && coords.isReady ? createPortal(
    <div style={{ position: 'fixed', top: coords.top, left: coords.left, width: coords.width, height: coords.height, pointerEvents: 'none', zIndex: 99999 }}>
      <div 
        className={`global-tooltip tooltip-${variant} tooltip-pos-${effectivePlacement} tooltip-visible`}
        style={inlineStyles as React.CSSProperties}
      >
        {variant === 'color-match' && (
          <svg className="tooltip-arrow" width="10" height="5" viewBox="0 0 10 5">
            <polygon points="0,0 5,5 10,0" />
          </svg>
        )}
        <div className="tooltip-content-inner">
          {content}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div 
      className={`global-tooltip-container ${className}`} 
      style={style} 
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {portalContent}
    </div>
  );
};
```


