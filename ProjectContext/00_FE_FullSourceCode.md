# FrontEnd Full Source Code


## File: src\App.css
```css

.counter {
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 5px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid transparent;
  transition: border-color 0.3s;
  margin-bottom: 24px;

  &:hover {
    border-color: var(--accent-border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}
.hero {
  position: relative;

  .base,
  .framework,
  .vite {
    inset-inline: 0;
    margin: 0 auto;
  }

  .base {
    width: 170px;
    position: relative;
    z-index: 0;
  }

  .framework,
  .vite {
    position: absolute;
  }

  .framework {
    z-index: 1;
    top: 34px;
    height: 28px;
    transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
      scale(1.4);
  }

  .vite {
    z-index: 0;
    top: 107px;
    height: 26px;
    width: auto;
    transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
      scale(0.8);
  }
}

#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;

  @media (max-width: 1024px) {
    padding: 32px 20px 24px;
    gap: 18px;
  }
}

#next-steps {
  display: flex;
  border-top: 1px solid var(--border);
  text-align: left;

  & > div {
    flex: 1 1 0;
    padding: 32px;
    @media (max-width: 1024px) {
      padding: 24px 20px;
    }
  }
  /**/
  .icon {
    margin-bottom: 16px;
    width: 22px;
    height: 22px;
  }

  /**/
  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
}

#docs {
  border-right: 1px solid var(--border);

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}

#next-steps ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
  margin: 32px 0 0;

  .logo {
    height: 18px;
  }

  a {
    color: var(--text-h);
    font-size: 16px;
    border-radius: 6px;
    background: var(--social-bg);
    display: flex;
    padding: 6px 12px;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    transition: box-shadow 0.3s;

    &:hover {
      box-shadow: var(--shadow);
    }
    .button-icon {
      height: 18px;
      width: 18px;
    }
  }

  @media (max-width: 1024px) {
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;

    li {
      flex: 1 1 calc(50% - 8px);
    }

    a {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
  }
}

#spacer {
  height: 88px;
  border-top: 1px solid var(--border);
  @media (max-width: 1024px) {
    height: 48px;
  }
}

.ticks {
  position: relative;
  width: 100%;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4.5px;
    border: 5px solid transparent;
  }

  &::before {
    left: 0;
    border-left-color: var(--border);
  }
  &::after {
    right: 0;
    border-right-color: var(--border);
  }
}
```


## File: src\App.tsx
```typescript

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
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
  // Má»i user cÃ³ quyá»n xem dashboard Ä‘á»u landing á»Ÿ /dashboard (Admin/Lecturer/Reviewer/Student)
  if (hasAnyRole(user.role, ['Admin', 'Lecturer', 'Reviewer', 'StudentLeader', 'GroupMember']))
    return <Navigate to="/dashboard" replace />;
  if (user.groupId) return <Navigate to={`/projects/${user.groupId}`} replace />;
  return <Navigate to="/no-project" replace />;
};

const NoProject = () => (
  <div style={{ padding: '3rem', textAlign: 'center' }}>
    <h2>ChÆ°a cÃ³ nhÃ³m</h2>
    <p style={{ color: 'var(--text-secondary)' }}>TÃ i khoáº£n cá»§a báº¡n chÆ°a Ä‘Æ°á»£c gÃ¡n vÃ o nhÃ³m nÃ o. LiÃªn há»‡ admin Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£.</p>
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
  );
};

export default App;
```


## File: src\index.css
```css

@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Roboto:wght@400;500;600;700&display=swap');

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   LottieFiles-style design system (xem DESIGN_Lottie.md)
   "Playful precision" â€” ná»n tráº¯ng Cloud White, neutral achromatic,
   accent teal #019d91 (CTA/active/link) vá»›i Ä‘iá»ƒm nháº¥n vÃ ng #f0b100.
   Má»˜T shadow ráº¥t nháº¹ duy nháº¥t. Bo má»m: card 16px, nÃºt 12px, form 8px.
   Font giá»¯ Be Vietnam Pro (tá»‘i Æ°u tiáº¿ng Viá»‡t) thay cho DM Sans/Inter.
   Theme sÃ¡ng lÃ  chuáº©n; :root.dark lÃ  biáº¿n thá»ƒ tá»‘i.
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/* ÄÄƒng kÃ½ CSS custom properties dáº¡ng <color> Ä‘á»ƒ browser interpolate khi Ä‘á»•i theme. */
@property --bg-primary        { syntax: '<color>'; inherits: true; initial-value: #ffffff; }
@property --bg-secondary      { syntax: '<color>'; inherits: true; initial-value: #f4f4f5; }
@property --text-primary      { syntax: '<color>'; inherits: true; initial-value: #09090b; }
@property --text-secondary    { syntax: '<color>'; inherits: true; initial-value: #71717b; }
@property --surface-glass     { syntax: '<color>'; inherits: true; initial-value: #ffffff; }
@property --border-glass      { syntax: '<color>'; inherits: true; initial-value: #e4e4e7; }
@property --accent-glow       { syntax: '<color>'; inherits: true; initial-value: rgba(1, 157, 145, 0.22); }
@property --glass-card-bg     { syntax: '<color>'; inherits: true; initial-value: #ffffff; }
@property --input-bg          { syntax: '<color>'; inherits: true; initial-value: #fafafa; }
@property --table-row-bg      { syntax: '<color>'; inherits: true; initial-value: #ffffff; }
@property --table-row-hover   { syntax: '<color>'; inherits: true; initial-value: #f4f4f5; }
@property --modal-overlay-bg  { syntax: '<color>'; inherits: true; initial-value: rgba(255, 255, 255, 0.55); }
@property --btn-hover-bg      { syntax: '<color>'; inherits: true; initial-value: #f4f4f5; }
@property --accent-primary    { syntax: '<color>'; inherits: true; initial-value: #019d91; }
@property --accent-hover      { syntax: '<color>'; inherits: true; initial-value: #017d73; }
@property --accent-text       { syntax: '<color>'; inherits: true; initial-value: #ffffff; }
@property --accent-violet      { syntax: '<color>'; inherits: true; initial-value: #019d91; }
@property --accent-blue        { syntax: '<color>'; inherits: true; initial-value: #00ddb3; }

:root {
  /* --- LottieFiles Light (máº·c Ä‘á»‹nh) --- */
  --bg-primary: #ffffff;        /* Cloud White */
  --bg-secondary: #f4f4f5;      /* Dark Graphite â€” section/ná»n phá»¥ */
  --text-primary: #09090b;      /* Carbon Black */
  --text-secondary: #71717b;    /* Steel Gray */
  --text-tertiary: #9f9fa9;     /* Cadet Gray â€” placeholder */
  --heading-color: #09090b;
  --accent-primary: #f37021;    /* FPT Orange â€” CTA / active */
  --accent-hover: #d95f12;
  --accent-text: #ffffff;
  --accent-violet: #f37021;     /* link = cam */
  --accent-blue: #ff8a3d;       /* cam sÃ¡ng â€” hover link */
  --accent-yellow: #f0b100;     /* Sunshine Yellow â€” Ä‘iá»ƒm nháº¥n phá»¥ */
  --accent-glow: rgba(243, 112, 33, 0.22);
  --success: #15803d;
  --danger: #e5484d;
  --warning: #f0b100;
  --signal-blue: #3a86ff;
  --surface-glass: #ffffff;
  --border-glass: #e4e4e7;      /* Slate Gray */
  --glass-card-bg: #ffffff;
  --input-bg: #fafafa;          /* Ash White */
  --table-row-bg: #ffffff;
  --table-row-hover: #f4f4f5;
  --modal-overlay-bg: rgba(255, 255, 255, 0.55);  /* má» tráº¯ng â€” light mode */
  --btn-hover-bg: #f4f4f5;

  /* Má»˜T shadow nháº¹ duy nháº¥t â€” triáº¿t lÃ½ elevation tá»‘i giáº£n cá»§a Lottie */
  --shadow-sm: rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;
  --shadow-md: rgba(0, 0, 0, 0.05) 0px 1px 2px 0px;
  --shadow-lg: rgba(0, 0, 0, 0.08) 0px 4px 12px 0px;
  --shadow-glow: 0 0 0 3px var(--accent-glow);

  /* Fonts â€” Montserrat cho tiÃªu Ä‘á»; Roboto cho ná»™i dung (render sáº¯c nÃ©t trÃªn Windows, há»— trá»£ tiáº¿ng Viá»‡t) */
  --font-display: 'Montserrat', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-body: 'Roboto', 'Segoe UI', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;

  --transition-fast: 0.12s ease;
  --transition-normal: 0.25s ease;

  transition:
    --bg-primary       0.25s ease,
    --bg-secondary     0.25s ease,
    --text-primary     0.25s ease,
    --text-secondary   0.25s ease,
    --surface-glass    0.25s ease,
    --border-glass     0.25s ease,
    --accent-glow      0.25s ease,
    --accent-primary   0.25s ease,
    --accent-hover     0.25s ease,
    --accent-text      0.25s ease,
    --accent-violet    0.25s ease,
    --accent-blue      0.25s ease,
    --glass-card-bg    0.25s ease,
    --input-bg         0.25s ease,
    --table-row-bg     0.25s ease,
    --table-row-hover  0.25s ease,
    --modal-overlay-bg 0.25s ease,
    --btn-hover-bg     0.25s ease;
}

/* --- Biáº¿n thá»ƒ tá»‘i (zinc + teal) --- */
:root.dark {
  --bg-primary: #09090b;
  --bg-secondary: #18181b;
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-tertiary: #71717b;
  --heading-color: #ffffff;
  --accent-primary: #ff7a33;    /* cam sÃ¡ng hÆ¡n trÃªn ná»n tá»‘i */
  --accent-hover: #f37021;
  --accent-text: #ffffff;
  --accent-violet: #ff8a3d;
  --accent-blue: #ffa766;
  --accent-glow: rgba(255, 122, 51, 0.3);
  --success: #4ade80;
  --danger: #f87171;
  --warning: #f0b100;
  --surface-glass: #18181b;
  --border-glass: #27272a;
  --glass-card-bg: #18181b;
  --input-bg: #111113;
  --table-row-bg: #18181b;
  --table-row-hover: #27272a;
  --modal-overlay-bg: rgba(0, 0, 0, 0.7);
  --btn-hover-bg: #27272a;
  --shadow-md: rgba(0, 0, 0, 0.4) 0px 1px 2px 0px;
  --shadow-lg: rgba(0, 0, 0, 0.5) 0px 4px 12px 0px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-body);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  letter-spacing: 0;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  height: 100%;
  overflow: hidden;
}

#root {
  height: 100%;
}

/* Headline â€” tracking thoÃ¡ng cho tiáº¿ng Viá»‡t, line-height rá»™ng Ä‘á»ƒ dáº¥u khÃ´ng cá»¥ng */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--heading-color);
  line-height: 1.25;
}

h1 { font-weight: 700; letter-spacing: -0.015em; }
h2 { font-weight: 600; letter-spacing: -0.012em; }

a {
  color: var(--accent-violet);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--accent-blue);
}

/* Surfaces â€” card bo 16px, shadow nháº¹ duy nháº¥t */
.glass-panel {
  background: var(--surface-glass);
  border: 1px solid var(--border-glass);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
}

.glass-card {
  background: var(--glass-card-bg);
  border: 1px solid var(--border-glass);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow-md);
  transition: border-color var(--transition-normal);
}

/* Card tÄ©nh khÃ´ng pháº£n há»“i hover â€” chá»‰ card cÃ³ .is-interactive (click Ä‘Æ°á»£c) má»›i sÃ¡ng viá»n */
.glass-card.is-interactive {
  cursor: pointer;
}

.glass-card.is-interactive:hover {
  border-color: var(--accent-primary);
}

/* Buttons â€” bo 12px (bo má»m, friendly) */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.55rem 1.4rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
  font-family: var(--font-body);
  letter-spacing: 0;
}

.btn-primary {
  background: var(--accent-primary);
  color: var(--accent-text);
  border: 1px solid transparent;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--surface-glass);
  color: var(--text-primary);
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-sm);
}

.btn-secondary:hover {
  background: var(--btn-hover-bg);
  border-color: var(--accent-primary);
}

.btn-danger {
  background: var(--danger);
  color: #ffffff;
  border: 1px solid transparent;
}

.btn-danger:hover {
  filter: brightness(0.94);
}

/* Form Elements */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.input-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.input-field {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border-radius: 8px;
  background: var(--input-bg);
  border: 1px solid var(--border-glass);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
  letter-spacing: 0;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.input-field::placeholder {
  color: var(--text-tertiary);
}

/* Checkbox tÃ¹y biáº¿n â€” bo gÃ³c má»m, cam FPT khi tÃ­ch, animation mÆ°á»£t */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 19px;
  height: 19px;
  border-radius: 6px;
  border: 1.5px solid var(--border-glass);
  background: var(--surface-glass);
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  display: inline-grid;
  place-content: center;
  transition: background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease;
}

input[type="checkbox"]::before {
  content: "";
  width: 11px;
  height: 11px;
  transform: scale(0);
  transform-origin: center;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  background-color: #ffffff;
  /* dáº¥u check */
  clip-path: polygon(14% 47%, 0 60%, 40% 100%, 100% 22%, 86% 10%, 39% 70%);
}

input[type="checkbox"]:hover:not(:disabled) {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

input[type="checkbox"]:checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

input[type="checkbox"]:checked::before {
  transform: scale(1);
}

input[type="checkbox"]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-glow);
}

input[type="checkbox"]:active:not(:disabled) {
  transform: scale(0.92);
}

input[type="checkbox"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-field:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

/* Layout */
.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  border-right: 1px solid var(--border-glass);
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  position: sticky;
  top: 1rem;
  flex-shrink: 0;
  transition: width 0.3s ease, padding 0.3s ease;
}

.sidebar.collapsed {
  width: 84px;
  padding: 1.5rem 0.5rem;
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  position: relative;
  min-height: 0;
  scroll-behavior: smooth;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-right: 260px;
}

/* Logo wordmark â€” gradient teal â†’ vivid aqua, nÄƒng Ä‘á»™ng kiá»ƒu Lottie */
.text-gradient {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.015em;
  background: linear-gradient(135deg, #f37021, #ff9a3d);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge {
  padding: 0.2rem 0.7rem;
  border-radius: 48px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0;
}

.badge-success { background: rgba(21, 128, 61, 0.12); color: var(--success); border: 1px solid rgba(21, 128, 61, 0.25); }
.badge-warning { background: rgba(240, 177, 0, 0.14); color: #eab308; border: 1px solid rgba(240, 177, 0, 0.3); }
.badge-danger  { background: rgba(229, 72, 77, 0.12); color: var(--danger); border: 1px solid rgba(229, 72, 77, 0.25); }
.badge-info    { background: rgba(58, 134, 255, 0.12); color: var(--signal-blue); border: 1px solid rgba(58, 134, 255, 0.25); }
.badge-ongoing { background: rgba(0, 221, 179, 0.14); color: #2dd4bf; border: 1px solid rgba(0, 221, 179, 0.3); }

/* Table */
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.5rem;
}

.data-table th {
  text-align: left;
  padding: 0.85rem 1rem;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  border-bottom: 1px solid var(--border-glass);
}

.data-table td {
  padding: 0.9rem 1rem;
  background: var(--table-row-bg);
  border-top: 1px solid var(--border-glass);
  border-bottom: 1px solid var(--border-glass);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.data-table tbody tr {
  transition: background var(--transition-fast);
  cursor: pointer;
}

.data-table tbody tr:hover td {
  background: var(--table-row-hover);
}

.data-table tbody tr:hover td:first-child {
  box-shadow: inset 3px 0 0 var(--accent-primary);
}

.data-table td:first-child  { border-left: 1px solid var(--border-glass); border-top-left-radius: 10px; border-bottom-left-radius: 10px; }
.data-table td:last-child   { border-right: 1px solid var(--border-glass); border-top-right-radius: 10px; border-bottom-right-radius: 10px; }

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.25s ease forwards;
}

.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--modal-overlay-bg);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal-content {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 24px;
}

/* Toggle switch */
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.6rem 1rem;
  border-radius: 12px;
  width: 100%;
  background: var(--surface-glass);
  border: 1px solid var(--border-glass);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 0.5rem;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast);
}

.theme-toggle:hover {
  background: var(--btn-hover-bg);
  border-color: var(--accent-primary);
}

.theme-toggle-track {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 48px;
  background: var(--accent-primary);
  flex-shrink: 0;
  transition: background var(--transition-fast);
  margin-left: auto;
}

.theme-toggle-thumb {
  position: absolute;
  top: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  transition: left 0.25s ease;
}

.theme-toggle-thumb.dark  { left: 2px; }
.theme-toggle-thumb.light { left: 18px; }

/* Scrollbar tinh giáº£n */
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-glass); border-radius: 48px; border: 2px solid var(--bg-primary); }
::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
```


## File: src\main.tsx
```typescript

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
```


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


## File: src\components\Tooltip.css
```css

/* global container */
.global-tooltip-container {
  position: relative;
  display: inline-flex;
  cursor: pointer;
}

/* Base tooltip styling */
.global-tooltip {
  position: absolute;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 99999;
}

/* New explicit visible class */
.global-tooltip.tooltip-visible,
.global-tooltip-container:hover:not(.no-tooltip-hover) .global-tooltip {
  opacity: 1;
  visibility: visible;
}

/* ==================================================
   VARIANT 1: COLOR-MATCH
================================================== */
.tooltip-color-match {
  background: var(--tooltip-bg, #fbbf24);
  color: var(--tooltip-color, #18181b);
  border: var(--tooltip-border, none);
  box-shadow: var(--tooltip-shadow, 0 4px 12px rgba(251, 191, 36, 0.3));
  backdrop-filter: var(--tooltip-blur, none);
  
  font-weight: 700;
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
}

/* Arrow for color-match */
.tooltip-color-match .tooltip-arrow {
  position: absolute;
  fill: var(--tooltip-bg, #fbbf24);
}

/* ==================================================
   VARIANT 2: GLASS-CARD (Giá»‘ng nÃºt Báº¯t Ä‘áº§u)
================================================== */
.tooltip-glass-card {
  background: var(--surface-glass);
  border: 1px solid var(--border-glass);
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.5);
  width: 260px; /* Fixed width like the "Báº¯t Ä‘áº§u" popup */
  white-space: normal;
}

/* ==================================================
   PLACEMENTS
================================================== */
/* TOP */
.tooltip-pos-top {
  top: -10px;
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  margin-top: 4px;
}
.tooltip-visible.tooltip-pos-top,
.global-tooltip-container:hover .tooltip-pos-top {
  margin-top: 0;
}
.tooltip-pos-top .tooltip-arrow {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
}

/* BOTTOM */
.tooltip-pos-bottom {
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%) translateY(100%);
  margin-bottom: 4px;
}
.tooltip-visible.tooltip-pos-bottom,
.global-tooltip-container:hover .tooltip-pos-bottom {
  margin-bottom: 0;
}
.tooltip-pos-bottom .tooltip-arrow {
  top: -4px;
  left: 50%;
  transform: translateX(-50%) rotate(180deg);
}

/* LEFT (Default set for glass-card) */
.tooltip-pos-left {
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  margin-right: 4px;
}
.tooltip-visible.tooltip-pos-left,
.global-tooltip-container:hover .tooltip-pos-left {
  margin-right: 0;
}
.tooltip-pos-left .tooltip-arrow {
  right: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
}

/* RIGHT */
.tooltip-pos-right {
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  margin-left: 4px;
}
.tooltip-visible.tooltip-pos-right,
.global-tooltip-container:hover .tooltip-pos-right {
  margin-left: 0;
}
.tooltip-pos-right .tooltip-arrow {
  left: -4px;
  top: 50%;
  transform: translateY(-50%) rotate(90deg);
}
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


## File: src\contexts\AuthContext.tsx
```typescript

import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthResponse, CurrentUserDto } from '../types';
import api from '../services/api';
import type { CredentialResponse } from '@react-oauth/google';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentialResponse: CredentialResponse) => Promise<User>;
  loginByEmail: (email: string) => Promise<User>;
  logout: () => void;
  refreshMe: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'user';
