import { useState, useEffect } from 'react';
import { IoCheckmarkCircle, IoCloseCircle } from 'react-icons/io5';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function OperatorTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  const load = () => {
    api.get('/operator/transactions', { params: { status: filter || undefined } })
      .then(({ data }) => setTransactions(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); load(); }, [filter]);

  const handleApprove = async (id) => {
    try {
      await api.post(`/operator/transactions/${id}/approve`);
      toast.success('Pembayaran disetujui! QR Ticket diterbitkan.');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal'); }
  };

  const handleReject = async (id) => {
    if (!confirm('Tolak pembayaran ini?')) return;
    try {
      await api.post(`/operator/transactions/${id}/reject`);
      toast.success('Pembayaran ditolak.');
      load();
    } catch (err) { toast.error('Gagal'); }
  };

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);
  const statusColors = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', expired: 'badge-danger' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Daftar Transaksi Pembayaran</h1>
        <p className="page-subtitle">Pembayaran diverifikasi secara otomatis melalui Midtrans Payment Gateway</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['approved', 'pending', 'rejected', ''].map((s) => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(s)}>
            {s === 'approved' ? 'Lunas (Approved)' : s === 'pending' ? 'Pending' : s === 'rejected' ? 'Ditolak/Batal' : 'Semua'}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" style={{ margin: '2rem auto' }} /> : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>ID</th><th>Buyer</th><th>Event</th><th>Total</th><th>Saluran Bayar</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>#{t.id}</td>
                  <td>{t.user?.username}<br /><span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.user?.email}</span></td>
                  <td>{t.event?.title}</td>
                  <td style={{ fontWeight: 600 }}>{formatPrice(t.total_amount)}</td>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: 'uppercase' }}>
                      {t.payment_type || 'Midtrans Snap'}
                    </span>
                  </td>
                  <td><span className={`badge ${statusColors[t.status]}`}>{t.status}</span></td>
                  <td>
                    {t.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-success btn-sm" title="Konfirmasi Manual" onClick={() => handleApprove(t.id)}><IoCheckmarkCircle /></button>
                        <button className="btn btn-danger btn-sm" title="Tolak Manual" onClick={() => handleReject(t.id)}><IoCloseCircle /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
