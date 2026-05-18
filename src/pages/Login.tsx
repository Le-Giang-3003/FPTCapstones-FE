import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield, Sparkles, Mail, LogIn } from 'lucide-react';

const routeForUser = (role: string, groupId?: number | null) => {
  if (role === 'Admin' || role === 'Lecturer') return '/dashboard';
  if ((role === 'StudentLeader' || role === 'GroupMember' || role === 'Student') && groupId) {
    return `/projects/${groupId}`;
  }
  return '/no-project';
};

const formatError = (err: any) => {
  const data = err?.response?.data;
  const code = data?.code;
  const message = data?.message;
  const status = err?.response?.status;
  if (!err?.response) {
    return `Không kết nối được BE (${err?.message}). Kiểm tra HTTPS dev cert + đúng port.`;
  }
  return `Đăng nhập thất bại [${status}]${code ? ` ${code}` : ''}\n${message || err?.message || ''}`;
};

const Login = () => {
  const { user, login, loginByEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={routeForUser(user.role, user.groupId)} replace />;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setSubmitting(true);
      const u = await loginByEmail(email.trim());
      navigate(routeForUser(u.role, u.groupId), { replace: true });
    } catch (err) {
      alert(formatError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 420, textAlign: 'center', padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div style={{ background: 'var(--surface-glass)', padding: '1rem', borderRadius: '50%', boxShadow: 'var(--shadow-glow)' }}>
            <Shield size={44} color="var(--accent-primary)" />
          </div>
        </div>
        <h1 className="text-gradient" style={{ marginBottom: '0.25rem', fontSize: '1.6rem' }}>FPT Capstones</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <Sparkles size={14} /> Hệ thống quản lý đồ án tốt nghiệp
        </p>

        {/* Email login (test mode) */}
        <form onSubmit={handleEmailLogin} style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Mail size={14} /> Đăng nhập nhanh bằng email (test)
          </label>
          <input
            type="email"
            className="input-field"
            placeholder="vd: gianglse184279@fpt.edu.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            autoComplete="email"
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', justifyContent: 'center' }}
            disabled={submitting || !email.trim()}
          >
            <LogIn size={16} /> {submitting ? 'Đang đăng nhập...' : 'Đăng nhập bằng email'}
          </button>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Email phải đã được seed/import trong DB. Không yêu cầu mật khẩu.
          </p>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-glass)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>HOẶC</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-glass)' }} />
        </div>

        {/* Google OAuth */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const u = await login(credentialResponse);
                navigate(routeForUser(u.role, u.groupId), { replace: true });
              } catch (err) {
                alert(formatError(err));
              }
            }}
            onError={() => alert('Đăng nhập Google thất bại')}
            theme="filled_black"
            shape="pill"
            size="large"
            text="continue_with"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
