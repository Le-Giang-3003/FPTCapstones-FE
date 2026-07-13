import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { 
  User, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle, 
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

interface AuditLog {
  id: number;
  actorEmail: string;
  action: string;
  targetEntity: string | null;
  targetId: number | null;
  details: string | null;
  createdAt: string;
}

interface GroupOption {
  groupId: number;
  groupCode: string;
  projectName: string;
}

export const AuditLogs: React.FC = () => {
  const { showToast } = useToast();

  // Lists
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  
  // Expanded log details view
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, selectedGroupId]);

  // Fetch groups list for dropdown filter
  const fetchGroups = async () => {
    try {
      const res = await api.get('/api/dashboard');
      // res.data is a list of groups
      setGroups(res.data || []);
    } catch (err) {
      console.warn('Không thể tải danh sách nhóm cho bộ lọc', err);
    }
  };

  // Fetch paginated audit logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/audit-logs', {
        params: {
          groupId: selectedGroupId || undefined,
          page,
          pageSize
        }
      });
      // PagedResult wrapper with { items, totalCount }
      setLogs(res.data.items || []);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      showToast('Không thể tải nhật ký hệ thống', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle log details expansion
  const toggleExpandLog = (id: number) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  // Format JSON or plain text details beautifully
  const renderDetails = (detailsStr: string | null) => {
    if (!detailsStr) return <span className="text-muted">Không có chi tiết bổ sung.</span>;
    try {
      // Try to parse as JSON and pretty print
      const parsed = JSON.parse(detailsStr);
      return (
        <pre className="ds-json-block">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch (e) {
      // Fallback to text
      return <div className="ds-text-block">{detailsStr}</div>;
    }
  };

  // Format date time representation
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Parse tag type badge for action categories
  const getActionClass = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add') || act.includes('insert')) return 'action-create';
    if (act.includes('update') || act.includes('edit') || act.includes('modify') || act.includes('patch')) return 'action-update';
    if (act.includes('delete') || act.includes('remove') || act.includes('deactivate')) return 'action-delete';
    if (act.includes('import') || act.includes('upload')) return 'action-import';
    if (act.includes('schedule') || act.includes('algorithm')) return 'action-algorithm';
    return 'action-default';
  };

  // Client side query filters for Actor and Action columns
  const clientFilteredLogs = logs.filter(log => {
    const search = searchQuery.toLowerCase();
    return (
      log.actorEmail.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      (log.targetEntity && log.targetEntity.toLowerCase().includes(search))
    );
  });

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="ds-audit-page">
      
      {/* Header */}
      <div className="ds-audit-header">
        <div>
          <h1>Nhật ký Hoạt động Hệ thống (Audit Logs)</h1>
          <p className="text-muted">Theo dõi và truy vết lịch sử thực thi lệnh, thay đổi cấu hình, upload tệp tin của người dùng</p>
        </div>

        <div className="ds-header-actions">
          <button 
            className="ds-btn ds-btn-secondary" 
            onClick={fetchLogs} 
            disabled={loading}
            title="Làm mới nhật ký"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main logs list card */}
      <div className="ds-card">
        <div className="ds-card-header-with-filter">
          <h2>Bản ghi nhật ký ({totalCount})</h2>
          
          <div className="ds-filters-row">
            {/* Filter select group */}
            <select 
              value={selectedGroupId} 
              onChange={(e) => {
                const val = e.target.value;
                setSelectedGroupId(val ? parseInt(val, 10) : '');
                setPage(1);
              }}
              className="ds-select-small"
              style={{ maxWidth: '280px' }}
            >
              <option value="">-- Tất cả nhóm đồ án --</option>
              {groups.map(g => (
                <option key={g.groupId} value={g.groupId}>
                  {g.groupCode} - {g.projectName.substring(0, 30)}...
                </option>
              ))}
            </select>

            {/* Filter search actor / action */}
            <div className="ds-search-wrapper">
              <Search size={16} className="ds-search-icon" />
              <input 
                type="text" 
                placeholder="Tìm actor email, action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ds-input-search"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="ds-loading-placeholder">
            <div className="ds-skeleton" style={{ height: '48px', marginBottom: '12px' }}></div>
            <div className="ds-skeleton" style={{ height: '48px', marginBottom: '12px' }}></div>
            <div className="ds-skeleton" style={{ height: '48px' }}></div>
          </div>
        ) : clientFilteredLogs.length === 0 ? (
          <div className="ds-empty-state">
            <AlertCircle size={48} className="text-muted" style={{ marginBottom: '16px' }} />
            <h3>Không tìm thấy lịch sử hoạt động</h3>
            <p className="text-muted">Thay đổi bộ lọc hoặc chọn nhóm đồ án khác.</p>
          </div>
        ) : (
          <>
            <div className="ds-table-container">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Thời gian thực thi</th>
                    <th>Tài khoản thực hiện</th>
                    <th>Hành động</th>
                    <th>Đối tượng tác động</th>
                    <th style={{ textAlign: 'right' }}>ID đối tượng</th>
                  </tr>
                </thead>
                <tbody>
                  {clientFilteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        {/* Summary Log Row */}
                        <tr 
                          onClick={() => toggleExpandLog(log.id)}
                          className={`ds-audit-summary-row ${isExpanded ? 'expanded' : ''}`}
                        >
                          <td style={{ textAlign: 'center' }}>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </td>
                          <td className="tnum" style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <User size={14} className="text-muted" />
                              <span>{log.actorEmail}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`ds-action-badge ${getActionClass(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{log.targetEntity || <span className="text-muted">—</span>}</td>
                          <td style={{ textAlign: 'right' }} className="tnum text-muted">
                            {log.targetId !== null ? `#${log.targetId}` : <span className="text-muted">—</span>}
                          </td>
                        </tr>

                        {/* Collapsible Details Row */}
                        {isExpanded && (
                          <tr className="ds-audit-details-row">
                            <td colSpan={6}>
                              <div className="ds-audit-details-content">
                                <div className="ds-details-header">
                                  <FileText size={16} />
                                  <strong>Thông tin chi tiết dữ liệu (Audit Trace):</strong>
                                </div>
                                <div className="ds-details-body">
                                  {renderDetails(log.details)}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
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

      {/* Embedded Component CSS */}
      <style>{`
        .ds-audit-page {
          width: 100%;
          animation: ds-page-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-audit-header {
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
          width: 240px;
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

        /* Audit Row Styles */
        .ds-audit-summary-row {
          cursor: pointer;
          transition: background-color var(--transition-fast);
        }

        .ds-audit-summary-row:hover {
          background-color: var(--color-surface);
        }

        .ds-audit-summary-row.expanded {
          background-color: color-mix(in oklch, var(--color-primary) 1.5%, transparent);
        }

        /* Collapsible Detail drawer row */
        .ds-audit-details-row {
          background-color: var(--color-surface);
        }

        .ds-audit-details-row td {
          border-top: none;
          padding: 0 16px 16px 16px !important;
        }

        .ds-audit-details-content {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background-color: var(--color-bg);
          overflow: hidden;
          animation: ds-slide-down 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-details-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--color-border);
          background-color: var(--color-surface);
          font-size: 0.85rem;
        }

        .ds-details-body {
          padding: 16px;
          font-family: var(--font-mono, monospace);
        }

        .ds-json-block {
          margin: 0;
          font-size: 0.8rem;
          color: var(--color-ink);
          overflow-x: auto;
          line-height: 1.5;
          max-height: 320px;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .ds-text-block {
          font-size: 0.85rem;
          color: var(--color-ink);
          line-height: 1.5;
          font-family: inherit;
        }

        /* Action Pill Badges */
        .ds-action-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          display: inline-block;
          text-transform: capitalize;
        }

        .ds-action-badge.action-create {
          color: #16a34a;
          background-color: rgba(22, 163, 74, 0.08);
        }

        .ds-action-badge.action-update {
          color: #2563eb;
          background-color: rgba(37, 99, 235, 0.08);
        }

        .ds-action-badge.action-delete {
          color: var(--color-danger);
          background-color: color-mix(in oklch, var(--color-danger) 8%, transparent);
        }

        .ds-action-badge.action-import {
          color: #d97706;
          background-color: rgba(217, 119, 6, 0.08);
        }

        .ds-action-badge.action-algorithm {
          color: #7c3aed;
          background-color: rgba(124, 58, 237, 0.08);
        }

        .ds-action-badge.action-default {
          color: var(--color-muted);
          background-color: var(--color-surface);
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

        .spin {
          animation: ds-spin 1s linear infinite;
        }

        @keyframes ds-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes ds-slide-down {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
    </div>
  );
};

export default AuditLogs;
