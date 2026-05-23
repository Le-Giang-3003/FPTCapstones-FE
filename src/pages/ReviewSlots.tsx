import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MAX_GROUP_PREFERENCES, type ReviewDto, type ReviewSlotDto } from '../types';
import { CalendarRange, Loader2, AlertCircle, Check } from 'lucide-react';
import { hasRole } from '../utils/role';
import { getReviewSlotTimeRange } from '../utils/reviewSlotTime';

// Trang đăng ký nguyện vọng slot review.
//   - StudentLeader: chọn tối đa MAX_GROUP_PREFERENCES slot/đợt cho nhóm mình
//   - Lecturer: chọn không giới hạn slot/đợt cho chính mình
//   - GroupMember / Admin: chỉ xem

// empty: chưa chọn | selected: mới chọn (xanh nước, chưa lưu) | registered: đã lưu DB (xanh lá)
// pendingUnregister: đã lưu DB nhưng đang đánh dấu để hủy (đỏ, chưa gửi BE)
// assigned: GV đã được admin phê duyệt review slot này (vàng, ưu tiên hơn registered)
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
  // Quyền cơ bản theo role — Reviewer (GV được admin chỉ định) hoặc StudentLeader. Lecturer thường không đăng ký được.
  const roleAllowsRegister = hasRole(role, 'StudentLeader') || hasRole(role, 'Reviewer');

  // Khi vào trang, refresh thông tin user để đảm bảo có lecturerId/groupId mới nhất.
  useEffect(() => { refreshMe().catch(() => {}); }, []);

  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [slots, setSlots] = useState<ReviewSlotDto[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());            // slotId mới chọn (chưa lưu)
  const [pendingRemove, setPendingRemove] = useState<Set<number>>(new Set());  // slotId đánh dấu hủy (chưa lưu)
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        setError(e?.response?.data?.message || 'Không tải được danh sách đợt review');
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
      setError(e?.response?.data?.message || 'Không tải được danh sách slot');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (reviewId != null) fetchSlots(reviewId);
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

  // BE đã tính sẵn flag dựa trên JWT — FE chỉ đọc
  const isRegistered = (s: ReviewSlotDto): boolean => s.isCurrentUserRegistered;

  const slotState = (s: ReviewSlotDto): SlotState => {
    // Slot đã được admin phê duyệt → ưu tiên hiển thị vàng, không cho hủy
    if (s.isCurrentUserAssigned) return 'assigned';
    const registered = isRegistered(s);
    if (registered && pendingRemove.has(s.id)) return 'pendingUnregister';
    if (registered) return 'registered';
    if (selected.has(s.id)) return 'selected';
    return 'empty';
  };

  // Review hiện tại — dùng để xác định đợt còn mở đăng ký không
  const currentReview = useMemo(() => reviews.find((r) => r.id === reviewId) ?? null, [reviews, reviewId]);
  const isRegistrationOpen = currentReview?.status === 'Registering';
  // Quyền cuối cùng = role cho phép + đợt review đang mở đăng ký
  const canRegister = roleAllowsRegister && isRegistrationOpen;
  const reviewStatusBadge = getReviewStatusBadge(currentReview?.status);

  // Tổng sau khi lưu = đã đăng ký - đánh dấu hủy + mới chọn
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

  // Single click — chuyển state theo cycle:
  //   empty → selected (xanh nước)         selected → empty (bỏ chọn)
  //   registered (xanh lá) → pendingUnregister (đỏ, đánh dấu hủy)
  //   pendingUnregister → registered (bỏ đánh dấu)
  //   assigned (vàng) → không cho đổi (đã được admin chốt)
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

  // Bulk toggle 1 nhóm slot (1 hàng / 1 cột / toàn bộ):
  //   Lần 1 (chưa có cái nào blue trong scope): chọn hết empty → blue. Skip registered/pendingUnregister/assigned.
  //   Lần 2 (đã có blue trong scope): deselect hết blue → empty.
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

  // Helper: lấy tất cả slot trong 1 hàng / 1 cột / toàn bộ
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

  // Lưu — 1 lần bấm: gửi tất cả register + unregister đang pending
  const submitChanges = async () => {
    if (!canRegister || !hasChanges || overLimit || submitting) return;
    setSubmitting(true);
    setError(null);
    const failed: string[] = [];

    // 1. Hủy các slot đánh dấu đỏ — BE tự suy group/lecturer từ JWT qua route .../me
    for (const slotId of pendingRemove) {
      const slot = slots.find((x) => x.id === slotId);
      if (!slot) continue;
      const subpath = hasRole(role, 'StudentLeader') ? 'groups/me' : 'lecturers/me';
      // StudentLeader → groups, Reviewer → lecturers
      try {
        await api.delete(`/api/admin/reviews/${slot.reviewId}/slots/${slot.id}/${subpath}`);
      } catch (e: any) {
        failed.push(`Hủy slot ${slot.slotIndex} ngày ${slot.slotDate.substring(0, 10)}: ${e?.response?.data?.message || 'lỗi'}`);
      }
    }

    // 2. Đăng ký các slot xanh nước — body rỗng, BE tự suy
    for (const slotId of selected) {
      const slot = slots.find((x) => x.id === slotId);
      if (!slot) continue;
      const subpath = hasRole(role, 'StudentLeader') ? 'groups' : 'lecturers';
      try {
        await api.post(`/api/admin/reviews/${slot.reviewId}/slots/${slot.id}/${subpath}`, {});
      } catch (e: any) {
        failed.push(`Đăng ký slot ${slot.slotIndex} ngày ${slot.slotDate.substring(0, 10)}: ${e?.response?.data?.message || 'lỗi'}`);
      }
    }

    if (reviewId != null) await fetchSlots(reviewId);

    setSubmitting(false);
    if (failed.length > 0) setError('Một số thay đổi không lưu được:\n' + failed.join('\n'));
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
          —
        </div>
      );
    }
    const state = slotState(slot);
    const inDragRect = isCoordInDragRect(date, idx);
    return (
      <div
        key={slot.id}
        style={{
          ...cellStyle(state),
          ...(inDragRect && (state === 'empty' || state === 'selected')
            ? { boxShadow: 'inset 0 0 0 1.5px #0ea5e9', background: 'rgba(14, 165, 233, 0.14)' }
            : {}),
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
        title={
          state === 'assigned'
            ? 'Slot đã được admin phê duyệt cho bạn'
            : state === 'registered'
            ? 'Đã đăng ký — bấm để đánh dấu hủy'
            : state === 'pendingUnregister'
            ? 'Đã đánh dấu hủy — bấm để bỏ đánh dấu'
            : state === 'selected'
            ? 'Đang chọn — bấm "Lưu" để xác nhận'
            : 'Bấm để chọn'
        }
      >
        {state === 'assigned' ? <Check size={18} />
          : state === 'registered' ? <Check size={18} />
          : state === 'pendingUnregister' ? '✕'
          : ''}
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <CalendarRange size={28} color="var(--accent-primary)" />
        <h1 className="text-gradient" style={{ margin: 0 }}>Đăng ký slot review</h1>
      </div>

      {/* Hint — đổi theo state (mở đăng ký / đã chốt) + role */}
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
          <>Đã hết thời hạn đăng ký lịch.</>
        ) : (
          <>
            {hasRole(role, 'StudentLeader') && (
              <>Chọn tối đa <b>{MAX_GROUP_PREFERENCES} slot</b> mong muốn cho nhóm.</>
            )}
            {hasRole(role, 'Reviewer') && (
              <>Chọn các slot mong muốn được dùng để chấm review (không giới hạn).</>
            )}
            {!hasRole(role, 'Reviewer') && !hasRole(role, 'StudentLeader')
              && !hasRole(role, 'GroupMember') && !hasRole(role, 'Admin')
              && hasRole(role, 'Lecturer') && (
              <>Bạn chưa được chỉ định làm reviewer cho đợt review này — chỉ xem.</>
            )}
            {hasRole(role, 'GroupMember') && <>Bạn chỉ xem được lịch. Liên hệ nhóm trưởng để đăng ký.</>}
            {hasRole(role, 'Admin') && <>Bạn là Admin — chế độ chỉ xem.</>}
          </>
        )}
      </div>

      {/* Review selector + counter + save button — gom vào 1 panel */}
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
            Đợt review:
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
                  {reviews.length === 0 && <option value="">— Chưa có đợt review nào —</option>}
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
                  ▾
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
              <span>Đã đăng ký <b style={{ color: '#10b981' }}>{registeredCount}</b></span>
              <span>Thêm <b style={{ color: '#0ea5e9' }}>{selected.size}</b></span>
              <span>Hủy <b style={{ color: '#ef4444' }}>{pendingRemove.size}</b></span>
              {isStudent && <span>Tối đa <b>{MAX_GROUP_PREFERENCES}</b></span>}
            </div>
            <button
              className="btn btn-primary"
              disabled={!hasChanges || overLimit || submitting}
              onClick={submitChanges}
              style={{ padding: '0.5rem 1rem', marginLeft: 'auto' }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {' '}Lưu ({selected.size + pendingRemove.size})
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
          Vượt quá {MAX_GROUP_PREFERENCES} nguyện vọng — bỏ bớt {totalAfterSubmit - MAX_GROUP_PREFERENCES} slot.
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
      <div style={{ display: 'flex', gap: 16, marginBottom: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 14, height: 14, background: 'rgba(14, 165, 233, 0.22)', border: '1.5px solid #0ea5e9', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> Đang chọn</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 14, background: 'rgba(16, 185, 129, 0.18)', border: '1.5px solid #10b981', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> Đã đăng ký</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 14, background: 'rgba(234, 179, 8, 0.22)', border: '1.5px solid #eab308', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> Đã phê duyệt</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 14, background: 'rgba(239, 68, 68, 0.18)', border: '1.5px solid #ef4444', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> Đánh dấu hủy</span>
      </div>

      {/* Grid */}
      {reviewId == null ? (
        <p style={{ color: 'var(--text-secondary)' }}>Chọn 1 đợt review để xem slot.</p>
      ) : loadingSlots ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
          <Loader2 size={18} className="animate-spin" /> Đang tải slot...
        </div>
      ) : slots.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>Đợt review này chưa có slot nào.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `96px repeat(${dates.length}, minmax(96px, 1fr))`,
              gap: 6,
              minWidth: 96 + dates.length * 102,
            }}
          >
            {/* Ô góc trên-trái — bulk select toàn bộ */}
            <div
              onClick={canRegister ? markAllRegisteredAsPendingRemove : undefined}
              title={canRegister ? 'Bấm để bật/tắt đánh dấu hủy toàn bộ slot đã đăng ký (xanh lá)' : ''}
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
              }}
              onMouseEnter={(e) => { if (canRegister) e.currentTarget.style.background = 'rgba(14, 165, 233, 0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-glass)'; }}
            >
              ✦
            </div>

            {/* Header ngày — click chọn cả cột */}
            {dates.map((date) => {
              const info = parseDateInfo(date);
              return (
                <div
                  key={`hdr_${date}`}
                  onClick={canRegister ? () => bulkToggle(slotsInCol(date)) : undefined}
                  title={canRegister ? `Bấm để chọn / bỏ chọn cả cột ${info.dateStr}` : ''}
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
                  }}
                  onMouseEnter={(e) => { if (canRegister) e.currentTarget.style.background = 'rgba(14, 165, 233, 0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-glass)'; }}
                >
                  <div>{info.dow}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{info.dateStr}</div>
                </div>
              );
            })}

            {slotIndices.map((idx) => (
              <Fragment key={`row_${idx}`}>
                {/* Label "Slot N" — click chọn cả hàng */}
                <div
                  onClick={canRegister ? () => bulkToggle(slotsInRow(idx)) : undefined}
                  title={canRegister ? `Bấm để chọn / bỏ chọn cả hàng Slot ${idx}` : ''}
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
                  }}
                  onMouseEnter={(e) => { if (canRegister) e.currentTarget.style.background = 'rgba(14, 165, 233, 0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-glass)'; }}
                >
                  Slot {idx}
                  <div style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.1 }}>
                    {getReviewSlotTimeRange(idx)}
                  </div>
                </div>
                {dates.map((date) => renderCell(date, idx))}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSlots;
