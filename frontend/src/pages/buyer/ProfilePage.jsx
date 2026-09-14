import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { IoPersonOutline, IoLockClosedOutline, IoLogOutOutline, IoSaveOutline, IoCloseOutline } from 'react-icons/io5';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, logout, fetchUser } = useAuthStore();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: user?.username || '',
    phone: user?.phone || '',
    current_password: '',
  });

  const handleLogout = async () => {
    await logout();
    toast.success('Logout berhasil');
    navigate('/login');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.current_password) {
      toast.error('Masukkan password Anda untuk menyimpan perubahan.');
      return;
    }
    
    setLoading(true);
    try {
      await api.put('/profile', form);
      toast.success('Profil berhasil diperbarui!');
      await fetchUser();
      setIsEditing(false);
      setForm({ ...form, current_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.current_password?.[0] || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Profil Saya</h1>
          <p className="page-subtitle">Kelola informasi akun Anda</p>
        </div>
        {!isEditing && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            <IoPersonOutline /> Edit Profil
          </button>
        )}
      </div>

      <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="card-body" style={{ padding: '2.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '2rem' }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: '50%', 
              background: 'var(--teal)', color: '#fff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 800,
              boxShadow: '0 4px 15px var(--primary-glow)'
            }}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{user?.username}</h2>
              <p style={{ color: 'var(--ink-soft)' }}>{user?.email}</p>
              <div style={{ marginTop: '0.5rem' }}>
                <span className="badge badge-primary">{user?.status?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Username</label>
                {isEditing ? (
                  <input type="text" className="form-input" required 
                    value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                ) : (
                  <div style={{ padding: '0.75rem 1rem', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', color: 'var(--ink)' }}>
                    {user?.username}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nomor HP</label>
                {isEditing ? (
                  <input type="tel" className="form-input" required 
                    value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                ) : (
                  <div style={{ padding: '0.75rem 1rem', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', color: 'var(--ink)' }}>
                    {user?.phone}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 400 }}>(Tidak dapat diubah)</span></label>
                <div style={{ padding: '0.75rem 1rem', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', color: 'var(--muted)' }}>
                  {user?.email}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">NIK <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 400 }}>(Tidak dapat diubah)</span></label>
                <div style={{ padding: '0.75rem 1rem', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', color: 'var(--muted)', fontFamily: 'monospace', letterSpacing: '2px' }}>
                  {user?.nik}
                </div>
              </div>
            </div>

            {isEditing && (
              <div style={{ background: 'var(--warning-bg)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <h4 style={{ color: 'var(--warning)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IoLockClosedOutline /> Verifikasi Keamanan
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: '1rem' }}>
                  Demi keamanan akun Anda, silakan masukkan password saat ini untuk menyimpan perubahan profil.
                </p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Masukkan Password Saat Ini" 
                    required 
                    value={form.current_password} 
                    onChange={e => setForm({...form, current_password: e.target.value})} 
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--line)' }}>
              {isEditing ? (
                <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsEditing(false); setForm({...form, current_password: ''}); }}>
                    <IoCloseOutline /> Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <IoSaveOutline /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn-danger" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
                  <IoLogOutOutline size={20} /> Logout
                </button>
              )}
            </div>
          </form>
          
        </div>
      </div>
    </div>
  );
}
