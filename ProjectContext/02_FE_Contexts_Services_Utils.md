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
import AdminImportColumns from './pages/AdminImportColumns';
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
            path="/admin/import-columns"
            element={<PrivateRoute roles={['Admin']}><AdminImportColumns /></PrivateRoute>}
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
  role: string;   // [Flags] enum.ToString() — single role "Admin" hoặc multi "Admin, Lecturer"
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

// Khớp enum ImportJobStatus của BE (Pending/Processing/Completed/Failed) — không có giá trị "Success"
export type ImportJobStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

export interface ImportStatusDto {
  id: number;
  status: ImportJobStatus | number; // BE serialize enum: nếu giữ số thì FE map sau
  errorReport: string | null;
  groupsCreated: number | null;
  usersCreated: number | null;
  completedAt: string | null;
}

// ---- Cấu hình TÊN CỘT cho import Excel (BE: /api/admin/import-columns) ----
// Parser dò header theo tên thay vì vị trí cột, nên đổi ở đây ăn ngay vào lần import kế tiếp.
export type ImportColumnScope = 'ProjectGroup' | 'Lecturer';

export interface ImportColumnDto {
  id: number;              // 0 = scope chưa seed vào DB, BE đang trả danh mục gốc → lưu phải POST chứ không PUT
  scope: ImportColumnScope;
  fieldKey: string;        // Khóa logic parser đọc — không tự chế được, phải nằm trong catalog của BE
  displayName: string;
  aliases: string[];       // Các tên header trong file Excel được chấp nhận cho field này
  isRequired: boolean;     // Thiếu cột này trong file → BE reject cả file
  isCore: boolean;         // Cột lõi: không xóa được, không bỏ Bắt buộc được
  sortOrder: number;
  description: string;
}

export interface CreateImportColumnRequest {
  scope: ImportColumnScope;
  fieldKey: string;
  displayName?: string | null;
  aliases: string[];
  isRequired?: boolean | null;
}

