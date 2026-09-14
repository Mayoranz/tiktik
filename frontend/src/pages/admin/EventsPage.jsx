import { useState, useEffect } from 'react';
import { IoStarOutline, IoStar } from 'react-icons/io5';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/admin/events').then(({ data }) => setEvents(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggleFeatured = async (id) => {
    try { await api.post(`/admin/events/${id}/feature`); toast.success('Updated'); load(); } catch(e) { toast.error('Gagal'); }
  };

  const statusColors = { draft: 'badge-info', published: 'badge-success', live: 'badge-primary', finished: 'badge-warning', cancelled: 'badge-danger' };
  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Kelola Event</h1></div>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Event</th><th>Operator</th><th>Status</th><th>Featured</th><th>Transaksi</th></tr></thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td><strong>{e.title}</strong></td>
                <td>{e.operator?.username}</td>
                <td><span className={`badge ${statusColors[e.status]}`}>{e.status}</span></td>
                <td>
                  <button onClick={() => toggleFeatured(e.id)} style={{ color: e.is_featured ? 'var(--warning)' : 'var(--muted)', fontSize: '1.3rem' }}>
                    {e.is_featured ? <IoStar /> : <IoStarOutline />}
                  </button>
                </td>
                <td>{e.transactions_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
