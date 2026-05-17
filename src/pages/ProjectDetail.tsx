import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { ProjectDetailDto } from '../types';
import { Save, FileUp, Trash2, Download, Send, CheckCircle, XCircle, Crown, FileText, Clock } from 'lucide-react';

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
  const [uploading, setUploading] = useState(false);

  const isStudentLeader = user?.role === 'StudentLeader';
  const isAdmin = user?.role === 'Admin';
  const isLecturer = user?.role === 'Lecturer';

  // Version mới nhất = draft (chưa finalize). Mọi version khác đã submit/finalize không sửa được.
  const draftVersion = project?.versions?.[0];
  const isDraftEditable = draftVersion && !draftVersion.isFinalized;

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
      <div className="topbar">
        <div>
          <h1>{project.groupCode} — {project.projectCode}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>GVHD: {project.lecturerName}</p>
        </div>
        {isAdmin && (
          <Link to={`/audit-logs?groupId=${project.groupId}`} className="btn btn-secondary">
            <Clock size={16} /> Audit Logs
          </Link>
        )}
      </div>

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

          {/* Current draft documents */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3>Tài liệu draft hiện tại</h3>
                {draftVersion && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Version {draftVersion.versionNumber} {draftVersion.isFinalized ? '(Đã finalize)' : '(Draft)'}
                  </p>
                )}
              </div>
              {isStudentLeader && isDraftEditable && project.currentDocuments.length > 0 && (
                <button className="btn btn-primary" onClick={handleSubmitVersion}>
                  <Send size={16} /> Submit Version
                </button>
              )}
            </div>

            {isStudentLeader && isDraftEditable && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="input-label">Upload file (tối đa 50MB, định dạng: .pdf .docx .doc .xlsx .pptx .zip)</label>
                  <input id="file-input" type="file" className="input-field" style={{ padding: '0.5rem' }}
                    onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
                <button className="btn btn-secondary" onClick={handleUpload} disabled={!file || uploading}>
                  <FileUp size={16} /> {uploading ? 'Đang upload...' : 'Upload'}
                </button>
              </div>
            )}

            {project.currentDocuments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Chưa có tài liệu.</p>
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
                  {project.currentDocuments.map(d => (
                    <tr key={d.id}>
                      <td><FileText size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{d.fileName}</td>
                      <td>{fmtSize(d.fileSize)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(d.createdAt).toLocaleString('vi-VN')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.3rem' }} onClick={() => handleDownloadDoc(d.id, d.fileName)} title="Download">
                            <Download size={14} />
                          </button>
                          {isStudentLeader && isDraftEditable && (
                            <button className="btn btn-danger" style={{ padding: '0.3rem' }} onClick={() => handleDeleteDoc(d.id)} title="Xóa">
                              <Trash2 size={14} />
                            </button>
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
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem' }}>Thành viên nhóm</h3>
            {project.members.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Chưa có thành viên.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {project.members.map(m => (
                  <div key={m.email} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: 6, background: 'rgba(15,23,42,0.3)' }}>
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
                  <div key={v.versionId} style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: 8,
                    padding: '0.75rem',
                    border: '1px solid var(--border-glass)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <strong>Version {v.versionNumber}</strong>
                        <span className={`badge ${v.isFinalized ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: '0.5rem' }}>
                          {v.isFinalized ? 'Finalized' : v === draftVersion ? 'Draft' : 'Submitted'}
                        </span>
                      </div>
                      <div>
                        {(isAdmin || isLecturer) && !v.isFinalized && v !== draftVersion && (
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleFinalize(v.versionId, true)}>
                            <CheckCircle size={12} /> Finalize
                          </button>
                        )}
                        {isAdmin && v.isFinalized && (
                          <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleFinalize(v.versionId, false)}>
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
