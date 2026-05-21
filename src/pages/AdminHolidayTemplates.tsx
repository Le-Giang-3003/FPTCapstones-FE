import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import type { HolidayTemplateDto } from '../types';
import { Plus, Loader2, Edit, Trash2, AlertCircle, BookmarkPlus, CheckCircle, XCircle } from 'lucide-react';

// Quản lý kho lễ chuẩn (HolidayTemplate). Tách khỏi AdminSemesters vì:
// - Template dùng chung cho mọi năm — sửa template không ảnh hưởng kỳ đã sinh
// - Có field IsAnnual riêng để auto-seed mỗi năm khi GenerateSchedule chạy

const MONTH_VI = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

interface FormState {
  label: string;
  isAnnual: boolean;
  isCompensated: boolean;
  defaultStartMonth: number;
  defaultStartDay: number;
  defaultDurationDays: number;
}

const blankForm: FormState = {
  label: '', isAnnual: true, isCompensated: true,
  defaultStartMonth: 1, defaultStartDay: 1, defaultDurationDays: 1,
};

const AdminHolidayTemplates = () => {
  const [list, setList] = useState<HolidayTemplateDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);

  // Modal create/edit dùng chung — null = ẩn, số = edit id, 'new' = create
  const [editMode, setEditMode] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get<HolidayTemplateDto[]>('/api/admin/holiday-templates', {
        params: { includeInactive },
      });
      setList(res.data);
    } catch (e) {
      console.error('Load templates failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [includeInactive]);

  const openCreate = () => {
    setForm(blankForm);
    setError(null);
    setEditMode('new');
  };

  const openEdit = (t: HolidayTemplateDto) => {
    setForm({
      label: t.label,
      isAnnual: t.isAnnual,
      isCompensated: t.isCompensated,
      defaultStartMonth: t.defaultStartMonth,
      defaultStartDay: t.defaultStartDay,
      defaultDurationDays: t.defaultDurationDays,
    });
    setError(null);
    setEditMode(t.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.label.trim()) { setError('Tên lễ không được rỗng'); return; }
    if (form.defaultStartMonth < 1 || form.defaultStartMonth > 12) { setError('Tháng phải 1-12'); return; }
    if (form.defaultStartDay < 1 || form.defaultStartDay > 31) { setError('Ngày phải 1-31'); return; }
    if (form.defaultDurationDays < 1) { setError('Số ngày phải >= 1'); return; }
    try {
      setSaving(true);
      if (editMode === 'new') {
        await api.post('/api/admin/holiday-templates', form);
      } else {
        await api.put(`/api/admin/holiday-templates/${editMode}`, form);
      }
      setEditMode(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: HolidayTemplateDto) => {
    if (!window.confirm(`Xóa template "${t.label}"? (soft-delete, có thể khôi phục bằng toggle Active)`)) return;
    try {
      await api.delete(`/api/admin/holiday-templates/${t.id}`);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xóa thất bại');
    }
  };

  return (
    <>
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Kho ngày lễ (Templates)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Định nghĩa lễ chuẩn — tự seed vào kỳ học mỗi năm nếu bật "Tự seed hằng năm"
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Tạo template
        </button>
      </div>

      {/* Toggle includeInactive */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={e => setIncludeInactive(e.target.checked)}
            style={{ accentColor: 'var(--accent-primary)' }}
          />
          <span style={{ fontSize: '0.9rem' }}>Hiện cả template đã xóa (inactive)</span>
        </label>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải...</div>
        ) : list.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Chưa có template nào. Bấm "Tạo template" để bắt đầu.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên lễ</th>
                  <th>Ngày mặc định</th>
                  <th>Số ngày</th>
                  <th>Tự seed hằng năm</th>
                  <th>Bù lịch</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map(t => (
                  <tr key={t.id} style={{ opacity: t.isActive ? 1 : 0.55 }}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{t.label}</strong>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace' }}>
                        {String(t.defaultStartDay).padStart(2, '0')}/{String(t.defaultStartMonth).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        ({MONTH_VI[t.defaultStartMonth]})
                      </span>
                    </td>
                    <td>{t.defaultDurationDays} ngày</td>
                    <td>
                      {t.isAnnual
                        ? <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={11} /> Có</span>
                        : <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={11} /> Không</span>}
                    </td>
                    <td>
                      <span className={`badge ${t.isCompensated ? 'badge-success' : 'badge-warning'}`}>
                        {t.isCompensated ? 'Có bù' : 'Không bù'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                          onClick={() => openEdit(t)}
                        >
                          <Edit size={13} /> Sửa
                        </button>
                        {t.isActive && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)' }}
                            onClick={() => handleDelete(t)}
                          >
                            <Trash2 size={13} /> Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>

      {/* Modal create / edit */}
      {editMode !== null && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.85)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 560, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <BookmarkPlus size={22} color="var(--accent-primary)" />
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
                {editMode === 'new' ? 'Tạo template ngày lễ' : 'Sửa template ngày lễ'}
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Template là định nghĩa gốc. Khi gán vào kỳ học cụ thể, admin có thể chỉnh lại ngày/duration cho phù hợp năm đó mà không ảnh hưởng template.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Tên lễ <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="text" required className="input-field"
                  placeholder="VD: Tết Nguyên Đán, 30/4 - 1/5, Quốc Khánh..."
                  value={form.label}
                  onChange={e => setForm({ ...form, label: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Tháng mặc định <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select
                    className="input-field"
                    value={form.defaultStartMonth}
                    onChange={e => setForm({ ...form, defaultStartMonth: parseInt(e.target.value, 10) })}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{MONTH_VI[m]}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Ngày mặc định <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="number" required min={1} max={31} className="input-field"
                    value={form.defaultStartDay}
                    onChange={e => setForm({ ...form, defaultStartDay: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Số ngày nghỉ <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="number" required min={1} className="input-field"
                    value={form.defaultDurationDays}
                    onChange={e => setForm({ ...form, defaultDurationDays: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>

              {/* Toggle isAnnual */}
              <div className="input-group" style={{ padding: '0.85rem 1rem', background: 'var(--surface-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={form.isAnnual}
                    onChange={e => setForm({ ...form, isAnnual: e.target.checked })}
                    style={{ accentColor: 'var(--accent-primary)', marginTop: '0.2rem' }}
                  />
                  <span>
                    <strong style={{ fontSize: '0.9rem' }}>Tự động seed hằng năm</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Khi tạo kỳ học mới qua "Generate schedule", lễ này sẽ tự được thêm vào nếu rơi trong khoảng kỳ học (admin có thể chỉnh ngày lại sau).
                      Tắt nếu lễ này chỉ áp 1 lần.
                    </div>
                  </span>
                </label>
              </div>

              {/* Toggle isCompensated */}
              <div className="input-group" style={{ padding: '0.85rem 1rem', background: 'var(--surface-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={form.isCompensated}
                    onChange={e => setForm({ ...form, isCompensated: e.target.checked })}
                    style={{ accentColor: 'var(--accent-primary)', marginTop: '0.2rem' }}
                  />
                  <span>
                    <strong style={{ fontSize: '0.9rem' }}>Có bù lịch (kỳ học kéo dài thêm)</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Nếu bật, khi gắn vào kỳ học, EndDate kỳ học sẽ được kéo dài thêm số ngày nghỉ. Tắt nếu các ngày này coi như mất.
                    </div>
                  </span>
                </label>
              </div>

              {error && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditMode(null)} disabled={saving}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spin" /> Đang lưu...</> : (editMode === 'new' ? 'Tạo template' : 'Lưu thay đổi')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AdminHolidayTemplates;
