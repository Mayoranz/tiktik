import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoCalendarOutline, IoStatsChartOutline, IoCashOutline, IoTicketOutline, IoTimeOutline } from 'react-icons/io5';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function OperatorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/operator/stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p || 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard Operator</h1>
        <p className="page-subtitle">Kelola event dan pantau penjualan Anda</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {[
          { icon: <IoCalendarOutline />, value: stats?.total_events || 0, label: 'Total Event', color: 'var(--teal)' },
          { icon: <IoStatsChartOutline />, value: stats?.active_events || 0, label: 'Event Aktif', color: 'var(--success)' },
          { icon: <IoCashOutline />, value: formatPrice(stats?.total_revenue), label: 'Total Pendapatan', color: 'var(--secondary)' },
          { icon: <IoTimeOutline />, value: stats?.pending_transactions || 0, label: 'Pending Verifikasi', color: 'var(--warning)' },
          { icon: <IoTicketOutline />, value: stats?.total_tickets_sold || 0, label: 'Tiket Terjual', color: 'var(--info)' },
        ].map((stat, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>{stat.icon}</div>
            <div className="stat-value" style={{ color: stat.color, fontSize: typeof stat.value === 'string' ? '1.4rem' : '2rem' }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/operator/events" className="btn btn-primary">Kelola Event</Link>
        <Link to="/operator/transactions" className="btn btn-outline">Verifikasi Pembayaran</Link>
        <Link to="/operator/scanner" className="btn btn-secondary">Scan QR Ticket</Link>
      </div>
    </div>
  );
}
