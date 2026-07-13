export type Role = 'Admin' | 'Lecturer' | 'Reviewer' | 'StudentLeader' | 'GroupMember';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  groupId?: number;
}

export type SemesterStatus = 'Ongoing' | 'Completed' | 'Cancelled' | 'Pending';

export interface Semester {
  id: number;
  code: string;
  season: 'Spring' | 'Summer' | 'Fall';
  year: number;
  startDate: string;
  endDate: string;
  baseDurationWeeks: number;
  status: SemesterStatus;
}

export interface HolidayTemplate {
  id: number;
  label: string;
  isAnnual: boolean;
  isActive: boolean;
  isCompensated: boolean;
  defaultStartMonth: number;
  defaultStartDay: number;
  defaultDurationDays: number;
}

export interface SemesterHoliday {
  id: number;
  semesterId: number;
  templateId?: number;
  label: string;
  startDate: string;
  durationDays: number;
  isCompensated: boolean;
}

export type ReviewType = 'Review' | 'Defence';
export type ReviewStatus = 'Draft' | 'Registering' | 'Registered' | 'Ongoing' | 'Finished' | 'Cancelled';

export interface Review {
  id: number;
  semesterId: number;
  type: ReviewType;
  orderIndex: number;
  label: string;
  windowStart: string;
  windowEnd: string;
  status: ReviewStatus;
  note?: string;
}

export interface ReviewSlot {
  id: number;
  reviewId: number;
  slotDate: string;
  slotIndex: number;
  roomCount: number;
  note?: string;
}

export interface ProjectGroup {
  id: number;
  groupCode: string;
  projectCode: string;
  projectName: string;
  projectNameEn?: string;
  description?: string;
  lecturerId: number;
  lecturerName?: string;
  gvhd2Id?: number;
  gvhd2Name?: string;
  semesterId?: number;
}
