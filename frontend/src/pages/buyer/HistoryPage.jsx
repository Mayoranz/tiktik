import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoReceiptOutline } from 'react-icons/io5';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/buyer/transactions')
      .then(({ data }) => setTransactions(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);
  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const statusMap = { pending: ['Menunggu', 'badge-warning'], approved: ['Disetujui', 'badge-success'], rejected: ['Ditolak', 'badge-danger'], expired: ['Expired', 'badge-danger'] };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Riwayat Pembelian</h1>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><IoReceiptOutline /></div>
          <p>Belum ada transaksi</p>
          <Link to="/" className="btn btn-primary">Jelajahi Event</Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event</th>
                <th>Total</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td>{t.event?.title}</td>
                  <td style={{ fontWeight: 600 }}>{formatPrice(t.total_amount)}</td>
                  <td><span className={`badge ${statusMap[t.status]?.[1]}`}>{statusMap[t.status]?.[0]}</span></td>
                  <td style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{formatDate(t.created_at)}</td>
                  <td><Link to={`/checkout/${t.id}`} className="btn btn-sm btn-secondary">Detail</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
