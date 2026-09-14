import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => setSettings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', {
        platform_name: settings.platform_name,
        whatsapp_contact: settings.whatsapp_contact,
      });
      toast.success('Pengaturan berhasil disimpan');
    } catch (err) { toast.error('Gagal menyimpan'); }
    setSaving(false);
  };

  const toggleMaintenance = async () => {
    try {
      const { data } = await api.post('/admin/maintenance');
      setSettings({ ...settings, maintenance_mode: data.maintenance_mode });
      toast.success(data.message);
    } catch (err) { toast.error('Gagal'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Pengaturan Sistem</h1></div>

      <div className="card" style={{ maxWidth: 600, marginBottom: '2rem' }}>
        <div className="card-body">
          <h3 style={{ marginBottom: '1.5rem' }}>Platform</h3>
          {[
            { key: 'platform_name', label: 'Nama Platform' },
            { key: 'whatsapp_contact', label: 'Kontak WhatsApp' },
          ].map((f) => (
            <div className="form-group" key={f.key}>
              <label className="form-label">{f.label}</label>
              <input className="form-input" value={settings[f.key] || ''}
                onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })} />
            </div>
          ))}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-body">
          <h3 style={{ marginBottom: '1rem' }}>Maintenance Mode</h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Saat aktif, hanya admin yang dapat mengakses platform.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className={`badge ${settings.maintenance_mode === 'true' ? 'badge-danger' : 'badge-success'}`}
              style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              {settings.maintenance_mode === 'true' ? 'AKTIF' : 'NONAKTIF'}
            </span>
            <button className={`btn ${settings.maintenance_mode === 'true' ? 'btn-success' : 'btn-danger'}`} onClick={toggleMaintenance}>
              {settings.maintenance_mode === 'true' ? 'Nonaktifkan' : 'Aktifkan'} Maintenance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
