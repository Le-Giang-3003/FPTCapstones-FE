export type Role = 'Admin' | 'Lecturer' | 'StudentLeader' | 'GroupMember' | 'Student';

export interface User {
  userId?: number;
  email: string;
  fullName: string;
  role: Role;
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
  role: Role;
  groupId: number | null;
}

// Matches BE DashboardGroupDto
export interface DashboardItem {
  groupId: number;
  groupCode: string;
  projectName: string;
  leaderFullName: string;
  leaderEmail: string;
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

export type ImportJobStatus = 'Pending' | 'Processing' | 'Success' | 'Failed';

export interface ImportStatusDto {
  id: number;
  status: ImportJobStatus | number; // BE serialize enum: nếu giữ số thì FE map sau
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
