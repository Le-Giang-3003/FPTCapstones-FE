import { useState, useEffect } from 'react';
import api from '../services/api';
import type { DashboardItem, SemesterListItemDto, LinkGroupsResultDto } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Search, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Link2, AlertCircle, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopicManagement = () => {
  const [data, setData] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [finalized, setFinalized] = useState<string>('');
  const [sortBy, setSortBy] = useState('newest');
  // Semester filter — '' = tất cả, hoặc semesterId (string vì select value là string)
  const [semesters, setSemesters] = useState<SemesterListItemDto[]>([]);
  const [semesterId, setSemesterId] = useState<string>('');
  const [semestersLoaded, setSemestersLoaded] = useState(false);
  const navigate = useNavigate();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // Load semesters 1 lần. Default = '' (Tất cả) để không miss nhóm chưa link với semester.
  // (Trước default Ongoing -> nhóm import nhưng chưa link semester sẽ không hiện -> dashboard trống bí ẩn)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<SemesterListItemDto[]>('/api/admin/semesters');
        setSemesters(res.data);
      } catch (err) {
        console.error('Failed to fetch semesters', err);
      } finally {
        setSemestersLoaded(true);
      }
    })();
  }, []);

  // Quick-action: gọi backfill link-groups (chỉ Admin) — dùng khi dashboard trống vì group thiếu SemesterId
  const [linking, setLinking] = useState(false);
  const handleLinkGroups = async () => {
    if (linking) return;
    try {
      setLinking(true);
      const res = await api.post<LinkGroupsResultDto>('/api/admin/semesters/link-groups', {});
      const r = res.data;
      alert(`Đã nối ${r.linked}/${r.totalUnlinked} nhóm với học kỳ tương ứng.${r.skipped > 0 ? `\n${r.skipped} nhóm chưa nối được (chưa có học kỳ tương ứng).` : ''}`);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Đồng bộ nhóm thất bại');
    } finally {
      setLinking(false);
    }
  };

  // Export đề tài ra file ZIP
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const params: Record<string, string> = {};
      if (semesterId) params.semesterId = semesterId;

      const res = await api.get('/api/export/projects', {
        params,
        responseType: 'blob',
      });

      // Lấy tên file từ Content-Disposition header, fallback tên mặc định
      const contentDisposition = res.headers['content-disposition'];
      let fileName = `Export_DeTai_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;'"\n]+)/i);
        if (match) fileName = decodeURIComponent(match[1]);
      }

      // Trigger download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const message = err?.response?.status === 404
        ? 'Không có nhóm nào để export'
        : (err?.response?.data?.message || 'Export thất bại');
      alert(message);
    } finally {
      setExporting(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { sortBy };
      if (search) params.search = search;
      if (finalized !== '') params.finalized = finalized;
      if (semesterId !== '') params.semesterId = semesterId;
      const res = await api.get<DashboardItem[]>('/api/dashboard', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch topics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Đợi semesters load xong rồi mới fetch — tránh fetch 2 lần (1 lần default, 1 lần sau khi default semester được set).
    if (!semestersLoaded) return;
    const t = setTimeout(fetchData, search ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, finalized, sortBy, semesterId, semestersLoaded]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, finalized, sortBy, semesterId]);

  // Pagination Calculations
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const displayedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <h1>Quản lý đồ án</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Danh sách nhóm đang hướng dẫn</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Tìm theo mã nhóm hoặc tên đề tài..."
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            className="input-field"
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            style={{ width: 'auto' }}
            title="Lọc theo học kỳ"
          >
            <option value="">Tất cả học kỳ</option>
            {semesters.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} ({s.status})
              </option>
            ))}
          </select>

          <select className="input-field" value={finalized} onChange={(e) => setFinalized(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đã finalize</option>
            <option value="false">Chưa finalize</option>
          </select>

          <select className="input-field" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 'auto' }}>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>

          {(isAdmin || user?.role === 'Lecturer' || user?.role === 'StudentLeader') && (
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={exporting || loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
              title="Export danh sách đề tài ra file ZIP"
            >
              <Download size={16} />
              {exporting ? 'Đang export...' : 'Export'}
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: isAdmin && semesterId !== '' ? '1rem' : 0 }}>
              {semesterId === ''
                ? (isAdmin ? 'Chưa có nhóm nào trong hệ thống. Hãy import file Excel ở mục "Import Excel".' : 'Bạn chưa có nhóm nào được phân công.')
                : `Không có nhóm nào trong học kỳ này${isAdmin ? ' (có thể nhóm đã import nhưng chưa được nối với học kỳ).' : '.'}`}
            </p>
            {isAdmin && semesterId !== '' && (
              <div style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                padding: '1rem 1.5rem', marginTop: '0.5rem',
                background: 'rgba(251, 146, 60, 0.08)',
                border: '1px solid rgba(251, 146, 60, 0.2)',
                borderRadius: '10px',
                maxWidth: 480,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <AlertCircle size={18} color="var(--accent-primary)" />
                  <strong style={{ fontSize: '0.9rem' }}>Tip cho Admin</strong>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Nhóm vừa import có thể chưa được nối với học kỳ. Bấm nút bên dưới để tự động nối theo mã nhóm (vd <code style={{ background: 'var(--surface-glass)', padding: '0.05rem 0.3rem', borderRadius: 3 }}>GSU26SE01</code> → kỳ <code style={{ background: 'var(--surface-glass)', padding: '0.05rem 0.3rem', borderRadius: 3 }}>SU26</code>).
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleLinkGroups}
                  disabled={linking}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Link2 size={14} /> {linking ? 'Đang đồng bộ...' : 'Đồng bộ nhóm theo mã'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã nhóm</th>
                    <th>Tên đề tài</th>
                    <th>Trưởng nhóm</th>
                    <th>Giảng viên hướng dẫn 1</th>
                    <th>Giảng viên hướng dẫn 2</th>
                    <th>Số version</th>
                    <th>Trạng thái</th>
                    <th>Cập nhật</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedData.map(item => (
                    <tr key={item.groupId}>
                      <td><strong>{item.groupCode}</strong></td>
                      <td>{item.projectName || '—'}</td>
                      <td>
                        <div>{item.leaderFullName || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.leaderEmail}</div>
                      </td>
                      <td>
                        <strong>{item.lecturer1Name}</strong>
                      </td>
                      <td>
                        {item.lecturer2Name ? <span>{item.lecturer2Name}</span> : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                      </td>
                      <td>{item.submittedVersionCount}</td>
                      <td>
                        <span className={`badge ${item.isFinalized ? 'badge-success' : 'badge-warning'}`}>
                          {item.isFinalized ? 'Finalized' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString('vi-VN') : '—'}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => navigate(`/projects/${item.groupId}`)}
                        >
                          <Eye size={14} /> Xem
                        </button>
                      </td>
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
                  Hiển thị <strong>{Math.min(data.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(data.length, currentPage * itemsPerPage)}</strong> trong tổng số <strong>{data.length}</strong> kết quả
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

export default TopicManagement;
