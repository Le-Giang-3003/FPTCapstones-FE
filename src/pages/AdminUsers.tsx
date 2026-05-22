import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import type { UserListItem, UserDetailDto, ImportUsersResultDto } from '../types';
import {
  Search, UserCheck, UserX, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Plus, Eye, Mail, X,
  Loader2, CheckCircle, AlertTriangle, Users, Upload,
} from 'lucide-react';

type Toast = { type: 'success' | 'error'; message: string } | null;

// Badge class theo từng role flag
const roleBadge: Record<string, string> = {
  Admin:         'badge-danger',
  Lecturer:      'badge-info',
  StudentLeader: 'badge-success',
  GroupMember:   '',
};

// Hiển thị một hoặc nhiều badge cho user có multi-role ("Admin, Lecturer")
const RoleBadges = ({ role }: { role: string }) => (
  <>
    {role.split(', ').map(r => (
      <span key={r} className={`badge ${roleBadge[r.trim()] ?? ''}`} style={{ marginRight: '0.25rem' }}>
        {r.trim()}
      </span>
    ))}
  </>
);

// ─── Component phụ ──────────────────────────────────────────────────────────

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</p>
    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{value ?? '—'}</div>
  </div>
);

// ─── Toast Component ─────────────────────────────────────────────────────────

