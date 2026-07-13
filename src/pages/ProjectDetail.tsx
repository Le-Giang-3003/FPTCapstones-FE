import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        navigate('/dashboard');
      });
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="ds-project-detail-stub">
      {/* Back button */}
      <button className="ds-btn ds-btn-secondary" onClick={handleBack} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} />
        <span>Quay lại Tổng quan</span>
      </button>

      {/* Main Info Card */}
      <div className="ds-card" style={{ width: '100%' }}>
        <div className="ds-detail-header">
          <div>
            <span className="ds-detail-pre-title">Đồ án Tốt nghiệp</span>
            <h1 style={{ viewTransitionName: `group-code-${id}` } as any}>
              Nhóm Đồ án: {id}
            </h1>
          </div>
          <span className="ds-status-pill success">Đang thực hiện</span>
        </div>

        <div className="ds-detail-body" style={{ marginTop: '24px' }}>
          <div className="ds-alert-box info">
            <AlertCircle size={20} className="ds-alert-icon" />
            <div className="ds-alert-content">
              <h4>Tính năng đang được phát triển</h4>
              <p>Hệ thống nộp tài liệu báo cáo, theo dõi lịch sử cập nhật phiên bản đồ án tốt nghiệp và đánh giá tiến độ của nhóm `{id}` hiện đang được xây dựng.</p>
            </div>
          </div>

          <div className="ds-placeholder-grid" style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="ds-sub-card" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px', backgroundColor: 'var(--color-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <FileText size={20} className="text-muted" />
                <h3 style={{ fontSize: '1.1rem' }}>Tài liệu đồ án</h3>
              </div>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Nơi tải lên các phiên bản tài liệu báo cáo dự án (định dạng PDF/DOCX) để hội đồng xem xét.</p>
            </div>

            <div className="ds-sub-card" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '20px', backgroundColor: 'var(--color-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <CheckCircle2 size={20} className="text-success" />
                <h3 style={{ fontSize: '1.1rem' }}>Tiến độ đánh giá</h3>
              </div>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Theo dõi kết quả đánh giá các đợt chấm điểm và ý kiến đóng góp từ các giảng viên phản biện.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ds-project-detail-stub {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
        }

        .ds-detail-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid var(--color-border);
          padding-bottom: 20px;
          width: 100%;
        }

        .ds-detail-pre-title {
          font-size: 0.85rem;
          color: var(--color-muted);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ds-detail-header h1 {
          font-size: 2rem;
          margin-top: 4px;
        }

        .ds-alert-box {
          display: flex;
          gap: 16px;
          padding: 16px 20px;
          border-radius: var(--radius-md);
          background-color: color-mix(in oklch, var(--color-primary) 8%, transparent);
          border: 1px solid color-mix(in oklch, var(--color-primary) 20%, transparent);
        }

        .ds-alert-icon {
          color: var(--color-primary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ds-alert-content h4 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 4px;
        }

        .ds-alert-content p {
          font-size: 0.9rem;
          color: var(--color-ink);
          line-height: 1.45;
        }
      `}</style>
    </div>
  );
};

export default ProjectDetail;
