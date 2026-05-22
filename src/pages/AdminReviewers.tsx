import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import type { LecturerListItemDto, ReviewerDto } from '../types';
import { Search, Loader2, Check, ChevronLeft, ChevronRight, UserCheck, AlertCircle } from 'lucide-react';

// Admin pick lecturer làm reviewer — GLOBAL (mutate User.Role |= Reviewer).
// Auto-reset khi 1 semester chuyển Ongoing → Completed/Cancelled.
type RowState = 'none' | 'saved' | 'newPick' | 'pendingRemove';

const AdminReviewers = () => {
  const [lecturers, setLecturers] = useState<LecturerListItemDto[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [originalPicked, setOriginalPicked] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [loadingLecturers, setLoadingLecturers] = useState(false);
  const [loadingPicked, setLoadingPicked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    (async () => {
      try {
        setLoadingLecturers(true);
        const res = await api.get<LecturerListItemDto[]>('/api/admin/lecturers', { params: { page: 1, pageSize: 1000 } });
        setLecturers(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không tải được danh sách giảng viên');
      } finally {
        setLoadingLecturers(false);
      }
    })();

    (async () => {
      try {
        setLoadingPicked(true);
        const res = await api.get<ReviewerDto[]>('/api/admin/reviews/reviewers');
        const ids = new Set(res.data.map((r) => r.lecturerId));
        setPicked(ids);
        setOriginalPicked(new Set(ids));
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Không tải được danh sách reviewer');
      } finally {
        setLoadingPicked(false);
      }
    })();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const filtered = useMemo(() => {
    if (!search.trim()) return lecturers;
    const s = search.toLowerCase().trim();
    return lecturers.filter(
      (l) =>
        l.fullName.toLowerCase().includes(s) ||
        l.email.toLowerCase().includes(s) ||
        (l.code ?? '').toLowerCase().includes(s)
    );
  }, [lecturers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const displayed = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const rowState = (id: number): RowState => {
    const isPicked = picked.has(id);
    const wasSaved = originalPicked.has(id);
    if (wasSaved && isPicked) return 'saved';
    if (!wasSaved && isPicked) return 'newPick';
    if (wasSaved && !isPicked) return 'pendingRemove';
    return 'none';
  };

  const counts = useMemo(() => {
    let saved = 0, newPick = 0, pendingRemove = 0;
    for (const l of lecturers) {
      const st = rowState(l.id);
      if (st === 'saved') saved++;
      else if (st === 'newPick') newPick++;
      else if (st === 'pendingRemove') pendingRemove++;
    }
    return { saved, newPick, pendingRemove };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lecturers, picked, originalPicked]);

  const isDirty = counts.newPick > 0 || counts.pendingRemove > 0;

  const toggle = (id: number) => {
    if (saving) return;
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  const save = async () => {
    if (!isDirty || saving) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      await api.put('/api/admin/reviews/reviewers', { lecturerIds: Array.from(picked) });
      setOriginalPicked(new Set(picked));
      setSuccessMsg(`Đã lưu thêm ${counts.newPick}, gỡ ${counts.pendingRemove} reviewer.`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không lưu được danh sách reviewer');
    } finally {
      setSaving(false);
    }
  };

  const rowStyle = (state: RowState): React.CSSProperties => {
    if (state === 'saved') return { background: 'rgba(16, 185, 129, 0.10)' };           // xanh lá
    if (state === 'newPick') return { background: 'rgba(14, 165, 233, 0.12)' };          // xanh nước
    if (state === 'pendingRemove') return { background: 'rgba(239, 68, 68, 0.10)' };     // đỏ
    return {};
  };

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck size={26} color="var(--accent-primary)" /> Chọn reviewer
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Tick GV được phép đăng ký slot review. Lưu xong, GV cần đăng nhập lại để thấy mục đăng ký.
            Khi 1 kỳ kết thúc, cờ Reviewer tự gỡ.
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={!isDirty || saving}
          onClick={save}
        >
          {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
          {' '}Lưu thay đổi
        </button>
      </div>

      {error && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} color="var(--danger)" /> <span style={{ color: 'var(--danger)' }}>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '1rem', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={18} color="#10b981" /> <span style={{ color: '#10b981' }}>{successMsg}</span>
        </div>
      )}

      {/* Search + counter */}
      <div className="glass-card" style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-group" style={{ marginBottom: 0, flex: 1, minWidth: 220 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Tìm theo email, tên hoặc mã GV..."
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#43ffc0', borderRadius: 2, verticalAlign: 'middle', marginRight: 6 }} /> Đã lưu <b>{counts.saved}</b></span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#4cc6ff', borderRadius: 2, verticalAlign: 'middle', marginRight: 6 }} /> Mới tick <b>{counts.newPick}</b></span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ef4444', borderRadius: 2, verticalAlign: 'middle', marginRight: 6 }} /> Đánh dấu gỡ <b>{counts.pendingRemove}</b></span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loadingLecturers || loadingPicked ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải...</div>
        ) : lecturers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có giảng viên nào.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 50, textAlign: 'center' }}></th>
                    <th>ID</th>
                    <th>Họ tên</th>
                    <th>Mã tên</th>
                    <th>Email</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((l) => {
                    const state = rowState(l.id);
                    const checked = picked.has(l.id);
                    return (
                      <tr
                        key={l.id}
                        onClick={() => toggle(l.id)}
                        style={{ cursor: saving ? 'wait' : 'pointer', ...rowStyle(state) }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggle(l.id)}
                            disabled={saving}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td>{l.id}</td>
                        <td style={{ fontWeight: state === 'saved' || state === 'newPick' ? 600 : 400 }}>{l.fullName}</td>
                        <td>
                          {l.code ? <span className="badge badge-success">{l.code}</span> : <span className="badge badge-warning">Chưa có</span>}
                        </td>
                        <td>{l.email}</td>
                        <td>
                          {state === 'saved' && <span className="badge badge-success">Reviewer</span>}
                          {state === 'newPick' && <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9' }}>Adding</span>}
                          {state === 'pendingRemove' && <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>Removing</span>}
                          {state === 'none' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {displayed.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Không có giảng viên nào khớp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass)', background: 'var(--surface-glass)', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hiển thị <strong>{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)}</strong> / <strong>{filtered.length}</strong>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === 1 ? 0.5 : 1 }}>
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                          style={{
                            padding: '0.4rem 0.75rem',
                            minWidth: 32,
                            background: currentPage === page ? 'var(--accent-primary)' : 'transparent',
                            border: currentPage === page ? 'none' : '1px solid var(--border-glass)',
                            color: currentPage === page ? 'white' : 'var(--text-primary)',
                          }}
                        >
                          {page}
                        </button>
                      );
                    }
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} style={{ color: 'var(--text-secondary)' }}>...</span>;
                    }
                    return null;
                  })}
                  <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--border-glass)', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default AdminReviewers;
