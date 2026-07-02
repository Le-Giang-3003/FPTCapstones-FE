import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { hasRole } from '../utils/role';
import type { ProjectDetailDto } from '../types';
import { Save, FileUp, Trash2, Download, Send, CheckCircle, XCircle, Crown, FileText } from 'lucide-react';
import { Tooltip } from '../components/Tooltip';

const fmtSize = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const ProjectDetail = () => {
  const { id } = useParams();
  const projectId = parseInt(id || '0');
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [, setUploading] = useState(false);

  const isStudentLeader = hasRole(user?.role, 'StudentLeader');
  const isAdmin = hasRole(user?.role, 'Admin');
  const isLecturer = hasRole(user?.role, 'Lecturer');


  // State for selected version (PRD: switch documents view by version)
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  // Set default selected version when project loads
  useEffect(() => {
    if (project && project.versions && project.versions.length > 0) {
      if (selectedVersionId === null || !project.versions.some(v => v.versionId === selectedVersionId)) {
        setSelectedVersionId(project.versions[0].versionId);
      }
    }
  }, [project, selectedVersionId]);

  // Version mới nhất = draft (chưa finalize). Mọi version khác đã submit/finalize không sửa được.
  const draftVersion = project?.versions?.[0];
  const selectedVersion = project?.versions?.find(v => v.versionId === selectedVersionId) || draftVersion;
  const isDraftEditable = draftVersion && !draftVersion.isFinalized;

  // We can determine if the selected version is the current active editable draft
  const isSelectedVersionDraft = selectedVersion && draftVersion && selectedVersion.versionId === draftVersion.versionId;
  
  // Trả lại logic frontend nguyên bản, đơn giản hóa tối đa.
  // Giao phó việc quyết định file nào thuộc về draft cho backend (thông qua mảng currentDocuments).
  const displayedDocuments = (isSelectedVersionDraft && project?.currentDocuments) 
    ? project.currentDocuments 
    : (selectedVersion?.documents || []);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await api.get<ProjectDetailDto>(`/api/projects/${projectId}`);
      setProject(res.data);
      setEditName(res.data.projectName);
      setEditDesc(res.data.description || '');
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Không tải được thông tin nhóm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleUpdateMeta = async () => {
    try {
      await api.put(`/api/projects/${projectId}`, { projectName: editName, description: editDesc });
      setIsEditing(false);
      fetchProject();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/api/groups/${projectId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      const input = document.getElementById('file-input') as HTMLInputElement | null;
      if (input) input.value = '';
      fetchProject();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!window.confirm('Xóa file này khỏi draft hiện tại?')) return;
    try {
      await api.delete(`/api/documents/${docId}`);
      fetchProject();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleDownloadDoc = async (docId: number, fileName: string) => {
    try {
      const res = await api.get(`/api/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Download thất bại');
    }
  };

  const handleSubmitVersion = async () => {
    if (!window.confirm('Submit version hiện tại? Sau khi submit sẽ không sửa được nữa.')) return;
    try {
      const res = await api.post(`/api/groups/${projectId}/versions/submit`);
      alert(`Đã submit Version ${res.data.versionNumber}`);
      fetchProject();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Submit thất bại');
    }
  };

  const handleFinalize = async (versionId: number, finalize: boolean) => {
    try {
      if (finalize) await api.post(`/api/versions/${versionId}/finalize`);
      else await api.post(`/api/versions/${versionId}/unfinalize`);
      fetchProject();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Thao tác thất bại');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải...</div>;
  if (err) return <div style={{ padding: '2rem', color: 'var(--accent-danger, salmon)' }}>{err}</div>;
  if (!project) return <div style={{ padding: '2rem' }}>Không tìm thấy nhóm.</div>;

  return (
    <div className="animate-fade-in">
      {/* Spacer for user profile dropdown */}
      <div className="topbar" style={{ minHeight: '3rem' }}></div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Metadata */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Thông tin đề tài</h3>
              {isStudentLeader && isDraftEditable && !isEditing && (
                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>Sửa</button>
              )}
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Tên đề tài</label>
                  <input className="input-field" value={editName} onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Mô tả</label>
                  <textarea className="input-field" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-primary" onClick={handleUpdateMeta}><Save size={16} /> Lưu</button>
                  <button className="btn btn-secondary" onClick={() => { setIsEditing(false); setEditName(project.projectName); setEditDesc(project.description || ''); }}>Hủy</button>
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>{project.projectName || '(Chưa đặt tên)'}</h2>
                <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{project.description || 'Chưa có mô tả.'}</p>
              </div>
            )}
          </div>

          {/* Version documents list */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3>Danh sách tài liệu</h3>
                {selectedVersion && (
                  <p style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
                    Đang xem: Version {selectedVersion.versionNumber} {selectedVersion.versionId === draftVersion?.versionId ? (draftVersion.isFinalized ? '(Đã finalize)' : '(Draft)') : '(Submitted)'}
                  </p>
                )}
              </div>
              {isStudentLeader && isDraftEditable && isSelectedVersionDraft && displayedDocuments.length > 0 && (
                <button className="btn btn-primary" onClick={handleSubmitVersion}>
                  <Send size={16} /> Submit Version
                </button>
              )}
            </div>

            {isStudentLeader && isDraftEditable && isSelectedVersionDraft && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  marginBottom: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 8,
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: 'rgb(251, 191, 36)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                }}>
                  Chức năng upload tài liệu đang trong quá trình phát triển và tạm thời bị vô hiệu.
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                    <label className="input-label">Upload file (tối đa 50MB, định dạng: .pdf .docx .doc .xlsx .pptx .zip)</label>
                    <input
                      id="file-input"
                      type="file"
                      className="input-field"
                      style={{ padding: '0.5rem', opacity: 0.6, cursor: 'not-allowed' }}
                      disabled
                      onChange={e => setFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Tooltip content="Tính năng đang phát triển" variant="glass-card" className="no-tooltip-hover" style={{ display: 'flex' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={handleUpload}
                      disabled
                      style={{ opacity: 0.6, cursor: 'not-allowed' }}
                    >
                      <FileUp size={16} /> Upload
                    </button>
                  </Tooltip>
                </div>
              </div>
            )}

            {displayedDocuments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Chưa có tài liệu trong version này.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tên file</th>
                    <th>Kích thước</th>
                    <th>Tải lên</th>
                    <th style={{ width: 140, textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDocuments.map(d => (
                    <tr key={d.id}>
                      <td><FileText size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{d.fileName}</td>
                      <td>{fmtSize(d.fileSize)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(d.createdAt).toLocaleString('vi-VN')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Tooltip content="Download" variant="glass-card">
                            <button className="btn btn-secondary" style={{ padding: '0.3rem' }} onClick={() => handleDownloadDoc(d.id, d.fileName)}>
                              <Download size={14} />
                            </button>
                          </Tooltip>
                          {isStudentLeader && isDraftEditable && isSelectedVersionDraft && (
                            <Tooltip content="Xóa" variant="glass-card">
                              <button className="btn btn-danger" style={{ padding: '0.3rem' }} onClick={() => handleDeleteDoc(d.id)}>
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{project.groupCode} — {project.projectCode}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>GVHD: {project.lecturerName}</p>
          </div>

          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem' }}>Thành viên nhóm</h3>
            {project.members.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Chưa có thành viên.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {project.members.map(m => (
                  <div key={m.email} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: 6, background: 'var(--table-row-bg)', border: '1px solid var(--border-glass)' }}>
                    {m.isLeader && <Crown size={14} color="gold" />}
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: m.isLeader ? 600 : 400 }}>{m.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Version history — chuyển xuống dưới Thành viên nhóm */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem' }}>Lịch sử version</h3>
            {project.versions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Chưa có version nào.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {project.versions.map(v => (
                  <div 
                    key={v.versionId} 
                    onClick={() => setSelectedVersionId(v.versionId)}
                    style={{
                      background: selectedVersionId === v.versionId ? 'var(--accent-glow)' : 'var(--table-row-bg)',
                      borderRadius: 8,
                      padding: '0.75rem',
                      border: selectedVersionId === v.versionId ? '2px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedVersionId !== v.versionId) {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedVersionId !== v.versionId) {
                        e.currentTarget.style.borderColor = 'var(--border-glass)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <strong>Version {v.versionNumber}</strong>
                        <span className={`badge ${v.isFinalized ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: '0.5rem' }}>
                          {v.isFinalized ? 'Finalized' : v.versionId === draftVersion?.versionId ? 'Draft' : 'Submitted'}
                        </span>
                      </div>
                      <div>
                        {(isAdmin || isLecturer) && !v.isFinalized && v.versionId !== draftVersion?.versionId && (
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={(e) => { e.stopPropagation(); handleFinalize(v.versionId, true); }}>
                            <CheckCircle size={12} /> Finalize
                          </button>
                        )}
                        {isAdmin && v.isFinalized && (
                          <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={(e) => { e.stopPropagation(); handleFinalize(v.versionId, false); }}>
                            <XCircle size={12} /> Un-finalize
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6 }}>
                      {v.documentCount} file • {new Date(v.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
