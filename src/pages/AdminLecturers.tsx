import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import type { LecturerListItemDto, ImportLecturersResultDto } from '../types';
import { Search, Upload, Edit, ChevronLeft, ChevronRight, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const AdminLecturers = () => {
  const [lecturers, setLecturers] = useState<LecturerListItemDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit Modal State
  const [editingLecturer, setEditingLecturer] = useState<LecturerListItemDto | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', code: '' });
  const [saving, setSaving] = useState(false);

  // Import Result State
  const [importResult, setImportResult] = useState<ImportLecturersResultDto | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page: 1, pageSize: 1000 };
      if (search) params.search = search;
      const res = await api.get<LecturerListItemDto[]>('/api/admin/lecturers', { params });
      setLecturers(res.data);
    } catch (e) {
      console.error('Load lecturers failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      setImportResult(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<ImportLecturersResultDto>('/api/admin/lecturers/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Upload thất bại');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEditClick = (lec: LecturerListItemDto) => {
    setEditingLecturer(lec);
    setEditForm({
      fullName: lec.fullName || '',
      email: lec.email || '',
      code: lec.code || ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecturer) return;
    try {
      setSaving(true);
      await api.put(`/api/admin/lecturers/${editingLecturer.id}`, editForm);
      setEditingLecturer(null);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(lecturers.length / itemsPerPage);
  const displayedLecturers = lecturers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Quản lý Giảng viên</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Danh sách giảng viên hướng dẫn (GVHD)</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
          {importing ? 'Đang Import...' : 'Import Excel'}
        </button>
        <input 
          type="file" 
          accept=".xlsx,.xls" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImport}
        />
      </div>

      {importResult && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={20} color="var(--success)" />
            <h3 style={{ margin: 0 }}>Kết quả Import</h3>
          </div>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <span><strong>Tạo mới:</strong> {importResult.created}</span>
            <span><strong>Cập nhật:</strong> {importResult.updated}</span>
            <span><strong>Bỏ qua:</strong> {importResult.skipped}</span>
          </div>
          {importResult.errors && importResult.errors.length > 0 && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '0.5rem' }}>
                <AlertTriangle size={16} />
                <strong>Cảnh báo / Lỗi ({importResult.errors.length}):</strong>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>Dòng {err.rowNumber}: {err.reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setImportResult(null)}>
            Đóng
          </button>
        </div>
      )}

      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" className="input-field" placeholder="Tìm theo email, tên hoặc mã tên..."
              style={{ paddingLeft: '2.5rem' }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải...</div>
        ) : lecturers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có giảng viên nào.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Họ tên</th>
                    <th>Mã tên</th>
                    <th>Email</th>
                    <th>Trạng thái User</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLecturers.map(l => (
                    <tr key={l.id}>
                      <td>{l.id}</td>
                      <td>{l.fullName}</td>
                      <td>
                        {l.code ? <span className="badge badge-success">{l.code}</span> : <span className="badge badge-warning">Chưa có</span>}
                      </td>
                      <td>{l.email}</td>
                      <td>
                        <span className={`badge ${l.isActive ? 'badge-success' : 'badge-warning'}`}>
                          {l.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleEditClick(l)}
                        >
                          <Edit size={14} /> Sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass)', background: 'var(--surface-glass)', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiển thị <strong>{Math.min(lecturers.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(lecturers.length, currentPage * itemsPerPage)}</strong> trong tổng số <strong>{lecturers.length}</strong> kết quả
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button key={page} onClick={() => setCurrentPage(page)} className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.4rem 0.75rem', minWidth: '32px', background: currentPage === page ? 'var(--accent-primary)' : 'transparent', border: currentPage === page ? 'none' : '1px solid var(--border-glass)', color: currentPage === page ? 'white' : 'var(--text-primary)' }}>
                          {page}
                        </button>
                      );
                    }
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} style={{ color: 'var(--text-secondary)' }}>...</span>;
                    }
                    return null;
                  })}
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {editingLecturer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 500, padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Sửa thông tin GVHD</h2>
            <form onSubmit={handleSaveEdit}>
              <div className="input-group">
                <label className="input-label">Họ tên</label>
                <input required type="text" className="input-field" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input required type="email" className="input-field" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Mã tên</label>
                <input type="text" className="input-field" value={editForm.code} onChange={e => setEditForm({...editForm, code: e.target.value})} placeholder="VD: HungNN" />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingLecturer(null)} disabled={saving}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spin" /> Đang lưu...</> : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default AdminLecturers;
