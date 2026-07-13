import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Semester } from '../types';
import { 
  Users, 
  Calendar, 
  Search, 
  FileCheck2, 
  User, 
  ChevronRight, 
  Clock,
  HelpCircle,
  ArrowUpDown,
  ChevronLeft
} from 'lucide-react';

interface DashboardStats {
  totalGroups: number;
  reviews: Array<{
    id: number;
    label: string;
    type: 'Review' | 'Defence';
    orderIndex: number;
    windowStart: string;
    windowEnd: string;
    status: string;
    isExpired: boolean;
  }>;
  assignedSlotCounts: Record<number, number>;
  myGroup?: {
    groupId: number;
    groupCode: string;
  };
  viewerRole: 'Lecturer' | 'Student' | 'Admin';
}

interface AssignedSlot {
  assignmentId: number;
  reviewId: number;
  reviewLabel: string;
  reviewType: 'Review' | 'Defence';
  slotDate: string;
  slotIndex: number;
  sessionIndex: number;
  startTime: string;
  endTime: string;
  groupId: number;
  groupCode: string;
  projectName: string;
  lecturer1Name: string;
  lecturer2Name?: string;
  partnerLecturerName?: string;
  isExpired: boolean;
}

interface GroupRow {
  groupId: number;
  groupCode: string;
  projectName: string;
  leaderFullName: string;
  leaderEmail: string;
  lecturer1Name: string;
  lecturer2Name?: string;
  myRole: string;
  submittedVersionCount: number;
  isFinalized: boolean;
  lastUpdated: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleNavigateToProject = (groupId: number) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        navigate(`/projects/${groupId}`);
      });
    } else {
      navigate(`/projects/${groupId}`);
    }
  };

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | ''>('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assignedSlots, setAssignedSlots] = useState<AssignedSlot[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'finalized' | 'draft'>('all');
  const [loading, setLoading] = useState(true);

  // Sorting & Pagination States
  const [sortField, setSortField] = useState<'groupCode' | 'projectName' | 'isFinalized'>('groupCode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const toggleSort = (field: 'groupCode' | 'projectName' | 'isFinalized') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Process groups (Sorting & Pagination)
  const processedGroups = React.useMemo(() => {
    const sorted = [...groups].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'isFinalized') {
        const boolA = valA ? 1 : 0;
        const boolB = valB ? 1 : 0;
        return sortOrder === 'asc' ? boolA - boolB : boolB - boolA;
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [groups, sortField, sortOrder, currentPage]);

  const totalPages = Math.ceil(groups.length / pageSize) || 1;

  // Fetch semesters
  useEffect(() => {
    const fetchSemesters = async () => {
      // Students do not have permission to view semesters list, load directly
      if (user?.role !== 'Admin' && user?.role !== 'Lecturer') {
        setLoading(true);
        try {
          const [statsRes, slotsRes] = await Promise.all([
            api.get('/api/dashboard/stats'),
            api.get('/api/dashboard/assigned-slots')
          ]);
          setStats(statsRes.data);
          setAssignedSlots(slotsRes.data);
        } catch (err) {
          showToast('Không thể tải dữ liệu tổng quan', 'error');
        } finally {
          setLoading(false);
        }
        return;
      }

      // Admins & Lecturers load semesters list
      try {
        const res = await api.get('/api/admin/semesters');
        setSemesters(res.data);
        const ongoing = res.data.find((s: Semester) => s.status === 'Ongoing');
        if (ongoing) {
          setSelectedSemesterId(ongoing.id);
        } else if (res.data.length > 0) {
          setSelectedSemesterId(res.data[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        showToast('Không thể tải danh sách học kỳ', 'error');
        setLoading(false);
      }
    };

    if (user) {
      fetchSemesters();
    }
  }, [user, showToast]);

  // Fetch data when semester selection or filters change
  useEffect(() => {
    if (user?.role !== 'Admin' && user?.role !== 'Lecturer') return;
    if (selectedSemesterId === '') return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const params: any = { semesterId: selectedSemesterId };
        
        // Fetch general stats
        const statsRes = await api.get('/api/dashboard/stats', { params });
        setStats(statsRes.data);

        // Fetch user schedule (assigned evaluation slots)
        if (user?.role !== 'Admin') {
          const slotsRes = await api.get('/api/dashboard/assigned-slots', { params });
          setAssignedSlots(slotsRes.data);
        }

        // Fetch groups list (for Lecturer and Admin)
        if (user?.role === 'Lecturer' || user?.role === 'Admin') {
          const grpParams: any = { 
            semesterId: selectedSemesterId,
            search: search || undefined
          };
          if (statusFilter === 'finalized') grpParams.finalized = true;
          if (statusFilter === 'draft') grpParams.finalized = false;

          const groupsRes = await api.get('/api/dashboard', { params: grpParams });
          setGroups(groupsRes.data);
        }
      } catch (err) {
        showToast('Không thể tải dữ liệu tổng quan', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedSemesterId, search, statusFilter, user, showToast]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const getSlotDayLabel = (slotIndex: number) => {
    switch (slotIndex) {
      case 1: return 'Ca 1 (07:30 - 09:30)';
      case 2: return 'Ca 2 (09:40 - 11:40)';
      case 3: return 'Ca 3 (12:30 - 14:30)';
      case 4: return 'Ca 4 (14:40 - 16:40)';
      case 5: return 'Ca 5 (17:00 - 19:00)';
      default: return `Ca ${slotIndex}`;
    }
  };

  return (
    <div className="ds-dashboard-page">
      {/* Top filter toolbar */}
      {(user?.role === 'Admin' || user?.role === 'Lecturer') && (
        <div className="ds-dashboard-toolbar">
          <div className="ds-toolbar-left">
          <label htmlFor="semester-select">Học kỳ: </label>
          <select 
            id="semester-select" 
            value={selectedSemesterId} 
            onChange={(e) => setSelectedSemesterId(Number(e.target.value))}
            className="ds-select-semester"
          >
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} ({s.season} {s.year})
              </option>
            ))}
          </select>
        </div>
      </div>
      )}

      {loading && !stats ? (
        // Skeleton Loader
        <div className="ds-dashboard-skeletons">
          <div className="ds-skeleton-grid">
            <div className="ds-skeleton" style={{ height: '120px' }}></div>
            <div className="ds-skeleton" style={{ height: '120px' }}></div>
            <div className="ds-skeleton" style={{ height: '120px' }}></div>
          </div>
          <div className="ds-skeleton" style={{ height: '400px', marginTop: '24px' }}></div>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          {(user?.role === 'Admin' || user?.role === 'Lecturer') && (
            <div className="ds-kpi-grid">
              <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-header">
                <div className="ds-kpi-icon-wrapper">
                  <Users size={20} />
                </div>
                <h3>
                  {user?.role === 'Admin' 
                    ? 'Tổng số Nhóm' 
                    : (user?.role === 'Lecturer' ? 'Nhóm hướng dẫn' : 'Thành viên nhóm')}
                </h3>
              </div>
              <div className="ds-kpi-value tnum">
                {stats?.totalGroups ?? 0}
              </div>
              <p className="ds-kpi-sub">Số lượng nhóm trong học kỳ hiện tại</p>
            </div>

            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-header">
                <div className="ds-kpi-icon-wrapper accent">
                  <Calendar size={20} />
                </div>
                <h3>Lịch chấm đã gán</h3>
              </div>
              <div className="ds-kpi-value tnum">
                {assignedSlots.length}
              </div>
              <p className="ds-kpi-sub">Số phiên chấm đồ án được giao lịch</p>
            </div>

            <div className="ds-card ds-kpi-card">
              <div className="ds-kpi-header">
                <div className="ds-kpi-icon-wrapper success">
                  <FileCheck2 size={20} />
                </div>
                <h3>Đợt đánh giá</h3>
              </div>
              <div className="ds-kpi-value tnum">
                {stats?.reviews.filter(r => !r.isExpired).length ?? 0}
                <span className="ds-kpi-max">/{stats?.reviews.length ?? 0}</span>
              </div>
              <p className="ds-kpi-sub">Đợt chấm đang diễn ra (chưa hết hạn)</p>
            </div>
          </div>
          )}

          <div className={`ds-dashboard-content-split ${user?.role !== 'Admin' && user?.role !== 'Lecturer' ? 'full-width' : ''}`}>
            {/* Left/Main column */}
            <div className="ds-content-main-panel">
              {/* Lecturer and Admin View: Mentored Groups table */}
              {(user?.role === 'Lecturer' || user?.role === 'Admin') && (
                <div className="ds-card ds-dashboard-table-card">
                  <div className="ds-card-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h2 style={{ margin: 0 }}>Danh sách Nhóm Đồ án</h2>
                      <span className="ds-badge tnum">{groups.length} nhóm</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div className="ds-search-bar" style={{ margin: 0 }}>
                        <Search size={16} className="ds-search-icon" />
                        <input 
                          type="text" 
                          placeholder="Tìm mã nhóm, tên đề tài..." 
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </div>

                      <div className="ds-filter-tabs" style={{ margin: 0 }}>
                        <button 
                          className={`ds-filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setStatusFilter('all')}
                        >
                          Tất cả
                        </button>
                        <button 
                          className={`ds-filter-tab ${statusFilter === 'finalized' ? 'active' : ''}`}
                          onClick={() => setStatusFilter('finalized')}
                        >
                          Đã chốt
                        </button>
                        <button 
                          className={`ds-filter-tab ${statusFilter === 'draft' ? 'active' : ''}`}
                          onClick={() => setStatusFilter('draft')}
                        >
                          Chưa chốt
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="ds-table-container">
                    <table className="ds-table">
                      <thead>
                        <tr>
                          <th 
                            onClick={() => toggleSort('groupCode')} 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>Mã nhóm</span>
                              <ArrowUpDown size={14} className={sortField === 'groupCode' ? 'text-primary' : 'text-muted'} />
                            </div>
                          </th>
                          <th 
                            onClick={() => toggleSort('projectName')} 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>Tên đề tài</span>
                              <ArrowUpDown size={14} className={sortField === 'projectName' ? 'text-primary' : 'text-muted'} />
                            </div>
                          </th>
                          <th>Trưởng nhóm</th>
                          <th>Giảng viên</th>
                          <th 
                            onClick={() => toggleSort('isFinalized')} 
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>Trạng thái</span>
                              <ArrowUpDown size={14} className={sortField === 'isFinalized' ? 'text-primary' : 'text-muted'} />
                            </div>
                          </th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {groups.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-muted)' }}>
                              Không tìm thấy nhóm đồ án nào khớp với bộ lọc hoặc từ khóa. Vui lòng thử tìm kiếm bằng từ khóa khác hoặc xóa các điều kiện lọc.
                            </td>
                          </tr>
                        ) : (
                          processedGroups.map((g) => (
                            <tr key={g.groupId} onClick={() => handleNavigateToProject(g.groupId)} style={{ cursor: 'pointer' }}>
                              <td style={{ fontWeight: 700, viewTransitionName: `group-code-${g.groupId}` } as any}>{g.groupCode}</td>
                              <td>
                                <div className="ds-project-title-cell">
                                  <span>{g.projectName}</span>
                                </div>
                              </td>
                              <td>
                                <div className="ds-leader-cell">
                                  <span style={{ fontWeight: 500 }}>{g.leaderFullName}</span>
                                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>{g.leaderEmail}</span>
                                </div>
                              </td>
                              <td>
                                <div className="ds-lecturer-cell">
                                  <span style={{ fontSize: '0.9rem' }}>GV1: {g.lecturer1Name}</span>
                                  {g.lecturer2Name && (
                                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>GV2: {g.lecturer2Name}</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className={`ds-status-pill ${g.isFinalized ? 'success' : 'draft'}`}>
                                  {g.isFinalized ? 'Đã chốt' : 'Bản nháp'}
                                </span>
                              </td>
                              <td>
                                <ChevronRight size={18} className="ds-table-row-arrow" />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control for groups */}
                  {groups.length > pageSize && (
                    <div className="ds-pagination" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                      <button 
                        className="ds-btn ds-btn-secondary ds-btn-icon-only" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="ds-page-info tnum">Trang {currentPage} / {totalPages}</span>
                      <button 
                        className="ds-btn ds-btn-secondary ds-btn-icon-only" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Student View: My Group detail */}
              {user?.role !== 'Lecturer' && user?.role !== 'Admin' && (
                <div className="ds-card ds-student-group-card">
                  {stats?.myGroup ? (
                    <div>
                      <div className="ds-student-group-header">
                        <div>
                          <p className="text-muted">Nhóm của bạn</p>
                          <h2 style={{ viewTransitionName: `group-code-${stats.myGroup.groupId}` } as any}>Mã nhóm: {stats.myGroup.groupCode}</h2>
                        </div>
                        <button 
                          className="ds-btn ds-btn-primary"
                          onClick={() => handleNavigateToProject(stats.myGroup!.groupId)}
                        >
                          Truy cập trang nộp tài liệu
                        </button>
                      </div>

                      <div className="ds-assigned-schedule-section" style={{ marginTop: '32px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Lịch chấm hội đồng của nhóm</h3>
                        {assignedSlots.length === 0 ? (
                          <div className="ds-empty-schedule-card">
                            <Clock size={36} className="text-muted" />
                            <p>Nhóm chưa được phân bổ lịch chấm hội đồng cho các đợt đánh giá.</p>
                          </div>
                        ) : (
                          <div className="ds-schedule-timeline">
                            {assignedSlots.map((slot) => (
                              <div key={slot.assignmentId} className={`ds-timeline-item ${slot.isExpired ? 'expired' : ''}`}>
                                <div className="ds-timeline-badge">
                                  {slot.reviewType === 'Defence' ? 'DF' : 'RV'}
                                </div>
                                <div className="ds-timeline-content">
                                  <div className="ds-timeline-header">
                                    <h4>{slot.reviewLabel}</h4>
                                    <span className="ds-time-stamp tnum">
                                      {formatDate(slot.slotDate)} | {slot.startTime} - {slot.endTime} ({getSlotDayLabel(slot.slotIndex)})
                                    </span>
                                  </div>
                                  <div className="ds-timeline-details">
                                    <p><strong>Dự án:</strong> {slot.projectName}</p>
                                    <p>
                                      <strong>Hội đồng chấm:</strong> {slot.lecturer1Name} 
                                      {slot.lecturer2Name ? ` & ${slot.lecturer2Name}` : ''}
                                    </p>
                                    <p><strong>Lượt chấm (Session):</strong> <span className="tnum">{slot.sessionIndex}</span></p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="ds-no-group-placeholder">
                      <HelpCircle size={48} className="text-muted" style={{ marginBottom: '16px' }} />
                      <h2>Bạn chưa có nhóm đồ án</h2>
                      <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto 16px auto' }}>
                        Tài khoản của bạn hiện chưa được xếp vào nhóm nào trong học kỳ này. Vui lòng liên hệ Văn phòng Đào tạo (Admin) để được gán nhóm và cập nhật thông tin học kỳ.
                      </p>
                      <a href="mailto:admin@fpt.edu.vn" className="ds-btn ds-btn-secondary">
                        Liên hệ Admin hỗ trợ
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Lecturer Schedule Details */}
              {user?.role === 'Lecturer' && (
                <div className="ds-card ds-lecturer-schedule-card" style={{ marginTop: '24px' }}>
                  <div className="ds-card-header">
                    <h2>Lịch chấm được phân công</h2>
                    <span className="ds-badge tnum">{assignedSlots.length} ca</span>
                  </div>

                  <div className="ds-schedule-grid">
                    {assignedSlots.length === 0 ? (
                      <p className="text-muted" style={{ padding: '24px 0', textAlign: 'center' }}>
                        Bạn chưa được xếp lịch chấm hội đồng nào trong học kỳ này.
                      </p>
                    ) : (
                      assignedSlots.map((slot) => (
                        <div key={slot.assignmentId} className={`ds-schedule-item ${slot.isExpired ? 'expired' : ''}`}>
                          <div className="ds-schedule-meta">
                            <span className="ds-review-type-badge">{slot.reviewLabel}</span>
                            <span className="ds-session-number tnum">Lượt {slot.sessionIndex}</span>
                          </div>
                          <h3>Nhóm: {slot.groupCode}</h3>
                          <p className="ds-project-title-p">{slot.projectName}</p>
                          <div className="ds-schedule-footer">
                            <div className="ds-schedule-footer-item">
                              <Calendar size={14} />
                              <span className="tnum">{formatDate(slot.slotDate)}</span>
                            </div>
                            <div className="ds-schedule-footer-item">
                              <Clock size={14} />
                              <span className="tnum">{slot.startTime} - {slot.endTime}</span>
                            </div>
                            {slot.partnerLecturerName && (
                              <div className="ds-schedule-footer-item font-accent">
                                <User size={14} />
                                <span>Cùng chấm: {slot.partnerLecturerName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side Bar */}
            {(user?.role === 'Admin' || user?.role === 'Lecturer') && (
              <div className="ds-content-sidebar-panel">
                {/* Active Reviews status info */}
              <div className="ds-card ds-reviews-status-card">
                <h2>Trạng thái Đợt chấm</h2>
                <div className="ds-reviews-list">
                  {stats?.reviews.map((r) => (
                    <div key={r.id} className={`ds-review-status-item ${r.isExpired ? 'expired' : ''}`}>
                      <div className="ds-review-status-left">
                        <span className={`ds-review-type-dot ${r.type === 'Defence' ? 'defence' : 'review'}`}></span>
                        <div className="ds-review-status-info">
                          <h4>{r.label}</h4>
                          <span>{formatDate(r.windowStart)} - {formatDate(r.windowEnd)}</span>
                        </div>
                      </div>
                      <div className="ds-review-status-right">
                        <span className={`ds-review-status-tag ${r.status.toLowerCase()}`}>
                          {r.isExpired ? 'Hết hạn' : (
                            r.status === 'Registering' ? 'Đang đăng ký' : 
                            (r.status === 'Ongoing' ? 'Đang chấm' : 'Đã khóa')
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}
          </div>
        </>
      )}

      <style>{`
        .ds-dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .ds-dashboard-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--color-bg);
          padding: 16px 24px;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }

        .ds-toolbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
        }

        .ds-select-semester {
          width: auto;
          min-width: 180px;
          padding: 8px 12px;
          font-weight: 500;
        }

        .ds-toolbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

         .ds-search-bar {
          position: relative;
          display: flex;
          align-items: center;
        }

        .ds-search-icon {
          position: absolute;
          left: 12px;
          color: var(--color-muted);
        }

        .ds-search-bar input {
          padding: 8px 12px 8px 36px;
          width: 200px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ds-search-bar input:focus {
          width: 260px;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 15%, transparent);
        }

        .ds-filter-tabs {
          display: flex;
          gap: 4px;
          background-color: var(--color-surface);
          padding: 4px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
        }

        .ds-filter-tab {
          padding: 6px 12px;
          font-family: 'Roboto', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-muted);
          border: none;
          background: none;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .ds-filter-tab.active {
          background-color: var(--color-bg);
          color: var(--color-ink);
          box-shadow: 0px 1px 3px rgba(0,0,0,0.05);
        }

        /* KPI styling */
        .ds-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }

        .ds-kpi-card {
          display: flex;
          flex-direction: column;
        }

        .ds-kpi-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .ds-kpi-header h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-muted);
        }

        .ds-kpi-icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          background-color: color-mix(in oklch, var(--color-primary) 8%, transparent);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ds-kpi-icon-wrapper.accent {
          background-color: color-mix(in oklch, var(--color-accent) 8%, transparent);
          color: var(--color-accent);
        }

        .ds-kpi-icon-wrapper.success {
          background-color: color-mix(in oklch, var(--color-success) 8%, transparent);
          color: var(--color-success);
        }

        .ds-kpi-value {
          font-size: 2.75rem;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 8px;
          letter-spacing: -0.04em;
        }

        .ds-kpi-max {
          font-size: 1.25rem;
          color: var(--color-muted);
          font-weight: 500;
        }

        .ds-kpi-sub {
          font-size: 0.8rem;
          color: var(--color-muted);
        }

        /* Content split layout */
        .ds-dashboard-content-split {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .ds-dashboard-content-split.full-width {
          grid-template-columns: 1fr;
        }

        @media (max-width: 1024px) {
          .ds-dashboard-content-split {
            grid-template-columns: 1fr;
          }
        }

        .ds-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .ds-badge {
          background-color: var(--color-surface);
          color: var(--color-ink);
          border: 1px solid var(--color-border);
          padding: 4px 10px;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 500;
        }


        .ds-project-title-cell {
          max-width: 320px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
        }

        .ds-leader-cell, .ds-lecturer-cell {
          display: flex;
          flex-direction: column;
        }

        .ds-table-row-arrow {
          color: var(--color-muted);
          transition: transform var(--transition-fast);
        }

        .ds-table tbody tr {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), 
                      box-shadow 0.2s ease, 
                      background-color 0.2s ease;
        }

        .ds-table tbody tr:hover {
          background-color: var(--color-surface) !important;
          transform: translateX(6px);
          box-shadow: inset 3px 0 0 0 var(--color-primary), 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .ds-table tbody tr:hover .ds-table-row-arrow {
          transform: translateX(4px);
          color: var(--color-primary);
        }

        /* Sidebar Reviews Panel styling */
        .ds-reviews-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }

        .ds-review-status-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--color-border);
        }

        .ds-review-status-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .ds-review-status-item.expired {
          opacity: 0.5;
        }

        .ds-review-status-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ds-review-type-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .ds-review-type-dot.review { background-color: var(--color-primary); }
        .ds-review-type-dot.defence { background-color: var(--color-accent); }

        .ds-review-status-info h4 {
          font-size: 0.9rem;
          font-weight: 700;
        }

        .ds-review-status-info span {
          font-size: 0.75rem;
          color: var(--color-muted);
        }

        .ds-review-status-tag {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }

        .ds-review-status-tag.draft { background-color: var(--color-surface); color: var(--color-muted); }
        .ds-review-status-tag.registering { background-color: color-mix(in oklch, var(--color-primary) 8%, transparent); color: var(--color-primary); }
        .ds-review-status-tag.registered { background-color: color-mix(in oklch, var(--color-success) 8%, transparent); color: var(--color-success); }
        .ds-review-status-tag.ongoing { background-color: color-mix(in oklch, var(--color-accent) 8%, transparent); color: var(--color-accent); }

        /* Lecturer schedule styling */
        .ds-schedule-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .ds-schedule-item {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
        }

        .ds-schedule-item:hover {
          border-color: var(--color-primary);
          box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.05);
        }

        .ds-schedule-item.expired {
          opacity: 0.6;
        }

        .ds-schedule-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ds-review-type-badge {
          background-color: var(--color-bg);
          border: 1px solid var(--color-border);
          padding: 2px 8px;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: var(--radius-sm);
        }

        .ds-session-number {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-primary);
        }

        .ds-schedule-item h3 {
          font-size: 1.05rem;
        }

        .ds-project-title-p {
          font-size: 0.85rem;
          color: var(--color-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          min-height: 38px;
        }

        .ds-schedule-footer {
          margin-top: 8px;
          border-top: 1px solid var(--color-border);
          padding-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ds-schedule-footer-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--color-muted);
        }

        .ds-schedule-footer-item.font-accent {
          color: var(--color-primary);
          font-weight: 500;
        }

        /* Student View Group details */
        .ds-student-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .ds-student-group-header h2 {
          font-size: 1.6rem;
        }

        .ds-timeline-item {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          position: relative;
        }

        .ds-timeline-item::after {
          content: '';
          position: absolute;
          left: 20px;
          top: 40px;
          bottom: -28px;
          width: 2px;
          background-color: var(--color-border);
        }

        .ds-timeline-item:last-child::after {
          display: none;
        }

        .ds-timeline-item.expired {
          opacity: 0.6;
        }

        .ds-timeline-badge {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid var(--color-primary);
          background-color: var(--color-bg);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          z-index: 10;
        }

        .ds-timeline-content {
          flex: 1;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px 20px;
        }

        .ds-timeline-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
          border-bottom: 1px dashed var(--color-border);
          padding-bottom: 8px;
        }

        .ds-time-stamp {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--color-primary);
        }

        .ds-timeline-details p {
          margin-bottom: 6px;
          font-size: 0.85rem;
        }

        .ds-timeline-details p:last-child {
          margin-bottom: 0;
        }

        .ds-empty-schedule-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background-color: var(--color-surface);
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-md);
          text-align: center;
          gap: 12px;
        }

        .ds-no-group-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
