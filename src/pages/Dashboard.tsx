import { BarChart3, TrendingUp, Users, FolderKanban } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="animate-fade-in">
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Tổng quan hệ thống</p>
        </div>
      </div>

      {/* Placeholder stats cards — ready for real data */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2rem' 
      }}>
        {[
          { icon: <FolderKanban size={24} />, label: 'Tổng đề tài', value: '—', color: '#6366f1' },
          { icon: <Users size={24} />, label: 'Tổng nhóm', value: '—', color: '#f59e0b' },
          { icon: <TrendingUp size={24} />, label: 'Đã hoàn thành', value: '—', color: '#10b981' },
          { icon: <BarChart3 size={24} />, label: 'Đang thực hiện', value: '—', color: '#3b82f6' },
        ].map((card, i) => (
          <div 
            key={i}
            className="glass-card" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              padding: '1.5rem',
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `${card.color}15`,
              border: `1px solid ${card.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: card.color,
              flexShrink: 0,
            }}>
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{card.label}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty chart area placeholder */}
      <div className="glass-card" style={{ 
        minHeight: '320px', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '1rem',
        color: 'var(--text-secondary)',
      }}>
        <BarChart3 size={48} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: '1rem', fontWeight: 500 }}>Khu vực thống kê</p>
        <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Dữ liệu biểu đồ sẽ được thêm vào đây</p>
      </div>
    </div>
  );
};

export default Dashboard;
