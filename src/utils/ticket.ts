import type { TicketStatus, TicketUrgency } from '../types';

export const URGENCY_ORDER: TicketUrgency[] = ['Low', 'Medium', 'High'];
export const STATUS_ORDER: TicketStatus[] = ['Open', 'InProgress', 'Done'];

export const URGENCY_LABEL: Record<TicketUrgency, string> = {
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Khẩn',
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
  Open: 'Chờ xử lý',
  InProgress: 'Đang xử lý',
  Done: 'Đã xong',
};

export const URGENCY_BADGE: Record<TicketUrgency, string> = {
  Low: 'badge badge-neutral',
  Medium: 'badge badge-warning',
  High: 'badge badge-danger',
};

export const STATUS_BADGE: Record<TicketStatus, string> = {
  Open: 'badge badge-info',
  InProgress: 'badge badge-warning',
  Done: 'badge badge-success',
};

// BE trả DateTime.UtcNow nhưng serialize không kèm hậu tố Z, nên new Date() sẽ hiểu
// nhầm là giờ máy và lệch đúng bằng múi giờ. Gắn Z lại trước khi parse.
export const formatDateTime = (iso: string | null): string => {
  if (!iso) return '—';
  const hasZone = /[Zz]$|[+-]\d{2}:\d{2}$/.test(iso);
  return new Date(hasZone ? iso : `${iso}Z`).toLocaleString('vi-VN');
};
