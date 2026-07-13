import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import type { Semester, SemesterStatus } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Wand2, 
  Play, 
  Link, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Clock
} from 'lucide-react';

export const AdminSemesters: React.FC = () => {
  const { showToast } = useToast();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Actions Loading State
  const [linkingGroups, setLinkingGroups] = useState(false);
  const [runningLifecycle, setRunningLifecycle] = useState(false);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  
  // Modal States
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [modalSeason, setModalSeason] = useState<'Spring' | 'Summer' | 'Fall'>('Spring');
  const [modalYear, setModalYear] = useState<number>(new Date().getFullYear());
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');
  const [modalStatus, setModalStatus] = useState<SemesterStatus>('Pending');
  const [savingSemester, setSavingSemester] = useState(false);

  // Auto Generate Form States
  const [genCount, setGenCount] = useState<number>(3);
  const [genWeeks, setGenWeeks] = useState<number>(16);
  const [genStartDate, setGenStartDate] = useState<string>('');
  const [genSeason, setGenSeason] = useState<string>('');
  const [genYear, setGenYear] = useState<string>('');

  // Fetch Semesters List
  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
        status: statusFilter || undefined
      };
      const res = await api.get('/api/admin/semesters', { params });
      // The API returns a flat list/array of semesters
      setSemesters(res.data);
    } catch (err: any) {
      showToast('Không thể tải danh sách học kỳ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, [page, statusFilter]);

  // Handle Delete Semester
  const handleDelete = async (id: number, code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa học kỳ ${code}? Chỉ có thể xóa học kỳ khi chưa có dữ liệu nhóm liên quan.`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/semesters/${id}`);
      showToast(`Đã xóa thành công học kỳ ${code}`, 'success');
      fetchSemesters();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể xóa học kỳ. Hãy kiểm tra các liên kết dữ liệu.';
      showToast(msg, 'error');
    }
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingSemester(null);
    setModalSeason('Spring');
    setModalYear(new Date().getFullYear());
    setModalStartDate('');
    setModalEndDate('');
    setModalStatus('Pending');
    setShowAddEditModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (sem: Semester) => {
    setEditingSemester(sem);
    setModalSeason(sem.season);
    setModalYear(sem.year);
    // Format dates to YYYY-MM-DD for input type="date"
    setModalStartDate(sem.startDate.substring(0, 10));
    setModalEndDate(sem.endDate.substring(0, 10));
    setModalStatus(sem.status);
    setShowAddEditModal(true);
  };

  // Handle Create or Update Submission
  const handleSaveSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalStartDate || !modalEndDate) {
      showToast('Vui lòng chọn ngày bắt đầu và ngày kết thúc', 'warning');
      return;
    }

    if (new Date(modalStartDate) >= new Date(modalEndDate)) {
      showToast('Ngày kết thúc phải diễn ra sau ngày bắt đầu', 'warning');
      return;
    }

    setSavingSemester(true);
    try {
      if (editingSemester) {
        // Update Semester
        await api.put(`/api/admin/semesters/${editingSemester.id}`, {
          startDate: modalStartDate,
          endDate: modalEndDate,
          status: modalStatus
        });
        showToast(`Đã cập nhật học kỳ ${editingSemester.code} thành công`, 'success');
      } else {
        // Create Semester
        await api.post('/api/admin/semesters', {
          season: modalSeason,
          year: modalYear,
          startDate: modalStartDate,
          endDate: modalEndDate
        });
        showToast('Đã tạo học kỳ mới thành công', 'success');
      }
      setShowAddEditModal(false);
      fetchSemesters();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Thao tác không thành công. Vui lòng kiểm tra lại.';
      showToast(msg, 'error');
    } finally {
      setSavingSemester(false);
    }
  };

  const handleLinkGroups = async () => {
    setLinkingGroups(true);
    try {
      const res = await api.post('/api/admin/semesters/link-groups');
      const count = res.data?.linked ?? 0;
      showToast(`Đã liên kết thành công ${count} nhóm vào học kỳ tương ứng`, 'success');
    } catch (err: any) {
      showToast('Liên kết nhóm tự động thất bại', 'error');
    } finally {
      setLinkingGroups(false);
    }
  };

  // Run Semester Lifecycle job manually
  const handleRunLifecycle = async () => {
    setRunningLifecycle(true);
    try {
      await api.post('/api/admin/semesters/run-lifecycle');
      showToast('Chạy tác vụ cập nhật vòng đời học kỳ thành công', 'success');
      fetchSemesters();
    } catch (err: any) {
      showToast('Chạy tác vụ vòng đời thất bại', 'error');
    } finally {
      setRunningLifecycle(false);
    }
  };

  // Generate Future Semester Schedule
  const handleGenerateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingSchedule(true);
    try {
      const body: any = {
        count: genCount,
        baseDurationWeeks: genWeeks,
        allowMultiYear: true
      };
      if (genStartDate) body.startDate = genStartDate;
      if (genSeason) body.startSeason = genSeason;
      if (genYear) body.startYear = parseInt(genYear, 10);

      await api.post('/api/admin/semesters/generate-schedule', body);
      showToast('Đã tự động tạo các học kỳ và seed ngày nghỉ thành công!', 'success');
      
      // Reset form options
      setGenStartDate('');
      setGenSeason('');
      setGenYear('');
      
      fetchSemesters();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Sinh lịch biểu tự động thất bại';
      showToast(msg, 'error');
    } finally {
      setGeneratingSchedule(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Render Status Badge
  const renderStatus = (status: SemesterStatus) => {
    switch (status) {
      case 'Ongoing':
        return <span className="ds-status-pill ongoing">Đang chạy</span>;
      case 'Completed':
        return <span className="ds-status-pill finished">Đã xong</span>;
      case 'Cancelled':
        return <span className="ds-status-pill danger">Đã hủy</span>;
      case 'Pending':
        return <span className="ds-status-pill pending">Đang chờ</span>;
      default:
        return <span className="ds-status-pill finished">{status}</span>;
    }
  };

  return (
    <div className="ds-semesters-page">
      {/* Title Header */}
      <div className="ds-semesters-header">
        <div>
          <h1>Quản lý Học kỳ</h1>
          <p className="text-muted">Cấu hình vòng đời các học kỳ và thiết lập tự động hóa phân chia ngày nghỉ</p>
        </div>
        <button className="ds-btn ds-btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Tạo học kỳ mới</span>
        </button>
      </div>

      {/* Main Grid split */}
      <div className="ds-semesters-layout">
        
        {/* Left Side: Table List */}
        <div className="ds-semesters-main">
          <div className="ds-card">
            <div className="ds-card-header-with-filter">
              <h2>Danh sách học kỳ</h2>
              <div className="ds-filter-group">
                <select 
                  value={statusFilter} 
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="ds-select-small"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="Ongoing">Đang chạy (Ongoing)</option>
                  <option value="Pending">Đang chờ (Pending)</option>
                  <option value="Completed">Đã hoàn tất (Completed)</option>
                  <option value="Cancelled">Đã hủy (Cancelled)</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="ds-loading-placeholder">
                <div className="ds-skeleton" style={{ height: '40px', marginBottom: '12px' }}></div>
                <div className="ds-skeleton" style={{ height: '40px', marginBottom: '12px' }}></div>
                <div className="ds-skeleton" style={{ height: '40px', marginBottom: '12px' }}></div>
                <div className="ds-skeleton" style={{ height: '40px', marginBottom: '12px' }}></div>
              </div>
            ) : semesters.length === 0 ? (
              <div className="ds-empty-state">
                <AlertCircle size={48} className="text-muted" style={{ marginBottom: '16px' }} />
                <h3>Không tìm thấy học kỳ nào</h3>
                <p className="text-muted">Vui lòng tạo mới học kỳ hoặc sử dụng tính năng sinh tự động ở bảng bên phải.</p>
              </div>
            ) : (
              <>
                <div className="ds-table-container">
                  <table className="ds-table">
                    <thead>
                      <tr>
                        <th>Mã kỳ</th>
                        <th>Mùa</th>
                        <th>Năm</th>
                        <th>Ngày bắt đầu</th>
                        <th>Ngày kết thúc</th>
                        <th style={{ textAlign: 'center' }}>Nhóm</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semesters.map((sem) => (
                        <tr key={sem.id} className="ds-semester-row">
                          <td style={{ fontWeight: 700 }} className="tnum">{sem.code}</td>
                          <td>
                            {sem.season === 'Spring' ? 'Mùa Xuân' : sem.season === 'Summer' ? 'Mùa Hè' : 'Mùa Thu'}
                          </td>
                          <td className="tnum">{sem.year}</td>
                          <td className="tnum">{formatDate(sem.startDate)}</td>
                          <td className="tnum">{formatDate(sem.endDate)}</td>
                          <td style={{ textAlign: 'center' }} className="tnum">
                            {(sem as any).groupCount ?? 0}
                          </td>
                          <td>{renderStatus(sem.status)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="ds-action-buttons">
                              <button 
                                className="ds-action-btn edit" 
                                onClick={() => handleOpenEdit(sem)}
                                title="Chỉnh sửa ngày và trạng thái"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                className="ds-action-btn delete" 
                                onClick={() => handleDelete(sem.id, sem.code)}
                                title="Xóa học kỳ"
                                disabled={(sem as any).groupCount > 0}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div className="ds-pagination">
                  <button 
                    className="ds-btn ds-btn-secondary ds-btn-icon-only" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="ds-page-info tnum">Trang {page}</span>
                  <button 
                    className="ds-btn ds-btn-secondary ds-btn-icon-only" 
                    onClick={() => setPage(p => p + 1)}
                    disabled={semesters.length < pageSize}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Tools & Automation */}
        <div className="ds-semesters-sidebar">
          
          {/* Quick Admin Actions */}
          <div className="ds-card ds-tool-card" style={{ marginBottom: '24px' }}>
            <h2>Tác vụ hệ thống</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
              Quản lý đồng bộ dữ liệu đồ án tốt nghiệp
            </p>

            <div className="ds-action-stack">
              <button 
                className="ds-btn ds-btn-secondary ds-w-full" 
                onClick={handleLinkGroups}
                disabled={linkingGroups}
              >
                {linkingGroups ? <Clock size={16} className="spin" /> : <Link size={16} />}
                <span>Liên kết Nhóm tự động</span>
              </button>
              <p className="ds-action-desc">
                Liên kết các nhóm đồ án mồ côi vào đúng học kỳ dựa trên tiền tố mã nhóm.
              </p>

              <button 
                className="ds-btn ds-btn-secondary ds-w-full" 
                onClick={handleRunLifecycle}
                disabled={runningLifecycle}
              >
                {runningLifecycle ? <Clock size={16} className="spin" /> : <Play size={16} />}
                <span>Kích hoạt vòng đời (Lifecycle)</span>
              </button>
              <p className="ds-action-desc">
                Chạy kiểm tra thủ công để tự chuyển tiếp trạng thái học kỳ dựa theo mốc thời gian thực tế.
              </p>
            </div>
          </div>

          {/* Batch Generation Form */}
          <div className="ds-card ds-tool-card">
            <h2>Tự động sinh Học kỳ</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
              Sinh hàng loạt học kỳ kế tiếp kèm cấu hình ngày nghỉ lễ mặc định của trường.
            </p>

            <form onSubmit={handleGenerateSchedule} className="ds-gen-form">
              <div className="ds-form-group">
                <label className="ds-form-label">Số học kỳ muốn sinh</label>
                <select 
                  value={genCount} 
                  onChange={(e) => setGenCount(parseInt(e.target.value, 10))}
                >
                  <option value="1">1 học kỳ</option>
                  <option value="2">2 học kỳ</option>
                  <option value="3">3 học kỳ</option>
                  <option value="4">4 học kỳ</option>
                  <option value="5">5 học kỳ</option>
                </select>
              </div>

              <div className="ds-form-group">
                <label className="ds-form-label">Số tuần học cơ bản</label>
                <input 
                  type="number" 
                  min={10} 
                  max={24} 
                  value={genWeeks} 
                  onChange={(e) => setGenWeeks(parseInt(e.target.value, 10))}
                  required
                />
              </div>

              <div className="ds-divider-text">Cấu hình tùy chọn bắt đầu</div>

              <div className="ds-form-group">
                <label className="ds-form-label">Ngày bắt đầu kỳ đầu tiên</label>
                <input 
                  type="date" 
                  value={genStartDate}
                  onChange={(e) => setGenStartDate(e.target.value)}
                />
              </div>

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label className="ds-form-label">Mùa học</label>
                  <select 
                    value={genSeason} 
                    onChange={(e) => setGenSeason(e.target.value)}
                  >
                    <option value="">Mặc định</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                  </select>
                </div>

                <div className="ds-form-group">
                  <label className="ds-form-label">Năm học</label>
                  <input 
                    type="number" 
                    placeholder="VD: 2026"
                    value={genYear}
                    onChange={(e) => setGenYear(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="ds-btn ds-btn-primary ds-w-full"
                disabled={generatingSchedule}
                style={{ marginTop: '8px' }}
              >
                {generatingSchedule ? <Clock size={16} className="spin" /> : <Wand2 size={16} />}
                <span>Bắt đầu tạo lịch biểu</span>
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Add / Edit Modal Overlay */}
      {showAddEditModal && (
        <div className="ds-modal-backdrop">
          <div className="ds-modal-container">
            <div className="ds-modal-header">
              <h2>{editingSemester ? `Chỉnh sửa: ${editingSemester.code}` : 'Tạo Học kỳ Mới'}</h2>
              <button className="ds-modal-close" onClick={() => setShowAddEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSemester} className="ds-modal-form">
              {!editingSemester ? (
                <>
                  <div className="ds-form-row">
                    <div className="ds-form-group">
                      <label className="ds-form-label">Mùa học tốt nghiệp</label>
                      <select 
                        value={modalSeason} 
                        onChange={(e) => setModalSeason(e.target.value as any)}
                        required
                      >
                        <option value="Spring">Spring (Kỳ mùa Xuân)</option>
                        <option value="Summer">Summer (Kỳ mùa Hè)</option>
                        <option value="Fall">Fall (Kỳ mùa Thu)</option>
                      </select>
                    </div>

                    <div className="ds-form-group">
                      <label className="ds-form-label">Năm học</label>
                      <input 
                        type="number" 
                        value={modalYear}
                        onChange={(e) => setModalYear(parseInt(e.target.value, 10))}
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="ds-form-group">
                  <label className="ds-form-label">Trạng thái học kỳ</label>
                  <select 
                    value={modalStatus} 
                    onChange={(e) => setModalStatus(e.target.value as any)}
                    required
                  >
                    <option value="Pending">Pending (Đang chờ diễn ra)</option>
                    <option value="Ongoing">Ongoing (Đang chạy)</option>
                    <option value="Completed">Completed (Đã kết thúc)</option>
                    <option value="Cancelled">Cancelled (Đã hủy bỏ)</option>
                  </select>
                </div>
              )}

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label className="ds-form-label">Ngày bắt đầu kỳ học</label>
                  <input 
                    type="date" 
                    value={modalStartDate}
                    onChange={(e) => setModalStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="ds-form-group">
                  <label className="ds-form-label">Ngày kết thúc kỳ học</label>
                  <input 
                    type="date" 
                    value={modalEndDate}
                    onChange={(e) => setModalEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="ds-modal-footer">
                <button 
                  type="button" 
                  className="ds-btn ds-btn-secondary" 
                  onClick={() => setShowAddEditModal(false)}
                  disabled={savingSemester}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="ds-btn ds-btn-primary"
                  disabled={savingSemester}
                >
                  {savingSemester ? 'Đang lưu...' : 'Lưu học kỳ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Component Styles */}
      <style>{`
        .ds-semesters-page {
          width: 100%;
          animation: ds-page-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-semesters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .ds-semesters-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .ds-semesters-layout {
            grid-template-columns: 1fr;
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

        .ds-select-small {
          padding: 8px 12px;
          font-size: 0.85rem;
          border-radius: var(--radius-sm);
        }

        .ds-loading-placeholder {
          padding: 20px 0;
        }

        .ds-empty-state {
          padding: 48px 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .ds-empty-state h3 {
          margin-bottom: 8px;
          font-size: 1.2rem;
        }

        .ds-action-buttons {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .ds-action-btn {
          border: none;
          background: var(--color-surface);
          color: var(--color-muted);
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
        }

        .ds-action-btn:hover {
          background-color: var(--color-border);
          color: var(--color-ink);
          transform: translateY(-1px);
        }

        .ds-action-btn.delete:hover:not(:disabled) {
          background-color: color-mix(in oklch, var(--color-danger) 8%, transparent);
          color: var(--color-danger);
        }

        .ds-action-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          transform: none;
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
          font-size: 0.9rem;
          font-weight: 700;
        }

        .ds-action-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ds-w-full {
          width: 100%;
        }

        .ds-action-desc {
          font-size: 0.8rem;
          color: var(--color-muted);
          margin-bottom: 16px;
          line-height: 1.4;
        }

        .ds-action-desc:last-child {
          margin-bottom: 0;
        }

        .ds-gen-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ds-divider-text {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 4px;
          margin-top: 8px;
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
          max-width: 500px;
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

export default AdminSemesters;