const TOKEN_KEY = 'accessToken';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async (): Promise<User | null> => {
    const res = await api.get<CurrentUserDto>('/api/auth/me');
    const u: User = {
      userId: res.data.userId,
      email: res.data.email,
      fullName: res.data.fullName,
      role: res.data.role,
      groupId: res.data.groupId,
    };
    setUser(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    return u;
  };

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(USER_KEY);
      }
      // Refresh thÃ´ng tin user khi reload Ä‘á»ƒ cÃ³ groupId má»›i nháº¥t
      fetchMe().catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentialResponse: CredentialResponse): Promise<User> => {
    const response = await api.post<AuthResponse>('/api/auth/google', {
      idToken: credentialResponse.credential,
    });
    localStorage.setItem(TOKEN_KEY, response.data.accessToken);
    const me = await fetchMe();
    if (!me) throw new Error('Failed to load user profile');
    return me;
  };

  const loginByEmail = async (email: string): Promise<User> => {
    const response = await api.post<AuthResponse>('/api/auth/email-login', { email });
    localStorage.setItem(TOKEN_KEY, response.data.accessToken);
    const me = await fetchMe();
    if (!me) throw new Error('Failed to load user profile');
    return me;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // KhÃ´ng dÃ¹ng window.location.href Ä‘á»ƒ trÃ¡nh full page reload gÃ¢y nhÃ¡y theme
    // PrivateRoute sáº½ tá»± redirect vá» /login khi user === null
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginByEmail, logout, refreshMe: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
```


## File: src\contexts\ThemeContext.tsx
```typescript

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    const dark = saved === 'dark'; // máº·c Ä‘á»‹nh sÃ¡ng (Cloud White â€” chuáº©n LottieFiles)
    // Apply class ngay láº­p tá»©c Ä‘á»ƒ trÃ¡nh flash giao diá»‡n sai khi reload/logout
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    return dark;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
```


## File: src\pages\AdminHolidayTemplates.tsx
```typescript

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import type { HolidayTemplateDto } from '../types';
import { Plus, Loader2, Edit, Trash2, AlertCircle, BookmarkPlus, CheckCircle, XCircle } from 'lucide-react';

// Quáº£n lÃ½ kho lá»… chuáº©n (HolidayTemplate). TÃ¡ch khá»i AdminSemesters vÃ¬:
// - Template dÃ¹ng chung cho má»i nÄƒm â€” sá»­a template khÃ´ng áº£nh hÆ°á»Ÿng ká»³ Ä‘Ã£ sinh
// - CÃ³ field IsAnnual riÃªng Ä‘á»ƒ auto-seed má»—i nÄƒm khi GenerateSchedule cháº¡y

const MONTH_VI = ['', 'ThÃ¡ng 1', 'ThÃ¡ng 2', 'ThÃ¡ng 3', 'ThÃ¡ng 4', 'ThÃ¡ng 5', 'ThÃ¡ng 6', 'ThÃ¡ng 7', 'ThÃ¡ng 8', 'ThÃ¡ng 9', 'ThÃ¡ng 10', 'ThÃ¡ng 11', 'ThÃ¡ng 12'];

interface FormState {
  label: string;
  isAnnual: boolean;
  isCompensated: boolean;
  defaultStartMonth: number;
  defaultStartDay: number;
  defaultDurationDays: number;
}

const blankForm: FormState = {
  label: '', isAnnual: true, isCompensated: true,
  defaultStartMonth: 1, defaultStartDay: 1, defaultDurationDays: 1,
};

const AdminHolidayTemplates = () => {
  const [list, setList] = useState<HolidayTemplateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  // Modal create/edit dÃ¹ng chung â€” null = áº©n, sá»‘ = edit id, 'new' = create
  const [editMode, setEditMode] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get<HolidayTemplateDto[]>('/api/admin/holiday-templates', {
        params: { includeInactive },
      });
      setList(res.data);
    } catch (e) {
      console.error('Load templates failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [includeInactive]);

  const openCreate = () => {
    setForm(blankForm);
    setError(null);
    setEditMode('new');
  };

  const openEdit = (t: HolidayTemplateDto) => {
    setForm({
      label: t.label,
      isAnnual: t.isAnnual,
      isCompensated: t.isCompensated,
      defaultStartMonth: t.defaultStartMonth,
      defaultStartDay: t.defaultStartDay,
      defaultDurationDays: t.defaultDurationDays,
    });
    setError(null);
    setEditMode(t.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.label.trim()) { setError('TÃªn lá»… khÃ´ng Ä‘Æ°á»£c rá»—ng'); return; }
    if (form.defaultStartMonth < 1 || form.defaultStartMonth > 12) { setError('ThÃ¡ng pháº£i 1-12'); return; }
    if (form.defaultStartDay < 1 || form.defaultStartDay > 31) { setError('NgÃ y pháº£i 1-31'); return; }
    if (form.defaultDurationDays < 1) { setError('Sá»‘ ngÃ y pháº£i >= 1'); return; }
    try {
      setSaving(true);
      if (editMode === 'new') {
        await api.post('/api/admin/holiday-templates', form);
      } else {
        await api.put(`/api/admin/holiday-templates/${editMode}`, form);
      }
      setEditMode(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'LÆ°u tháº¥t báº¡i');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: HolidayTemplateDto) => {
    if (!window.confirm(`XÃ³a template "${t.label}"? (soft-delete, cÃ³ thá»ƒ khÃ´i phá»¥c báº±ng toggle Active)`)) return;
    try {
      await api.delete(`/api/admin/holiday-templates/${t.id}`);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'XÃ³a tháº¥t báº¡i');
    }
  };

  return (
    <>
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Kho ngÃ y lá»… (Templates)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Äá»‹nh nghÄ©a lá»… chuáº©n â€” tá»± seed vÃ o ká»³ há»c má»—i nÄƒm náº¿u báº­t "Tá»± seed háº±ng nÄƒm"
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Táº¡o template
        </button>
      </div>

      {/* Toggle includeInactive */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={e => setIncludeInactive(e.target.checked)}
            style={{ accentColor: 'var(--accent-primary)' }}
          />
          <span style={{ fontSize: '0.9rem' }}>Hiá»‡n cáº£ template Ä‘Ã£ xÃ³a (inactive)</span>
        </label>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Äang táº£i...</div>
        ) : list.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            ChÆ°a cÃ³ template nÃ o. Báº¥m "Táº¡o template" Ä‘á»ƒ báº¯t Ä‘áº§u.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>TÃªn lá»…</th>
                  <th>NgÃ y máº·c Ä‘á»‹nh</th>
                  <th>Sá»‘ ngÃ y</th>
                  <th>Tá»± seed háº±ng nÄƒm</th>
                  <th>BÃ¹ lá»‹ch</th>
                  <th>Tráº¡ng thÃ¡i</th>
                  <th style={{ textAlign: 'right' }}>Thao tÃ¡c</th>
                </tr>
              </thead>
              <tbody>
                {list.map(t => (
                  <tr key={t.id} style={{ opacity: t.isActive ? 1 : 0.55 }}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{t.label}</strong>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace' }}>
                        {String(t.defaultStartDay).padStart(2, '0')}/{String(t.defaultStartMonth).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        ({MONTH_VI[t.defaultStartMonth]})
                      </span>
                    </td>
                    <td>{t.defaultDurationDays} ngÃ y</td>
                    <td>
                      {t.isAnnual
                        ? <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={11} /> CÃ³</span>
                        : <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={11} /> KhÃ´ng</span>}
                    </td>
                    <td>
                      <span className={`badge ${t.isCompensated ? 'badge-success' : 'badge-warning'}`}>
                        {t.isCompensated ? 'CÃ³ bÃ¹' : 'KhÃ´ng bÃ¹'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                          onClick={() => openEdit(t)}
                        >
                          <Edit size={13} /> Sá»­a
                        </button>
                        {t.isActive && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
                            onClick={() => handleDelete(t)}
                          >
                            <Trash2 size={13} /> XÃ³a
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>

      {/* Modal create / edit */}
      {editMode !== null && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--modal-overlay-bg)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 560, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <BookmarkPlus size={22} color="var(--accent-primary)" />
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
                {editMode === 'new' ? 'Táº¡o template ngÃ y lá»…' : 'Sá»­a template ngÃ y lá»…'}
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Template lÃ  Ä‘á»‹nh nghÄ©a gá»‘c. Khi gÃ¡n vÃ o ká»³ há»c cá»¥ thá»ƒ, admin cÃ³ thá»ƒ chá»‰nh láº¡i ngÃ y/duration cho phÃ¹ há»£p nÄƒm Ä‘Ã³ mÃ  khÃ´ng áº£nh hÆ°á»Ÿng template.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">TÃªn lá»… <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="text" required className="input-field"
                  placeholder="VD: Táº¿t NguyÃªn ÄÃ¡n, 30/4 - 1/5, Quá»‘c KhÃ¡nh..."
                  value={form.label}
                  onChange={e => setForm({ ...form, label: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">ThÃ¡ng máº·c Ä‘á»‹nh <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select
                    className="input-field"
                    value={form.defaultStartMonth}
                    onChange={e => setForm({ ...form, defaultStartMonth: parseInt(e.target.value, 10) })}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{MONTH_VI[m]}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">NgÃ y máº·c Ä‘á»‹nh <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="number" required min={1} max={31} className="input-field"
                    value={form.defaultStartDay}
                    onChange={e => setForm({ ...form, defaultStartDay: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Sá»‘ ngÃ y nghá»‰ <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="number" required min={1} className="input-field"
                    value={form.defaultDurationDays}
                    onChange={e => setForm({ ...form, defaultDurationDays: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>

              {/* Toggle isAnnual */}
              <div className="input-group" style={{ padding: '0.85rem 1rem', background: 'var(--surface-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={form.isAnnual}
                    onChange={e => setForm({ ...form, isAnnual: e.target.checked })}
                    style={{ accentColor: 'var(--accent-primary)', marginTop: '0.2rem' }}
                  />
                  <span>
                    <strong style={{ fontSize: '0.9rem' }}>Tá»± Ä‘á»™ng seed háº±ng nÄƒm</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Khi táº¡o ká»³ há»c má»›i qua "Generate schedule", lá»… nÃ y sáº½ tá»± Ä‘Æ°á»£c thÃªm vÃ o náº¿u rÆ¡i trong khoáº£ng ká»³ há»c (admin cÃ³ thá»ƒ chá»‰nh ngÃ y láº¡i sau).
                      Táº¯t náº¿u lá»… nÃ y chá»‰ Ã¡p 1 láº§n.
                    </div>
                  </span>
                </label>
              </div>

              {/* Toggle isCompensated */}
              <div className="input-group" style={{ padding: '0.85rem 1rem', background: 'var(--surface-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={form.isCompensated}
                    onChange={e => setForm({ ...form, isCompensated: e.target.checked })}
                    style={{ accentColor: 'var(--accent-primary)', marginTop: '0.2rem' }}
                  />
                  <span>
                    <strong style={{ fontSize: '0.9rem' }}>CÃ³ bÃ¹ lá»‹ch (ká»³ há»c kÃ©o dÃ i thÃªm)</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Náº¿u báº­t, khi gáº¯n vÃ o ká»³ há»c, EndDate ká»³ há»c sáº½ Ä‘Æ°á»£c kÃ©o dÃ i thÃªm sá»‘ ngÃ y nghá»‰. Táº¯t náº¿u cÃ¡c ngÃ y nÃ y coi nhÆ° máº¥t.
                    </div>
                  </span>
                </label>
              </div>

              {error && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditMode(null)} disabled={saving}>
                  Há»§y
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spin" /> Äang lÆ°u...</> : (editMode === 'new' ? 'Táº¡o template' : 'LÆ°u thay Ä‘á»•i')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AdminHolidayTemplates;
```


## File: src\pages\AdminImport.tsx
```typescript

import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import type { ImportStatusDto } from '../types';
import { Upload, Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

const AdminImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<ImportStatusDto | null>(null);
  const pollTimer = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollTimer.current) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  const pollStatus = (id: number) => {
    stopPolling();
    const fetchOnce = async () => {
      try {
        const res = await api.get<ImportStatusDto>(`/api/imports/${id}/status`);
        setStatus(res.data);
        const s = String(res.data.status);
        if (s === 'Success' || s === 'Failed') {
          stopPolling();
        }
      } catch (e) {
        console.error('Poll failed', e);
      }
    };
    fetchOnce();
    pollTimer.current = window.setInterval(fetchOnce, 2000);
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setStatus(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/imports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const id = res.data.importJobId;
      setJobId(id);
      pollStatus(id);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Upload tháº¥t báº¡i');
    } finally {
      setUploading(false);
    }
  };

  const statusLabel = status ? String(status.status) : '';
  const isDone = statusLabel === 'Success' || statusLabel === 'Failed';

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Import Excel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Nháº­p dá»¯ liá»‡u nhÃ³m tá»« file Excel cá»§a há»‡ thá»‘ng cÅ©</p>
        </div>
      </div>

      <div className="glass-card" style={{ maxWidth: 700 }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Upload size={20} /> Upload file
        </h3>

        <div className="input-group">
          <label className="input-label">Chá»n file Excel (.xlsx, tá»‘i Ä‘a 10MB)</label>
          <input
            type="file"
            className="input-field"
            accept=".xlsx,.xls"
            onChange={e => setFile(e.target.files?.[0] || null)}
            style={{ padding: '0.5rem' }}
            disabled={uploading || (jobId !== null && !isDone)}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ marginTop: '1rem', width: '100%' }}
          onClick={handleImport}
          disabled={!file || uploading || (jobId !== null && !isDone)}
        >
          {uploading ? <><Loader2 size={16} className="spin" /> Äang upload...</> : <><Upload size={16} /> Báº¯t Ä‘áº§u Import</>}
        </button>

        <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Import xá»­ lÃ½ Ä‘á»“ng bá»™. Status sáº½ Completed/Failed ngay láº§n poll Ä‘áº§u.
        </p>

        <button
          className="btn btn-secondary"
          style={{ marginTop: '0.5rem', width: '100%' }}
          onClick={async () => {
            if (!window.confirm('XÃ³a toÃ n bá»™ ImportJob? (dev only)')) return;
            try {
              const res = await api.post('/api/imports/reset');
              alert(`ÄÃ£ xÃ³a ${res.data.removed} job. CÃ³ thá»ƒ import láº¡i.`);
              setStatus(null);
              setJobId(null);
            } catch (e: any) {
              alert(e?.response?.data?.message || 'Reset tháº¥t báº¡i');
            }
          }}
        >
          <RotateCcw size={14} /> Reset import jobs (dev)
        </button>
      </div>

      {jobId !== null && (
        <div className="glass-card" style={{ marginTop: '2rem', maxWidth: 700 }}>
          <h3 style={{ marginBottom: '1rem' }}>Tráº¡ng thÃ¡i Job #{jobId}</h3>

          {!status ? (
            <p style={{ color: 'var(--text-secondary)' }}>Äang Ä‘á»£i káº¿t quáº£...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>Tráº¡ng thÃ¡i:</strong>
                {statusLabel === 'Success' && <CheckCircle size={18} color="lightgreen" />}
                {statusLabel === 'Failed' && <XCircle size={18} color="salmon" />}
                {!isDone && <Loader2 size={18} className="spin" />}
                <span className={`badge ${statusLabel === 'Success' ? 'badge-success' : statusLabel === 'Failed' ? 'badge-warning' : ''}`}>
                  {statusLabel}
                </span>
              </div>

              {status.groupsCreated != null && (
                <div><strong>Sá»‘ nhÃ³m táº¡o:</strong> {status.groupsCreated}</div>
              )}
              {status.usersCreated != null && (
                <div><strong>Sá»‘ user táº¡o:</strong> {status.usersCreated}</div>
              )}
              {status.completedAt && (
                <div><strong>HoÃ n táº¥t lÃºc:</strong> {new Date(status.completedAt).toLocaleString('vi-VN')}</div>
              )}
              {status.errorReport && (
                <div>
                  <strong>BÃ¡o lá»—i:</strong>
                  <pre style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '1rem',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    color: 'var(--danger)',
                    whiteSpace: 'pre-wrap',
                    marginTop: '0.5rem'
                  }}>{status.errorReport}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default AdminImport;
```


## File: src\pages\AdminLecturers.tsx
```typescript

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import type { LecturerListItemDto, ImportLecturersResultDto } from '../types';
import { Search, Upload, Edit, ChevronLeft, ChevronRight, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const AdminLecturers = () => {
  const [lecturers, setLecturers] = useState<LecturerListItemDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit Modal State
  const [editingLecturer, setEditingLecturer] = useState<LecturerListItemDto | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', code: '' });
  const [saving, setSaving] = useState(false);

  // Import Result State
  const [importResult, setImportResult] = useState<ImportLecturersResultDto | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page: 1, pageSize: 1000 };
      if (search) params.search = search;
      const res = await api.get<LecturerListItemDto[]>('/api/admin/lecturers', { params });
      setLecturers(res.data);
    } catch (e) {
      console.error('Load lecturers failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      setImportResult(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<ImportLecturersResultDto>('/api/admin/lecturers/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Upload tháº¥t báº¡i');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEditClick = (lec: LecturerListItemDto) => {
    setEditingLecturer(lec);
    setEditForm({
      fullName: lec.fullName || '',
      email: lec.email || '',
      code: lec.code || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecturer) return;
    try {
      setSaving(true);
      await api.put(`/api/admin/lecturers/${editingLecturer.id}`, editForm);
      setEditingLecturer(null);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'LÆ°u tháº¥t báº¡i');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(lecturers.length / itemsPerPage);
  const displayedLecturers = lecturers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Quáº£n lÃ½ Giáº£ng viÃªn</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Danh sÃ¡ch giáº£ng viÃªn hÆ°á»›ng dáº«n (GVHD)</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
          {importing ? 'Äang Import...' : 'Import Excel'}
        </button>
        <input 
          type="file" 
          accept=".xlsx,.xls" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImport}
        />
      </div>

      {importResult && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={20} color="var(--success)" />
            <h3 style={{ margin: 0 }}>Káº¿t quáº£ Import</h3>
          </div>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <span><strong>Táº¡o má»›i:</strong> {importResult.created}</span>
            <span><strong>Cáº­p nháº­t:</strong> {importResult.updated}</span>
            <span><strong>Bá» qua:</strong> {importResult.skipped}</span>
          </div>
          {importResult.errors && importResult.errors.length > 0 && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                <AlertTriangle size={16} />
                <strong>Cáº£nh bÃ¡o / Lá»—i ({importResult.errors.length}):</strong>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>DÃ²ng {err.rowNumber}: {err.reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setImportResult(null)}>
            ÄÃ³ng
          </button>
        </div>
      )}

      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" className="input-field" placeholder="TÃ¬m theo email, tÃªn hoáº·c mÃ£ tÃªn..."
              style={{ paddingLeft: '2.5rem' }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Äang táº£i...</div>
        ) : lecturers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>KhÃ´ng cÃ³ giáº£ng viÃªn nÃ o.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Há» tÃªn</th>
                    <th>MÃ£ tÃªn</th>
                    <th>Email</th>
                    <th>Tráº¡ng thÃ¡i User</th>
                    <th style={{ textAlign: 'right' }}>Thao tÃ¡c</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLecturers.map(l => (
                    <tr key={l.id}>
                      <td>{l.id}</td>
                      <td>{l.fullName}</td>
                      <td>
                        {l.code ? <span className="badge badge-success">{l.code}</span> : <span className="badge badge-warning">ChÆ°a cÃ³</span>}
                      </td>
                      <td>{l.email}</td>
                      <td>
                        <span className={`badge ${l.isActive ? 'badge-success' : 'badge-warning'}`}>
                          {l.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleEditClick(l)}
                        >
                          <Edit size={14} /> Sá»­a
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass)', background: 'var(--surface-glass)', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiá»ƒn thá»‹ <strong>{Math.min(lecturers.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(lecturers.length, currentPage * itemsPerPage)}</strong> trong tá»•ng sá»‘ <strong>{lecturers.length}</strong> káº¿t quáº£
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button key={page} onClick={() => setCurrentPage(page)} className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.75rem', minWidth: '32px', background: currentPage === page ? 'var(--accent-primary)' : 'transparent', border: currentPage === page ? 'none' : '1px solid var(--border-glass)', color: currentPage === page ? 'white' : 'var(--text-primary)' }}>
                          {page}
                        </button>
                      );
                    }
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} style={{ color: 'var(--text-secondary)' }}>...</span>;
                    }
                    return null;
                  })}
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
    {editingLecturer && createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'var(--modal-overlay-bg)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}>
        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 500, padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Sá»­a thÃ´ng tin GVHD</h2>
          <form onSubmit={handleSaveEdit}>
            <div className="input-group">
              <label className="input-label">Há» tÃªn</label>
              <input required type="text" className="input-field" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input required type="email" className="input-field" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">MÃ£ tÃªn</label>
              <input type="text" className="input-field" value={editForm.code} onChange={e => setEditForm({...editForm, code: e.target.value})} placeholder="VD: HungNN" />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingLecturer(null)} disabled={saving}>Há»§y</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><Loader2 size={16} className="spin" /> Äang lÆ°u...</> : 'LÆ°u thay Ä‘á»•i'}
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default AdminLecturers;
```


## File: src\pages\AdminReviewers.tsx
```typescript

import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import type { LecturerListItemDto, ReviewerDto } from '../types';
import { Search, Loader2, Check, ChevronLeft, ChevronRight, UserCheck, AlertCircle } from 'lucide-react';

// Admin pick lecturer lÃ m reviewer â€” GLOBAL (mutate User.Role |= Reviewer).
// Auto-reset khi 1 semester chuyá»ƒn Ongoing â†’ Completed/Cancelled.
type RowState = 'none' | 'saved' | 'newPick' | 'pendingRemove';

const AdminReviewers = () => {
  const [lecturers, setLecturers] = useState<LecturerListItemDto[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [originalPicked, setOriginalPicked] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [loadingLecturers, setLoadingLecturers] = useState(false);
  const [loadingPicked, setLoadingPicked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    (async () => {
      try {
        setLoadingLecturers(true);
        const res = await api.get<LecturerListItemDto[]>('/api/admin/lecturers', { params: { page: 1, pageSize: 1000 } });
        setLecturers(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c danh sÃ¡ch giáº£ng viÃªn');
      } finally {
        setLoadingLecturers(false);
      }
    })();

    (async () => {
      try {
        setLoadingPicked(true);
        const res = await api.get<ReviewerDto[]>('/api/admin/reviews/reviewers');
        const ids = new Set(res.data.map((r) => r.lecturerId));
        setPicked(ids);
        setOriginalPicked(new Set(ids));
      } catch (e: any) {
        setError(e?.response?.data?.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c danh sÃ¡ch reviewer');
      } finally {
        setLoadingPicked(false);
      }
    })();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const filtered = useMemo(() => {
    if (!search.trim()) return lecturers;
    const s = search.toLowerCase().trim();
    return lecturers.filter(
      (l) =>
        l.fullName.toLowerCase().includes(s) ||
        l.email.toLowerCase().includes(s) ||
        (l.code ?? '').toLowerCase().includes(s)
    );
  }, [lecturers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const rowState = (id: number): RowState => {
    const isPicked = picked.has(id);
    const wasSaved = originalPicked.has(id);
    if (wasSaved && isPicked) return 'saved';
    if (!wasSaved && isPicked) return 'newPick';
    if (wasSaved && !isPicked) return 'pendingRemove';
    return 'none';
  };

  const counts = useMemo(() => {
    let saved = 0, newPick = 0, pendingRemove = 0;
    for (const l of lecturers) {
      const st = rowState(l.id);
      if (st === 'saved') saved++;
      else if (st === 'newPick') newPick++;
      else if (st === 'pendingRemove') pendingRemove++;
    }
    return { saved, newPick, pendingRemove };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecturers, picked, originalPicked]);

  const isDirty = counts.newPick > 0 || counts.pendingRemove > 0;

  const toggle = (id: number) => {
    if (saving) return;
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  const save = async () => {
    if (!isDirty || saving) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      await api.put('/api/admin/reviews/reviewers', { lecturerIds: Array.from(picked) });
      setOriginalPicked(new Set(picked));
      setSuccessMsg(`ÄÃ£ lÆ°u thÃªm ${counts.newPick}, gá»¡ ${counts.pendingRemove} reviewer.`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'KhÃ´ng lÆ°u Ä‘Æ°á»£c danh sÃ¡ch reviewer');
    } finally {
      setSaving(false);
    }
  };

  const rowStyle = (state: RowState): React.CSSProperties => {
    if (state === 'saved') return { background: 'rgba(16, 185, 129, 0.10)' };           // xanh lÃ¡
    if (state === 'newPick') return { background: 'rgba(14, 165, 233, 0.12)' };          // xanh nÆ°á»›c
    if (state === 'pendingRemove') return { background: 'rgba(239, 68, 68, 0.10)' };     // Ä‘á»
    return {};
  };

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck size={26} color="var(--accent-primary)" /> Chá»n reviewer
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Tick GV Ä‘Æ°á»£c phÃ©p Ä‘Äƒng kÃ½ slot review. LÆ°u xong, GV cáº§n Ä‘Äƒng nháº­p láº¡i Ä‘á»ƒ tháº¥y má»¥c Ä‘Äƒng kÃ½.
            Khi 1 ká»³ káº¿t thÃºc, cá» Reviewer tá»± gá»¡.
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!isDirty || saving}
          onClick={save}
        >
          {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
          {' '}LÆ°u thay Ä‘á»•i
        </button>
      </div>

      {error && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} color="var(--danger)" /> <span style={{ color: 'var(--danger)' }}>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={18} color="#10b981" /> <span style={{ color: '#10b981' }}>{successMsg}</span>
        </div>
      )}

      {/* Search + counter */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: 220 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="TÃ¬m theo email, tÃªn hoáº·c mÃ£ GV..."
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#43ffc0', borderRadius: 2, verticalAlign: 'middle', marginRight: 6 }} /> ÄÃ£ lÆ°u <b>{counts.saved}</b></span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#4cc6ff', borderRadius: 2, verticalAlign: 'middle', marginRight: 6 }} /> Má»›i tick <b>{counts.newPick}</b></span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', borderRadius: 2, verticalAlign: 'middle', marginRight: 6 }} /> ÄÃ¡nh dáº¥u gá»¡ <b>{counts.pendingRemove}</b></span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loadingLecturers || loadingPicked ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Äang táº£i...</div>
        ) : lecturers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>KhÃ´ng cÃ³ giáº£ng viÃªn nÃ o.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 50, textAlign: 'center' }}></th>
                    <th>ID</th>
                    <th>Há» tÃªn</th>
                    <th>MÃ£ tÃªn</th>
                    <th>Email</th>
                    <th>Tráº¡ng thÃ¡i</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((l) => {
                    const state = rowState(l.id);
                    const checked = picked.has(l.id);
                    return (
                      <tr
                        key={l.id}
                        onClick={() => toggle(l.id)}
                        style={{ cursor: saving ? 'wait' : 'pointer', ...rowStyle(state) }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(l.id)}
                            disabled={saving}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td>{l.id}</td>
                        <td style={{ fontWeight: state === 'saved' || state === 'newPick' ? 600 : 400 }}>{l.fullName}</td>
                        <td>
                          {l.code ? <span className="badge badge-success">{l.code}</span> : <span className="badge badge-warning">ChÆ°a cÃ³</span>}
                        </td>
                        <td>{l.email}</td>
                        <td>
                          {state === 'saved' && <span className="badge badge-success">Reviewer</span>}
                          {state === 'newPick' && <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>Adding</span>}
                          {state === 'pendingRemove' && <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>Removing</span>}
                          {state === 'none' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>â€”</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {displayed.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        KhÃ´ng cÃ³ giáº£ng viÃªn nÃ o khá»›p.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass)', background: 'var(--surface-glass)', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiá»ƒn thá»‹ <strong>{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)}</strong> / <strong>{filtered.length}</strong>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === 1 ? 0.5 : 1 }}>
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            padding: '0.4rem 0.75rem',
                            minWidth: 32,
                            background: currentPage === page ? 'var(--accent-primary)' : 'transparent',
                            border: currentPage === page ? 'none' : '1px solid var(--border-glass)',
                            color: currentPage === page ? 'white' : 'var(--text-primary)',
                          }}
                        >
                          {page}
                        </button>
                      );
                    }
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} style={{ color: 'var(--text-secondary)' }}>...</span>;
                    }
                    return null;
                  })}
                  <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default AdminReviewers;
```


## File: src\pages\AdminScheduling.tsx
```typescript

import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import type {
  ReviewDto,
  ReviewScheduleAssignmentDto,
  SchedulingResultSummary,
  SchedulingStatusDto,
} from '../types';
import {
  CalendarCheck,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  RotateCcw,
} from 'lucide-react';

// Trang Admin cháº¡y thuáº­t toÃ¡n xáº¿p lá»‹ch review (async + polling) vÃ  xem káº¿t quáº£.
//   - Chá»n Ä‘á»£t review (chá»‰ cháº¡y Ä‘Æ°á»£c khi status = Registered)
//   - Báº¥m "Cháº¡y xáº¿p lá»‹ch" â†’ POST scheduling â†’ polling job tá»›i Completed/Failed
//   - Náº¿u Ä‘á»£t Ä‘Ã£ cháº¡y â†’ BE tráº£ 409, hiá»‡n nÃºt "Xáº¿p láº¡i (force)"
//   - Khi xong: parse resultJson (sá»‘ nhÃ³m xáº¿p Ä‘Æ°á»£c, nhÃ³m chÆ°a xáº¿p, reviewer thiáº¿u slot)
//     vÃ  táº£i danh sÃ¡ch assignment Ä‘á»ƒ hiá»ƒn thá»‹ theo tá»«ng slot.

const parseDateInfo = (iso: string) => {
  const d = new Date(iso);
  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getUTCDay()];
  const dateStr = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
  return { dow, dateStr };
};

// Slot gom cÃ¡c assignment cÃ¹ng slot láº¡i (council 2 reviewer cá»‘ Ä‘á»‹nh + tá»‘i Ä‘a 3 nhÃ³m)
interface SlotGroup {
  slotId: number;
  slotDate: string;
  slotIndex: number;
  lecturer1Name: string;
  lecturer2Name: string | null;
  groups: ReviewScheduleAssignmentDto[];
}

const AdminScheduling = () => {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [running, setRunning] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<SchedulingStatusDto | null>(null);
  const [assignments, setAssignments] = useState<ReviewScheduleAssignmentDto[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRan, setAlreadyRan] = useState(false); // BE tráº£ 409 SCHEDULING_ALREADY_RAN

  const pollTimer = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollTimer.current) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  // Táº£i danh sÃ¡ch Ä‘á»£t review, Æ°u tiÃªn chá»n Ä‘á»£t Registered (má»›i cháº¡y xáº¿p lá»‹ch Ä‘Æ°á»£c).
  useEffect(() => {
    (async () => {
      try {
        setLoadingReviews(true);
        const res = await api.get<ReviewDto[]>('/api/admin/reviews/all');
        setReviews(res.data);
        if (res.data.length > 0) {
          const order = (s: string) =>
            s === 'Registered' ? 0 : s === 'Ongoing' ? 1 : s === 'Registering' ? 2 : 3;
          const sorted = [...res.data].sort((a, b) => {
            const d = order(a.status) - order(b.status);
            if (d !== 0) return d;
            return new Date(b.windowStart).getTime() - new Date(a.windowStart).getTime();
          });
          setReviewId(sorted[0].id);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c danh sÃ¡ch Ä‘á»£t review');
      } finally {
        setLoadingReviews(false);
      }
    })();
  }, []);

  const currentReview = useMemo(
    () => reviews.find((r) => r.id === reviewId) ?? null,
    [reviews, reviewId],
  );
  const canSchedule = currentReview?.status === 'Registered';

  const fetchAssignments = async (rid: number) => {
    try {
      setLoadingAssignments(true);
      const res = await api.get<ReviewScheduleAssignmentDto[]>(`/api/admin/reviews/${rid}/assignments`);
      setAssignments(res.data);
    } catch {
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Äá»•i Ä‘á»£t review â†’ reset tráº¡ng thÃ¡i job, táº£i káº¿t quáº£ Ä‘Ã£ cÃ³ (náº¿u Ä‘á»£t tá»«ng cháº¡y).
  useEffect(() => {
    stopPolling();
    setJobId(null);
    setStatus(null);
    setError(null);
    setAlreadyRan(false);
    setAssignments([]);
    if (reviewId != null) fetchAssignments(reviewId);
  }, [reviewId]);

  const pollStatus = (id: number) => {
    stopPolling();
    const fetchOnce = async () => {
      try {
        const res = await api.get<SchedulingStatusDto>(`/api/admin/reviews/scheduling/${id}`);
        setStatus(res.data);
        if (res.data.status === 'Completed' || res.data.status === 'Failed') {
          stopPolling();
          setRunning(false);
          if (res.data.status === 'Completed' && reviewId != null) {
            fetchAssignments(reviewId);
          }
        }
      } catch (e) {
        console.error('Poll scheduling failed', e);
      }
    };
    fetchOnce();
    pollTimer.current = window.setInterval(fetchOnce, 2000);
  };

  const runScheduling = async (force: boolean) => {
    if (reviewId == null) return;
    try {
      setRunning(true);
      setError(null);
      setAlreadyRan(false);
      setStatus(null);
      const res = await api.post(`/api/admin/reviews/${reviewId}/scheduling`, null, {
        params: { force },
      });
      const id = res.data.schedulingJobId;
      setJobId(id);
      pollStatus(id);
    } catch (e: any) {
      setRunning(false);
      const code = e?.response?.data?.errorCode || e?.response?.data?.code;
      const msg = e?.response?.data?.message || 'Cháº¡y xáº¿p lá»‹ch tháº¥t báº¡i';
      // BE cháº·n náº¿u Ä‘á»£t Ä‘Ã£ cháº¡y (409) â€” cho phÃ©p xáº¿p láº¡i báº±ng force.
      if (e?.response?.status === 409 && (code === 'SCHEDULING_ALREADY_RAN' || /Ä‘Ã£ cháº¡y/i.test(msg))) {
        setAlreadyRan(true);
      }
      setError(msg);
    }
  };

  // Parse resultJson an toÃ n (há»— trá»£ cáº£ Pascal/camelCase cho record con).
  const summary = useMemo<SchedulingResultSummary | null>(() => {
    if (!status?.resultJson) return null;
    try {
      const raw = JSON.parse(status.resultJson);
      const unassigned = (raw.unassignedGroups || raw.UnassignedGroups || []).map((u: any) => ({
        GroupId: u.GroupId ?? u.groupId,
        Reason: u.Reason ?? u.reason,
      }));
      const underQuota = (raw.underQuotaReviewers || raw.UnderQuotaReviewers || []).map((u: any) => ({
        LecturerId: u.LecturerId ?? u.lecturerId,
        SlotCount: u.SlotCount ?? u.slotCount,
      }));
      return {
        assigned: raw.assigned ?? raw.Assigned ?? 0,
        groupsScheduled: raw.groupsScheduled ?? raw.GroupsScheduled ?? 0,
        unassignedGroups: unassigned,
        underQuotaReviewers: underQuota,
        force: raw.force ?? raw.Force ?? false,
      };
    } catch {
      return null;
    }
  }, [status]);

  // Gom assignment theo slot Ä‘á»ƒ hiá»ƒn thá»‹ má»—i slot 1 tháº» (council + cÃ¡c nhÃ³m).
  const slotGroups = useMemo<SlotGroup[]>(() => {
    const map = new Map<number, SlotGroup>();
    for (const a of assignments) {
      let g = map.get(a.slotId);
      if (!g) {
        g = {
          slotId: a.slotId,
          slotDate: a.slotDate,
          slotIndex: a.slotIndex,
          lecturer1Name: a.lecturer1Name,
          lecturer2Name: a.lecturer2Name,
          groups: [],
        };
        map.set(a.slotId, g);
      }
      g.groups.push(a);
    }
    return Array.from(map.values()).sort((x, y) => {
      const d = new Date(x.slotDate).getTime() - new Date(y.slotDate).getTime();
      if (d !== 0) return d;
      return x.slotIndex - y.slotIndex;
    });
  }, [assignments]);

  const jobStatus = status?.status;
  const isProcessing = jobStatus === 'Pending' || jobStatus === 'Processing';

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <CalendarCheck size={28} color="var(--accent-primary)" />
        <h1 className="text-gradient" style={{ margin: 0 }}>Xáº¿p lá»‹ch review</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Tá»± Ä‘á»™ng xáº¿p má»—i nhÃ³m vÃ o 1 slot cÃ³ há»™i Ä‘á»“ng 2 reviewer há»£p lá»‡, cÃ¢n báº±ng táº£i reviewer.
      </p>

      {/* Bá»™ chá»n Ä‘á»£t + nÃºt cháº¡y */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 320px', minWidth: 260 }}>
          <CalendarCheck size={16} color="var(--accent-primary)" />
          <label htmlFor="review-select" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Äá»£t review:
          </label>
          {loadingReviews ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <select
              id="review-select"
              value={reviewId ?? ''}
              onChange={(e) => setReviewId(e.target.value ? parseInt(e.target.value, 10) : null)}
              disabled={running || isProcessing}
              style={{
                flex: 1,
                padding: '0.45rem 0.7rem',
                borderRadius: 6,
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-glass)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              {reviews.length === 0 && <option value="">â€” ChÆ°a cÃ³ Ä‘á»£t review nÃ o â€”</option>}
              {reviews.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} ({r.type}#{r.orderIndex}) â€” {r.status}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          className="btn btn-primary"
          disabled={reviewId == null || !canSchedule || running || isProcessing}
          onClick={() => runScheduling(false)}
          style={{ padding: '0.5rem 1.1rem' }}
        >
          {running || isProcessing ? <Loader2 size={16} className="spin" /> : <CalendarCheck size={16} />}
          {' '}Cháº¡y xáº¿p lá»‹ch
        </button>
      </div>

      {/* Cáº£nh bÃ¡o tráº¡ng thÃ¡i review khÃ´ng pháº£i Registered */}
      {currentReview && !canSchedule && (
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: 'var(--danger)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={18} />
          Chá»‰ cháº¡y xáº¿p lá»‹ch khi Ä‘á»£t review á»Ÿ tráº¡ng thÃ¡i <b>Registered</b> (Ä‘Ã£ chá»‘t Ä‘Äƒng kÃ½). Hiá»‡n táº¡i: {currentReview.status}.
        </div>
      )}

      {/* Lá»—i + nÃºt force khi Ä‘Ã£ cháº¡y rá»“i */}
      {error && (
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
            whiteSpace: 'pre-wrap',
          }}
        >
          <AlertCircle size={18} /> {error}
          {alreadyRan && (
            <button
              className="btn btn-secondary"
              onClick={() => runScheduling(true)}
              disabled={running || isProcessing}
              style={{ marginLeft: 'auto', padding: '0.4rem 0.9rem' }}
            >
              <RotateCcw size={14} /> Xáº¿p láº¡i (xoÃ¡ káº¿t quáº£ cÅ©)
            </button>
          )}
        </div>
      )}

      {/* Tráº¡ng thÃ¡i job Ä‘ang cháº¡y */}
      {jobId !== null && (
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <strong>Job #{jobId}:</strong>
            {jobStatus === 'Completed' && <CheckCircle size={18} color="#10b981" />}
            {jobStatus === 'Failed' && <XCircle size={18} color="#ef4444" />}
            {isProcessing && <Loader2 size={18} className="spin" />}
            <span
              className={`badge ${jobStatus === 'Completed' ? 'badge-success' : jobStatus === 'Failed' ? 'badge-warning' : ''}`}
            >
              {jobStatus === 'Pending' ? 'Äang chá»' :
                jobStatus === 'Processing' ? 'Äang xá»­ lÃ½' :
                jobStatus === 'Completed' ? 'HoÃ n táº¥t' :
                jobStatus === 'Failed' ? 'Tháº¥t báº¡i' : '...'}
            </span>
            {status?.force && <span className="badge" style={{ background: 'rgba(251, 146, 60, 0.12)', color: 'var(--accent-primary)' }}>force</span>}
          </div>

          {status?.error && (
            <pre
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '0.75rem',
                borderRadius: 8,
                fontSize: '0.8rem',
                color: 'var(--danger)',
                whiteSpace: 'pre-wrap',
                marginTop: '0.75rem',
              }}
            >
              {status.error}
            </pre>
          )}

          {/* TÃ³m táº¯t káº¿t quáº£ */}
          {summary && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div className="badge badge-success" style={{ padding: '0.35rem 0.7rem' }}>
                  {summary.groupsScheduled} nhÃ³m Ä‘Æ°á»£c xáº¿p ({summary.assigned} assignment)
                </div>
                {summary.unassignedGroups.length > 0 && (
                  <div className="badge badge-warning" style={{ padding: '0.35rem 0.7rem' }}>
                    {summary.unassignedGroups.length} nhÃ³m chÆ°a xáº¿p Ä‘Æ°á»£c
                  </div>
                )}
                {summary.underQuotaReviewers.length > 0 && (
                  <div className="badge" style={{ padding: '0.35rem 0.7rem', background: 'rgba(251, 146, 60, 0.12)', color: 'var(--accent-primary)' }}>
                    {summary.underQuotaReviewers.length} reviewer thiáº¿u slot (&lt;3)
                  </div>
                )}
              </div>

              {summary.unassignedGroups.length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.875rem' }}>NhÃ³m chÆ°a xáº¿p Ä‘Æ°á»£c:</strong>
                  <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {summary.unassignedGroups.map((u) => (
                      <li key={u.GroupId}>NhÃ³m #{u.GroupId} â€” {u.Reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.underQuotaReviewers.length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.875rem' }}>Reviewer thiáº¿u slot (&lt;3):</strong>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {summary.underQuotaReviewers
                      .map((u) => `Lecturer #${u.LecturerId} (${u.SlotCount} slot)`)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Káº¿t quáº£ assignment theo slot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>Káº¿t quáº£ xáº¿p lá»‹ch</h3>
        {loadingAssignments && <Loader2 size={16} className="spin" />}
      </div>

      {!loadingAssignments && slotGroups.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          {reviewId == null ? 'Chá»n 1 Ä‘á»£t review.' : 'Äá»£t nÃ y chÆ°a cÃ³ káº¿t quáº£ xáº¿p lá»‹ch.'}
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {slotGroups.map((s) => {
            const info = parseDateInfo(s.slotDate);
            return (
              <div key={s.slotId} className="glass-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {info.dow} {info.dateStr} Â· Slot {s.slotIndex}
                  </strong>
                  <span className="badge" style={{ background: 'rgba(251, 146, 60, 0.12)', color: 'var(--accent-primary)' }}>
                    {s.groups.length}/3 nhÃ³m
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                    fontSize: '0.825rem',
                    color: 'var(--text-secondary)',
                    paddingBottom: '0.6rem',
                    marginBottom: '0.6rem',
                    borderBottom: '1px solid var(--border-glass)',
                  }}
                >
                  <Users size={15} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>
                    Há»™i Ä‘á»“ng: <b style={{ color: 'var(--text-primary)' }}>{s.lecturer1Name}</b>
                    {s.lecturer2Name ? <> &amp; <b style={{ color: 'var(--text-primary)' }}>{s.lecturer2Name}</b></> : ' (thiáº¿u reviewer 2)'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {s.groups
                    .slice()
                    .sort((a, b) => a.sessionIndex - b.sessionIndex)
                    .map((a) => (
                      <div
                        key={a.assignmentId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: '0.85rem',
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {a.sessionIndex}
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.groupCode}</span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default AdminScheduling;
```


## File: src\pages\AdminSemesters.tsx
```typescript

import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import type {
  SemesterListItemDto,
  SemesterDetailDto,
  SemesterHolidayDto,
  SemesterStatus,
  SemesterSeason,
  LinkGroupsResultDto,
  SemesterMilestoneDto,
  HolidayCascadeResultDto,
  MilestoneType,
  ReviewStatus,
} from '../types';
import { Calendar, Filter, Users, Clock, AlertCircle, Plus, Loader2, RefreshCw, ChevronDown, X, Link2, ChevronLeft, ChevronRight } from 'lucide-react';

// Map ReviewStatus â†’ label + style (inline Ä‘á»ƒ cÃ³ hatched pattern cho Registered + gray cho Draft)
const REVIEW_STATUS_META: Record<ReviewStatus, { label: string; style: React.CSSProperties }> = {
  Draft: {
    label: 'ChÆ°a Ä‘Äƒng kÃ½ Ä‘Æ°á»£c',
    style: { background: 'rgba(148, 163, 184, 0.15)', color: '#64748b', border: '1px solid rgba(148, 163, 184, 0.3)' },
  },
  Registering: {
    label: 'Äang Ä‘Äƒng kÃ½',
    style: { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.35)' },
  },
  Registered: {
    label: 'ÄÃ£ chá»‘t slot',
    // Xanh dÆ°Æ¡ng + hatched diagonal bÃªn trong (Ä‘á»¥c) Ä‘á»ƒ phÃ¢n biá»‡t vá»›i Registering
    style: {
      background: 'repeating-linear-gradient(45deg, rgba(59,130,246,0.22) 0px, rgba(59,130,246,0.22) 4px, rgba(59,130,246,0.05) 4px, rgba(59,130,246,0.05) 8px)',
      color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.4)',
    },
  },
  Ongoing: {
    label: 'Äang diá»…n ra',
    style: { background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)' },
  },
  Finished: {
    label: 'ÄÃ£ xong',
    style: { background: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04', border: '1px solid rgba(234, 179, 8, 0.3)' },
  },
  Cancelled: {
    label: 'ÄÃ£ há»§y',
    style: { background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)' },
  },
};

// Map enum â†’ label tiáº¿ng Viá»‡t + mÃ u badge

const STATUS_META: Record<SemesterStatus, { label: string; badge: string }> = {
  Pending:   { label: 'Sáº¯p diá»…n ra', badge: 'badge-warning' },
  Ongoing:   { label: 'Äang diá»…n ra', badge: 'badge-info' },
  Completed: { label: 'ÄÃ£ káº¿t thÃºc', badge: 'badge-success' },
  Cancelled: { label: 'ÄÃ£ há»§y',     badge: 'badge-danger' },
};

const SEASON_LABEL: Record<string, string> = {
  Spring: 'Há»c ká»³ XuÃ¢n',
  Summer: 'Há»c ká»³ HÃ¨',
  Fall:   'Há»c ká»³ Thu',
};

// Format date dd/MM/yyyy gá»n
const fmt = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Format ngáº¯n dd/MM cho tick tuáº§n trÃªn timeline
const fmtShort = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

// TÃ­nh sá»‘ ngÃ y giá»¯a 2 má»‘c (inclusive á»Ÿ startDate)
const daysBetween = (a: string, b: string) =>
  Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

// Gá»£i Ã½ má»‘c start/end theo quy Æ°á»›c:
//   Spring báº¯t Ä‘áº§u 01/01 cá»§a nÄƒm â€” Summer = Spring + 16w â€” Fall = Summer + 16w
//   Má»—i ká»³ kÃ©o dÃ i Ä‘Ãºng 16 tuáº§n (112 ngÃ y)
const WEEKS_PER_SEMESTER = 16;
const SEASON_INDEX: Record<SemesterSeason, number> = { Spring: 0, Summer: 1, Fall: 2 };

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

// TÃ­nh ngÃ y káº¿t thÃºc cho window dÃ i `days` ngÃ y (INCLUSIVE: end = start + days - 1).
// Náº¿u káº¿t quáº£ rÆ¡i vÃ o Chá»§ Nháº­t â†’ lÃ¹i vá» Thá»© 7 (bá» ngÃ y CN, khÃ´ng dá»i sang Thá»© 2).
// VD: start = Thá»© 2 (25/5), days=7 â†’ 25+6=31/5 (CN) â†’ lÃ¹i vá» 30/5 (Thá»© 7).
const addWorkingDaysISO = (iso: string, days: number): string => {
  if (!iso) return iso;                          // guard: empty input â†’ giá»¯ rá»—ng (caller pháº£i check)
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d.getTime())) return iso;            // guard: invalid date â†’ bypass
  d.setUTCDate(d.getUTCDate() + days - 1);       // inclusive: window dÃ i `days` ngÃ y
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() - 1);  // CN â†’ Thá»© 7
  return d.toISOString().slice(0, 10);
};

// Cá»™ng/trá»« N ngÃ y dÃ¹ng JS Date â€” tá»± rollover sang thÃ¡ng/nÄƒm káº¿ (xá»­ lÃ½ Ä‘Ãºng 30-day months + Feb nhuáº­n).
// VD: 30/6 + 1 = 1/7 (khÃ´ng bá»‹ káº¹t á»Ÿ 31/6 invalid); 28/2/2027 + 1 = 1/3 (2027 khÃ´ng nhuáº­n).
const shiftDateISO = (iso: string, delta: number): string => {
  if (!iso) return iso;
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d.getTime())) return iso;
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

// Validate ISO date trong khoáº£ng nÄƒm há»£p lÃ½ â€” cháº·n Chrome bug:
// khi spinner year Ä‘áº©y xuá»‘ng dÆ°á»›i `min` attribute, Chrome cÃ³ thá»ƒ wrap vá» year max cá»§a JS Date (275760).
// CÅ©ng cháº·n nÄƒm < 1900 (gÃµ tay 2 chá»¯ sá»‘ cháº³ng háº¡n).
const isReasonableDateISO = (iso: string): boolean => {
  if (!iso) return false;
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d.getTime())) return false;
  const y = d.getUTCFullYear();
  return y >= 1900 && y <= 2200;
};

// Map review status â†’ config nÃºt chuyá»ƒn tráº¡ng thÃ¡i tiáº¿p theo.
const REVIEW_NEXT_STATUS: Partial<Record<ReviewStatus, { next: ReviewStatus; label: string; title: string }>> = {
  Draft:       { next: 'Registering', label: 'Báº¯t Ä‘áº§u',    title: 'Má»Ÿ Ä‘Äƒng kÃ½ â€” chuyá»ƒn sang Registering' },
  Registering: { next: 'Registered',  label: 'Chá»‘t slot',   title: 'Chá»‘t Ä‘Äƒng kÃ½ â€” chuyá»ƒn sang Registered' },
  Registered:  { next: 'Ongoing',     label: 'Má»Ÿ review',   title: 'Báº¯t Ä‘áº§u cháº¥m â€” chuyá»ƒn sang Ongoing' },
  Ongoing:     { next: 'Finished',    label: 'Káº¿t thÃºc',    title: 'Káº¿t thÃºc Ä‘á»£t review â€” chuyá»ƒn sang Finished' },
};

// Quy táº¯c derive status tá»« ngÃ y: Cancelled giá»¯ nguyÃªn â€” cÃ²n láº¡i auto theo today UTC
const deriveStatus = (
  current: SemesterStatus,
  startDate: string,
  endDate: string,
  today = new Date()
): SemesterStatus => {
  if (current === 'Cancelled') return 'Cancelled';
  const t = today.getTime();
  const s = new Date(startDate).getTime();
  const e = new Date(endDate).getTime();
  if (t > e) return 'Completed';
  if (t >= s) return 'Ongoing';
  return 'Pending';
};

const suggestDates = (season: SemesterSeason, year: number): { start: string; end: string } => {
  // start[Spring] = 1/1/{year} â€” má»—i ká»³ tiáº¿p theo offset thÃªm 16 tuáº§n
  const yearStart = new Date(`${year}-01-01`);
  const start = addDays(yearStart, SEASON_INDEX[season] * WEEKS_PER_SEMESTER * 7);
  const end = addDays(start, WEEKS_PER_SEMESTER * 7);
  return { start: toISO(start), end: toISO(end) };
};

const AdminSemesters = () => {
  const [list, setList] = useState<SemesterListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SemesterStatus | ''>('');

  // Detail state â€” load on click
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SemesterDetailDto | null>(null);
  const [holidays, setHolidays] = useState<SemesterHolidayDto[]>([]);
  const [milestones, setMilestones] = useState<SemesterMilestoneDto[]>([]);   // chá»‰ overlap ká»³ hiá»‡n táº¡i (dÃ¹ng cho báº£ng dÆ°á»›i)
  const [allReviews, setAllReviews] = useState<SemesterMilestoneDto[]>([]);  // toÃ n bá»™ review trong DB (dÃ¹ng cho timeline)
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Timeline view mode: 'week' (1 tick = 1 tuáº§n) hoáº·c 'month' (1 tick = 1 thÃ¡ng, Ã­t cá»™t hÆ¡n â†’ fit screen)
  const [tlMode, setTlMode] = useState<'week' | 'month'>('week');

  // Modal "Táº¡o ká»³ há»c má»›i" â€” default nÄƒm hiá»‡n táº¡i, season Fall (vÃ¬ giá»¯a nÄƒm hay táº¡o Fall tiáº¿p theo)
  const currentYear = new Date().getFullYear();
  const initialForm = { season: 'Fall' as SemesterSeason, year: currentYear, ...suggestDates('Fall', currentYear) };
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(initialForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Khi Ä‘á»•i Season hoáº·c Year trong modal â†’ auto fill láº¡i má»‘c gá»£i Ã½
  const updateSeason = (season: SemesterSeason) => {
    setCreateForm(f => ({ ...f, season, ...suggestDates(season, f.year) }));
  };
  const updateYear = (year: number) => {
    setCreateForm(f => ({ ...f, year, ...suggestDates(f.season, year) }));
  };

  // Dropdown Ä‘á»•i status trong detail header
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Holiday Ä‘ang Ä‘Æ°á»£c hover (Ä‘á»ƒ show tooltip)
  const [hoveredHoliday, setHoveredHoliday] = useState<number | null>(null);

  // NÄƒm Ä‘ang xem trong list semester â€” default nÄƒm hiá»‡n táº¡i, cÃ³ thá»ƒ navigate â†/â†’
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());

  // CÃ¡c nÄƒm cÃ³ dá»¯ liá»‡u trong list (sau khi Ä‘Ã£ filter status)
  const availableYears = useMemo(() => {
    const s = new Set(list.map(l => l.year));
    return Array.from(s).sort((a, b) => a - b);
  }, [list]);

  // Khi list Ä‘á»•i (filter Ä‘á»•i) â€” clamp viewYear vÃ o range cÃ³ dá»¯ liá»‡u, khÃ´ng break tráº£i nghiá»‡m
  useEffect(() => {
    if (availableYears.length === 0) return;
    if (!availableYears.includes(viewYear)) {
      // Náº¿u nÄƒm hiá»‡n táº¡i khÃ´ng cÃ³ dá»¯ liá»‡u â†’ chá»n nÄƒm gáº§n nháº¥t vá»›i nÄƒm Ä‘Ã³
      const closest = availableYears.reduce((p, c) => Math.abs(c - viewYear) < Math.abs(p - viewYear) ? c : p);
      setViewYear(closest);
    }
  }, [availableYears]);

  // === Drag-to-resize holidays trÃªn timeline ===
  // dirtyEdits: id -> { startDate, durationDays } Ä‘Ã£ chá»‰nh táº¡m thá»i, chÆ°a lÆ°u BE
  const [dirtyEdits, setDirtyEdits] = useState<Record<number, { startDate: string; durationDays: number }>>({});
  // dragState: holiday Ä‘ang drag + edge nÃ o + má»‘c gá»‘c khi báº¯t Ä‘áº§u
  const [dragState, setDragState] = useState<{
    holidayId: number;
    edge: 'left' | 'right';
    startX: number;
    pxPerDay: number;
    origStart: string;        // ISO yyyy-MM-dd á»Ÿ thá»i Ä‘iá»ƒm mousedown
    origDuration: number;
    liveStart: string;        // tracked realtime Ä‘á»ƒ hiá»‡n tooltip ngÃ y
    liveDuration: number;
  } | null>(null);
  const [savingEdits, setSavingEdits] = useState(false);

  // Helper: cá»™ng X ngÃ y vÃ o ISO date (UTC-safe)
  const addDaysISO = (iso: string, days: number) => {
    const d = new Date(iso);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };

  // Láº¥y effective values (Æ°u tiÃªn dirty edits) â€” dÃ¹ng Ä‘á»ƒ render timeline & table
  const effective = (h: SemesterHolidayDto) => {
    const e = dirtyEdits[h.id];
    if (dragState && dragState.holidayId === h.id) {
      return { startDate: dragState.liveStart, durationDays: dragState.liveDuration };
    }
    return e ? { startDate: e.startDate, durationDays: e.durationDays } : { startDate: h.startDate, durationDays: h.durationDays };
  };

  const hasDirty = Object.keys(dirtyEdits).length > 0;

  // Mouse handlers cho drag (global vÃ¬ khi rÃª cÃ³ thá»ƒ ra ngoÃ i element)
  useEffect(() => {
    if (!dragState) return;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragState.startX;
      const deltaDays = Math.round(dx / dragState.pxPerDay);
      if (!detail) return;
      const semStart = detail.startDate.slice(0, 10);
      const semEndISO = detail.endDate.slice(0, 10);

      if (dragState.edge === 'left') {
        // KÃ©o cáº¡nh trÃ¡i: dá»i startDate, duration = origDuration - delta Ä‘á»ƒ cáº¡nh pháº£i giá»¯ nguyÃªn
        let newStart = addDaysISO(dragState.origStart, deltaDays);
        let newDuration = dragState.origDuration - deltaDays;
        if (newDuration < 1) { newDuration = 1; newStart = addDaysISO(dragState.origStart, dragState.origDuration - 1); }
        if (newStart < semStart) {
          const diff = Math.round((new Date(semStart).getTime() - new Date(newStart).getTime()) / 86400000);
          newStart = semStart;
          newDuration -= diff;
          if (newDuration < 1) newDuration = 1;
        }
        setDragState({ ...dragState, liveStart: newStart, liveDuration: newDuration });
      } else {
        // KÃ©o cáº¡nh pháº£i: giá»¯ startDate, Ä‘á»•i duration
        let newDuration = dragState.origDuration + deltaDays;
        if (newDuration < 1) newDuration = 1;
        // Cháº·n khÃ´ng cho vÆ°á»£t semester end (loose check, BE sáº½ recalc)
        const endISO = addDaysISO(dragState.origStart, newDuration);
        if (endISO > semEndISO) {
          const semDays = Math.round((new Date(semEndISO).getTime() - new Date(dragState.origStart).getTime()) / 86400000);
          newDuration = Math.max(1, semDays);
        }
        setDragState({ ...dragState, liveDuration: newDuration });
      }
    };
    const onUp = () => {
      // Commit live values vÃ o dirtyEdits náº¿u khÃ¡c báº£n gá»‘c
      const h = holidays.find(x => x.id === dragState.holidayId);
      if (h) {
        const baselineStart = h.startDate.slice(0, 10);
        const baselineDur = h.durationDays;
        const changed = dragState.liveStart !== baselineStart || dragState.liveDuration !== baselineDur;
        if (changed) {
          setDirtyEdits(prev => ({ ...prev, [dragState.holidayId]: { startDate: dragState.liveStart, durationDays: dragState.liveDuration } }));
        } else {
          // Quay vá» baseline -> xÃ³a entry dirty (náº¿u cÃ³)
          setDirtyEdits(prev => { const c = { ...prev }; delete c[dragState.holidayId]; return c; });
        }
      }
      setDragState(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragState, detail, holidays]);

  // LÆ°u cÃ¡c thay Ä‘á»•i drag â€” PUT tá»«ng cÃ¡i, gá»™p cascade feedback cá»§a cÃ¡i cuá»‘i
  const handleSaveEdits = async () => {
    if (!hasDirty || savingEdits) return;
    try {
      setSavingEdits(true);
      const ids = Object.keys(dirtyEdits).map(n => parseInt(n, 10));
      let lastCascade: HolidayCascadeResultDto | null = null;
      for (const id of ids) {
        const e = dirtyEdits[id];
        const res = await api.put<HolidayCascadeResultDto>(`/api/admin/semester-holidays/${id}`, {
          startDate: e.startDate,
          durationDays: e.durationDays,
        });
        lastCascade = res.data;
      }
      setDirtyEdits({});
      if (detail) await Promise.all([loadDetail(detail.id), loadList()]);
      if (lastCascade) showCascadeFeedback(lastCascade, 'LÆ°u chá»‰nh sá»­a');
    } catch (e: any) {
      openConfirm({
        title: 'LÆ°u thay Ä‘á»•i tháº¥t báº¡i',
        message: e?.response?.data?.message || 'CÃ³ lá»—i xáº£y ra khi lÆ°u chá»‰nh sá»­a.',
        variant: 'danger', cancelLabel: null, confirmLabel: 'ÄÃ£ hiá»ƒu',
      });
    } finally {
      setSavingEdits(false);
    }
  };

  // Há»§y háº¿t edits â€” quay vá» dá»¯ liá»‡u BE
  const handleDiscardEdits = () => setDirtyEdits({});

  // Khi Ä‘á»•i semester Ä‘Æ°á»£c chá»n -> reset dirty (trÃ¡nh nháº§m giá»¯a cÃ¡c ká»³)
  useEffect(() => { setDirtyEdits({}); }, [selectedId]);

  // === Modal "ThÃªm ngÃ y nghá»‰ vÃ o ká»³" ===
  // Khi user pick template, ta clone template values nhÆ°ng cho phÃ©p override
  // (StartDate Ä‘Æ°á»£c suy tá»« Year cá»§a semester + DefaultStartMonth/Day â€” clamp >= semester.startDate)
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const blankHolidayForm = {
    templateId: null as number | null,
    label: '',
    startDate: '',
    durationDays: 1,
    isCompensated: true,
  };
  const [holidayForm, setHolidayForm] = useState(blankHolidayForm);
  const [holidayError, setHolidayError] = useState<string | null>(null);
  const [addingHoliday, setAddingHoliday] = useState(false);

  const openAddHoliday = () => {
    setHolidayError(null);
    setHolidayForm({ ...blankHolidayForm });
    setShowAddHoliday(true);
    scrollTimelineIntoView();
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setHolidayError(null);
    if (!detail) return;
    if (!holidayForm.label.trim()) {
      setHolidayError('TÃªn ngÃ y nghá»‰ khÃ´ng Ä‘Æ°á»£c rá»—ng');
      return;
    }
    if (!holidayForm.startDate) {
      setHolidayError('Pháº£i chá»n ngÃ y báº¯t Ä‘áº§u');
      return;
    }
    if (new Date(holidayForm.startDate) < new Date(detail.startDate)) {
      setHolidayError('NgÃ y báº¯t Ä‘áº§u pháº£i >= ngÃ y báº¯t Ä‘áº§u cá»§a ká»³ há»c');
      return;
    }
    if (new Date(holidayForm.startDate) > new Date(detail.endDate)) {
      setHolidayError('NgÃ y báº¯t Ä‘áº§u pháº£i <= ngÃ y káº¿t thÃºc cá»§a ká»³ há»c');
      return;
    }
    if (holidayForm.durationDays < 1) {
      setHolidayError('Sá»‘ ngÃ y nghá»‰ pháº£i >= 1');
      return;
    }
    try {
      setAddingHoliday(true);
      const res = await api.post<HolidayCascadeResultDto>('/api/admin/semester-holidays', {
        semesterId: detail.id,
        templateId: holidayForm.templateId,
        label: holidayForm.label.trim(),
        startDate: holidayForm.startDate,
        durationDays: holidayForm.durationDays,
        isCompensated: holidayForm.isCompensated,
      });
      setShowAddHoliday(false);
      await Promise.all([loadDetail(detail.id), loadList()]);  // loadList vÃ¬ EndDate cÃ³ thá»ƒ Ä‘á»•i (auto-recalc)
      // Show cascade feedback náº¿u cÃ³ gÃ¬ shift
      showCascadeFeedback(res.data, 'ThÃªm ngÃ y nghá»‰');
    } catch (err: any) {
      setHolidayError(err?.response?.data?.message || 'ThÃªm ngÃ y nghá»‰ tháº¥t báº¡i');
    } finally {
      setAddingHoliday(false);
    }
  };

  // === XÃ³a há»c ká»³ ===
  const [deletingSem, setDeletingSem] = useState(false);
  const handleDeleteSemester = () => {
    if (!detail) return;
    openConfirm({
      title: `XÃ³a ká»³ há»c ${detail.code}?`,
      message: `Sáº½ xÃ³a ká»³ "${SEASON_LABEL[detail.season] ?? detail.season} ${detail.year}" cÃ¹ng toÃ n bá»™ ngÃ y nghá»‰ vÃ  lá»‹ch review/defence cá»§a ká»³ nÃ y. ${detail.groupCount > 0 ? `âš ï¸ Ká»³ nÃ y Ä‘ang cÃ³ ${detail.groupCount} nhÃ³m â€” BE sáº½ cháº·n xÃ³a.` : 'KhÃ´ng cÃ³ nhÃ³m gáº¯n vÃ o nÃªn xÃ³a Ä‘Æ°á»£c.'}`,
      variant: 'danger', confirmLabel: 'XÃ³a ká»³ há»c',
      onConfirm: async () => {
        try {
          setDeletingSem(true);
          await api.delete(`/api/admin/semesters/${detail.id}`);
          setSelectedId(null);
          setDetail(null);
          setHolidays([]);
          setMilestones([]);
          await loadList();
        } catch (e: any) {
          openConfirm({
            title: 'XÃ³a ká»³ tháº¥t báº¡i',
            message: e?.response?.data?.message || 'CÃ³ lá»—i xáº£y ra. CÃ³ thá»ƒ ká»³ nÃ y Ä‘ang cÃ³ nhÃ³m gáº¯n vÃ o.',
            variant: 'danger', cancelLabel: null, confirmLabel: 'ÄÃ£ hiá»ƒu',
          });
        } finally {
          setDeletingSem(false);
        }
      },
    });
  };

  // === Milestone CRUD (manual) ===
  // Modal mode: 'new' = táº¡o má»›i, sá»‘ = sá»­a id
  const [milestoneMode, setMilestoneMode] = useState<number | 'new' | null>(null);
  const [hoverMilestoneId, setHoverMilestoneId] = useState<number | null>(null);

  // Ref Ä‘áº¿n card timeline â€” dÃ¹ng Ä‘á»ƒ auto-scroll khi má»Ÿ drawer thÃªm/sá»­a milestone (drawer bottom).
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const scrollTimelineIntoView = () => {
    setTimeout(() => {
      if (timelineRef.current) {
        timelineRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Vá»‹ trÃ­ drawer Ä‘Æ°á»£c tÃ­nh tá»« rect cá»§a timeline (cÃ¹ng left/width, top ngay dÆ°á»›i timeline + gap).
  // Track láº¡i trÃªn scroll/resize Ä‘á»ƒ drawer luÃ´n dÃ­nh theo timeline.
  const [, setDrawerPos] = useState<{ left: number; width: number; top: number } | null>(null);
  const blankMilestoneForm = {
    type: 'Review' as MilestoneType,
    orderIndex: 1,
    label: '',
    windowStart: '',
    windowEnd: '',
    status: 'Draft' as ReviewStatus,
    note: '',
  };
  const [milestoneForm, setMilestoneForm] = useState(blankMilestoneForm);
  const [milestoneError, setMilestoneError] = useState<string | null>(null);
  const [savingMs, setSavingMs] = useState(false);

  // Realtime preview cho timeline: project form values lÃªn timeline ngay khi user gÃµ
  const previewHoliday = useMemo(() => {
    if (!showAddHoliday || !holidayForm.startDate || holidayForm.durationDays < 1) return null;
    return {
      label: holidayForm.label || '(Lá»… má»›i)',
      startDate: holidayForm.startDate,
      durationDays: holidayForm.durationDays,
      isCompensated: holidayForm.isCompensated,
    };
  }, [showAddHoliday, holidayForm]);

  const previewMilestone = useMemo(() => {
    if (milestoneMode === null || !milestoneForm.windowStart || !milestoneForm.windowEnd) return null;
    // Cho phÃ©p start = end (window 1 ngÃ y) â†’ váº«n render preview. Chá»‰ skip khi end < start.
    if (new Date(milestoneForm.windowEnd) < new Date(milestoneForm.windowStart)) return null;
    return {
      type: milestoneForm.type,
      label: milestoneForm.label || `(${milestoneForm.type} má»›i)`,
      windowStart: milestoneForm.windowStart,
      windowEnd: milestoneForm.windowEnd,
      // Edit mode: bá» milestone gá»‘c Ä‘ang sá»­a Ä‘á»ƒ preview thay nÃ³ (khÃ´ng render trÃ¹ng)
      hiddenId: typeof milestoneMode === 'number' ? milestoneMode : null,
    };
  }, [milestoneMode, milestoneForm]);

  const openCreateMilestone = () => {
    if (!detail) return;
    // Auto-suggest OrderIndex tiáº¿p theo cho Review
    const nextRvIdx = (milestones.filter(m => m.type === 'Review').map(m => m.orderIndex).reduce((a, b) => Math.max(a, b), 0)) + 1;
    setMilestoneForm({
      ...blankMilestoneForm,
      type: 'Review',
      orderIndex: nextRvIdx,
      label: `Review ${nextRvIdx}`,
      windowStart: detail.startDate.slice(0, 10),
      windowEnd: addDaysISO(detail.startDate.slice(0, 10), 7),  // Default gap = 1 tuáº§n (7 ngÃ y)
    });
    setMilestoneError(null);
    setMilestoneMode('new');
    scrollTimelineIntoView();
  };

  const openEditMilestone = (m: SemesterMilestoneDto) => {
    setMilestoneForm({
      type: m.type,
      orderIndex: m.orderIndex,
      label: m.label,
      windowStart: m.windowStart.slice(0, 10),
      windowEnd: m.windowEnd.slice(0, 10),
      status: m.status ?? 'Draft',
      note: m.note ?? '',
    });
    setMilestoneError(null);
    setMilestoneMode(m.id);
    scrollTimelineIntoView();
  };

  // Khi Ä‘á»•i Type trong form, auto re-suggest OrderIndex + Label
  const onTypeChange = (newType: MilestoneType) => {
    if (milestoneMode !== 'new') {                              // Edit thÃ¬ khÃ´ng auto Ä‘á»•i
      setMilestoneForm(f => ({ ...f, type: newType }));
      return;
    }
    const nextIdx = (milestones.filter(m => m.type === newType).map(m => m.orderIndex).reduce((a, b) => Math.max(a, b), 0)) + 1;
    setMilestoneForm(f => ({ ...f, type: newType, orderIndex: nextIdx, label: `${newType === 'Review' ? 'Review' : 'Defence'} ${nextIdx}` }));
  };

  const handleSubmitMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setMilestoneError(null);
    if (!detail) return;
    if (!milestoneForm.label.trim()) { setMilestoneError('Label khÃ´ng Ä‘Æ°á»£c rá»—ng'); return; }
    if (!milestoneForm.windowStart || !milestoneForm.windowEnd) { setMilestoneError('Pháº£i nháº­p cáº£ 2 má»‘c'); return; }
    if (new Date(milestoneForm.windowEnd) <= new Date(milestoneForm.windowStart)) { setMilestoneError('NgÃ y káº¿t thÃºc pháº£i sau ngÃ y báº¯t Ä‘áº§u'); return; }
    if (new Date(milestoneForm.windowStart) < new Date(detail.startDate)) { setMilestoneError('NgÃ y báº¯t Ä‘áº§u pháº£i >= ngÃ y báº¯t Ä‘áº§u ká»³'); return; }
    try {
      setSavingMs(true);
      if (milestoneMode === 'new') {
        await api.post('/api/admin/reviews', {
          semesterId: detail.id,
          type: milestoneForm.type,
          orderIndex: milestoneForm.orderIndex,
          label: milestoneForm.label.trim(),
          windowStart: milestoneForm.windowStart,
          windowEnd: milestoneForm.windowEnd,
          status: milestoneForm.status,
          note: milestoneForm.note.trim() || null,
        });
      } else {
        await api.put(`/api/admin/reviews/${milestoneMode}`, {
          label: milestoneForm.label.trim(),
          windowStart: milestoneForm.windowStart,
          windowEnd: milestoneForm.windowEnd,
          status: milestoneForm.status,
          note: milestoneForm.note.trim() || null,
        });
      }
      setMilestoneMode(null);
      await loadDetail(detail.id);
    } catch (err: any) {
      setMilestoneError(err?.response?.data?.message || 'LÆ°u tháº¥t báº¡i');
    } finally {
      setSavingMs(false);
    }
  };

  // Chuyá»ƒn status nhanh qua PATCH (Draft â†’ Registering, etc.)
  const handleChangeReviewStatus = async (m: SemesterMilestoneDto, newStatus: ReviewStatus) => {
    if (!detail) return;
    try {
      await api.patch(`/api/admin/reviews/${m.id}/status`, { status: newStatus });
      await loadDetail(detail.id);
    } catch (e: any) {
      openConfirm({
        title: 'Äá»•i tráº¡ng thÃ¡i tháº¥t báº¡i',
        message: e?.response?.data?.message || 'CÃ³ lá»—i xáº£y ra.',
        variant: 'danger', cancelLabel: null, confirmLabel: 'ÄÃ£ hiá»ƒu',
      });
    }
  };

  const handleDeleteMilestone = (m: SemesterMilestoneDto) => {
    openConfirm({
      title: 'XÃ³a lá»‹ch review/defence?',
      message: `XÃ³a "${m.label}" khá»i ká»³ há»c. HÃ nh Ä‘á»™ng nÃ y khÃ´ng undo Ä‘Æ°á»£c.`,
      variant: 'danger', confirmLabel: 'XÃ³a',
      onConfirm: async () => {
        try {
          await api.delete(`/api/admin/reviews/${m.id}`);
          if (detail) await loadDetail(detail.id);
        } catch (e: any) {
          openConfirm({
            title: 'XÃ³a tháº¥t báº¡i',
            message: e?.response?.data?.message || 'CÃ³ lá»—i xáº£y ra.',
            variant: 'danger', cancelLabel: null, confirmLabel: 'ÄÃ£ hiá»ƒu',
          });
        }
      },
    });
  };

  // Há»§y bá» 1 milestone â€” confirm trÆ°á»›c khi chuyá»ƒn sang Cancelled
  const handleCancelMilestone = (m: SemesterMilestoneDto) => {
    openConfirm({
      title: `Há»§y bá» "${m.label}"?`,
      message: 'HÃ nh Ä‘á»™ng nÃ y sáº½ chuyá»ƒn Ä‘á»£t review sang tráº¡ng thÃ¡i Cancelled. KhÃ´ng thá»ƒ khÃ´i phá»¥c vá» tráº¡ng thÃ¡i trÆ°á»›c.',
      variant: 'danger',
      confirmLabel: 'Há»§y bá» Ä‘á»£t review',
      onConfirm: () => handleChangeReviewStatus(m, 'Cancelled'),
    });
  };

  // XÃ³a 1 holiday â€” confirm qua popup
  const handleDeleteHoliday = (h: SemesterHolidayDto) => {
    openConfirm({
      title: 'XÃ³a ngÃ y nghá»‰?',
      message: `Bá» "${h.label}" khá»i ká»³ há»c nÃ y. EndDate ká»³ há»c cÃ³ thá»ƒ Ä‘Æ°á»£c tÃ­nh láº¡i náº¿u lá»… cÃ³ bÃ¹.`,
      variant: 'danger',
      confirmLabel: 'XÃ³a',
      onConfirm: async () => {
        try {
          const res = await api.delete<HolidayCascadeResultDto>(`/api/admin/semester-holidays/${h.id}`);
          if (detail) await Promise.all([loadDetail(detail.id), loadList()]);
          if (res.data) showCascadeFeedback(res.data, 'XÃ³a ngÃ y nghá»‰');
        } catch (e: any) {
          openConfirm({
            title: 'XÃ³a tháº¥t báº¡i',
            message: e?.response?.data?.message || 'CÃ³ lá»—i xáº£y ra.',
            variant: 'danger', cancelLabel: null, confirmLabel: 'ÄÃ£ hiá»ƒu',
          });
        }
      },
    });
  };

  // Confirm popup state (thay cho window.confirm + alert) â€” 1 modal dÃ¹ng chung
  type ConfirmVariant = 'warning' | 'danger' | 'info';
  interface ConfirmState {
    title: string;
    message: string;
    lines?: string[];                   // optional list Ä‘á»ƒ liá»‡t kÃª (vd thay Ä‘á»•i sync)
    confirmLabel?: string;
    cancelLabel?: string | null;       // null = áº©n nÃºt Há»§y (mode info-only)
    variant?: ConfirmVariant;
    onConfirm?: () => void | Promise<void>;
  }
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Show popup tá»« cascade result (sau khi thÃªm/sá»­a/xÃ³a lá»… cÃ³ bÃ¹) â€” chá»‰ show khi cÃ³ gÃ¬ Ä‘Ã³ shift
  const showCascadeFeedback = (r: HolidayCascadeResultDto, actionLabel: string) => {
    if (r.shiftedSemesters.length === 0 && r.shiftedMilestones.length === 0 && r.overflows.length === 0) return;
    const lines: string[] = [];
    if (r.shiftedSemesters.length > 0) {
      lines.push(`â”€â”€ ${r.shiftedSemesters.length} ká»³ há»c bá»‹ shift:`);
      r.shiftedSemesters.forEach(s => lines.push(`  ${s.code}: ${s.oldStart.slice(0, 10)} â†’ ${s.newStart.slice(0, 10)} (+${s.deltaDays}d)`));
    }
    if (r.shiftedMilestones.length > 0) {
      lines.push(`â”€â”€ ${r.shiftedMilestones.length} milestone bá»‹ shift:`);
      r.shiftedMilestones.forEach(m => lines.push(`  ${m.label}: ${m.oldWindowStart.slice(0, 10)}â†’${m.oldWindowEnd.slice(0, 10)} â‡’ ${m.newWindowStart.slice(0, 10)}â†’${m.newWindowEnd.slice(0, 10)}`));
    }
    if (r.overflows.length > 0) {
      lines.push(`â”€â”€ âš  ${r.overflows.length} má»¥c váº¯t biÃªn ká»³:`);
      r.overflows.forEach(o => lines.push(`  ${o.kind} "${o.label}" trong ${o.semesterCode} vÆ°á»£t ${o.overflowDays} ngÃ y`));
    }
    if (r.skippedCompletedCodes.length > 0) {
      lines.push(`â”€â”€ Bá» qua (ká»³ Ä‘Ã£ Completed, khÃ´ng shift):`);
      r.skippedCompletedCodes.forEach(c => lines.push(`  ${c}`));
    }
    setConfirmState({
      title: `${actionLabel} thÃ nh cÃ´ng â€” Ä‘Ã£ cascade`,
      message: `Sau thao tÃ¡c nÃ y há»‡ thá»‘ng Ä‘Ã£ tá»± cáº­p nháº­t cÃ¡c ká»³ há»c vÃ  milestone liÃªn quan:`,
      lines,
      variant: 'info', cancelLabel: null, confirmLabel: 'ÄÃ£ hiá»ƒu',
    });
  };

  const openConfirm = (state: ConfirmState) => setConfirmState(state);
  const closeConfirm = () => { if (!confirmBusy) setConfirmState(null); };
  const runConfirm = async () => {
    if (!confirmState?.onConfirm) { setConfirmState(null); return; }
    try {
      setConfirmBusy(true);
      await confirmState.onConfirm();
      setConfirmState(null);
    } finally {
      setConfirmBusy(false);
    }
  };

  // PUT status cho 1 semester, optional refresh detail sau cÃ¹ng
  const putStatus = async (id: number, status: SemesterStatus) => {
    await api.put(`/api/admin/semesters/${id}`, { status });
  };

  // Äá»•i status tá»« dropdown â€” enforce "chá»‰ 1 Ongoing"
  const handleChangeStatus = async (newStatus: SemesterStatus) => {
    if (!detail || updatingStatus) return;
    setStatusMenuOpen(false);
    if (newStatus === detail.status) return;

    // Náº¿u chá»n Ongoing mÃ  Ä‘Ã£ cÃ³ ká»³ khÃ¡c Ä‘ang Ongoing â†’ popup confirm
    if (newStatus === 'Ongoing') {
      const other = list.find(s => s.id !== detail.id && s.status === 'Ongoing');
      if (other) {
        openConfirm({
          title: 'Chuyá»ƒn ká»³ há»c Ä‘ang Ongoing?',
          message:
            `Hiá»‡n ká»³ "${SEASON_LABEL[other.season]} ${other.year}" (${other.code}) Ä‘ang Ongoing.\n` +
    `Há»‡ thá»‘ng chá»‰ cho phÃ©p 1 ká»³ Ongoing cÃ¹ng lÃºc.\n` +
    `Chuyá»ƒn há»c ká»³ (${other.code}) vá» Completed.`,
          confirmLabel: 'Äá»“ng Ã½ chuyá»ƒn',
          variant: 'warning',
          onConfirm: async () => {
            setUpdatingStatus(true);
            try {
              await putStatus(other.id, 'Completed');
              await putStatus(detail.id, newStatus);
              await Promise.all([loadList(), loadDetail(detail.id)]);
            } catch (e: any) {
              openConfirm({
                title: 'Cáº­p nháº­t tháº¥t báº¡i',
                message: e?.response?.data?.message || 'CÃ³ lá»—i xáº£y ra khi Ä‘á»•i tráº¡ng thÃ¡i.',
                variant: 'danger', cancelLabel: null, confirmLabel: 'ÄÃ£ hiá»ƒu',
              });
            } finally {
              setUpdatingStatus(false);
            }
          },
        });
        return;
      }
    }

    try {
      setUpdatingStatus(true);
      await putStatus(detail.id, newStatus);
      await Promise.all([loadList(), loadDetail(detail.id)]);
    } catch (e: any) {
      openConfirm({
        title: 'Cáº­p nháº­t tháº¥t báº¡i',
        message: e?.response?.data?.message || 'CÃ³ lá»—i xáº£y ra khi Ä‘á»•i tráº¡ng thÃ¡i.',
        variant: 'danger', cancelLabel: null, confirmLabel: 'ÄÃ£ hiá»ƒu',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // NÃºt "Äá»“ng bá»™ nhÃ³m" â€” gá»i BE backfill SemesterId cho group dá»±a trÃªn GroupCode (vd GSU26SE02 -> SU26)
  const [linking, setLinking] = useState(false);
  const handleLinkGroups = async () => {
    if (linking) return;
    try {
      setLinking(true);
      const res = await api.post<LinkGroupsResultDto>('/api/admin/semesters/link-groups', {});
      const r = res.data;
      // Show káº¿t quáº£ qua popup
      if (r.totalUnlinked === 0) {
        openConfirm({
          title: 'KhÃ´ng cÃ³ gÃ¬ Ä‘á»ƒ Ä‘á»“ng bá»™',
          message: 'Táº¥t cáº£ nhÃ³m Ä‘Ã£ Ä‘Æ°á»£c ná»‘i vá»›i há»c ká»³.',
          variant: 'info', cancelLabel: null, confirmLabel: 'OK',
        });
      } else {
        openConfirm({
          title: `Äá»“ng bá»™ xong (${r.linked}/${r.totalUnlinked} nhÃ³m)`,
          message: r.skipped > 0
            ? `ÄÃ£ ná»‘i ${r.linked} nhÃ³m. ${r.skipped} nhÃ³m bá»‹ bá» qua do khÃ´ng tÃ¬m tháº¥y há»c ká»³ tÆ°Æ¡ng á»©ng (cÃ³ thá»ƒ chÆ°a táº¡o há»c ká»³ Ä‘Ã³, hoáº·c ká»³ Ä‘Ã£ Cancelled).`
            : `ÄÃ£ ná»‘i thÃ nh cÃ´ng ${r.linked} nhÃ³m vá»›i há»c ká»³ tÆ°Æ¡ng á»©ng.`,
          lines: r.skipped > 0 ? r.skippedGroups.slice(0, 20).map(c => `Skip: ${c}`) : undefined,
          variant: r.skipped > 0 ? 'warning' : 'info',
          cancelLabel: null, confirmLabel: 'OK',
        });
        // Refresh list (groupCount cá»§a cÃ¡c ká»³ sáº½ tÄƒng)
        await loadList();
        if (selectedId !== null) await loadDetail(selectedId);
      }
    } catch (e: any) {
      openConfirm({
        title: 'Äá»“ng bá»™ nhÃ³m tháº¥t báº¡i',
        message: e?.response?.data?.message || 'CÃ³ lá»—i xáº£y ra khi gá»i API link-groups.',
        variant: 'danger', cancelLabel: null, confirmLabel: 'ÄÃ£ hiá»ƒu',
      });
    } finally {
      setLinking(false);
    }
  };

  // NÃºt "Äá»“ng bá»™ theo ngÃ y" â€” quÃ©t list, PUT nhá»¯ng ká»³ cÃ³ status chÆ°a khá»›p
  const [syncing, setSyncing] = useState(false);
  const handleSyncByDate = async () => {
    if (list.length === 0 || syncing) return;
    const today = new Date();
    const diffs = list
      .map(s => ({ s, desired: deriveStatus(s.status, s.startDate, s.endDate, today) }))
      .filter(x => x.desired !== x.s.status);

    if (diffs.length === 0) {
      openConfirm({
        title: 'ÄÃ£ Ä‘á»“ng bá»™',
        message: 'Táº¥t cáº£ ká»³ Ä‘Ã£ Ä‘Ãºng tráº¡ng thÃ¡i theo ngÃ y hiá»‡n táº¡i.',
        variant: 'info', cancelLabel: null, confirmLabel: 'OK',
      });
      return;
    }
    openConfirm({
      title: `Äá»“ng bá»™ ${diffs.length} ká»³ há»c theo ngÃ y?`,
      message: 'CÃ¡c ká»³ sau sáº½ Ä‘Æ°á»£c cáº­p nháº­t tráº¡ng thÃ¡i:',
      lines: diffs.map(d => `${d.s.code}: ${STATUS_META[d.s.status].label} â†’ ${STATUS_META[d.desired].label}`),
      confirmLabel: 'Äá»“ng bá»™ ngay',
      variant: 'warning',
      onConfirm: async () => {
        setSyncing(true);
        try {
          for (const d of diffs) await putStatus(d.s.id, d.desired);
          await loadList();
          if (selectedId !== null) await loadDetail(selectedId);
        } catch (e: any) {
          openConfirm({
            title: 'Äá»“ng bá»™ tháº¥t báº¡i',
            message: e?.response?.data?.message || 'CÃ³ lá»—i xáº£y ra khi Ä‘á»“ng bá»™.',
            variant: 'danger', cancelLabel: null, confirmLabel: 'ÄÃ£ hiá»ƒu',
          });
        } finally {
          setSyncing(false);
        }
      },
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (new Date(createForm.end) <= new Date(createForm.start)) {
      setCreateError('NgÃ y káº¿t thÃºc pháº£i sau ngÃ y báº¯t Ä‘áº§u');
      return;
    }
    try {
      setSaving(true);
      await api.post('/api/admin/semesters', {
        season: createForm.season,
        year: createForm.year,
        startDate: createForm.start,
        endDate: createForm.end,
      });
      setShowCreate(false);
      setCreateForm(initialForm);
      await loadList();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Táº¡o ká»³ há»c tháº¥t báº¡i');
    } finally {
      setSaving(false);
    }
  };

  // Load list semester (cÃ³ filter status)
  const loadList = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page: 1, pageSize: 100 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<SemesterListItemDto[]>('/api/admin/semesters', { params });
      setList(res.data);
      // Auto-select há»c ká»³ Ä‘ang diá»…n ra náº¿u cÃ³, fallback vá» item Ä‘áº§u.
      const selectedExists = selectedId !== null && res.data.some(s => s.id === selectedId);
      if (res.data.length > 0 && !selectedExists) {
        const ongoing = res.data.find(s => s.status === 'Ongoing');
        const target = ongoing ?? res.data[0];
        setSelectedId(target.id);
        setViewYear(target.year);
      }
    } catch (e) {
      console.error('Load semesters failed', e);
    } finally {
      setLoading(false);
    }
  };

  // Load detail + holidays + milestones cho semester Ä‘Æ°á»£c chá»n (parallel)
  const loadDetail = async (id: number) => {
    try {
      setLoadingDetail(true);
      // 4 fetch parallel: detail / holidays / reviews-overlap (báº£ng) / all-reviews (timeline)
      const [d, h, m, allR] = await Promise.all([
        api.get<SemesterDetailDto>(`/api/admin/semesters/${id}`),
        api.get<SemesterHolidayDto[]>(`/api/admin/semester-holidays`, { params: { semesterId: id } }),
        api.get<SemesterMilestoneDto[]>(`/api/admin/reviews`, { params: { semesterId: id } }),
        api.get<SemesterMilestoneDto[]>(`/api/admin/reviews/all`),
      ]);
      setDetail(d.data);
      setHolidays(h.data);
      setMilestones(m.data);
      setAllReviews(allR.data);
    } catch (e) {
      console.error('Load semester detail failed', e);
      setDetail(null);
      setHolidays([]);
      setMilestones([]);
      setAllReviews([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => { loadList(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [statusFilter]);
  useEffect(() => { if (selectedId !== null) loadDetail(selectedId); }, [selectedId]);

  // Äo vá»‹ trÃ­ card timeline má»—i khi drawer má»Ÿ + láº¯ng nghe scroll/resize Ä‘á»ƒ drawer luÃ´n cÄƒn theo timeline.
  useEffect(() => {
    if (milestoneMode === null) { setDrawerPos(null); return; }
    const measure = () => {
      const el = timelineRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setDrawerPos({ left: rect.left, width: rect.width, top: rect.bottom + 12 });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [milestoneMode]);

  // TÃ­nh sá»‘ tuáº§n cá»§a semester (rounded up)
  const weekCount = useMemo(() => {
    if (!detail) return 0;
    return Math.ceil(daysBetween(detail.startDate, detail.endDate) / 7);
  }, [detail]);

  // (ÄÃ£ refactor: tÃ­nh displayDays trong IIFE timeline, khÃ´ng cáº§n totalDays toÃ n cá»¥c ná»¯a)

  return (
    <div className="animate-fade-in">
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        .today-hitbox:hover .today-indicator { width: 4px; background: #fde047; box-shadow: 0 0 10px rgba(251, 191, 36, 0.8); }
        .today-hitbox:hover .today-tooltip { opacity: 1 !important; margin-top: 0 !important; visibility: visible !important; pointer-events: auto; }

        /* Tooltip style cho milestone */
        .milestone-item .milestone-tooltip { opacity: 0; visibility: hidden; margin-top: 4px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none; z-index: 9999; }
        .milestone-item:hover .milestone-tooltip { opacity: 1 !important; margin-top: 0 !important; visibility: visible !important; }
      `}</style>
      <div className="topbar">
        <div>
          <h1>Lá»‹ch trÃ¬nh há»c ká»³</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Xem cÃ¡c ká»³ há»c, má»‘c thá»i gian vÃ  ngÃ y nghá»‰</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={handleLinkGroups}
            disabled={linking}
            title="Ná»‘i cÃ¡c nhÃ³m chÆ°a cÃ³ há»c ká»³ â€” parse GroupCode (vd GSU26SE02 â†’ SU26) Ä‘á»ƒ match Semester.Code"
          >
            {linking ? <Loader2 size={16} className="spin" /> : <Link2 size={16} />}
            {linking ? 'Äang ná»‘i...' : 'Äá»“ng bá»™ nhÃ³m'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleSyncByDate}
            disabled={syncing || list.length === 0}
            title="QuÃ©t táº¥t cáº£ ká»³ há»c, tá»± Ã¡p tráº¡ng thÃ¡i theo ngÃ y hiá»‡n táº¡i (Cancelled giá»¯ nguyÃªn)"
          >
            {syncing ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
            {syncing ? 'Äang Ä‘á»“ng bá»™...' : 'Äá»“ng bá»™ theo ngÃ y'}
          </button>
          <button className="btn btn-primary" onClick={() => { setCreateError(null); setShowCreate(true); }}>
            <Plus size={16} /> Táº¡o ká»³ há»c má»›i
          </button>
        </div>
      </div>

      {/* Filter + Horizontal list semester (group by year, divider má»—i nÄƒm) */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Filter size={14} /> Lá»c tráº¡ng thÃ¡i
          </div>
          <select
            className="input-field"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as SemesterStatus | '')}
            style={{ width: 'auto', minWidth: 180, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="">Táº¥t cáº£</option>
            <option value="Pending">Sáº¯p diá»…n ra</option>
            <option value="Ongoing">Äang diá»…n ra</option>
            <option value="Completed">ÄÃ£ káº¿t thÃºc</option>
            <option value="Cancelled">ÄÃ£ há»§y</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Äang táº£i...</div>
        ) : list.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>KhÃ´ng cÃ³ ká»³ há»c nÃ o.</div>
        ) : (() => {
          // Chá»‰ hiá»ƒn thá»‹ semester cá»§a viewYear
          const filteredItems = list.filter(s => s.year === viewYear);
          // Pos cá»§a viewYear trong availableYears Ä‘á»ƒ biáº¿t cÃ³ disable prev/next khÃ´ng
          const idx = availableYears.indexOf(viewYear);
          const hasPrev = idx > 0;
          const hasNext = idx >= 0 && idx < availableYears.length - 1;
          const goPrev = () => hasPrev && setViewYear(availableYears[idx - 1]);
          const goNext = () => hasNext && setViewYear(availableYears[idx + 1]);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {/* MÅ©i tÃªn â† */}
              <button
                onClick={goPrev}
                disabled={!hasPrev}
                title={hasPrev ? `Xem nÄƒm ${availableYears[idx - 1]}` : 'KhÃ´ng cÃ³ nÄƒm trÆ°á»›c'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid var(--border-glass)',
                  background: 'transparent',
                  color: hasPrev ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: hasPrev ? 'pointer' : 'not-allowed',
                  opacity: hasPrev ? 1 : 0.35,
                  flexShrink: 0,
                }}
              >
                <ChevronLeft size={18} />
              </button>

              {/* NhÃ£n nÄƒm hiá»‡n táº¡i */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                paddingRight: '0.85rem', borderRight: '2px solid var(--border-glass)',
                minWidth: 72, flexShrink: 0,
              }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1 }}>
                  {viewYear}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {filteredItems.length} ká»³
                </span>
              </div>

              {/* Pills cá»§a cÃ¡c ká»³ trong nÄƒm */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                {filteredItems.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                    KhÃ´ng cÃ³ ká»³ há»c nÃ o trong nÄƒm {viewYear}.
                  </div>
                ) : (() => {
                  // list is sorted desc by Year+Season upstream; for display we want chronological order within the year
                  const displayItems = filteredItems.slice().reverse();
                  return displayItems.map(s => {
                  const isActive = s.id === selectedId;
                  const meta = STATUS_META[s.status];
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '10px',
                        border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                        background: isActive ? 'rgba(251, 146, 60, 0.12)' : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                      }}
                      title={`${fmt(s.startDate)} â†’ ${fmt(s.endDate)} Â· ${s.groupCount} nhÃ³m`}
                    >
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.code}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        {SEASON_LABEL[s.season] ?? s.season}
                      </span>
                      <span className={`badge ${meta.badge}`} style={{ padding: '0.05rem 0.45rem', fontSize: '0.65rem' }}>{meta.label}</span>
                    </button>
                  );
                  })
                })()}
              </div>

              {/* MÅ©i tÃªn â†’ */}
              <button
                onClick={goNext}
                disabled={!hasNext}
                title={hasNext ? `Xem nÄƒm ${availableYears[idx + 1]}` : 'KhÃ´ng cÃ³ nÄƒm sau'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid var(--border-glass)',
                  background: 'transparent',
                  color: hasNext ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: hasNext ? 'pointer' : 'not-allowed',
                  opacity: hasNext ? 1 : 0.35,
                  flexShrink: 0,
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          );
        })()}
      </div>

      {/* Detail + timeline â€” full width */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loadingDetail || !detail ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {loadingDetail ? 'Äang táº£i chi tiáº¿t...' : 'Chá»n 1 ká»³ há»c Ä‘á»ƒ xem chi tiáº¿t'}
            </div>
          ) : (
            <>
              {/* Header card */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 className="text-gradient" style={{ marginBottom: '0.25rem' }}>
                      {SEASON_LABEL[detail.season] ?? detail.season} {detail.year}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>MÃ£: {detail.code}</p>
                  </div>
                  {/* Action group: nÃºt XÃ³a ká»³ + Dropdown Ä‘á»•i tráº¡ng thÃ¡i */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={handleDeleteSemester}
                      disabled={deletingSem}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem 0.75rem', fontSize: '0.75rem',
                        color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)',
                      }}
                      title="XÃ³a ká»³ há»c nÃ y"
                    >
                      {deletingSem ? <Loader2 size={12} className="spin" /> : <X size={12} />}
                      XÃ³a ká»³
                    </button>
                    <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setStatusMenuOpen(o => !o)}
                      disabled={updatingStatus}
                      className={`badge ${STATUS_META[detail.status].badge}`}
                      style={{
                        cursor: 'pointer', border: 'none',
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                      }}
                      title="Äá»•i tráº¡ng thÃ¡i"
                    >
                      {updatingStatus ? <Loader2 size={12} className="spin" /> : null}
                      {STATUS_META[detail.status].label}
                      <ChevronDown size={12} style={{ transform: statusMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                    </button>
                    {statusMenuOpen && (
                      <>
                        {/* Backdrop click-outside */}
                        <div
                          onClick={() => setStatusMenuOpen(false)}
                          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
                        />
                        <div className="glass-panel animate-fade-in" style={{
                          position: 'absolute', top: 'calc(100% + 0.4rem)', right: 0,
                          width: '200px', padding: '0.5rem', zIndex: 60,
                          display: 'flex', flexDirection: 'column', gap: '0.25rem',
                        }}>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem 0.5rem' }}>
                            Äá»•i tráº¡ng thÃ¡i sang:
                          </p>
                          {(['Pending', 'Ongoing', 'Completed', 'Cancelled'] as SemesterStatus[]).map(st => {
                            const isCurrent = st === detail.status;
                            return (
                              <button
                                key={st}
                                onClick={() => handleChangeStatus(st)}
                                disabled={isCurrent}
                                style={{
                                  padding: '0.5rem 0.75rem', textAlign: 'left',
                                  borderRadius: '6px', border: 'none',
                                  background: isCurrent ? 'var(--surface-glass)' : 'transparent',
                                  color: isCurrent ? 'var(--text-secondary)' : 'var(--text-primary)',
                                  cursor: isCurrent ? 'default' : 'pointer',
                                  fontSize: '0.85rem',
                                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                                }}
                                onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'rgba(251, 146, 60, 0.08)'; }}
                                onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                              >
                                <span className={`badge ${STATUS_META[st].badge}`} style={{ padding: '0.05rem 0.4rem', fontSize: '0.65rem' }}>
                                  {STATUS_META[st].label}
                                </span>
                                {isCurrent && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>âœ“ hiá»‡n táº¡i</span>}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                  </div>{/* close action group */}
                </div>

                {/* Quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                  <Stat icon={<Calendar size={16} />} label="Báº¯t Ä‘áº§u" value={fmt(detail.startDate)} />
                  <Stat icon={<Calendar size={16} />} label="Káº¿t thÃºc" value={fmt(detail.endDate)} />
                  <Stat icon={<Clock size={16} />} label="Sá»‘ tuáº§n" value={`${weekCount} tuáº§n`} />
                  <Stat icon={<Users size={16} />} label="Sá»‘ nhÃ³m" value={`${detail.groupCount}`} />
                </div>
              </div>

              {/* Timeline chia theo tuáº§n â€” khi drawer má»Ÿ, elevate z-index Ä‘á»ƒ timeline KHÃ”NG bá»‹ blur backdrop */}
              <div
                className="glass-card"
                ref={timelineRef}
                style={{
                  scrollMarginTop: 12,
                  ...(milestoneMode !== null || showAddHoliday
                    ? {
                        position: 'relative',
                        zIndex: 950,
                      }
                    : {}),
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Trá»¥c thá»i gian (theo {tlMode === 'week' ? 'tuáº§n' : 'thÃ¡ng'})</h3>
                  {/* Toggle Week / Month â€” gá»n hÆ¡n, fit screen */}
                  <div style={{ display: 'inline-flex', border: '1px solid var(--border-glass)', borderRadius: 8, overflow: 'hidden' }}>
                    {(['week', 'month'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setTlMode(mode)}
                        style={{
                          padding: '0.35rem 0.85rem', fontSize: '0.8rem',
                          background: tlMode === mode ? 'var(--accent-primary)' : 'transparent',
                          color: tlMode === mode ? 'white' : 'var(--text-secondary)',
                          border: 'none', cursor: 'pointer', transition: 'background 0.05s',
                        }}
                      >
                        {mode === 'week' ? 'Tuáº§n' : 'ThÃ¡ng'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Container cÃ³ scroll ngang náº¿u nhiá»u tuáº§n */}
                <div style={{ overflowX: 'auto', paddingTop: '36px', paddingBottom: '0.25rem', marginTop: '-12px' }}>
                  {(() => {
                    // === TÃ¬m ká»³ trÆ°á»›c & sau (chá»‰ á»Ÿ mode 'month' Ä‘á»ƒ cÃ³ context khÃ´ng gian rá»™ng hÆ¡n) ===
                    // list Ä‘Ã£ sort desc(Year+Season) -> prev (lÃ¹i thá»i gian) á»Ÿ idx+1, next (tiáº¿n) á»Ÿ idx-1
                    const showAdjacent = tlMode === 'month';
                    const idx = showAdjacent ? list.findIndex(s => s.id === detail.id) : -1;
                    const prevSem = showAdjacent && idx >= 0 ? list[idx + 1] : null;     // ká»³ liá»n trÆ°á»›c trong thá»i gian
                    const nextSem = showAdjacent && idx >= 0 ? list[idx - 1] : null;     // ká»³ liá»n sau trong thá»i gian
                    const semStartISO = detail.startDate;
                    const semEndISO = detail.endDate;

                    // === Display range: tráº£i rá»™ng náº¿u cÃ³ prev/next ===
                    const displayStart = prevSem ? new Date(prevSem.startDate) : new Date(semStartISO);
                    const displayEnd = nextSem ? new Date(nextSem.endDate) : new Date(semEndISO);
                    const displayDays = Math.max(1, daysBetween(displayStart.toISOString().slice(0,10), displayEnd.toISOString().slice(0,10)) + 1);
                    const today = new Date();
                    const todayLabel = today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const todayOffset = (today.getTime() - displayStart.getTime()) / 86400000;
                    const todayLeftPct = (todayOffset / displayDays) * 100;

                    const daysDiff = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

                    // Helper tÃ­nh %left vÃ  %width cho 1 segment dá»±a trÃªn 2 má»‘c ISO
                    const segPct = (sISO: string, eISO: string) => {
                      const sOffset = daysDiff(displayStart.toISOString().slice(0, 10), sISO.slice(0, 10));
                      const eOffset = daysDiff(displayStart.toISOString().slice(0, 10), eISO.slice(0, 10));
                      return { leftPct: (sOffset / displayDays) * 100, widthPct: ((eOffset - sOffset) / displayDays) * 100 };
                    };

                    // === Tick generation theo mode ===
                    // 'week': má»—i 7 ngÃ y 1 tick, label = dd/MM
                    // 'month': má»—i thÃ¡ng 1 tick (Ä‘áº§u thÃ¡ng Ä‘áº§u tiÃªn trong ká»³), label = MM/YYYY â€” Ã­t cá»™t, fit screen
                    let ticks: Date[];
                    let tickLabelFn: (d: Date) => string;
                    let MIN_COL: number;
                    if (tlMode === 'week') {
                      const wc = Math.ceil(displayDays / 7);
                      ticks = Array.from({ length: wc }, (_, i) => new Date(displayStart.getTime() + i * 7 * 86400000));
                      tickLabelFn = (d) => fmtShort(d);
                      MIN_COL = 70;
                    } else {
                      const ms: Date[] = [];
                      let cur = new Date(displayStart.getFullYear(), displayStart.getMonth(), 1);
                      while (cur <= displayEnd) { ms.push(new Date(cur)); cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1); }
                      ticks = ms;
                      tickLabelFn = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                      MIN_COL = 100;
                    }
                    const tickCount = ticks.length;
                    const trackWidth = Math.max(tickCount * MIN_COL, 600);
                    const pxPerDay = trackWidth / displayDays;

                    // Helper tÃ­nh %left vÃ  %width cho 1 item, clip 0-100
                    const positionItem = (itemStart: string, itemDurationDays: number) => {
                      const startOffset = daysDiff(displayStart.toISOString().slice(0,10), itemStart.slice(0,10));
                      const endOffset = startOffset + itemDurationDays;
                      const clippedStart = Math.max(0, startOffset);
                      const clippedEnd = Math.min(displayDays, endOffset);
                      if (clippedEnd <= clippedStart) return null;   // ngoÃ i range
                      const leftPct = (clippedStart / displayDays) * 100;
                      const widthPct = Math.max(0.8, ((clippedEnd - clippedStart) / displayDays) * 100);
                      return { leftPct, widthPct, isClippedLeft: startOffset < 0, isClippedRight: endOffset > displayDays };
                    };

                    return (
                      <div style={{ minWidth: trackWidth, position: 'relative', marginTop: 12, marginBottom: 12 }}>
                        {/* Current Date Indicator (spanning across lanes) */}
                        {todayLeftPct >= 0 && todayLeftPct <= 100 && (
                          <div 
                            className="today-hitbox"
                            style={{
                              position: 'absolute', top: -8, bottom: -8, left: `${todayLeftPct}%`,
                              width: 16, transform: 'translateX(-8px)', zIndex: 100, cursor: 'pointer',
                              display: 'flex', justifyContent: 'center'
                            }}>
                            <div className="today-indicator" style={{
                                width: 2, height: '100%', background: '#fbbf24', borderRadius: 2,
                                transition: 'all 0.2s ease', boxShadow: '0 0 6px rgba(251, 191, 36, 0.4)'
                            }} />
                            <div className="today-tooltip" style={{
                                position: 'absolute', top: '-34px', left: '50%', transform: 'translateX(-50%)',
                                background: '#fbbf24', color: '#18181b', fontWeight: 700, fontSize: '0.75rem', /* tÄƒng size chá»¯ 1 xÃ­u cho rÃµ */
                                padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap',
                                opacity: 0, visibility: 'hidden', marginTop: '4px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', pointerEvents: 'none',
                                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)', zIndex: 9999
                            }}>
                                HÃ´m nay: {todayLabel}
                                {/* MÅ©i tÃªn trá» xuá»‘ng cá»§a tooltip */}
                                <svg width="10" height="5" viewBox="0 0 10 5" style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)', fill: '#fbbf24' }}>
                                    <polygon points="0,0 5,5 10,0" />
                                </svg>
                            </div>
                          </div>
                        )}

                        {/* === LANE 1: HOLIDAY === */}
                        <div style={{ position: 'relative', height: '52px', background: 'var(--surface-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)', overflow: 'visible' }}>
                          {/* Segment ká»³ trÆ°á»›c (xÃ¡m má») â€” chá»‰ á»Ÿ mode 'month' */}
                          {prevSem && (() => {
                            const p = segPct(prevSem.startDate, prevSem.endDate);
                            return (
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${p.leftPct}%`, width: `${p.widthPct}%`,
                                background: 'linear-gradient(90deg, rgba(148,163,184,0.18), rgba(148,163,184,0.28))',
                                borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600,
                                pointerEvents: 'none',
                              }}>
                                â† {prevSem.code}
                              </div>
                            );
                          })()}
                          {/* Segment ká»³ hiá»‡n táº¡i (cam) */}
                          {(() => {
                            const p = segPct(semStartISO, semEndISO);
                            return (
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${p.leftPct}%`, width: `${p.widthPct}%`,
                                background: 'linear-gradient(90deg, rgba(251, 146, 60, 0.18), rgba(251, 146, 60, 0.32))',
                              }} />
                            );
                          })()}
                          {/* Segment ká»³ sau (xÃ¡m má») */}
                          {nextSem && (() => {
                            const p = segPct(nextSem.startDate, nextSem.endDate);
                            return (
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${p.leftPct}%`, width: `${p.widthPct}%`,
                                background: 'linear-gradient(90deg, rgba(148,163,184,0.18), rgba(148,163,184,0.28))',
                                borderTopRightRadius: 8, borderBottomRightRadius: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600,
                                pointerEvents: 'none',
                              }}>
                                {nextSem.code} â†’
                              </div>
                            );
                          })()}
                          {/* GAP indicator: giá»¯a prev & current */}
                          {prevSem && new Date(prevSem.endDate) < new Date(semStartISO) && (() => {
                            const p = segPct(prevSem.endDate, semStartISO);
                            if (p.widthPct < 0.5) return null;
                            return (
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${p.leftPct}%`, width: `${p.widthPct}%`,
                                background: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.08) 0px, rgba(239,68,68,0.08) 6px, transparent 6px, transparent 12px)',
                                border: '1px dashed rgba(239,68,68,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.62rem', color: 'var(--danger)', fontWeight: 700,
                                pointerEvents: 'none',
                              }} title={`Gap ${daysBetween(prevSem.endDate.slice(0,10), semStartISO.slice(0,10))} ngÃ y giá»¯a ${prevSem.code} vÃ  ${detail.code}`}>
                                {p.widthPct > 3 ? `gap ${daysBetween(prevSem.endDate.slice(0,10), semStartISO.slice(0,10))}d` : ''}
                              </div>
                            );
                          })()}
                          {/* GAP indicator: giá»¯a current & next */}
                          {nextSem && new Date(semEndISO) < new Date(nextSem.startDate) && (() => {
                            const p = segPct(semEndISO, nextSem.startDate);
                            if (p.widthPct < 0.5) return null;
                            return (
                              <div style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${p.leftPct}%`, width: `${p.widthPct}%`,
                                background: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.08) 0px, rgba(239,68,68,0.08) 6px, transparent 6px, transparent 12px)',
                                border: '1px dashed rgba(239,68,68,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.62rem', color: 'var(--danger)', fontWeight: 700,
                                pointerEvents: 'none',
                              }} title={`Gap ${daysBetween(semEndISO.slice(0,10), nextSem.startDate.slice(0,10))} ngÃ y giá»¯a ${detail.code} vÃ  ${nextSem.code}`}>
                                {p.widthPct > 3 ? `gap ${daysBetween(semEndISO.slice(0,10), nextSem.startDate.slice(0,10))}d` : ''}
                              </div>
                            );
                          })()}
                          {/* ÄÆ°á»ng chia tick â€” tÃ­nh % theo offset ngÃ y tháº­t (chuáº©n cho cáº£ week & month mode) */}
                          {ticks.slice(1).map((t, i) => {
                            const offset = (t.getTime() - displayStart.getTime()) / 86400000;
                            const leftPct = (offset / displayDays) * 100;
                            return (
                              <div key={i} style={{
                                position: 'absolute', top: 0, bottom: 0,
                                left: `${leftPct}%`, width: 1,
                                background: 'var(--border-glass)',
                              }} />
                            );
                          })}
                          {/* Preview block (realtime tá»« form Add Holiday) */}
                          {previewHoliday && (() => {
                            const pos = positionItem(previewHoliday.startDate, previewHoliday.durationDays);
                            if (!pos) return null;
                            return (
                              <div
                                title={`Preview: ${previewHoliday.label} (${previewHoliday.durationDays}d${previewHoliday.isCompensated ? ', cÃ³ bÃ¹' : ''})`}
                                style={{
                                  position: 'absolute', top: 0, bottom: 0,
                                  left: `${pos.leftPct}%`, width: `${pos.widthPct}%`,
                                  transition: 'left 0.3s ease, width 0.3s ease',
                                  background: 'rgba(168, 85, 247, 0.4)',                // tÃ­m dashed -> phÃ¢n biá»‡t vá»›i data tháº­t
                                  border: '2px dashed #a855f7',
                                  borderRadius: 4, zIndex: 5,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.65rem', color: 'white', fontWeight: 700,
                                  pointerEvents: 'none', overflow: 'hidden', whiteSpace: 'nowrap',
                                }}
                              >
                                {pos.widthPct > 5 ? 'ðŸ‘ Preview' : ''}
                              </div>
                            );
                          })()}
                          {/* Holiday overlays â€” drag-to-resize */}
                          {holidays.map(h => {
                            const eff = effective(h);
                            const pos = positionItem(eff.startDate, eff.durationDays);
                            if (!pos) return null;                            // khÃ´ng hiá»ƒn thá»‹ náº¿u ngoÃ i range thÃ¡ng
                            const leftPct = pos.leftPct;
                            const widthPct = pos.widthPct;
                            const isDragging = dragState?.holidayId === h.id;
                            const isDirty = !!dirtyEdits[h.id] || isDragging;
                            const endDateISO = addDaysISO(eff.startDate, eff.durationDays);
                            return (
                              <div
                                key={h.id}
                                onMouseEnter={() => setHoveredHoliday(h.id)}
                                onMouseLeave={() => setHoveredHoliday(prev => (prev === h.id ? null : prev))}
                                style={{
                                  position: 'absolute', top: 0, bottom: 0,
                                  left: `${leftPct}%`, width: `${widthPct}%`,
                                  background: isDirty ? 'rgba(245, 158, 11, 0.55)' : 'rgba(239, 68, 68, 0.55)',
                                  borderLeft: '2px solid', borderRight: '2px solid',
                                  borderColor: isDirty ? 'var(--warning)' : 'var(--danger)',
                                  cursor: 'default',
                                  transition: dragState ? 'none' : 'left 0.3s ease, width 0.3s ease, background 0.2s',
                                }}
                              >
                                {/* Left edge handle */}
                                <div
                                  onMouseDown={(ev) => {
                                    ev.preventDefault();
                                    setDragState({
                                      holidayId: h.id, edge: 'left',
                                      startX: ev.clientX, pxPerDay,
                                      origStart: eff.startDate.slice(0, 10),
                                      origDuration: eff.durationDays,
                                      liveStart: eff.startDate.slice(0, 10),
                                      liveDuration: eff.durationDays,
                                    });
                                  }}
                                  style={{
                                    position: 'absolute', top: 0, bottom: 0, left: -4, width: 10,
                                    cursor: 'ew-resize', zIndex: 2,
                                  }}
                                  className="holiday-edge"
                                />
                                {/* Right edge handle */}
                                <div
                                  onMouseDown={(ev) => {
                                    ev.preventDefault();
                                    setDragState({
                                      holidayId: h.id, edge: 'right',
                                      startX: ev.clientX, pxPerDay,
                                      origStart: eff.startDate.slice(0, 10),
                                      origDuration: eff.durationDays,
                                      liveStart: eff.startDate.slice(0, 10),
                                      liveDuration: eff.durationDays,
                                    });
                                  }}
                                  style={{
                                    position: 'absolute', top: 0, bottom: 0, right: -4, width: 10,
                                    cursor: 'ew-resize', zIndex: 2,
                                  }}
                                  className="holiday-edge"
                                />
                                {/* Tooltip detail khi hover/drag */}
                                {(hoveredHoliday === h.id || isDragging) && (
                                  <div style={{
                                    position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                                    background: 'var(--surface-elevated, #1e293b)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: 8, padding: '0.5rem 0.75rem',
                                    fontSize: '0.72rem', color: 'var(--text-primary)',
                                    boxShadow: 'var(--shadow-lg)',
                                    whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
                                  }}>
                                    <div style={{ fontWeight: 700, marginBottom: '0.15rem' }}>{h.label}</div>
                                    <div>ðŸ“… {fmt(eff.startDate)} to {fmt(endDateISO)}</div>
                                    <div>â± {eff.durationDays} ngÃ y {h.isCompensated ? '(cÃ³ bÃ¹)' : '(khÃ´ng bÃ¹)'}</div>
                                    {isDirty && <div style={{ color: 'var(--warning)', marginTop: '0.15rem' }}>â— ChÆ°a lÆ°u</div>}
                                  </div>
                                )}
                                {/* Floating date label khi drag */}
                                {isDragging && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '50%', transform: 'translateY(-50%)',
                                    [dragState!.edge === 'left' ? 'left' : 'right']: -52,
                                    background: 'var(--accent-primary)', color: 'white',
                                    padding: '0.2rem 0.45rem', borderRadius: 4,
                                    fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
                                    pointerEvents: 'none', zIndex: 11,
                                  }}>
                                    {dragState!.edge === 'left' ? fmtShort(new Date(eff.startDate)) : fmtShort(new Date(endDateISO))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* === LANE 2: MILESTONE === */}
                        <div style={{
                          position: 'relative', height: '40px', marginTop: '0.4rem',
                          background: 'var(--surface-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)',
                          overflow: 'visible',
                        }}>
                          {/* Tick line cÃ¹ng vá»‹ trÃ­ (tÃ­nh theo offset ngÃ y tháº­t) */}
                          {ticks.slice(1).map((t, i) => {
                            const offset = (t.getTime() - displayStart.getTime()) / 86400000;
                            const leftPct = (offset / displayDays) * 100;
                            return (
                              <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${leftPct}%`, width: 1, background: 'var(--border-glass)' }} />
                            );
                          })}
                          {/* Preview milestone block (realtime tá»« form) */}
                          {previewMilestone && (() => {
                            const dur = Math.max(1, daysBetween(previewMilestone.windowStart, previewMilestone.windowEnd));
                            const pos = positionItem(previewMilestone.windowStart, dur);
                            if (!pos) return null;
                            const isReview = previewMilestone.type === 'Review';
                            return (
                              <div
                                title={`Preview: ${previewMilestone.label} (${dur}d)`}
                                style={{
                                  position: 'absolute', top: 4, bottom: 4,
                                  left: `${pos.leftPct}%`, width: `${pos.widthPct}%`,
                                  transition: 'left 0.3s ease, width 0.3s ease',
                                  background: isReview ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                                  border: `2px dashed ${isReview ? '#3b82f6' : '#10b981'}`,
                                  borderRadius: 4, zIndex: 5,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.65rem', color: 'white', fontWeight: 700,
                                  pointerEvents: 'none', overflow: 'hidden', whiteSpace: 'nowrap',
                                }}
                              >
                                {pos.widthPct > 5 ? `ðŸ‘ ${previewMilestone.label}` : 'ðŸ‘'}
                              </div>
                            );
                          })()}
                          {/* Render Táº¤T Cáº¢ block milestone theo template chuáº©n */}
                          {allReviews.filter(m => m.id !== previewMilestone?.hiddenId).map(m => {
                            const dur = Math.max(1, daysBetween(m.windowStart.slice(0, 10), m.windowEnd.slice(0, 10)));
                            const pos = positionItem(m.windowStart, dur);
                            if (!pos) return null;
                            
                            // PhÃ¢n mÃ u thá»‘ng nháº¥t theo Legend á»Ÿ dÆ°á»›i (Review = Blue, Defence = Green, Out of scope = Gray)
                            const isCurrentSem = m.semesterId === detail.id;
                            let color = 'rgba(148, 163, 184, 0.25)';
                            let borderColor = '#94a3b8';
                            
                            if (isCurrentSem) {
                              if (m.type === 'Review') {
                                color = 'rgba(59, 130, 246, 0.55)';
                                borderColor = '#3b82f6';
                              } else if (m.type === 'Defence') {
                                color = 'rgba(16, 185, 129, 0.55)';
                                borderColor = '#10b981';
                              }
                            } else {
                              color = 'rgba(148, 163, 184, 0.25)';
                              borderColor = 'rgba(148, 163, 184, 0.6)';
                            }

                            const homeSem = list.find(s => s.id === m.semesterId);
                            const tLabel = `${m.label}${homeSem ? ` (ká»³ ${homeSem.code})` : ''}: ${fmt(m.windowStart)} â†’ ${fmt(m.windowEnd)}${m.note ? ` â€¢ ${m.note}` : ''}`;
                            return (
                              <div
                                key={m.id}
                                className="milestone-item"
                                style={{
                                  position: 'absolute', top: 4, bottom: 4,
                                  left: `${pos.leftPct}%`, width: `${pos.widthPct}%`,
                                  transition: 'left 0.3s ease, width 0.3s ease, background 0.3s ease',
                                  background: color,
                                  borderLeft: `2px solid ${borderColor}`,
                                  borderRight: pos.isClippedRight ? `2px dashed ${borderColor}` : `2px solid ${borderColor}`,
                                  borderRadius: 4,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.65rem', color: 'white', fontWeight: 700,
                                  cursor: 'pointer', whiteSpace: 'nowrap',
                                }}
                              >
                                <div style={{ overflow: 'hidden', width: '100%', textOverflow: 'ellipsis', textAlign: 'center' }}>
                                    {pos.widthPct > 5 ? m.label : ''}
                                </div>
                                <div className="milestone-tooltip" style={{
                                    position: 'absolute', top: '-34px', left: '50%', transform: 'translateX(-50%)',
                                    background: color, color: 'white', fontWeight: 700, fontSize: '0.75rem', 
                                    padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap',
                                    boxShadow: `0 4px 12px ${color}`, border: `1px solid ${borderColor}`,
                                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'
                                }}>
                                    {tLabel}
                                    <svg width="10" height="5" viewBox="0 0 10 5" style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)', fill: color }}>
                                        <polygon points="0,0 5,5 10,0" />
                                    </svg>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Tick row â€” label theo mode (dd/MM hoáº·c MM/YYYY) */}
                        <div style={{ display: 'flex', marginTop: '0.4rem', position: 'relative' }}>
                          {ticks.map((d, i) => {
                            // TÃ­nh flex weight theo Ä‘á»™ rá»™ng tá»«ng tick (sá»‘ ngÃ y)
                            const next = i < ticks.length - 1 ? ticks[i + 1] : displayEnd;
                            const days = Math.max(1, (next.getTime() - d.getTime()) / 86400000);
                            return (
                              <div key={i} style={{
                                flex: days, minWidth: 0,
                                borderLeft: i === 0 ? 'none' : '1px dashed var(--border-glass)',
                                textAlign: 'center',
                                fontSize: '0.7rem',
                                color: 'var(--text-secondary)',
                                padding: '0.25rem 0',
                              }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tickLabelFn(d)}</div>
                                {tlMode === 'week' && <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>Tuáº§n {i + 1}</div>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ChÃº thÃ­ch + Save bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(251, 146, 60, 0.32)' }} /> Khoáº£ng há»c
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(239, 68, 68, 0.55)' }} /> NgÃ y nghá»‰
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(59, 130, 246, 0.55)' }} /> Review
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(16, 185, 129, 0.55)' }} /> Defence
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(148, 163, 184, 0.25)', border: '1px solid rgba(148,163,184,0.6)' }} /> NgoÃ i ká»³ Ä‘ang xem
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(245, 158, 11, 0.55)' }} /> ChÆ°a lÆ°u
                    </span>
                  </div>

                  {/* Save / Discard pending edits â€” kÃ¨m warning chip náº¿u cÃ³ dirty */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {hasDirty && (
                      <span
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.25rem 0.6rem', borderRadius: '999px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: 'var(--warning)',
                          fontSize: '0.72rem', fontWeight: 600,
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          animation: 'pulse-warn 1.5s ease-in-out infinite',
                        }}
                        title="Báº¡n cÃ³ thay Ä‘á»•i chÆ°a lÆ°u â€” nháº¥n 'LÆ°u thay Ä‘á»•i' Ä‘á»ƒ Ã¡p dá»¥ng"
                      >
                        â— {Object.keys(dirtyEdits).length} thay Ä‘á»•i chÆ°a lÆ°u
                      </span>
                    )}
                    <button
                      onClick={handleDiscardEdits}
                      disabled={!hasDirty || savingEdits}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', opacity: hasDirty ? 1 : 0.4, cursor: hasDirty ? 'pointer' : 'not-allowed' }}
                    >
                      Há»§y thay Ä‘á»•i
                    </button>
                    <button
                      onClick={handleSaveEdits}
                      disabled={!hasDirty || savingEdits}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', opacity: hasDirty ? 1 : 0.5, cursor: hasDirty ? 'pointer' : 'not-allowed' }}
                    >
                      {savingEdits ? <><Loader2 size={14} className="spin" /> Äang lÆ°u...</> : `LÆ°u thay Ä‘á»•i${hasDirty ? ` (${Object.keys(dirtyEdits).length})` : ''}`}
                    </button>
                  </div>
                </div>

                {/* CSS handle hover effect â€” sÃ¡ng/Ä‘áº­m khi rÃª gáº§n cáº¡nh */}
                <style>{`
                  .holiday-edge { background: transparent; transition: background 0.05s, box-shadow 0.05s; }
                  .holiday-edge:hover { background: rgba(255,255,255,0.55); box-shadow: 0 0 8px rgba(251,146,60,0.7); }
                  @keyframes pulse-warn { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
                `}</style>
              </div>

              {/* Wrapper column-reverse: hiá»ƒn thá»‹ Review/Defence TRÆ¯á»šC, Holidays SAU (lá»‹ch nghá»‰ Ã­t dÃ¹ng â†’ Ä‘áº©y xuá»‘ng) */}
              <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '1.25rem' }}>
              {/* Holidays table */}
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-glass)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} color="var(--warning)" />
                    <h3 style={{ margin: 0 }}>Danh sÃ¡ch ngÃ y nghá»‰ ({holidays.length})</h3>
                  </div>
                  <button className="btn btn-primary" onClick={openAddHoliday} style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                    <Plus size={14} /> ThÃªm ngÃ y nghá»‰
                  </button>
                </div>
                {holidays.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Ká»³ há»c nÃ y chÆ°a cÃ³ ngÃ y nghá»‰. Báº¥m "ThÃªm ngÃ y nghá»‰" Ä‘á»ƒ chá»n tá»« lá»… chuáº©n hoáº·c táº¡o má»›i.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>TÃªn dá»‹p</th>
                          <th>NgÃ y báº¯t Ä‘áº§u</th>
                          <th>Sá»‘ ngÃ y</th>
                          <th>BÃ¹ lá»‹ch</th>
                          <th style={{ textAlign: 'right' }}>Thao tÃ¡c</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holidays.map(h => {
                          const eff = effective(h);
                          const isDirty = !!dirtyEdits[h.id];
                          return (
                          <tr key={h.id} style={isDirty ? { background: 'rgba(245, 158, 11, 0.06)' } : undefined}>
                            <td>
                              {h.label}
                              {h.templateId && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', color: 'var(--text-secondary)', fontStyle: 'italic' }} title={`Template #${h.templateId}`}>
                                  (tá»« template)
                                </span>
                              )}
                              {isDirty && <span className="badge badge-warning" style={{ marginLeft: '0.5rem', fontSize: '0.6rem' }}>ChÆ°a lÆ°u</span>}
                            </td>
                            <td>{fmt(eff.startDate)}</td>
                            <td>{eff.durationDays} ngÃ y</td>
                            <td>
                              <span className={`badge ${h.isCompensated ? 'badge-success' : 'badge-warning'}`}>
                                {h.isCompensated ? 'CÃ³ bÃ¹' : 'KhÃ´ng bÃ¹'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
                                onClick={() => handleDeleteHoliday(h)}
                                title="XÃ³a khá»i ká»³ há»c"
                              >
                                <X size={13} /> XÃ³a
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Card Lá»‹ch Review / Defence */}
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-glass)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} color="var(--accent-primary)" />
                    <h3 style={{ margin: 0 }}>Lá»‹ch Review / Defence ({milestones.length})</h3>
                  </div>
                  <button className="btn btn-primary" onClick={openCreateMilestone} style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                    <Plus size={14} /> ThÃªm lá»‹ch review/defence
                  </button>
                </div>
                {milestones.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    ChÆ°a cÃ³ lá»‹ch review/defence. Admin tá»± thÃªm theo nhu cáº§u (vd Review 1 tá»« 21/5 +2w).
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Loáº¡i</th>
                          <th>NgÃ y</th>
                          <th>Sá»‘ ngÃ y</th>
                          <th>Tráº¡ng thÃ¡i</th>
                          <th>Ká»³ gá»‘c</th>
                          <th>Ghi chÃº</th>
                          <th style={{ textAlign: 'right' }}>Thao tÃ¡c</th>
                        </tr>
                      </thead>
                      <tbody>
                        {milestones.map(m => {
                          const dur = Math.max(1, daysBetween(m.windowStart.slice(0,10), m.windowEnd.slice(0,10)));
                          const isOverflow = detail && new Date(m.windowEnd) > new Date(detail.endDate);
                          // TÃ¬m ká»³ chá»©a windowEnd Ä‘á»ƒ hiá»‡n "â†’ <code ká»³>" khi váº¯t biÃªn (vd â†’ FA26)
                          const overflowToSem = isOverflow
                            ? list.find(s =>
                                new Date(m.windowEnd) >= new Date(s.startDate) &&
                                new Date(m.windowEnd) <= new Date(s.endDate))
                            : null;
                          // m.semesterId lÃ  ká»³ "home" â€” cÃ³ thá»ƒ khÃ¡c semester Ä‘ang xem (vÃ¬ query overlap)
                          const isHomeSemester = detail && m.semesterId === detail.id;
                          const homeSem = list.find(s => s.id === m.semesterId);
                          const stMeta = REVIEW_STATUS_META[m.status ?? 'Draft'];
                          
                          // PhÃ¢n mÃ u thá»‘ng nháº¥t theo Legend á»Ÿ dÆ°á»›i (Review = Blue, Defence = Green, Out of scope = Gray)
                          let color = 'rgba(148, 163, 184, 0.25)';
                          let borderColor = '#94a3b8';
                          
                          if (isHomeSemester) {
                            if (m.type === 'Review') {
                              color = 'rgba(59, 130, 246, 0.55)';
                              borderColor = '#3b82f6';
                            } else if (m.type === 'Defence') {
                              color = 'rgba(16, 185, 129, 0.55)';
                              borderColor = '#10b981';
                            }
                          } else {
                            color = 'rgba(148, 163, 184, 0.25)';
                            borderColor = 'rgba(148, 163, 184, 0.6)';
                          }

                          return (
                          <tr key={m.id} style={!isHomeSemester ? { background: 'rgba(148, 163, 184, 0.04)' } : undefined}>
                            <td>
                              <span className="badge" style={{
                                background: color,
                                color: 'white',
                                border: `1px solid ${borderColor}`,
                                fontWeight: 700
                              }}>
                                {m.label}
                              </span>
                              {isOverflow && (
                                <span
                                  className="badge badge-warning"
                                  style={{ marginLeft: '0.4rem', fontSize: '0.6rem' }}
                                  title={overflowToSem
                                    ? `Window kÃ©o dÃ i sang ká»³ ${overflowToSem.code}`
                                    : 'Window vÆ°á»£t khá»i ká»³ há»c nÃ y'}
                                >
                                  â†’ {overflowToSem?.code ?? 'TrÃ n ká»³'}
                                </span>
                              )}
                            </td>
                            <td>{fmt(m.windowStart)} â†’ {fmt(m.windowEnd)}</td>
                            <td>{dur} ngÃ y</td>
                            <td>
                              <span className="badge" style={stMeta.style}>{stMeta.label}</span>
                            </td>
                            <td>
                              {isHomeSemester
                                ? <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(ká»³ nÃ y)</span>
                                : <span className="badge" style={{ background: 'rgba(148, 163, 184, 0.12)', color: 'var(--text-secondary)', fontSize: '0.7rem' }} title="Review thuá»™c ká»³ khÃ¡c nhÆ°ng overlap vá»›i ká»³ Ä‘ang xem">
                                    {homeSem?.code ?? `#${m.semesterId}`}
                                  </span>}
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{m.note || 'â€”'}</td>
                            <td style={{ textAlign: 'right', position: 'relative' }}>
                              <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {/* NÃºt chuyá»ƒn tráº¡ng thÃ¡i tiáº¿p theo */}
                                {(() => {
                                  const cfg = REVIEW_NEXT_STATUS[m.status ?? 'Draft'];
                                  if (!cfg) return null;
                                  const isDraftAdvance = (m.status ?? 'Draft') === 'Draft';
                                  return (
                                    <span
                                      style={{ display: 'inline-flex' }}
                                      onMouseEnter={() => { if (isDraftAdvance) setHoverMilestoneId(m.id); }}
                                      onMouseLeave={() => { if (hoverMilestoneId === m.id) setHoverMilestoneId(null); }}
                                    >
                                      <button
                                        className="btn btn-primary"
                                        style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                                        onClick={() => handleChangeReviewStatus(m, cfg.next)}
                                        title={cfg.title}
                                      >
                                        {cfg.label}
                                      </button>
                                    </span>
                                  );
                                })()}
                                {/* Draft: nÃºt Sá»­a + XÃ³a thay cho Há»§y bá» */}
                                {(m.status ?? 'Draft') === 'Draft' && (
                                  <>
                                    <button
                                      className="btn btn-secondary"
                                      style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                                      onClick={() => openEditMilestone(m)}
                                    >
                                      Sá»­a
                                    </button>
                                    <button
                                      className="btn btn-secondary"
                                      style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
                                      onClick={() => handleDeleteMilestone(m)}
                                    >
                                      <X size={13} /> XÃ³a
                                    </button>
                                  </>
                                )}
                                {/* Registering trá»Ÿ Ä‘i: nÃºt Há»§y bá» (â†’ Cancelled) */}
                                {(['Registering', 'Registered', 'Ongoing'] as ReviewStatus[]).includes(m.status ?? 'Draft') && (
                                  <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
                                    onClick={() => handleCancelMilestone(m)}
                                    title="Há»§y bá» Ä‘á»£t review â€” chuyá»ƒn sang Cancelled"
                                  >
                                    Há»§y bá»
                                  </button>
                                )}
                              </div>
                              {/* Tooltip popup khi hover nÃºt "Báº¯t Ä‘áº§u" (Draftâ†’Registering) */}
                              {hoverMilestoneId === m.id && (m.status ?? 'Draft') === 'Draft' && (
                                <div style={{
                                  position: 'absolute',
                                  right: 'calc(100% + 8px)',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'var(--surface-glass)',
                                  border: '1px solid var(--border-glass)',
                                  padding: '0.6rem 0.75rem',
                                  borderRadius: 8,
                                  boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
                                  width: 260,
                                  zIndex: 40,
                                }}>
                                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{m.label}</div>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>{fmt(m.windowStart)} â†’ {fmt(m.windowEnd)}</div>
                                  <div style={{ fontSize: '0.82rem', color: 'var(--warning)' }}>âš  Sau khi báº¯t Ä‘áº§u, khÃ´ng thá»ƒ chá»‰nh sá»­a thÃ´ng tin Ä‘á»£t review ná»¯a.</div>
                                </div>
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              </div>{/* /Wrapper column-reverse */}
            </>
          )}
        </div>
      </div>

      {/* Confirm popup dÃ¹ng chung â€” thay window.confirm/alert */}
      {confirmState && (() => {
        const variant = confirmState.variant ?? 'warning';
        const accent =
          variant === 'danger'  ? 'var(--danger)' :
          variant === 'info'    ? 'var(--accent-primary)' :
                                  'var(--warning)';
        const accentBg =
          variant === 'danger'  ? 'rgba(239, 68, 68, 0.12)' :
          variant === 'info'    ? 'rgba(251, 146, 60, 0.12)' :
                                  'rgba(245, 158, 11, 0.12)';
        return (
          <div
            onClick={closeConfirm}
            style={{
              position: 'fixed', inset: 0, zIndex: 1100,
              background: 'var(--modal-overlay-bg)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              className="glass-panel animate-fade-in"
              style={{ width: '100%', maxWidth: 480, padding: 0, overflow: 'hidden', borderTop: `3px solid ${accent}` }}
            >
              {/* Header vá»›i icon + title */}
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', padding: '1.5rem 1.5rem 0.75rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: accentBg, color: accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <AlertCircle size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                    {confirmState.title}
                  </h3>
                  <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                    {confirmState.message}
                  </p>
                </div>
              </div>

              {/* Optional list */}
              {confirmState.lines && confirmState.lines.length > 0 && (
                <div style={{
                  margin: '0.75rem 1.5rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--surface-glass)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  maxHeight: '200px', overflowY: 'auto',
                  fontSize: '0.8rem', color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                }}>
                  {confirmState.lines.map((l, i) => (
                    <div key={i} style={{ padding: '0.2rem 0' }}>â€¢ {l}</div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{
                display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
                padding: '1rem 1.5rem 1.5rem',
                borderTop: '1px solid var(--border-glass)',
                marginTop: '1rem',
              }}>
                {confirmState.cancelLabel !== null && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeConfirm}
                    disabled={confirmBusy}
                  >
                    {confirmState.cancelLabel ?? 'Há»§y'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={runConfirm}
                  disabled={confirmBusy}
                  style={variant === 'danger' ? { background: 'var(--danger)' } : undefined}
                >
                  {confirmBusy ? <><Loader2 size={16} className="spin" /> Äang xá»­ lÃ½...</> : (confirmState.confirmLabel ?? 'XÃ¡c nháº­n')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Popup Add/Edit Milestone */}
      {milestoneMode !== null && detail && (
        <>
          {/* Lá»›p backdrop má» á»Ÿ dÆ°á»›i (zIndex: 800) Ä‘á»ƒ div timeline (zIndex: 950) ná»•i lÃªn trÃªn vÃ  khÃ´ng bá»‹ má» */}
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 800,
              background: 'var(--modal-overlay-bg)', backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)', pointerEvents: 'none',
            }}
          />
          {/* Lá»›p wrapper cho popup náº±m á»Ÿ zIndex: 1000 Ä‘á»ƒ báº¯t click ra ngoÃ i Ä‘Ã³ng popup */}
          <div
            onClick={() => setMilestoneMode(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000, 
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', 
              padding: '1rem', paddingBottom: '2rem',
            }}
          >
            <div
              className="glass-panel animate-fade-in"
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 820,
                padding: '1.5rem 1.5rem 1.25rem',
                maxHeight: '50vh',
                overflowY: 'auto',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.55)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                    {milestoneMode === 'new' ? 'ThÃªm lá»‹ch Review / Defence' : 'Sá»­a lá»‹ch Review / Defence'}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>
                    Preview hiá»ƒn thá»‹ realtime trÃªn timeline phÃ­a trÃªn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMilestoneMode(null)}
                  disabled={savingMs}
                  style={{
                    background: 'transparent', border: '1px solid var(--border-glass)',
                    color: 'var(--text-secondary)', padding: '0.3rem 0.55rem', borderRadius: 6,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.78rem',
                  }}
                  title="ÄÃ³ng"
                >
                  <X size={14} /> ÄÃ³ng
                </button>
              </div>

              <form onSubmit={handleSubmitMilestone}>
              {/* Row 1: Type + OrderIndex + Label (new) | Label only (edit) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: milestoneMode === 'new' ? '140px 100px 1fr' : '1fr',
                gap: '0.75rem',
                marginBottom: '0.65rem',
              }}>
                {milestoneMode === 'new' && (
                  <>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Loáº¡i *</label>
                      <select
                        className="input-field"
                        value={milestoneForm.type}
                        onChange={e => onTypeChange(e.target.value as MilestoneType)}
                      >
                        <option value="Review">Review</option>
                        <option value="Defence">Defence</option>
                      </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">STT *</label>
                      <input
                        type="number" required min={1} className="input-field"
                        value={milestoneForm.orderIndex}
                        onChange={e => setMilestoneForm({ ...milestoneForm, orderIndex: parseInt(e.target.value, 10) || 1 })}
                      />
                    </div>
                  </>
                )}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Label *</label>
                  <input
                    type="text" required className="input-field"
                    placeholder="VD: Review 1, Defence 2..."
                    value={milestoneForm.label}
                    onChange={e => setMilestoneForm({ ...milestoneForm, label: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: Start + End + Preset chips */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: '0.75rem',
                alignItems: 'end',
                marginBottom: '0.65rem',
              }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">NgÃ y báº¯t Ä‘áº§u *</label>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
                    <input
                      type="date" required className="input-field"
                      style={{ flex: 1, minWidth: 0 }}
                      min={detail.startDate.slice(0, 10)}
                      value={milestoneForm.windowStart}
                      onChange={e => {
                        const newStart = e.target.value;
                        // Guard: browser reject invalid (vd 31/6) â†’ "" â†’ giá»¯ state cÅ©.
                        // CÅ©ng cháº·n Chrome bug: spin year xuá»‘ng dÆ°á»›i min wrap vá» 275760.
                        if (!isReasonableDateISO(newStart)) return;
                        // Giá»¯ nguyÃªn khoáº£ng cÃ¡ch (gap) giá»¯a startâ†”end. VD gap=12 ngÃ y â†’ end shift theo start.
                        const oldStart = milestoneForm.windowStart;
                        const oldEnd = milestoneForm.windowEnd;
                        let newEnd = oldEnd;
                        if (oldStart && oldEnd) {
                          const gapDays = Math.round(
                            (new Date(oldEnd).getTime() - new Date(oldStart).getTime()) / 86400000
                          );
                          // Giá»¯ gap (ká»ƒ cáº£ 0 = window 1 ngÃ y). Chá»‰ fallback 7 ngÃ y khi gap Ã¢m (state lá»—i).
                          const gapToApply = gapDays >= 0 ? gapDays : 7;
                          newEnd = addDaysISO(newStart, gapToApply);
                        }
                        setMilestoneForm({ ...milestoneForm, windowStart: newStart, windowEnd: newEnd });
                      }}
                    />
                    {/* NÃºt dá»‹ch -1/+1 ngÃ y: dÃ¹ng JS Date â†’ tá»± rollover sang thÃ¡ng/nÄƒm káº¿ (xá»­ lÃ½ Ä‘Ãºng cuá»‘i thÃ¡ng + Feb nhuáº­n) */}
                    <button
                      type="button"
                      title="LÃ¹i 1 ngÃ y"
                      onClick={() => {
                        const old = milestoneForm.windowStart;
                        if (!old) return;
                        const newStart = shiftDateISO(old, -1);
                        const oldEnd = milestoneForm.windowEnd;
                        let newEnd = oldEnd;
                        if (oldEnd) {
                          const gapDays = Math.round((new Date(oldEnd).getTime() - new Date(old).getTime()) / 86400000);
                          const gap = gapDays >= 0 ? gapDays : 7;
                          newEnd = addDaysISO(newStart, gap);
                        }
                        setMilestoneForm({ ...milestoneForm, windowStart: newStart, windowEnd: newEnd });
                      }}
                      style={{
                        padding: '0 0.5rem', fontSize: '0.9rem', borderRadius: 6,
                        border: '1px solid var(--border-glass)', background: 'var(--surface-glass)',
                        color: 'var(--text-primary)', cursor: 'pointer',
                      }}
                    >âˆ’</button>
                    <button
                      type="button"
                      title="Tá»›i 1 ngÃ y (tá»± rollover sang thÃ¡ng káº¿)"
                      onClick={() => {
                        const old = milestoneForm.windowStart;
                        if (!old) return;
                        const newStart = shiftDateISO(old, 1);
                        const oldEnd = milestoneForm.windowEnd;
                        let newEnd = oldEnd;
                        if (oldEnd) {
                          const gapDays = Math.round((new Date(oldEnd).getTime() - new Date(old).getTime()) / 86400000);
                          const gap = gapDays >= 0 ? gapDays : 7;
                          newEnd = addDaysISO(newStart, gap);
                        }
                        setMilestoneForm({ ...milestoneForm, windowStart: newStart, windowEnd: newEnd });
                      }}
                      style={{
                        padding: '0 0.5rem', fontSize: '0.9rem', borderRadius: 6,
                        border: '1px solid var(--border-glass)', background: 'var(--surface-glass)',
                        color: 'var(--text-primary)', cursor: 'pointer',
                      }}
                    >+</button>
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">NgÃ y káº¿t thÃºc *</label>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
                    <input
                      type="date" required className="input-field"
                      style={{ flex: 1, minWidth: 0 }}
                      min={milestoneForm.windowStart}
                      value={milestoneForm.windowEnd}
                      onChange={e => {
                        const newEnd = e.target.value;
                        // Guard: invalid hoáº·c Chrome wrap year (275760) â†’ giá»¯ state cÅ©.
                        if (!isReasonableDateISO(newEnd)) return;
                        setMilestoneForm({ ...milestoneForm, windowEnd: newEnd });
                      }}
                    />
                    <button
                      type="button"
                      title="LÃ¹i 1 ngÃ y"
                      onClick={() => {
                        if (!milestoneForm.windowEnd) return;
                        setMilestoneForm({ ...milestoneForm, windowEnd: shiftDateISO(milestoneForm.windowEnd, -1) });
                      }}
                      style={{
                        padding: '0 0.5rem', fontSize: '0.9rem', borderRadius: 6,
                        border: '1px solid var(--border-glass)', background: 'var(--surface-glass)',
                        color: 'var(--text-primary)', cursor: 'pointer',
                      }}
                    >âˆ’</button>
                    <button
                      type="button"
                      title="Tá»›i 1 ngÃ y (tá»± rollover sang thÃ¡ng káº¿)"
                      onClick={() => {
                        if (!milestoneForm.windowEnd) return;
                        setMilestoneForm({ ...milestoneForm, windowEnd: shiftDateISO(milestoneForm.windowEnd, 1) });
                      }}
                      style={{
                        padding: '0 0.5rem', fontSize: '0.9rem', borderRadius: 6,
                        border: '1px solid var(--border-glass)', background: 'var(--surface-glass)',
                        color: 'var(--text-primary)', cursor: 'pointer',
                      }}
                    >+</button>
                  </div>
                </div>
                {/* Preset chips bÃªn pháº£i */}
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', paddingBottom: 6 }}>
                  {([{ w: 1, d: 7 }, { w: 2, d: 14 }, { w: 3, d: 21 }]).map(({ w, d }) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => {
                        if (!milestoneForm.windowStart) return;
                        setMilestoneForm({ ...milestoneForm, windowEnd: addWorkingDaysISO(milestoneForm.windowStart, d) });
                      }}
                      disabled={!milestoneForm.windowStart}
                      style={{
                        padding: '0.3rem 0.55rem', fontSize: '0.7rem', borderRadius: 999,
                        border: '1px solid var(--border-glass)', background: 'transparent',
                        color: 'var(--text-secondary)',
                        cursor: milestoneForm.windowStart ? 'pointer' : 'not-allowed',
                        opacity: milestoneForm.windowStart ? 1 : 0.4,
                        whiteSpace: 'nowrap',
                      }}
                      title={`${d} ngÃ y lÃ m viá»‡c â€” bá» qua Chá»§ Nháº­t`}
                    >
                      +{w} week
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Status + Note */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '260px 1fr',
                gap: '0.75rem',
                marginBottom: milestoneError ? '0.65rem' : '0.85rem',
              }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Tráº¡ng thÃ¡i *</label>
                  <select
                    className="input-field"
                    value={milestoneForm.status}
                    onChange={e => setMilestoneForm({ ...milestoneForm, status: e.target.value as ReviewStatus })}
                  >
                    <option value="Draft">ChÆ°a Ä‘Äƒng kÃ½ Ä‘Æ°á»£c</option>
                    <option value="Registering">Äang Ä‘Äƒng kÃ½</option>
                    <option value="Registered">ÄÃ£ chá»‘t slot</option>
                    <option value="Ongoing">Äang diá»…n ra</option>
                    <option value="Finished">ÄÃ£ xong</option>
                    <option value="Cancelled">ÄÃ£ há»§y</option>
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Ghi chÃº</label>
                  <input
                    type="text" className="input-field"
                    placeholder="VD: PhÃ²ng 305, online qua Teams..."
                    value={milestoneForm.note}
                    onChange={e => setMilestoneForm({ ...milestoneForm, note: e.target.value })}
                  />
                </div>
              </div>

              {milestoneError && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                  padding: '0.55rem 0.85rem', borderRadius: 8, fontSize: '0.82rem',
                  marginBottom: '0.75rem',
                }}>
                  <AlertCircle size={14} /> {milestoneError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMilestoneMode(null)} disabled={savingMs}>Há»§y</button>
                <button type="submit" className="btn btn-primary" disabled={savingMs}>
                  {savingMs ? <><Loader2 size={14} className="spin" /> Äang lÆ°u...</> : (milestoneMode === 'new' ? 'Táº¡o lá»‹ch' : 'LÆ°u thay Ä‘á»•i')}
                </button>
              </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Modal thÃªm ngÃ y nghá»‰ vÃ o ká»³ */}
      {showAddHoliday && detail && (
        <>
          {/* Lá»›p backdrop má» á»Ÿ dÆ°á»›i (zIndex: 800) Ä‘á»ƒ div timeline (zIndex: 950) ná»•i lÃªn trÃªn vÃ  khÃ´ng bá»‹ má» */}
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 800,
              background: 'var(--modal-overlay-bg)', backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)', pointerEvents: 'none',
            }}
          />
          {/* Lá»›p wrapper cho popup náº±m á»Ÿ zIndex: 1000 Ä‘á»ƒ báº¯t click ra ngoÃ i Ä‘Ã³ng popup */}
          <div
            onClick={() => setShowAddHoliday(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000, 
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', 
              padding: '1rem', paddingBottom: '2rem',
            }}
          >
            <div
              className="glass-panel animate-fade-in"
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 580,
                padding: '2rem',
                maxHeight: '50vh',
                overflowY: 'auto',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.55)',
              }}
            >
              <h2 style={{ marginBottom: '0.35rem', color: 'var(--text-primary)' }}>ThÃªm ngÃ y nghá»‰ vÃ o ká»³ há»c</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Tá»± nháº­p thÃ´ng tin ngÃ y nghá»‰ cho ká»³ há»c nÃ y.
              </p>

              <form onSubmit={handleAddHoliday}>
              <div className="input-group">
                <label className="input-label">TÃªn dá»‹p <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="text" required className="input-field"
                  placeholder="VD: Táº¿t NguyÃªn ÄÃ¡n, 30/4 - 1/5..."
                  value={holidayForm.label}
                  onChange={e => setHolidayForm({ ...holidayForm, label: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">NgÃ y báº¯t Ä‘áº§u <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="date" required className="input-field"
                    min={detail.startDate.slice(0, 10)}
                    max={detail.endDate.slice(0, 10)}
                    value={holidayForm.startDate}
                    onChange={e => setHolidayForm({ ...holidayForm, startDate: e.target.value })}
                  />
                  <small style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                    Pháº£i náº±m trong {fmt(detail.startDate)} â†’ {fmt(detail.endDate)}
                  </small>
                </div>
                <div className="input-group">
                  <label className="input-label">Sá»‘ ngÃ y nghá»‰ <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="number" required min={1} className="input-field"
                    value={holidayForm.durationDays}
                    onChange={e => setHolidayForm({ ...holidayForm, durationDays: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>

              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={holidayForm.isCompensated}
                    onChange={e => setHolidayForm({ ...holidayForm, isCompensated: e.target.checked })}
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>CÃ³ bÃ¹ lá»‹ch (ká»³ há»c sáº½ kÃ©o dÃ i thÃªm sá»‘ ngÃ y nghá»‰ nÃ y)</span>
                </label>
              </div>

              {holidayForm.templateId !== null && (
                <div style={{
                  padding: '0.65rem 0.9rem', background: 'rgba(251, 146, 60, 0.08)',
                  border: '1px solid rgba(251, 146, 60, 0.2)', borderRadius: '8px',
                  fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem',
                }}>
                  ðŸ’¡ NgÃ y nÃ y sáº½ Ä‘Æ°á»£c gáº¯n template, nhÆ°ng cÃ¡c giÃ¡ trá»‹ (ngÃ y/duration/bÃ¹) chá»‰ Ã¡p riÃªng cho ká»³ <strong style={{ color: 'var(--accent-primary)' }}>{detail.code}</strong>. Sá»­a template gá»‘c khÃ´ng áº£nh hÆ°á»Ÿng ká»³ nÃ y.
                </div>
              )}

              {holidayError && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}>
                  <AlertCircle size={16} /> {holidayError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddHoliday(false)} disabled={addingHoliday}>
                  Há»§y
                </button>
                <button type="submit" className="btn btn-primary" disabled={addingHoliday}>
                  {addingHoliday ? <><Loader2 size={16} className="spin" /> Äang thÃªm...</> : <><Plus size={16} /> ThÃªm ngÃ y nghá»‰</>}
                </button>
              </div>
            </form>
          </div>
        </div>
        </>
      )}

      {/* Modal táº¡o ká»³ há»c má»›i */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--modal-overlay-bg)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 520, padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Táº¡o ká»³ há»c má»›i</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Chá»n ká»³ vÃ  nÄƒm â€” há»‡ thá»‘ng gá»£i Ã½ sáºµn má»‘c thá»i gian, báº¡n cÃ³ thá»ƒ chá»‰nh tÃ¹y Ã½.
            </p>

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Ká»³</label>
                  <select
                    className="input-field"
                    value={createForm.season}
                    onChange={e => updateSeason(e.target.value as SemesterSeason)}
                  >
                    <option value="Spring">Há»c ká»³ XuÃ¢n (Spring)</option>
                    <option value="Summer">Há»c ká»³ HÃ¨ (Summer)</option>
                    <option value="Fall">Há»c ká»³ Thu (Fall)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">NÄƒm</label>
                  <input
                    type="number"
                    required
                    min={currentYear}
                    className="input-field"
                    value={createForm.year}
                    onChange={e => updateYear(parseInt(e.target.value, 10) || currentYear)}
                  />
                </div>
              </div>

              {/* Date range: chá»‰nh start â†’ end auto-ná»›i Ä‘á»§ 16w. Chá»‰nh end tay â†’ giá»¯ start, badge hiá»ƒn thá»‹ chÃªnh lá»‡ch. */}
              {(() => {
                const TARGET_DAYS = WEEKS_PER_SEMESTER * 7; // 112
                const gap = createForm.start && createForm.end
                  ? daysBetween(createForm.start, createForm.end)
                  : 0;
                const diff = gap - TARGET_DAYS;
                const gapLabel = !createForm.start || !createForm.end
                  ? 'â€”'
                  : diff === 0
                    ? `+ ${WEEKS_PER_SEMESTER}w`
                    : diff > 0
                      ? `+ ${WEEKS_PER_SEMESTER}w + ${diff}d`
                      : `+ ${WEEKS_PER_SEMESTER}w âˆ’ ${-diff}d`;
                const badgeColor = diff === 0 ? '#10b981' : diff > 0 ? '#0ea5e9' : '#ef4444';
                const badgeBg = diff === 0
                  ? 'rgba(16, 185, 129, 0.12)'
                  : diff > 0
                    ? 'rgba(14, 165, 233, 0.12)'
                    : 'rgba(239, 68, 68, 0.12)';
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'end', marginBottom: '1rem' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">NgÃ y báº¯t Ä‘áº§u</label>
                      <input
                        type="date" required className="input-field"
                        value={createForm.start}
                        onChange={e => {
                          const newStart = e.target.value;
                          if (newStart) {
                            // Auto-ná»›i end Ä‘á»ƒ Ä‘á»§ 16w tá»« start má»›i
                            const newEnd = toISO(addDays(new Date(newStart), TARGET_DAYS));
                            setCreateForm({ ...createForm, start: newStart, end: newEnd });
                          } else {
                            setCreateForm({ ...createForm, start: newStart });
                          }
                        }}
                      />
                    </div>
                    <div
                      style={{
                        padding: '0.4rem 0.7rem',
                        background: badgeBg,
                        border: `1px solid ${badgeColor}40`,
                        borderRadius: 6,
                        color: badgeColor,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        marginBottom: '0.5rem',
                        textAlign: 'center',
                        userSelect: 'none',
                      }}
                      title="Khoáº£ng cÃ¡ch giá»¯a ngÃ y báº¯t Ä‘áº§u vÃ  káº¿t thÃºc"
                    >
                      {gapLabel}
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">NgÃ y káº¿t thÃºc</label>
                      <input
                        type="date" required className="input-field"
                        value={createForm.end}
                        onChange={e => setCreateForm({ ...createForm, end: e.target.value })}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Preview code sáº½ Ä‘Æ°á»£c sinh ra (theo BE: Spring+2026 -> SP26) */}
              <div style={{
                padding: '0.75rem 1rem', background: 'rgba(251, 146, 60, 0.08)',
                border: '1px solid rgba(251, 146, 60, 0.2)', borderRadius: '8px',
                fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem',
              }}>
                MÃ£ sáº½ táº¡o: <strong style={{ color: 'var(--accent-primary)', fontFamily: 'monospace' }}>
                  {createForm.season === 'Spring' ? 'SP' : createForm.season === 'Summer' ? 'SU' : 'FA'}
                  {String(createForm.year).slice(-2)}
                </strong>
              </div>

              {createError && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}>
                  <AlertCircle size={16} /> {createError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)} disabled={saving}>
                  Há»§y
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spin" /> Äang táº¡o...</> : <><Plus size={16} /> Táº¡o ká»³ há»c</>}
                </button>
              </div>
            </form>
          </div>
          <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}
    </div>
  );
};

// Stat block nhá» dÃ¹ng trong header card
const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
      {icon} {label}
    </span>
    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{value}</strong>
  </div>
);

export default AdminSemesters;
```


## File: src\pages\AdminUsers.tsx
```typescript

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import type { UserListItem, UserDetailDto, ImportUsersResultDto } from '../types';
import {
  Search, UserCheck, UserX, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Plus, Eye, Mail, X,
  Loader2, CheckCircle, AlertTriangle, Users, Upload,
} from 'lucide-react';

type Toast = { type: 'success' | 'error'; message: string } | null;

// Badge class theo tá»«ng role flag
const roleBadge: Record<string, string> = {
  Admin:         'badge-danger',
  Lecturer:      'badge-info',
  StudentLeader: 'badge-success',
  GroupMember:   '',
};

// Hiá»ƒn thá»‹ má»™t hoáº·c nhiá»u badge cho user cÃ³ multi-role ("Admin, Lecturer")
const RoleBadges = ({ role }: { role: string }) => (
  <>
    {role.split(', ').map(r => (
      <span key={r} className={`badge ${roleBadge[r.trim()] ?? ''}`} style={{ marginRight: '0.25rem' }}>
        {r.trim()}
      </span>
    ))}
  </>
);

// â”€â”€â”€ Component phá»¥ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</p>
    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{value ?? 'â€”'}</div>
  </div>
);

// â”€â”€â”€ Toast Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ToastBar = ({ toast }: { toast: Toast }) => {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div style={{
      position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 2000,
      background: isSuccess ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
      border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
      borderRadius: '10px', padding: '0.75rem 1.25rem',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      color: isSuccess ? 'var(--success)' : 'var(--danger)',
      fontWeight: 500, boxShadow: 'var(--shadow-lg)',
      animation: 'fadeIn 0.3s ease-out',
      maxWidth: '360px',
    }}>
      {isSuccess ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      {toast.message}
    </div>
  );
};

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const AdminUsers = () => {
  // Danh sÃ¡ch
  const [users, setUsers]           = useState<UserListItem[]>([]);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading]       = useState(false);
  const [busy, setBusy]             = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const itemsPerPage = 10;

  // Toast
  const [toast, setToast] = useState<Toast>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Import Excel
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting]         = useState(false);
  const [importResult, setImportResult]   = useState<ImportUsersResultDto | null>(null);

  // Modal táº¡o user
  const [showCreate, setShowCreate]   = useState(false);
  const [createForm, setCreateForm]   = useState({ email: '', fullName: '', role: 'Lecturer' });
  const [creating, setCreating]       = useState(false);

  // Modal chi tiáº¿t user
  const [detail, setDetail]               = useState<UserDetailDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Sá»­a email (náº±m trong modal chi tiáº¿t)
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [newEmail, setNewEmail]           = useState('');
  const [savingEmail, setSavingEmail]     = useState(false);

  // â”€â”€ Load danh sÃ¡ch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const load = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page: currentPage, pageSize: itemsPerPage };
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;
      const res = await api.get<{ items: UserListItem[]; totalCount: number }>('/api/admin/users', { params });
      setUsers(res.data.items);
      setTotalCount(res.data.totalCount);
    } catch (e) {
      console.error('Load users failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, roleFilter]);

  // Reset vá» trang 1 khi Ä‘á»•i bá»™ lá»c
  useEffect(() => { setCurrentPage(1); }, [search, roleFilter]);

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const toggle = async (id: number, isActive: boolean, email: string) => {
    const action = isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`${isActive ? 'VÃ´ hiá»‡u hÃ³a' : 'KÃ­ch hoáº¡t'} user ${email}?`)) return;
    try {
      setBusy(id);
      await api.post(`/api/admin/users/${id}/${action}`);
      showToast('success', `${isActive ? 'ÄÃ£ vÃ´ hiá»‡u hÃ³a' : 'ÄÃ£ kÃ­ch hoáº¡t'} ${email}`);
      await load();
      // Refresh detail náº¿u Ä‘ang xem cÃ¹ng user
      if (detail?.id === id) await loadDetail(id);
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Thao tÃ¡c tháº¥t báº¡i');
    } finally {
      setBusy(null);
    }
  };

  const loadDetail = async (id: number) => {
    setLoadingDetail(true);
    setShowEditEmail(false);
    try {
      const res = await api.get<UserDetailDto>(`/api/admin/users/${id}`);
      setDetail(res.data);
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'KhÃ´ng thá»ƒ táº£i thÃ´ng tin user');
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setShowEditEmail(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      setImportResult(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<ImportUsersResultDto>('/api/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      await load();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Import tháº¥t báº¡i');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.post('/api/admin/users', createForm);
      showToast('success', `ÄÃ£ táº¡o user ${createForm.email}`);
      setShowCreate(false);
      setCreateForm({ email: '', fullName: '', role: 'Lecturer' });
      await load();
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Táº¡o user tháº¥t báº¡i');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    try {
      setSavingEmail(true);
      await api.patch(`/api/admin/users/${detail.id}/email`, { email: newEmail });
      showToast('success', `ÄÃ£ cáº­p nháº­t email thÃ nh ${newEmail}`);
      setShowEditEmail(false);
      await loadDetail(detail.id);
      await load();
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Cáº­p nháº­t email tháº¥t báº¡i');
    } finally {
      setSavingEmail(false);
    }
  };

  // â”€â”€ Pagination helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getPageNumbers = () => {
    const blockSize  = 10;
    const blockIndex = Math.floor((currentPage - 1) / blockSize);
    const start = blockIndex * blockSize + 1;
    const end   = Math.min(totalPages, (blockIndex + 1) * blockSize);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const isLastBlock = Math.floor((totalPages - 1) / 10) === Math.floor((currentPage - 1) / 10);

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="animate-fade-in">
      <ToastBar toast={toast} />

      {/* Topbar */}
      <div className="topbar">
        <div>
          <h1>Quáº£n lÃ½ ngÆ°á»i dÃ¹ng</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Táº¡o, kÃ­ch hoáº¡t vÃ  quáº£n lÃ½ tÃ i khoáº£n trong há»‡ thá»‘ng
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
            {importing ? 'Äang Import...' : 'Import Excel'}
          </button>
          <input
            type="file" accept=".xlsx,.xls" ref={fileInputRef}
            style={{ display: 'none' }} onChange={handleImport}
          />
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> ThÃªm User
          </button>
        </div>
      </div>

      {/* Káº¿t quáº£ import */}
      {importResult && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <CheckCircle size={20} color="var(--success)" />
            <h3 style={{ margin: 0 }}>Káº¿t quáº£ Import Users</h3>
          </div>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Táº¡o má»›i: <strong style={{ color: 'var(--success)' }}>{importResult.created}</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Cáº­p nháº­t: <strong style={{ color: 'var(--accent-primary)' }}>{importResult.updated}</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Bá» qua: <strong>{importResult.skipped}</strong>
            </span>
          </div>
          {importResult.errors.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.08)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                <AlertTriangle size={15} />
                <strong>Cáº£nh bÃ¡o / Lá»—i ({importResult.errors.length})</strong>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.7 }}>
                  {importResult.errors.map((err, i) => (
                    <li key={i}>
                      {err.rowNumber > 0 ? `DÃ²ng ${err.rowNumber}: ` : ''}{err.reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => setImportResult(null)}>
            ÄÃ³ng
          </button>
        </div>
      )}

      {/* Bá»™ lá»c */}
      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text" className="input-field"
              placeholder="TÃ¬m theo email hoáº·c tÃªn..."
              style={{ paddingLeft: '2.5rem' }}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <select className="input-field" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">Táº¥t cáº£ role</option>
          <option value="Admin">Admin</option>
          <option value="Lecturer">Lecturer</option>
          <option value="StudentLeader">Student Leader</option>
          <option value="GroupMember">Group Member</option>
        </select>
        {(search || roleFilter) && (
          <button className="btn btn-secondary" onClick={() => { setSearch(''); setRoleFilter(''); }}>
            <X size={14} /> XÃ³a bá»™ lá»c
          </button>
        )}
      </div>

      {/* Báº£ng danh sÃ¡ch */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <Loader2 size={20} className="spin" /> Äang táº£i...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
            <p>KhÃ´ng cÃ³ user nÃ o{search ? ` khá»›p vá»›i "${search}"` : ''}.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Há» tÃªn</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Tráº¡ng thÃ¡i</th>
                    <th>Táº¡o lÃºc</th>
                    <th style={{ textAlign: 'right' }}>Thao tÃ¡c</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} onClick={() => loadDetail(u.id)} title="Xem chi tiáº¿t">
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>#{u.id}</td>
                      <td style={{ fontWeight: 500 }}>{u.fullName}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{u.email}</td>
                      <td><RoleBadges role={u.role} /></td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-warning'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {/* stopPropagation Ä‘á»ƒ click nÃºt khÃ´ng trigger row onClick */}
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => loadDetail(u.id)}
                            title="Xem chi tiáº¿t"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className={`btn ${u.isActive ? 'btn-danger' : 'btn-primary'}`}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            disabled={busy === u.id}
                            onClick={() => toggle(u.id, u.isActive, u.email)}
                            title={u.isActive ? 'VÃ´ hiá»‡u hÃ³a' : 'KÃ­ch hoáº¡t'}
                          >
                            {busy === u.id
                              ? <Loader2 size={14} className="spin" />
                              : u.isActive ? <UserX size={14} /> : <UserCheck size={14} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass)',
                background: 'var(--surface-glass)', flexWrap: 'wrap', gap: '1rem',
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiá»ƒn thá»‹{' '}
                  <strong>{totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}â€“{Math.min(totalCount, currentPage * itemsPerPage)}</strong>{' '}
                  trong tá»•ng sá»‘ <strong>{totalCount}</strong> káº¿t quáº£
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <PagBtn disabled={currentPage <= 10} onClick={() => setCurrentPage(Math.max(1, Math.floor((currentPage-1)/10)*10))} title="Cá»¥m trÆ°á»›c"><ChevronsLeft size={16} /></PagBtn>
                  <PagBtn disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p-1, 1))}><ChevronLeft size={16} /></PagBtn>
                  {getPageNumbers().map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '0.4rem 0.75rem', minWidth: '32px',
                        background: currentPage === page ? 'var(--accent-primary)' : 'transparent',
                        border: currentPage === page ? 'none' : '1px solid var(--border-glass)',
                        color: currentPage === page ? 'white' : 'var(--text-primary)',
                      }}
                    >{page}</button>
                  ))}
                  <PagBtn disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))}><ChevronRight size={16} /></PagBtn>
                  <PagBtn disabled={isLastBlock} onClick={() => setCurrentPage(Math.min(totalPages, (Math.floor((currentPage-1)/10)+1)*10+1))} title="Cá»¥m sau"><ChevronsRight size={16} /></PagBtn>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* â”€â”€ Modal: Táº¡o User â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showCreate && (
        <ModalOverlay onClose={() => !creating && setShowCreate(false)}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 480, padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <ModalHeader title="ThÃªm ngÆ°á»i dÃ¹ng má»›i" onClose={() => setShowCreate(false)} disabled={creating} />
            <form onSubmit={handleCreateUser}>
              <div className="input-group">
                <label className="input-label">Email <Required /></label>
                <input required type="email" className="input-field" placeholder="example@fpt.edu.vn"
                  value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Há» tÃªn <Required /></label>
                <input required type="text" className="input-field" placeholder="Nguyá»…n VÄƒn A"
                  value={createForm.fullName} onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Role <Required /></label>
                <select required className="input-field" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                  <option value="Admin">Admin</option>
                  <option value="Lecturer">Lecturer</option>
                  <option value="StudentLeader">Student Leader</option>
                  <option value="GroupMember">Group Member</option>
                </select>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                User sáº½ Ä‘Æ°á»£c liÃªn káº¿t vá»›i Google khi Ä‘Äƒng nháº­p láº§n Ä‘áº§u tiÃªn.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)} disabled={creating}>Há»§y</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><Loader2 size={16} className="spin" /> Äang táº¡o...</> : <><Plus size={16} /> Táº¡o User</>}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* â”€â”€ Modal: Chi tiáº¿t User â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {(detail || loadingDetail) && (
        <ModalOverlay onClose={closeDetail}>
          <div
            className="glass-panel animate-fade-in"
            style={{ width: '100%', maxWidth: 560, padding: '2rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Loading overlay khi Ä‘ang fetch detail má»›i */}
            {loadingDetail && (
              <div style={{
                position: 'absolute', inset: 0, background: 'var(--modal-overlay-bg)',
                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
              }}>
                <Loader2 size={28} className="spin" style={{ color: 'var(--accent-primary)' }} />
              </div>
            )}

            {detail && (
              <>
                <ModalHeader
                  title="Chi tiáº¿t ngÆ°á»i dÃ¹ng"
                  subtitle={`ID #${detail.id}`}
                  onClose={closeDetail}
                />

                {/* Grid thÃ´ng tin cÆ¡ báº£n */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <InfoRow label="Há» tÃªn" value={detail.fullName} />
                  <InfoRow label="Role" value={<RoleBadges role={detail.role} />} />
                  <InfoRow label="Tráº¡ng thÃ¡i" value={
                    <span className={`badge ${detail.isActive ? 'badge-success' : 'badge-warning'}`}>
                      {detail.isActive ? 'Active' : 'Inactive'}
                    </span>
                  } />
                  <InfoRow label="TÃ i khoáº£n Google" value={
                    detail.googleSubject
                      ? <span className="badge badge-success">ÄÃ£ liÃªn káº¿t</span>
                      : <span className="badge badge-warning">ChÆ°a liÃªn káº¿t</span>
                  } />
                  <InfoRow label="Táº¡o lÃºc" value={new Date(detail.createdAt).toLocaleString('vi-VN')} />
                  {detail.updatedAt && (
                    <InfoRow label="Cáº­p nháº­t lÃºc" value={new Date(detail.updatedAt).toLocaleString('vi-VN')} />
                  )}
                </div>

                {/* Email section */}
                <div style={{
                  background: 'rgba(251,146,60,0.05)', border: '1px solid var(--border-glass)',
                  borderRadius: '10px', padding: '1rem', marginBottom: '1rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Email</p>
                      <p style={{ fontWeight: 500, wordBreak: 'break-all' }}>{detail.email}</p>
                    </div>
                    {!showEditEmail && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', flexShrink: 0 }}
                        onClick={() => { setShowEditEmail(true); setNewEmail(detail.email); }}
                      >
                        <Mail size={14} /> Sá»­a email
                      </button>
                    )}
                  </div>

                  {showEditEmail && (
                    <form onSubmit={handleUpdateEmail} style={{ marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                      <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                        <label className="input-label">Email má»›i</label>
                        <input
                          required type="email" className="input-field"
                          value={newEmail} onChange={e => setNewEmail(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                          onClick={() => setShowEditEmail(false)} disabled={savingEmail}>
                          Há»§y
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                          disabled={savingEmail}>
                          {savingEmail ? <><Loader2 size={14} className="spin" /> Äang lÆ°u...</> : 'LÆ°u'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Lecturer Profile */}
                {detail.lecturerProfile && (
                  <div style={{
                    background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '10px', padding: '1rem', marginBottom: '1rem',
                  }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Lecturer Profile</p>
                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
                      <span>Lecturer ID: <strong>#{detail.lecturerProfile.id}</strong></span>
                      <span>MÃ£ tÃªn: <strong>{detail.lecturerProfile.code || 'â€”'}</strong></span>
                    </div>
                  </div>
                )}

                {/* Student Profile */}
                {detail.studentProfile && (
                  <div style={{
                    background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '10px', padding: '1rem', marginBottom: '1rem',
                  }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Student Profile</p>
                    <span style={{ fontSize: '0.875rem' }}>Student ID: <strong>#{detail.studentProfile.id}</strong></span>
                  </div>
                )}

                {/* NÃºt activate/deactivate tá»« modal chi tiáº¿t */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={closeDetail}>ÄÃ³ng</button>
                  <button
                    className={`btn ${detail.isActive ? 'btn-danger' : 'btn-primary'}`}
                    disabled={busy === detail.id}
                    onClick={() => toggle(detail.id, detail.isActive, detail.email)}
                  >
                    {busy === detail.id
                      ? <><Loader2 size={16} className="spin" /> Äang xá»­ lÃ½...</>
                      : detail.isActive
                        ? <><UserX size={16} /> VÃ´ hiá»‡u hÃ³a</>
                        : <><UserCheck size={16} /> KÃ­ch hoáº¡t</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </ModalOverlay>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// â”€â”€â”€ Shared UI helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Required = () => <span style={{ color: 'var(--danger)' }}>*</span>;

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => {
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--modal-overlay-bg)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={onClose}
    >
      {children}
    </div>,
    document.body
  );
};

const ModalHeader = ({
  title, subtitle, onClose, disabled = false,
}: { title: string; subtitle?: string; onClose: () => void; disabled?: boolean }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
    <div>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>{subtitle}</p>}
    </div>
    <button className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', flexShrink: 0 }} onClick={onClose} disabled={disabled}>
      <X size={18} />
    </button>
  </div>
);

const PagBtn = ({ children, disabled, onClick, title }: { children: React.ReactNode; disabled: boolean; onClick: () => void; title?: string }) => (
  <button
    onClick={onClick} disabled={disabled} title={title}
    className="btn btn-secondary"
    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
  >
    {children}
  </button>
);

export default AdminUsers;
```


## File: src\pages\AuditLogs.tsx
```typescript

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { hasRole } from '../utils/role';
import type { AuditLogDto } from '../types';
import { RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const AuditLogs = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialGroup = params.get('groupId') || '';
  const [groupId, setGroupId] = useState<string>(initialGroup);
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalCount, setTotalCount] = useState(0);

  const isAdmin = hasRole(user?.role, 'Admin');

  const load = async (pageToLoad = currentPage) => {
    setErr(null);
    if (!isAdmin && !groupId) {
      setErr('Cáº§n chá»n nhÃ³m Ä‘á»ƒ xem audit log.');
      setLogs([]);
      return;
    }
    try {
      setLoading(true);
      const query: Record<string, string | number> = {
        page: pageToLoad,
        pageSize: itemsPerPage
      };
      if (groupId) query.groupId = groupId;
      const res = await api.get<{ items: AuditLogDto[]; totalCount: number }>('/api/audit-logs', { params: query });
      setLogs(res.data.items);
      setTotalCount(res.data.totalCount);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c audit log.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const applyFilter = () => {
    if (groupId) setParams({ groupId });
    else setParams({});
    if (currentPage === 1) {
      load(1);
    } else {
      setCurrentPage(1);
    }
  };

  // Pagination Calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const displayedLogs = logs;

  const getPageNumbers = () => {
    const blockSize = 10;
    const blockIndex = Math.floor((currentPage - 1) / blockSize);
    const start = blockIndex * blockSize + 1;
    const end = Math.min(totalPages, (blockIndex + 1) * blockSize);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Audit Logs</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isAdmin ? 'ToÃ n há»‡ thá»‘ng â€” cÃ³ thá»ƒ lá»c theo nhÃ³m' : 'Trong pháº¡m vi nhÃ³m cá»§a báº¡n'}
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
          <label className="input-label">Group ID {isAdmin ? '(Ä‘á»ƒ trá»‘ng = xem táº¥t cáº£)' : '(báº¯t buá»™c)'}</label>
          <input
            type="number"
            className="input-field"
            placeholder="VD: 1"
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilter()}
          />
        </div>
        <button className="btn btn-primary" onClick={applyFilter} disabled={loading}>
          <RefreshCw size={16} /> Lá»c
        </button>
      </div>

      {err && (
        <div className="glass-card" style={{ marginBottom: '2rem', color: 'var(--danger)' }}>{err}</div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Äang táº£i...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>KhÃ´ng cÃ³ log.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Thá»i gian</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Chi tiáº¿t</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLogs.map(l => (
                    <tr key={l.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleString('vi-VN')}</td>
                      <td>{l.actorEmail}</td>
                      <td><span className="badge">{l.action}</span></td>
                      <td>{l.targetEntity ? `${l.targetEntity}#${l.targetId ?? ''}` : 'â€”'}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{l.details || 'â€”'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '1rem 1.5rem', 
                borderTop: '1px solid var(--border-glass)',
                background: 'var(--surface-glass)',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiá»ƒn thá»‹ <strong>{totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(totalCount, currentPage * itemsPerPage)}</strong> trong tá»•ng sá»‘ <strong>{totalCount}</strong> káº¿t quáº£
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => {
                      const blockIndex = Math.floor((currentPage - 1) / 10);
                      setCurrentPage(Math.max(1, blockIndex * 10));
                    }}
                    disabled={currentPage <= 10}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage <= 10 ? 0.5 : 1, cursor: currentPage <= 10 ? 'not-allowed' : 'pointer' }}
                    title="Cá»¥m trÆ°á»›c"
                  >
                    <ChevronsLeft size={16} />
                  </button>

                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {getPageNumbers().map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ 
                        padding: '0.4rem 0.75rem', 
                        minWidth: '32px',
                        background: currentPage === page ? 'var(--accent-primary)' : 'transparent',
                        border: currentPage === page ? 'none' : '1px solid var(--border-glass)',
                        color: currentPage === page ? 'white' : 'var(--text-primary)'
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronRight size={16} />
                  </button>

                  <button
                    onClick={() => {
                      const blockIndex = Math.floor((currentPage - 1) / 10);
                      const nextBlockPage = (blockIndex + 1) * 10 + 1;
                      setCurrentPage(Math.min(totalPages, nextBlockPage));
                    }}
                    disabled={Math.floor((totalPages - 1) / 10) === Math.floor((currentPage - 1) / 10)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: (Math.floor((totalPages - 1) / 10) === Math.floor((currentPage - 1) / 10)) ? 0.5 : 1, cursor: (Math.floor((totalPages - 1) / 10) === Math.floor((currentPage - 1) / 10)) ? 'not-allowed' : 'pointer' }}
                    title="Cá»¥m sau"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
```


## File: src\pages\Dashboard.tsx
```typescript

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Users, CalendarRange, ClipboardCheck, Loader2, AlertCircle, X, Clock, FileText, UserCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { hasAnyRole } from '../utils/role';
import type { DashboardStatsDto, LecturerAssignedSlotDto } from '../types';
import { Tooltip } from '../components/Tooltip';

// Dashboard GVHD/Reviewer:
//   - 3 Ã´ KPI: Tá»•ng nhÃ³m, Danh sÃ¡ch Ä‘á»£t review (chip â€” Ä‘á»£t háº¿t háº¡n tÃ´ xÃ¡m), Slot Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t trong Ä‘á»£t Ä‘ang chá»n
//   - Khu vá»±c thá»‘ng kÃª: báº£ng chi tiáº¿t cÃ¡c slot Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t cho GV hiá»‡n táº¡i
//     (hiá»ƒn thá»‹ háº¿t, slot thuá»™c Ä‘á»£t háº¿t háº¡n Ä‘Æ°á»£c lÃ m má»)

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role;
  const canViewDashboard = hasAnyRole(role, ['Lecturer', 'Reviewer', 'Admin', 'StudentLeader', 'GroupMember']);

  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [assignedSlots, setAssignedSlots] = useState<LecturerAssignedSlotDto[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Slot Ä‘ang xem chi tiáº¿t qua popup. Null = popup Ä‘Ã³ng.
  const [detailSlot, setDetailSlot] = useState<LecturerAssignedSlotDto | null>(null);

  useEffect(() => {
    if (!canViewDashboard) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, slotsRes] = await Promise.all([
          api.get<DashboardStatsDto>('/api/dashboard/stats'),
          api.get<LecturerAssignedSlotDto[]>('/api/dashboard/assigned-slots'),
        ]);
        setStats(statsRes.data);
        setAssignedSlots(slotsRes.data);

        // Máº·c Ä‘á»‹nh chá»n Ä‘á»£t cÃ²n háº¡n Ä‘áº§u tiÃªn (náº¿u khÃ´ng cÃ³ thÃ¬ Ä‘á»ƒ null = xem táº¥t cáº£)
        const firstActive = statsRes.data.reviews.find((r) => !r.isExpired);
        setSelectedReviewId(firstActive?.id ?? null);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c dá»¯ liá»‡u dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [canViewDashboard]);

  // Sá»‘ slot Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t cho Ä‘á»£t Ä‘ang chá»n â€” fallback tá»•ng táº¥t cáº£ khi chÆ°a chá»n
  const selectedReviewSlotCount = useMemo(() => {
    if (!stats) return 0;
    if (selectedReviewId == null) {
      return Object.values(stats.assignedSlotCounts).reduce((a, b) => a + b, 0);
    }
    return stats.assignedSlotCounts[String(selectedReviewId)] ?? 0;
  }, [stats, selectedReviewId]);

  const selectedReviewLabel = useMemo(() => {
    if (selectedReviewId == null) return 'Táº¥t cáº£ Ä‘á»£t';
    return stats?.reviews.find((r) => r.id === selectedReviewId)?.label ?? 'â€”';
  }, [stats, selectedReviewId]);

  // Lá»c khu vá»±c thá»‘ng kÃª theo Ä‘á»£t Ä‘ang chá»n
  const filteredAssignedSlots = useMemo(() => {
    if (selectedReviewId == null) return assignedSlots;
    return assignedSlots.filter((s) => s.reviewId === selectedReviewId);
  }, [assignedSlots, selectedReviewId]);

  if (!canViewDashboard) {
    return (
      <div className="animate-fade-in" style={{ padding: '2rem' }}>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Báº¡n khÃ´ng cÃ³ quyá»n xem dashboard.</p>
      </div>
    );
  }

  const viewerRole = stats?.viewerRole;
  const isStudentView = viewerRole === 'Student';

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isStudentView ? 'Tá»•ng quan lá»‹ch review cá»§a nhÃ³m' : 'Tá»•ng quan hoáº¡t Ä‘á»™ng giáº£ng viÃªn'}
          </p>
        </div>
      </div>

      {error && (
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem 1rem', marginBottom: '1rem',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* 3 Ã´ KPI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {/* Tá»•ng nhÃ³m (lecturer) hoáº·c NhÃ³m cá»§a tÃ´i (student) */}
        <KpiCard
          icon={<Users size={24} />}
          color="#f59e0b"
          label={isStudentView ? 'NhÃ³m cá»§a tÃ´i' : 'Tá»•ng nhÃ³m hÆ°á»›ng dáº«n'}
          value={
            loading
              ? 'â€”'
              : isStudentView
              ? (stats?.myGroup?.groupCode ?? 'ChÆ°a cÃ³ nhÃ³m')
              : String(stats?.totalGroups ?? 0)
          }
        />

        {/* Danh sÃ¡ch Ä‘á»£t review (chip) */}
        <div
          className="glass-card"
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={iconWrapStyle('#6366f1')}>
              <CalendarRange size={22} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              CÃ¡c Ä‘á»£t review
            </p>
          </div>
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : !stats || stats.reviews.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, opacity: 0.6, fontStyle: 'italic' }}>
              KhÃ´ng cÃ³ Ä‘á»£t Ä‘á»ƒ ___
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {stats.reviews.map((r) => {
                const isSelected = r.id === selectedReviewId;
                return (
                  <Tooltip
                    key={r.id}
                    content={`${formatDate(r.windowStart)} â†’ ${formatDate(r.windowEnd)} (${r.status})`}
                    variant="glass-card"
                    style={{ display: 'inline-flex' }}
                  >
                  <button
                    onClick={() => setSelectedReviewId(isSelected ? null : r.id)}
                    style={{
                      padding: '0.3rem 0.7rem',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1.5px solid',
                      transition: 'all 0.15s ease',
                      opacity: r.isExpired ? 0.45 : 1,
                      background: isSelected
                        ? 'rgba(99, 102, 241, 0.22)'
                        : r.isExpired
                        ? 'rgba(148, 163, 184, 0.12)'
                        : 'var(--glass-card-bg)',
                      borderColor: isSelected
                        ? '#6366f1'
                        : r.isExpired
                        ? 'rgba(148, 163, 184, 0.4)'
                        : 'var(--border-glass)',
                      color: isSelected
                        ? '#6366f1'
                        : r.isExpired
                        ? 'var(--text-secondary)'
                        : 'var(--text-primary)',
                    }}
                  >
                    {r.label}
                  </button>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>

        {/* Slot Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t trong Ä‘á»£t Ä‘ang chá»n */}
        <KpiCard
          icon={<ClipboardCheck size={24} />}
          color="#10b981"
          label={`${isStudentView ? 'Sá»‘ buá»•i review cá»§a nhÃ³m' : 'Slot Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t'} (${selectedReviewLabel})`}
          value={loading ? 'â€”' : String(selectedReviewSlotCount)}
        />
      </div>

      {/* Khu vá»±c thá»‘ng kÃª â€” card grid theo style AdminScheduling */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
        <BarChart3 size={22} color="var(--accent-primary)" />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Khu vá»±c thá»‘ng kÃª</h2>
        {selectedReviewId != null && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            â€” Lá»‹ch chi tiáº¿t cá»§a {selectedReviewLabel}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
          <Loader2 size={18} className="animate-spin" /> Äang táº£i...
        </div>
      ) : filteredAssignedSlots.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.7 }}>
          ChÆ°a cÃ³ slot nÃ o Ä‘Æ°á»£c phÃª duyá»‡t.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredAssignedSlots.map((s) => (
            <AssignedSlotCard key={s.assignmentId} slot={s} onOpen={() => setDetailSlot(s)} />
          ))}
        </div>
      )}

      {/* Popup chi tiáº¿t slot */}
      {detailSlot && (
        <SlotDetailModal
          slot={detailSlot}
          isStudentView={isStudentView}
          onClose={() => setDetailSlot(null)}
        />
      )}
    </div>
  );
};

// Card tháº» summary â€” layout 1 dÃ²ng kiá»ƒu admin xáº¿p lá»‹ch:
//   [DOW NgÃ y Â· Slot N]
//   [Badge Äá»£t] â± HH:mm â€“ HH:mm
// Click â†’ má»Ÿ modal chi tiáº¿t.
const AssignedSlotCard = ({ slot, onOpen }: { slot: LecturerAssignedSlotDto; onOpen: () => void }) => {
  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(slot.slotDate).getUTCDay()];

  return (
    <Tooltip
      content="Báº¥m Ä‘á»ƒ xem chi tiáº¿t"
      variant="glass-card"
      placement="top"
      className="glass-card"
      style={{
        padding: 0,
        border: 'none',
        background: 'transparent',
      }}
    >
      <div
        onClick={onOpen}
        style={{
          padding: '1rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          opacity: slot.isExpired ? 0.55 : 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 8,
            marginBottom: '0.6rem',
          }}
        >
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            {dow} - {formatDate(slot.slotDate)} Â· Slot {slot.sessionIndex}
          </strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <span
          className="badge"
          style={{
            background: 'rgba(251, 146, 60, 0.12)',
            color: 'var(--accent-primary)',
            fontWeight: 600,
            padding: '0.2rem 0.6rem',
            fontSize: '0.72rem',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {slot.reviewLabel}
        </span>
        <Clock size={14} style={{ flexShrink: 0 }} />
        <span>
          <b style={{ color: 'var(--accent-primary)' }}>{slot.startTime}</b>
          {' â€“ '}
          <b style={{ color: 'var(--accent-primary)' }}>{slot.endTime}</b>
        </span>
      </div>
      </div>
    </Tooltip>
  );
};

// Modal full chi tiáº¿t slot
const SlotDetailModal = ({ slot, isStudentView, onClose }: {
  slot: LecturerAssignedSlotDto;
  isStudentView: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // KhoÃ¡ scroll body khi modal má»Ÿ
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(slot.slotDate).getUTCDay()];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 520,
          padding: '1.5rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="ÄÃ³ng"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-glass)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.2rem', paddingRight: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.4rem' }}>
            <span
              className="badge"
              style={{
                background: 'rgba(251, 146, 60, 0.12)',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                padding: '0.25rem 0.7rem',
                fontSize: '0.78rem',
              }}
            >
              {slot.reviewLabel}
            </span>
            {slot.isExpired && (
              <span
                className="badge"
                style={{
                  background: 'rgba(148, 163, 184, 0.18)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  padding: '0.25rem 0.7rem',
                  fontSize: '0.78rem',
                }}
              >
                ÄÃ£ káº¿t thÃºc
              </span>
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {dow} - {formatDate(slot.slotDate)} Â· Slot {slot.sessionIndex}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '0.5rem', fontSize: '0.9rem' }}>
            <Clock size={15} color="var(--accent-primary)" />
            <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
              {slot.startTime} â€“ {slot.endTime}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <DetailRow
            icon={<Users size={15} />}
            label="NhÃ³m"
            value={<strong style={{ fontSize: '0.95rem' }}>{slot.groupCode}</strong>}
          />
          <DetailRow
            icon={<FileText size={15} />}
            label="Äá» tÃ i"
            value={slot.projectName}
          />
          {isStudentView ? (
            <DetailRow
              icon={<UserCheck size={15} />}
              label="Há»™i Ä‘á»“ng"
              value={
                <span>
                  <b>{slot.lecturer1Name}</b>
                  {slot.lecturer2Name ? <> &amp; <b>{slot.lecturer2Name}</b></> : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}> (chÆ°a cÃ³ GV 2)</span>
                  )}
                </span>
              }
            />
          ) : (
            <DetailRow
              icon={<UserCheck size={15} />}
              label="Äá»“ng GV"
              value={
                slot.partnerLecturerName
                  ? <span>{slot.partnerLecturerName}</span>
                  : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>ChÆ°a cÃ³ Ä‘á»“ng giáº£ng viÃªn</span>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 10, fontSize: '0.88rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', minWidth: 100, flexShrink: 0 }}>
      {icon}
      <span>{label}</span>
    </div>
    <div style={{ color: 'var(--text-primary)', wordBreak: 'break-word', flex: 1 }}>{value}</div>
  </div>
);

const iconWrapStyle = (color: string): React.CSSProperties => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  background: `${color}15`,
  border: `1px solid ${color}30`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color,
  flexShrink: 0,
});

const KpiCard = ({ icon, color, label, value }: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
}) => (
  <div
    className="glass-card"
    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}
  >
    <div style={iconWrapStyle(color)}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
    </div>
  </div>
);

export default Dashboard;
```


## File: src\pages\Login.tsx
```typescript

import { useAuth } from '../contexts/AuthContext';
import { hasRole, hasAnyRole } from '../utils/role';
import { GoogleLogin } from '@react-oauth/google';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';

const routeForUser = (role: string | undefined | null, groupId?: number | null) => {
  if (hasRole(role, 'Admin') || hasRole(role, 'Lecturer')) return '/dashboard';
  if (hasAnyRole(role, ['StudentLeader', 'GroupMember', 'Student']) && groupId) {
    return `/projects/${groupId}`;
  }
  return '/no-project';
};

const formatError = (err: any) => {
  const data = err?.response?.data;
  const code = data?.code;
  const message = data?.message;
  const status = err?.response?.status;
  if (!err?.response) {
    return `KhÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c BE (${err?.message}). Kiá»ƒm tra HTTPS dev cert + Ä‘Ãºng port.`;
  }
  return `ÄÄƒng nháº­p tháº¥t báº¡i [${status}]${code ? ` ${code}` : ''}\n${message || err?.message || ''}`;
};

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to={routeForUser(user.role, user.groupId)} replace />;
  }

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 380, textAlign: 'center', padding: '3rem 2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--surface-glass)', padding: '1rem', borderRadius: '50%', boxShadow: 'var(--shadow-glow)' }}>
            <Shield size={44} color="var(--accent-primary)" />
          </div>
        </div>
        <h1 className="text-gradient" style={{ marginBottom: '0.25rem', fontSize: '1.6rem' }}>FPT Capstones</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <Sparkles size={14} /> Há»‡ thá»‘ng quáº£n lÃ½ Ä‘á»“ Ã¡n tá»‘t nghiá»‡p
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const u = await login(credentialResponse);
                navigate(routeForUser(u.role, u.groupId), { replace: true });
              } catch (err) {
                alert(formatError(err));
              }
            }}
            onError={() => alert('ÄÄƒng nháº­p Google tháº¥t báº¡i')}
            theme="filled_black"
            shape="pill"
            size="large"
            text="continue_with"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
```


## File: src\pages\ProjectDetail.tsx
```typescript

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { hasRole } from '../utils/role';
import type { ProjectDetailDto } from '../types';
import { Save, FileUp, Trash2, Download, Send, CheckCircle, XCircle, Crown, FileText } from 'lucide-react';
import { Tooltip } from '../components/Tooltip';

const fmtSize = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const ProjectDetail = () => {
  const { id } = useParams();
  const projectId = parseInt(id || '0');
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [, setUploading] = useState(false);

  const isStudentLeader = hasRole(user?.role, 'StudentLeader');
  const isAdmin = hasRole(user?.role, 'Admin');
  const isLecturer = hasRole(user?.role, 'Lecturer');


  // State for selected version (PRD: switch documents view by version)
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  // Set default selected version when project loads
  useEffect(() => {
    if (project && project.versions && project.versions.length > 0) {
      if (selectedVersionId === null || !project.versions.some(v => v.versionId === selectedVersionId)) {
        setSelectedVersionId(project.versions[0].versionId);
      }
    }
  }, [project, selectedVersionId]);

  // Version má»›i nháº¥t = draft (chÆ°a finalize). Má»i version khÃ¡c Ä‘Ã£ submit/finalize khÃ´ng sá»­a Ä‘Æ°á»£c.
  const draftVersion = project?.versions?.[0];
  const selectedVersion = project?.versions?.find(v => v.versionId === selectedVersionId) || draftVersion;
  const isDraftEditable = draftVersion && !draftVersion.isFinalized;

  // We can determine if the selected version is the current active editable draft
  const isSelectedVersionDraft = selectedVersion && draftVersion && selectedVersion.versionId === draftVersion.versionId;
  
  // Tráº£ láº¡i logic frontend nguyÃªn báº£n, Ä‘Æ¡n giáº£n hÃ³a tá»‘i Ä‘a.
  // Giao phÃ³ viá»‡c quyáº¿t Ä‘á»‹nh file nÃ o thuá»™c vá» draft cho backend (thÃ´ng qua máº£ng currentDocuments).
  const displayedDocuments = (isSelectedVersionDraft && project?.currentDocuments) 
    ? project.currentDocuments 
    : (selectedVersion?.documents || []);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await api.get<ProjectDetailDto>(`/api/projects/${projectId}`);
      setProject(res.data);
      setEditName(res.data.projectName);
      setEditDesc(res.data.description || '');
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c thÃ´ng tin nhÃ³m.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleUpdateMeta = async () => {
    try {
      await api.put(`/api/projects/${projectId}`, { projectName: editName, description: editDesc });
      setIsEditing(false);
      fetchProject();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Cáº­p nháº­t tháº¥t báº¡i');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/api/groups/${projectId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      const input = document.getElementById('file-input') as HTMLInputElement | null;
      if (input) input.value = '';
      fetchProject();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Upload tháº¥t báº¡i');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!window.confirm('XÃ³a file nÃ y khá»i draft hiá»‡n táº¡i?')) return;
    try {
      await api.delete(`/api/documents/${docId}`);
      fetchProject();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'XÃ³a tháº¥t báº¡i');
    }
  };

  const handleDownloadDoc = async (docId: number, fileName: string) => {
    try {
      const res = await api.get(`/api/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Download tháº¥t báº¡i');
    }
  };

  const handleSubmitVersion = async () => {
    if (!window.confirm('Submit version hiá»‡n táº¡i? Sau khi submit sáº½ khÃ´ng sá»­a Ä‘Æ°á»£c ná»¯a.')) return;
    try {
      const res = await api.post(`/api/groups/${projectId}/versions/submit`);
      alert(`ÄÃ£ submit Version ${res.data.versionNumber}`);
      fetchProject();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Submit tháº¥t báº¡i');
    }
  };

  const handleFinalize = async (versionId: number, finalize: boolean) => {
    try {
      if (finalize) await api.post(`/api/versions/${versionId}/finalize`);
      else await api.post(`/api/versions/${versionId}/unfinalize`);
      fetchProject();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Thao tÃ¡c tháº¥t báº¡i');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Äang táº£i...</div>;
  if (err) return <div style={{ padding: '2rem', color: 'var(--accent-danger, salmon)' }}>{err}</div>;
  if (!project) return <div style={{ padding: '2rem' }}>KhÃ´ng tÃ¬m tháº¥y nhÃ³m.</div>;

  return (
    <div className="animate-fade-in">
      {/* Spacer for user profile dropdown */}
      <div className="topbar" style={{ minHeight: '3rem' }}></div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Metadata */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>ThÃ´ng tin Ä‘á» tÃ i</h3>
              {isStudentLeader && isDraftEditable && !isEditing && (
                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Sá»­a</button>
              )}
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">TÃªn Ä‘á» tÃ i</label>
                  <input className="input-field" value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">MÃ´ táº£</label>
                  <textarea className="input-field" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-primary" onClick={handleUpdateMeta}><Save size={16} /> LÆ°u</button>
                  <button className="btn btn-secondary" onClick={() => { setIsEditing(false); setEditName(project.projectName); setEditDesc(project.description || ''); }}>Há»§y</button>
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>{project.projectName || '(ChÆ°a Ä‘áº·t tÃªn)'}</h2>
                <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{project.description || 'ChÆ°a cÃ³ mÃ´ táº£.'}</p>
              </div>
            )}
          </div>

          {/* Version documents list */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3>Danh sÃ¡ch tÃ i liá»‡u</h3>
                {selectedVersion && (
                  <p style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
                    Äang xem: Version {selectedVersion.versionNumber} {selectedVersion.versionId === draftVersion?.versionId ? (draftVersion.isFinalized ? '(ÄÃ£ finalize)' : '(Draft)') : '(Submitted)'}
                  </p>
                )}
              </div>
              {isStudentLeader && isDraftEditable && isSelectedVersionDraft && displayedDocuments.length > 0 && (
                <button className="btn btn-primary" onClick={handleSubmitVersion}>
                  <Send size={16} /> Submit Version
                </button>
              )}
            </div>

            {isStudentLeader && isDraftEditable && isSelectedVersionDraft && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  marginBottom: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 8,
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: 'rgb(251, 191, 36)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}>
                  Chá»©c nÄƒng upload tÃ i liá»‡u Ä‘ang trong quÃ¡ trÃ¬nh phÃ¡t triá»ƒn vÃ  táº¡m thá»i bá»‹ vÃ´ hiá»‡u.
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                    <label className="input-label">Upload file (tá»‘i Ä‘a 50MB, Ä‘á»‹nh dáº¡ng: .pdf .docx .doc .xlsx .pptx .zip)</label>
                    <input
                      id="file-input"
                      type="file"
                      className="input-field"
                      style={{ padding: '0.5rem', opacity: 0.6, cursor: 'not-allowed' }}
                      disabled
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Tooltip content="TÃ­nh nÄƒng Ä‘ang phÃ¡t triá»ƒn" variant="glass-card" className="no-tooltip-hover" style={{ display: 'flex' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={handleUpload}
                      disabled
                      style={{ opacity: 0.6, cursor: 'not-allowed' }}
                    >
                      <FileUp size={16} /> Upload
                    </button>
                  </Tooltip>
                </div>
              </div>
            )}

            {displayedDocuments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>ChÆ°a cÃ³ tÃ i liá»‡u trong version nÃ y.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>TÃªn file</th>
                    <th>KÃ­ch thÆ°á»›c</th>
                    <th>Táº£i lÃªn</th>
                    <th style={{ width: 140, textAlign: 'right' }}>Thao tÃ¡c</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDocuments.map(d => (
                    <tr key={d.id}>
                      <td><FileText size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{d.fileName}</td>
                      <td>{fmtSize(d.fileSize)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(d.createdAt).toLocaleString('vi-VN')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Tooltip content="Download" variant="glass-card">
                            <button className="btn btn-secondary" style={{ padding: '0.3rem' }} onClick={() => handleDownloadDoc(d.id, d.fileName)}>
                              <Download size={14} />
                            </button>
                          </Tooltip>
                          {isStudentLeader && isDraftEditable && isSelectedVersionDraft && (
                            <Tooltip content="XÃ³a" variant="glass-card">
                              <button className="btn btn-danger" style={{ padding: '0.3rem' }} onClick={() => handleDeleteDoc(d.id)}>
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{project.groupCode} â€” {project.projectCode}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>GVHD: {project.lecturerName}</p>
          </div>

          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem' }}>ThÃ nh viÃªn nhÃ³m</h3>
            {project.members.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>ChÆ°a cÃ³ thÃ nh viÃªn.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {project.members.map(m => (
                  <div key={m.email} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-glass)' }}>
                    {m.isLeader && <Crown size={14} color="gold" />}
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: m.isLeader ? 600 : 400 }}>{m.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Version history â€” chuyá»ƒn xuá»‘ng dÆ°á»›i ThÃ nh viÃªn nhÃ³m */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem' }}>Lá»‹ch sá»­ version</h3>
            {project.versions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>ChÆ°a cÃ³ version nÃ o.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {project.versions.map(v => (
                  <div 
                    key={v.versionId} 
                    onClick={() => setSelectedVersionId(v.versionId)}
                    style={{
                      background: selectedVersionId === v.versionId ? 'var(--accent-glow)' : 'var(--table-row-bg)',
                      borderRadius: 8,
                      padding: '0.75rem',
                      border: selectedVersionId === v.versionId ? '2px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedVersionId !== v.versionId) {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedVersionId !== v.versionId) {
                        e.currentTarget.style.borderColor = 'var(--border-glass)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <strong>Version {v.versionNumber}</strong>
                        <span className={`badge ${v.isFinalized ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: '0.5rem' }}>
                          {v.isFinalized ? 'Finalized' : v.versionId === draftVersion?.versionId ? 'Draft' : 'Submitted'}
                        </span>
                      </div>
                      <div>
                        {(isAdmin || isLecturer) && !v.isFinalized && v.versionId !== draftVersion?.versionId && (
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={(e) => { e.stopPropagation(); handleFinalize(v.versionId, true); }}>
                            <CheckCircle size={12} /> Finalize
                          </button>
                        )}
                        {isAdmin && v.isFinalized && (
                          <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={(e) => { e.stopPropagation(); handleFinalize(v.versionId, false); }}>
                            <XCircle size={12} /> Un-finalize
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                      {v.documentCount} file â€¢ {new Date(v.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
```


## File: src\pages\ReviewSlots.tsx
```typescript

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MAX_GROUP_PREFERENCES, type ReviewDto, type ReviewSlotDto } from '../types';
import { CalendarRange, Loader2, AlertCircle, Check } from 'lucide-react';
import { hasRole } from '../utils/role';
import { getReviewSlotTimeRange } from '../utils/reviewSlotTime';
import { Tooltip } from '../components/Tooltip';

// Trang Ä‘Äƒng kÃ½ nguyá»‡n vá»ng slot review.
//   - StudentLeader: chá»n tá»‘i Ä‘a MAX_GROUP_PREFERENCES slot/Ä‘á»£t cho nhÃ³m mÃ¬nh
//   - Lecturer: chá»n khÃ´ng giá»›i háº¡n slot/Ä‘á»£t cho chÃ­nh mÃ¬nh
//   - GroupMember / Admin: chá»‰ xem

// empty: chÆ°a chá»n | selected: má»›i chá»n (xanh nÆ°á»›c, chÆ°a lÆ°u) | registered: Ä‘Ã£ lÆ°u DB (xanh lÃ¡)
// pendingUnregister: Ä‘Ã£ lÆ°u DB nhÆ°ng Ä‘ang Ä‘Ã¡nh dáº¥u Ä‘á»ƒ há»§y (Ä‘á», chÆ°a gá»­i BE)
// assigned: GV Ä‘Ã£ Ä‘Æ°á»£c admin phÃª duyá»‡t review slot nÃ y (vÃ ng, Æ°u tiÃªn hÆ¡n registered)
type SlotState = 'empty' | 'selected' | 'registered' | 'pendingUnregister' | 'assigned';
type DragCellCoord = { date: string; idx: number };

const parseDateInfo = (iso: string) => {
  const d = new Date(iso);
  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getUTCDay()];
  const dateStr = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  return { dow, dateStr };
};

const getReviewStatusBadge = (status?: ReviewDto['status']) => {
  switch (status) {
    case 'Registering':
      return { label: 'Registering', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.35)' };
    case 'Registered':
      return { label: 'Registered', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)', border: 'rgba(14, 165, 233, 0.35)' };
    case 'Ongoing':
      return { label: 'Ongoing', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' };
    case 'Finished':
      return { label: 'Finished', color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.12)', border: 'rgba(161, 161, 170, 0.35)' };
    case 'Draft':
      return { label: 'Draft', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.35)' };
    case 'Cancelled':
      return { label: 'Cancelled', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)' };
    default:
      return { label: 'Unknown', color: 'var(--text-secondary)', bg: 'rgba(113, 113, 122, 0.12)', border: 'rgba(113, 113, 122, 0.35)' };
  }
};

const ReviewSlots = () => {
  const { user, refreshMe } = useAuth();
  const role = user?.role;
  // Quyá»n cÆ¡ báº£n theo role â€” Reviewer (GV Ä‘Æ°á»£c admin chá»‰ Ä‘á»‹nh) hoáº·c StudentLeader. Lecturer thÆ°á»ng khÃ´ng Ä‘Äƒng kÃ½ Ä‘Æ°á»£c.
  const roleAllowsRegister = hasRole(role, 'StudentLeader') || hasRole(role, 'Reviewer');

  // Khi vÃ o trang, refresh thÃ´ng tin user Ä‘á»ƒ Ä‘áº£m báº£o cÃ³ lecturerId/groupId má»›i nháº¥t.
  useEffect(() => { refreshMe().catch(() => {}); }, []);

  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [slots, setSlots] = useState<ReviewSlotDto[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());            // slotId má»›i chá»n (chÆ°a lÆ°u)
  const [pendingRemove, setPendingRemove] = useState<Set<number>>(new Set());  // slotId Ä‘Ã¡nh dáº¥u há»§y (chÆ°a lÆ°u)
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datePage, setDatePage] = useState(0);
  const [dragAnchor, setDragAnchor] = useState<DragCellCoord | null>(null);
  const [dragCurrent, setDragCurrent] = useState<DragCellCoord | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const suppressNextClickRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingReviews(true);
        const res = await api.get<ReviewDto[]>('/api/admin/reviews/all');
        setReviews(res.data);
        if (res.data.length > 0) {
          const order = (s: string) => (s === 'Registering' ? 0 : s === 'Registered' ? 1 : s === 'Ongoing' ? 2 : 3);
          const sorted = [...res.data].sort((a, b) => {
            const d = order(a.status) - order(b.status);
            if (d !== 0) return d;
            return new Date(b.windowStart).getTime() - new Date(a.windowStart).getTime();
          });
          setReviewId(sorted[0].id);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c danh sÃ¡ch Ä‘á»£t review');
      } finally {
        setLoadingReviews(false);
      }
    })();
  }, []);

  const fetchSlots = async (rid: number) => {
    try {
      setLoadingSlots(true);
      setError(null);
      const res = await api.get<ReviewSlotDto[]>(`/api/admin/reviews/${rid}/slots`);
      setSlots(res.data);
      setSelected(new Set());
      setPendingRemove(new Set());
    } catch (e: any) {
      setError(e?.response?.data?.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c danh sÃ¡ch slot');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (reviewId != null) fetchSlots(reviewId);
  }, [reviewId]);

  useEffect(() => {
    setDatePage(0);
  }, [reviewId]);

  const { dates, slotIndices, getSlot } = useMemo(() => {
    const dateSet = new Set<string>();
    const idxSet = new Set<number>();
    const map = new Map<string, ReviewSlotDto>();
    for (const s of slots) {
      const key = s.slotDate.substring(0, 10);
      dateSet.add(key);
      idxSet.add(s.slotIndex);
      map.set(`${key}_${s.slotIndex}`, s);
    }
    return {
      dates: Array.from(dateSet).sort(),
      slotIndices: Array.from(idxSet).sort((a, b) => a - b),
      getSlot: (date: string, idx: number) => map.get(`${date}_${idx}`) || null,
    };
  }, [slots]);

  const datePosMap = useMemo(() => {
    const map = new Map<string, number>();
    dates.forEach((d, i) => map.set(d, i));
    return map;
  }, [dates]);

  const slotIndexPosMap = useMemo(() => {
    const map = new Map<number, number>();
    slotIndices.forEach((idx, i) => map.set(idx, i));
    return map;
  }, [slotIndices]);

  const datesPerPage = 6;
  const pageCount = Math.max(1, Math.ceil(dates.length / datesPerPage));
  const safeDatePage = Math.min(datePage, pageCount - 1);
  const pagedDates = useMemo(
    () => {
      const slice = dates.slice(safeDatePage * datesPerPage, safeDatePage * datesPerPage + datesPerPage);
      return Array.from({ length: datesPerPage }, (_, index) => slice[index] ?? null);
    },
    [dates, safeDatePage],
  );
  const pageStart = dates.length === 0 ? 0 : safeDatePage * datesPerPage + 1;
  const pageEnd = Math.min(dates.length, pageStart + pagedDates.filter(Boolean).length - 1);

  // BE Ä‘Ã£ tÃ­nh sáºµn flag dá»±a trÃªn JWT â€” FE chá»‰ Ä‘á»c
  const isRegistered = (s: ReviewSlotDto): boolean => s.isCurrentUserRegistered;

  const slotState = (s: ReviewSlotDto): SlotState => {
    // Slot Ä‘Ã£ Ä‘Æ°á»£c admin phÃª duyá»‡t â†’ Æ°u tiÃªn hiá»ƒn thá»‹ vÃ ng, khÃ´ng cho há»§y
    if (s.isCurrentUserAssigned) return 'assigned';
    const registered = isRegistered(s);
    if (registered && pendingRemove.has(s.id)) return 'pendingUnregister';
    if (registered) return 'registered';
    if (selected.has(s.id)) return 'selected';
    return 'empty';
  };

  // Review hiá»‡n táº¡i â€” dÃ¹ng Ä‘á»ƒ xÃ¡c Ä‘á»‹nh Ä‘á»£t cÃ²n má»Ÿ Ä‘Äƒng kÃ½ khÃ´ng
  const currentReview = useMemo(() => reviews.find((r) => r.id === reviewId) ?? null, [reviews, reviewId]);
  const isRegistrationOpen = currentReview?.status === 'Registering';
  // Quyá»n cuá»‘i cÃ¹ng = role cho phÃ©p + Ä‘á»£t review Ä‘ang má»Ÿ Ä‘Äƒng kÃ½
  const canRegister = roleAllowsRegister && isRegistrationOpen;
  const reviewStatusBadge = getReviewStatusBadge(currentReview?.status);

  // Tá»•ng sau khi lÆ°u = Ä‘Ã£ Ä‘Äƒng kÃ½ - Ä‘Ã¡nh dáº¥u há»§y + má»›i chá»n
  const registeredCount = useMemo(() => slots.filter(isRegistered).length, [slots, user]);
  const registeredCancelableIds = useMemo(
    () => slots.filter((s) => isRegistered(s) && !s.isCurrentUserAssigned).map((s) => s.id),
    [slots],
  );
  const allRegisteredMarkedForRemove = useMemo(
    () => registeredCancelableIds.length > 0 && registeredCancelableIds.every((id) => pendingRemove.has(id)),
    [registeredCancelableIds, pendingRemove],
  );
  const totalAfterSubmit = registeredCount - pendingRemove.size + selected.size;
  const isStudent = hasRole(role, 'StudentLeader');
  const overLimit = isStudent && totalAfterSubmit > MAX_GROUP_PREFERENCES;
  const hasChanges = selected.size > 0 || pendingRemove.size > 0;

  // Single click â€” chuyá»ƒn state theo cycle:
  //   empty â†’ selected (xanh nÆ°á»›c)         selected â†’ empty (bá» chá»n)
  //   registered (xanh lÃ¡) â†’ pendingUnregister (Ä‘á», Ä‘Ã¡nh dáº¥u há»§y)
  //   pendingUnregister â†’ registered (bá» Ä‘Ã¡nh dáº¥u)
  //   assigned (vÃ ng) â†’ khÃ´ng cho Ä‘á»•i (Ä‘Ã£ Ä‘Æ°á»£c admin chá»‘t)
  const toggleSelect = (s: ReviewSlotDto) => {
    if (!canRegister || submitting) return;
    const state = slotState(s);
    if (state === 'assigned') return;
    if (state === 'registered') {
      const next = new Set(pendingRemove);
      next.add(s.id);
      setPendingRemove(next);
      return;
    }
    if (state === 'pendingUnregister') {
      const next = new Set(pendingRemove);
      next.delete(s.id);
      setPendingRemove(next);
      return;
    }
    const next = new Set(selected);
    if (next.has(s.id)) next.delete(s.id);
    else next.add(s.id);
    setSelected(next);
  };

  // Bulk toggle 1 nhÃ³m slot (1 hÃ ng / 1 cá»™t / toÃ n bá»™):
  //   Láº§n 1 (chÆ°a cÃ³ cÃ¡i nÃ o blue trong scope): chá»n háº¿t empty â†’ blue. Skip registered/pendingUnregister/assigned.
  //   Láº§n 2 (Ä‘Ã£ cÃ³ blue trong scope): deselect háº¿t blue â†’ empty.
  const bulkToggle = (scope: ReviewSlotDto[]) => {
    if (!canRegister || submitting) return;
    const blueInScope = scope.filter((s) => selected.has(s.id) && !s.isCurrentUserAssigned);
    const next = new Set(selected);
    if (blueInScope.length > 0) {
      for (const s of blueInScope) next.delete(s.id);
    } else {
      for (const s of scope) {
        if (slotState(s) === 'empty') next.add(s.id);
      }
    }
    setSelected(next);
  };

  // Helper: láº¥y táº¥t cáº£ slot trong 1 hÃ ng / 1 cá»™t / toÃ n bá»™
  const slotsInRow = (idx: number) => slots.filter((s) => s.slotIndex === idx);
  const slotsInCol = (date: string) => slots.filter((s) => s.slotDate.substring(0, 10) === date);

  const markAllRegisteredAsPendingRemove = () => {
    if (!canRegister || submitting) return;
    const next = new Set(pendingRemove);
    if (allRegisteredMarkedForRemove) {
      for (const id of registeredCancelableIds) next.delete(id);
    } else {
      for (const id of registeredCancelableIds) next.add(id);
    }
    setPendingRemove(next);
  };

  const isCoordInDragRect = (date: string, idx: number) => {
    if (!isDragging || !dragAnchor || !dragCurrent) return false;
    const datePos = datePosMap.get(date);
    const idxPos = slotIndexPosMap.get(idx);
    const anchorDatePos = datePosMap.get(dragAnchor.date);
    const currentDatePos = datePosMap.get(dragCurrent.date);
    const anchorIdxPos = slotIndexPosMap.get(dragAnchor.idx);
    const currentIdxPos = slotIndexPosMap.get(dragCurrent.idx);
    if (
      datePos == null
      || idxPos == null
      || anchorDatePos == null
      || currentDatePos == null
      || anchorIdxPos == null
      || currentIdxPos == null
    ) {
      return false;
    }
    const minDate = Math.min(anchorDatePos, currentDatePos);
    const maxDate = Math.max(anchorDatePos, currentDatePos);
    const minIdx = Math.min(anchorIdxPos, currentIdxPos);
    const maxIdx = Math.max(anchorIdxPos, currentIdxPos);
    return datePos >= minDate && datePos <= maxDate && idxPos >= minIdx && idxPos <= maxIdx;
  };

  const finalizeDragSelection = () => {
    if (!isDragging || !dragAnchor || !dragCurrent) {
      setIsDragging(false);
      setDragAnchor(null);
      setDragCurrent(null);
      return;
    }

    const moved = dragAnchor.date !== dragCurrent.date || dragAnchor.idx !== dragCurrent.idx;
    if (moved) {
      const anchorDatePos = datePosMap.get(dragAnchor.date);
      const currentDatePos = datePosMap.get(dragCurrent.date);
      const anchorIdxPos = slotIndexPosMap.get(dragAnchor.idx);
      const currentIdxPos = slotIndexPosMap.get(dragCurrent.idx);
      if (
        anchorDatePos != null
        && currentDatePos != null
        && anchorIdxPos != null
        && currentIdxPos != null
      ) {
        const minDate = Math.min(anchorDatePos, currentDatePos);
        const maxDate = Math.max(anchorDatePos, currentDatePos);
        const minIdx = Math.min(anchorIdxPos, currentIdxPos);
        const maxIdx = Math.max(anchorIdxPos, currentIdxPos);
        const slotsInRect = slots.filter((s) => {
          const dateKey = s.slotDate.substring(0, 10);
          const datePos = datePosMap.get(dateKey);
          const idxPos = slotIndexPosMap.get(s.slotIndex);
          if (datePos == null || idxPos == null) return false;
          return datePos >= minDate && datePos <= maxDate && idxPos >= minIdx && idxPos <= maxIdx;
        });
        const next = new Set(selected);
        const hasSelectedInRect = slotsInRect.some((s) => selected.has(s.id));

        if (hasSelectedInRect) {
          for (const s of slotsInRect) {
            if (selected.has(s.id)) next.delete(s.id);
          }
        } else {
          for (const s of slotsInRect) {
            if (slotState(s) === 'empty') next.add(s.id);
          }
        }
        setSelected(next);
        suppressNextClickRef.current = true;
      }
    }

    setIsDragging(false);
    setDragAnchor(null);
    setDragCurrent(null);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMouseUp = () => finalizeDragSelection();
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [isDragging, dragAnchor, dragCurrent, selected, slots, datePosMap, slotIndexPosMap, canRegister, submitting, pendingRemove]);

  // LÆ°u â€” 1 request bulk gá»­i cáº£ register + unregister cho BE xá»­ lÃ½ trong 1 transaction
  const submitChanges = async () => {
    if (!canRegister || !hasChanges || overLimit || submitting || reviewId == null) return;
    setSubmitting(true);
    setError(null);

    const registerIds = Array.from(selected);
    const unregisterIds = Array.from(pendingRemove);
    const subpath = hasRole(role, 'StudentLeader') ? 'groups' : 'lecturers';

    try {
      await api.post(`/api/admin/reviews/${reviewId}/slots/${subpath}/bulk`, {
        register: registerIds,
        unregister: unregisterIds,
      });
      await fetchSlots(reviewId);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'KhÃ´ng lÆ°u Ä‘Æ°á»£c thay Ä‘á»•i');
    } finally {
      setSubmitting(false);
    }
  };

  // ----------- styles theo state -----------
  const cellStyle = (state: SlotState): React.CSSProperties => {
    const base: React.CSSProperties = {
      minHeight: 78,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: canRegister ? 'pointer' : 'default',
      fontSize: '0.8rem',
      fontWeight: 600,
      userSelect: 'none',
      transition: 'all 0.15s ease',
    };
    if (state === 'registered') {
      return {
        ...base,
        background: 'rgba(16, 185, 129, 0.18)',
        border: '1.5px solid #10b981',
        color: '#10b981',
      };
    }
    if (state === 'selected') {
      return {
        ...base,
        background: 'rgba(14, 165, 233, 0.22)',
        border: '1.5px solid #0ea5e9',
        color: '#0ea5e9',
      };
    }
    if (state === 'pendingUnregister') {
      return {
        ...base,
        background: 'rgba(239, 68, 68, 0.18)',
        border: '1.5px solid #ef4444',
        color: '#ef4444',
      };
    }
    if (state === 'assigned') {
      return {
        ...base,
        background: 'rgba(234, 179, 8, 0.22)',
        border: '1.5px solid #eab308',
        color: '#ca8a04',
        cursor: 'not-allowed',
      };
    }
    return {
      ...base,
      background: 'var(--glass-card-bg)',
      border: '1px dashed var(--border-glass)',
      color: 'var(--text-secondary)',
    };
  };

  const renderCell = (date: string, idx: number) => {
    const slot = getSlot(date, idx);
    if (!slot) {
      return (
        <div
          key={`${date}_${idx}`}
          style={{ ...cellStyle('empty'), cursor: 'default', opacity: 0.4 }}
        >
          â€”
        </div>
      );
    }
    const state = slotState(slot);
    const inDragRect = isCoordInDragRect(date, idx);
    return (
      <Tooltip
        key={slot.id}
        content={
          state === 'assigned'
            ? 'Slot Ä‘Ã£ Ä‘Æ°á»£c admin phÃª duyá»‡t cho báº¡n'
            : state === 'registered'
            ? 'ÄÃ£ Ä‘Äƒng kÃ½ â€” báº¥m Ä‘á»ƒ Ä‘Ã¡nh dáº¥u há»§y'
            : state === 'pendingUnregister'
            ? 'ÄÃ£ Ä‘Ã¡nh dáº¥u há»§y â€” báº¥m Ä‘á»ƒ bá» Ä‘Ã¡nh dáº¥u'
            : state === 'selected'
            ? 'Äang chá»n â€” báº¥m "LÆ°u" Ä‘á»ƒ xÃ¡c nháº­n'
            : 'Báº¥m Ä‘á»ƒ chá»n'
        }
        variant="glass-card"
        placement="top"
        className={!canRegister && state !== 'assigned' && state !== 'registered' ? 'no-tooltip-hover' : ''}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <div
          style={{
            ...cellStyle(state),
            ...(inDragRect && (state === 'empty' || state === 'selected')
              ? { boxShadow: 'inset 0 0 0 1.5px #0ea5e9', background: 'rgba(14, 165, 233, 0.14)' }
              : {}),
            width: '100%',
            height: '100%',
          }}
          onMouseDown={(e) => {
            if (e.button !== 0 || !canRegister || submitting) return;
            setDragAnchor({ date, idx });
            setDragCurrent({ date, idx });
            setIsDragging(true);
            suppressNextClickRef.current = false;
            e.preventDefault();
          }}
          onMouseEnter={() => {
            if (!isDragging) return;
            setDragCurrent({ date, idx });
          }}
          onClick={() => {
            if (suppressNextClickRef.current) {
              suppressNextClickRef.current = false;
              return;
            }
            toggleSelect(slot);
          }}
        >
          {state === 'assigned' ? <Check size={18} />
            : state === 'registered' ? <Check size={18} />
            : state === 'pendingUnregister' ? 'âœ•'
            : ''}
        </div>
      </Tooltip>
    );
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <CalendarRange size={28} color="var(--accent-primary)" />
        <h1 className="text-gradient" style={{ margin: 0 }}>ÄÄƒng kÃ½ slot review</h1>
      </div>

      {/* Hint â€” Ä‘á»•i theo state (má»Ÿ Ä‘Äƒng kÃ½ / Ä‘Ã£ chá»‘t) + role */}
      <div
        className="glass-panel"
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: currentReview && !isRegistrationOpen ? 'var(--danger)' : 'var(--text-secondary)',
          background: currentReview && !isRegistrationOpen
            ? 'rgba(239, 68, 68, 0.08)'
            : undefined,
          border: currentReview && !isRegistrationOpen
            ? '1px solid rgba(239, 68, 68, 0.25)'
            : undefined,
        }}
      >
        {currentReview && !isRegistrationOpen ? (
          <>ÄÃ£ háº¿t thá»i háº¡n Ä‘Äƒng kÃ½ lá»‹ch.</>
        ) : (
          <>
            {hasRole(role, 'StudentLeader') && (
              <>Chá»n tá»‘i Ä‘a <b>{MAX_GROUP_PREFERENCES} slot</b> mong muá»‘n cho nhÃ³m.</>
            )}
            {hasRole(role, 'Reviewer') && (
              <>Chá»n cÃ¡c slot mong muá»‘n Ä‘Æ°á»£c dÃ¹ng Ä‘á»ƒ cháº¥m review (khÃ´ng giá»›i háº¡n).</>
            )}
            {!hasRole(role, 'Reviewer') && !hasRole(role, 'StudentLeader')
              && !hasRole(role, 'GroupMember') && !hasRole(role, 'Admin')
              && hasRole(role, 'Lecturer') && (
              <>Báº¡n chÆ°a Ä‘Æ°á»£c chá»‰ Ä‘á»‹nh lÃ m reviewer cho Ä‘á»£t review nÃ y â€” chá»‰ xem.</>
            )}
            {hasRole(role, 'GroupMember') && <>Báº¡n chá»‰ xem Ä‘Æ°á»£c lá»‹ch. LiÃªn há»‡ nhÃ³m trÆ°á»Ÿng Ä‘á»ƒ Ä‘Äƒng kÃ½.</>}
            {hasRole(role, 'Admin') && <>Báº¡n lÃ  Admin â€” cháº¿ Ä‘á»™ chá»‰ xem.</>}
          </>
        )}
      </div>

      {/* Review selector + counter + save button â€” gom vÃ o 1 panel */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 320px', minWidth: 260 }}>
          <CalendarRange size={16} color="var(--accent-primary)" />
          <label htmlFor="review-select" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Äá»£t review:
          </label>
          {loadingReviews ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <div style={{ position: 'relative', flex: 1 }}>
                <select
                  id="review-select"
                  value={reviewId ?? ''}
                  onChange={(e) => setReviewId(e.target.value ? parseInt(e.target.value, 10) : null)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 122, 51, 0.8)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 122, 51, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-glass)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 2.1rem 0.5rem 0.75rem',
                    borderRadius: 8,
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-glass)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {reviews.length === 0 && <option value="">â€” ChÆ°a cÃ³ Ä‘á»£t review nÃ o â€”</option>}
                  {reviews.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} ({r.type}#{r.orderIndex})
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.7rem',
                    pointerEvents: 'none',
                  }}
                >
                  â–¾
                </span>
              </div>

              <span
                style={{
                  padding: '0.33rem 0.58rem',
                  borderRadius: 999,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  color: reviewStatusBadge.color,
                  background: reviewStatusBadge.bg,
                  border: `1px solid ${reviewStatusBadge.border}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {reviewStatusBadge.label}
              </span>
            </>
          )}
        </div>

        {canRegister && (
          <>
            <div style={{ display: 'flex', gap: 14, fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span>ÄÃ£ Ä‘Äƒng kÃ½ <b style={{ color: '#10b981' }}>{registeredCount}</b></span>
              <span>ThÃªm <b style={{ color: '#0ea5e9' }}>{selected.size}</b></span>
              <span>Há»§y <b style={{ color: '#ef4444' }}>{pendingRemove.size}</b></span>
              {isStudent && <span>Tá»‘i Ä‘a <b>{MAX_GROUP_PREFERENCES}</b></span>}
            </div>
            <button
              className="btn btn-primary"
              disabled={!hasChanges || overLimit || submitting}
              onClick={submitChanges}
              style={{ padding: '0.5rem 1rem', marginLeft: 'auto' }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {' '}LÆ°u ({selected.size + pendingRemove.size})
            </button>
          </>
        )}
      </div>

      {overLimit && (
        <div
          className="glass-panel"
          style={{
            padding: '0.6rem 0.9rem', marginBottom: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)', fontSize: '0.85rem',
          }}
        >
          VÆ°á»£t quÃ¡ {MAX_GROUP_PREFERENCES} nguyá»‡n vá»ng â€” bá» bá»›t {totalAfterSubmit - MAX_GROUP_PREFERENCES} slot.
        </div>
      )}

      {error && (
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem 1rem', marginBottom: '1rem',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'pre-wrap',
          }}
        >
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '0.75rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span><span style={{ display: 'inline-block', width: 14, height: 14, background: 'rgba(14, 165, 233, 0.22)', border: '1.5px solid #0ea5e9', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> Äang chá»n</span>
          <span><span style={{ display: 'inline-block', width: 14, height: 14, background: 'rgba(16, 185, 129, 0.18)', border: '1.5px solid #10b981', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> ÄÃ£ Ä‘Äƒng kÃ½</span>
          <span><span style={{ display: 'inline-block', width: 14, height: 14, background: 'rgba(234, 179, 8, 0.22)', border: '1.5px solid #eab308', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> ÄÃ£ phÃª duyá»‡t</span>
          <span><span style={{ display: 'inline-block', width: 14, height: 14, background: 'rgba(239, 68, 68, 0.18)', border: '1.5px solid #ef4444', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> ÄÃ¡nh dáº¥u há»§y</span>
        </div>

        {dates.length > datesPerPage && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ marginRight: 4 }}>Äang hiá»ƒn thá»‹ ngÃ y {pageStart}-{pageEnd} / {dates.length}</span>
            <button
              className="btn btn-secondary"
              disabled={safeDatePage === 0}
              onClick={() => setDatePage((v) => Math.max(0, v - 1))}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            >
              â€¹
            </button>
            {Array.from({ length: pageCount }, (_, i) => i).map((page) => (
              <button
                key={`date_page_${page}`}
                className="btn"
                onClick={() => setDatePage(page)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  minWidth: 32,
                  ...(page === safeDatePage
                    ? { background: 'rgba(255, 122, 51, 0.18)', color: 'var(--accent-primary)', border: '1px solid rgba(255, 122, 51, 0.35)' }
                    : { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-glass)' }),
                }}
              >
                {page + 1}
              </button>
            ))}
            <button
              className="btn btn-secondary"
              disabled={safeDatePage >= pageCount - 1}
              onClick={() => setDatePage((v) => Math.min(pageCount - 1, v + 1))}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            >
              â€º
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {reviewId == null ? (
        <p style={{ color: 'var(--text-secondary)' }}>Chá»n 1 Ä‘á»£t review Ä‘á»ƒ xem slot.</p>
      ) : loadingSlots ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
          <Loader2 size={18} className="animate-spin" /> Äang táº£i slot...
        </div>
      ) : slots.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>Äá»£t review nÃ y chÆ°a cÃ³ slot nÃ o.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `96px repeat(${pagedDates.length}, minmax(96px, 1fr))`,
              gap: 6,
              minWidth: 96 + pagedDates.length * 102,
            }}
          >
            {/* Ã” gÃ³c trÃªn-trÃ¡i â€” bulk select toÃ n bá»™ */}
            <Tooltip
              content={canRegister ? 'Báº¥m Ä‘á»ƒ báº­t/táº¯t Ä‘Ã¡nh dáº¥u há»§y toÃ n bá»™ slot Ä‘Ã£ Ä‘Äƒng kÃ½ (xanh lÃ¡)' : ''}
              variant="glass-card"
              placement="top"
              className={!canRegister ? 'no-tooltip-hover' : ''}
              style={{ display: 'block', width: '100%', height: '100%' }}
            >
              <div
                onClick={canRegister ? markAllRegisteredAsPendingRemove : undefined}
                style={{
                  padding: '0.4rem',
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  textAlign: 'center',
                  background: 'var(--surface-glass)',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: canRegister ? 'pointer' : 'default',
                  transition: 'background 0.15s ease',
                  userSelect: 'none',
                  width: '100%',
                  height: '100%',
                }}
                onMouseEnter={(e) => { if (canRegister) e.currentTarget.style.background = 'rgba(14, 165, 233, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-glass)'; }}
              >
                âœ¦
              </div>
            </Tooltip>

            {/* Header ngÃ y â€” click chá»n cáº£ cá»™t */}
            {pagedDates.map((date, pageIndex) => {
              if (!date) {
                return (
                  <div
                    key={`hdr_empty_${pageIndex}`}
                    style={{
                      padding: '0.4rem',
                      fontWeight: 600,
                      color: 'var(--text-tertiary)',
                      textAlign: 'center',
                      background: 'var(--surface-glass)',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      userSelect: 'none',
                      opacity: 0.45,
                      minHeight: 51,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    â€”
                  </div>
                );
              }
              const info = parseDateInfo(date);
              return (
                <Tooltip
                  key={`hdr_${date}`}
                  content={canRegister ? `Báº¥m Ä‘á»ƒ chá»n / bá» chá»n cáº£ cá»™t ${info.dateStr}` : ''}
                  variant="glass-card"
                  placement="top"
                  className={!canRegister ? 'no-tooltip-hover' : ''}
                  style={{ display: 'block', width: '100%', height: '100%' }}
                >
                  <div
                    onClick={canRegister ? () => bulkToggle(slotsInCol(date)) : undefined}
                    style={{
                      padding: '0.4rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      background: 'var(--surface-glass)',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      cursor: canRegister ? 'pointer' : 'default',
                      transition: 'background 0.15s ease',
                      userSelect: 'none',
                      width: '100%',
                      height: '100%',
                    }}
                    onMouseEnter={(e) => { if (canRegister) e.currentTarget.style.background = 'rgba(14, 165, 233, 0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-glass)'; }}
                  >
                    <div>{info.dow}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{info.dateStr}</div>
                  </div>
                </Tooltip>
              );
            })}

            {slotIndices.map((idx) => (
              <Fragment key={`row_${idx}`}>
                {/* Label "Slot N" â€” click chá»n cáº£ hÃ ng */}
                <Tooltip
                  content={canRegister ? `Báº¥m Ä‘á»ƒ chá»n / bá» chá»n cáº£ hÃ ng Slot ${idx}` : ''}
                  variant="glass-card"
                  placement="top"
                  className={!canRegister ? 'no-tooltip-hover' : ''}
                  style={{ display: 'block', width: '100%', height: '100%' }}
                >
                  <div
                    onClick={canRegister ? () => bulkToggle(slotsInRow(idx)) : undefined}
                    style={{
                      padding: '0.4rem',
                      minHeight: 42,
                      minWidth: 96,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      background: 'var(--surface-glass)',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      cursor: canRegister ? 'pointer' : 'default',
                      transition: 'background 0.15s ease',
                      userSelect: 'none',
                      lineHeight: 1.1,
                      width: '100%',
                      height: '100%',
                    }}
                    onMouseEnter={(e) => { if (canRegister) e.currentTarget.style.background = 'rgba(14, 165, 233, 0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-glass)'; }}
                  >
                    Slot {idx}
                    <div style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.1 }}>
                      {getReviewSlotTimeRange(idx)}
                    </div>
                  </div>
                </Tooltip>
                {pagedDates.map((date, pageIndex) => (
                  <Fragment key={`cell_${idx}_${pageIndex}`}>
                    {date ? renderCell(date, idx) : (
                      <div
                        style={{
                          ...cellStyle('empty'),
                          cursor: 'default',
                          opacity: 0.25,
                          pointerEvents: 'none',
                        }}
                        aria-hidden="true"
                      >
                        â€”
                      </div>
                    )}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSlots;
```


## File: src\pages\TopicIdeas.tsx
```typescript

const TopicIdeas = () => {
  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Quáº£n lÃ½ Ä‘á» tÃ i</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Danh sÃ¡ch cÃ¡c Ä‘á» tÃ i</p>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Trang nÃ y hiá»‡n Ä‘ang trá»‘ng. Dá»¯ liá»‡u sáº½ Ä‘Æ°á»£c thÃªm vÃ o sau.
        </div>
      </div>
    </div>
  );
};

export default TopicIdeas;
```


## File: src\pages\TopicManagement.tsx
```typescript

import { useState, useEffect } from 'react';
import api from '../services/api';
import type { DashboardItem, SemesterListItemDto, LinkGroupsResultDto } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { hasRole } from '../utils/role';
import { Search, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Link2, AlertCircle, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from '../components/Tooltip';

const TopicManagement = () => {
  const [data, setData] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [finalized, setFinalized] = useState<string>('');
  const [sortBy, setSortBy] = useState('newest');
  // Semester filter â€” '' = táº¥t cáº£, hoáº·c semesterId (string vÃ¬ select value lÃ  string)
  const [semesters, setSemesters] = useState<SemesterListItemDto[]>([]);
  const [semesterId, setSemesterId] = useState<string>('');
  const [semestersLoaded, setSemestersLoaded] = useState(false);
  const navigate = useNavigate();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const isAdmin = hasRole(user?.role, 'Admin');

  // Load semesters 1 láº§n. Default = '' (Táº¥t cáº£) Ä‘á»ƒ khÃ´ng miss nhÃ³m chÆ°a link vá»›i semester.
  // (TrÆ°á»›c default Ongoing -> nhÃ³m import nhÆ°ng chÆ°a link semester sáº½ khÃ´ng hiá»‡n -> dashboard trá»‘ng bÃ­ áº©n)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<SemesterListItemDto[]>('/api/admin/semesters');
        setSemesters(res.data);
      } catch (err) {
        console.error('Failed to fetch semesters', err);
      } finally {
        setSemestersLoaded(true);
      }
    })();
  }, []);

  // Quick-action: gá»i backfill link-groups (chá»‰ Admin) â€” dÃ¹ng khi dashboard trá»‘ng vÃ¬ group thiáº¿u SemesterId
  const [linking, setLinking] = useState(false);
  const handleLinkGroups = async () => {
    if (linking) return;
    try {
      setLinking(true);
      const res = await api.post<LinkGroupsResultDto>('/api/admin/semesters/link-groups', {});
      const r = res.data;
      alert(`ÄÃ£ ná»‘i ${r.linked}/${r.totalUnlinked} nhÃ³m vá»›i há»c ká»³ tÆ°Æ¡ng á»©ng.${r.skipped > 0 ? `\n${r.skipped} nhÃ³m chÆ°a ná»‘i Ä‘Æ°á»£c (chÆ°a cÃ³ há»c ká»³ tÆ°Æ¡ng á»©ng).` : ''}`);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Äá»“ng bá»™ nhÃ³m tháº¥t báº¡i');
    } finally {
      setLinking(false);
    }
  };

  // Export Ä‘á» tÃ i ra file ZIP
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const params: Record<string, string> = {};
      if (semesterId) params.semesterId = semesterId;

      const res = await api.get('/api/export/projects', {
        params,
        responseType: 'blob',
      });

      // Láº¥y tÃªn file tá»« Content-Disposition header, fallback tÃªn máº·c Ä‘á»‹nh
      const contentDisposition = res.headers['content-disposition'];
      let fileName = `Export_DeTai_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;'"\n]+)/i);
        if (match) fileName = decodeURIComponent(match[1]);
      }

      // Trigger download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const message = err?.response?.status === 404
        ? 'KhÃ´ng cÃ³ nhÃ³m nÃ o Ä‘á»ƒ export'
        : (err?.response?.data?.message || 'Export tháº¥t báº¡i');
      alert(message);
    } finally {
      setExporting(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { sortBy };
      if (search) params.search = search;
      if (finalized !== '') params.finalized = finalized;
      if (semesterId !== '') params.semesterId = semesterId;
      const res = await api.get<DashboardItem[]>('/api/dashboard', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch topics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Äá»£i semesters load xong rá»“i má»›i fetch â€” trÃ¡nh fetch 2 láº§n (1 láº§n default, 1 láº§n sau khi default semester Ä‘Æ°á»£c set).
    if (!semestersLoaded) return;
    const t = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, finalized, sortBy, semesterId, semestersLoaded]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, finalized, sortBy, semesterId]);

  // Pagination Calculations
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const displayedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPageNumbers = () => {
    const blockSize = 10;
    const blockIndex = Math.floor((currentPage - 1) / blockSize);
    const start = blockIndex * blockSize + 1;
    const end = Math.min(totalPages, (blockIndex + 1) * blockSize);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Quáº£n lÃ½ Ä‘á»“ Ã¡n</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Danh sÃ¡ch nhÃ³m Ä‘ang hÆ°á»›ng dáº«n</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="TÃ¬m theo mÃ£ nhÃ³m hoáº·c tÃªn Ä‘á» tÃ i..."
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Tooltip content="Lá»c theo há»c ká»³" variant="glass-card">
            <select
              className="input-field"
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="">Táº¥t cáº£ há»c ká»³</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} ({s.status})
                </option>
              ))}
            </select>
          </Tooltip>

          <select className="input-field" value={finalized} onChange={(e) => setFinalized(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Táº¥t cáº£ tráº¡ng thÃ¡i</option>
            <option value="true">ÄÃ£ finalize</option>
            <option value="false">ChÆ°a finalize</option>
          </select>

          <select className="input-field" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 'auto' }}>
            <option value="newest">Má»›i nháº¥t</option>
            <option value="oldest">CÅ© nháº¥t</option>
          </select>

          {(isAdmin || hasRole(user?.role, 'Lecturer') || hasRole(user?.role, 'StudentLeader')) && (
            <Tooltip content="Export danh sÃ¡ch Ä‘á» tÃ i ra file ZIP" variant="glass-card">
              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={exporting || loading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
              >
                <Download size={16} />
                {exporting ? 'Äang export...' : 'Export'}
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Äang táº£i...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: isAdmin && semesterId !== '' ? '1rem' : 0 }}>
              {semesterId === ''
                ? (isAdmin ? 'ChÆ°a cÃ³ nhÃ³m nÃ o trong há»‡ thá»‘ng. HÃ£y import file Excel á»Ÿ má»¥c "Import Excel".' : 'Báº¡n chÆ°a cÃ³ nhÃ³m nÃ o Ä‘Æ°á»£c phÃ¢n cÃ´ng.')
                : `KhÃ´ng cÃ³ nhÃ³m nÃ o trong há»c ká»³ nÃ y${isAdmin ? ' (cÃ³ thá»ƒ nhÃ³m Ä‘Ã£ import nhÆ°ng chÆ°a Ä‘Æ°á»£c ná»‘i vá»›i há»c ká»³).' : '.'}`}
            </p>
            {isAdmin && semesterId !== '' && (
              <div style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                padding: '1rem 1.5rem', marginTop: '0.5rem',
                background: 'rgba(251, 146, 60, 0.08)',
                border: '1px solid rgba(251, 146, 60, 0.2)',
                borderRadius: '10px',
                maxWidth: 480,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <AlertCircle size={18} color="var(--accent-primary)" />
                  <strong style={{ fontSize: '0.9rem' }}>Tip cho Admin</strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  NhÃ³m vá»«a import cÃ³ thá»ƒ chÆ°a Ä‘Æ°á»£c ná»‘i vá»›i há»c ká»³. Báº¥m nÃºt bÃªn dÆ°á»›i Ä‘á»ƒ tá»± Ä‘á»™ng ná»‘i theo mÃ£ nhÃ³m (vd <code style={{ background: 'var(--surface-glass)', padding: '0.05rem 0.3rem', borderRadius: 3 }}>GSU26SE01</code> â†’ ká»³ <code style={{ background: 'var(--surface-glass)', padding: '0.05rem 0.3rem', borderRadius: 3 }}>SU26</code>).
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleLinkGroups}
                  disabled={linking}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Link2 size={14} /> {linking ? 'Äang Ä‘á»“ng bá»™...' : 'Äá»“ng bá»™ nhÃ³m theo mÃ£'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>MÃ£ nhÃ³m</th>
                    <th>TÃªn Ä‘á» tÃ i</th>
                    <th>TrÆ°á»Ÿng nhÃ³m</th>
                    <th>Giáº£ng viÃªn hÆ°á»›ng dáº«n 1</th>
                    <th>Giáº£ng viÃªn hÆ°á»›ng dáº«n 2</th>
                    <th>Sá»‘ version</th>
                    <th>Tráº¡ng thÃ¡i</th>
                    <th>Cáº­p nháº­t</th>
                    <th>Thao tÃ¡c</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedData.map(item => (
                    <tr key={item.groupId}>
                      <td><strong>{item.groupCode}</strong></td>
                      <td>{item.projectName || 'â€”'}</td>
                      <td>
                        <div>{item.leaderFullName || 'â€”'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.leaderEmail}</div>
                      </td>
                      <td>
                        {item.lecturer1Name || <span style={{ color: 'var(--text-secondary)' }}>â€”</span>}
                      </td>
                      <td>
                        {item.lecturer2Name ? <span>{item.lecturer2Name}</span> : <span style={{ color: 'var(--text-secondary)' }}>â€”</span>}
                      </td>
                      <td>{item.submittedVersionCount}</td>
                      <td>
                        <span className={`badge ${item.isFinalized ? 'badge-success' : 'badge-warning'}`}>
                          {item.isFinalized ? 'Finalized' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('vi-VN') : 'â€”'}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => navigate(`/projects/${item.groupId}`)}
                        >
                          <Eye size={14} /> Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '1rem 1.5rem', 
                borderTop: '1px solid var(--border-glass)',
                background: 'var(--surface-glass)',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiá»ƒn thá»‹ <strong>{Math.min(data.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(data.length, currentPage * itemsPerPage)}</strong> trong tá»•ng sá»‘ <strong>{data.length}</strong> káº¿t quáº£
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Tooltip content="Cá»¥m trÆ°á»›c" variant="glass-card" className={currentPage <= 10 ? 'no-tooltip-hover' : ''} style={{ display: 'flex' }}>
                    <button
                      onClick={() => {
                        const blockIndex = Math.floor((currentPage - 1) / 10);
                        setCurrentPage(Math.max(1, blockIndex * 10));
                      }}
                      disabled={currentPage <= 10}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage <= 10 ? 0.5 : 1, cursor: currentPage <= 10 ? 'not-allowed' : 'pointer' }}
                    >
                      <ChevronsLeft size={16} />
                    </button>
                  </Tooltip>

                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {getPageNumbers().map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ 
                        padding: '0.4rem 0.75rem', 
                        minWidth: '32px',
                        background: currentPage === page ? 'var(--accent-primary)' : 'transparent',
                        border: currentPage === page ? 'none' : '1px solid var(--border-glass)',
                        color: currentPage === page ? 'white' : 'var(--text-primary)'
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronRight size={16} />
                  </button>

                  <Tooltip content="Cá»¥m sau" variant="glass-card" className={Math.floor((totalPages - 1) / 10) === Math.floor((currentPage - 1) / 10) ? 'no-tooltip-hover' : ''} style={{ display: 'flex' }}>
                    <button
                      onClick={() => {
                        const blockIndex = Math.floor((currentPage - 1) / 10);
                        const nextBlockPage = (blockIndex + 1) * 10 + 1;
                        setCurrentPage(Math.min(totalPages, nextBlockPage));
                      }}
                      disabled={Math.floor((totalPages - 1) / 10) === Math.floor((currentPage - 1) / 10)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: (Math.floor((totalPages - 1) / 10) === Math.floor((currentPage - 1) / 10)) ? 0.5 : 1, cursor: (Math.floor((totalPages - 1) / 10) === Math.floor((currentPage - 1) / 10)) ? 'not-allowed' : 'pointer' }}
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TopicManagement;
```


## File: src\services\api.ts
```typescript

import axios from 'axios';

// Prod: FORCE same-origin (Vercel proxy /api/* â†’ BE) â€” bá» qua VITE_API_URL Ä‘á»ƒ trÃ¡nh
// trÆ°á»ng há»£p Vercel project env var trá» tháº³ng HTTP BE gÃ¢y mixed-content.
// Dev: dÃ¹ng VITE_API_URL (vd https://localhost:7198) hoáº·c fallback.
const baseURL = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_URL || 'https://localhost:7198');

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// KhÃ´ng refresh cho cÃ¡c endpoint auth â€” náº¿u 401 á»Ÿ Ä‘Ã¢y lÃ  lá»—i login tháº­t,
// pháº£i Ä‘á»ƒ propagate nguyÃªn váº¹n cho UI hiá»ƒn thá»‹ message tá»« BE.
const isAuthEndpoint = (url?: string) =>
  !!url && (url.includes('/api/auth/google') || url.includes('/api/auth/refresh'));

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const { accessToken } = res.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
```


## File: src\types\index.ts
```typescript

export type Role = 'Admin' | 'Lecturer' | 'StudentLeader' | 'GroupMember' | 'Student' | 'Reviewer';

export interface User {
  userId?: number;
  email: string;
  fullName: string;
  role: string;
  groupId?: number | null;
}

export interface AuthResponse {
  accessToken: string;
  role: string;
  email: string;
  fullName: string;
}

export interface CurrentUserDto {
  userId: number;
  email: string;
  fullName: string;
  role: string;   // [Flags] enum.ToString() â€” single role "Admin" hoáº·c multi "Admin, Lecturer"
  groupId: number | null;
}

// Matches BE DashboardGroupDto
export interface DashboardItem {
  groupId: number;
  groupCode: string;
  projectName: string;
  leaderFullName: string;
  leaderEmail: string;
  lecturer1Name: string;
  lecturer2Name: string | null;
  submittedVersionCount: number;
  isFinalized: boolean;
  lastUpdated: string;
}

export interface MemberDto {
  fullName: string;
  email: string;
  isLeader: boolean;
}

export interface VersionSummaryDto {
  versionId: number;
  versionNumber: number;
  projectNameSnapshot: string;
  createdAt: string;
  isFinalized: boolean;
  documentCount: number;
  documents: DocumentDto[];
}

export interface DocumentDto {
  id: number;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

export interface ProjectDetailDto {
  groupId: number;
  groupCode: string;
  projectCode: string;
  projectName: string;
  description: string | null;
  lecturerName: string;
  members: MemberDto[];
  versions: VersionSummaryDto[];
  currentDocuments: DocumentDto[];
}

export interface UserListItem {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserImportRowError {
  rowNumber: number;
  reason: string;
}

export interface ImportUsersResultDto {
  created: number;
  updated: number;
  skipped: number;
  errors: UserImportRowError[];
}

export interface UserDetailDto {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  googleSubject: string | null;
  lecturerProfile: { id: number; code: string | null } | null;
  studentProfile: { id: number } | null;
}

export type ImportJobStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';

export interface ImportStatusDto {
  id: number;
  status: ImportJobStatus | number; // BE serialize enum: náº¿u giá»¯ sá»‘ thÃ¬ FE map sau
  errorReport: string | null;
  groupsCreated: number | null;
  usersCreated: number | null;
  completedAt: string | null;
}

export interface AuditLogDto {
  id: number;
  actorEmail: string;
  action: string;
  targetEntity: string | null;
  targetId: number | null;
  details: string | null;
  createdAt: string;
}

export interface LecturerListItemDto {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  code: string | null;
  isActive: boolean;
}

// Reviewer â€” lecturer hiá»‡n Ä‘ang cÃ³ cá» Reviewer (global, BE: ReviewerDto)
export interface ReviewerDto {
  lecturerId: number;
  userId: number;
  email: string;
  fullName: string;
  code: string | null;
}

export interface LecturerImportError {
  rowNumber: number;
  reason: string;
}

export interface ImportLecturersResultDto {
  updated: number;
  created: number;
  skipped: number;
  errors: LecturerImportError[];
}

// BE serialize enum thÃ nh string nhá» JsonStringEnumConverter
export type SemesterSeason = 'Spring' | 'Summer' | 'Fall';
export type SemesterStatus = 'Ongoing' | 'Completed' | 'Cancelled' | 'Pending';

export interface SemesterListItemDto {
  id: number;
  code: string;            // SP26, SU26, FA26...
  season: SemesterSeason;
  year: number;
  startDate: string;
  endDate: string;
  status: SemesterStatus;
  groupCount: number;
}

// Detail tráº£ thÃªm timestamps (BE: SemesterDetailDto)
export interface SemesterDetailDto extends SemesterListItemDto {
  createdAt: string;
  updatedAt: string | null;
}

// Holiday gáº¯n vÃ o 1 semester (BE: SemesterHolidayDto)
export interface SemesterHolidayDto {
  id: number;
  semesterId: number;
  templateId: number | null;
  label: string;
  startDate: string;
  durationDays: number;
  isCompensated: boolean;
}

// Káº¿t quáº£ ná»‘i nhÃ³m vá»›i há»c ká»³ qua GroupCode (vd GSU26SE02 â†’ SU26)
export interface LinkGroupsResultDto {
  totalUnlinked: number;
  linked: number;
  skipped: number;
  skippedGroups: string[];
}

// Review window / Defence window â€” 1 review = 1 cá»­a sá»• thá»i gian (vd 2 tuáº§n) Ä‘á»ƒ book slot.
// BE Ä‘Ã£ rename SemesterMilestone -> Review. Endpoint /api/admin/reviews.
export type ReviewType = 'Review' | 'Defence';
export type ReviewStatus = 'Draft' | 'Registering' | 'Registered' | 'Ongoing' | 'Finished' | 'Cancelled';

export interface ReviewDto {
  id: number;
  semesterId: number;
  type: ReviewType;
  orderIndex: number;
  label: string;
  windowStart: string;
  windowEnd: string;
  status: ReviewStatus;
  note: string | null;
}

// Aliases Ä‘á»ƒ giá»¯ compat táº¡m thá»i (giáº£m rá»§i ro rename á»Ÿ component)
export type MilestoneType = ReviewType;
export type SemesterMilestoneDto = ReviewDto;

// ---- Slot review (BE: /api/admin/reviews/{id}/slots) ----
// ÄÄƒng kÃ½ giá» lÃ  NGUYá»†N Vá»ŒNG: nhÃ³m tá»‘i Ä‘a 5 slot/Ä‘á»£t, GV khÃ´ng giá»›i háº¡n.
// Slot thá»±c táº¿ cá»§a 1 láº§n review = ReviewAssignment (sinh sau thuáº­t toÃ¡n xáº¿p lá»‹ch).
export interface ReviewAssignmentDto {
  id: number;
  sessionIndex: number;
  groupId: number;
  groupCode: string;
  lecturer1Id: number;
  lecturer1Name: string;
  lecturer2Id: number | null;
  lecturer2Name: string | null;
  isActive: boolean;
}

export interface ReviewSlotDto {
  id: number;
  reviewId: number;
  slotDate: string;
  slotIndex: number;
  roomCount: number;
  plannedCapacity: number;
  groupPreferenceCount: number;
  lecturerPreferenceCount: number;
  assignmentCount: number;
  isCurrentUserRegistered: boolean;   // BE compute tá»« JWT â€” slot cÃ³ chá»©a group/lecturer cá»§a user hiá»‡n táº¡i
  isCurrentUserAssigned: boolean;     // GV Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t review slot nÃ y (ReviewAssignment active)
  assignments: ReviewAssignmentDto[];
  note: string | null;
}

// Sá»‘ nguyá»‡n vá»ng tá»‘i Ä‘a cho nhÃ³m (Ä‘á»“ng bá»™ vá»›i BE ReviewSlotGroup.MaxPreferences)
export const MAX_GROUP_PREFERENCES = 5;

// ---- Scheduling (xáº¿p lá»‹ch review) â€” BE: /api/admin/reviews/{id}/scheduling ----
// BE serialize enum thÃ nh string nhá» JsonStringEnumConverter.
export type SchedulingJobStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

// Polling DTO â€” GET /api/admin/reviews/scheduling/{jobId}
export interface SchedulingStatusDto {
  id: number;
  reviewId: number;
  status: SchedulingJobStatus;
  force: boolean;
  resultJson: string | null;   // JSON serialize tá»« runner (xem SchedulingResultSummary)
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

// Ná»™i dung parse tá»« resultJson. Runner serialize báº±ng JsonSerializer máº·c Ä‘á»‹nh:
// key top-level giá»¯ nguyÃªn (assigned, groupsScheduled, ...) nhÆ°ng record con lÃ  PascalCase.
export interface SchedulingResultSummary {
  assigned: number;
  groupsScheduled: number;
  unassignedGroups: { GroupId: number; Reason: string }[];
  underQuotaReviewers: { LecturerId: number; SlotCount: number }[];
  force: boolean;
}

// Káº¿t quáº£ xáº¿p lá»‹ch â€” GET /api/admin/reviews/{id}/assignments
export interface ReviewScheduleAssignmentDto {
  assignmentId: number;
  slotId: number;
  slotDate: string;
  slotIndex: number;
  sessionIndex: number;
  groupId: number;
  groupCode: string;
  lecturer1Id: number;
  lecturer1Name: string;
  lecturer2Id: number | null;
  lecturer2Name: string | null;
}

// Káº¿t quáº£ cascade khi thÃªm/sá»­a/xÃ³a lá»… cÃ³ bÃ¹ â€” FE dÃ¹ng Ä‘á»ƒ show feedback cÃ¡c ká»³/milestone Ä‘Ã£ shift
export interface ShiftedSemesterDto {
  id: number;
  code: string;
  oldStart: string;
  newStart: string;
  oldEnd: string;
  newEnd: string;
  deltaDays: number;
}

export interface ShiftedMilestoneDto {
  id: number;
  label: string;
  oldWindowStart: string;
  newWindowStart: string;
  oldWindowEnd: string;
  newWindowEnd: string;
  reason: string;
}

export interface OverflowItemDto {
  id: number;
  kind: 'Holiday' | 'Milestone';
  label: string;
  semesterId: number;
  semesterCode: string;
  overflowDays: number;
}

export interface HolidayCascadeResultDto {
  id?: number;                 // cÃ³ khi Create, váº¯ng khi Update/Delete
  semesterId: number;
  shiftedSemesters: ShiftedSemesterDto[];
  shiftedMilestones: ShiftedMilestoneDto[];
  overflows: OverflowItemDto[];
  skippedCompletedCodes: string[];
}

// ---- Dashboard GVHD (BE: /api/dashboard/stats, /api/dashboard/assigned-slots) ----
export interface DashboardReviewDto {
  id: number;
  label: string;
  type: ReviewType;
  orderIndex: number;
  windowStart: string;
  windowEnd: string;
  status: ReviewStatus;
  isExpired: boolean;
}

export interface DashboardMyGroupDto {
  groupId: number;
  groupCode: string;
}

export interface DashboardStatsDto {
  totalGroups: number;
  reviews: DashboardReviewDto[];
  // BE serialize Dictionary<int,int> â†’ key lÃ  string
  assignedSlotCounts: Record<string, number>;
  myGroup: DashboardMyGroupDto | null;
  viewerRole: 'Lecturer' | 'Student' | 'Admin';
}

export interface LecturerAssignedSlotDto {
  assignmentId: number;
  reviewId: number;
  reviewLabel: string;
  reviewType: ReviewType;
  slotDate: string;
  slotIndex: number;
  sessionIndex: number;
  startTime: string;        // "HH:mm"
  endTime: string;          // "HH:mm"
  groupId: number;
  groupCode: string;
  projectName: string;
  lecturer1Id: number;
  lecturer1Name: string;
  lecturer2Id: number | null;
  lecturer2Name: string | null;
  partnerLecturerId: number | null;     // chá»‰ set cho lecturer view
  partnerLecturerName: string | null;
  isExpired: boolean;
}

// Template lá»… Ä‘á»™c láº­p â€” admin sá»­a template chá»‰ áº£nh hÆ°á»Ÿng nÄƒm sinh sau.
// VD: Táº¿t NguyÃªn ÄÃ¡n dÃ¹ng ngÃ y tÆ°á»£ng trÆ°ng 10/2 â€” khi gÃ¡n vÃ o ká»³ cá»¥ thá»ƒ, admin chá»‰nh láº¡i cho Ä‘Ãºng nÄƒm.
export interface HolidayTemplateDto {
  id: number;
  label: string;
  isAnnual: boolean;
  isActive: boolean;
  isCompensated: boolean;
  defaultStartMonth: number;     // 1-12
  defaultStartDay: number;       // 1-31
  defaultDurationDays: number;
}
```


## File: src\utils\reviewSlotTime.ts
```typescript

const SLOT_ONE_START_MINUTES = 7 * 60;
const SLOT_DURATION_MINUTES = 135;
const SLOT_GAP_MINUTES = 15;
const LUNCH_BREAK_START_SLOT = 3;
const LUNCH_BREAK_OFFSET_MINUTES = 30;

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const getReviewSlotTimeRange = (slotIndex: number) => {
  const travelBufferMinutes = (slotIndex - 1) * SLOT_GAP_MINUTES;
  const lunchBreakOffset = slotIndex >= LUNCH_BREAK_START_SLOT ? LUNCH_BREAK_OFFSET_MINUTES : 0;
  const startMinutes = SLOT_ONE_START_MINUTES + (slotIndex - 1) * SLOT_DURATION_MINUTES + travelBufferMinutes + lunchBreakOffset;
  const endMinutes = startMinutes + SLOT_DURATION_MINUTES;
  return `${formatTime(startMinutes)} - ${formatTime(endMinutes)}`;
};
```


## File: src\utils\role.ts
```typescript

import type { Role } from '../types';

// BE serialize [Flags] enum thÃ nh string: single role "Admin" hoáº·c multi "Admin, Lecturer".
// TÃ¡ch thÃ nh Set Ä‘á»ƒ check O(1).
const parseRoles = (roleString: string | undefined | null): Set<string> => {
  if (!roleString) return new Set();
  return new Set(roleString.split(',').map((r) => r.trim()).filter(Boolean));
};

// User cÃ³ chá»©a flag role nÃ y khÃ´ng (vd "Admin, Lecturer" cÃ³ "Lecturer" â†’ true)
export const hasRole = (roleString: string | undefined | null, role: Role): boolean => {
  return parseRoles(roleString).has(role);
};

// User cÃ³ chá»©a Báº¤T Ká»² role nÃ o trong list (OR)
export const hasAnyRole = (roleString: string | undefined | null, roles: Role[]): boolean => {
  const set = parseRoles(roleString);
  return roles.some((r) => set.has(r));
};

// User cÃ³ chá»©a Táº¤T Cáº¢ role trong list (AND)
export const hasAllRoles = (roleString: string | undefined | null, roles: Role[]): boolean => {
  const set = parseRoles(roleString);
  return roles.every((r) => set.has(r));
};
```


