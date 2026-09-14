import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    api.get(`/buyer/transactions/${id}`)
      .then(({ data }) => setTransaction(data.data))
      .catch(() => toast.error('Transaksi tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [id]);

  // Payment countdown
  useEffect(() => {
    if (!transaction?.expires_at || transaction.status !== 'pending') return;
    const timer = setInterval(() => {
      const diff = new Date(transaction.expires_at) - new Date();
      if (diff <= 0) { setTimeLeft(null); clearInterval(timer); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [transaction]);

  const [syncing, setSyncing] = useState(false);

  const syncStatus = async (showToast = true) => {
    setSyncing(true);
    try {
      const { data } = await api.post(`/buyer/transactions/${id}/sync-midtrans`);
      setTransaction(data.data);
      if (showToast) {
        if (data.data.status === 'approved') {
          toast.success('Pembayaran terverifikasi lunas!');
        } else {
          toast(data.message || 'Status pembayaran diperbarui', { icon: 'ℹ️' });
        }
      }
    } catch (err) {
      if (showToast) toast.error('Gagal mengecek status pembayaran');
    } finally {
      setSyncing(false);
    }
  };

  const handlePayMidtrans = () => {
    if (!transaction?.snap_token) {
      toast.error('Token pembayaran Midtrans tidak ditemukan.');
      return;
    }

    if (window.snap) {
      window.snap.pay(transaction.snap_token, {
        onSuccess: function () {
          toast.success('Pembayaran berhasil!');
          syncStatus(false);
        },
        onPending: function () {
          toast('Menunggu pembayaran Midtrans diselesaikan.', { icon: '⏳' });
          syncStatus(false);
        },
        onError: function () {
          toast.error('Pembayaran gagal.');
          syncStatus(false);
        },
        onClose: function () {
          syncStatus(false);
        }
      });
    } else if (transaction.snap_url) {
      window.location.href = transaction.snap_url;
    } else {
      toast.error('Sistem pembayaran Midtrans belum siap.');
    }
  };

  const formatPrice = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p);
  const statusBadge = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', expired: 'badge-danger' };

  if (loading) return <LoadingSpinner />;
  if (!transaction) return <div className="empty-state"><p>Transaksi tidak ditemukan</p></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Checkout</h1>
        <p className="page-subtitle">Transaksi #{transaction.id}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
        <div>
          {/* Order Summary */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <h3 style={{ marginBottom: '1rem' }}>Ringkasan Pesanan</h3>
              <p style={{ color: 'var(--ink-soft)', marginBottom: '1rem' }}>
                {transaction.event?.title}
              </p>
              {transaction.items?.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--line)' }}>
                  <span>{item.ticket_type?.name} × {item.quantity}</span>
                  <span>{formatPrice(item.subtotal)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', fontWeight: 700, fontSize: '1.2rem' }}>
                <span>Total</span>
                <span style={{ color: 'var(--teal)' }}>{formatPrice(transaction.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Midtrans Info Card */}
          {transaction.status === 'pending' && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-body">
                <h3 style={{ marginBottom: '0.75rem' }}>Metode Pembayaran Instan</h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  Pembayaran otomatis terverifikasi secara real-time via Midtrans Payment Gateway. Tiket QR akan diterbitkan seketika setelah pembayaran berhasil.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <span className="badge badge-primary">QRIS / GoPay / ShopeePay</span>
                  <span className="badge badge-info">BCA / Mandiri / BRI / BNI Virtual Account</span>
                  <span className="badge badge-warning">Kartu Kredit / Debit</span>
                  <span className="badge badge-success">Indomaret / Alfamart</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    className="btn btn-primary btn-block btn-lg"
                    onClick={handlePayMidtrans}
                    style={{
                      background: 'var(--teal)',
                      boxShadow: '0 4px 20px rgba(0, 181, 241, 0.4)',
                      fontSize: '1.1rem',
                      padding: '1rem',
                    }}
                  >
                    💳 Bayar Sekarang ({formatPrice(transaction.total_amount)})
                  </button>

                  <button
                    className="btn btn-secondary btn-block"
                    onClick={() => syncStatus(true)}
                    disabled={syncing}
                  >
                    {syncing ? 'Mengecek ke Midtrans...' : '🔄 Sudah Bayar? Cek / Refresh Status'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status & Actions Sidebar */}
        <div>
          <div className="card" style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 1.5rem)' }}>
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '1rem' }}>
                <span className={`badge ${statusBadge[transaction.status]}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                  {transaction.status === 'pending'
                    ? 'Menunggu Pembayaran'
                    : transaction.status === 'approved'
                    ? 'Pembayaran Berhasil'
                    : transaction.status === 'rejected'
                    ? 'Ditolak / Batal'
                    : 'Kedaluwarsa'}
                </span>
              </div>

              {transaction.status === 'pending' && timeLeft && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Batas waktu pembayaran</p>
                  <p style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--warning)' }}>{timeLeft}</p>
                </div>
              )}

              {transaction.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    className="btn btn-primary btn-block"
                    onClick={handlePayMidtrans}
                  >
                    Buka Pop-up Pembayaran
                  </button>
                  <button
                    className="btn btn-secondary btn-block btn-sm"
                    onClick={() => syncStatus(true)}
                    disabled={syncing}
                  >
                    {syncing ? 'Syncing...' : '🔄 Sync Status Midtrans'}
                  </button>
                </div>
              )}

              {transaction.status === 'approved' && (
                <div>
                  <p style={{ color: 'var(--success)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600 }}>
                    ✓ Pembayaran Lunas via Midtrans ({transaction.payment_type || 'Instant Payment'})
                  </p>
                  <button className="btn btn-success btn-block btn-lg" onClick={() => navigate('/tickets')}>
                    🎟️ Lihat Tiket QR Code
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

