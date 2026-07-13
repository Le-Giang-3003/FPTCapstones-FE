import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { 
  Edit2, 
  X, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  CheckCircle
} from 'lucide-react';

interface Lecturer {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  code: string | null;
  isActive: boolean;
}

export const AdminLecturers: React.FC = () => {
  const { showToast } = useToast();
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<Lecturer | null>(null);
  const [modalFullName, setModalFullName] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalCode, setModalCode] = useState('');
  const [saving, setSaving] = useState(false);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ importedCount?: number, updatedCount?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLecturers();
  }, [page, searchQuery]);

  // Fetch Lecturers
  const fetchLecturers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/lecturers', {
        params: {
          search: searchQuery || undefined,
          page,
          pageSize
        }
      });
      setLecturers(res.data);
    } catch (err) {
      showToast('Không thể tải danh sách giảng viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (lec: Lecturer) => {
    setEditingLecturer(lec);
    setModalFullName(lec.fullName);
    setModalEmail(lec.email);
    setModalCode(lec.code || '');
    setShowEditModal(true);
  };

  // Save manual updates
  const handleSaveLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalFullName.trim()) {
      showToast('Vui lòng nhập tên giảng viên', 'warning');
      return;
    }
    if (!modalEmail.trim()) {
      showToast('Vui lòng nhập email giảng viên', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editingLecturer) {
        await api.put(`/api/admin/lecturers/${editingLecturer.id}`, {
          fullName: modalFullName,
          email: modalEmail,
          code: modalCode || null
        });
        showToast(`Đã cập nhật thông tin giảng viên "${modalFullName}"`, 'success');
        setShowEditModal(false);
        fetchLecturers();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Cập nhật giảng viên thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Open Import Modal
  const handleOpenImport = () => {
    setSelectedFile(null);
    setImportResult(null);
    setShowImportModal(true);
  };

  // Handle Excel Upload
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Vui lòng chọn tệp Excel trước', 'warning');
      return;
    }

    setImporting(true);
    setImportResult(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/api/admin/lecturers/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      showToast('Tải danh sách giảng viên thành công!', 'success');
      setImportResult(res.data);
      setSelectedFile(null);
      fetchLecturers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Nhập Excel thất bại. Vui lòng kiểm tra định dạng tệp.', 'error');
    } finally {
      setImporting(false);
    }
  };

  // Helper search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="ds-lecturers-page">
      
      {/* Header */}
      <div className="ds-lecturers-header">
        <div>
          <h1>Danh sách Giảng viên Hướng dẫn</h1>
          <p className="text-muted">Xem, chỉnh sửa mã hệ thống hoặc nhập nhanh danh sách giảng viên từ phòng đào tạo</p>
        </div>
        <button className="ds-btn ds-btn-primary" onClick={handleOpenImport}>
          <Upload size={16} />
          <span>Nhập từ Excel</span>
        </button>
      </div>

      {/* Main Card grid */}
      <div className="ds-card">
        <div className="ds-card-header-with-filter">
          <h2>Danh mục giảng viên</h2>
          
          {/* Search wrapper */}
          <div className="ds-search-wrapper">
            <Search size={16} className="ds-search-icon" />
            <input 
              type="text" 
              placeholder="Tìm tên, email hoặc mã giảng viên..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="ds-input-search"
            />
          </div>
        </div>

        {loading ? (
          <div className="ds-loading-placeholder">
            <div className="ds-skeleton" style={{ height: '40px', marginBottom: '12px' }}></div>
            <div className="ds-skeleton" style={{ height: '40px', marginBottom: '12px' }}></div>
            <div className="ds-skeleton" style={{ height: '40px' }}></div>
          </div>
        ) : lecturers.length === 0 ? (
          <div className="ds-empty-state">
            <AlertCircle size={48} className="text-muted" style={{ marginBottom: '16px' }} />
            <h3>Không tìm thấy giảng viên nào</h3>
            <p className="text-muted">Vui lòng nhập tệp danh sách Excel hoặc tìm kiếm cụm từ khác.</p>
          </div>
        ) : (
          <>
            <div className="ds-table-container">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Họ và Tên giảng viên</th>
                    <th>Địa chỉ Email</th>
                    <th>Mã GV (Viết tắt)</th>
                    <th style={{ textAlign: 'center' }}>Hệ thống ID</th>
                    <th style={{ textAlign: 'center' }}>Hoạt động</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturers.map((lec) => (
                    <tr key={lec.id}>
                      <td style={{ fontWeight: 700 }}>{lec.fullName}</td>
                      <td>{lec.email}</td>
                      <td className="tnum" style={{ fontWeight: 600 }}>{lec.code || <span className="text-muted">—</span>}</td>
                      <td style={{ textAlign: 'center' }} className="tnum text-muted">{lec.userId}</td>
                      <td style={{ textAlign: 'center' }}>
                        {lec.isActive ? (
                          <span className="ds-status-pill success" style={{ fontSize: '0.75rem' }}>Active</span>
                        ) : (
                          <span className="ds-status-pill finished" style={{ fontSize: '0.75rem' }}>Inactive</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="ds-action-buttons">
                          <button 
                            className="ds-action-btn edit" 
                            onClick={() => handleOpenEdit(lec)}
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
                disabled={lecturers.length < pageSize}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Edit Lecturer Modal */}
      {showEditModal && (
        <div className="ds-modal-backdrop">
          <div className="ds-modal-container" style={{ maxWidth: '500px' }}>
            <div className="ds-modal-header">
              <h2>Cập nhật giảng viên</h2>
              <button className="ds-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLecturer} className="ds-modal-form">
              <div className="ds-form-group">
                <label className="ds-form-label">Họ và tên giảng viên</label>
                <input 
                  type="text" 
                  value={modalFullName}
                  onChange={(e) => setModalFullName(e.target.value)}
                  required
                  disabled={saving}
                />
              </div>

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label className="ds-form-label">Email FPT</label>
                  <input 
                    type="email" 
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="ds-form-group">
                  <label className="ds-form-label">Mã giảng viên</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: DungNT"
                    value={modalCode}
                    onChange={(e) => setModalCode(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="ds-modal-footer">
                <button 
                  type="button" 
                  className="ds-btn ds-btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="ds-btn ds-btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="ds-modal-backdrop">
          <div className="ds-modal-container" style={{ maxWidth: '520px' }}>
            <div className="ds-modal-header">
              <h2>Nhập giảng viên hướng dẫn từ Excel</h2>
              <button className="ds-modal-close" onClick={() => setShowImportModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="ds-modal-form">
              <div className="ds-excel-import-zone">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                  accept=".xlsx"
                  style={{ display: 'none' }}
                  disabled={importing}
                />
                
                <div 
                  className={`ds-drag-area ${selectedFile ? 'has-file' : ''}`}
                  onClick={() => !importing && fileInputRef.current?.click()}
                >
                  <FileSpreadsheet size={36} className="text-muted" />
                  {selectedFile ? (
                    <div>
                      <h4 style={{ color: 'var(--color-success)' }}>{selectedFile.name}</h4>
                      <p className="tnum" style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '4px' }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h4>Chọn tệp Excel danh sách giảng viên</h4>
                      <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Bấm vào đây để chọn tệp tin cấu trúc .xlsx</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Display Result summary if imported successfully */}
              {importResult && (
                <div className="ds-import-result-summary">
                  <CheckCircle size={18} className="text-success" />
                  <div>
                    <h4 className="text-success">Đồng bộ dữ liệu thành công!</h4>
                    <p style={{ fontSize: '0.8rem', marginTop: '4px', lineHeight: '1.4' }}>
                      Đã thêm mới: <strong className="tnum">{importResult.importedCount ?? 0}</strong> giảng viên.
                      Cập nhật: <strong className="tnum">{importResult.updatedCount ?? 0}</strong> dòng thông tin.
                    </p>
                  </div>
                </div>
              )}

              <div className="ds-modal-footer">
                <button 
                  type="button" 
                  className="ds-btn ds-btn-secondary" 
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                >
                  Đóng
                </button>
                <button 
                  type="submit" 
                  className="ds-btn ds-btn-primary"
                  disabled={importing || !selectedFile}
                >
                  {importing ? (
                    <>
                      <Clock size={16} className="spin" />
                      <span>Đang nạp file...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Bắt đầu import</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Component Styles */}
      <style>{`
        .ds-lecturers-page {
          width: 100%;
          animation: ds-page-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-lecturers-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .ds-card-header-with-filter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 16px;
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
          width: 260px;
          background-color: var(--color-bg);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .ds-input-search:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
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

        .ds-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* Excel Upload Zone */
        .ds-excel-import-zone {
          border: 2px dashed var(--color-border);
          background-color: var(--color-surface);
          border-radius: var(--radius-md);
          padding: 24px 16px;
          text-align: center;
          cursor: pointer;
          transition: border-color var(--transition-fast), background-color var(--transition-fast);
        }

        .ds-excel-import-zone:hover {
          border-color: var(--color-primary);
          background-color: color-mix(in oklch, var(--color-primary) 1%, transparent);
        }

        .ds-drag-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .ds-drag-area.has-file {
          border-color: var(--color-success);
        }

        .ds-import-result-summary {
          background-color: color-mix(in oklch, var(--color-success) 6%, transparent);
          border: 1px solid color-mix(in oklch, var(--color-success) 15%, transparent);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 12px;
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

export default AdminLecturers;
