# Contexts, Services and Utils


## Entry Points


### File: src\main.tsx
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


### File: src\App.tsx
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


### File: src\types\index.ts
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


## Contexts


### File: src\contexts\AuthContext.tsx
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


### File: src\contexts\ThemeContext.tsx
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


## Services


### File: src\services\api.ts
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


## Utils


### File: src\utils\reviewSlotTime.ts
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


### File: src\utils\role.ts
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


