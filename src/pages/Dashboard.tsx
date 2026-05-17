import { useState, useEffect } from 'react';
import api from '../services/api';
import type { DashboardItem } from '../types';
import { Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [data, setData] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [finalized, setFinalized] = useState<string>('');
  const [sortBy, setSortBy] = useState('newest');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { sortBy };
      if (search) params.search = search;
      if (finalized !== '') params.finalized = finalized;
      const res = await api.get<DashboardItem[]>('/api/dashboard', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchDashboard, search ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, finalized, sortBy]);

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>
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

        <div style={{ display: 'flex', gap: '1rem' }}>
          <select className="input-field" value={finalized} onChange={(e) => setFinalized(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đã finalize</option>
            <option value="false">Chưa finalize</option>
          </select>

          <select className="input-field" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 'auto' }}>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có nhóm nào.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã nhóm</th>
                  <th>Tên đề tài</th>
                  <th>Trưởng nhóm</th>
                  <th>Số version</th>
                  <th>Trạng thái</th>
                  <th>Cập nhật</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.groupId}>
                    <td><strong>{item.groupCode}</strong></td>
                    <td>{item.projectName || '—'}</td>
                    <td>
                      <div>{item.leaderFullName || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.leaderEmail}</div>
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;
