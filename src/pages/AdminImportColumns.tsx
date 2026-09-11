import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import type {
  ImportColumnDto,
  ImportColumnScope,
  CreateImportColumnRequest,
  UpdateImportColumnRequest,
} from '../types';
import { Columns3, Plus, Edit, Trash2, RotateCcw, Loader2, AlertCircle, X, Lock, Info } from 'lucide-react';

// Cấu hình TÊN CỘT cho import Excel (BE: ImportColumnsController).
// Parser dò header theo tên chứ không theo vị trí cột, nên sửa ở đây ăn ngay vào lần import kế tiếp —
// phòng đào tạo đổi tên cột trong file thì admin tự sửa, không cần deploy lại BE.

const SCOPES: { value: ImportColumnScope; label: string; hint: string }[] = [
  { value: 'ProjectGroup', label: 'File danh sách nhóm đồ án', hint: 'File import nhóm + sinh viên (trang Import Excel)' },
  { value: 'Lecturer', label: 'File danh sách GVHD', hint: 'File DanhSach_GVHD_*.xlsx (trang Giảng viên)' },
];

// Mirror ImportColumnCatalog của BE — chỉ dùng để gợi ý khi thêm lại cột đã xóa.
// Không tự chế khóa mới được: BE validate FieldKey và trả 400 UNKNOWN_FIELD_KEY nếu khóa lạ.
const CATALOG_KEYS: Record<ImportColumnScope, { key: string; label: string }[]> = {
  ProjectGroup: [
    { key: 'GroupCode', label: 'Mã nhóm' },
    { key: 'ProjectCode', label: 'Mã đề tài' },
    { key: 'ProjectNameEn', label: 'Tên đề tài EN' },
    { key: 'ProjectNameVi', label: 'Tên đề tài VN' },
    { key: 'StudentCode', label: 'MSSV' },
    { key: 'StudentFullName', label: 'Họ và tên' },
    { key: 'StudentEmail', label: 'Email' },
    { key: 'Gvhd1', label: 'GVHD1' },
    { key: 'Gvhd2', label: 'GVHD2' },
  ],
  Lecturer: [
    { key: 'LecturerFullName', label: 'Tên đầy đủ' },
    { key: 'LecturerCode', label: 'Mã tên' },
    { key: 'LecturerEmail', label: 'Email' },
  ],
};

interface FormState {
  fieldKey: string;
  displayName: string;
  aliases: string[];
  isRequired: boolean;
}

const blankForm: FormState = { fieldKey: '', displayName: '', aliases: [], isRequired: false };