// Field null = không đổi
export interface UpdateImportColumnRequest {
  displayName?: string | null;
  aliases?: string[] | null;
  isRequired?: boolean | null;
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

// Reviewer — lecturer hiện đang có cờ Reviewer (global, BE: ReviewerDto)
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

// BE serialize enum thành string nhờ JsonStringEnumConverter
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

// Detail trả thêm timestamps (BE: SemesterDetailDto)
export interface SemesterDetailDto extends SemesterListItemDto {
  createdAt: string;
  updatedAt: string | null;
}

// Holiday gắn vào 1 semester (BE: SemesterHolidayDto)
export interface SemesterHolidayDto {
  id: number;
  semesterId: number;
  templateId: number | null;
  label: string;
  startDate: string;
  durationDays: number;
  isCompensated: boolean;
}

// Kết quả nối nhóm với học kỳ qua GroupCode (vd GSU26SE02 → SU26)
export interface LinkGroupsResultDto {
  totalUnlinked: number;
  linked: number;
  skipped: number;
  skippedGroups: string[];
}

// ---- Reset dữ liệu theo học kỳ (BE: AdminController /api/admin/semesters/{id}/reset-*) ----
// Thao tác KHÔNG hoàn tác được — FE luôn gọi reset-preview trước để hiện màn hình xác nhận.

// Account sinh viên bị FK Restrict giữ lại: leader còn version/document tham chiếu,
// hoặc account kiêm luôn role Admin/Lecturer.
export interface KeptAccountDto {
  email: string;
  reason: string;
}

// GET /api/admin/semesters/{id}/reset-preview — đếm trước số bản ghi sẽ bị xoá (read-only)
export interface SemesterResetPreviewDto {
  semesterId: number;
  semesterCode: string;
  semesterStatus: SemesterStatus;
  groups: number;
  memberships: number;
  leaders: number;
  distinctStudents: number;
  orphanStudents: number;      // SV không còn nhóm nào sau reset -> account sẽ bị xoá
  versions: number;
  documents: number;
  slotRegistrations: number;   // nguyện vọng slot (ReviewSlotGroup) của các nhóm trong kỳ
  assignments: number;         // ReviewAssignment của các nhóm trong kỳ
}

// POST /api/admin/semesters/{id}/reset-students
export interface ResetSemesterStudentsResultDto {
  semesterId: number;
  semesterCode: string;
  groupsAffected: number;
  membershipsRemoved: number;
  leadersRemoved: number;
  studentsDeleted: number;
  usersDeleted: number;
  keptAccounts: KeptAccountDto[];
}

// POST /api/admin/semesters/{id}/reset-projects?deleteOrphanStudentAccounts=false
export interface ResetSemesterProjectsResultDto {
  semesterId: number;
  semesterCode: string;
  groupsDeleted: number;
  membershipsRemoved: number;
  versionsDeleted: number;
  documentsDeleted: number;
  slotRegistrationsDeleted: number;
  assignmentsDeleted: number;
  studentsDeleted: number;
  usersDeleted: number;
  keptAccounts: KeptAccountDto[];
}

// Review window / Defence window — 1 review = 1 cửa sổ thời gian (vd 2 tuần) để book slot.
// BE đã rename SemesterMilestone -> Review. Endpoint /api/admin/reviews.
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

// Aliases để giữ compat tạm thời (giảm rủi ro rename ở component)
export type MilestoneType = ReviewType;
export type SemesterMilestoneDto = ReviewDto;

// ---- Slot review (BE: /api/admin/reviews/{id}/slots) ----
// Đăng ký giờ là NGUYỆN VỌNG: nhóm tối đa 5 slot/đợt, GV không giới hạn.
// Slot thực tế của 1 lần review = ReviewAssignment (sinh sau thuật toán xếp lịch).
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
  isCurrentUserRegistered: boolean;   // BE compute từ JWT — slot có chứa group/lecturer của user hiện tại
  isCurrentUserAssigned: boolean;     // GV đã được phê duyệt review slot này (ReviewAssignment active)
  assignments: ReviewAssignmentDto[];
  note: string | null;
}

// Số nguyện vọng tối đa cho nhóm (đồng bộ với BE ReviewSlotGroup.MaxPreferences)
export const MAX_GROUP_PREFERENCES = 5;

// ---- Scheduling (xếp lịch review) — BE: /api/admin/reviews/{id}/scheduling ----
// BE serialize enum thành string nhờ JsonStringEnumConverter.
export type SchedulingJobStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

// Polling DTO — GET /api/admin/reviews/scheduling/{jobId}
export interface SchedulingStatusDto {
  id: number;
  reviewId: number;
  status: SchedulingJobStatus;
  force: boolean;
  resultJson: string | null;   // JSON serialize từ runner (xem SchedulingResultSummary)
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

// Nội dung parse từ resultJson. Runner serialize bằng JsonSerializer mặc định:
// key top-level giữ nguyên (assigned, groupsScheduled, ...) nhưng record con là PascalCase.
export interface SchedulingResultSummary {
  assigned: number;
  groupsScheduled: number;
  unassignedGroups: { GroupId: number; Reason: string }[];
  underQuotaReviewers: { LecturerId: number; SlotCount: number }[];
  force: boolean;
}

// Kết quả xếp lịch — GET /api/admin/reviews/{id}/assignments
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

// Kết quả cascade khi thêm/sửa/xóa lễ có bù — FE dùng để show feedback các kỳ/milestone đã shift
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
  id?: number;                 // có khi Create, vắng khi Update/Delete
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
  // BE serialize Dictionary<int,int> → key là string
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
  partnerLecturerId: number | null;     // chỉ set cho lecturer view
  partnerLecturerName: string | null;
  isExpired: boolean;
}

// Template lễ độc lập — admin sửa template chỉ ảnh hưởng năm sinh sau.
// VD: Tết Nguyên Đán dùng ngày tượng trưng 10/2 — khi gán vào kỳ cụ thể, admin chỉnh lại cho đúng năm.
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


