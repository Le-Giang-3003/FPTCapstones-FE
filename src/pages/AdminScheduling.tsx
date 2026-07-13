import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import type { Semester, Review, ReviewType, ReviewStatus } from '../types';
import { 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

interface Assignment {
  assignmentId: number;
  slotId: number;
  slotDate: string;
  slotIndex: number;
  sessionIndex: number;
  groupId: number;
  groupCode: string;
  lecturer1Id: number;
  lecturer1Name: string;
  lecturer2Id: number;
  lecturer2Name: string;
}

interface UnassignedGroupInfo {
  GroupId: number;
  Reason: string;
}

interface UnderQuotaReviewerInfo {
  LecturerId: number;
  SlotCount: number;
}

interface JobResultSummary {
  assigned: number;
  groupsScheduled: number;
  unassignedGroups: UnassignedGroupInfo[];
  underQuotaReviewers: UnderQuotaReviewerInfo[];
  force: boolean;
}

export const AdminScheduling: React.FC = () => {
  const { showToast } = useToast();
  
  // Data lists
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reviewersMap, setReviewersMap] = useState<Record<number, { name: string, email: string }>>({});
  
  // Selections
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | ''>('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  // Loading states
  const [loadingSemesters, setLoadingSemesters] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  
  // Scheduling job states
  const [scheduling, setScheduling] = useState(false);
  const [schedulingJobId, setSchedulingJobId] = useState<number | null>(null);
  const [schedulingStatus, setSchedulingStatus] = useState<string | null>(null);
  const [schedulingResult, setSchedulingResult] = useState<JobResultSummary | null>(null);
  const [schedulingError, setSchedulingError] = useState<string | null>(null);
  const [forceReschedule, setForceReschedule] = useState(false);
  
  // Search & Pagination for assignments
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Review Round Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [modalLabel, setModalLabel] = useState('');
  const [modalType, setModalType] = useState<ReviewType>('Review');
  const [modalOrderIndex, setModalOrderIndex] = useState<number>(1);
  const [modalWindowStart, setModalWindowStart] = useState('');
  const [modalWindowEnd, setModalWindowEnd] = useState('');
  const [modalStatus, setModalStatus] = useState<ReviewStatus>('Draft');
  const [modalNote, setModalNote] = useState('');
  const [modalSlotsPerDay, setModalSlotsPerDay] = useState<string>('');
  const [savingReview, setSavingReview] = useState(false);

  // Polling ref
  const pollingRef = useRef<any | null>(null);

  useEffect(() => {
    fetchSemesters();
    fetchReviewers();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Fetch all semesters
  const fetchSemesters = async () => {
    setLoadingSemesters(true);
    try {
      const res = await api.get('/api/admin/semesters', { params: { pageSize: 100 } });
      setSemesters(res.data);
      
      // Auto-select ongoing semester if any, otherwise default to first
      const ongoing = res.data.find((s: Semester) => s.status === 'Ongoing');
      if (ongoing) {
        setSelectedSemesterId(ongoing.id);
        fetchReviews(ongoing.id);
      } else if (res.data.length > 0) {
        setSelectedSemesterId(res.data[0].id);
        fetchReviews(res.data[0].id);
      }
    } catch (err) {
      showToast('Không thể tải danh sách học kỳ', 'error');
    } finally {
      setLoadingSemesters(false);
    }
  };

  // Fetch reviewers list to map lecturerId to names
  const fetchReviewers = async () => {
    try {
      const res = await api.get('/api/admin/reviews/reviewers');
      const map: Record<number, { name: string, email: string }> = {};
      res.data.forEach((r: any) => {
        map[r.lecturerId] = { name: r.fullName, email: r.email };
      });
      setReviewersMap(map);
    } catch (err) {
      console.error('Failed to load reviewers map', err);
    }
  };

  // Fetch reviews for a specific semester
  const fetchReviews = async (semesterId: number) => {
    setLoadingReviews(true);
    setSelectedReview(null);
    setAssignments([]);
    setSchedulingStatus(null);
    setSchedulingResult(null);
    try {
      const res = await api.get('/api/admin/reviews', { params: { semesterId } });
      setReviews(res.data);
      if (res.data.length > 0) {
        setSelectedReview(res.data[0]);
        fetchAssignments(res.data[0].id);
      }
    } catch (err) {
      showToast('Không thể tải danh sách đợt đánh giá', 'error');
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch assignments for a review round
  const fetchAssignments = async (reviewId: number) => {
    setLoadingAssignments(true);
    setPage(1);
    try {
      const res = await api.get(`/api/admin/reviews/${reviewId}/assignments`);
      setAssignments(res.data);
    } catch (err) {
      showToast('Không thể tải kết quả phân lịch', 'error');
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Handle Semester Change
  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) {
      const numId = parseInt(id, 10);
      setSelectedSemesterId(numId);
      fetchReviews(numId);
    } else {
      setSelectedSemesterId('');
      setReviews([]);
    }
  };

  // Handle Review Selection Change
  const handleSelectReview = (rev: Review) => {
    setSelectedReview(rev);
    setSchedulingStatus(null);
    setSchedulingResult(null);
    setSchedulingError(null);
    fetchAssignments(rev.id);
  };

  // Run Scheduling Algorithm
  const handleRunScheduling = async () => {
    if (!selectedReview) return;
    
    if (assignments.length > 0 && !forceReschedule) {
      if (!window.confirm('Đợt này đã có dữ liệu phân lịch. Vui lòng tích chọn "Chạy đè" nếu muốn tính toán lại từ đầu.')) {
        return;
      }
    }

    setScheduling(true);
    setSchedulingStatus('Pending');
    setSchedulingResult(null);
    setSchedulingError(null);
    setSchedulingJobId(null);
    
    try {
      const res = await api.post(`/api/admin/reviews/${selectedReview.id}/scheduling`, null, {
        params: { force: forceReschedule }
      });
      const jobId = res.data.schedulingJobId;
      setSchedulingJobId(jobId);
      showToast('Thuật toán đã được kích hoạt. Đang gán lịch chấm...', 'success');
      startPolling(jobId);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể chạy thuật toán xếp lịch';
      showToast(msg, 'error');
      setScheduling(false);
      setSchedulingStatus('Failed');
    }
  };

  // Poll scheduling status
  const startPolling = (jobId: number) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/admin/reviews/scheduling/${jobId}`);
        const data = res.data;
        setSchedulingStatus(data.status);
        
        if (data.status === 'Completed' || data.status === 'Failed') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setScheduling(false);
          
          if (data.status === 'Completed') {
            showToast('Tính toán phân lịch hoàn tất!', 'success');
            if (data.resultJson) {
              try {
                const parsed = JSON.parse(data.resultJson);
                setSchedulingResult(parsed);
              } catch (e) {
                console.error('Failed to parse ResultJson', e);
              }
            }
            if (selectedReview) fetchAssignments(selectedReview.id);
          } else {
            showToast('Thuật toán xếp lịch thất bại', 'error');
            setSchedulingError(data.error || 'Lỗi không rõ nguyên nhân trong thuật toán gán lịch.');
          }
        }
      } catch (err) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setScheduling(false);
        setSchedulingStatus('Failed');
        showToast('Lỗi trong khi kiểm tra tiến trình xếp lịch.', 'error');
      }
    }, 1500);
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    if (!selectedSemesterId) {
      showToast('Vui lòng chọn hoặc tạo học kỳ trước', 'warning');
      return;
    }
    setEditingReview(null);
    setModalLabel('');
    setModalType('Review');
    setModalOrderIndex(reviews.length + 1);
    setModalWindowStart('');
    setModalWindowEnd('');
    setModalStatus('Draft');
    setModalNote('');
    setModalSlotsPerDay('');
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (rev: Review) => {
    setEditingReview(rev);
    setModalLabel(rev.label);
    setModalType(rev.type);
    setModalOrderIndex(rev.orderIndex);
    setModalWindowStart(rev.windowStart.substring(0, 10));
    setModalWindowEnd(rev.windowEnd.substring(0, 10));
    setModalStatus(rev.status);
    setModalNote(rev.note || '');
    setModalSlotsPerDay((rev as any).slotsPerDay?.toString() || '');
    setShowModal(true);
  };

  // Handle Delete Review
  const handleDeleteReview = async (id: number, label: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đợt đánh giá "${label}"? Toàn bộ slot đăng ký và lịch chấm liên quan sẽ bị xóa.`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/reviews/${id}`);
      showToast(`Đã xóa đợt đánh giá "${label}"`, 'success');
      if (selectedSemesterId) fetchReviews(selectedSemesterId);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa đợt đánh giá', 'error');
    }
  };

  // Handle Save Review Round
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalLabel.trim()) {
      showToast('Vui lòng nhập tên đợt đánh giá', 'warning');
      return;
    }
    if (!modalWindowStart || !modalWindowEnd) {
      showToast('Vui lòng chọn thời gian bắt đầu và kết thúc', 'warning');
      return;
    }
    if (new Date(modalWindowStart) >= new Date(modalWindowEnd)) {
      showToast('Ngày kết thúc phải sau ngày bắt đầu', 'warning');
      return;
    }

    setSavingReview(true);
    const body: any = {
      semesterId: selectedSemesterId,
      type: modalType,
      orderIndex: modalOrderIndex,
      label: modalLabel,
      windowStart: modalWindowStart,
      windowEnd: modalWindowEnd,
      status: modalStatus,
      note: modalNote || null,
      slotsPerDay: modalSlotsPerDay ? parseInt(modalSlotsPerDay, 10) : null
    };

    try {
      if (editingReview) {
        // Update Review metadata
        await api.put(`/api/admin/reviews/${editingReview.id}`, {
          label: modalLabel,
          windowStart: modalWindowStart,
          windowEnd: modalWindowEnd,
          status: modalStatus,
          note: modalNote || null
        });
        showToast('Đã cập nhật thông tin đợt đánh giá', 'success');
      } else {
        // Create new Review round
        await api.post('/api/admin/reviews', body);
        showToast('Đã thêm mới đợt đánh giá thành công', 'success');
      }
      setShowModal(false);
      if (selectedSemesterId) fetchReviews(selectedSemesterId);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Thao tác lưu đợt đánh giá thất bại', 'error');
    } finally {
      setSavingReview(false);
    }
  };

  // Date Formatting Helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Render Status Badge
  const renderStatus = (status: ReviewStatus) => {
    switch (status) {
      case 'Draft':
        return <span className="ds-status-pill finished">Nháp (Draft)</span>;
      case 'Registering':
        return <span className="ds-status-pill pending">Đang đăng ký</span>;
      case 'Registered':
        return <span className="ds-status-pill ongoing">Đã chốt slot</span>;
      case 'Ongoing':
        return <span className="ds-status-pill success">Đang diễn ra</span>;
      case 'Finished':
        return <span className="ds-status-pill finished">Đã kết thúc</span>;
      case 'Cancelled':
        return <span className="ds-status-pill danger">Đã hủy</span>;
      default:
        return <span className="ds-status-pill finished">{status}</span>;
    }
  };

  // Filter & Paginate Assignments
  const filteredAssignments = assignments.filter(a => 
    a.groupCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.lecturer1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.lecturer2Name && a.lecturer2Name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const paginatedAssignments = filteredAssignments.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredAssignments.length / pageSize);

  return (
    <div className="ds-scheduling-page">
      
      {/* Top Semester selector & Header */}
      <div className="ds-scheduling-header">
        <div>
          <h1>Tự động Phân lịch Hội đồng</h1>
          <p className="text-muted">Kích hoạt chạy thuật toán khớp nối nguyện vọng và gán hội đồng phản biện</p>
        </div>
        
        <div className="ds-semester-filter-card">
          <label className="ds-form-label" style={{ marginBottom: '4px' }}>Chọn Học kỳ làm việc</label>
          {loadingSemesters ? (
            <div className="ds-skeleton" style={{ height: '36px', width: '200px' }}></div>
          ) : (
            <select 
              value={selectedSemesterId} 
              onChange={handleSemesterChange}
              className="ds-select-main"
            >
              <option value="">-- Chọn học kỳ --</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} ({s.status === 'Ongoing' ? 'Đang chạy' : s.status})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="ds-scheduling-layout">
        
        {/* UPPER CARD: Reviews Rounds Roster */}
        <div className="ds-card" style={{ gridColumn: 'span 2', marginBottom: '24px' }}>
          <div className="ds-card-header-with-filter">
            <h2>Các đợt đánh giá trong kỳ</h2>
            <button className="ds-btn ds-btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} />
              <span>Tạo đợt đánh giá mới</span>
            </button>
          </div>

          {loadingReviews ? (
            <div className="ds-loading-placeholder">
              <div className="ds-skeleton" style={{ height: '50px', marginBottom: '12px' }}></div>
              <div className="ds-skeleton" style={{ height: '50px' }}></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="ds-empty-state">
              <AlertCircle size={48} className="text-muted" style={{ marginBottom: '12px' }} />
              <h3>Chưa khai báo đợt đánh giá nào</h3>
              <p className="text-muted">Vui lòng tạo đợt đánh giá (Review/Defence) để mở đăng ký nguyện vọng và chạy lịch.</p>
            </div>
          ) : (
            <div className="ds-reviews-grid">
              {reviews.map(rev => {
                const isActive = selectedReview?.id === rev.id;
                return (
                  <div 
                    key={rev.id} 
                    className={`ds-review-item-card ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectReview(rev)}
                  >
                    <div className="ds-review-card-top">
                      <div>
                        <span className={`ds-type-badge ${rev.type.toLowerCase()}`}>
                          {rev.type === 'Review' ? 'Giữa kỳ' : 'Cuối kỳ'}
                        </span>
                        <h3 style={{ marginTop: '8px' }}>{rev.label}</h3>
                      </div>
                      <div className="ds-review-actions-inline" onClick={e => e.stopPropagation()}>
                        <button className="ds-action-btn edit" onClick={() => handleOpenEdit(rev)}>
                          <Edit2 size={12} />
                        </button>
                        <button className="ds-action-btn delete" onClick={() => handleDeleteReview(rev.id, rev.label)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="ds-review-card-body">
                      <div className="ds-review-meta-item">
                        <Calendar size={14} />
                        <span className="tnum">{formatDate(rev.windowStart)} - {formatDate(rev.windowEnd)}</span>
                      </div>
                      {rev.note && (
                        <p className="ds-review-note-preview">{rev.note}</p>
                      )}
                    </div>

                    <div className="ds-review-card-footer">
                      {renderStatus(rev.status)}
                      <span className="tnum" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-muted)' }}>
                        Đợt #{rev.orderIndex}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LOWER SECTION: Scheduling Workspace (Activated only when a review round is selected) */}
        {selectedReview ? (
          <>
            {/* Left Workspace Panel: Scheduling triggers and reports */}
            <div className="ds-scheduling-workspace-main">
              
              {/* Algorithm Trigger Card */}
              <div className="ds-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h2>Bảng điều khiển Xếp lịch: {selectedReview.label}</h2>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                      Chạy thuật toán tối ưu hóa phân bổ phòng, ca và giảng viên phản biện
                    </p>
                  </div>
                  <span className={`ds-status-pill ${selectedReview.status.toLowerCase()}`}>
                    {selectedReview.status}
                  </span>
                </div>

                <div className="ds-scheduling-controls">
                  <div className="ds-force-checkbox-container">
                    <label className="ds-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={forceReschedule} 
                        onChange={(e) => setForceReschedule(e.target.checked)} 
                        disabled={scheduling}
                      />
                      <span>Chạy đè (Force Reschedule) - Xóa toàn bộ lịch phân cũ để gán mới</span>
                    </label>
                  </div>

                  <button 
                    className="ds-btn ds-btn-primary"
                    onClick={handleRunScheduling}
                    disabled={scheduling || selectedReview.status === 'Draft' || selectedReview.status === 'Finished'}
                    style={{ padding: '12px 24px', fontSize: '1rem' }}
                  >
                    {scheduling ? (
                      <>
                        <Clock size={18} className="spin" />
                        <span>Đang chạy thuật toán gán slot...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Kích hoạt Xếp lịch tự động</span>
                      </>
                    )}
                  </button>

                  {selectedReview.status === 'Draft' && (
                    <div className="ds-warning-alert" style={{ marginTop: '16px' }}>
                      <AlertTriangle size={16} />
                      <span>Đợt đánh giá đang ở trạng thái <strong>Draft</strong>. Cần chuyển sang <strong>Registering</strong> hoặc <strong>Registered</strong> để chạy xếp lịch.</span>
                    </div>
                  )}
                </div>

                {/* Polling progress card */}
                {schedulingStatus && (
                  <div className="ds-job-status-indicator" style={{ marginTop: '20px' }}>
                    <div className="ds-job-progress-header">
                      <span className="tnum">Tiến trình ID: #{schedulingJobId}</span>
                      <strong className={`status-${schedulingStatus.toLowerCase()}`}>{schedulingStatus}</strong>
                    </div>
                    {scheduling === true && (
                      <div className="ds-progress-bar-container">
                        <div className="ds-progress-bar-glow"></div>
                      </div>
                    )}
                    {schedulingStatus === 'Failed' && schedulingError && (
                      <div className="ds-raw-error-box" style={{ marginTop: '10px', color: 'var(--color-danger)' }}>
                        {schedulingError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Statistics & Warnings Report Card */}
              {(schedulingResult || (assignments.length > 0 && !scheduling)) && (
                <div className="ds-card" style={{ marginBottom: '24px' }}>
                  <h2>Báo cáo chất lượng phân lịch</h2>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
                    Các chỉ số thống kê kết quả gán và cảnh báo lỗi xung đột
                  </p>

                  <div className="ds-metrics-grid" style={{ marginBottom: '24px' }}>
                    <div className="ds-metric-box">
                      <span className="ds-metric-val tnum">
                        {schedulingResult ? schedulingResult.assigned : assignments.length}
                      </span>
                      <span className="ds-metric-label">Slot gán thành công</span>
                    </div>

                    <div className="ds-metric-box warning">
                      <span className="ds-metric-val tnum">
                        {schedulingResult ? schedulingResult.unassignedGroups.length : 0}
                      </span>
                      <span className="ds-metric-label">Nhóm chưa xếp được</span>
                    </div>

                    <div className="ds-metric-box info">
                      <span className="ds-metric-val tnum">
                        {schedulingResult ? schedulingResult.underQuotaReviewers.length : 0}
                      </span>
                      <span className="ds-metric-label">Hội đồng thiếu ca</span>
                    </div>
                  </div>

                  {/* Warnings blocks */}
                  {schedulingResult && schedulingResult.unassignedGroups.length > 0 && (
                    <div className="ds-warning-section" style={{ marginBottom: '16px' }}>
                      <h4 className="text-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <AlertTriangle size={16} />
                        <span>Danh sách nhóm không thể gán ({schedulingResult.unassignedGroups.length} nhóm):</span>
                      </h4>
                      <div className="ds-warning-list-scroll">
                        <table className="ds-report-table">
                          <thead>
                            <tr>
                              <th>Nhóm ID</th>
                              <th>Lý do không thể xếp lịch</th>
                            </tr>
                          </thead>
                          <tbody>
                            {schedulingResult.unassignedGroups.map((g, idx) => (
                              <tr key={idx}>
                                <td className="tnum" style={{ fontWeight: 700 }}>#{g.GroupId}</td>
                                <td className="text-danger">{g.Reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Reviewers Under Quota warnings */}
                  {schedulingResult && schedulingResult.underQuotaReviewers.length > 0 && (
                    <div className="ds-warning-section">
                      <h4 className="text-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <UserCheck size={16} />
                        <span>Hội đồng chưa đủ định mức ca chấm ({schedulingResult.underQuotaReviewers.length} giảng viên):</span>
                      </h4>
                      <div className="ds-warning-list-scroll">
                        <table className="ds-report-table">
                          <thead>
                            <tr>
                              <th>Hội đồng</th>
                              <th>Mã GV</th>
                              <th style={{ textAlign: 'right' }}>Số ca đã xếp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {schedulingResult.underQuotaReviewers.map((r, idx) => {
                              const info = reviewersMap[r.LecturerId];
                              return (
                                <tr key={idx}>
                                  <td>{info?.name || 'Không rõ'}</td>
                                  <td className="tnum text-muted" style={{ fontSize: '0.8rem' }}>
                                    {info?.email || `ID: #${r.LecturerId}`}
                                  </td>
                                  <td className="tnum text-primary" style={{ textAlign: 'right', fontWeight: 700 }}>
                                    {r.SlotCount} ca
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Active Assignments List Table */}
              <div className="ds-card">
                <div className="ds-card-header-with-filter">
                  <h2>Danh sách phân lịch chi tiết</h2>
                  
                  {/* Search input */}
                  <div className="ds-search-wrapper">
                    <Search size={16} className="ds-search-icon" />
                    <input 
                      type="text" 
                      placeholder="Tìm nhóm, giảng viên..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                      className="ds-input-search"
                    />
                  </div>
                </div>

                {loadingAssignments ? (
                  <div className="ds-loading-placeholder">
                    <div className="ds-skeleton" style={{ height: '40px', marginBottom: '12px' }}></div>
                    <div className="ds-skeleton" style={{ height: '40px', marginBottom: '12px' }}></div>
                    <div className="ds-skeleton" style={{ height: '40px' }}></div>
                  </div>
                ) : filteredAssignments.length === 0 ? (
                  <div className="ds-empty-state" style={{ padding: '32px 0' }}>
                    <Search size={36} className="text-muted" style={{ marginBottom: '12px' }} />
                    <p className="text-muted">Không tìm thấy phân lịch nào tương thích.</p>
                  </div>
                ) : (
                  <>
                    <div className="ds-table-container">
                      <table className="ds-table">
                        <thead>
                          <tr>
                            <th>Mã Nhóm</th>
                            <th>Ngày chấm</th>
                            <th>Ca chấm</th>
                            <th>Ủy viên 1 (Phản biện)</th>
                            <th>Ủy viên 2 (Phản biện)</th>
                            <th style={{ textAlign: 'right' }}>Phòng/Ca</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedAssignments.map((a) => (
                            <tr key={a.assignmentId}>
                              <td style={{ fontWeight: 700 }} className="tnum">{a.groupCode}</td>
                              <td className="tnum">{formatDate(a.slotDate)}</td>
                              <td className="tnum">Ca {a.slotIndex}</td>
                              <td>{a.lecturer1Name}</td>
                              <td>{a.lecturer2Name || <span className="text-muted">— (Trống)</span>}</td>
                              <td className="tnum" style={{ textAlign: 'right', fontWeight: 700 }}>
                                Room {a.sessionIndex}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="ds-pagination">
                        <button 
                          className="ds-btn ds-btn-secondary ds-btn-icon-only" 
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="ds-page-info tnum">Trang {page} / {totalPages}</span>
                        <button 
                          className="ds-btn ds-btn-secondary ds-btn-icon-only" 
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>

            {/* Right Guideline / Rules Sidebar */}
            <div className="ds-scheduling-workspace-sidebar">
              <div className="ds-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Sparkles size={20} className="text-primary" />
                  <h2>Quy tắc Xếp Lịch Chấm</h2>
                </div>
                
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5' }}>
                  Thuật toán heuristical xếp lịch hoạt động dựa trên các ràng buộc bảo vệ đồ án tốt nghiệp nghiêm ngặt:
                </p>

                <div className="ds-guideline-steps">
                  <div className="ds-guide-step">
                    <span className="ds-step-num">1</span>
                    <div>
                      <h4>Tránh trùng lịch</h4>
                      <p>Một nhóm đồ án, một phòng thi, và một giảng viên không thể bị xếp trùng ca trong cùng một ngày chấm.</p>
                    </div>
                  </div>

                  <div className="ds-guide-step">
                    <span className="ds-step-num">2</span>
                    <div>
                      <h4>Tối ưu hóa phản biện</h4>
                      <p>Giảng viên hướng dẫn (GVHD1 & GVHD2) của một nhóm tuyệt đối không được gán làm hội đồng phản biện cho chính nhóm đó.</p>
                    </div>
                  </div>

                  <div className="ds-guide-step">
                    <span className="ds-step-num">3</span>
                    <div>
                      <h4>Định mức ca (Quota)</h4>
                      <p>Thuật toán tự gán cân bằng số ca phản biện cho giảng viên, ưu tiên lấp đầy định mức ca tối thiểu của mỗi hội đồng trước.</p>
                    </div>
                  </div>

                  <div className="ds-guide-step">
                    <span className="ds-step-num">4</span>
                    <div>
                      <h4>Khớp nguyện vọng rảnh</h4>
                      <p>Chỉ gán hội đồng phản biện vào các ca chấm mà giảng viên đó đã đăng ký rảnh (Active Free Slots).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="ds-card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '60px 20px' }}>
            <Calendar size={48} className="text-muted" style={{ marginBottom: '16px' }} />
            <h3>Chưa chọn đợt đánh giá</h3>
            <p className="text-muted">Vui lòng bấm chọn một đợt đánh giá ở danh sách phía trên để bắt đầu thao tác xếp lịch.</p>
          </div>
        )}

      </div>

      {/* Review Round Create / Edit Modal */}
      {showModal && (
        <div className="ds-modal-backdrop">
          <div className="ds-modal-container" style={{ maxWidth: '600px' }}>
            <div className="ds-modal-header">
              <h2>{editingReview ? `Cập nhật đợt: ${editingReview.label}` : 'Tạo đợt đánh giá mới'}</h2>
              <button className="ds-modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="ds-modal-form">
              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label className="ds-form-label">Tên đợt đánh giá</label>
                  <input 
                    type="text" 
                    placeholder="VD: Review 1, Hội đồng Bảo vệ tốt nghiệp..."
                    value={modalLabel}
                    onChange={(e) => setModalLabel(e.target.value)}
                    required
                    disabled={savingReview}
                  />
                </div>

                <div className="ds-form-group">
                  <label className="ds-form-label">Mã số thứ tự đợt (Order Index)</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={10} 
                    value={modalOrderIndex}
                    onChange={(e) => setModalOrderIndex(parseInt(e.target.value, 10))}
                    required
                    disabled={savingReview}
                  />
                </div>
              </div>

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label className="ds-form-label">Phân loại buổi chấm</label>
                  <select 
                    value={modalType} 
                    onChange={(e) => setModalType(e.target.value as any)}
                    required
                    disabled={savingReview}
                  >
                    <option value="Review">Review (Đánh giá tiến độ giữa kỳ)</option>
                    <option value="Defence">Defence (Bảo vệ đồ án cuối kỳ)</option>
                  </select>
                </div>

                <div className="ds-form-group">
                  <label className="ds-form-label">Trạng thái đợt chấm</label>
                  <select 
                    value={modalStatus} 
                    onChange={(e) => setModalStatus(e.target.value as any)}
                    required
                    disabled={savingReview}
                  >
                    <option value="Draft">Draft (Bản nháp - chuẩn bị)</option>
                    <option value="Registering">Registering (Mở đăng ký nguyện vọng)</option>
                    <option value="Registered">Registered (Đã chốt slot đăng ký)</option>
                    <option value="Ongoing">Ongoing (Đang diễn ra chấm bài)</option>
                    <option value="Finished">Finished (Đã kết thúc hoàn tất)</option>
                    <option value="Cancelled">Cancelled (Đã hủy bỏ)</option>
                  </select>
                </div>
              </div>

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label className="ds-form-label">Ngày bắt đầu đợt chấm</label>
                  <input 
                    type="date" 
                    value={modalWindowStart}
                    onChange={(e) => setModalWindowStart(e.target.value)}
                    required
                    disabled={savingReview}
                  />
                </div>

                <div className="ds-form-group">
                  <label className="ds-form-label">Ngày kết thúc đợt chấm</label>
                  <input 
                    type="date" 
                    value={modalWindowEnd}
                    onChange={(e) => setModalWindowEnd(e.target.value)}
                    required
                    disabled={savingReview}
                  />
                </div>
              </div>

              <div className="ds-form-group">
                <label className="ds-form-label">Số ca chấm tối đa/ngày (Tùy chọn)</label>
                <input 
                  type="number" 
                  placeholder="Bỏ trống nếu không giới hạn"
                  value={modalSlotsPerDay}
                  onChange={(e) => setModalSlotsPerDay(e.target.value)}
                  disabled={savingReview}
                />
              </div>

              <div className="ds-form-group">
                <label className="ds-form-label">Ghi chú thêm</label>
                <textarea 
                  rows={2} 
                  placeholder="Nhập ghi chú yêu cầu hoặc mô tả thông tin đợt chấm..."
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  disabled={savingReview}
                />
              </div>

              <div className="ds-modal-footer">
                <button 
                  type="button" 
                  className="ds-btn ds-btn-secondary" 
                  onClick={() => setShowModal(false)}
                  disabled={savingReview}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="ds-btn ds-btn-primary"
                  disabled={savingReview}
                >
                  {savingReview ? 'Đang lưu...' : 'Lưu đợt chấm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Component Styles */}
      <style>{`
        .ds-scheduling-page {
          width: 100%;
          animation: ds-page-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-scheduling-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .ds-semester-filter-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 8px 16px;
          display: flex;
          flex-direction: column;
        }

        .ds-select-main {
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-weight: 500;
          font-size: 0.9rem;
          min-width: 220px;
        }

        .ds-scheduling-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .ds-scheduling-layout {
            grid-template-columns: 1fr;
          }
          .ds-scheduling-workspace-main {
            grid-column: span 1;
          }
          .ds-card[style*="gridColumn: span 2"] {
            grid-column: span 1 !important;
          }
        }

        .ds-card-header-with-filter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 16px;
        }

        /* Reviews Grid inside upper card */
        .ds-reviews-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .ds-review-item-card {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px;
          background-color: var(--color-bg);
          cursor: pointer;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 180px;
        }

        .ds-review-item-card:hover {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-card-hover);
          transform: translateY(-2px);
        }

        .ds-review-item-card.active {
          border-color: var(--color-primary);
          background-color: color-mix(in oklch, var(--color-primary) 1.5%, transparent);
          box-shadow: var(--shadow-card-hover);
        }

        .ds-review-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .ds-type-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
        }

        .ds-type-badge.review {
          background-color: color-mix(in oklch, var(--color-primary) 8%, transparent);
          color: var(--color-primary);
        }

        .ds-type-badge.defence {
          background-color: color-mix(in oklch, var(--color-success) 8%, transparent);
          color: var(--color-success);
        }

        .ds-review-actions-inline {
          display: flex;
          gap: 4px;
        }

        .ds-review-card-body {
          flex-grow: 1;
          margin-bottom: 16px;
        }

        .ds-review-meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--color-muted);
          margin-bottom: 8px;
        }

        .ds-review-note-preview {
          font-size: 0.8rem;
          color: var(--color-muted);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ds-review-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid var(--color-border);
        }

        /* Scheduling Controls */
        .ds-scheduling-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin: 20px 0;
        }

        .ds-force-checkbox-container {
          display: flex;
          align-items: center;
        }

        .ds-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
        }

        .ds-checkbox-label input {
          width: 16px;
          height: 16px;
        }

        .ds-warning-alert {
          background-color: color-mix(in oklch, var(--color-danger) 6%, transparent);
          border: 1px solid color-mix(in oklch, var(--color-danger) 15%, transparent);
          color: var(--color-danger);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Polling job progress */
        .ds-job-status-indicator {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          background-color: var(--color-surface);
        }

        .ds-job-progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }

        .ds-job-progress-header strong {
          text-transform: uppercase;
        }

        .status-completed { color: var(--color-success); }
        .status-failed { color: var(--color-danger); }
        .status-processing { color: var(--color-primary); }
        .status-pending { color: var(--color-muted); }

        .ds-progress-bar-container {
          width: 100%;
          height: 4px;
          background-color: var(--color-border);
          border-radius: var(--radius-sm);
          position: relative;
          overflow: hidden;
          margin-top: 8px;
        }

        .ds-progress-bar-glow {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 50%;
          background-color: var(--color-primary);
          border-radius: var(--radius-sm);
          animation: ds-progress-move 1.5s infinite ease-in-out;
        }

        /* Metrics grid */
        .ds-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .ds-metric-box {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px;
          background-color: var(--color-surface);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .ds-metric-box.warning {
          border-color: color-mix(in oklch, var(--color-danger) 20%, var(--color-border));
        }

        .ds-metric-box.warning .ds-metric-val {
          color: var(--color-danger);
        }

        .ds-metric-box.info {
          border-color: color-mix(in oklch, var(--color-primary) 20%, var(--color-border));
        }

        .ds-metric-box.info .ds-metric-val {
          color: var(--color-primary);
        }

        .ds-metric-val {
          font-size: 2rem;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          color: var(--color-success);
        }

        .ds-metric-label {
          font-size: 0.8rem;
          color: var(--color-muted);
          margin-top: 4px;
          font-weight: 500;
        }

        /* Search input */
        .ds-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .ds-search-icon {
          position: absolute;
          left: 12px;
          color: var(--color-muted);
        }

        .ds-input-search {
          padding: 8px 12px 8px 36px;
          font-size: 0.85rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
          width: 240px;
          background-color: var(--color-bg);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .ds-input-search:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
        }

        /* Reports tables */
        .ds-warning-section {
          background-color: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px;
        }

        .ds-warning-list-scroll {
          max-height: 180px;
          overflow-y: auto;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
        }

        .ds-report-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.8rem;
        }

        .ds-report-table th {
          background-color: var(--color-surface);
          color: var(--color-ink);
          font-weight: 700;
          padding: 6px 12px;
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
        }

        .ds-report-table td {
          padding: 8px 12px;
          border-bottom: 1px solid var(--color-border);
        }

        .ds-action-buttons {
          display: flex;
          gap: 6px;
        }

        .ds-action-btn {
          border: none;
          background: var(--color-surface);
          color: var(--color-muted);
          width: 26px;
          height: 26px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .ds-action-btn:hover {
          background-color: var(--color-border);
          color: var(--color-ink);
        }

        .ds-action-btn.delete:hover {
          background-color: color-mix(in oklch, var(--color-danger) 8%, transparent);
          color: var(--color-danger);
        }

        .ds-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }

        .ds-btn-icon-only {
          padding: 0;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
        }

        .ds-page-info {
          font-size: 0.85rem;
          font-weight: 700;
        }

        .ds-guideline-steps {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ds-guide-step {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .ds-step-num {
          background-color: color-mix(in oklch, var(--color-primary) 8%, transparent);
          color: var(--color-primary);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ds-guide-step h4 {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .ds-guide-step p {
          font-size: 0.8rem;
          color: var(--color-muted);
          line-height: 1.4;
        }

        .ds-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* Modal styling */
        .ds-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(18, 18, 18, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: ds-fade-in 0.2s ease-out;
        }

        .ds-modal-container {
          background-color: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          width: 100%;
          box-shadow: var(--shadow-card-hover);
          animation: ds-modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
        }

        .ds-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-border);
        }

        .ds-modal-close {
          border: none;
          background: none;
          color: var(--color-muted);
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .ds-modal-close:hover {
          background-color: var(--color-surface);
          color: var(--color-ink);
        }

        .ds-modal-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ds-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }

        .spin {
          animation: ds-spin 1s linear infinite;
        }

        @keyframes ds-progress-move {
          0% { left: -50%; }
          100% { left: 100%; }
        }

        @keyframes ds-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ds-modal-in {
          from {
            transform: translateY(24px) scale(0.98);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes ds-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};

export default AdminScheduling;
