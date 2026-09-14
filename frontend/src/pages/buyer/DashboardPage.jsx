import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoTicketOutline, IoReceiptOutline, IoTimeOutline } from 'react-icons/io5';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function BuyerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/buyer/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Selamat datang kembali!</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {[
          { icon: <IoTicketOutline />, value: data?.stats?.active_tickets || 0, label: 'Tiket Aktif', color: 'var(--success)' },
          { icon: <IoReceiptOutline />, value: data?.stats?.total_transactions || 0, label: 'Total Transaksi', color: 'var(--teal)' },
          { icon: <IoTimeOutline />, value: data?.stats?.pending_payments || 0, label: 'Menunggu Pembayaran', color: 'var(--warning)' },
        ].map((stat, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>{stat.icon}</div>
            <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Link to="/tickets" className="btn btn-primary">Lihat Tiket Saya</Link>
        <Link to="/history" className="btn btn-secondary">Riwayat Pembelian</Link>
        <Link to="/" className="btn btn-outline">Jelajahi Event</Link>
      </div>
    </div>
  );
}
