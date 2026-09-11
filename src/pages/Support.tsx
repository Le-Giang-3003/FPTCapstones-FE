import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import type { SupportTicketDto, TicketUrgency } from '../types';
import {
  URGENCY_LABEL, URGENCY_ORDER, URGENCY_BADGE,
  STATUS_LABEL, STATUS_BADGE, formatDateTime,
} from '../utils/ticket';
import { LifeBuoy, Plus, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

const EMPTY_FORM = { title: '', description: '', urgency: 'Medium' as TicketUrgency };

// Tab Support của Student/Lecturer: gửi yêu cầu rồi theo dõi Admin xử lý tới đâu.
// Một danh sách, một nút gửi — chi tiết chỉ bung ra khi người dùng hỏi tới.
const Support = () => {
  const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await api.get<SupportTicketDto[]>('/api/support-tickets/mine');
      setTickets(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Không tải được danh sách yêu cầu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openForm = () => {
    setForm(EMPTY_FORM);
    setFormErr(null);
    setIsFormOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    setSaving(true);
    try {
      const res = await api.post<SupportTicketDto>('/api/support-tickets', {
        title: form.title.trim(),
        description: form.description.trim(),
        urgency: form.urgency,
      });
      const created = res.data;

      // Chèn thẳng vào đầu danh sách thay vì gọi lại /mine: BE sắp theo id giảm dần
      // nên vị trí này đúng, và người dùng không phải nhìn cả trang chớp lại.
      setTickets(prev => [created, ...prev]);
      setIsFormOpen(false);
      setExpandedId(created.id);      // Mở sẵn ticket vừa gửi để thấy nó đã vào hàng đợi
    } catch (e: any) {
      setFormErr(e?.response?.data?.message || 'Không gửi được yêu cầu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Hỗ trợ</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Báo lỗi hoặc xin hỗ trợ. Admin xử lý và trả kết quả ngay tại đây.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openForm}>
          <Plus size={16} /> Gửi yêu cầu
        </button>
      </div>

      {err && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', color: 'var(--danger)' }}>{err}</div>
      )}

      {loading ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>Đang tải...</div>
      ) : tickets.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <LifeBuoy size={28} style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
          <p>Bạn chưa gửi yêu cầu nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tickets.map(t => {
            const isOpen = expandedId === t.id;
            return (
              <div key={t.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedId(isOpen ? null : t.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '1rem 1.25rem', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)',
                  }}
                >
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem' }}>{t.title}</span>
                  <span className={URGENCY_BADGE[t.urgency]}>{URGENCY_LABEL[t.urgency]}</span>
                  <span className={STATUS_BADGE[t.status]}>{STATUS_LABEL[t.status]}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {formatDateTime(t.createdAt)}
                  </span>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 1.25rem 1.25rem 3rem', borderTop: '1px solid var(--border-glass)' }}>
                    <p style={{ whiteSpace: 'pre-wrap', margin: '1rem 0', fontSize: '0.9rem' }}>{t.description}</p>

                    {t.updates.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Admin chưa xử lý yêu cầu này.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {t.updates.map(u => (
                          <div key={u.id} style={{ borderLeft: '2px solid var(--border-glass)', paddingLeft: '0.9rem' }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {formatDateTime(u.createdAt)} · {u.changedByName}
                              {u.fromStatus !== u.toStatus && (
                                <> · {STATUS_LABEL[u.fromStatus]} → <strong style={{ color: 'var(--text-primary)' }}>{STATUS_LABEL[u.toStatus]}</strong></>
                              )}
                            </div>
                            {u.note && (
                              <p style={{ whiteSpace: 'pre-wrap', margin: '0.3rem 0 0', fontSize: '0.88rem' }}>{u.note}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isFormOpen && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--modal-overlay-bg)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 520, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <LifeBuoy size={22} color="var(--accent-primary)" />
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Gửi yêu cầu hỗ trợ</h2>
            </div>

            <form onSubmit={submit}>
              <div className="input-group">
                <label className="input-label">Tiêu đề <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="text" required maxLength={200} className="input-field" autoFocus
                  placeholder="VD: Không tải được file báo cáo"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Mô tả <span style={{ color: 'var(--danger)' }}>*</span></label>
                <textarea
                  required maxLength={4000} rows={5} className="input-field"
                  placeholder="Bạn đang làm gì, hệ thống báo gì, đã thử lại chưa?"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Mức khẩn cấp</label>
                <select
                  className="input-field"
                  value={form.urgency}
                  onChange={e => setForm({ ...form, urgency: e.target.value as TicketUrgency })}
                >
                  {URGENCY_ORDER.map(u => <option key={u} value={u}>{URGENCY_LABEL[u]}</option>)}
                </select>
              </div>

              {formErr && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem',
                }}>
                  <AlertCircle size={16} /> {formErr}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} disabled={saving}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang gửi...' : 'Gửi'}
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

export default Support;
