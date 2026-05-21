export type Role = 'Admin' | 'Lecturer' | 'StudentLeader' | 'GroupMember' | 'Student';

export interface User {
  userId?: number;
  email: string;
  fullName: string;
  role: Role;
  groupId?: number | null;
  lecturerId?: number | null;     // chỉ Lecturer mới có — dùng khi đăng ký slot
  isLeader?: boolean;             // true nếu là leader của group hiện tại
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
  lecturerId: number | null;
  isLeader: boolean;
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
export interface ReviewSlotGroupPreferenceDto {
  groupId: number;
  groupCode: string;
}

export interface ReviewSlotLecturerPreferenceDto {
  lecturerId: number;
  lecturerName: string;
}

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
  groupPreferences: ReviewSlotGroupPreferenceDto[];
  lecturerPreferences: ReviewSlotLecturerPreferenceDto[];
  assignments: ReviewAssignmentDto[];
  note: string | null;
}

// Số nguyện vọng tối đa cho nhóm (đồng bộ với BE ReviewSlotGroup.MaxPreferences)
export const MAX_GROUP_PREFERENCES = 5;

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
