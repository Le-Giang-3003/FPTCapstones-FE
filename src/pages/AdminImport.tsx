import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import type { ImportStatusDto } from '../types';
import { Upload, Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

const AdminImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<ImportStatusDto | null>(null);
  const pollTimer = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollTimer.current) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  const pollStatus = (id: number) => {
    stopPolling();
    const fetchOnce = async () => {
      try {
        const res = await api.get<ImportStatusDto>(`/api/imports/${id}/status`);
        setStatus(res.data);
        const s = String(res.data.status);
        if (s === 'Success' || s === 'Failed') {
          stopPolling();
        }
      } catch (e) {
        console.error('Poll failed', e);
      }
    };
    fetchOnce();
    pollTimer.current = window.setInterval(fetchOnce, 2000);
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setStatus(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/api/imports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const id = res.data.importJobId;
      setJobId(id);
      pollStatus(id);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const statusLabel = status ? String(status.status) : '';
  const isDone = statusLabel === 'Success' || statusLabel === 'Failed';

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Import Excel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Nhập dữ liệu nhóm từ file Excel của hệ thống cũ</p>
        </div>
      </div>

      <div className="glass-card" style={{ maxWidth: 700 }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Upload size={20} /> Upload file
        </h3>

        <div className="input-group">
          <label className="input-label">Chọn file Excel (.xlsx, tối đa 10MB)</label>
          <input
            type="file"
            className="input-field"
            accept=".xlsx,.xls"
            onChange={e => setFile(e.target.files?.[0] || null)}
            style={{ padding: '0.5rem' }}
            disabled={uploading || (jobId !== null && !isDone)}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ marginTop: '1rem', width: '100%' }}
          onClick={handleImport}
          disabled={!file || uploading || (jobId !== null && !isDone)}
        >
          {uploading ? <><Loader2 size={16} className="spin" /> Đang upload...</> : <><Upload size={16} /> Bắt đầu Import</>}
        </button>

        <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Import xử lý đồng bộ. Status sẽ Completed/Failed ngay lần poll đầu.
        </p>

        <button
          className="btn btn-secondary"
          style={{ marginTop: '0.5rem', width: '100%' }}
          onClick={async () => {
            if (!window.confirm('Xóa toàn bộ ImportJob? (dev only)')) return;
            try {
              const res = await api.post('/api/imports/reset');
              alert(`Đã xóa ${res.data.removed} job. Có thể import lại.`);
              setStatus(null);
              setJobId(null);
            } catch (e: any) {
              alert(e?.response?.data?.message || 'Reset thất bại');
            }
          }}
        >
          <RotateCcw size={14} /> Reset import jobs (dev)
        </button>
      </div>

      {jobId !== null && (
        <div className="glass-card" style={{ marginTop: '2rem', maxWidth: 700 }}>
          <h3 style={{ marginBottom: '1rem' }}>Trạng thái Job #{jobId}</h3>

          {!status ? (
            <p style={{ color: 'var(--text-secondary)' }}>Đang đợi kết quả...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong>Trạng thái:</strong>
                {statusLabel === 'Success' && <CheckCircle size={18} color="lightgreen" />}
                {statusLabel === 'Failed' && <XCircle size={18} color="salmon" />}
                {!isDone && <Loader2 size={18} className="spin" />}
                <span className={`badge ${statusLabel === 'Success' ? 'badge-success' : statusLabel === 'Failed' ? 'badge-warning' : ''}`}>
                  {statusLabel}
                </span>
              </div>

              {status.groupsCreated != null && (
                <div><strong>Số nhóm tạo:</strong> {status.groupsCreated}</div>
              )}
              {status.usersCreated != null && (
                <div><strong>Số user tạo:</strong> {status.usersCreated}</div>
              )}
              {status.completedAt && (
                <div><strong>Hoàn tất lúc:</strong> {new Date(status.completedAt).toLocaleString('vi-VN')}</div>
              )}
              {status.errorReport && (
                <div>
                  <strong>Báo lỗi:</strong>
                  <pre style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '1rem',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    color: 'var(--danger)',
                    whiteSpace: 'pre-wrap',
                    marginTop: '0.5rem'
                  }}>{status.errorReport}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default AdminImport;
