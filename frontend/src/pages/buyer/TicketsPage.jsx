import { useState, useEffect } from 'react';
import { IoTicketOutline, IoQrCodeOutline } from 'react-icons/io5';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    api.get('/buyer/tickets')
      .then(({ data }) => setTickets(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tiket Saya</h1>
        <p className="page-subtitle">Semua tiket yang sudah dibeli</p>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <div className="icon"><IoTicketOutline /></div>
          <p>Anda belum memiliki tiket</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {tickets.map((ticket) => (
            <div className="ticket-card" key={ticket.id}>
              <div className="ticket-card-header">
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{ticket.transaction?.event?.title}</h3>
                <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>{ticket.ticket_type?.name}</p>
              </div>
              <div className="ticket-card-body">
                <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                  <p>{formatDate(ticket.transaction?.event?.event_date)}</p>
                  <p>{ticket.transaction?.event?.location_name}</p>
                  {ticket.seat && <p>Kursi: <strong style={{ color: 'var(--ink)' }}>{ticket.seat.seat_number}</strong></p>}
                </div>
                <hr className="ticket-divider" />
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                  style={{ marginBottom: '0.75rem' }}
                >
                  <IoQrCodeOutline /> {selectedTicket?.id === ticket.id ? 'Tutup QR' : 'Tampilkan QR'}
                </button>
                {selectedTicket?.id === ticket.id && (
                  <div className="ticket-qr" style={{ animation: 'slideUp 0.3s ease' }}>
                    <QRCodeSVG value={ticket.qr_code_token} size={180} />
                    <p style={{ color: '#333', fontSize: '0.7rem', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                      {ticket.qr_code_token}
                    </p>
                  </div>
                )}
                <div style={{ marginTop: '0.5rem' }}>
                  <span className={`badge ${ticket.is_scanned ? 'badge-success' : 'badge-info'}`}>
                    {ticket.is_scanned ? 'Checked In' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