// So alias bỏ dấu cách thừa + hoa/thường để chặn trùng ngay trên UI.
// BE còn chuẩn hóa sâu hơn (ImportTextNormalizer) nên đây chỉ là lớp lọc sơ bộ.
const aliasKey = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const AdminImportColumns = () => {
  const [all, setAll] = useState<ImportColumnDto[]>([]);
  const [scope, setScope] = useState<ImportColumnScope>('ProjectGroup');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Modal dùng chung: null = ẩn, 'new' = thêm cột, object = sửa cột đang chọn
  const [editing, setEditing] = useState<ImportColumnDto | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [aliasDraft, setAliasDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      // Không truyền scope: lấy cấu hình cả hai loại file trong 1 request, chuyển tab không cần gọi lại
      const res = await api.get<ImportColumnDto[]>('/api/admin/import-columns');
      setAll(res.data);
    } catch (e) {
      console.error('Load import columns failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(
    () => all.filter(c => c.scope === scope).sort((a, b) => a.sortOrder - b.sortOrder),
    [all, scope],
  );

  // BE trả Id=0 khi scope chưa có dòng nào trong DB (đang chạy bằng danh mục gốc).
  // Lúc đó chưa có bản ghi để PUT/DELETE — lưu sửa sẽ tự chuyển thành POST tạo mới.
  const isUnseeded = rows.length > 0 && rows.every(c => c.id === 0);

  const missingKeys = useMemo(
    () => CATALOG_KEYS[scope].filter(k => !rows.some(r => r.fieldKey.toLowerCase() === k.key.toLowerCase())),
    [rows, scope],
  );

  const openCreate = () => {
    setForm({ ...blankForm, fieldKey: missingKeys[0]?.key ?? '' });
    setAliasDraft('');
    setError(null);
    setEditing('new');
  };

  const openEdit = (c: ImportColumnDto) => {
    setForm({
      fieldKey: c.fieldKey,
      displayName: c.displayName,
      aliases: [...c.aliases],
      isRequired: c.isRequired,
    });
    setAliasDraft('');
    setError(null);
    setEditing(c);
  };

  const addAlias = (raw: string, current: string[]): string[] => {
    const trimmed = raw.trim();
    if (!trimmed) return current;
    if (current.some(a => aliasKey(a) === aliasKey(trimmed))) return current;
    return [...current, trimmed];
  };

  const handleAliasKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      setForm(f => ({ ...f, aliases: addAlias(aliasDraft, f.aliases) }));
      setAliasDraft('');
      return;
    }
    // Backspace trên ô rỗng = xóa chip cuối, thao tác quen thuộc của tag input
    if (e.key === 'Backspace' && aliasDraft === '') {
      setForm(f => ({ ...f, aliases: f.aliases.slice(0, -1) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Gộp cả phần đang gõ dở để admin không mất alias vừa nhập mà quên Enter
    const aliases = addAlias(aliasDraft, form.aliases);
    if (aliases.length === 0) { setError('Phải có ít nhất 1 tên cột'); return; }
    if (editing === 'new' && !form.fieldKey) { setError('Chọn field cần cấu hình'); return; }

    try {
      setSaving(true);

      if (editing === 'new') {
        const body: CreateImportColumnRequest = {
          scope,
          fieldKey: form.fieldKey,
          displayName: form.displayName.trim() || null,
          aliases,
          isRequired: form.isRequired,
        };
        await api.post('/api/admin/import-columns', body);
      } else if (editing) {
        const target = editing;
        let targetId = target.id;

        // Id=0 = scope chưa có dòng nào trong DB, BE đang trả danh mục gốc.
        // KHÔNG được tạo lẻ 1 dòng: parser chỉ fallback về danh mục gốc khi scope rỗng hoàn toàn,
        // có 1 dòng là nó chỉ đọc đúng cột đó và mất hết cột còn lại.
        // Seed nguyên danh mục bằng reset trước, rồi mới PUT dòng tương ứng.
        if (targetId === 0) {
          await api.post('/api/admin/import-columns/reset', null, { params: { scope: target.scope } });
          const seeded = await api.get<ImportColumnDto[]>('/api/admin/import-columns', {
            params: { scope: target.scope },
          });
          const match = seeded.data.find(
            c => c.fieldKey.toLowerCase() === target.fieldKey.toLowerCase() && c.id !== 0,
          );
          if (!match) {
            setError('Không tạo được cấu hình mặc định cho file này. Thử lại bằng nút "Khôi phục mặc định".');
            await load();
            return;
          }
          targetId = match.id;
        }

        const body: UpdateImportColumnRequest = {
          displayName: form.displayName.trim() || null,
          aliases,
          isRequired: form.isRequired,
        };
        await api.put(`/api/admin/import-columns/${targetId}`, body);
      }

      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: ImportColumnDto) => {
    if (!window.confirm(
      `Xóa cấu hình cột "${c.displayName}"?\n\nTừ lần import sau parser sẽ bỏ qua cột này. ` +
      `Có thể thêm lại bằng nút "Thêm cột".`
    )) return;
    try {
      await api.delete(`/api/admin/import-columns/${c.id}`);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleReset = async () => {
    const scopeLabel = SCOPES.find(s => s.value === scope)!.label;
    const warning = isUnseeded
      ? 'Danh mục gốc sẽ được ghi vào DB. Chưa có tùy chỉnh nào nên không mất gì.'
      : 'Mọi tên cột admin đã sửa cho file này sẽ mất, cột đã xóa sẽ được thêm lại.';
    if (!window.confirm(
      `Khôi phục cấu hình cột của "${scopeLabel}" về mặc định?\n\n${warning}`
    )) return;
    try {
      setResetting(true);
      await api.post('/api/admin/import-columns/reset', null, { params: { scope } });
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Khôi phục thất bại');
    } finally {
      setResetting(false);
    }
  };

  const modalTitle = editing === 'new'
    ? 'Thêm cột vào cấu hình'
    : `Sửa tên cột: ${editing?.displayName ?? ''}`;

  return (
    <>
      <div className="animate-fade-in">
        <div className="topbar">
          <div>
            <h1>Cấu hình cột Import Excel</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Khai báo tên header mà file Excel được phép dùng cho từng cột dữ liệu
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={resetting || loading}
              title="Xóa hết tùy chỉnh của file này và nạp lại danh mục gốc"
            >
              {resetting ? <Loader2 size={16} className="spin" /> : <RotateCcw size={16} />} Khôi phục mặc định
            </button>
            <button
              className="btn btn-primary"
              onClick={openCreate}
              disabled={loading || missingKeys.length === 0}
              title={missingKeys.length === 0 ? 'Mọi cột của file này đã được cấu hình' : undefined}
            >
              <Plus size={16} /> Thêm cột
            </button>
          </div>
        </div>

        {/* Giải thích cơ chế — admin cần hiểu sửa ở đây tác động vào đâu trước khi đụng vào */}
        <div
          className="glass-card"
          style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}
        >
          <Info size={18} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Parser đọc file theo <strong style={{ color: 'var(--text-primary)' }}>tên header</strong>, không theo vị trí cột,
            nên thứ tự và số lượng cột trong file tùy ý miễn có đủ các cột <strong style={{ color: 'var(--text-primary)' }}>Bắt buộc</strong>.
            Mỗi cột dữ liệu nhận nhiều tên header khác nhau — thêm tên mới vào đây là file kiểu cũ lẫn kiểu mới đều import được.
            Thay đổi có hiệu lực ngay từ lần import kế tiếp.
          </div>
        </div>

        {/* Tab chọn loại file — mỗi loại có bộ cột riêng, cấu hình tách biệt */}
        <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {SCOPES.map(s => (
            <button
              key={s.value}
              className={`btn ${scope === s.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setScope(s.value)}
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.15rem', padding: '0.6rem 1rem' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <Columns3 size={15} /> {s.label}
              </span>
              <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 400 }}>{s.hint}</span>
            </button>
          ))}
        </div>

        {isUnseeded && (
          <div
            className="glass-card"
            style={{
              marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              borderLeft: '4px solid var(--warning)',
            }}
          >
            <AlertCircle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              File này đang chạy bằng <strong style={{ color: 'var(--text-primary)' }}>danh mục gốc</strong> — chưa có dòng cấu hình nào trong DB.
              Import vẫn hoạt động bình thường. Lần sửa đầu tiên sẽ tự ghi toàn bộ danh mục gốc vào DB rồi mới áp thay đổi,
              nên các cột khác giữ nguyên. Muốn xóa cột thì bấm <strong style={{ color: 'var(--text-primary)' }}>Khôi phục mặc định</strong> trước.
            </div>
          </div>
        )}

        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải...</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Chưa có cột nào được cấu hình cho file này. Bấm "Khôi phục mặc định" để nạp danh mục gốc.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 200 }}>Cột dữ liệu</th>
                    <th style={{ minWidth: 320 }}>Tên header chấp nhận trong file</th>
                    <th>Bắt buộc</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(c => (
                    <tr key={`${c.scope}-${c.fieldKey}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{c.displayName}</strong>
                          {c.isCore && (
                            <span
                              className="badge"
                              title="Cột lõi: parser không chạy được nếu thiếu — không xóa và không bỏ Bắt buộc được"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                                background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                                border: '1px solid var(--border-glass)', fontSize: '0.65rem',
                              }}
                            >
                              <Lock size={10} /> Lõi
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {c.description}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {c.aliases.map(a => (
                            <span
                              key={a}
                              className="badge"
                              style={{
                                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                border: '1px solid var(--border-glass)', fontFamily: 'monospace', fontSize: '0.72rem',
                              }}
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${c.isRequired ? 'badge-success' : 'badge-warning'}`}>
                          {c.isRequired ? 'Bắt buộc' : 'Tùy chọn'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                            onClick={() => openEdit(c)}
                          >
                            <Edit size={13} /> Sửa
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{
                              padding: '0.3rem 0.55rem', fontSize: '0.75rem',
                              color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.25)',
                              opacity: c.isCore || c.id === 0 ? 0.4 : 1,
                            }}
                            disabled={c.isCore || c.id === 0}
                            title={
                              c.isCore ? 'Cột lõi không xóa được — sửa danh sách tên cột thay vì xóa'
                                : c.id === 0 ? 'Bấm "Khôi phục mặc định" để ghi cấu hình vào DB trước khi xóa'
                                  : undefined
                            }
                            onClick={() => handleDelete(c)}
                          >
                            <Trash2 size={13} /> Xóa
                          </button>
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

      {/* Modal thêm / sửa cột */}
      {editing !== null && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--modal-overlay-bg)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 620, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Columns3 size={22} color="var(--accent-primary)" />
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{modalTitle}</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Tên header được so khớp bỏ qua hoa/thường, dấu cách thừa và dấu tiếng Việt. Chỉ cần khai báo khi file dùng
              một cách gọi hoàn toàn khác.
            </p>

            <form onSubmit={handleSubmit}>
              {editing === 'new' ? (
                <div className="input-group">
                  <label className="input-label">Cột dữ liệu <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select
                    className="input-field"
                    value={form.fieldKey}
                    onChange={e => setForm({ ...form, fieldKey: e.target.value })}
                  >
                    {missingKeys.map(k => (
                      <option key={k.key} value={k.key}>{k.label} ({k.key})</option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Chỉ liệt kê các cột chưa có cấu hình. Không tạo được cột mới ngoài danh mục — parser phải có code đọc cột đó.
                  </div>
                </div>
              ) : (
                <div className="input-group">
                  <label className="input-label">Cột dữ liệu</label>
                  <input type="text" className="input-field" value={form.fieldKey} disabled readOnly />
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Nhãn hiển thị</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Để trống = dùng nhãn mặc định"
                  value={form.displayName}
                  onChange={e => setForm({ ...form, displayName: e.target.value })}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Chỉ là tên gọi trong màn hình này, không ảnh hưởng việc dò cột.
                </div>
              </div>

              {/* Tag input cho aliases — đây là phần thực sự tác động vào parser */}
              <div className="input-group">
                <label className="input-label">Tên header chấp nhận <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div
                  className="input-field"
                  style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', minHeight: 44, height: 'auto', padding: '0.5rem' }}
                >
                  {form.aliases.map(a => (
                    <span
                      key={a}
                      className="badge"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                        border: '1px solid var(--border-glass)', fontFamily: 'monospace', fontSize: '0.72rem',
                      }}
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, aliases: f.aliases.filter(x => x !== a) }))}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}
                        aria-label={`Xóa tên cột ${a}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={aliasDraft}
                    onChange={e => setAliasDraft(e.target.value)}
                    onKeyDown={handleAliasKeyDown}
                    placeholder={form.aliases.length === 0 ? 'Gõ tên cột rồi Enter...' : 'Thêm tên khác...'}
                    style={{
                      flex: 1, minWidth: 160, background: 'transparent', border: 'none',
                      outline: 'none', color: 'var(--text-primary)', fontSize: '0.85rem',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  Enter hoặc dấu phẩy để thêm. Cột nào trong file khớp <em>một trong các</em> tên này đều được nhận.
                </div>
              </div>

              {/* Cột lõi luôn bắt buộc — BE chặn nên khóa luôn ô này cho khớp */}
              <div className="input-group" style={{ padding: '0.85rem 1rem', background: 'var(--surface-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: 'var(--text-primary)',
                  cursor: editing !== 'new' && editing.isCore ? 'not-allowed' : 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={editing !== 'new' && editing.isCore ? true : form.isRequired}
                    disabled={editing !== 'new' && editing.isCore}
                    onChange={e => setForm({ ...form, isRequired: e.target.checked })}
                    style={{ accentColor: 'var(--accent-primary)', marginTop: '0.2rem' }}
                  />
                  <span>
                    <strong style={{ fontSize: '0.9rem' }}>Bắt buộc có trong file</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Bật: file thiếu cột này sẽ bị từ chối ngay, không import dòng nào.
                      Tắt: thiếu cột vẫn import, dữ liệu của cột để trống.
                      {editing !== 'new' && editing.isCore && ' Cột lõi luôn bắt buộc, không tắt được.'}
                    </div>
                  </span>
                </label>
              </div>

              {error && (
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)',
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem',
                }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)} disabled={saving}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spin" /> Đang lưu...</> : 'Lưu thay đổi'}
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

export default AdminImportColumns;
