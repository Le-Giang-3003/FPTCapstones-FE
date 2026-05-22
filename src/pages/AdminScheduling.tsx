import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import type {
  ReviewDto,
  ReviewScheduleAssignmentDto,
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
} from 'lucide-react';

// Trang Admin chạy thuật toán xếp lịch review (async + polling) và xem kết quả.
//   - Chọn đợt review (chỉ chạy được khi status = Registered)
//   - Bấm "Chạy xếp lịch" → POST scheduling → polling job tới Completed/Failed
//   - Nếu đợt đã chạy → BE trả 409, hiện nút "Xếp lại (force)"
//   - Khi xong: parse resultJson (số nhóm xếp được, nhóm chưa xếp, reviewer thiếu slot)
//     và tải danh sách assignment để hiển thị theo từng slot.

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
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRan, setAlreadyRan] = useState(false); // BE trả 409 SCHEDULING_ALREADY_RAN

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
      const res = await api.get<ReviewScheduleAssignmentDto[]>(`/api/admin/reviews/${rid}/assignments`);
      setAssignments(res.data);
    } catch {
      setAssignments([]);
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
            <Loader2 size={16} className="spin" />
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
          {running || isProcessing ? <Loader2 size={16} className="spin" /> : <CalendarCheck size={16} />}
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
            {isProcessing && <Loader2 size={18} className="spin" />}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>Kết quả xếp lịch</h3>
        {loadingAssignments && <Loader2 size={16} className="spin" />}
      </div>

      {!loadingAssignments && slotGroups.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>
          {reviewId == null ? 'Chọn 1 đợt review.' : 'Đợt này chưa có kết quả xếp lịch.'}
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {slotGroups.map((s) => {
            const info = parseDateInfo(s.slotDate);
            return (
              <div key={s.slotId} className="glass-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {info.dow} {info.dateStr} · Slot {s.slotIndex}
                  </strong>
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

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default AdminScheduling;
