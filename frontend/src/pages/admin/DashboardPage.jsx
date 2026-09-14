import { useState, useEffect } from 'react';
import { IoPeopleOutline, IoCalendarOutline, IoTicketOutline, IoCashOutline } from 'react-icons/io5';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p || 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {[
          { icon: <IoPeopleOutline />, value: stats?.total_operators || 0, label: 'Total Operator', color: 'var(--teal)' },
          { icon: <IoPeopleOutline />, value: stats?.total_buyers || 0, label: 'Total Buyer', color: 'var(--secondary)' },
          { icon: <IoCalendarOutline />, value: stats?.total_events || 0, label: 'Total Event', color: 'var(--success)' },
          { icon: <IoTicketOutline />, value: stats?.total_tickets_sold || 0, label: 'Tiket Terjual', color: 'var(--info)' },
          { icon: <IoCashOutline />, value: formatPrice(stats?.total_revenue), label: 'Total Revenue', color: 'var(--warning)' },
        ].map((stat, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>{stat.icon}</div>
            <div className="stat-value" style={{ color: stat.color, fontSize: typeof stat.value === 'string' ? '1.3rem' : '2rem' }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Activity Log */}
      {stats?.recent_logs?.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Activity Log Terbaru</h3>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {stats.recent_logs.map((log) => (
                <div key={log.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--line)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--teal)', fontWeight: 600 }}>{log.user?.username || 'System'}</span>
                  {' — '}<span style={{ color: 'var(--ink-soft)' }}>{log.action}</span>
                  {log.description && <span style={{ color: 'var(--muted)' }}> • {log.description}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
