import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Semester } from '../types';
import { 
  Search, 
  Edit2, 
  Lock, 
  Unlock, 
  X, 
  RefreshCw, 
  AlertCircle, 
  Info,
  Calendar,
  CheckCircle,
  FileText,
  ArrowUpDown
} from 'lucide-react';

interface TopicGroup {
  groupId: number;
  groupCode: string;
  projectName: string;
  leaderFullName: string;
  leaderEmail: string;
  lecturer1Name: string;
  lecturer2Name?: string;
  isFinalized: boolean;
}

interface ProjectVersion {
  versionId: number;
  versionNumber: number;
  projectNameSnapshot: string;
  createdAt: string;
  isFinalized: boolean;
}

interface ProjectDetails {
  groupId: number;
  groupCode: string;
  projectCode: string;
  projectName: string;
  description: string | null;
  lecturerName: string;
  versions: ProjectVersion[];
}

export const TopicManagement: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | ''>('');
  const [topics, setTopics] = useState<TopicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'groupCode' | 'projectName' | 'isFinalized'>('groupCode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Edit Topic Modal
  const [selectedGroup, setSelectedGroup] = useState<TopicGroup | null>(null);
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit Form Fields
  const [editProjectName, setEditProjectName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (selectedSemesterId !== '') {
      fetchTopics();
    }
  }, [selectedSemesterId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSemesterId]);

  const fetchSemesters = async () => {
    try {
      const res = await api.get('/api/admin/semesters');
      setSemesters(res.data);
      const ongoing = res.data.find((s: Semester) => s.status === 'Ongoing');
      if (ongoing) {
        setSelectedSemesterId(ongoing.id);
      } else if (res.data.length > 0) {
        setSelectedSemesterId(res.data[0].id);
      }
    } catch (err) {
      showToast('Không thể tải danh sách học kỳ', 'error');
    }
  };

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/dashboard', {
        params: { semesterId: selectedSemesterId }
      });
      setTopics(res.data || []);
    } catch (err) {
      showToast('Không thể tải danh sách đề tài', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (group: TopicGroup) => {
    setSelectedGroup(group);
    setLoadingDetails(true);
    setIsEditing(false);
    try {
      const res = await api.get(`/api/projects/${group.groupId}`);
      setDetails(res.data);
      setEditProjectName(res.data.projectName);
      setEditDescription(res.data.description || '');
    } catch (err) {
      showToast('Không thể tải chi tiết đề tài', 'error');
      setSelectedGroup(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !details) return;
    setSaving(true);
    try {
      await api.put(`/api/projects/${selectedGroup.groupId}`, {
        projectName: editProjectName,
        description: editDescription
      });
      showToast('Cập nhật thông tin đề tài thành công', 'success');
      setIsEditing(false);
      
      // Refresh details & list
      const res = await api.get(`/api/projects/${selectedGroup.groupId}`);
      setDetails(res.data);
      fetchTopics();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Cập nhật đề tài thất bại';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async (versionId: number) => {
    if (!selectedGroup) return;
    setActionLoading(true);
    try {
      await api.post(`/api/versions/${versionId}/finalize`);
      showToast('Chốt đề tài thành công!', 'success');
      
      // Refresh details & list
      const res = await api.get(`/api/projects/${selectedGroup.groupId}`);
      setDetails(res.data);
      fetchTopics();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Chốt đề tài thất bại';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfinalize = async (versionId: number) => {
    if (!selectedGroup) return;
    setActionLoading(true);
    try {
      await api.post(`/api/versions/${versionId}/unfinalize`);
      showToast('Mở chốt đề tài thành công!', 'success');
      
      // Refresh details & list
      const res = await api.get(`/api/projects/${selectedGroup.groupId}`);
      setDetails(res.data);
      fetchTopics();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Mở chốt đề tài thất bại';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTopics = topics.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      t.groupCode.toLowerCase().includes(query) ||
      t.projectName.toLowerCase().includes(query) ||
      t.leaderFullName.toLowerCase().includes(query) ||
      t.lecturer1Name.toLowerCase().includes(query)
    );
  });

  const toggleSort = (field: 'groupCode' | 'projectName' | 'isFinalized') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedTopics = [...filteredTopics].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];
    
    if (sortField === 'isFinalized') {
      valA = a.isFinalized ? 1 : 0;
      valB = b.isFinalized ? 1 : 0;
    } else {
      valA = (valA || '').toString().toLowerCase();
      valB = (valB || '').toString().toLowerCase();
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const pageSize = 5;
  const totalPages = Math.ceil(filteredTopics.length / pageSize);
  const paginatedTopics = sortedTopics.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="ds-topics-page">
      {/* Header */}
      <div className="ds-topics-header">
        <div>
          <h1>Quản lý Đề tài Đồ án</h1>
          <p className="text-muted">Xem thông tin đề tài tiếng Việt/tiếng Anh, quản lý thuyết minh và chốt trạng thái hội đồng</p>
        </div>
      </div>

      {/* Main card */}
      <div className="ds-card">
        <div className="ds-card-header" style={{ flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0 }}>Danh sách Đề tài</h2>
            <span className="ds-badge tnum">{filteredTopics.length} nhóm</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Semester dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', backgroundColor: 'var(--color-bg)' }}>
              <Calendar size={16} className="text-primary" />
              <select
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(Number(e.target.value))}
                className="ds-select-semester"
                style={{ border: 'none', background: 'none', padding: 0, outline: 'none', fontSize: '0.85rem' }}
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} ({s.season} {s.year})
                  </option>
                ))}
              </select>
            </div>

            {/* Search query */}
            <div className="ds-search-bar" style={{ margin: 0 }}>
              <Search size={16} className="ds-search-icon" />
              <input
                type="text"
                placeholder="Tìm mã nhóm, tên đề tài..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
        ) : filteredTopics.length === 0 ? (
          <div className="ds-empty-state">
            <AlertCircle size={48} className="text-muted" style={{ marginBottom: '16px' }} />
            <h3>Không tìm thấy đề tài nào</h3>
            <p className="text-muted">Chọn học kỳ khác hoặc kiểm tra lại file Excel nhập liệu.</p>
          </div>
        ) : (
          <div>
            <div className="ds-table-container">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th 
                      onClick={() => toggleSort('groupCode')} 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Mã nhóm</span>
                        <ArrowUpDown size={14} className={sortField === 'groupCode' ? 'text-primary' : 'text-muted'} />
                      </div>
                    </th>
                    <th 
                      onClick={() => toggleSort('projectName')} 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Tên đề tài đồ án</span>
                        <ArrowUpDown size={14} className={sortField === 'projectName' ? 'text-primary' : 'text-muted'} />
                      </div>
                    </th>
                    <th>GV hướng dẫn 1</th>
                    <th>GV hướng dẫn 2</th>
                    <th 
                      onClick={() => toggleSort('isFinalized')} 
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Trạng thái</span>
                        <ArrowUpDown size={14} className={sortField === 'isFinalized' ? 'text-primary' : 'text-muted'} />
                      </div>
                    </th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTopics.map((t) => (
                    <tr key={t.groupId}>
                      <td style={{ fontWeight: 700 }}>{t.groupCode}</td>
                      <td style={{ fontWeight: 500 }}>{t.projectName}</td>
                      <td>{t.lecturer1Name}</td>
                      <td>{t.lecturer2Name || <span className="text-muted">—</span>}</td>
                      <td>
                        <span className={`ds-status-pill ${t.isFinalized ? 'success' : 'draft'}`}>
                          {t.isFinalized ? 'Đã chốt' : 'Bản nháp'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="ds-btn ds-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => handleOpenDetails(t)}
                        >
                          <Info size={14} style={{ marginRight: '6px' }} />
                          <span>Xem chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="ds-pagination" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <button 
                  className="ds-btn ds-btn-secondary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Trước
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: 500 }}>
                  Trang {currentPage} / {totalPages}
                </span>
                <button 
                  className="ds-btn ds-btn-secondary" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details & Action Modal */}
      {selectedGroup && (
        <div className="ds-modal-backdrop">
          <div className="ds-modal-container" style={{ maxWidth: '640px', width: '90%', position: 'relative', zIndex: 1001 }}>
            
            <div className="ds-modal-header">
              <h2>Chi tiết đề tài - Nhóm {selectedGroup.groupCode}</h2>
              <button className="ds-modal-close" onClick={() => setSelectedGroup(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="ds-modal-body">
              {loadingDetails ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <RefreshCw size={24} className="spin text-primary" style={{ margin: '0 auto 12px auto' }} />
                  <p className="text-muted">Đang tải chi tiết đề tài...</p>
                </div>
              ) : details ? (
                <div>
                  
                  {/* Status Banner */}
                  <div className={`ds-status-banner ${details.versions.some(v => v.isFinalized) ? 'finalized' : 'draft'}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                    <CheckCircle size={20} />
                    <div>
                      <strong>Trạng thái: </strong>
                      <span>{details.versions.some(v => v.isFinalized) ? 'Đã chốt (Sẵn sàng xếp lịch hội đồng)' : 'Bản nháp (Đang cập nhật thuyết minh)'}</span>
                    </div>
                  </div>

                  {/* Metadata Fields Form / Read Mode */}
                  {!isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Tên đề tài (Tiếng Việt)</span>
                        <p style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '4px' }}>{details.projectName}</p>
                      </div>

                      <div>
                        <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Tóm tắt / Mô tả đề tài</span>
                        <p style={{ marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                          {details.description || <span className="text-muted">Chưa có mô tả thuyết minh đề tài.</span>}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '8px' }}>
                        <button className="ds-btn ds-btn-secondary" onClick={() => setIsEditing(true)}>
                          <Edit2 size={16} style={{ marginRight: '8px' }} />
                          <span>Chỉnh sửa thông tin</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveMetadata} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="ds-form-group">
                        <label htmlFor="edit-name">Tên đề tài (Tiếng Việt)</label>
                        <input
                          id="edit-name"
                          type="text"
                          value={editProjectName}
                          onChange={(e) => setEditProjectName(e.target.value)}
                          required
                          className="ds-input"
                        />
                      </div>

                      <div className="ds-form-group">
                        <label htmlFor="edit-desc">Tóm tắt / Mô tả đề tài</label>
                        <textarea
                          id="edit-desc"
                          rows={5}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="ds-input"
                          style={{ resize: 'vertical' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <button type="button" className="ds-btn ds-btn-secondary" onClick={() => setIsEditing(false)}>
                          Hủy bỏ
                        </button>
                        <button type="submit" className="ds-btn ds-btn-primary" disabled={saving}>
                          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Versions & Finalization Section */}
                  <div style={{ marginTop: '32px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <FileText size={18} className="text-primary" />
                      <span>Thuyết minh & Chốt trạng thái</span>
                    </h3>

                    {details.versions.length === 0 ? (
                      <p className="text-muted" style={{ fontStyle: 'italic' }}>Chưa có phiên bản tài liệu nào được nộp.</p>
                    ) : (
                      <div className="ds-versions-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {details.versions.map((v) => (
                          <div 
                            key={v.versionId} 
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ fontSize: '0.9rem' }}>Phiên bản #{v.versionNumber}</strong>
                                <span className={`ds-status-pill ${v.isFinalized ? 'success' : 'draft'}`} style={{ transform: 'scale(0.85)' }}>
                                  {v.isFinalized ? 'Đã chốt' : 'Bản nháp'}
                                </span>
                              </div>
                              <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                Nộp ngày: {new Date(v.createdAt).toLocaleDateString('vi-VN')} {new Date(v.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              {!v.isFinalized ? (
                                <button
                                  className="ds-btn ds-btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#16a34a' }}
                                  onClick={() => handleFinalize(v.versionId)}
                                  disabled={actionLoading}
                                >
                                  <Lock size={14} style={{ marginRight: '6px' }} />
                                  <span>Chốt đề tài</span>
                                </button>
                              ) : (
                                user?.role === 'Admin' && (
                                  <button
                                    className="ds-btn ds-btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                                    onClick={() => handleUnfinalize(v.versionId)}
                                    disabled={actionLoading}
                                  >
                                    <Unlock size={14} style={{ marginRight: '6px' }} />
                                    <span>Mở chốt</span>
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ) : null}
            </div>

          </div>
        </div>
      )}

      {/* Page CSS */}
      <style>{`
        .ds-topics-page {
          width: 100%;
          animation: ds-page-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-topics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .ds-loading-placeholder {
          padding: 24px 0;
        }

        .ds-empty-state {
          padding: 48px 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .ds-empty-state h3 {
          margin-bottom: 8px;
        }

        /* Interactive Table styling */
        .ds-table tbody tr {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), 
                      box-shadow 0.2s ease, 
                      background-color 0.2s ease;
        }

        .ds-table tbody tr:hover {
          background-color: var(--color-surface) !important;
          transform: translateX(6px);
          box-shadow: inset 3px 0 0 0 var(--color-primary), 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .ds-table th {
          transition: background-color 0.15s ease;
        }
        
        .ds-table th:hover {
          background-color: var(--color-surface);
        }

        /* Search input scaling focus */
        .ds-search-bar input {
          width: 200px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ds-search-bar input:focus {
          width: 260px;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 15%, transparent);
        }

        /* Status badges */
        .ds-status-pill.draft {
          background-color: color-mix(in oklch, var(--color-primary) 8%, transparent);
          color: var(--color-primary);
          border: 1px solid color-mix(in oklch, var(--color-primary) 20%, transparent);
          box-shadow: 0 1px 2px rgba(234, 88, 12, 0.05);
        }

        .ds-status-pill.success {
          background-color: rgba(22, 163, 74, 0.08);
          color: #16a34a;
          border: 1px solid rgba(22, 163, 74, 0.2);
          box-shadow: 0 1px 2px rgba(22, 163, 74, 0.05);
        }

        .ds-status-banner.draft {
          background-color: color-mix(in oklch, var(--color-primary) 6%, transparent);
          color: var(--color-primary);
          border: 1px solid color-mix(in oklch, var(--color-primary) 15%, transparent);
        }

        .ds-status-banner.finalized {
          background-color: rgba(22, 163, 74, 0.06);
          color: #16a34a;
          border: 1px solid rgba(22, 163, 74, 0.15);
        }

        /* Premium Glassmorphism Modal */
        .ds-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(10, 10, 10, 0.4);
          backdrop-filter: blur(12px) saturate(180%);
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
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: ds-modal-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          overflow: hidden;
          position: relative;
          z-index: 1001;
        }

        .ds-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-border);
          background-color: var(--color-surface);
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
          transition: background-color var(--transition-fast), color var(--transition-fast), transform 0.2s ease;
        }

        .ds-modal-close:hover {
          background-color: var(--color-border);
          color: var(--color-ink);
          transform: rotate(90deg);
        }

        .ds-modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .ds-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ds-form-group label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-ink);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ds-input {
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
          background-color: var(--color-bg);
          font-size: 0.95rem;
          outline: none;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .ds-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in oklch, var(--color-primary) 12%, transparent);
        }

        /* Timeline Layout for Versions */
        .ds-versions-list {
          position: relative;
          padding-left: 20px;
          border-left: 2px dashed var(--color-border);
          margin-left: 10px;
        }

        .ds-versions-list > div {
          position: relative;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .ds-versions-list > div:hover {
          transform: translateX(4px);
          border-color: var(--color-primary) !important;
        }

        /* Timeline Dot */
        .ds-versions-list > div::before {
          content: '';
          position: absolute;
          left: -27px;
          top: 50%;
          transform: translateY(-50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: var(--color-border);
          border: 3px solid var(--color-bg);
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
        }

        .ds-versions-list > div:has(.success)::before {
          background-color: #16a34a;
          box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
        }

        .ds-versions-list > div:has(.draft)::before {
          background-color: var(--color-primary);
          box-shadow: 0 0 0 2px color-mix(in oklch, var(--color-primary) 20%, transparent);
        }

        @keyframes ds-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ds-modal-in {
          from {
            transform: translateY(28px) scale(0.96);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
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

export default TopicManagement;
