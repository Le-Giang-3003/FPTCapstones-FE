import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Navigate, useNavigate } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';

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
  const { user, login } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to={routeForUser(user.role, user.groupId)} replace />;
  }

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 380, textAlign: 'center', padding: '3rem 2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--surface-glass)', padding: '1rem', borderRadius: '50%', boxShadow: 'var(--shadow-glow)' }}>
            <Shield size={44} color="var(--accent-primary)" />
          </div>
        </div>
        <h1 className="text-gradient" style={{ marginBottom: '0.25rem', fontSize: '1.6rem' }}>FPT Capstones</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <Sparkles size={14} /> Hệ thống quản lý đồ án tốt nghiệp
        </p>

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
