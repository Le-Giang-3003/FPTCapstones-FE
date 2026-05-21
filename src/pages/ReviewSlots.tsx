import { Fragment, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MAX_GROUP_PREFERENCES, type ReviewDto, type ReviewSlotDto } from '../types';
import { CalendarRange, Loader2, AlertCircle, Check } from 'lucide-react';

// Trang đăng ký nguyện vọng slot review.
//   - StudentLeader: chọn tối đa MAX_GROUP_PREFERENCES slot/đợt cho nhóm mình
//   - Lecturer: chọn không giới hạn slot/đợt cho chính mình
//   - GroupMember / Admin: chỉ xem

// empty: chưa chọn | selected: mới chọn (xanh nước, chưa lưu) | registered: đã lưu DB (xanh lá)
// pendingUnregister: đã lưu DB nhưng đang đánh dấu để hủy (đỏ, chưa gửi BE)
type SlotState = 'empty' | 'selected' | 'registered' | 'pendingUnregister';

const parseDateInfo = (iso: string) => {
  const d = new Date(iso);
  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getUTCDay()];
  const dateStr = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  return { dow, dateStr };
};

const ReviewSlots = () => {
  const { user, refreshMe } = useAuth();
  const role = user?.role;
  // BE tự suy group/lecturer từ JWT — FE chỉ cần check role
  const canRegister = role === 'StudentLeader' || role === 'Lecturer';

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

  // BE đã tính sẵn flag dựa trên JWT — FE chỉ đọc
  const isRegistered = (s: ReviewSlotDto): boolean => s.isCurrentUserRegistered;

  const slotState = (s: ReviewSlotDto): SlotState => {
    const registered = isRegistered(s);
    if (registered && pendingRemove.has(s.id)) return 'pendingUnregister';
    if (registered) return 'registered';
    if (selected.has(s.id)) return 'selected';
    return 'empty';
  };

  // Tổng sau khi lưu = đã đăng ký - đánh dấu hủy + mới chọn
  const registeredCount = useMemo(() => slots.filter(isRegistered).length, [slots, user]);
  const totalAfterSubmit = registeredCount - pendingRemove.size + selected.size;
  const isStudent = role === 'StudentLeader';
  const overLimit = isStudent && totalAfterSubmit > MAX_GROUP_PREFERENCES;
  const hasChanges = selected.size > 0 || pendingRemove.size > 0;

  // Click 1 lần: toggle chọn slot trống / bỏ chọn slot xanh nước / hủy "đánh dấu hủy" slot đỏ
  const toggleSelect = (s: ReviewSlotDto) => {
    if (!canRegister || submitting) return;
    const state = slotState(s);
    if (state === 'registered') return;     // green: cần double-click mới chuyển sang đỏ
    if (state === 'pendingUnregister') {
      // bỏ đánh dấu hủy → trở lại xanh lá
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

  // Double-click trên slot đã đăng ký (xanh lá) → đánh dấu hủy (đỏ), chưa gửi BE
  const markForRemove = (s: ReviewSlotDto) => {
    if (!canRegister || submitting) return;
    if (slotState(s) !== 'registered') return;
    const next = new Set(pendingRemove);
    next.add(s.id);
    setPendingRemove(next);
  };

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
      const subpath = role === 'StudentLeader' ? 'groups/me' : 'lecturers/me';
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
      const subpath = role === 'StudentLeader' ? 'groups' : 'lecturers';
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
      minHeight: 64,
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
    return (
      <div
        key={slot.id}
        style={cellStyle(state)}
        onClick={() => toggleSelect(slot)}
        onDoubleClick={() => markForRemove(slot)}
        title={
          state === 'registered'
            ? 'Đã đăng ký — double-click để đánh dấu hủy'
            : state === 'pendingUnregister'
            ? 'Đã đánh dấu hủy — bấm để bỏ đánh dấu, "Lưu" để xác nhận'
            : state === 'selected'
            ? 'Đang chọn — bấm "Lưu" để xác nhận'
            : 'Bấm để chọn'
        }
      >
        {state === 'registered' ? <Check size={18} />
          : state === 'selected' ? '●'
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

      {/* Hint */}
      <div
        className="glass-panel"
        style={{ padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}
      >
        {role === 'StudentLeader' && (
          <>Chọn tối đa <b>{MAX_GROUP_PREFERENCES} slot</b> mong muốn cho nhóm. Bấm slot trống → xanh nước. Double-click slot đã đăng ký (xanh lá) → đỏ (đánh dấu hủy). Bấm "Lưu" để gửi.</>
        )}
        {role === 'Lecturer' && (
          <>Chọn các slot bạn rảnh để chấm review (không giới hạn). Bấm slot trống → xanh nước. Double-click slot đã đăng ký (xanh lá) → đỏ (đánh dấu hủy). Bấm "Lưu" để gửi.</>
        )}
        {role === 'GroupMember' && <>Bạn chỉ xem được lịch. Liên hệ nhóm trưởng để đăng ký.</>}
        {role === 'Admin' && <>Bạn là Admin — chế độ chỉ xem.</>}
      </div>

      {/* Review selector + register bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: '1.25rem' }}>
        <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Đợt review:</label>
        {loadingReviews ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <select
            value={reviewId ?? ''}
            onChange={(e) => setReviewId(e.target.value ? parseInt(e.target.value, 10) : null)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 6,
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-glass)',
              minWidth: 280,
            }}
          >
            {reviews.length === 0 && <option value="">— Chưa có đợt review nào —</option>}
            {reviews.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label} ({r.type}#{r.orderIndex}) — {r.status}
              </option>
            ))}
          </select>
        )}

        {canRegister && (
          <>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              Đã đăng ký: <b style={{ color: '#10b981' }}>{registeredCount}</b>
              {' · '}Thêm: <b style={{ color: '#0ea5e9' }}>{selected.size}</b>
              {' · '}Hủy: <b style={{ color: '#ef4444' }}>{pendingRemove.size}</b>
              {isStudent && <> {' · '}Tối đa: <b>{MAX_GROUP_PREFERENCES}</b></>}
            </span>
            <button
              className="btn btn-primary"
              disabled={!hasChanges || overLimit || submitting}
              onClick={submitChanges}
              style={{ padding: '0.5rem 1rem' }}
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
        <span><span style={{ display: 'inline-block', width: 14, height: 14, background: 'rgba(14, 165, 233, 0.22)', border: '1.5px solid #0ea5e9', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> Đang chọn (chưa lưu)</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 14, background: 'rgba(16, 185, 129, 0.18)', border: '1.5px solid #10b981', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> Đã đăng ký</span>
        <span><span style={{ display: 'inline-block', width: 14, height: 14, background: 'rgba(239, 68, 68, 0.18)', border: '1.5px solid #ef4444', borderRadius: 3, verticalAlign: 'middle', marginRight: 4 }} /> Đánh dấu hủy (chưa lưu)</span>
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
              gridTemplateColumns: `70px repeat(${dates.length}, minmax(80px, 1fr))`,
              gap: 6,
              minWidth: 70 + dates.length * 86,
            }}
          >
            <div />
            {dates.map((date) => {
              const info = parseDateInfo(date);
              return (
                <div
                  key={`hdr_${date}`}
                  style={{
                    padding: '0.4rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    background: 'var(--surface-glass)',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                  }}
                >
                  <div>{info.dow}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{info.dateStr}</div>
                </div>
              );
            })}

            {slotIndices.map((idx) => (
              <Fragment key={`row_${idx}`}>
                <div
                  style={{
                    padding: '0.4rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    background: 'var(--surface-glass)',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Slot {idx}
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
