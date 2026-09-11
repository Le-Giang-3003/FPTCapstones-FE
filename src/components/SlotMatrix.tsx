import React, { useState, useMemo, Fragment } from 'react';
import { ChevronLeft, ChevronRight, Users, GraduationCap, Check } from 'lucide-react';
import type { ReviewSlotDto, ReviewScheduleAssignmentDto } from '../types';
import { getReviewSlotTimeRange } from '../utils/reviewSlotTime';
import { Tooltip } from './Tooltip';

export type SlotState = 'empty' | 'selected' | 'registered' | 'pendingUnregister' | 'assigned';

export interface SlotGroupAssignment {
  slotId: number;
  slotDate: string;
  slotIndex: number;
  lecturer1Name: string;
  lecturer2Name: string | null;
  groups: ReviewScheduleAssignmentDto[];
}

export interface SlotMatrixProps {
  slots: ReviewSlotDto[];
  windowStart?: string | null;
  windowEnd?: string | null;

  // Selection mode (ReviewSlots)
  canRegister?: boolean;
  selectedSlotIds?: Set<number>;
  pendingRemoveSlotIds?: Set<number>;
  onToggleSlot?: (slot: ReviewSlotDto) => void;
  onBulkToggleCol?: (dateStr: string) => void;
  onBulkToggleRow?: (slotIndex: number) => void;
  onBulkToggleAll?: () => void;

  // Drag selection
  isCoordInDragRect?: (date: string, idx: number) => boolean;
  onCellMouseDown?: (date: string, idx: number, e: React.MouseEvent) => void;
  onCellMouseEnter?: (date: string, idx: number) => void;

  // Scheduling view mode (AdminScheduling)
  slotAssignmentsMap?: Map<string, SlotGroupAssignment>; // key: `${date}_${slotIndex}`
  viewType?: 'registration' | 'scheduling';

  // Callbacks
  onSelectSlot?: (slot: ReviewSlotDto) => void;
}

const WEEKDAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const parseLocalDate = (iso: string): Date => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

const toISODateString = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatDayMonth = (date: Date): string =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatDayMonthYear = (date: Date): string =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

const getWeekdayLabel = (date: Date): string => {
  const day = date.getDay(); // 0 = CN, 1 = T2
  return day === 0 ? 'Chủ nhật' : WEEKDAY_LABELS[day - 1];
};

