import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Semester, Review } from '../types';
import { 
  Calendar, 
  Clock, 
  Save, 
  Info,
  CheckCircle,
  AlertTriangle,
  Lock,
  RotateCcw,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';

interface ReviewSlotDto {
  id: number;
  reviewId: number;
  slotDate: string;
  slotIndex: number;
  roomCount: number;
  plannedCapacity: number;
  groupPreferenceCount: number;
  lecturerPreferenceCount: number;
  assignmentCount: number;
  isCurrentUserRegistered: boolean;
  isCurrentUserAssigned: boolean;
  note: string | null;
}

const SHIFT_TIMES = [
  { index: 1, label: 'Ca 1', time: '08:00 - 09:30' },
  { index: 2, label: 'Ca 2', time: '09:45 - 11:15' },
  { index: 3, label: 'Ca 3', time: '13:30 - 15:00' },
  { index: 4, label: 'Ca 4', time: '15:15 - 16:45' },
  { index: 5, label: 'Ca 5', time: '17:00 - 18:30' }
];

export const ReviewSlots: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Selections
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | ''>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  // Data list
  const [slots, setSlots] = useState<ReviewSlotDto[]>([]);
  
  // Local changes state
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<number>>(new Set());
  const [originalRegisteredIds, setOriginalRegisteredIds] = useState<Set<number>>(new Set());
  
  // Loading & Action states
  const [loadingSemesters, setLoadingSemesters] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSemesters();
  }, []);

  // Fetch all semesters
  const fetchSemesters = async () => {
    setLoadingSemesters(true);
    try {
      const res = await api.get('/api/admin/semesters', { params: { pageSize: 100 } });
      setSemesters(res.data);
      
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

  // Fetch reviews for a specific semester
  const fetchReviews = async (semesterId: number) => {
    setLoadingReviews(true);
    setSelectedReview(null);
    setSlots([]);
    setSelectedSlotIds(new Set());
    setOriginalRegisteredIds(new Set());
    try {
      const res = await api.get('/api/admin/reviews', { params: { semesterId } });
      setReviews(res.data);
      if (res.data.length > 0) {
        setSelectedReview(res.data[0]);
        fetchSlots(res.data[0].id);
      }
    } catch (err) {
      showToast('Không thể tải danh sách đợt đánh giá', 'error');
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch slots for a selected review round
  const fetchSlots = async (reviewId: number) => {
    setLoadingSlots(true);
    setSelectedSlotIds(new Set());
    setOriginalRegisteredIds(new Set());
    try {
      const res = await api.get(`/api/admin/reviews/${reviewId}/slots`);
      const slotList: ReviewSlotDto[] = res.data;
      setSlots(slotList);
      
      // Collect all slots where isCurrentUserRegistered is true
      const registered = new Set<number>();
      slotList.forEach(s => {
        if (s.isCurrentUserRegistered) registered.add(s.id);
      });
      setSelectedSlotIds(new Set(registered));
      setOriginalRegisteredIds(registered);
    } catch (err) {
      showToast('Không thể tải danh sách ca chấm của đợt', 'error');
    } finally {
      setLoadingSlots(false);
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
  const handleReviewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id) {
      const numId = parseInt(id, 10);
      const rev = reviews.find(r => r.id === numId);
      if (rev) {
        setSelectedReview(rev);
        fetchSlots(numId);
      }
    }
  };

  // Toggle Slot Registration state locally
  const handleToggleSlot = (slot: ReviewSlotDto) => {
    // If the slot is officially assigned (locked), we do not allow edits
    if (slot.isCurrentUserAssigned) {
      showToast('Ca học này đã được gán hội đồng chính thức, không thể thay đổi nguyện vọng.', 'warning');
      return;
    }

    // If review status is not registering, registrations are closed
    if (selectedReview?.status !== 'Registering') {
      showToast('Thời gian đăng ký nguyện vọng cho đợt này đã đóng hoặc chưa mở.', 'warning');
      return;
    }

    // Block non-registering roles
    if (user?.role === 'GroupMember') {
      showToast('Chỉ có Trưởng nhóm (StudentLeader) mới được quyền đăng ký ca chấm cho nhóm đồ án.', 'warning');
      return;
    }
    if (user?.role === 'Admin') {
      showToast('Tài khoản Quản trị viên (Admin) chỉ xem được dữ liệu đăng ký rảnh của đợt chấm.', 'info');
      return;
    }

    setSelectedSlotIds(prev => {
      const next = new Set(prev);
      if (next.has(slot.id)) {
        next.delete(slot.id);
      } else {
        next.add(slot.id);
      }
      return next;
    });
  };

  // Check if there are unsaved changes
  const hasChanges = () => {
    if (selectedSlotIds.size !== originalRegisteredIds.size) return true;
    for (let id of selectedSlotIds) {
      if (!originalRegisteredIds.has(id)) return true;
    }
    return false;
  };

  // Calculate changes counts
  const getChangesSummary = () => {
    const registerCount = Array.from(selectedSlotIds).filter(id => !originalRegisteredIds.has(id)).length;
    const unregisterCount = Array.from(originalRegisteredIds).filter(id => !selectedSlotIds.has(id)).length;
    return { registerCount, unregisterCount };
  };

  // Reset local changes back to DB state
  const handleCancelChanges = () => {
    setSelectedSlotIds(new Set(originalRegisteredIds));
    showToast('Đã hủy bỏ toàn bộ các thay đổi chưa lưu', 'info');
  };

  // Save changes to backend via bulk transaction APIs
  const handleSaveChanges = async () => {
    if (!selectedReview) return;
    setSaving(true);

    const registerList = Array.from(selectedSlotIds).filter(id => !originalRegisteredIds.has(id));
    const unregisterList = Array.from(originalRegisteredIds).filter(id => !selectedSlotIds.has(id));

    try {
      if (user?.role === 'Lecturer' || user?.role === 'Reviewer') {
        // Lecturer Bulk
        await api.post(`/api/admin/reviews/${selectedReview.id}/slots/lecturers/bulk`, {
          register: registerList,
          unregister: unregisterList
        });
        showToast('Đã lưu lịch rảnh giảng viên thành công!', 'success');
      } else if (user?.role === 'StudentLeader') {
        // Student Leader Bulk
        await api.post(`/api/admin/reviews/${selectedReview.id}/slots/groups/bulk`, {
          register: registerList,
          unregister: unregisterList
        });
        showToast('Đã lưu lịch đăng ký nguyện vọng nhóm thành công!', 'success');
      } else {
        showToast('Tài khoản của bạn không hỗ trợ lưu đăng ký nguyện vọng.', 'warning');
      }
      fetchSlots(selectedReview.id);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể lưu nguyện vọng đăng ký', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Format date helper
  const formatDateDayMonth = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const daysViet = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${daysViet[d.getDay()]} ${day}/${month}`;
  };

  // Get list of distinct dates in chronological order
  const getDistinctDates = () => {
    const dates = slots.map(s => s.slotDate.substring(0, 10));
    return Array.from(new Set(dates)).sort();
  };

  const dateList = getDistinctDates();
  const isRegistrationOpen = selectedReview?.status === 'Registering';
  const { registerCount, unregisterCount } = getChangesSummary();

  return (
    <div className="ds-slots-page">
      
      {/* Top Filter Bar Header */}
      <div className="ds-slots-header">
        <div>
          <h1>Đăng ký Nguyện vọng Ca chấm</h1>
          <p className="text-muted">Đăng ký lịch rảnh (Hội đồng) hoặc gửi đề xuất ca mong muốn bảo vệ (Nhóm đồ án)</p>
        </div>

        <div className="ds-filter-selectors">
          <div className="ds-filter-selectors-row">
            <div className="ds-filter-select-group">
              <label className="ds-form-label">Học kỳ</label>
              <select 
                value={selectedSemesterId} 
                onChange={handleSemesterChange}
                className="ds-select-small"
                disabled={loadingSemesters}
              >
                <option value="">-- Học kỳ --</option>
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>{s.code}</option>
                ))}
              </select>
            </div>

            <div className="ds-filter-select-group">
              <label className="ds-form-label">Đợt đánh giá</label>
              <select 
                value={selectedReview?.id || ''} 
                onChange={handleReviewChange}
                className="ds-select-small"
                disabled={loadingReviews || reviews.length === 0}
              >
                {reviews.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container Card */}
      {selectedReview ? (
        <div className="ds-card">
          
          {/* Status and Action Banners */}
          <div className="ds-slots-banner-container">
            {isRegistrationOpen ? (
              <div className="ds-alert-banner success">
                <CheckCircle size={18} />
                <div>
                  <h4>Hệ thống đang mở đăng ký nguyện vọng</h4>
                  <p>
                    Vui lòng bấm chọn các ca rảnh/mong muốn dưới lịch biểu (ô màu xanh lá khi chọn) rồi bấm <strong>Lưu đăng ký</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="ds-alert-banner warning">
                <AlertTriangle size={18} />
                <div>
                  <h4>Thời gian đăng ký nguyện vọng đã đóng</h4>
                  <p>
                    Đợt chấm đang ở trạng thái <strong>{selectedReview.status}</strong>. Hiện tại chỉ có chế độ xem thông tin ca học và lịch gán chính thức.
                  </p>
                </div>
              </div>
            )}
            
            {user?.role === 'GroupMember' && (
              <div className="ds-alert-banner info" style={{ marginTop: '12px' }}>
                <Info size={18} />
                <div>
                  <h4>Tài khoản Thành viên nhóm đồ án (Xem-only)</h4>
                  <p>Chỉ có tài khoản Trưởng nhóm (StudentLeader) mới có quyền bấm sửa và lưu đăng ký lịch chấm.</p>
                </div>
              </div>
            )}
            
            {user?.role === 'Admin' && (
              <div className="ds-alert-banner info" style={{ marginTop: '12px' }}>
                <Info size={18} />
                <div>
                  <h4>Tài khoản Quản trị viên (Admin - Xem-only)</h4>
                  <p>Trang này hiển thị biểu đồ rảnh của đợt. Thao tác đăng ký dành riêng cho Giảng viên phản biện và các Nhóm đồ án.</p>
                </div>
              </div>
            )}
          </div>

          {/* Timetable Grid Schedule */}
          {loadingSlots ? (
            <div className="ds-loading-placeholder" style={{ padding: '60px 0' }}>
              <Clock className="spin text-primary" size={32} style={{ marginBottom: '12px' }} />
              <p>Đang tải sơ đồ ca chấm...</p>
            </div>
          ) : dateList.length === 0 ? (
            <div className="ds-empty-state" style={{ padding: '60px 0' }}>
              <AlertCircle size={48} className="text-muted" style={{ marginBottom: '16px' }} />
              <h3>Chưa thiết lập ca thi nào</h3>
              <p className="text-muted">Đợt đánh giá chưa được khởi tạo các ca chấm (slots). Admin cần mở đợt chấm trước.</p>
            </div>
          ) : (
            <div className="ds-timetable-scroller">
              <table className="ds-timetable-grid">
                <thead>
                  <tr>
                    <th className="ds-time-column-header">Ca thi</th>
                    {dateList.map((d, index) => (
                      <th key={index} className="ds-date-column-header">
                        {formatDateDayMonth(d)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SHIFT_TIMES.map(shift => (
                    <tr key={shift.index}>
                      {/* Left vertical header (Shift Time details) */}
                      <td className="ds-time-cell-header">
                        <strong className="tnum">{shift.label}</strong>
                        <span className="tnum">{shift.time}</span>
                      </td>
                      
                      {/* Main schedule date columns cells */}
                      {dateList.map((date, colIdx) => {
                        const slot = slots.find(s => s.slotDate.startsWith(date) && s.slotIndex === shift.index);
                        if (!slot) {
                          return <td key={colIdx} className="ds-slot-cellempty">—</td>;
                        }

                        const isLocallySelected = selectedSlotIds.has(slot.id);
                        const isAssigned = slot.isCurrentUserAssigned;
                        
                        let cellClass = '';
                        if (isAssigned) {
                          cellClass = 'assigned-locked';
                        } else if (isLocallySelected) {
                          cellClass = 'selected-active';
                        } else {
                          cellClass = 'available-cell';
                        }

                        return (
                          <td 
                            key={colIdx} 
                            onClick={() => handleToggleSlot(slot)}
                            className={`ds-slot-cell ${cellClass}`}
                          >
                            <div className="ds-slot-cell-card">
                              
                              {/* Checkbox state top icon */}
                              <div className="ds-slot-check-icon">
                                {isAssigned ? (
                                  <Lock size={16} className="text-warning" />
                                ) : isLocallySelected ? (
                                  <CheckSquare size={16} className="text-primary" />
                                ) : (
                                  <Square size={16} className="text-muted-checkbox" />
                                )}
                              </div>

                              {/* Capacity details & notes */}
                              <div className="ds-slot-details">
                                {user?.role === 'Lecturer' || user?.role === 'Reviewer' ? (
                                  <p className="tnum">Số nhóm đề xuất: <strong>{slot.groupPreferenceCount}</strong></p>
                                ) : (
                                  <p className="tnum">Số GV rảnh: <strong>{slot.lecturerPreferenceCount}</strong></p>
                                )}
                                <p className="tnum" style={{ marginTop: '2px' }}>
                                  Hội đồng đã xếp: <strong>{slot.assignmentCount}</strong>/{slot.roomCount} phòng
                                </p>
                              </div>

                              {/* Slot Bottom Badges */}
                              {isAssigned && (
                                <span className="ds-assigned-badge">Lịch chính thức</span>
                              )}
                              
                              {slot.note && (
                                <span className="ds-slot-note-hint" title={slot.note}>
                                  Ghi chú: {slot.note}
                                </span>
                              )}

                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      ) : (
        <div className="ds-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Calendar size={48} className="text-muted" style={{ marginBottom: '16px' }} />
          <h3>Chưa chọn đợt đánh giá</h3>
          <p className="text-muted">Vui lòng chọn học kỳ và đợt đánh giá ở bộ lọc phía trên để bắt đầu thao tác.</p>
        </div>
      )}

      {/* Floating Save changes action bar */}
      {hasChanges() && (
        <div className="ds-floating-bar-wrapper">
          <div className="ds-floating-bar-container">
            <div className="ds-floating-bar-info">
              <Clock size={20} className="text-primary" />
              <div>
                <p><strong>Bạn có thay đổi chưa lưu!</strong></p>
                <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {registerCount > 0 && `Đăng ký thêm: ${registerCount} ca. `}
                  {unregisterCount > 0 && `Hủy đăng ký: ${unregisterCount} ca.`}
                </p>
              </div>
            </div>
            
            <div className="ds-floating-bar-btns">
              <button 
                className="ds-btn ds-btn-secondary" 
                onClick={handleCancelChanges}
                disabled={saving}
              >
                <RotateCcw size={16} />
                <span>Hủy bỏ</span>
              </button>
              
              <button 
                className="ds-btn ds-btn-primary" 
                onClick={handleSaveChanges}
                disabled={saving}
              >
                <Save size={16} />
                <span>{saving ? 'Đang lưu...' : 'Lưu nguyện vọng'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded page styles */}
      <style>{`
        .ds-slots-page {
          width: 100%;
          animation: ds-page-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          padding-bottom: 80px; /* Space for floating bar */
        }

        .ds-slots-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .ds-filter-selectors-row {
          display: flex;
          gap: 16px;
        }

        .ds-filter-select-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ds-select-small {
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-weight: 500;
          font-size: 0.85rem;
          min-width: 180px;
        }

        .ds-slots-banner-container {
          margin-bottom: 24px;
        }

        .ds-alert-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 20px;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .ds-alert-banner h4 {
          font-weight: 700;
          margin-bottom: 2px;
        }

        .ds-alert-banner.success {
          background-color: color-mix(in oklch, var(--color-success) 6%, transparent);
          border: 1px solid color-mix(in oklch, var(--color-success) 15%, transparent);
          color: var(--color-success);
        }

        .ds-alert-banner.warning {
          background-color: color-mix(in oklch, var(--color-danger) 6%, transparent);
          border: 1px solid color-mix(in oklch, var(--color-danger) 15%, transparent);
          color: var(--color-danger);
        }

        .ds-alert-banner.info {
          background-color: color-mix(in oklch, var(--color-primary) 6%, transparent);
          border: 1px solid color-mix(in oklch, var(--color-primary) 15%, transparent);
          color: var(--color-primary);
        }

        .ds-loading-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--color-muted);
        }

        .ds-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .ds-empty-state h3 {
          font-size: 1.2rem;
          margin-bottom: 6px;
        }

        /* Timetable grid schedule layout */
        .ds-timetable-scroller {
          width: 100%;
          overflow-x: auto;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          background-color: var(--color-surface);
        }

        .ds-timetable-grid {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          min-width: 900px;
        }

        .ds-timetable-grid th, 
        .ds-timetable-grid td {
          border: 1px solid var(--color-border);
          padding: 0;
          vertical-align: top;
        }

        .ds-time-column-header {
          width: 130px;
          background-color: var(--color-bg);
          padding: 16px 12px;
          text-align: center;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .ds-date-column-header {
          background-color: var(--color-bg);
          padding: 16px 12px;
          text-align: center;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--color-ink);
        }

        .ds-time-cell-header {
          background-color: var(--color-bg);
          padding: 16px 12px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 110px;
          box-sizing: border-box;
        }

        .ds-time-cell-header strong {
          font-size: 1rem;
          color: var(--color-ink);
        }

        .ds-time-cell-header span {
          font-size: 0.75rem;
          color: var(--color-muted);
          margin-top: 4px;
        }

        .ds-slot-cellempty {
          background-color: var(--color-surface);
          color: var(--color-border);
          text-align: center;
          vertical-align: middle;
          font-size: 1.2rem;
          height: 110px;
        }

        /* Slot card style */
        .ds-slot-cell {
          height: 110px;
          cursor: pointer;
          transition: background-color var(--transition-fast), border-color var(--transition-fast);
          padding: 8px;
          box-sizing: border-box;
          background-color: var(--color-bg);
        }

        .ds-slot-cell.available-cell:hover {
          background-color: var(--color-surface);
        }

        /* Selected registered active cell */
        .ds-slot-cell.selected-active {
          background-color: color-mix(in oklch, var(--color-success) 5%, transparent);
          border: 2px solid var(--color-success);
        }

        .ds-slot-cell.selected-active:hover {
          background-color: color-mix(in oklch, var(--color-success) 9%, transparent);
        }

        /* Assigned official locked cell */
        .ds-slot-cell.assigned-locked {
          background-color: color-mix(in oklch, var(--color-primary) 5%, transparent);
          border: 2px solid var(--color-primary);
          cursor: not-allowed;
        }

        .ds-slot-cell-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          position: relative;
        }

        .ds-slot-check-icon {
          display: flex;
          justify-content: flex-end;
          color: var(--color-muted);
        }

        .text-muted-checkbox {
          color: var(--color-border);
        }

        .ds-slot-details {
          margin-top: 2px;
        }

        .ds-slot-details p {
          font-size: 0.75rem;
          color: var(--color-muted);
          line-height: 1.3;
        }

        .ds-slot-details strong {
          color: var(--color-ink);
        }

        .ds-assigned-badge {
          align-self: flex-start;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--color-primary);
          background-color: color-mix(in oklch, var(--color-primary) 8%, transparent);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          margin-top: 4px;
        }

        .ds-slot-note-hint {
          position: absolute;
          bottom: 0;
          right: 0;
          font-size: 0.65rem;
          color: var(--color-muted);
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          padding: 1px 4px;
          max-width: 100px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Floating action bar styling */
        .ds-floating-bar-wrapper {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          width: calc(100% - 48px);
          max-width: 800px;
          animation: ds-modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-floating-bar-container {
          background-color: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 14px 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(10px);
        }

        .ds-floating-bar-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ds-floating-bar-info p {
          margin: 0;
          line-height: 1.3;
        }

        .ds-floating-bar-btns {
          display: flex;
          gap: 12px;
        }

        .spin {
          animation: ds-spin 1s linear infinite;
        }

        @keyframes ds-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes ds-modal-in {
          from {
            transform: translate(-50%, 40px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
      
    </div>
  );
};

export default ReviewSlots;
