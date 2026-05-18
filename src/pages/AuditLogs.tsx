import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { AuditLogDto } from '../types';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const AuditLogs = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialGroup = params.get('groupId') || '';
  const [groupId, setGroupId] = useState<string>(initialGroup);
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isAdmin = user?.role === 'Admin';

  const load = async () => {
    setErr(null);
    setCurrentPage(1); // Reset to first page on load
    if (!isAdmin && !groupId) {
      setErr('Cần chọn nhóm để xem audit log.');
      setLogs([]);
      return;
    }
    try {
      setLoading(true);
      const query: Record<string, string> = { pageSize: '100' };
      if (groupId) query.groupId = groupId;
      const res = await api.get<AuditLogDto[]>('/api/audit-logs', { params: query });
      setLogs(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Không tải được audit log.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilter = () => {
    if (groupId) setParams({ groupId });
    else setParams({});
    setCurrentPage(1); // Reset to first page on filter
    load();
  };

  // Pagination Calculations
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const displayedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Audit Logs</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isAdmin ? 'Toàn hệ thống — có thể lọc theo nhóm' : 'Trong phạm vi nhóm của bạn'}
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
          <label className="input-label">Group ID {isAdmin ? '(để trống = xem tất cả)' : '(bắt buộc)'}</label>
          <input
            type="number"
            className="input-field"
            placeholder="VD: 1"
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilter()}
          />
        </div>
        <button className="btn btn-primary" onClick={applyFilter} disabled={loading}>
          <RefreshCw size={16} /> Lọc
        </button>
      </div>

      {err && (
        <div className="glass-card" style={{ marginBottom: '2rem', color: 'salmon' }}>{err}</div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Đang tải...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có log.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLogs.map(l => (
                    <tr key={l.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleString('vi-VN')}</td>
                      <td>{l.actorEmail}</td>
                      <td><span className="badge">{l.action}</span></td>
                      <td>{l.targetEntity ? `${l.targetEntity}#${l.targetId ?? ''}` : '—'}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{l.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '1rem 1.5rem', 
                borderTop: '1px solid var(--border-glass)',
                background: 'var(--surface-glass)',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiển thị <strong>{Math.min(logs.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(logs.length, currentPage * itemsPerPage)}</strong> trong tổng số <strong>{logs.length}</strong> kết quả
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ 
                        padding: '0.4rem 0.75rem', 
                        minWidth: '32px',
                        background: currentPage === page ? 'var(--accent-primary)' : 'transparent',
                        border: currentPage === page ? 'none' : '1px solid var(--border-glass)',
                        color: currentPage === page ? 'white' : 'var(--text-primary)'
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
