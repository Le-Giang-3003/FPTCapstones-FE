import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Users, CalendarRange, ClipboardCheck, Loader2, AlertCircle, X, Clock, FileText, UserCheck } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { hasAnyRole } from '../utils/role';
import type { DashboardStatsDto, LecturerAssignedSlotDto } from '../types';
import { Tooltip } from '../components/Tooltip';

// Dashboard GVHD/Reviewer:
//   - 3 ô KPI: Tổng nhóm, Danh sách đợt review (chip — đợt hết hạn tô xám), Slot đã được phê duyệt trong đợt đang chọn
//   - Khu vực thống kê: bảng chi tiết các slot đã được phê duyệt cho GV hiện tại
//     (hiển thị hết, slot thuộc đợt hết hạn được làm mờ)

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const Dashboard = () => {
  const { user } = useAuth();
  const role = user?.role;
  const canViewDashboard = hasAnyRole(role, ['Lecturer', 'Reviewer', 'Admin', 'StudentLeader', 'GroupMember']);

  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [assignedSlots, setAssignedSlots] = useState<LecturerAssignedSlotDto[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Slot đang xem chi tiết qua popup. Null = popup đóng.
  const [detailSlot, setDetailSlot] = useState<LecturerAssignedSlotDto | null>(null);

  useEffect(() => {
    if (!canViewDashboard) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, slotsRes] = await Promise.all([
          api.get<DashboardStatsDto>('/api/dashboard/stats'),
          api.get<LecturerAssignedSlotDto[]>('/api/dashboard/assigned-slots'),
        ]);
        setStats(statsRes.data);
        setAssignedSlots(slotsRes.data);

        // Mặc định chọn đợt còn hạn đầu tiên (nếu không có thì để null = xem tất cả)
        const firstActive = statsRes.data.reviews.find((r) => !r.isExpired);
        setSelectedReviewId(firstActive?.id ?? null);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không tải được dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [canViewDashboard]);

  // Số slot đã được phê duyệt cho đợt đang chọn — fallback tổng tất cả khi chưa chọn
  const selectedReviewSlotCount = useMemo(() => {
    if (!stats) return 0;
    if (selectedReviewId == null) {
      return Object.values(stats.assignedSlotCounts).reduce((a, b) => a + b, 0);
    }
    return stats.assignedSlotCounts[String(selectedReviewId)] ?? 0;
  }, [stats, selectedReviewId]);

  const selectedReviewLabel = useMemo(() => {
    if (selectedReviewId == null) return 'Tất cả đợt';
    return stats?.reviews.find((r) => r.id === selectedReviewId)?.label ?? '—';
  }, [stats, selectedReviewId]);

  // Lọc khu vực thống kê theo đợt đang chọn
  const filteredAssignedSlots = useMemo(() => {
    if (selectedReviewId == null) return assignedSlots;
    return assignedSlots.filter((s) => s.reviewId === selectedReviewId);
  }, [assignedSlots, selectedReviewId]);

  if (!canViewDashboard) {
    return (
      <div className="animate-fade-in" style={{ padding: '2rem' }}>
        <h1>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Bạn không có quyền xem dashboard.</p>
      </div>
    );
  }

  const viewerRole = stats?.viewerRole;
  const isStudentView = viewerRole === 'Student';

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isStudentView ? 'Tổng quan lịch review của nhóm' : 'Tổng quan hoạt động giảng viên'}
          </p>
        </div>
      </div>

      {error && (
        <div
          className="glass-panel"
          style={{
            padding: '0.75rem 1rem', marginBottom: '1rem',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* 3 ô KPI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {/* Tổng nhóm (lecturer) hoặc Nhóm của tôi (student) */}
        <KpiCard
          icon={<Users size={24} />}
          color="#f59e0b"
          label={isStudentView ? 'Nhóm của tôi' : 'Tổng nhóm hướng dẫn'}
          value={
            loading
              ? '—'
              : isStudentView
              ? (stats?.myGroup?.groupCode ?? 'Chưa có nhóm')
              : String(stats?.totalGroups ?? 0)
          }
        />

        {/* Danh sách đợt review (chip) */}
        <div
          className="glass-card"
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={iconWrapStyle('#6366f1')}>
              <CalendarRange size={22} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Các đợt review
            </p>
          </div>
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : !stats || stats.reviews.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, opacity: 0.6, fontStyle: 'italic' }}>
              Không có đợt để ___
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {stats.reviews.map((r) => {
                const isSelected = r.id === selectedReviewId;
                return (
                  <Tooltip
                    key={r.id}
                    content={`${formatDate(r.windowStart)} → ${formatDate(r.windowEnd)} (${r.status})`}
                    variant="glass-card"
                    style={{ display: 'inline-flex' }}
                  >
                  <button
                    onClick={() => setSelectedReviewId(isSelected ? null : r.id)}
                    style={{
                      padding: '0.3rem 0.7rem',
                      borderRadius: 999,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: '1.5px solid',
                      transition: 'all 0.15s ease',
                      opacity: r.isExpired ? 0.45 : 1,
                      background: isSelected
                        ? 'rgba(99, 102, 241, 0.22)'
                        : r.isExpired
                        ? 'rgba(148, 163, 184, 0.12)'
                        : 'var(--glass-card-bg)',
                      borderColor: isSelected
                        ? '#6366f1'
                        : r.isExpired
                        ? 'rgba(148, 163, 184, 0.4)'
                        : 'var(--border-glass)',
                      color: isSelected
                        ? '#6366f1'
                        : r.isExpired
                        ? 'var(--text-secondary)'
                        : 'var(--text-primary)',
                    }}
                  >
                    {r.label}
                  </button>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>

        {/* Slot đã được phê duyệt trong đợt đang chọn */}
        <KpiCard
          icon={<ClipboardCheck size={24} />}
          color="#10b981"
          label={`${isStudentView ? 'Số buổi review của nhóm' : 'Slot đã được phê duyệt'} (${selectedReviewLabel})`}
          value={loading ? '—' : String(selectedReviewSlotCount)}
        />
      </div>

      {/* Khu vực thống kê — card grid theo style AdminScheduling */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
        <BarChart3 size={22} color="var(--accent-primary)" />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Khu vực thống kê</h2>
        {selectedReviewId != null && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            — Lịch chi tiết của {selectedReviewLabel}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
          <Loader2 size={18} className="animate-spin" /> Đang tải...
        </div>
      ) : filteredAssignedSlots.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.7 }}>
          Chưa có slot nào được phê duyệt.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredAssignedSlots.map((s) => (
            <AssignedSlotCard key={s.assignmentId} slot={s} onOpen={() => setDetailSlot(s)} />
          ))}
        </div>
      )}

      {/* Popup chi tiết slot */}
      {detailSlot && (
        <SlotDetailModal
          slot={detailSlot}
          isStudentView={isStudentView}
          onClose={() => setDetailSlot(null)}
        />
      )}
    </div>
  );
};

// Card thẻ summary — layout 1 dòng kiểu admin xếp lịch:
//   [DOW Ngày · Slot N]
//   [Badge Đợt] ⏱ HH:mm – HH:mm
// Click → mở modal chi tiết.
const AssignedSlotCard = ({ slot, onOpen }: { slot: LecturerAssignedSlotDto; onOpen: () => void }) => {
  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(slot.slotDate).getUTCDay()];

  return (
    <Tooltip
      content="Bấm để xem chi tiết"
      variant="glass-card"
      placement="top"
      className="glass-card"
      style={{
        padding: 0,
        border: 'none',
        background: 'transparent',
      }}
    >
      <div
        onClick={onOpen}
        style={{
          padding: '1rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          opacity: slot.isExpired ? 0.55 : 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 8,
            marginBottom: '0.6rem',
          }}
        >
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            {dow} - {formatDate(slot.slotDate)} · Slot {slot.sessionIndex}
          </strong>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <span
          className="badge"
          style={{
            background: 'rgba(251, 146, 60, 0.12)',
            color: 'var(--accent-primary)',
            fontWeight: 600,
            padding: '0.2rem 0.6rem',
            fontSize: '0.72rem',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {slot.reviewLabel}
        </span>
        <Clock size={14} style={{ flexShrink: 0 }} />
        <span>
          <b style={{ color: 'var(--accent-primary)' }}>{slot.startTime}</b>
          {' – '}
          <b style={{ color: 'var(--accent-primary)' }}>{slot.endTime}</b>
        </span>
      </div>
      </div>
    </Tooltip>
  );
};

// Modal full chi tiết slot
const SlotDetailModal = ({ slot, isStudentView, onClose }: {
  slot: LecturerAssignedSlotDto;
  isStudentView: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Khoá scroll body khi modal mở
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(slot.slotDate).getUTCDay()];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 520,
          padding: '1.5rem',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Đóng"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-glass)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.2rem', paddingRight: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.4rem' }}>
            <span
              className="badge"
              style={{
                background: 'rgba(251, 146, 60, 0.12)',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                padding: '0.25rem 0.7rem',
                fontSize: '0.78rem',
              }}
            >
              {slot.reviewLabel}
            </span>
            {slot.isExpired && (
              <span
                className="badge"
                style={{
                  background: 'rgba(148, 163, 184, 0.18)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  padding: '0.25rem 0.7rem',
                  fontSize: '0.78rem',
                }}
              >
                Đã kết thúc
              </span>
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {dow} - {formatDate(slot.slotDate)} · Slot {slot.sessionIndex}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '0.5rem', fontSize: '0.9rem' }}>
            <Clock size={15} color="var(--accent-primary)" />
            <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
              {slot.startTime} – {slot.endTime}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <DetailRow
            icon={<Users size={15} />}
            label="Nhóm"
            value={<strong style={{ fontSize: '0.95rem' }}>{slot.groupCode}</strong>}
          />
          <DetailRow
            icon={<FileText size={15} />}
            label="Đề tài"
            value={slot.projectName}
          />
          {isStudentView ? (
            <DetailRow
              icon={<UserCheck size={15} />}
              label="Hội đồng"
              value={
                <span>
                  <b>{slot.lecturer1Name}</b>
                  {slot.lecturer2Name ? <> &amp; <b>{slot.lecturer2Name}</b></> : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}> (chưa có GV 2)</span>
                  )}
                </span>
              }
            />
          ) : (
            <DetailRow
              icon={<UserCheck size={15} />}
              label="Đồng GV"
              value={
                slot.partnerLecturerName
                  ? <span>{slot.partnerLecturerName}</span>
                  : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Chưa có đồng giảng viên</span>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 10, fontSize: '0.88rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', minWidth: 100, flexShrink: 0 }}>
      {icon}
      <span>{label}</span>
    </div>
    <div style={{ color: 'var(--text-primary)', wordBreak: 'break-word', flex: 1 }}>{value}</div>
  </div>
);

const iconWrapStyle = (color: string): React.CSSProperties => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  background: `${color}15`,
  border: `1px solid ${color}30`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color,
  flexShrink: 0,
});

const KpiCard = ({ icon, color, label, value }: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
}) => (
  <div
    className="glass-card"
    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}
  >
    <div style={iconWrapStyle(color)}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
    </div>
  </div>
);

export default Dashboard;
