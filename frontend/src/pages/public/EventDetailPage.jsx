import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoCalendarOutline, IoLocationOutline, IoTicketOutline, IoTimeOutline } from 'react-icons/io5';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [selectedSeats, setSelectedSeats] = useState({});
  const [currentBanner, setCurrentBanner] = useState(0);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(({ data }) => setEvent(data.data))
      .catch(() => toast.error('Event tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!event) return;
    const salesStart = new Date(event.ticket_sales_start);
    if (salesStart <= new Date()) { setCountdown(null); return; }

    const timer = setInterval(() => {
      const now = new Date();
      const diff = salesStart - now;
      if (diff <= 0) { setCountdown(null); clearInterval(timer); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [event]);

  // Banner rotation
  useEffect(() => {
    if (!event?.banners?.length || event.banners.length <= 1) return;
    const interval = setInterval(() => setCurrentBanner(p => (p + 1) % event.banners.length), 4000);
    return () => clearInterval(interval);
  }, [event?.banners?.length]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleQuantity = (typeId, delta) => {
    setSelectedTickets(prev => {
      const current = prev[typeId] || 0;
      const newVal = Math.max(0, current + delta);
      return { ...prev, [typeId]: newVal };
    });
  };

  const toggleSeat = (typeId, seatId) => {
    setSelectedSeats(prev => {
      const seats = prev[typeId] || [];
      if (seats.includes(seatId)) return { ...prev, [typeId]: seats.filter(s => s !== seatId) };
      return { ...prev, [typeId]: [...seats, seatId] };
    });
  };

  const handleCheckout = async () => {
    if (!isAuthenticated()) { navigate('/login'); return; }

    const items = Object.entries(selectedTickets)
      .filter(([_, qty]) => qty > 0)
      .map(([typeId, quantity]) => ({
        ticket_type_id: parseInt(typeId),
        quantity,
        seat_ids: selectedSeats[typeId] || [],
      }));

    if (items.length === 0) { toast.error('Pilih tiket terlebih dahulu'); return; }

    try {
      const { data } = await api.post('/buyer/checkout', { event_id: event.id, items });
      toast.success('Checkout berhasil!');
      navigate(`/checkout/${data.transaction.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout gagal');
    }
  };

  const totalPrice = event?.ticket_types?.reduce((sum, type) => {
    return sum + (parseFloat(type.price) * (selectedTickets[type.id] || 0));
  }, 0) || 0;

  if (loading) return <LoadingSpinner fullScreen />;
  if (!event) return <div className="page-content container"><div className="empty-state"><p>Event tidak ditemukan</p></div></div>;

  const salesOpen = !countdown;
  const isExpired = new Date() > new Date(event.event_date);

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: 960 }}>
        {/* Banner */}
        {event.banners?.length > 0 && (
          <div className="banner-slider" style={{ marginBottom: '2rem' }}>
            {event.banners.map((b, i) => (
              <img key={b.id} src={b.image_url} alt={event.title}
                style={{ display: i === currentBanner ? 'block' : 'none', width: '100%', borderRadius: 'var(--radius-xl)', aspectRatio: '3/1', objectFit: 'cover' }} />
            ))}
          </div>
        )}

        {/* Event Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>{event.title}</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--ink-soft)' }}>
                <IoCalendarOutline size={20} color="var(--teal)" />
                <span>{formatDate(event.event_date)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--ink-soft)' }}>
                <IoLocationOutline size={20} color="var(--teal)" />
                <span>{event.location_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--ink-soft)' }}>
                <IoTicketOutline size={20} color="var(--teal)" />
                <span>Diselenggarakan oleh <strong style={{ color: 'var(--ink)' }}>{event.operator?.username}</strong></span>
              </div>
            </div>

            {event.is_exclusive && (
              <div style={{ background: 'var(--warning-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', color: 'var(--warning)', fontSize: '0.85rem' }}>
                ⚠️ Event Eksklusif — Maksimal 3 tiket per akun
              </div>
            )}

            {/* Description */}
            <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Deskripsi Event</h3>
              <p style={{ color: 'var(--ink-soft)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{event.description}</p>
            </div>

            {/* Countdown */}
            {countdown && (
              <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--teal)' }}>
                  <IoTimeOutline style={{ verticalAlign: 'middle' }} /> Penjualan Tiket Dibuka Dalam
                </h3>
                <div className="countdown">
                  {[
                    { val: countdown.days, label: 'Hari' },
                    { val: countdown.hours, label: 'Jam' },
                    { val: countdown.minutes, label: 'Menit' },
                    { val: countdown.seconds, label: 'Detik' },
                  ].map((item) => (
                    <div className="countdown-item" key={item.label}>
                      <div className="countdown-value">{String(item.val).padStart(2, '0')}</div>
                      <div className="countdown-label">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Status Warnings */}
            {isExpired && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', color: 'var(--danger)', textAlign: 'center', fontWeight: 600 }}>
                Event Telah Selesai Dilaksanakan
              </div>
            )}
            {!isExpired && event.is_ticket_sales_paused && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--warning)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', color: 'var(--warning)', textAlign: 'center', fontWeight: 600 }}>
                Penjualan tiket sedang dihentikan sementara oleh operator
              </div>
            )}

            {/* Ticket Types */}
            {salesOpen && !isExpired && !event.is_ticket_sales_paused && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Pilih Tiket</h3>
                {event.ticket_types?.map((type) => (
                  <div key={type.id} style={{
                    background: 'var(--paper)', border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h4 style={{ marginBottom: '0.25rem' }}>{type.name}</h4>
                        <p style={{ color: 'var(--teal)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                          {formatPrice(type.price)}
                        </p>
                        <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                          Tersisa: {type.available_quota ?? type.quota} tiket
                          {type.is_numbered_seating && ' • Numbered Seating'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleQuantity(type.id, -1)}>−</button>
                        <span style={{ minWidth: 30, textAlign: 'center', fontWeight: 700 }}>{selectedTickets[type.id] || 0}</span>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleQuantity(type.id, 1)}>+</button>
                      </div>
                    </div>

                    {/* Seat Picker */}
                    {type.is_numbered_seating && (selectedTickets[type.id] || 0) > 0 && type.seats?.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
                          Pilih {selectedTickets[type.id]} kursi:
                        </p>
                        <div className="seat-grid">
                          {type.seats.map((seat) => (
                            <button
                              key={seat.id}
                              className={`seat ${seat.status === 'available' ? (selectedSeats[type.id]?.includes(seat.id) ? 'selected' : 'available') : seat.status}`}
                              onClick={() => seat.status === 'available' && toggleSeat(type.id, seat.id)}
                              disabled={seat.status !== 'available'}
                              title={seat.seat_number}
                            >
                              {seat.seat_number}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                          <span><span className="seat available" style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle' }} /> Tersedia</span>
                          <span><span className="seat selected" style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle' }} /> Dipilih</span>
                          <span><span className="seat booked" style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle' }} /> Terisi</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Google Maps */}
            {event.google_maps_url && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Lokasi</h3>
                <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(event.location_name)}&output=embed`}
                    width="100%" height="300" style={{ border: 0 }} loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sticky Checkout Summary */}
          <div style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 1.5rem)' }}>
            <div style={{
              background: 'var(--paper)', border: '1px solid var(--line)',
              borderRadius: 'var(--radius-xl)', padding: '1.5rem',
            }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Ringkasan Pesanan</h3>

              {Object.entries(selectedTickets).filter(([_, q]) => q > 0).length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
                  Belum ada tiket dipilih
                </p>
              ) : (
                <>
                  {Object.entries(selectedTickets).filter(([_, q]) => q > 0).map(([typeId, qty]) => {
                    const type = event.ticket_types.find(t => t.id === parseInt(typeId));
                    return (
                      <div key={typeId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--ink-soft)' }}>{type?.name} × {qty}</span>
                        <span>{formatPrice(parseFloat(type?.price) * qty)}</span>
                      </div>
                    );
                  })}
                  <hr className="ticket-divider" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--teal)' }}>{formatPrice(totalPrice)}</span>
                  </div>
                </>
              )}

              <button
                className="btn btn-primary btn-block btn-lg"
                style={{ marginTop: '1.5rem' }}
                onClick={handleCheckout}
                disabled={!salesOpen || totalPrice === 0 || isExpired || event.is_ticket_sales_paused}
              >
                {isExpired ? 'Event Telah Selesai' :
                 event.is_ticket_sales_paused ? 'Penjualan Ditutup' :
                 !salesOpen ? 'Penjualan Belum Dibuka' : 'Beli Tiket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
