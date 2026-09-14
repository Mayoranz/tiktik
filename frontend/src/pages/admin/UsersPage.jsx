import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/admin/users').then(({ data }) => setUsers(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleBan = async (id) => {
    if (!confirm('Ban user ini?')) return;
    try { await api.post(`/admin/users/${id}/ban`); toast.success('User di-ban'); load(); } catch(e) { toast.error('Gagal'); }
  };

  const handleReset = async (id) => {
    try {
      const { data } = await api.post(`/admin/users/${id}/reset-password`);
      toast.success(`Password direset: ${data.new_password}`);
    } catch(e) { toast.error('Gagal'); }
  };

  const roleColors = { admin: 'badge-danger', operator: 'badge-primary', buyer: 'badge-info' };
  const statusColors = { active: 'badge-success', suspended: 'badge-warning', banned: 'badge-danger' };
  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Kelola Pengguna</h1></div>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.username}</strong></td>
                <td>{u.email}</td>
                <td><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                <td><span className={`badge ${statusColors[u.status]}`}>{u.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {u.status !== 'banned' && u.role !== 'admin' && <button className="btn btn-danger btn-sm" onClick={() => handleBan(u.id)}>Ban</button>}
                    {u.role !== 'admin' && <button className="btn btn-sm btn-secondary" onClick={() => handleReset(u.id)}>Reset PW</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
