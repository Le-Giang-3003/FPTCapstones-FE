import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import type {
  ReviewDto,
  ReviewScheduleAssignmentDto,
  ReviewSlotDto,
  SchedulingResultSummary,
  SchedulingStatusDto,
} from '../types';
import {
  CalendarCheck,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  RotateCcw,
  Calendar,
  Table as TableIcon,
  LayoutGrid,
  Download,
} from 'lucide-react';
import { SlotMatrix, type SlotGroupAssignment } from '../components/SlotMatrix';
import { getReviewSlotTimeRange } from '../utils/reviewSlotTime';

// Trang Admin chạy thuật toán xếp lịch review (async + polling) và xem kết quả.
//   - Chọn đợt review (chỉ chạy được khi status = Registered)
//   - Bấm "Chạy xếp lịch" → POST scheduling → polling job tới Completed/Failed
//   - Nếu đợt đã chạy → BE trả 409, hiện nút "Xếp lại (force)"
//   - Khi xong: parse resultJson (số nhóm xếp được, nhóm chưa xếp, reviewer thiếu slot)
//     và hiển thị kết quả theo 3 chế độ: Lưới lịch (SlotMatrix), Bảng (Table), Thẻ (Cards).

const parseDateInfo = (iso: string) => {
  const d = new Date(iso);
  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getUTCDay()];
  const dateStr = `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
  return { dow, dateStr };
};

// Slot gom các assignment cùng slot lại (council 2 reviewer cố định + tối đa 3 nhóm)
interface SlotGroup {
  slotId: number;
  slotDate: string;
  slotIndex: number;
  lecturer1Name: string;
  lecturer2Name: string | null;
  groups: ReviewScheduleAssignmentDto[];
}

const AdminScheduling = () => {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [running, setRunning] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<SchedulingStatusDto | null>(null);
  const [assignments, setAssignments] = useState<ReviewScheduleAssignmentDto[]>([]);
  const [slots, setSlots] = useState<ReviewSlotDto[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRan, setAlreadyRan] = useState(false); // BE trả 409 SCHEDULING_ALREADY_RAN
  const [viewMode, setViewMode] = useState<'matrix' | 'table' | 'cards'>('matrix');

  const pollTimer = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollTimer.current) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  // Tải danh sách đợt review, ưu tiên chọn đợt Registered (mới chạy xếp lịch được).
  useEffect(() => {
    (async () => {
      try {
        setLoadingReviews(true);
        const res = await api.get<ReviewDto[]>('/api/admin/reviews/all');
        setReviews(res.data);
        if (res.data.length > 0) {
          const order = (s: string) =>
            s === 'Registered' ? 0 : s === 'Ongoing' ? 1 : s === 'Registering' ? 2 : 3;
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

  const currentReview = useMemo(
    () => reviews.find((r) => r.id === reviewId) ?? null,
    [reviews, reviewId],
  );
  const canSchedule = currentReview?.status === 'Registered';

  const fetchAssignments = async (rid: number) => {
    try {
      setLoadingAssignments(true);
      const [assignRes, slotsRes] = await Promise.allSettled([
        api.get<ReviewScheduleAssignmentDto[]>(`/api/admin/reviews/${rid}/assignments`),
        api.get<ReviewSlotDto[]>(`/api/admin/reviews/${rid}/slots`),
      ]);
      if (assignRes.status === 'fulfilled') {
        setAssignments(assignRes.value.data);
      } else {
        setAssignments([]);
      }
      if (slotsRes.status === 'fulfilled') {
        setSlots(slotsRes.value.data);
      } else {
        setSlots([]);
      }
    } catch {
      setAssignments([]);
      setSlots([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Đổi đợt review → reset trạng thái job, tải kết quả đã có (nếu đợt từng chạy).
  useEffect(() => {
    stopPolling();
    setJobId(null);
    setStatus(null);
    setError(null);
    setAlreadyRan(false);
    setAssignments([]);
    setSlots([]);
    if (reviewId != null) fetchAssignments(reviewId);
  }, [reviewId]);

  const pollStatus = (id: number) => {
    stopPolling();
    const fetchOnce = async () => {
      try {
        const res = await api.get<SchedulingStatusDto>(`/api/admin/reviews/scheduling/${id}`);
        setStatus(res.data);
        if (res.data.status === 'Completed' || res.data.status === 'Failed') {
          stopPolling();
          setRunning(false);
          if (res.data.status === 'Completed' && reviewId != null) {
            fetchAssignments(reviewId);
          }
        }
      } catch (e) {
        console.error('Poll scheduling failed', e);
      }
    };
    fetchOnce();
    pollTimer.current = window.setInterval(fetchOnce, 2000);
  };

  const runScheduling = async (force: boolean) => {
    if (reviewId == null) return;
    try {
      setRunning(true);
      setError(null);
      setAlreadyRan(false);
      setStatus(null);
      const res = await api.post(`/api/admin/reviews/${reviewId}/scheduling`, null, {
        params: { force },
      });
      const id = res.data.schedulingJobId;
      setJobId(id);
      pollStatus(id);
    } catch (e: any) {
      setRunning(false);
      const code = e?.response?.data?.errorCode || e?.response?.data?.code;
      const msg = e?.response?.data?.message || 'Chạy xếp lịch thất bại';
      // BE chặn nếu đợt đã chạy (409) — cho phép xếp lại bằng force.
      if (e?.response?.status === 409 && (code === 'SCHEDULING_ALREADY_RAN' || /đã chạy/i.test(msg))) {
        setAlreadyRan(true);
      }
      setError(msg);
    }
  };

  // Parse resultJson an toàn (hỗ trợ cả Pascal/camelCase cho record con).
  const summary = useMemo<SchedulingResultSummary | null>(() => {
    if (!status?.resultJson) return null;
    try {
      const raw = JSON.parse(status.resultJson);
      const unassigned = (raw.unassignedGroups || raw.UnassignedGroups || []).map((u: any) => ({
        GroupId: u.GroupId ?? u.groupId,
        Reason: u.Reason ?? u.reason,
      }));
      const underQuota = (raw.underQuotaReviewers || raw.UnderQuotaReviewers || []).map((u: any) => ({
        LecturerId: u.LecturerId ?? u.lecturerId,
        SlotCount: u.SlotCount ?? u.slotCount,
      }));
      return {
        assigned: raw.assigned ?? raw.Assigned ?? 0,
        groupsScheduled: raw.groupsScheduled ?? raw.GroupsScheduled ?? 0,
        unassignedGroups: unassigned,
        underQuotaReviewers: underQuota,
        force: raw.force ?? raw.Force ?? false,
      };
    } catch {
      return null;
    }
  }, [status]);

  // Gom assignment theo slot để hiển thị mỗi slot 1 thẻ (council + các nhóm).
  const slotGroups = useMemo<SlotGroup[]>(() => {
    const map = new Map<number, SlotGroup>();
    for (const a of assignments) {
      let g = map.get(a.slotId);
      if (!g) {
        g = {
          slotId: a.slotId,
          slotDate: a.slotDate,
          slotIndex: a.slotIndex,
          lecturer1Name: a.lecturer1Name,
          lecturer2Name: a.lecturer2Name,
          groups: [],
        };
        map.set(a.slotId, g);
      }
      g.groups.push(a);
    }
    return Array.from(map.values()).sort((x, y) => {
      const d = new Date(x.slotDate).getTime() - new Date(y.slotDate).getTime();
      if (d !== 0) return d;
      return x.slotIndex - y.slotIndex;
    });
  }, [assignments]);

  // Map assignments cho SlotMatrix (key: `${date}_${slotIndex}`)
  const slotAssignmentsMap = useMemo(() => {
    const map = new Map<string, SlotGroupAssignment>();
    for (const a of assignments) {
      const d = a.slotDate.slice(0, 10);
      const key = `${d}_${a.slotIndex}`;
      let g = map.get(key);
      if (!g) {
        g = {
          slotId: a.slotId,
          slotDate: a.slotDate,
          slotIndex: a.slotIndex,
          lecturer1Name: a.lecturer1Name,
          lecturer2Name: a.lecturer2Name,
          groups: [],
        };
        map.set(key, g);
      }
      g.groups.push(a);
    }
    return map;
  }, [assignments]);

  // Xuất file CSV danh sách hội đồng bảo vệ
  const exportCsv = () => {
    if (assignments.length === 0) return;
    const headers = ['Mã nhóm', 'Ngày chấm', 'Ca chấm', 'Khung giờ', 'Phiên', 'Giảng viên 1', 'Giảng viên 2'];
    const rows = assignments.map((a) => {
      const timeRange = getReviewSlotTimeRange(a.slotIndex);
      const info = parseDateInfo(a.slotDate);
      return [
        a.groupCode,
        info.dateStr,
        `Slot ${a.slotIndex}`,
        `"${timeRange}"`,
        `Phiên ${a.sessionIndex}`,
        `"${a.lecturer1Name}"`,
        `"${a.lecturer2Name || 'Chưa phân công'}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lich_Hoi_Dong_Review_${currentReview?.label || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const jobStatus = status?.status;
  const isProcessing = jobStatus === 'Pending' || jobStatus === 'Processing';

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <CalendarCheck size={28} color="var(--accent-primary)" />
        <h1 className="text-gradient" style={{ margin: 0 }}>Xếp lịch review</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Tự động xếp mỗi nhóm vào 1 slot có hội đồng 2 reviewer hợp lệ, cân bằng tải reviewer.
      </p>

      {/* Bộ chọn đợt + nút chạy */}
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
          <CalendarCheck size={16} color="var(--accent-primary)" />
          <label htmlFor="review-select" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Đợt review:
          </label>
          {loadingReviews ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <select
              id="review-select"
              value={reviewId ?? ''}
              onChange={(e) => setReviewId(e.target.value ? parseInt(e.target.value, 10) : null)}
              disabled={running || isProcessing}
              style={{
                flex: 1,
                padding: '0.45rem 0.7rem',
                borderRadius: 6,
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-glass)',
                fontSize: '0.875rem',
                cursor: 'pointer',
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
        </div>

        <button
          className="btn btn-primary"
          disabled={reviewId == null || !canSchedule || running || isProcessing}
          onClick={() => runScheduling(false)}
          style={{ padding: '0.5rem 1.1rem' }}
        >
          {running || isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck size={16} />}
          {' '}Chạy xếp lịch
        </button>
      </div>

      {/* Cảnh báo trạng thái review không phải Registered */}
      {currentReview && !canSchedule && (
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: 'var(--danger)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={18} />
          Chỉ chạy xếp lịch khi đợt review ở trạng thái <b>Registered</b> (đã chốt đăng ký). Hiện tại: {currentReview.status}.
        </div>
      )}

      {/* Lỗi + nút force khi đã chạy rồi */}
      {error && (
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 10,
            whiteSpace: 'pre-wrap',
          }}
        >
          <AlertCircle size={18} /> {error}
          {alreadyRan && (
            <button
              className="btn btn-secondary"
              onClick={() => runScheduling(true)}
              disabled={running || isProcessing}
              style={{ marginLeft: 'auto', padding: '0.4rem 0.9rem' }}
            >
              <RotateCcw size={14} /> Xếp lại (xoá kết quả cũ)
            </button>
          )}
        </div>
      )}

      {/* Trạng thái job đang chạy */}
      {jobId !== null && (
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <strong>Job #{jobId}:</strong>
            {jobStatus === 'Completed' && <CheckCircle size={18} color="#10b981" />}
            {jobStatus === 'Failed' && <XCircle size={18} color="#ef4444" />}
            {isProcessing && <Loader2 size={18} className="animate-spin" />}
            <span
              className={`badge ${jobStatus === 'Completed' ? 'badge-success' : jobStatus === 'Failed' ? 'badge-warning' : ''}`}
            >
              {jobStatus === 'Pending' ? 'Đang chờ' :
                jobStatus === 'Processing' ? 'Đang xử lý' :
                jobStatus === 'Completed' ? 'Hoàn tất' :
                jobStatus === 'Failed' ? 'Thất bại' : '...'}
            </span>
            {status?.force && <span className="badge" style={{ background: 'rgba(251, 146, 60, 0.12)', color: 'var(--accent-primary)' }}>force</span>}
          </div>

          {status?.error && (
            <pre
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '0.75rem',
                borderRadius: 8,
                fontSize: '0.8rem',
                color: 'var(--danger)',
                whiteSpace: 'pre-wrap',
                marginTop: '0.75rem',
              }}
            >
              {status.error}
            </pre>
          )}

          {/* Tóm tắt kết quả */}
          {summary && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div className="badge badge-success" style={{ padding: '0.35rem 0.7rem' }}>
                  {summary.groupsScheduled} nhóm được xếp ({summary.assigned} assignment)
                </div>
                {summary.unassignedGroups.length > 0 && (
                  <div className="badge badge-warning" style={{ padding: '0.35rem 0.7rem' }}>
                    {summary.unassignedGroups.length} nhóm chưa xếp được
                  </div>
                )}
                {summary.underQuotaReviewers.length > 0 && (
                  <div className="badge" style={{ padding: '0.35rem 0.7rem', background: 'rgba(251, 146, 60, 0.12)', color: 'var(--accent-primary)' }}>
                    {summary.underQuotaReviewers.length} reviewer thiếu slot (&lt;3)
                  </div>
                )}
              </div>

              {summary.unassignedGroups.length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.875rem' }}>Nhóm chưa xếp được:</strong>
                  <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {summary.unassignedGroups.map((u) => (
                      <li key={u.GroupId}>Nhóm #{u.GroupId} — {u.Reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.underQuotaReviewers.length > 0 && (
                <div>
                  <strong style={{ fontSize: '0.875rem' }}>Reviewer thiếu slot (&lt;3):</strong>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    {summary.underQuotaReviewers
                      .map((u) => `Lecturer #${u.LecturerId} (${u.SlotCount} slot)`)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Kết quả assignment theo slot */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--border-glass)',
          paddingBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ margin: 0 }}>Kết quả xếp lịch ({assignments.length} nhóm)</h3>
          {loadingAssignments && <Loader2 size={16} className="animate-spin" />}
        </div>

        {assignments.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* View Mode Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'var(--bg-secondary)',
                padding: 3,
                borderRadius: 8,
                border: '1px solid var(--border-glass)',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                style={{
                  padding: '0.35rem 0.7rem',
                  fontSize: '0.78rem',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'matrix' ? 'var(--surface-glass)' : 'transparent',
                  color: viewMode === 'matrix' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: viewMode === 'matrix' ? 700 : 500,
                  boxShadow: viewMode === 'matrix' ? 'var(--shadow-sm)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <Calendar size={14} /> Lưới lịch
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '0.35rem 0.7rem',
                  fontSize: '0.78rem',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'table' ? 'var(--surface-glass)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: viewMode === 'table' ? 700 : 500,
                  boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <TableIcon size={14} /> Bảng
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '0.35rem 0.7rem',
                  fontSize: '0.78rem',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'cards' ? 'var(--surface-glass)' : 'transparent',
                  color: viewMode === 'cards' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: viewMode === 'cards' ? 700 : 500,
                  boxShadow: viewMode === 'cards' ? 'var(--shadow-sm)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                <LayoutGrid size={14} /> Thẻ
              </button>
            </div>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={exportCsv}
              className="btn btn-secondary"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Download size={14} /> Xuất CSV
            </button>
          </div>
        )}
      </div>

      {!loadingAssignments && assignments.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          {reviewId == null ? 'Chọn 1 đợt review.' : 'Đợt này chưa có kết quả xếp lịch.'}
        </p>
      ) : (
        <>
          {/* Chế độ 1: Lưới lịch (SlotMatrix) */}
          {viewMode === 'matrix' && (
            <SlotMatrix
              slots={slots}
              windowStart={currentReview?.windowStart}
              windowEnd={currentReview?.windowEnd}
              slotAssignmentsMap={slotAssignmentsMap}
              viewType="scheduling"
            />
          )}

          {/* Chế độ 2: Dạng bảng (Table view) */}
          {viewMode === 'table' && (
            <div
              style={{
                overflowX: 'auto',
                borderRadius: 12,
                border: '1px solid var(--border-glass)',
                background: 'var(--surface-glass)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Mã nhóm</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Ngày chấm</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Ca chấm</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Phiên</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Giảng viên 1</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Giảng viên 2</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => {
                    const info = parseDateInfo(a.slotDate);
                    const timeRange = getReviewSlotTimeRange(a.slotIndex);
                    return (
                      <tr key={a.assignmentId} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {a.groupCode}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          {info.dow} {info.dateStr}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Slot {a.slotIndex}</div>
                          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>{timeRange}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            className="badge"
                            style={{
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-glass)',
                            }}
                          >
                            Phiên {a.sessionIndex}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {a.lecturer1Name}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: a.lecturer2Name ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                          {a.lecturer2Name || <span style={{ fontStyle: 'italic' }}>Chưa phân công</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Chế độ 3: Dạng thẻ (Cards view) */}
          {viewMode === 'cards' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem',
              }}
            >
              {slotGroups.map((s) => {
                const info = parseDateInfo(s.slotDate);
                const timeRange = getReviewSlotTimeRange(s.slotIndex);
                return (
                  <div key={s.slotId} className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <div>
                        <strong style={{ color: 'var(--text-primary)', display: 'block' }}>
                          {info.dow} {info.dateStr} · Slot {s.slotIndex}
                        </strong>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {timeRange}
                        </span>
                      </div>
                      <span className="badge" style={{ background: 'rgba(251, 146, 60, 0.12)', color: 'var(--accent-primary)' }}>
                        {s.groups.length}/3 nhóm
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 6,
                        fontSize: '0.825rem',
                        color: 'var(--text-secondary)',
                        paddingBottom: '0.6rem',
                        marginBottom: '0.6rem',
                        borderBottom: '1px solid var(--border-glass)',
                      }}
                    >
                      <Users size={15} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>
                        Hội đồng: <b style={{ color: 'var(--text-primary)' }}>{s.lecturer1Name}</b>
                        {s.lecturer2Name ? <> &amp; <b style={{ color: 'var(--text-primary)' }}>{s.lecturer2Name}</b></> : ' (thiếu reviewer 2)'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {s.groups
                        .slice()
                        .sort((a, b) => a.sessionIndex - b.sessionIndex)
                        .map((a) => (
                          <div
                            key={a.assignmentId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: '0.85rem',
                            }}
                          >
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: 'var(--accent-primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {a.sessionIndex}
                            </span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.groupCode}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminScheduling;