const ToastBar = ({ toast }: { toast: Toast }) => {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  return (
    <div style={{
      position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 2000,
      background: isSuccess ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
      border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
      borderRadius: '10px', padding: '0.75rem 1.25rem',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      color: isSuccess ? 'var(--success)' : 'var(--danger)',
      fontWeight: 500, boxShadow: 'var(--shadow-lg)',
      animation: 'fadeIn 0.3s ease-out',
      maxWidth: '360px',
    }}>
      {isSuccess ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      {toast.message}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const AdminUsers = () => {
  // Danh sách
  const [users, setUsers]           = useState<UserListItem[]>([]);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading]       = useState(false);
  const [busy, setBusy]             = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const itemsPerPage = 10;

  // Toast
  const [toast, setToast] = useState<Toast>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Import Excel
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting]         = useState(false);
  const [importResult, setImportResult]   = useState<ImportUsersResultDto | null>(null);

  // Modal tạo user
  const [showCreate, setShowCreate]   = useState(false);
  const [createForm, setCreateForm]   = useState({ email: '', fullName: '', role: 'Lecturer' });
  const [creating, setCreating]       = useState(false);

  // Modal chi tiết user
  const [detail, setDetail]               = useState<UserDetailDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Sửa email (nằm trong modal chi tiết)
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [newEmail, setNewEmail]           = useState('');
  const [savingEmail, setSavingEmail]     = useState(false);

  // ── Load danh sách ─────────────────────────────────────────────────────────

  const load = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page: currentPage, pageSize: itemsPerPage };
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;
      const res = await api.get<{ items: UserListItem[]; totalCount: number }>('/api/admin/users', { params });
      setUsers(res.data.items);
      setTotalCount(res.data.totalCount);
    } catch (e) {
      console.error('Load users failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, roleFilter]);

  // Reset về trang 1 khi đổi bộ lọc
  useEffect(() => { setCurrentPage(1); }, [search, roleFilter]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggle = async (id: number, isActive: boolean, email: string) => {
    const action = isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`${isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} user ${email}?`)) return;
    try {
      setBusy(id);
      await api.post(`/api/admin/users/${id}/${action}`);
      showToast('success', `${isActive ? 'Đã vô hiệu hóa' : 'Đã kích hoạt'} ${email}`);
      await load();
      // Refresh detail nếu đang xem cùng user
      if (detail?.id === id) await loadDetail(id);
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setBusy(null);
    }
  };

  const loadDetail = async (id: number) => {
    setLoadingDetail(true);
    setShowEditEmail(false);
    try {
      const res = await api.get<UserDetailDto>(`/api/admin/users/${id}`);
      setDetail(res.data);
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Không thể tải thông tin user');
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setShowEditEmail(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      setImportResult(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<ImportUsersResultDto>('/api/admin/users/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      await load();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Import thất bại');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.post('/api/admin/users', createForm);
      showToast('success', `Đã tạo user ${createForm.email}`);
      setShowCreate(false);
      setCreateForm({ email: '', fullName: '', role: 'Lecturer' });
      await load();
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Tạo user thất bại');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    try {
      setSavingEmail(true);
      await api.patch(`/api/admin/users/${detail.id}/email`, { email: newEmail });
      showToast('success', `Đã cập nhật email thành ${newEmail}`);
      setShowEditEmail(false);
      await loadDetail(detail.id);
      await load();
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Cập nhật email thất bại');
    } finally {
      setSavingEmail(false);
    }
  };

  // ── Pagination helpers ─────────────────────────────────────────────────────

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getPageNumbers = () => {
    const blockSize  = 10;
    const blockIndex = Math.floor((currentPage - 1) / blockSize);
    const start = blockIndex * blockSize + 1;
    const end   = Math.min(totalPages, (blockIndex + 1) * blockSize);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const isLastBlock = Math.floor((totalPages - 1) / 10) === Math.floor((currentPage - 1) / 10);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      <ToastBar toast={toast} />

      {/* Topbar */}
      <div className="topbar">
        <div>
          <h1>Quản lý người dùng</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Tạo, kích hoạt và quản lý tài khoản trong hệ thống
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
            {importing ? 'Đang Import...' : 'Import Excel'}
          </button>
          <input
            type="file" accept=".xlsx,.xls" ref={fileInputRef}
            style={{ display: 'none' }} onChange={handleImport}
          />
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Thêm User
          </button>
        </div>
      </div>

      {/* Kết quả import */}
      {importResult && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <CheckCircle size={20} color="var(--success)" />
            <h3 style={{ margin: 0 }}>Kết quả Import Users</h3>
          </div>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Tạo mới: <strong style={{ color: 'var(--success)' }}>{importResult.created}</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Cập nhật: <strong style={{ color: 'var(--accent-primary)' }}>{importResult.updated}</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Bỏ qua: <strong>{importResult.skipped}</strong>
            </span>
          </div>
          {importResult.errors.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.08)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                <AlertTriangle size={15} />
                <strong>Cảnh báo / Lỗi ({importResult.errors.length})</strong>
              </div>
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.7 }}>
                  {importResult.errors.map((err, i) => (
                    <li key={i}>
                      {err.rowNumber > 0 ? `Dòng ${err.rowNumber}: ` : ''}{err.reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => setImportResult(null)}>
            Đóng
          </button>
        </div>
      )}

      {/* Bộ lọc */}
      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text" className="input-field"
              placeholder="Tìm theo email hoặc tên..."
              style={{ paddingLeft: '2.5rem' }}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <select className="input-field" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">Tất cả role</option>
          <option value="Admin">Admin</option>
          <option value="Lecturer">Lecturer</option>
          <option value="StudentLeader">Student Leader</option>
          <option value="GroupMember">Group Member</option>
        </select>
        {(search || roleFilter) && (
          <button className="btn btn-secondary" onClick={() => { setSearch(''); setRoleFilter(''); }}>
            <X size={14} /> Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Bảng danh sách */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <Loader2 size={20} className="spin" /> Đang tải...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
            <p>Không có user nào{search ? ` khớp với "${search}"` : ''}.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Trạng thái</th>
                    <th>Tạo lúc</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} onClick={() => loadDetail(u.id)} title="Xem chi tiết">
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>#{u.id}</td>
                      <td style={{ fontWeight: 500 }}>{u.fullName}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{u.email}</td>
                      <td><RoleBadges role={u.role} /></td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-warning'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {/* stopPropagation để click nút không trigger row onClick */}
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => loadDetail(u.id)}
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className={`btn ${u.isActive ? 'btn-danger' : 'btn-primary'}`}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            disabled={busy === u.id}
                            onClick={() => toggle(u.id, u.isActive, u.email)}
                            title={u.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                          >
                            {busy === u.id
                              ? <Loader2 size={14} className="spin" />
                              : u.isActive ? <UserX size={14} /> : <UserCheck size={14} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass)',
                background: 'var(--surface-glass)', flexWrap: 'wrap', gap: '1rem',
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiển thị{' '}
                  <strong>{totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(totalCount, currentPage * itemsPerPage)}</strong>{' '}
                  trong tổng số <strong>{totalCount}</strong> kết quả
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <PagBtn disabled={currentPage <= 10} onClick={() => setCurrentPage(Math.max(1, Math.floor((currentPage-1)/10)*10))} title="Cụm trước"><ChevronsLeft size={16} /></PagBtn>
                  <PagBtn disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p-1, 1))}><ChevronLeft size={16} /></PagBtn>
                  {getPageNumbers().map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        padding: '0.4rem 0.75rem', minWidth: '32px',
                        background: currentPage === page ? 'var(--accent-primary)' : 'transparent',
                        border: currentPage === page ? 'none' : '1px solid var(--border-glass)',
                        color: currentPage === page ? 'white' : 'var(--text-primary)',
                      }}
                    >{page}</button>
                  ))}
                  <PagBtn disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))}><ChevronRight size={16} /></PagBtn>
                  <PagBtn disabled={isLastBlock} onClick={() => setCurrentPage(Math.min(totalPages, (Math.floor((currentPage-1)/10)+1)*10+1))} title="Cụm sau"><ChevronsRight size={16} /></PagBtn>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal: Tạo User ───────────────────────────────────────────────────── */}
      {showCreate && (
        <ModalOverlay onClose={() => !creating && setShowCreate(false)}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 480, padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <ModalHeader title="Thêm người dùng mới" onClose={() => setShowCreate(false)} disabled={creating} />
            <form onSubmit={handleCreateUser}>
              <div className="input-group">
                <label className="input-label">Email <Required /></label>
                <input required type="email" className="input-field" placeholder="example@fpt.edu.vn"
                  value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Họ tên <Required /></label>
                <input required type="text" className="input-field" placeholder="Nguyễn Văn A"
                  value={createForm.fullName} onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Role <Required /></label>
                <select required className="input-field" value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}>
                  <option value="Admin">Admin</option>
                  <option value="Lecturer">Lecturer</option>
                  <option value="StudentLeader">Student Leader</option>
                  <option value="GroupMember">Group Member</option>
                </select>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                User sẽ được liên kết với Google khi đăng nhập lần đầu tiên.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)} disabled={creating}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <><Loader2 size={16} className="spin" /> Đang tạo...</> : <><Plus size={16} /> Tạo User</>}
                </button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ── Modal: Chi tiết User ──────────────────────────────────────────────── */}
      {(detail || loadingDetail) && (
        <ModalOverlay onClose={closeDetail}>
          <div
            className="glass-panel animate-fade-in"
            style={{ width: '100%', maxWidth: 560, padding: '2rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Loading overlay khi đang fetch detail mới */}
            {loadingDetail && (
              <div style={{
                position: 'absolute', inset: 0, background: 'var(--modal-overlay-bg)',
                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
              }}>
                <Loader2 size={28} className="spin" style={{ color: 'var(--accent-primary)' }} />
              </div>
            )}

            {detail && (
              <>
                <ModalHeader
                  title="Chi tiết người dùng"
                  subtitle={`ID #${detail.id}`}
                  onClose={closeDetail}
                />

                {/* Grid thông tin cơ bản */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <InfoRow label="Họ tên" value={detail.fullName} />
                  <InfoRow label="Role" value={<RoleBadges role={detail.role} />} />
                  <InfoRow label="Trạng thái" value={
                    <span className={`badge ${detail.isActive ? 'badge-success' : 'badge-warning'}`}>
                      {detail.isActive ? 'Active' : 'Inactive'}
                    </span>
                  } />
                  <InfoRow label="Tài khoản Google" value={
                    detail.googleSubject
                      ? <span className="badge badge-success">Đã liên kết</span>
                      : <span className="badge badge-warning">Chưa liên kết</span>
                  } />
                  <InfoRow label="Tạo lúc" value={new Date(detail.createdAt).toLocaleString('vi-VN')} />
                  {detail.updatedAt && (
                    <InfoRow label="Cập nhật lúc" value={new Date(detail.updatedAt).toLocaleString('vi-VN')} />
                  )}
                </div>

                {/* Email section */}
                <div style={{
                  background: 'rgba(251,146,60,0.05)', border: '1px solid var(--border-glass)',
                  borderRadius: '10px', padding: '1rem', marginBottom: '1rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Email</p>
                      <p style={{ fontWeight: 500, wordBreak: 'break-all' }}>{detail.email}</p>
                    </div>
                    {!showEditEmail && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', flexShrink: 0 }}
                        onClick={() => { setShowEditEmail(true); setNewEmail(detail.email); }}
                      >
                        <Mail size={14} /> Sửa email
                      </button>
                    )}
                  </div>

                  {showEditEmail && (
                    <form onSubmit={handleUpdateEmail} style={{ marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                      <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                        <label className="input-label">Email mới</label>
                        <input
                          required type="email" className="input-field"
                          value={newEmail} onChange={e => setNewEmail(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                          onClick={() => setShowEditEmail(false)} disabled={savingEmail}>
                          Hủy
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                          disabled={savingEmail}>
                          {savingEmail ? <><Loader2 size={14} className="spin" /> Đang lưu...</> : 'Lưu'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Lecturer Profile */}
                {detail.lecturerProfile && (
                  <div style={{
                    background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: '10px', padding: '1rem', marginBottom: '1rem',
                  }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Lecturer Profile</p>
                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
                      <span>Lecturer ID: <strong>#{detail.lecturerProfile.id}</strong></span>
                      <span>Mã tên: <strong>{detail.lecturerProfile.code || '—'}</strong></span>
                    </div>
                  </div>
                )}

                {/* Student Profile */}
                {detail.studentProfile && (
                  <div style={{
                    background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '10px', padding: '1rem', marginBottom: '1rem',
                  }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Student Profile</p>
                    <span style={{ fontSize: '0.875rem' }}>Student ID: <strong>#{detail.studentProfile.id}</strong></span>
                  </div>
                )}

                {/* Nút activate/deactivate từ modal chi tiết */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={closeDetail}>Đóng</button>
                  <button
                    className={`btn ${detail.isActive ? 'btn-danger' : 'btn-primary'}`}
                    disabled={busy === detail.id}
                    onClick={() => toggle(detail.id, detail.isActive, detail.email)}
                  >
                    {busy === detail.id
                      ? <><Loader2 size={16} className="spin" /> Đang xử lý...</>
                      : detail.isActive
                        ? <><UserX size={16} /> Vô hiệu hóa</>
                        : <><UserCheck size={16} /> Kích hoạt</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </ModalOverlay>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const Required = () => <span style={{ color: 'var(--danger)' }}>*</span>;

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => {
  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'var(--modal-overlay-bg)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={onClose}
    >
      {children}
    </div>,
    document.body
  );
};

const ModalHeader = ({
  title, subtitle, onClose, disabled = false,
}: { title: string; subtitle?: string; onClose: () => void; disabled?: boolean }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
    <div>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.85rem' }}>{subtitle}</p>}
    </div>
    <button className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', flexShrink: 0 }} onClick={onClose} disabled={disabled}>
      <X size={18} />
    </button>
  </div>
);

const PagBtn = ({ children, disabled, onClick, title }: { children: React.ReactNode; disabled: boolean; onClick: () => void; title?: string }) => (
  <button
    onClick={onClick} disabled={disabled} title={title}
    className="btn btn-secondary"
    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
  >
    {children}
  </button>
);

export default AdminUsers;
