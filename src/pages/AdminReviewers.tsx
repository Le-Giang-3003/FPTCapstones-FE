import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { 
  Search, 
  Save, 
  RefreshCw, 
  AlertCircle,
  Clock,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';

interface Lecturer {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  code: string | null;
  isActive: boolean;
}

interface Reviewer {
  lecturerId: number;
  userId: number;
  email: string;
  fullName: string;
  code: string | null;
}

export const AdminReviewers: React.FC = () => {
  const { showToast } = useToast();
  
  // Lists
  const [allLecturers, setAllLecturers] = useState<Lecturer[]>([]);
  const [reviewerIds, setReviewerIds] = useState<Set<number>>(new Set());
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'selected' | 'unselected'>('all');
  
  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch both lecturers and current reviewers
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all lecturers (pageSize large enough to get all)
      const resLecturers = await api.get('/api/admin/lecturers', {
        params: { page: 1, pageSize: 1000 }
      });
      setAllLecturers(resLecturers.data);

      // 2. Fetch designated reviewers
      const resReviewers = await api.get('/api/admin/reviews/reviewers');
      const activeIds = new Set<number>(resReviewers.data.map((r: Reviewer) => r.lecturerId));
      setReviewerIds(activeIds);
    } catch (err) {
      showToast('Không thể tải danh sách giảng viên & hội đồng', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle designation state for a lecturer
  const handleToggleReviewer = (lecturerId: number) => {
    setReviewerIds(prev => {
      const next = new Set(prev);
      if (next.has(lecturerId)) {
        next.delete(lecturerId);
      } else {
        next.add(lecturerId);
      }
      return next;
    });
  };

  // Bulk select filtered lecturers
  const handleSelectAllFiltered = () => {
    setReviewerIds(prev => {
      const next = new Set(prev);
      filteredLecturers.forEach(l => next.add(l.id));
      return next;
    });
    showToast(`Đã chọn toàn bộ giảng viên hiển thị làm hội đồng`, 'info');
  };

  // Bulk deselect filtered lecturers
  const handleDeselectAllFiltered = () => {
    setReviewerIds(prev => {
      const next = new Set(prev);
      filteredLecturers.forEach(l => next.delete(l.id));
      return next;
    });
    showToast(`Đã bỏ chọn toàn bộ giảng viên hiển thị khỏi hội đồng`, 'info');
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const idsArray = Array.from(reviewerIds);
      await api.put('/api/admin/reviews/reviewers', {
        lecturerIds: idsArray
      });
      showToast('Đã lưu danh sách Hội đồng phản biện thành công!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lưu danh sách hội đồng thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filtering Logic
  const filteredLecturers = allLecturers.filter(l => {
    const matchesSearch = 
      l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.code && l.code.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (!matchesSearch) return false;
    
    if (filterMode === 'selected') return reviewerIds.has(l.id);
    if (filterMode === 'unselected') return !reviewerIds.has(l.id);
    
    return true;
  });

  return (
    <div className="ds-reviewers-page">
      
      {/* Title Header */}
      <div className="ds-reviewers-header">
        <div>
          <h1>Thiết lập Hội đồng Phản biện (Reviewer Pool)</h1>
          <p className="text-muted">Chọn các giảng viên hướng dẫn tham gia vào nhóm hội đồng phản biện đồ án học kỳ này</p>
        </div>

        <div className="ds-header-actions">
          <button 
            className="ds-btn ds-btn-secondary" 
            onClick={fetchData} 
            disabled={loading || saving}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          <button 
            className="ds-btn ds-btn-primary" 
            onClick={handleSaveChanges}
            disabled={saving || loading}
          >
            {saving ? <Clock size={16} className="spin" /> : <Save size={16} />}
            <span>Lưu danh sách hội đồng</span>
          </button>
        </div>
      </div>

      <div className="ds-reviewers-layout">
        
        {/* Left Column: Reviewer selection list */}
        <div className="ds-reviewers-main">
          <div className="ds-card">
            
            <div className="ds-card-header-with-filter">
              <div className="ds-filter-tabs">
                <button 
                  className={`ds-tab-btn ${filterMode === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterMode('all')}
                >
                  Tất cả ({allLecturers.length})
                </button>
                <button 
                  className={`ds-tab-btn ${filterMode === 'selected' ? 'active' : ''}`}
                  onClick={() => setFilterMode('selected')}
                >
                  Được chọn làm Hội đồng ({reviewerIds.size})
                </button>
                <button 
                  className={`ds-tab-btn ${filterMode === 'unselected' ? 'active' : ''}`}
                  onClick={() => setFilterMode('unselected')}
                >
                  Không tham gia ({allLecturers.length - reviewerIds.size})
                </button>
              </div>

              {/* Search wrapper */}
              <div className="ds-search-wrapper">
                <Search size={16} className="ds-search-icon" />
                <input 
                  type="text" 
                  placeholder="Tìm tên, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ds-input-search"
                />
              </div>
            </div>

            {/* Bulk select buttons inside card */}
            <div className="ds-bulk-actions-bar">
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                Đang hiển thị: <strong className="tnum">{filteredLecturers.length}</strong> giảng viên
              </span>
              <div className="ds-bulk-btns">
                <button className="ds-btn-text" onClick={handleSelectAllFiltered}>
                  Chọn toàn bộ hiển thị
                </button>
                <button className="ds-btn-text text-danger" onClick={handleDeselectAllFiltered}>
                  Bỏ chọn toàn bộ hiển thị
                </button>
              </div>
            </div>

            {loading ? (
              <div className="ds-loading-placeholder">
                <div className="ds-skeleton" style={{ height: '45px', marginBottom: '12px' }}></div>
                <div className="ds-skeleton" style={{ height: '45px', marginBottom: '12px' }}></div>
                <div className="ds-skeleton" style={{ height: '45px' }}></div>
              </div>
            ) : filteredLecturers.length === 0 ? (
              <div className="ds-empty-state">
                <AlertCircle size={48} className="text-muted" style={{ marginBottom: '16px' }} />
                <h3>Không tìm thấy kết quả phù hợp</h3>
                <p className="text-muted">Thay đổi từ khóa tìm kiếm hoặc cấu hình bộ lọc ở trên.</p>
              </div>
            ) : (
              <div className="ds-table-container">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th style={{ width: '48px', textAlign: 'center' }}>Chọn</th>
                      <th>Mã GV</th>
                      <th>Họ và Tên giảng viên</th>
                      <th>Email FPT</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLecturers.map((lec) => {
                      const isSelected = reviewerIds.has(lec.id);
                      return (
                        <tr 
                          key={lec.id} 
                          onClick={() => handleToggleReviewer(lec.id)}
                          className={`ds-reviewer-select-row ${isSelected ? 'selected' : ''}`}
                        >
                          <td style={{ textAlign: 'center' }}>
                            <div className="ds-checkbox-cell" onClick={e => e.stopPropagation()}>
                              <button 
                                type="button" 
                                className={`ds-custom-checkbox-btn ${isSelected ? 'checked' : ''}`}
                                onClick={() => handleToggleReviewer(lec.id)}
                              >
                                {isSelected ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
                              </button>
                            </div>
                          </td>
                          <td className="tnum" style={{ fontWeight: 700 }}>
                            {lec.code || <span className="text-muted">—</span>}
                          </td>
                          <td style={{ fontWeight: 600 }}>{lec.fullName}</td>
                          <td>{lec.email}</td>
                          <td>
                            {isSelected ? (
                              <span className="ds-status-pill success" style={{ fontSize: '0.7rem' }}>Hội đồng</span>
                            ) : (
                              <span className="ds-status-pill finished" style={{ fontSize: '0.7rem' }}>Không</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Guidance */}
        <div className="ds-reviewers-sidebar">
          <div className="ds-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Info size={20} className="text-primary" />
              <h2>Vai trò của Reviewer</h2>
            </div>
            
            <div className="ds-guideline-steps">
              <div className="ds-guide-step">
                <span className="ds-step-num">1</span>
                <div>
                  <h4>Hội đồng Phản biện (Reviewer Pool)</h4>
                  <p>Mặc định Giảng viên hướng dẫn khi import từ Excel chỉ thuộc danh mục chung. Để tham gia chấm thi phản biện chéo, Admin phải chọn gán giảng viên vào Pool Hội đồng phản biện này.</p>
                </div>
              </div>

              <div className="ds-guide-step">
                <span className="ds-step-num">2</span>
                <div>
                  <h4>Tự động hóa phân bổ ca chấm</h4>
                  <p>Khi thuật toán chạy phân lịch hội đồng chấm đồ án tốt nghiệp hoạt động, nó chỉ chọn các giảng viên nằm trong Pool hội đồng phản biện này để phân phòng thi và xếp ca.</p>
                </div>
              </div>

              <div className="ds-guide-step">
                <span className="ds-step-num">3</span>
                <div>
                  <h4>Đồng bộ an toàn</h4>
                  <p>Thay đổi danh sách ở đây chỉ có hiệu lực sau khi bấm <strong>Lưu danh sách hội đồng</strong> ở góc trên bên phải. Danh sách này được lưu chung toàn bộ kỳ học.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Embedded Styles */}
      <style>{`
        .ds-reviewers-page {
          width: 100%;
          animation: ds-page-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-reviewers-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .ds-header-actions {
          display: flex;
          gap: 12px;
        }

        .ds-card-header-with-filter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 16px;
        }

        .ds-filter-tabs {
          display: flex;
          gap: 8px;
        }

        .ds-tab-btn {
          border: 1px solid var(--color-border);
          background-color: var(--color-surface);
          color: var(--color-muted);
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
        }

        .ds-tab-btn:hover {
          background-color: var(--color-border);
          color: var(--color-ink);
        }

        .ds-tab-btn.active {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        /* Search wrapper */
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

        /* Bulk actions bar */
        .ds-bulk-actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px 12px 4px;
        }

        .ds-bulk-btns {
          display: flex;
          gap: 16px;
        }

        .ds-btn-text {
          border: none;
          background: none;
          color: var(--color-primary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .ds-btn-text:hover {
          text-decoration: underline;
        }

        .ds-btn-text.text-danger {
          color: var(--color-danger);
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

        .ds-reviewers-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .ds-reviewers-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Checkbox list select row */
        .ds-reviewer-select-row {
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .ds-reviewer-select-row:hover {
          background-color: var(--color-surface);
        }

        .ds-reviewer-select-row.selected {
          background-color: color-mix(in oklch, var(--color-primary) 1.5%, transparent);
        }

        .ds-custom-checkbox-btn {
          border: none;
          background: none;
          padding: 0;
          cursor: pointer;
          color: var(--color-muted);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ds-custom-checkbox-btn.checked {
          color: var(--color-primary);
        }

        /* Guidelines */
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
          line-height: 1.45;
        }

        .spin {
          animation: ds-spin 1s linear infinite;
        }

        @keyframes ds-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
    </div>
  );
};

export default AdminReviewers;
