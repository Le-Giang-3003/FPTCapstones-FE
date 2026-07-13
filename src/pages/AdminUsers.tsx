import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  X, 
  Mail, 
  User, 
  AlertCircle, 
  Edit2, 
  CheckCircle, 
  Clock, 
  FileSpreadsheet
} from 'lucide-react';

interface UserListItem {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export const AdminUsers: React.FC = () => {
  const { showToast } = useToast();

  // Lists
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalEmail, setModalEmail] = useState('');
  const [modalFullName, setModalFullName] = useState('');
  const [modalRole, setModalRole] = useState('GroupMember');
  const [creating, setCreating] = useState(false);

  // Edit Email Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [editEmailVal, setEditEmailVal] = useState('');
  const [updating, setUpdating] = useState(false);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ importedCount?: number, updatedCount?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, searchQuery]);

  // Fetch paginated user accounts
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users', {
        params: {
          search: searchQuery || undefined,
          role: roleFilter || undefined,
          page,
          pageSize
        }
      });
      // Backend returns PagedResult with { items, totalCount }
      setUsers(res.data.items || []);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      showToast('Không thể tải danh sách tài khoản người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Search Input Change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  // Handle Role Filter Change
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  // Toggle Account Active Status
  const handleToggleActive = async (userItem: UserListItem) => {
    const actionStr = userItem.isActive ? 'deactivate' : 'activate';
    const actionViet = userItem.isActive ? 'khoá hoạt động' : 'kích hoạt';
    try {
      await api.post(`/api/admin/users/${userItem.id}/${actionStr}`);
      showToast(`Đã ${actionViet} tài khoản "${userItem.fullName}"`, 'success');
      fetchUsers();
    } catch (err) {
      showToast(`Không thể ${actionViet} tài khoản`, 'error');
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalEmail('');
    setModalFullName('');
    setModalRole('GroupMember');
    setShowCreateModal(true);
  };

  // Submit Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEmail.trim() || !modalFullName.trim()) {
      showToast('Vui lòng điền đầy đủ email và họ tên', 'warning');
      return;
    }

    setCreating(true);
    try {
      await api.post('/api/admin/users', {
        email: modalEmail.trim(),
        fullName: modalFullName.trim(),
        role: modalRole
      });
      showToast('Tạo tài khoản người dùng thành công!', 'success');
      setShowCreateModal(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Tạo tài khoản thất bại', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Open Edit Email Modal
  const handleOpenEdit = (userItem: UserListItem) => {
    setEditingUser(userItem);
    setEditEmailVal(userItem.email);
    setShowEditModal(true);
  };

  // Submit Update Email (Patch)
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmailVal.trim()) {
      showToast('Vui lòng nhập địa chỉ email hợp lệ', 'warning');
      return;
    }
    if (!editingUser) return;

    setUpdating(true);
    try {
      await api.patch(`/api/admin/users/${editingUser.id}/email`, {
        email: editEmailVal.trim()
      });
      showToast(`Đã thay đổi email thành công cho "${editingUser.fullName}"`, 'success');
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Cập nhật email thất bại', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Open Import Modal
  const handleOpenImport = () => {
    setSelectedFile(null);
    setImportResult(null);
    setShowImportModal(true);
  };

  // Submit Excel Import Users
  const handleImportUsers = async (e: React.FormEvent) => {
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
      const res = await api.post('/api/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Import danh sách tài khoản thành công!', 'success');
      setImportResult(res.data);
      setSelectedFile(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Nhập Excel thất bại. Vui lòng xem lại định dạng các cột (Email, Họ và Tên, Role).', 'error');
    } finally {
      setImporting(false);
    }
  };

  // Format date representation
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Format role badges
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return <span className="ds-role-badge admin">Quản trị viên</span>;
      case 'Lecturer':
        return <span className="ds-role-badge lecturer">Giảng viên</span>;
      case 'Reviewer':
        return <span className="ds-role-badge reviewer">Phản biện</span>;
      case 'StudentLeader':
        return <span className="ds-role-badge student-leader">Trưởng nhóm</span>;
      default:
        return <span className="ds-role-badge student-member">Sinh viên</span>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="ds-users-page">
      
      {/* Header */}
      <div className="ds-users-header">
        <div>
          <h1>Quản lý Tài khoản Người dùng</h1>
          <p className="text-muted">Thêm mới, cập nhật email hoặc điều khiển bật/tắt hoạt động của các tài khoản truy cập hệ thống</p>
        </div>

        <div className="ds-header-actions">
          <button className="ds-btn ds-btn-secondary" onClick={handleOpenImport}>
            <Upload size={16} />
            <span>Nhập từ Excel</span>
          </button>
          
          <button className="ds-btn ds-btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* Roster list main Card */}
      <div className="ds-card">
        <div className="ds-card-header-with-filter">
          <h2>Danh sách người dùng ({totalCount})</h2>
          
          <div className="ds-filters-row">
            {/* Filter select role */}
            <select 
              value={roleFilter} 
              onChange={handleRoleFilterChange}
              className="ds-select-small"
            >
              <option value="">-- Tất cả vai trò --</option>
              <option value="Admin">Quản trị viên</option>
              <option value="Lecturer">Giảng viên</option>
              <option value="Reviewer">Hội đồng phản biện</option>
              <option value="StudentLeader">Trưởng nhóm sinh viên</option>
              <option value="GroupMember">Thành viên sinh viên</option>
            </select>

            {/* Filter search box */}
            <div className="ds-search-wrapper">
              <Search size={16} className="ds-search-icon" />
              <input 
                type="text" 
                placeholder="Tìm tên, email..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="ds-input-search"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="ds-loading-placeholder">
            <div className="ds-skeleton" style={{ height: '40px', marginBottom: '12px' }}></div>
            <div className="ds-skeleton" style={{ height: '40px', marginBottom: '12px' }}></div>
            <div className="ds-skeleton" style={{ height: '40px' }}></div>
          </div>
        ) : users.length === 0 ? (
          <div className="ds-empty-state">
            <AlertCircle size={48} className="text-muted" style={{ marginBottom: '16px' }} />
            <h3>Không tìm thấy tài khoản người dùng</h3>
            <p className="text-muted">Vui lòng thay đổi từ khóa tìm kiếm hoặc lọc vai trò khác.</p>
          </div>
        ) : (
          <>
            <div className="ds-table-container">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Họ và Tên người dùng</th>
                    <th>Địa chỉ Email (FPT)</th>
                    <th>Vai trò chính</th>
                    <th>Ngày tạo</th>
                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={!u.isActive ? 'ds-row-inactive' : ''}>
                      <td style={{ fontWeight: 700 }}>{u.fullName}</td>
                      <td className="tnum">{u.email}</td>
                      <td>{renderRoleBadge(u.role)}</td>
                      <td className="tnum text-muted" style={{ fontSize: '0.8rem' }}>{formatDate(u.createdAt)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className={`ds-toggle-btn ${u.isActive ? 'active' : ''}`}
                          onClick={() => handleToggleActive(u)}
                          title={u.isActive ? 'Bấm để khoá tài khoản' : 'Bấm để kích hoạt tài khoản'}
                        >
                          <span className="ds-toggle-slider"></span>
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="ds-action-buttons">
                          <button 
                            className="ds-action-btn edit" 
                            onClick={() => handleOpenEdit(u)}
                            title="Sửa email tài khoản"
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

            {/* Pagination controls */}
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
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="ds-modal-backdrop">
          <div className="ds-modal-container" style={{ maxWidth: '500px' }}>
            <div className="ds-modal-header">
              <h2>Thêm tài khoản người dùng mới</h2>
              <button className="ds-modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="ds-modal-form">
              <div className="ds-form-group">
                <label className="ds-form-label">Họ và tên người dùng</label>
                <div className="ds-input-with-icon">
                  <User size={16} className="ds-input-icon-inner" />
                  <input 
                    type="text" 
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={modalFullName}
                    onChange={(e) => setModalFullName(e.target.value)}
                    required
                    disabled={creating}
                  />
                </div>
              </div>

              <div className="ds-form-group">
                <label className="ds-form-label">Email trường cấp (@fpt.edu.vn)</label>
                <div className="ds-input-with-icon">
                  <Mail size={16} className="ds-input-icon-inner" />
                  <input 
                    type="email" 
                    placeholder="anv@fpt.edu.vn"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    required
                    disabled={creating}
                  />
                </div>
              </div>

              <div className="ds-form-group">
                <label className="ds-form-label">Phân quyền hệ thống</label>
                <select 
                  value={modalRole} 
                  onChange={(e) => setModalRole(e.target.value)}
                  disabled={creating}
                >
                  <option value="Admin">Quản trị viên (Admin)</option>
                  <option value="Lecturer">Giảng viên hướng dẫn (Lecturer)</option>
                  <option value="Reviewer">Hội đồng chấm (Reviewer)</option>
                  <option value="StudentLeader">Trưởng nhóm sinh viên (StudentLeader)</option>
                  <option value="GroupMember">Thành viên sinh viên (GroupMember)</option>
                </select>
              </div>

              <div className="ds-modal-footer">
                <button 
                  type="button" 
                  className="ds-btn ds-btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="ds-btn ds-btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Email Modal */}
      {showEditModal && (
        <div className="ds-modal-backdrop">
          <div className="ds-modal-container" style={{ maxWidth: '480px' }}>
            <div className="ds-modal-header">
              <h2>Sửa Email Người dùng</h2>
              <button className="ds-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateEmail} className="ds-modal-form">
              <div className="ds-form-group">
                <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: '8px' }}>
                  Đang chỉnh sửa email cho tài khoản: <strong>{editingUser?.fullName}</strong>
                </p>
                <label className="ds-form-label">Địa chỉ email mới</label>
                <div className="ds-input-with-icon">
                  <Mail size={16} className="ds-input-icon-inner" />
                  <input 
                    type="email" 
                    value={editEmailVal}
                    onChange={(e) => setEditEmailVal(e.target.value)}
                    required
                    disabled={updating}
                  />
                </div>
              </div>

              <div className="ds-modal-footer">
                <button 
                  type="button" 
                  className="ds-btn ds-btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                  disabled={updating}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="ds-btn ds-btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Đang lưu...' : 'Cập nhật email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Users Import Modal */}
      {showImportModal && (
        <div className="ds-modal-backdrop">
          <div className="ds-modal-container" style={{ maxWidth: '520px' }}>
            <div className="ds-modal-header">
              <h2>Nhập danh sách tài khoản từ Excel</h2>
              <button className="ds-modal-close" onClick={() => setShowImportModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleImportUsers} className="ds-modal-form">
              
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
                      <h4>Chọn tệp Excel danh sách tài khoản</h4>
                      <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>Tệp Excel yêu cầu có 3 cột: Email, Họ và Tên, Role</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Display Result Summary */}
              {importResult && (
                <div className="ds-import-result-summary">
                  <CheckCircle size={18} className="text-success" />
                  <div>
                    <h4 className="text-success">Import tài khoản thành công!</h4>
                    <p style={{ fontSize: '0.8rem', marginTop: '4px', lineHeight: '1.4' }}>
                      Đã thêm mới: <strong className="tnum">{importResult.importedCount ?? 0}</strong> tài khoản.
                      Đã cập nhật: <strong className="tnum">{importResult.updatedCount ?? 0}</strong> dòng thông tin.
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
        .ds-users-page {
          width: 100%;
          animation: ds-page-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-users-header {
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

        .ds-filters-row {
          display: flex;
          gap: 16px;
        }

        .ds-select-small {
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-weight: 500;
          font-size: 0.85rem;
          background-color: var(--color-bg);
          border: 1px solid var(--color-border);
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
          width: 250px;
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

        .ds-row-inactive td {
          opacity: 0.55;
          text-decoration: line-through;
          color: var(--color-muted);
        }

        /* User Role Badges */
        .ds-role-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          display: inline-block;
        }

        .ds-role-badge.admin {
          color: var(--color-primary);
          background-color: color-mix(in oklch, var(--color-primary) 8%, transparent);
        }

        .ds-role-badge.lecturer {
          color: #2563eb;
          background-color: rgba(37, 99, 235, 0.08);
        }

        .ds-role-badge.reviewer {
          color: #7c3aed;
          background-color: rgba(124, 58, 237, 0.08);
        }

        .ds-role-badge.student-leader {
          color: #16a34a;
          background-color: rgba(22, 163, 74, 0.08);
        }

        .ds-role-badge.student-member {
          color: var(--color-muted);
          background-color: var(--color-surface);
        }

        /* Toggle switch style */
        .ds-toggle-btn {
          border: none;
          background-color: var(--color-border);
          width: 44px;
          height: 24px;
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background-color var(--transition-fast);
          display: inline-flex;
          align-items: center;
          padding: 2px;
        }

        .ds-toggle-btn.active {
          background-color: var(--color-success);
        }

        .ds-toggle-slider {
          background-color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: block;
          transition: transform var(--transition-fast);
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }

        .ds-toggle-btn.active .ds-toggle-slider {
          transform: translateX(20px);
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

        /* Input with icon inner */
        .ds-input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .ds-input-icon-inner {
          position: absolute;
          left: 12px;
          color: var(--color-muted);
        }

        .ds-input-with-icon input {
          padding-left: 36px !important;
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

export default AdminUsers;
