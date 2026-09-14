import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminOperatorsPage() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    username: '',
    nik: '',
    email: '',
    phone: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get('/admin/operators').then(({ data }) => setOperators(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    try {
      await api.post(`/admin/operators/${id}/${action}`);
      toast.success(`Operator berhasil di-${action}`);
      load();
    } catch (err) { toast.error('Gagal'); }
  };

  const handleOpenModal = (operator = null) => {
    if (operator) {
      setIsEditing(true);
      setFormData({
        id: operator.id,
        username: operator.username,
        nik: operator.nik || '',
        email: operator.email,
        phone: operator.phone,
        password: '' // empty password on edit means do not change
      });
    } else {
      setIsEditing(false);
      setFormData({
        id: null,
        username: '',
        nik: '',
        email: '',
        phone: '',
        password: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/admin/operators/${formData.id}`, formData);
        toast.success('Operator berhasil diperbarui');
      } else {
        await api.post('/admin/operators', formData);
        toast.success('Operator berhasil ditambahkan');
      }
      handleCloseModal();
      load();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.errors?.nik?.[0] || 'Terjadi kesalahan';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors = { active: 'badge-success', suspended: 'badge-warning', banned: 'badge-danger' };
  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Kelola Operator</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>Tambah Operator</button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Username</th><th>Email</th><th>Phone</th><th>Events</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {operators.map((op) => (
              <tr key={op.id}>
                <td><strong>{op.username}</strong></td>
                <td>{op.email}</td>
                <td>{op.phone}</td>
                <td>{op.events_count || 0}</td>
                <td><span className={`badge ${statusColors[op.status]}`}>{op.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => handleOpenModal(op)}>Edit</button>
                    {op.status !== 'active' && <button className="btn btn-success btn-sm" onClick={() => handleAction(op.id, 'approve')}>Activate</button>}
                    {op.status === 'active' && <button className="btn btn-sm btn-secondary" onClick={() => handleAction(op.id, 'suspend')}>Suspend</button>}
                    {op.status !== 'banned' && <button className="btn btn-danger btn-sm" onClick={() => handleAction(op.id, 'block')}>Block</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '500px', maxWidth: '90%' }}>
            <div className="modal-header">
              <h2 className="modal-title">{isEditing ? 'Edit Operator' : 'Tambah Operator'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <div className="modal-body">
              <form id="operatorForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Username</label>
                  <input type="text" className="form-input" name="username" value={formData.username} onChange={handleFormChange} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">NIK (16 Digit)</label>
                  <input type="text" className="form-input" name="nik" value={formData.nik} onChange={handleFormChange} required maxLength="16" minLength="16" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" name="email" value={formData.email} onChange={handleFormChange} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nomor HP</label>
                  <input type="text" className="form-input" name="phone" value={formData.phone} onChange={handleFormChange} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Password {isEditing && <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>(Kosongkan jika tidak diubah)</span>}</label>
                  <input type="password" className="form-input" name="password" value={formData.password} onChange={handleFormChange} minLength="8" required={!isEditing} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={submitting}>Batal</button>
              <button type="submit" form="operatorForm" className="btn btn-primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
