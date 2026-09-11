import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import type { SupportTicketDto, TicketStatus, TicketUrgency } from '../types';
import {
  URGENCY_LABEL, URGENCY_ORDER, URGENCY_BADGE,
  STATUS_LABEL, STATUS_ORDER, STATUS_BADGE, formatDateTime,
} from '../utils/ticket';
import { LifeBuoy, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

// Hàng đợi ticket của Admin. BE đã sắp sẵn: chưa xong trước, khẩn cấp cao trước, cũ trước —
// nên hàng đầu bảng luôn là việc nên làm tiếp theo, không cần người trực tự sắp.
const AdminSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [urgencyFilter, setUrgencyFilter] = useState<TicketUrgency | ''>('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Ticket đang mở trong modal xử lý
  const [selected, setSelected] = useState<SupportTicketDto | null>(null);
  const [nextStatus, setNextStatus] = useState<TicketStatus>('Open');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const load = async (targetPage = page) => {
    try {
      setLoading(true);
      setErr(null);
      const params: Record<string, string | number> = { page: targetPage, pageSize: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      if (urgencyFilter) params.urgency = urgencyFilter;
      const res = await api.get<{ items: SupportTicketDto[]; totalCount: number }>(
        '/api/support-tickets', { params },
      );
      setTickets(res.data.items);
      setTotalCount(res.data.totalCount);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Không tải được danh sách ticket.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(page); }, [page]);

  const applyFilter = () => {
    if (page === 1) load(1);
    else setPage(1);
  };

  const openTicket = (t: SupportTicketDto) => {
    setSelected(t);
    setNextStatus(t.status);
    setNote('');
    setSaveErr(null);
  };

  // BE trả về ticket sau khi cập nhật, nên chỉ thay đúng dòng đó tại chỗ.
  // Gọi lại load() ở đây sẽ bật cờ loading và cả bảng chớp qua màn "Đang tải...".
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaveErr(null);
    setSaving(true);
    try {
      const res = await api.patch<SupportTicketDto>(`/api/support-tickets/${selected.id}/status`, {
        status: nextStatus,
        note: note.trim() || null,
      });
      const updated = res.data;

      setTickets(prev => {
        // Đang lọc theo trạng thái mà ticket vừa đổi sang trạng thái khác thì nó
        // không còn thuộc danh sách đang xem nữa — bỏ khỏi bảng cho khỏi sai.
        if (statusFilter && updated.status !== statusFilter) {
          setTotalCount(c => Math.max(0, c - 1));
          return prev.filter(t => t.id !== updated.id);
        }
        return prev.map(t => (t.id === updated.id ? updated : t));
      });

      setSelected(null);
    } catch (e: any) {
      setSaveErr(e?.response?.data?.message || 'Không cập nhật được ticket.');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const isUnchanged = !!selected && nextStatus === selected.status && note.trim() === '';

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Ticket hỗ trợ</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Yêu cầu từ sinh viên và giảng viên. Đổi trạng thái, ghi chú sẽ hiện cho người gửi.
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ marginBottom: 0, minWidth: 180 }}>
          <label className="input-label">Trạng thái</label>
          <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value as TicketStatus | '')}>
            <option value="">Tất cả</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>

        <div className="input-group" style={{ marginBottom: 0, minWidth: 180 }}>
          <label className="input-label">Mức khẩn cấp</label>
          <select className="input-field" value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value as TicketUrgency | '')}>
            <option value="">Tất cả</option>
            {URGENCY_ORDER.map(u => <option key={u} value={u}>{URGENCY_LABEL[u]}</option>)}
          </select>
        </div>

        <button className="btn btn-primary" onClick={applyFilter} disabled={loading}>Lọc</button>
      </div>

      {err && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', color: 'var(--danger)' }}>{err}</div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Đang tải...</div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <LifeBuoy size={28} style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
            <p>Không có ticket nào.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Người gửi</th>
                    <th>Khẩn cấp</th>
                    <th>Trạng thái</th>
                    <th>Gửi lúc</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600, maxWidth: 320 }}>{t.title}</td>
                      <td>
                        {t.createdByName}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.createdByEmail}</div>
                      </td>
                      <td><span className={URGENCY_BADGE[t.urgency]}>{URGENCY_LABEL[t.urgency]}</span></td>
                      <td><span className={STATUS_BADGE[t.status]}>{STATUS_LABEL[t.status]}</span></td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{formatDateTime(t.createdAt)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem 0.8rem' }} onClick={() => openTicket(t)}>
                          Xử lý
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 1.5rem', borderTop: '1px solid var(--border-glass)', background: 'var(--surface-glass)',
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Trang {page}/{totalPages} · {totalCount} ticket
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}
                    onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selected && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--modal-overlay-bg)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 620, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.15rem' }}>{selected.title}</h2>
              <span className={URGENCY_BADGE[selected.urgency]}>{URGENCY_LABEL[selected.urgency]}</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {selected.createdByName} · {selected.createdByEmail} · {formatDateTime(selected.createdAt)}
            </p>

            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{selected.description}</p>

            {selected.updates.length > 0 && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selected.updates.map(u => (
                  <div key={u.id} style={{ borderLeft: '2px solid var(--border-glass)', paddingLeft: '0.9rem' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {formatDateTime(u.createdAt)} · {u.changedByName}
                      {u.fromStatus !== u.toStatus && (
                        <> · {STATUS_LABEL[u.fromStatus]} → <strong style={{ color: 'var(--text-primary)' }}>{STATUS_LABEL[u.toStatus]}</strong></>
                      )}
                    </div>
                    {u.note && <p style={{ whiteSpace: 'pre-wrap', margin: '0.3rem 0 0', fontSize: '0.88rem' }}>{u.note}</p>}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={save}>
              <div className="input-group">
                <label className="input-label">Trạng thái</label>
                <select className="input-field" value={nextStatus} onChange={e => setNextStatus(e.target.value as TicketStatus)}>
                  {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Ghi chú cho người gửi (không bắt buộc)</label>
                <textarea
                  rows={3} maxLength={2000} className="input-field"
                  placeholder="VD: Đã nâng giới hạn file lên 50MB, bạn thử lại giúp."
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              {saveErr && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem',
                }}>
                  <AlertCircle size={16} /> {saveErr}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)} disabled={saving}>
                  Đóng
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || isUnchanged}>
                  {saving ? 'Đang lưu...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminSupportTickets;
