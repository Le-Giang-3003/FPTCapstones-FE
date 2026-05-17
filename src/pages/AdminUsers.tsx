import { useEffect, useState } from 'react';
import api from '../services/api';
import type { UserListItem } from '../types';
import { Search, UserCheck, UserX } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get<UserListItem[]>('/api/admin/users', { params });
      setUsers(res.data);
    } catch (e) {
      console.error('Load users failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  const toggle = async (u: UserListItem) => {
    const action = u.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`${u.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} user ${u.email}?`)) return;
    try {
      setBusy(u.id);
      await api.post(`/api/admin/users/${u.id}/${action}`);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Quản lý người dùng</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Kích hoạt hoặc vô hiệu hóa tài khoản</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" className="input-field" placeholder="Tìm theo email hoặc tên..."
              style={{ paddingLeft: '2.5rem' }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <select className="input-field" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">Tất cả role</option>
          <option value="Admin">Admin</option>
          <option value="Lecturer">Lecturer</option>
          <option value="StudentLeader">Student Leader</option>
          <option value="GroupMember">Group Member</option>
        </select>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có user nào.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Trạng thái</th>
                  <th>Tạo lúc</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td><span className="badge">{u.role}</span></td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-warning'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={`btn ${u.isActive ? 'btn-danger' : 'btn-primary'}`}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        disabled={busy === u.id}
                        onClick={() => toggle(u)}
                      >
                        {u.isActive ? <><UserX size={14} /> Vô hiệu</> : <><UserCheck size={14} /> Kích hoạt</>}
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

export default AdminUsers;
