import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { GoogleLogin } from '@react-oauth/google';
import { KeyRound, Mail, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [showTestLogin, setShowTestLogin] = useState(false);
  const [loadingLocal, setLoadingLocal] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (credentialResponse.credential) {
        await loginWithGoogle(credentialResponse.credential);
        showToast('Đăng nhập thành công', 'success');
        navigate('/');
      }
    } catch (err: any) {
      showToast('Đăng nhập Google thất bại. Hãy kiểm tra cấu hình.', 'error');
    }
  };

  const handleGoogleError = () => {
    showToast('Đăng nhập Google thất bại. Vui lòng thử lại.', 'error');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Vui lòng nhập Email', 'warning');
      return;
    }
    
    setLoadingLocal(true);
    try {
      await loginWithEmail(email);
      showToast('Đăng nhập thử nghiệm thành công', 'success');
      navigate('/');
    } catch (err: any) {
      showToast('Đăng nhập thất bại. Email không tồn tại hoặc bị khóa.', 'error');
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="ds-login-container">
      <div className="ds-login-card">
        <div className="ds-login-header">
          <div className="ds-login-logo">
            <Sparkles size={32} className="ds-logo-icon" />
          </div>
          <h1>FPT Capstones</h1>
          <p>Hệ thống tự động hóa quản lý và xếp lịch chấm đồ án tốt nghiệp đại học FPT</p>
        </div>

        <div className="ds-login-actions">
          {/* Official Google OAuth Login */}
          <div className="ds-google-login-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              width="320"
            />
          </div>

          <div className="ds-divider">
            <span>HOẶC</span>
          </div>

          {/* Test Login Form Switcher */}
          <div className="ds-test-login-section">
            <button 
              className={`ds-btn ds-btn-secondary ds-login-toggle-btn ${showTestLogin ? 'ds-hidden' : ''}`}
              onClick={() => setShowTestLogin(true)}
            >
              <KeyRound size={16} />
              <span>Đăng nhập thử nghiệm (Bypass Google)</span>
            </button>

            <div className={`ds-login-form-container ${showTestLogin ? 'ds-open' : ''}`}>
              <form onSubmit={handleEmailLogin} className="ds-login-form">
                <div className="ds-form-group">
                  <label className="ds-form-label">Email thử nghiệm (Không cần mật khẩu)</label>
                  <div className="ds-input-icon-wrapper">
                    <Mail size={16} className="ds-input-icon" />
                    <input
                      type="email"
                      placeholder="VD: admin@fpt.edu.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loadingLocal}
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="ds-btn ds-btn-primary ds-login-submit-btn"
                  disabled={loadingLocal}
                >
                  {loadingLocal ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}
                </button>
                <button 
                  type="button" 
                  className="ds-btn ds-btn-secondary ds-login-back-btn" 
                  onClick={() => setShowTestLogin(false)}
                  disabled={loadingLocal}
                >
                  Quay lại
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ds-login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100vw;
          background-color: var(--color-surface);
          padding: 24px;
        }

        .ds-login-card {
          width: 100%;
          max-width: 440px;
          background-color: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 40px;
          box-shadow: var(--shadow-card-hover);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          animation: ds-login-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .ds-login-header {
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .ds-login-logo {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-md);
          background-color: rgba(234, 88, 12, 0.08);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .ds-login-header h1 {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.8rem;
          margin-bottom: 12px;
          color: var(--color-ink);
        }

        .ds-login-header p {
          font-size: 0.9rem;
          color: var(--color-muted);
          line-height: 1.5;
        }

        .ds-login-actions {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .ds-google-login-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .ds-divider {
          display: flex;
          align-items: center;
          width: 100%;
          margin: 12px 0;
          color: var(--color-border);
        }

        .ds-divider::before,
        .ds-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--color-border);
        }

        .ds-divider span {
          padding: 0 12px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 0.75rem;
          color: var(--color-muted);
        }

        .ds-login-toggle-btn {
          width: 100%;
        }

        .ds-test-login-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .ds-hidden {
          display: none !important;
        }

        .ds-login-form-container {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          width: 100%;
          transition: max-height var(--transition-normal), opacity var(--transition-normal);
        }

        .ds-login-form-container.ds-open {
          max-height: 300px;
          opacity: 1;
        }

        .ds-login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: left;
        }

        .ds-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .ds-form-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-muted);
        }

        .ds-input-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .ds-input-icon {
          position: absolute;
          left: 14px;
          color: var(--color-muted);
          pointer-events: none;
        }

        .ds-input-icon-wrapper input {
          padding-left: 42px;
        }

        .ds-login-submit-btn {
          width: 100%;
        }

        .ds-login-back-btn {
          width: 100%;
        }

        @keyframes ds-login-in {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 480px) {
          .ds-login-card {
            padding: 24px 16px;
          }
          .ds-login-logo {
            width: 48px;
            height: 48px;
          }
          .ds-login-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
