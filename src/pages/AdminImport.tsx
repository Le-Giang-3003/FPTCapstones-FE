import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Clock,
  Info
} from 'lucide-react';

interface ExcelError {
  Row: number;
  Message: string;
}

export const AdminImport: React.FC = () => {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Polling states
  const [jobId, setJobId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [groupsCreated, setGroupsCreated] = useState<number | null>(null);
  const [usersCreated, setUsersCreated] = useState<number | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [errorReport, setErrorReport] = useState<string | null>(null);
  const [parsedErrors, setParsedErrors] = useState<ExcelError[] | null>(null);
  
  // Action states
  const [resetting, setResetting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Clean up polling on unmount
  const pollingRef = useRef<any | null>(null);
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const extension = droppedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'xlsx') {
        setFile(droppedFile);
      } else {
        showToast('Chỉ chấp nhận tệp định dạng Excel (.xlsx)', 'warning');
      }
    }
  };

  // Handle Input File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Upload Excel file
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToast('Vui lòng chọn tệp Excel trước', 'warning');
      return;
    }
    
    setUploading(true);
    setJobId(null);
    setJobStatus('Pending');
    setGroupsCreated(null);
    setUsersCreated(null);
    setErrorReport(null);
    setParsedErrors(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.post('/api/imports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const newJobId = res.data.importJobId;
      setJobId(newJobId);
      showToast('Tải tệp lên thành công. Đang tiến hành phân tích...', 'success');
      startPolling(newJobId);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể tải tệp lên. Vui lòng kiểm tra lại.';
      showToast(msg, 'error');
      setJobStatus('Failed');
      setUploading(false);
    }
  };

  // Polling Status API
  const startPolling = (id: number) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/imports/${id}/status`);
        const data = res.data;
        
        setJobStatus(data.status);
        setGroupsCreated(data.groupsCreated);
        setUsersCreated(data.usersCreated);
        setCompletedAt(data.completedAt);
        
        if (data.status === 'Completed' || data.status === 'Failed') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setUploading(false);
          
          if (data.status === 'Completed') {
            showToast('Nhập dữ liệu Excel thành công!', 'success');
            setFile(null);
          } else {
            showToast('Phân tích tệp thất bại. Vui lòng kiểm tra lỗi bên dưới.', 'error');
            setErrorReport(data.errorReport);
            if (data.errorReport) {
              try {
                const parsed = JSON.parse(data.errorReport);
                setParsedErrors(parsed);
              } catch (e) {
                setParsedErrors(null);
              }
            }
          }
        }
      } catch (err) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setUploading(false);
        setJobStatus('Failed');
        showToast('Lỗi trong khi kiểm tra tiến trình nhập liệu.', 'error');
      }
    }, 1500);
  };

  // Reset import history (For Dev/Demo and re-import)
  const handleReset = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn reset dữ liệu nhập? Tác vụ này sẽ xóa lịch sử import và cho phép bạn tải lên tệp mới nếu gặp lỗi REIMPORT_NOT_ALLOWED.')) {
      return;
    }
    
    setResetting(true);
    try {
      await api.post('/api/imports/reset');
      showToast('Đã dọn dẹp lịch sử nhập dữ liệu thành công', 'success');
      setFile(null);
      setJobId(null);
      setJobStatus(null);
      setErrorReport(null);
      setParsedErrors(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      showToast('Dọn dẹp lịch sử nhập liệu thất bại', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="ds-import-page">
      
      {/* Title Header */}
      <div className="ds-import-header">
        <div>
          <h1>Nhập danh sách Nhóm Đồ án</h1>
          <p className="text-muted">Đọc tệp Excel phân bổ nhóm từ phòng đào tạo để đồng bộ sinh viên và giảng viên hướng dẫn</p>
        </div>
        <button 
          className="ds-btn ds-btn-secondary" 
          onClick={handleReset}
          disabled={resetting || uploading}
        >
          <RefreshCw size={16} className={resetting ? 'spin' : ''} />
          <span>Reset Lịch sử Nhập liệu</span>
        </button>
      </div>

      <div className="ds-import-layout">
        
        {/* Left Column: Upload box */}
        <div className="ds-import-main">
          
          {/* File Picker Card */}
          <div className="ds-card" style={{ marginBottom: '24px' }}>
            <h2>Tải tệp Excel lên</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
              Hệ thống xử lý cấu trúc sinh viên, giảng viên và tạo nhóm đồ án tự động
            </p>

            <form onSubmit={handleUpload}>
              {/* Drag and Drop Zone */}
              <div 
                className={`ds-drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx"
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                
                <div className="ds-drop-zone-content">
                  <div className="ds-drop-icon-wrapper">
                    <FileSpreadsheet size={32} />
                  </div>
                  {file ? (
                    <div className="ds-file-details">
                      <h3>{file.name}</h3>
                      <p className="tnum">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <h3>Kéo thả tệp Excel vào đây</h3>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>hoặc bấm để duyệt tệp tin từ máy tính (.xlsx)</p>
                    </div>
                  )}
                </div>
              </div>

              {file && (
                <div className="ds-upload-actions">
                  <button 
                    type="button" 
                    className="ds-btn ds-btn-secondary"
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    disabled={uploading}
                  >
                    Hủy chọn
                  </button>
                  <button 
                    type="submit" 
                    className="ds-btn ds-btn-primary"
                    disabled={uploading}
                  >
                    <Upload size={16} />
                    <span>Bắt đầu nhập dữ liệu</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Job Processing State Card */}
          {jobStatus && (
            <div className={`ds-card ds-status-card ${jobStatus.toLowerCase()}`}>
              <div className="ds-status-card-header">
                <div className="ds-status-card-title">
                  {jobStatus === 'Pending' || jobStatus === 'Processing' ? (
                    <Clock className="spin text-primary" size={24} />
                  ) : jobStatus === 'Completed' ? (
                    <CheckCircle2 className="text-success" size={24} />
                  ) : (
                    <AlertTriangle className="text-danger" size={24} />
                  )}
                  <div>
                    <h3>Trạng thái xử lý: {
                      jobStatus === 'Pending' ? 'Đang chờ xếp hàng' :
                      jobStatus === 'Processing' ? 'Đang phân tích và gán nhóm...' :
                      jobStatus === 'Completed' ? 'Nhập dữ liệu thành công!' : 'Quá trình nhập tệp thất bại'
                    }</h3>
                    <p className="text-muted tnum" style={{ fontSize: '0.8rem' }}>Mã tiến trình (Job ID): #{jobId}</p>
                  </div>
                </div>
                <span className={`ds-status-pill ${jobStatus.toLowerCase()}`}>{jobStatus}</span>
              </div>

              <div className="ds-status-card-body" style={{ marginTop: '20px' }}>
                {jobStatus === 'Processing' && (
                  <div className="ds-progress-bar-container">
                    <div className="ds-progress-bar-glow"></div>
                  </div>
                )}

                {jobStatus === 'Completed' && (
                  <div className="ds-import-metrics">
                    <div className="ds-metric-box">
                      <span className="ds-metric-val tnum">{groupsCreated ?? 0}</span>
                      <span className="ds-metric-label">Nhóm đồ án đã tạo</span>
                    </div>
                    <div className="ds-metric-box">
                      <span className="ds-metric-val tnum">{usersCreated ?? 0}</span>
                      <span className="ds-metric-label">Tài khoản sinh viên & giảng viên</span>
                    </div>
                    {completedAt && (
                      <div className="ds-metric-date">
                        <span className="text-muted">Hoàn thành lúc: </span>
                        <strong className="tnum">{new Date(completedAt).toLocaleString('vi-VN')}</strong>
                      </div>
                    )}
                  </div>
                )}

                {jobStatus === 'Failed' && (
                  <div className="ds-error-report-container">
                    <h4>Báo cáo lỗi chi tiết ({parsedErrors?.length ?? 1} lỗi):</h4>
                    {parsedErrors ? (
                      <div className="ds-error-list-scroll">
                        <table className="ds-error-table">
                          <thead>
                            <tr>
                              <th style={{ width: '80px' }}>Dòng</th>
                              <th>Mô tả chi tiết lỗi phát hiện</th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsedErrors.map((err, i) => (
                              <tr key={i}>
                                <td className="tnum text-danger" style={{ fontWeight: 700 }}>{err.Row}</td>
                                <td className="text-danger">{err.Message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="ds-raw-error-box">
                        {errorReport || 'Đã xảy ra lỗi không xác định trong quá trình phân tích file Excel.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Excel Guidelines */}
        <div className="ds-import-sidebar">
          <div className="ds-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Info size={20} className="text-primary" />
              <h2>Quy chuẩn tệp Excel</h2>
            </div>
            
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.45' }}>
              Tệp danh sách phải tuân thủ đúng định dạng bảng phân nhóm của trường để thuật toán phân nhóm hoạt động chuẩn xác:
            </p>

            <div className="ds-guideline-steps">
              <div className="ds-guide-step">
                <span className="ds-step-num">1</span>
                <div>
                  <h4>Gom nhóm theo hàng dọc</h4>
                  <p>Mỗi dòng là một sinh viên. Dòng đầu tiên của nhóm bắt buộc phải điền <strong>Mã nhóm (Cột D)</strong>, sinh viên này sẽ được tính là Trưởng nhóm. Các thành viên tiếp theo của cùng một nhóm để trống cột Mã nhóm.</p>
                </div>
              </div>

              <div className="ds-guide-step">
                <span className="ds-step-num">2</span>
                <div>
                  <h4>Khớp nối Học kỳ (Semester)</h4>
                  <p>Hệ thống tự động phân tích Mã nhóm (ví dụ: <code>GSU26_SE_01</code> &rarr; Học kỳ <code>SU26</code>) để liên kết nhóm vào học kỳ đang diễn ra.</p>
                </div>
              </div>

              <div className="ds-guide-step">
                <span className="ds-step-num">3</span>
                <div>
                  <h4>Tự động tạo email</h4>
                  <p>Cung cấp mã số sinh viên (VD: HE161234), hệ thống tự động gán đuôi email <code>@fpt.edu.vn</code> và khởi tạo tài khoản nếu chưa tồn tại.</p>
                </div>
              </div>
            </div>

            <div className="ds-divider-text" style={{ margin: '20px 0 12px 0' }}>Bản đồ cột dữ liệu</div>
            
            <div className="ds-column-map">
              <div className="ds-col-item"><span className="ds-col-badge">A</span> STT</div>
              <div className="ds-col-item"><span className="ds-col-badge">B</span> MSSV</div>
              <div className="ds-col-item"><span className="ds-col-badge">C</span> Họ và tên sinh viên</div>
              <div className="ds-col-item"><span className="ds-col-badge">D</span> Mã nhóm (Chỉ điền trưởng nhóm)</div>
              <div className="ds-col-item"><span className="ds-col-badge">E</span> Mã đề tài đồ án</div>
              <div className="ds-col-item"><span className="ds-col-badge">F</span> Tên đề tài tiếng Anh</div>
              <div className="ds-col-item"><span className="ds-col-badge">G</span> Tên đề tài tiếng Việt</div>
              <div className="ds-col-item"><span className="ds-col-badge">H</span> Giảng viên hướng dẫn 1 (GVHD1)</div>
              <div className="ds-col-item"><span className="ds-col-badge">I</span> Giảng viên hướng dẫn 2 (Tùy chọn)</div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .ds-import-page {
          width: 100%;
          animation: ds-page-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-import-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .ds-import-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .ds-import-layout {
            grid-template-columns: 1fr;
          }
        }

        .ds-drop-zone {
          border: 2px dashed var(--color-border);
          background-color: var(--color-bg);
          border-radius: var(--radius-md);
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: border-color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast);
        }

        .ds-drop-zone:hover {
          border-color: var(--color-primary);
          background-color: color-mix(in oklch, var(--color-primary) 2%, transparent);
        }

        .ds-drop-zone.active {
          border-color: var(--color-primary);
          background-color: color-mix(in oklch, var(--color-primary) 5%, transparent);
          transform: scale(0.99);
        }

        .ds-drop-zone.has-file {
          border-color: var(--color-success);
          background-color: color-mix(in oklch, var(--color-success) 2%, transparent);
        }

        .ds-drop-icon-wrapper {
          color: var(--color-muted);
          margin-bottom: 12px;
          transition: color var(--transition-fast), transform var(--transition-fast);
        }

        .ds-drop-zone:hover .ds-drop-icon-wrapper {
          color: var(--color-primary);
          transform: translateY(-2px);
        }

        .ds-drop-zone.has-file .ds-drop-icon-wrapper {
          color: var(--color-success);
        }

        .ds-file-details h3 {
          font-size: 1.1rem;
          color: var(--color-ink);
        }

        .ds-file-details p {
          font-size: 0.85rem;
          color: var(--color-muted);
          margin-top: 4px;
        }

        .ds-upload-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 16px;
        }

        .ds-status-card {
          transition: border-color var(--transition-normal);
        }

        .ds-status-card.processing {
          border-color: var(--color-primary);
        }

        .ds-status-card.completed {
          border-color: var(--color-success);
        }

        .ds-status-card.failed {
          border-color: var(--color-danger);
        }

        .ds-status-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .ds-status-card-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ds-status-card-title h3 {
          font-size: 1.15rem;
          margin-bottom: 2px;
        }

        .ds-progress-bar-container {
          width: 100%;
          height: 6px;
          background-color: var(--color-surface);
          border-radius: var(--radius-sm);
          position: relative;
          overflow: hidden;
          margin: 12px 0;
        }

        .ds-progress-bar-glow {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 50%;
          background-color: var(--color-primary);
          border-radius: var(--radius-sm);
          animation: ds-progress-move 1.5s infinite ease-in-out;
        }

        .ds-import-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 12px;
        }

        .ds-metric-box {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 16px;
          background-color: var(--color-surface);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .ds-metric-val {
          font-size: 2rem;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          color: var(--color-primary);
        }

        .ds-metric-label {
          font-size: 0.85rem;
          color: var(--color-muted);
          margin-top: 4px;
          font-weight: 500;
        }

        .ds-metric-date {
          grid-column: span 2;
          font-size: 0.85rem;
          text-align: center;
          margin-top: 8px;
        }

        .ds-error-report-container h4 {
          font-size: 0.95rem;
          color: var(--color-danger);
          margin-bottom: 12px;
        }

        .ds-error-list-scroll {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }

        .ds-error-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }

        .ds-error-table th {
          background-color: var(--color-surface);
          color: var(--color-ink);
          font-weight: 700;
          padding: 8px 12px;
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
        }

        .ds-error-table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--color-border);
          line-height: 1.4;
        }

        .ds-raw-error-box {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px;
          font-family: monospace;
          font-size: 0.8rem;
          white-space: pre-wrap;
          word-break: break-all;
        }

        /* Guidelines styling */
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
          line-height: 1.4;
        }

        .ds-column-map {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ds-col-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8rem;
          color: var(--color-ink);
          font-weight: 500;
        }

        .ds-col-badge {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-muted);
          width: 20px;
          height: 20px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .spin {
          animation: ds-spin 1s linear infinite;
        }

        @keyframes ds-progress-move {
          0% { left: -50%; }
          100% { left: 100%; }
        }

        @keyframes ds-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminImport;
