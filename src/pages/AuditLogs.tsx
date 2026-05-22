import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { hasRole } from '../utils/role';
import type { AuditLogDto } from '../types';
import { RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

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
  const [totalCount, setTotalCount] = useState(0);

  const isAdmin = hasRole(user?.role, 'Admin');

  const load = async (pageToLoad = currentPage) => {
    setErr(null);
    if (!isAdmin && !groupId) {
      setErr('Cần chọn nhóm để xem audit log.');
      setLogs([]);
      return;
    }
    try {
      setLoading(true);
      const query: Record<string, string | number> = {
        page: pageToLoad,
        pageSize: itemsPerPage
      };
      if (groupId) query.groupId = groupId;
      const res = await api.get<{ items: AuditLogDto[]; totalCount: number }>('/api/audit-logs', { params: query });
      setLogs(res.data.items);
      setTotalCount(res.data.totalCount);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Không tải được audit log.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const applyFilter = () => {
    if (groupId) setParams({ groupId });
    else setParams({});
    if (currentPage === 1) {
      load(1);
    } else {
      setCurrentPage(1);
    }
  };

  // Pagination Calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const displayedLogs = logs;

  const getPageNumbers = () => {
    const blockSize = 10;
    const blockIndex = Math.floor((currentPage - 1) / blockSize);
    const start = blockIndex * blockSize + 1;
    const end = Math.min(totalPages, (blockIndex + 1) * blockSize);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

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
        <div className="glass-card" style={{ marginBottom: '2rem', color: 'var(--danger)' }}>{err}</div>
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
                  Hiển thị <strong>{totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(totalCount, currentPage * itemsPerPage)}</strong> trong tổng số <strong>{totalCount}</strong> kết quả
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => {
                      const blockIndex = Math.floor((currentPage - 1) / 10);
                      setCurrentPage(Math.max(1, blockIndex * 10));
                    }}
                    disabled={currentPage <= 10}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage <= 10 ? 0.5 : 1, cursor: currentPage <= 10 ? 'not-allowed' : 'pointer' }}
                    title="Cụm trước"
                  >
                    <ChevronsLeft size={16} />
                  </button>

                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {getPageNumbers().map(page => (
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

                  <button
                    onClick={() => {
                      const blockIndex = Math.floor((currentPage - 1) / 10);
                      const nextBlockPage = (blockIndex + 1) * 10 + 1;
                      setCurrentPage(Math.min(totalPages, nextBlockPage));
                    }}
                    disabled={Math.floor((totalPages - 1) / 10) === Math.floor((currentPage - 1) / 10)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: (Math.floor((totalPages - 1) / 10) === Math.floor((currentPage - 1) / 10)) ? 0.5 : 1, cursor: (Math.floor((totalPages - 1) / 10) === Math.floor((currentPage - 1) / 10)) ? 'not-allowed' : 'pointer' }}
                    title="Cụm sau"
                  >
                    <ChevronsRight size={16} />
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