const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = CN, 1 = T2
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const SlotMatrix: React.FC<SlotMatrixProps> = ({
  slots,
  windowStart,
  windowEnd,
  canRegister = false,
  selectedSlotIds,
  pendingRemoveSlotIds,
  onToggleSlot,
  onBulkToggleCol,
  onBulkToggleRow,
  onBulkToggleAll,
  isCoordInDragRect,
  onCellMouseDown,
  onCellMouseEnter,
  slotAssignmentsMap,
  viewType = 'registration',
}) => {
  // Tính danh sách ngày theo tuần hoàn chỉnh (Thứ 2 -> Thứ 7, hoặc kèm CN nếu có slot)
  const { allDates, minDateObj, maxDateObj, daysPerWeek } = useMemo(() => {
    const rawDates: string[] = [];
    if (windowStart) rawDates.push(windowStart.slice(0, 10));
    if (windowEnd) rawDates.push(windowEnd.slice(0, 10));
    for (const s of slots) rawDates.push(s.slotDate.slice(0, 10));
    if (slotAssignmentsMap) {
      for (const a of slotAssignmentsMap.values()) rawDates.push(a.slotDate.slice(0, 10));
    }

    if (rawDates.length === 0) {
      const now = new Date();
      const mon = startOfWeek(now);
      const week: string[] = [];
      for (let i = 0; i < 6; i++) {
        week.push(toISODateString(addDays(mon, i)));
      }
      return {
        allDates: week,
        minDateObj: mon,
        maxDateObj: addDays(mon, 5),
        daysPerWeek: 6,
      };
    }

    rawDates.sort();
    const minD = parseLocalDate(rawDates[0]);
    const maxD = parseLocalDate(rawDates[rawDates.length - 1]);

    // Bắt đầu từ Thứ 2 của tuần chứa minDate
    const startMon = startOfWeek(minD);

    // Kiểm tra xem có ngày nào rơi vào Chủ nhật không
    const hasSunday = rawDates.some((d) => parseLocalDate(d).getDay() === 0);
    const dpw = hasSunday ? 7 : 6;

    // Kết thúc ở Thứ 7 (hoặc Chủ nhật) của tuần chứa maxD
    const endWeekMon = startOfWeek(maxD);
    const endDay = addDays(endWeekMon, dpw - 1);

    const dates: string[] = [];
    const curr = new Date(startMon);
    while (curr <= endDay) {
      const dayOfWeek = curr.getDay();
      if (hasSunday || dayOfWeek !== 0) {
        dates.push(toISODateString(curr));
      }
      curr.setDate(curr.getDate() + 1);
    }

    return {
      allDates: dates,
      minDateObj: minD,
      maxDateObj: maxD,
      daysPerWeek: dpw,
    };
  }, [windowStart, windowEnd, slots, slotAssignmentsMap]);

  // Phân trang theo tuần (mỗi trang hiển thị đúng 1 tuần: 6 hoặc 7 ngày)
  const PAGE_DAYS = daysPerWeek;
  const [pageIndex, setPageIndex] = useState(0);
  const totalPages = Math.max(1, Math.ceil(allDates.length / PAGE_DAYS));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const visibleDates = useMemo(() => {
    const startIdx = safePageIndex * PAGE_DAYS;
    return allDates.slice(startIdx, startIdx + PAGE_DAYS);
  }, [allDates, safePageIndex, PAGE_DAYS]);

  // Map slot nhanh theo key `${date}_${slotIndex}`
  const slotMap = useMemo(() => {
    const map = new Map<string, ReviewSlotDto>();
    for (const s of slots) {
      const d = s.slotDate.slice(0, 10);
      map.set(`${d}_${s.slotIndex}`, s);
    }
    return map;
  }, [slots]);

  // Xác định danh sách slot index (mặc định 1 -> 5, hoặc max slotIndex trong data)
  const allSlotIndexes = useMemo(() => {
    let maxIdx = 5;
    for (const s of slots) {
      if (s.slotIndex > maxIdx) maxIdx = s.slotIndex;
    }
    if (slotAssignmentsMap) {
      for (const a of slotAssignmentsMap.values()) {
        if (a.slotIndex > maxIdx) maxIdx = a.slotIndex;
      }
    }
    return Array.from({ length: maxIdx }, (_, i) => i + 1);
  }, [slots, slotAssignmentsMap]);

  const getSlotState = (slot: ReviewSlotDto): SlotState => {
    if (slot.isCurrentUserAssigned) return 'assigned';
    if (slot.isCurrentUserRegistered) {
      if (pendingRemoveSlotIds?.has(slot.id)) return 'pendingUnregister';
      return 'registered';
    }
    if (selectedSlotIds?.has(slot.id)) return 'selected';
    return 'empty';
  };

  const renderCellContent = (dateStr: string, slotIdx: number) => {
    const slotKey = `${dateStr}_${slotIdx}`;
    const slot = slotMap.get(slotKey);
    const schedulingAssignment = slotAssignmentsMap?.get(slotKey);
    const inDrag = isCoordInDragRect ? isCoordInDragRect(dateStr, slotIdx) : false;

    if (!slot && !schedulingAssignment) {
      return (
        <div
          style={{
            minHeight: 90,
            borderRadius: 8,
            border: '1px dashed var(--border-glass)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            fontSize: '0.8rem',
            userSelect: 'none',
            opacity: 0.35,
          }}
        >
          —
        </div>
      );
    }

    // View chế độ xếp lịch hội đồng (AdminScheduling)
    if (viewType === 'scheduling' && schedulingAssignment) {
      const s = schedulingAssignment;
      const isFull = s.groups.length >= 3;
      return (
        <div
          style={{
            minHeight: 90,
            borderRadius: 8,
            border: '1px solid var(--border-glass)',
            background: 'var(--surface-glass)',
            padding: '0.5rem 0.6rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.4rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Slot {slotIdx}
            </span>
            <span
              className="badge"
              style={{
                padding: '0.1rem 0.4rem',
                fontSize: '0.68rem',
                background: isFull ? 'rgba(245, 158, 11, 0.14)' : 'rgba(34, 197, 94, 0.12)',
                color: isFull ? 'var(--warning)' : 'var(--success)',
                border: `1px solid ${isFull ? 'rgba(245, 158, 11, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              }}
            >
              {s.groups.length}/3 nhóm
            </span>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
            <div><strong style={{ color: 'var(--text-primary)' }}>{s.lecturer1Name}</strong></div>
            <div>{s.lecturer2Name ? <span style={{ color: 'var(--text-primary)' }}>{s.lecturer2Name}</span> : <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>Chưa có GV2</span>}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {s.groups.map((g) => (
              <span
                key={g.assignmentId}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '0.1rem 0.35rem',
                  borderRadius: 4,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                }}
              >
                {g.groupCode}
              </span>
            ))}
          </div>
        </div>
      );
    }

    // View chế độ đăng ký / chọn nguyện vọng (ReviewSlots)
    if (!slot) return null;
    const state = getSlotState(slot);
    const isFull = slot.assignmentCount >= 3;

    let bg = 'var(--surface-glass)';
    let border = '1px solid var(--border-glass)';
    let textColor = 'var(--text-primary)';
    let statusBadge: { label: string; bg: string; color: string; border: string } | null = null;

    if (state === 'assigned') {
      bg = 'rgba(245, 158, 11, 0.12)';
      border = '1.5px solid #f59e0b';
      textColor = '#d97706';
      statusBadge = { label: 'Đã xếp', bg: 'rgba(245, 158, 11, 0.2)', color: '#b45309', border: '#f59e0b' };
    } else if (state === 'registered') {
      bg = 'rgba(34, 197, 94, 0.12)';
      border = '1.5px solid #22c55e';
      textColor = '#16a34a';
      statusBadge = { label: 'Đã lưu', bg: 'rgba(34, 197, 94, 0.2)', color: '#15803d', border: '#22c55e' };
    } else if (state === 'pendingUnregister') {
      bg = 'rgba(239, 68, 68, 0.12)';
      border = '1.5px solid #ef4444';
      textColor = '#dc2626';
      statusBadge = { label: 'Sẽ hủy', bg: 'rgba(239, 68, 68, 0.2)', color: '#b91c1c', border: '#ef4444' };
    } else if (state === 'selected') {
      bg = 'rgba(14, 165, 233, 0.14)';
      border = '1.5px solid #0ea5e9';
      textColor = '#0284c7';
      statusBadge = { label: 'Mới chọn', bg: 'rgba(14, 165, 233, 0.22)', color: '#0369a1', border: '#0ea5e9' };
    } else if (isFull) {
      statusBadge = { label: 'Đầy ca', bg: 'rgba(245, 158, 11, 0.15)', color: '#b45309', border: 'rgba(245, 158, 11, 0.3)' };
    } else if (slot.assignmentCount > 0) {
      statusBadge = { label: `${slot.assignmentCount}/3`, bg: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: 'var(--border-glass)' };
    }

    const tooltipMsg =
      state === 'assigned' ? 'Slot đã được phê duyệt cho bạn (không thể hủy)' :
      state === 'registered' ? 'Đã lưu nguyện vọng — bấm để đánh dấu hủy' :
      state === 'pendingUnregister' ? 'Đánh dấu hủy — bấm để giữ lại' :
      state === 'selected' ? 'Đang chọn — bấm Lưu để xác nhận' :
      canRegister ? 'Bấm để chọn nguyện vọng slot này' : '';

    return (
      <Tooltip
        content={tooltipMsg}
        variant="glass-card"
        placement="top"
        className={!tooltipMsg ? 'no-tooltip-hover' : ''}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <button
          type="button"
          onClick={() => canRegister && onToggleSlot?.(slot)}
          onMouseDown={(e) => onCellMouseDown?.(dateStr, slotIdx, e)}
          onMouseEnter={() => onCellMouseEnter?.(dateStr, slotIdx)}
          style={{
            width: '100%',
            minHeight: 90,
            borderRadius: 8,
            border: inDrag ? '1.5px solid #0ea5e9' : border,
            background: inDrag ? 'rgba(14, 165, 233, 0.18)' : bg,
            color: textColor,
            padding: '0.45rem 0.55rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            textAlign: 'left',
            cursor: canRegister && state !== 'assigned' ? 'pointer' : 'default',
            transition: 'all 0.15s ease',
            boxShadow: inDrag ? '0 0 0 2px rgba(14, 165, 233, 0.2)' : 'var(--shadow-sm)',
            position: 'relative',
          }}
        >
          {/* Top header: Phòng và Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 4 }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              P.{slot.roomCount || 1}
            </span>
            {statusBadge && (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.4rem',
                  borderRadius: 999,
                  background: statusBadge.bg,
                  color: statusBadge.color,
                  border: `1px solid ${statusBadge.border}`,
                  whiteSpace: 'nowrap',
                  textDecoration: state === 'pendingUnregister' ? 'line-through' : 'none',
                }}
              >
                {statusBadge.label}
              </span>
            )}
          </div>

          {/* Stats: Nhóm & Giảng viên */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={12} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
              <span><strong style={{ color: 'var(--text-primary)' }}>{slot.groupPreferenceCount}</strong> nhóm đăng ký</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <GraduationCap size={12} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
              <span><strong style={{ color: 'var(--text-primary)' }}>{slot.lecturerPreferenceCount}</strong> GV báo rảnh</span>
            </div>
          </div>

          {/* Note nếu có */}
          {slot.note && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {slot.note}
            </div>
          )}

          {/* Bottom icon indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: 14 }}>
            {state === 'registered' && <Check size={14} color="#16a34a" />}
            {state === 'assigned' && <Check size={14} color="#d97706" />}
            {state === 'pendingUnregister' && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626' }}>✕</span>}
            {state === 'selected' && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284c7' }}>✦</span>}
          </div>
        </button>
      </Tooltip>
    );
  };

  const currentWeekStart = visibleDates.length > 0 ? parseLocalDate(visibleDates[0]) : null;
  const currentWeekEnd = visibleDates.length > 0 ? parseLocalDate(visibleDates[visibleDates.length - 1]) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Thanh điều hướng tuần nếu đợt kéo dài nhiều tuần */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-glass)',
          paddingBottom: '0.75rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span>
          Đợt review: <strong>{formatDayMonthYear(minDateObj)}</strong> – <strong>{formatDayMonthYear(maxDateObj)}</strong>
          {currentWeekStart && currentWeekEnd && (
            <> · Tuần {safePageIndex + 1}/{totalPages} ({formatDayMonth(currentWeekStart)} – {formatDayMonth(currentWeekEnd)})</>
          )}
        </span>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              disabled={safePageIndex <= 0}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              aria-label="Tuần trước"
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
            >
              <ChevronLeft size={14} /> Trước
            </button>
            <button
              type="button"
              disabled={safePageIndex >= totalPages - 1}
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              aria-label="Tuần sau"
              className="btn btn-secondary"
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
            >
              Sau <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Lưới Ma trận Slot (Slot Matrix) */}
      <div
        style={{
          overflowX: 'auto',
          borderRadius: 14,
          border: '1px solid var(--border-glass)',
          background: 'var(--surface-glass)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `130px repeat(${visibleDates.length}, minmax(130px, 1fr))`,
            gap: 6,
            padding: '0.65rem',
            minWidth: 130 + visibleDates.length * 135,
          }}
        >
          {/* Ô góc trên bên trái: nút chọn/hủy toàn bộ */}
          <Tooltip
            content={canRegister ? 'Bấm để bật/tắt đánh dấu hủy toàn bộ slot đã đăng ký' : ''}
            variant="glass-card"
            placement="top"
            className={!canRegister ? 'no-tooltip-hover' : ''}
            style={{ display: 'block', width: '100%', height: '100%' }}
          >
            <div
              onClick={canRegister ? onBulkToggleAll : undefined}
              style={{
                padding: '0.45rem',
                fontWeight: 700,
                color: 'var(--accent-primary)',
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                borderRadius: 8,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canRegister ? 'pointer' : 'default',
                userSelect: 'none',
                minHeight: 48,
                border: '1px solid var(--border-glass)',
              }}
            >
              Ca \ Ngày
            </div>
          </Tooltip>

          {/* Header các cột ngày */}
          {visibleDates.map((dateStr) => {
            const dateObj = parseLocalDate(dateStr);
            const weekdayName = getWeekdayLabel(dateObj);
            const dayMonth = formatDayMonth(dateObj);

            return (
              <Tooltip
                key={`hdr_${dateStr}`}
                content={canRegister ? `Bấm để chọn / bỏ chọn cả ngày ${dayMonth}` : ''}
                variant="glass-card"
                placement="top"
                className={!canRegister ? 'no-tooltip-hover' : ''}
                style={{ display: 'block', width: '100%', height: '100%' }}
              >
                <div
                  onClick={canRegister ? () => onBulkToggleCol?.(dateStr) : undefined}
                  style={{
                    padding: '0.45rem',
                    textAlign: 'center',
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                    border: '1px solid var(--border-glass)',
                    cursor: canRegister ? 'pointer' : 'default',
                    userSelect: 'none',
                    minHeight: 48,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {weekdayName}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700, marginTop: 1 }}>
                    {dayMonth}
                  </span>
                </div>
              </Tooltip>
            );
          })}

          {/* Các hàng slot (1 -> 5) */}
          {allSlotIndexes.map((slotIdx) => {
            const timeRange = getReviewSlotTimeRange(slotIdx);

            return (
              <Fragment key={`row_${slotIdx}`}>
                {/* Cột tiêu đề Ca chấm bên trái */}
                <Tooltip
                  content={canRegister ? `Bấm để chọn / bỏ chọn toàn bộ Slot ${slotIdx}` : ''}
                  variant="glass-card"
                  placement="top"
                  className={!canRegister ? 'no-tooltip-hover' : ''}
                  style={{ display: 'block', width: '100%', height: '100%' }}
                >
                  <div
                    onClick={canRegister ? () => onBulkToggleRow?.(slotIdx) : undefined}
                    style={{
                      padding: '0.5rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 8,
                      border: '1px solid var(--border-glass)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: canRegister ? 'pointer' : 'default',
                      userSelect: 'none',
                      minHeight: 90,
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Slot {slotIdx}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontFamily: 'monospace', marginTop: 3 }}>
                      {timeRange}
                    </span>
                  </div>
                </Tooltip>

                {/* Các ô ca chấm theo từng ngày */}
                {visibleDates.map((dateStr) => (
                  <Fragment key={`cell_${dateStr}_${slotIdx}`}>
                    {renderCellContent(dateStr, slotIdx)}
                  </Fragment>
                ))}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Chú giải màu sắc chuẩn (§6.2.1) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.65rem 1rem',
          borderRadius: 10,
          background: 'var(--surface-glass)',
          border: '1px solid var(--border-glass)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Chú giải:</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid var(--border-glass)', background: 'var(--surface-glass)' }} />
          <span>Còn chỗ trống</span>
        </div>

        {viewType === 'registration' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, border: '1.5px solid #0ea5e9', background: 'rgba(14, 165, 233, 0.2)' }} />
              <span>Mới chọn (chưa lưu)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, border: '1.5px solid #22c55e', background: 'rgba(34, 197, 94, 0.2)' }} />
              <span>Đã lưu nguyện vọng</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, border: '1.5px solid #ef4444', background: 'rgba(239, 68, 68, 0.2)' }} />
              <span>Đánh dấu hủy</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, border: '1.5px solid #f59e0b', background: 'rgba(245, 158, 11, 0.2)' }} />
              <span>Đã xếp hội đồng</span>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.12)' }} />
              <span>Đã có nhóm phân công</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.14)' }} />
              <span>Đầy ca (3 nhóm)</span>
            </div>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, border: '1px dashed var(--border-glass)', background: 'var(--bg-secondary)' }} />
          <span>Chưa có ca chấm</span>
        </div>
      </div>
    </div>
  );
};
