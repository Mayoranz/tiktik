import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  IoAddOutline, IoTrashOutline, IoImageOutline,
  IoCloseOutline, IoCloudUploadOutline, IoCheckmarkCircle,
  IoPauseOutline, IoPlayOutline, IoCreateOutline
} from 'react-icons/io5';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

/* ─── Client-side: convert any image to WebP Blob via Canvas ─── */
async function toWebpBlob(file, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Konversi gagal')),
        'image/webp',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gambar tidak valid')); };
    img.src = url;
  });
}

/* ─── Banner Modal ─── */
function BannerModal({ event, onClose, onUpdate }) {
  const [banners, setBanners] = useState(event.banners || []);
  const [preview, setPreview] = useState(null);   // { url, blob }
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const blob = await toWebpBlob(file);
      setPreview({ url: URL.createObjectURL(blob), blob, name: file.name });
    } catch {
      toast.error('Gagal memproses gambar');
    }
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', preview.blob, 'banner.webp');
      const { data } = await api.post(
        `/operator/events/${event.id}/banners`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const newBanner = data.data;
      setBanners((prev) => [...prev, newBanner]);
      setPreview(null);
      toast.success('Banner berhasil diupload!');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload gagal');
    }
    setUploading(false);
  };

  const handleDelete = async (banner) => {
    if (!confirm('Hapus banner ini?')) return;
    try {
      await api.delete(`/operator/events/${event.id}/banners/${banner.id}`);
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      toast.success('Banner dihapus');
      onUpdate?.();
    } catch {
      toast.error('Gagal menghapus banner');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--paper)', borderRadius: 'var(--radius-xl)',
        padding: '2rem', width: '100%', maxWidth: 640, maxHeight: '90vh',
        overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Poster / Banner</h2>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
              {event.title}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.4rem' }}>
            <IoCloseOutline />
          </button>
        </div>

        {/* Upload Zone */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: '2px dashed var(--line)',
            borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center',
            cursor: 'pointer', transition: 'border-color 0.2s',
            marginBottom: '1.5rem', background: 'var(--paper)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--teal)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
        >
          <IoCloudUploadOutline size={40} color="var(--muted)" style={{ marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--ink-soft)', margin: '0 0 0.25rem' }}>
            Klik untuk pilih gambar
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: 0 }}>
            JPG, PNG, WebP, GIF — akan dikonversi ke <strong>WebP</strong> otomatis
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
        </div>

        {/* Preview before upload */}
        {preview && (
          <div style={{
            background: 'var(--paper)', borderRadius: 'var(--radius-md)',
            padding: '1rem', marginBottom: '1.5rem',
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
              Preview — sudah dikonversi ke WebP
            </p>
            <img
              src={preview.url}
              alt="preview"
              style={{ width: '100%', borderRadius: 'var(--radius-md)', aspectRatio: '16/6', objectFit: 'cover' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button className="btn btn-primary" onClick={handleUpload} disabled={uploading} style={{ flex: 1 }}>
                {uploading ? 'Mengupload...' : <><IoCloudUploadOutline /> Upload Banner</>}
              </button>
              <button className="btn btn-secondary" onClick={() => setPreview(null)}>
                <IoTrashOutline />
              </button>
            </div>
          </div>
        )}

        {/* Existing banners */}
        <h4 style={{ margin: '0 0 1rem', color: 'var(--ink-soft)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Banner Terpasang ({banners.length})
        </h4>
        {banners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
            Belum ada banner
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {banners.map((banner, idx) => (
              <div key={banner.id} style={{
                position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden',
                border: '1px solid var(--line)',
              }}>
                {idx === 0 && (
                  <span style={{
                    position: 'absolute', top: 8, left: 8, zIndex: 2,
                    background: 'var(--teal)', color: '#fff', fontSize: '0.7rem',
                    fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  }}>
                    UTAMA
                  </span>
                )}
                <img
                  src={banner.image_url}
                  alt={`Banner ${idx + 1}`}
                  style={{ width: '100%', aspectRatio: '16/5', objectFit: 'cover', display: 'block' }}
                />
                <button
                  onClick={() => handleDelete(banner)}
                  style={{
                    position: 'absolute', top: 8, right: 8, zIndex: 2,
                    background: 'rgba(239,68,68,0.85)', color: '#fff',
                    border: 'none', borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <IoTrashOutline size={14} /> Hapus
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-secondary btn-block" onClick={onClose} style={{ marginTop: '1.5rem' }}>
          <IoCheckmarkCircle /> Selesai
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function OperatorEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [bannerEvent, setBannerEvent] = useState(null);
  const [editId, setEditId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', location_name: '', category_id: '',
    google_maps_url: '', event_date: '', ticket_sales_start: '', is_exclusive: false,
  });

  const loadEvents = () => {
    api.get('/operator/events')
      .then(({ data }) => setEvents(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    loadEvents(); 
    api.get('/categories')
      .then(({ data }) => setCategories(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/operator/events/${editId}`, form);
        toast.success('Event berhasil diperbarui!');
      } else {
        await api.post('/operator/events', form);
        toast.success('Event berhasil dibuat!');
      }
      setShowForm(false);
      setEditId(null);
      setForm({ title: '', description: '', location_name: '', category_id: '', google_maps_url: '', event_date: '', ticket_sales_start: '', is_exclusive: false });
      loadEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan event');
    }
  };

  const handleEdit = (event) => {
    setEditId(event.id);
    setForm({
      title: event.title,
      description: event.description || '',
      location_name: event.location_name || '',
      category_id: event.category_id || '',
      google_maps_url: event.google_maps_url || '',
      event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
      ticket_sales_start: event.ticket_sales_start ? new Date(event.ticket_sales_start).toISOString().slice(0, 16) : '',
      is_exclusive: event.is_exclusive || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus event ini?')) return;
    try {
      await api.delete(`/operator/events/${id}`);
      toast.success('Event dihapus');
      loadEvents();
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  const handlePublish = async (id) => {
    try {
      await api.put(`/operator/events/${id}`, { status: 'published' });
      toast.success('Event dipublish');
      loadEvents();
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const handleTogglePause = async (event) => {
    try {
      await api.put(`/operator/events/${event.id}`, { is_ticket_sales_paused: !event.is_ticket_sales_paused });
      toast.success(event.is_ticket_sales_paused ? 'Penjualan dilanjutkan' : 'Penjualan dijeda');
      loadEvents();
    } catch {
      toast.error('Gagal mengubah status penjualan');
    }
  };

  const statusColors = {
    draft: 'badge-info', published: 'badge-success',
    live: 'badge-primary', finished: 'badge-warning', cancelled: 'badge-danger',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Banner Modal */}
      {bannerEvent && (
        <BannerModal
          event={bannerEvent}
          onClose={() => setBannerEvent(null)}
          onUpdate={loadEvents}
        />
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Kelola Event</h1>
          <p className="page-subtitle">{events.length} event</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditId(null);
          setForm({ title: '', description: '', location_name: '', category_id: '', google_maps_url: '', event_date: '', ticket_sales_start: '', is_exclusive: false });
          setShowForm(!showForm);
        }}>
          <IoAddOutline /> Tambah Event
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>{editId ? 'Edit Event' : 'Buat Event Baru'}</h3>
            <form onSubmit={handleSubmit}>
              {[
                { name: 'title', label: 'Judul Event', type: 'text', required: true },
                { name: 'category_id', label: 'Kategori', type: 'select', required: true, options: categories },
                { name: 'location_name', label: 'Lokasi', type: 'text' },
                { name: 'google_maps_url', label: 'Google Maps URL', type: 'url' },
                { name: 'event_date', label: 'Tanggal Event', type: 'datetime-local', required: true },
                { name: 'ticket_sales_start', label: 'Mulai Penjualan Tiket', type: 'datetime-local', required: true },
              ].map((f) => (
                <div className="form-group" key={f.name} style={{ marginBottom: '1rem' }}>
                  <label className="form-label">{f.label}</label>
                  {f.type === 'select' ? (
                    <select className="form-input" required={f.required}
                      value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })}>
                      <option value="">Pilih Kategori</option>
                      {f.options.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input type={f.type} className="form-input" required={f.required}
                      value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })} />
                  )}
                </div>
              ))}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input" rows={4} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_exclusive} onChange={e => setForm({ ...form, is_exclusive: e.target.checked })} />
                Event Eksklusif (max 3 tiket/akun)
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
              <th>Event</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th>Transaksi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Banner thumbnail */}
                    <div style={{
                      width: 56, height: 36, borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                      flexShrink: 0, background: 'var(--paper)',
                    }}>
                      {e.banners?.[0] ? (
                        <img
                          src={e.banners[0].image_url}
                          alt={e.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IoImageOutline size={18} color="var(--muted)" />
                        </div>
                      )}
                    </div>
                    <div>
                      <strong>{e.title}</strong>
                      <br />
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{e.location_name}</span>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{new Date(e.event_date).toLocaleDateString('id-ID')}</td>
                <td>
                  <span className={`badge ${statusColors[e.status]}`}>{e.status}</span>
                  {e.is_ticket_sales_paused && (
                    <span className="badge badge-warning" style={{ marginLeft: 4 }}>Jeda</span>
                  )}
                </td>
                <td>{e.transactions_count || 0}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {e.status === 'draft' && (
                      <button className="btn btn-success btn-sm" onClick={() => handlePublish(e.id)}>Publish</button>
                    )}
                    {new Date(e.event_date) > new Date() ? (
                      <button
                        className={`btn btn-sm ${e.is_ticket_sales_paused ? 'btn-success' : 'btn-warning'}`}
                        title={e.is_ticket_sales_paused ? 'Jalankan Penjualan' : 'Hentikan Penjualan'}
                        onClick={() => handleTogglePause(e)}
                      >
                        {e.is_ticket_sales_paused ? <IoPlayOutline /> : <IoPauseOutline />}
                        {e.is_ticket_sales_paused ? ' Buka' : ' Jeda'}
                      </button>
                    ) : (
                      <span className="badge badge-info" style={{ alignSelf: 'center' }}>Selesai</span>
                    )}
                    <button
                      className="btn btn-sm btn-outline"
                      title="Edit Event"
                      onClick={() => handleEdit(e)}
                      style={{ background: 'var(--paper)', color: 'var(--ink)' }}
                    >
                      <IoCreateOutline /> Edit
                    </button>
                    <button
                      className="btn btn-sm"
                      title="Kelola Poster/Banner"
                      onClick={() => setBannerEvent(e)}
                      style={{ background: 'var(--paper)', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}
                    >
                      <IoImageOutline /> Banner
                    </button>
                    <Link to={`/operator/events/${e.id}/tickets`} className="btn btn-sm btn-secondary">Tiket</Link>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(e.id)}>
                      <IoTrashOutline />
                    </button>
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
