import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import type { HolidayTemplate } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Info,
  AlertCircle
} from 'lucide-react';

export const AdminHolidayTemplates: React.FC = () => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<HolidayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(true); // Toggle to show inactive too

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<HolidayTemplate | null>(null);
  const [modalLabel, setModalLabel] = useState('');
  const [modalIsAnnual, setModalIsAnnual] = useState(true);
  const [modalIsCompensated, setModalIsCompensated] = useState(false);
  const [modalStartMonth, setModalStartMonth] = useState<number>(1);
  const [modalStartDay, setModalStartDay] = useState<number>(1);
  const [modalDuration, setModalDuration] = useState<number>(1);
  const [modalIsActive, setModalIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [includeInactive]);

  // Fetch all templates
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/holiday-templates', {
        params: { includeInactive }
      });
      setTemplates(res.data);
    } catch (err) {
      showToast('Không thể tải danh sách mẫu ngày lễ', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setModalLabel('');
    setModalIsAnnual(true);
    setModalIsCompensated(false);
    setModalStartMonth(1);
    setModalStartDay(1);
    setModalDuration(1);
    setModalIsActive(true);
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (tmpl: HolidayTemplate) => {
    setEditingTemplate(tmpl);
    setModalLabel(tmpl.label);
    setModalIsAnnual(tmpl.isAnnual);
    setModalIsCompensated(tmpl.isCompensated);
    setModalStartMonth(tmpl.defaultStartMonth);
    setModalStartDay(tmpl.defaultStartDay);
    setModalDuration(tmpl.defaultDurationDays);
    setModalIsActive(tmpl.isActive);
    setShowModal(true);
  };

  // Soft Delete Holiday Template (Toggles isActive = false)
  const handleDelete = async (id: number, label: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ngừng kích hoạt ngày nghỉ lễ "${label}"?`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/holiday-templates/${id}`);
      showToast(`Đã ngừng hoạt động ngày lễ "${label}"`, 'success');
      fetchTemplates();
    } catch (err) {
      showToast('Ngừng kích hoạt ngày lễ thất bại', 'error');
    }
  };

  // Toggle inline active state
  const handleToggleActive = async (tmpl: HolidayTemplate) => {
    try {
      await api.put(`/api/admin/holiday-templates/${tmpl.id}`, {
        isActive: !tmpl.isActive
      });
      showToast(`Đã ${!tmpl.isActive ? 'kích hoạt' : 'tắt'} ngày lễ "${tmpl.label}"`, 'success');
      fetchTemplates();
    } catch (err) {
      showToast('Cập nhật trạng thái ngày lễ thất bại', 'error');
    }
  };

  // Handle Form Submission
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalLabel.trim()) {
      showToast('Vui lòng nhập tên ngày lễ', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        // Update Template
        await api.put(`/api/admin/holiday-templates/${editingTemplate.id}`, {
          label: modalLabel,
          isAnnual: modalIsAnnual,
          isActive: modalIsActive,
          isCompensated: modalIsCompensated,
          defaultStartMonth: modalStartMonth,
          defaultStartDay: modalStartDay,
          defaultDurationDays: modalDuration
        });
        showToast(`Đã cập nhật mẫu ngày lễ "${modalLabel}"`, 'success');
      } else {
        // Create new Template
        await api.post('/api/admin/holiday-templates', {
          label: modalLabel,
          isAnnual: modalIsAnnual,
          isCompensated: modalIsCompensated,
          defaultStartMonth: modalStartMonth,
          defaultStartDay: modalStartDay,
          defaultDurationDays: modalDuration
        });
        showToast(`Đã tạo mới mẫu ngày lễ "${modalLabel}" thành công`, 'success');
      }
      setShowModal(false);
      fetchTemplates();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lưu mẫu ngày lễ thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Helper to format date month / day representation
  const formatDayMonth = (day: number, month: number) => {
    const dStr = String(day).padStart(2, '0');
    const mStr = String(month).padStart(2, '0');
    return `${dStr}/${mStr}`;
  };

  return (
    <div className="ds-holidays-page">
      
      {/* Title Header */}
      <div className="ds-holidays-header">
        <div>
          <h1>Mẫu Ngày nghỉ lễ (Holiday Templates)</h1>
          <p className="text-muted">Định nghĩa danh mục ngày lễ thường niên để hệ thống tự động gán ngày nghỉ khi sinh lịch học kỳ</p>
        </div>
        <button className="ds-btn ds-btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Thêm mẫu ngày nghỉ</span>
        </button>
      </div>

      <div className="ds-holidays-layout">
        
        {/* Left Column: Holiday list table */}
        <div className="ds-holidays-main">
          <div className="ds-card">
            
            <div className="ds-card-header-with-filter">
              <h2>Danh mục mẫu ngày nghỉ lễ</h2>
              <div className="ds-filter-group">
                <label className="ds-checkbox-label" style={{ fontSize: '0.85rem' }}>
                  <input 
                    type="checkbox" 
                    checked={includeInactive} 
                    onChange={(e) => setIncludeInactive(e.target.checked)} 
                  />
                  <span>Hiển thị mẫu đã tắt hoạt động</span>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="ds-loading-placeholder">
                <div className="ds-skeleton" style={{ height: '40px', marginBottom: '12px' }}></div>
                <div className="ds-skeleton" style={{ height: '40px', marginBottom: '12px' }}></div>
                <div className="ds-skeleton" style={{ height: '40px' }}></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="ds-empty-state">
                <AlertCircle size={48} className="text-muted" style={{ marginBottom: '16px' }} />
                <h3>Không có mẫu ngày nghỉ nào</h3>
                <p className="text-muted">Bấm nút phía trên để tạo mẫu ngày nghỉ đầu tiên cho hệ thống.</p>
              </div>
            ) : (
              <div className="ds-table-container">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Tên ngày lễ</th>
                      <th>Ngày nghỉ (Mặc định)</th>
                      <th style={{ textAlign: 'center' }}>Số ngày nghỉ</th>
                      <th>Chu kỳ</th>
                      <th>Bù ca chấm</th>
                      <th style={{ textAlign: 'center' }}>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((tmpl) => (
                      <tr key={tmpl.id} className={!tmpl.isActive ? 'ds-row-inactive' : ''}>
                        <td style={{ fontWeight: 700 }}>{tmpl.label}</td>
                        <td className="tnum" style={{ fontWeight: 500 }}>
                          Ngày {formatDayMonth(tmpl.defaultStartDay, tmpl.defaultStartMonth)} hàng năm
                        </td>
                        <td style={{ textAlign: 'center' }} className="tnum">
                          {tmpl.defaultDurationDays} ngày
                        </td>
                        <td>
                          {tmpl.isAnnual ? (
                            <span className="ds-status-pill ongoing" style={{ fontSize: '0.75rem' }}>Thường niên</span>
                          ) : (
                            <span className="ds-status-pill finished" style={{ fontSize: '0.75rem' }}>Một lần</span>
                          )}
                        </td>
                        <td>
                          {tmpl.isCompensated ? (
                            <span className="text-success" style={{ fontWeight: 500 }}>Có bù ca</span>
                          ) : (
                            <span className="text-muted">Không bù</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            className={`ds-toggle-btn ${tmpl.isActive ? 'active' : ''}`}
                            onClick={() => handleToggleActive(tmpl)}
                            title={tmpl.isActive ? 'Bấm để tắt hoạt động' : 'Bấm để kích hoạt'}
                          >
                            <span className="ds-toggle-slider"></span>
                          </button>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="ds-action-buttons">
                            <button 
                              className="ds-action-btn edit" 
                              onClick={() => handleOpenEdit(tmpl)}
                              title="Sửa mẫu ngày lễ"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="ds-action-btn delete" 
                              onClick={() => handleDelete(tmpl.id, tmpl.label)}
                              title="Ngừng kích hoạt ngày lễ"
                              disabled={!tmpl.isActive}
                            >
                              <Trash2 size={14} />
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
        </div>

        {/* Right Column: Guidance */}
        <div className="ds-holidays-sidebar">
          <div className="ds-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Info size={20} className="text-primary" />
              <h2>Nguyên lý Tự động hóa</h2>
            </div>
            
            <div className="ds-guideline-steps">
              <div className="ds-guide-step">
                <span className="ds-step-num">1</span>
                <div>
                  <h4>Tự động gán ngày nghỉ</h4>
                  <p>Khi Admin khởi tạo hoặc tự động sinh lịch trình học kỳ (Vòng 16 tuần), hệ thống sẽ quét danh sách mẫu ngày lễ đang hoạt động (Active) để tự chèn các ngày nghỉ tương ứng.</p>
                </div>
              </div>

              <div className="ds-guide-step">
                <span className="ds-step-num">2</span>
                <div>
                  <h4>Bù ca chấm thi (Compensation)</h4>
                  <p>Với ngày lễ có tích chọn <strong>Bù ca chấm</strong>, hệ thống tự động lùi lịch kết thúc học kỳ tương ứng với số ngày nghỉ lễ để bảo vệ đủ số ca chấm tối thiểu.</p>
                </div>
              </div>

              <div className="ds-guide-step">
                <span className="ds-step-num">3</span>
                <div>
                  <h4>Chu kỳ thường niên</h4>
                  <p>Ngày lễ thường niên (Ví dụ: Quốc khánh 02/09) tự động lặp lại mỗi năm. Ngày lễ một lần (Không thường niên) chỉ áp dụng gán cho đúng năm học được khai báo tương thích.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Add / Edit Holiday Template Modal */}
      {showModal && (
        <div className="ds-modal-backdrop">
          <div className="ds-modal-container" style={{ maxWidth: '560px' }}>
            <div className="ds-modal-header">
              <h2>{editingTemplate ? `Chỉnh sửa mẫu: ${editingTemplate.label}` : 'Thêm mẫu ngày nghỉ lễ'}</h2>
              <button className="ds-modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="ds-modal-form">
              <div className="ds-form-group">
                <label className="ds-form-label">Tên ngày lễ / Kỷ niệm</label>
                <input 
                  type="text" 
                  placeholder="VD: Tết Dương lịch, Giải phóng Miền Nam..."
                  value={modalLabel}
                  onChange={(e) => setModalLabel(e.target.value)}
                  required
                  disabled={saving}
                />
              </div>

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label className="ds-form-label">Chọn tháng nghỉ lễ</label>
                  <select 
                    value={modalStartMonth} 
                    onChange={(e) => setModalStartMonth(parseInt(e.target.value, 10))}
                    required
                    disabled={saving}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>Tháng {m}</option>
                    ))}
                  </select>
                </div>

                <div className="ds-form-group">
                  <label className="ds-form-label">Chọn ngày nghỉ lễ</label>
                  <select 
                    value={modalStartDay} 
                    onChange={(e) => setModalStartDay(parseInt(e.target.value, 10))}
                    required
                    disabled={saving}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>Ngày {d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label className="ds-form-label">Số ngày nghỉ mặc định</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={30} 
                    value={modalDuration}
                    onChange={(e) => setModalDuration(parseInt(e.target.value, 10))}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="ds-form-group">
                  <label className="ds-form-label">Cơ chế ngày bù</label>
                  <div className="ds-checkbox-wrapper" style={{ marginTop: '8px' }}>
                    <label className="ds-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={modalIsCompensated} 
                        onChange={(e) => setModalIsCompensated(e.target.checked)} 
                        disabled={saving}
                      />
                      <span>Tự động bù số ngày học bị lỡ</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="ds-form-row">
                <div className="ds-form-group">
                  <label className="ds-form-label">Độ lặp chu kỳ</label>
                  <div className="ds-checkbox-wrapper" style={{ marginTop: '8px' }}>
                    <label className="ds-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={modalIsAnnual} 
                        onChange={(e) => setModalIsAnnual(e.target.checked)} 
                        disabled={saving}
                      />
                      <span>Là ngày lễ thường niên (Lặp lại hàng năm)</span>
                    </label>
                  </div>
                </div>

                {editingTemplate && (
                  <div className="ds-form-group">
                    <label className="ds-form-label">Trạng thái hoạt động</label>
                    <div className="ds-checkbox-wrapper" style={{ marginTop: '8px' }}>
                      <label className="ds-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={modalIsActive} 
                          onChange={(e) => setModalIsActive(e.target.checked)} 
                          disabled={saving}
                        />
                        <span>Đang kích hoạt (Active)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="ds-modal-footer">
                <button 
                  type="button" 
                  className="ds-btn ds-btn-secondary" 
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="ds-btn ds-btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : 'Lưu mẫu ngày nghỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded Component Styles */}
      <style>{`
        .ds-holidays-page {
          width: 100%;
          animation: ds-page-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-holidays-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .ds-holidays-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .ds-holidays-layout {
            grid-template-columns: 1fr;
          }
        }

        .ds-card-header-with-filter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 16px;
        }

        .ds-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          cursor: pointer;
        }

        .ds-checkbox-label input {
          width: 16px;
          height: 16px;
        }

        .ds-loading-placeholder {
          padding: 20px 0;
        }

        .ds-empty-state {
          padding: 48px 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .ds-empty-state h3 {
          margin-bottom: 8px;
          font-size: 1.2rem;
        }

        .ds-row-inactive td {
          opacity: 0.55;
          text-decoration: line-through;
          color: var(--color-muted);
        }

        /* Toggle switch style */
        .ds-toggle-btn {
          border: none;
          background-color: var(--color-border);
          width: 44px;
          height: 24px;
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background-color var(--transition-fast);
          display: inline-flex;
          align-items: center;
          padding: 2px;
        }

        .ds-toggle-btn.active {
          background-color: var(--color-success);
        }

        .ds-toggle-slider {
          background-color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: block;
          transition: transform var(--transition-fast);
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }

        .ds-toggle-btn.active .ds-toggle-slider {
          transform: translateX(20px);
        }

        .ds-action-buttons {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .ds-action-btn {
          border: none;
          background: var(--color-surface);
          color: var(--color-muted);
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
        }

        .ds-action-btn:hover:not(:disabled) {
          background-color: var(--color-border);
          color: var(--color-ink);
          transform: translateY(-1px);
        }

        .ds-action-btn.delete:hover:not(:disabled) {
          background-color: color-mix(in oklch, var(--color-danger) 8%, transparent);
          color: var(--color-danger);
        }

        .ds-action-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .ds-guideline-steps {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ds-guide-step {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .ds-step-num {
          background-color: color-mix(in oklch, var(--color-primary) 8%, transparent);
          color: var(--color-primary);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ds-guide-step h4 {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .ds-guide-step p {
          font-size: 0.8rem;
          color: var(--color-muted);
          line-height: 1.45;
        }

        .ds-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .ds-checkbox-wrapper {
          display: flex;
          align-items: center;
          height: 38px;
        }

        /* Modal styling */
        .ds-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(18, 18, 18, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: ds-fade-in 0.2s ease-out;
        }

        .ds-modal-container {
          background-color: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          width: 100%;
          box-shadow: var(--shadow-card-hover);
          animation: ds-modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
        }

        .ds-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-border);
        }

        .ds-modal-close {
          border: none;
          background: none;
          color: var(--color-muted);
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }

        .ds-modal-close:hover {
          background-color: var(--color-surface);
          color: var(--color-ink);
        }

        .ds-modal-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ds-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }

        @keyframes ds-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ds-modal-in {
          from {
            transform: translateY(24px) scale(0.98);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
      
    </div>
  );
};

export default AdminHolidayTemplates;
