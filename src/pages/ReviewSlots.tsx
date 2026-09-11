import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MAX_GROUP_PREFERENCES, type ReviewDto, type ReviewSlotDto } from '../types';
import { CalendarRange, Loader2, AlertCircle, Check } from 'lucide-react';
import { hasRole } from '../utils/role';
import { SlotMatrix, type SlotState } from '../components/SlotMatrix';

// Trang đăng ký nguyện vọng slot review.
//   - StudentLeader: chọn tối đa MAX_GROUP_PREFERENCES slot/đợt cho nhóm mình
//   - Lecturer: chọn không giới hạn slot/đợt cho chính mình
//   - GroupMember / Admin: chỉ xem

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

  // Lưu — 1 request bulk gửi cả register + unregister cho BE xử lý trong 1 transaction
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
      setError(e?.response?.data?.message || 'Không lưu được thay đổi');
    } finally {
      setSubmitting(false);
    }
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

      {/* Matrix Grid */}
      {reviewId == null ? (
        <p style={{ color: 'var(--text-secondary)' }}>Chọn 1 đợt review để xem slot.</p>
      ) : loadingSlots ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
          <Loader2 size={18} className="animate-spin" /> Đang tải slot...
        </div>
      ) : (
        <SlotMatrix
          slots={slots}
          windowStart={currentReview?.windowStart}
          windowEnd={currentReview?.windowEnd}
          canRegister={canRegister}
          selectedSlotIds={selected}
          pendingRemoveSlotIds={pendingRemove}
          onToggleSlot={toggleSelect}
          onBulkToggleCol={(date) => bulkToggle(slotsInCol(date))}
          onBulkToggleRow={(idx) => bulkToggle(slotsInRow(idx))}
          onBulkToggleAll={markAllRegisteredAsPendingRemove}
        />
      )}
    </div>
  );
};

export default ReviewSlots;
