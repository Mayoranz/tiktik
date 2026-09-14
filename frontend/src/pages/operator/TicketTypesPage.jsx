import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { IoAddOutline, IoTrashOutline, IoPencilOutline, IoArrowBackOutline } from 'react-icons/io5';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function OperatorTicketTypesPage() {
  const { id } = useParams(); // event id
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [form, setForm] = useState({ id: null, name: '', price: '', quota: '', is_numbered_seating: false });

  const loadTickets = () => {
    api.get(`/operator/events/${id}/ticket-types`)
      .then(({ data }) => setTicketTypes(data.data || []))
      .catch(() => toast.error('Gagal memuat tiket'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTickets(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/operator/ticket-types/${form.id}`, form);
        toast.success('Kategori tiket berhasil diperbarui');
      } else {
        await api.post(`/operator/events/${id}/ticket-types`, form);
        toast.success('Kategori tiket berhasil dibuat');
      }
      setShowForm(false);
      loadTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const openCreateForm = () => {
    setForm({ id: null, name: '', price: '', quota: '', is_numbered_seating: false });
    setIsEditing(false);
    setShowForm(true);
  };

  const openEditForm = (ticket) => {
    setForm({ 
      id: ticket.id, 
      name: ticket.name, 
      price: ticket.price, 
      quota: ticket.quota, 
      is_numbered_seating: ticket.is_numbered_seating 
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (ticketId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori tiket ini?')) return;
    try {
      await api.delete(`/operator/ticket-types/${ticketId}`);
      toast.success('Berhasil dihapus');
      loadTickets();
    } catch (err) {
      toast.error('Gagal menghapus');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/operator/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
            <IoArrowBackOutline /> Kembali ke Kelola Event
          </Link>
          <h1 className="page-title">Kelola Kategori Tiket</h1>
          <p className="page-subtitle">Atur jenis tiket, harga, dan kuota untuk event ini.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateForm}>
          <IoAddOutline /> Tambah Tiket
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>{isEditing ? 'Edit Kategori Tiket' : 'Buat Kategori Tiket Baru'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Kategori (contoh: VIP, Regular)</label>
                <input type="text" className="form-input" required 
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Harga (Rp)</label>
                  <input type="number" className="form-input" required min="0"
                    value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kuota</label>
                  <input type="number" className="form-input" required min="1"
                    value={form.quota} onChange={e => setForm({...form, quota: e.target.value})} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_numbered_seating} 
                  onChange={e => setForm({...form, is_numbered_seating: e.target.checked})} />
                Gunakan Kursi Bernomor (Numbered Seating)
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">Simpan</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nama Kategori</th>
              <th>Harga</th>
              <th>Kuota</th>
              <th>Kursi Bernomor</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {ticketTypes.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                  Belum ada kategori tiket. Silakan tambah baru.
                </td>
              </tr>
            ) : (
              ticketTypes.map((ticket) => (
                <tr key={ticket.id}>
                  <td><strong>{ticket.name}</strong></td>
                  <td>Rp {parseInt(ticket.price).toLocaleString('id-ID')}</td>
                  <td>{ticket.quota}</td>
                  <td>
                    {ticket.is_numbered_seating ? 
                      <span className="badge badge-primary">Ya</span> : 
                      <span className="badge badge-secondary" style={{ background: 'var(--paper)', color: 'var(--muted)' }}>Tidak</span>
                    }
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEditForm(ticket)}>
                        <IoPencilOutline /> Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(ticket.id)}>
                        <IoTrashOutline /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
