import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoCalendarOutline, IoLocationOutline } from 'react-icons/io5';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/* ── Gradient palettes for events without a banner ── */
const PALETTES = ['thumb-p1','thumb-p2','thumb-p3','thumb-p4','thumb-p5','thumb-p6','thumb-p7','thumb-p8'];

/* ── Category data ── */
const CATEGORIES = [
  {
    label: 'Konser',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
    ),
  },
  {
    label: 'Festival',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10l9-7 9 7"/><path d="M5 10v10h14V10"/>
      </svg>
    ),
  },
  {
    label: 'Pameran',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    ),
  },
  {
    label: 'Pesta',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
      </svg>
    ),
  },
  {
    label: 'Film',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M8 6v4M16 6v4M8 14v4M16 14v4"/>
      </svg>
    ),
  },
  {
    label: 'Kuliner',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 11h18M3 15h18M6 11V7a6 6 0 0112 0v4"/>
      </svg>
    ),
  },
  {
    label: 'Olahraga',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="4" r="2"/><path d="M12 6v6l-4 8M12 12l4 8M8 10l-3 2M16 10l3 2"/>
      </svg>
    ),
  },
  {
    label: 'Lainnya',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="7" r="3"/><path d="M4 21v-2a5 5 0 015-5h0a5 5 0 015 5v2"/>
        <circle cx="18" cy="17" r="2"/>
      </svg>
    ),
  },
];

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [activeTab, setActiveTab] = useState('semua');
  const [activeCategory, setActiveCategory] = useState(null);

  const getFilterParams = (cat = activeCategory, tab = activeTab) => {
    let date_from, date_to;
    const today = new Date();
    
    if (tab === 'hari ini') {
      const todayStr = today.toISOString().split('T')[0];
      date_from = `${todayStr} 00:00:00`;
      date_to = `${todayStr} 23:59:59`;
    } else if (tab === 'besok') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      date_from = `${tomorrowStr} 00:00:00`;
      date_to = `${tomorrowStr} 23:59:59`;
    } else if (tab === 'minggu ini') {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      date_from = `${today.toISOString().split('T')[0]} 00:00:00`;
      date_to = `${endOfWeek.toISOString().split('T')[0]} 23:59:59`;
    }

    return { search, per_page: 8, category: cat, date_from, date_to };
  };

  useEffect(() => {
    Promise.all([
      api.get('/events/featured'),
      api.get('/events', { params: getFilterParams() }),
    ]).then(([featuredRes, eventsRes]) => {
      setFeatured(featuredRes.data.data || []);
      setEvents(eventsRes.data.data || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-rotate banner
  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % featured.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [featured.length]);

  // Fetch when tab or category changes
  useEffect(() => {
    if (loading) return;
    api.get('/events', { params: getFilterParams() })
      .then(({ data }) => setEvents(data.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    api.get('/events', { params: getFilterParams() })
      .then(({ data }) => setEvents(data.data || []))
      .catch(() => {});
  };

  const handleCategoryClick = (label) => {
    setActiveCategory(activeCategory === label ? null : label);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return <LoadingSpinner fullScreen />;

  const tabs = ['semua', 'hari ini', 'besok', 'minggu ini'];

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="hero-section">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Featured banner slideshow */}
          {featured.length > 0 && (
            <div className="banner-slider" style={{ marginBottom: '2.5rem' }}>
              {featured.map((event, i) => (
                <Link to={`/event/${event.id}`} key={event.id}
                  style={{ display: i === currentBanner ? 'block' : 'none' }}>
                  <img
                    src={event.banners?.[0]?.image_url || `https://placehold.co/1200x400/0B0B0C/FF5A1F?text=${encodeURIComponent(event.title)}`}
                    alt={event.title}
                    style={{ width: '100%', borderRadius: 'var(--radius-card)', aspectRatio: '3/1', objectFit: 'cover' }}
                  />
                </Link>
              ))}
              {featured.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '1rem' }}>
                  {featured.map((_, i) => (
                    <button key={i} onClick={() => setCurrentBanner(i)}
                      style={{
                        width: i === currentBanner ? 24 : 8, height: 8,
                        borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: i === currentBanner ? 'var(--orange)' : 'rgba(255,255,255,0.35)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tagline + search */}
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ color: 'var(--paper)', fontSize: 'clamp(38px, 6vw, 68px)', textTransform: 'uppercase' }}>
              Temukan event untuk<span style={{ color: 'var(--teal)', display: 'block' }}>kenangan tak terlupakan.</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 16, margin: '22px auto 36px', maxWidth: 480, lineHeight: 1.55 }}>
              Beli tiket konser, festival, dan event seru lainnya dengan <strong style={{ color: 'var(--paper)' }}>harga terbaik</strong> di pasar.
            </p>

            <form onSubmit={handleSearch} className="search-row">
              <input
                type="text"
                placeholder="Cari event, artis, atau lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" aria-label="Cari">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ═══ CATEGORY STRIP ═══ */}
      <section className="categories-strip">
        <div className="container">
          <div className="cat-scroll">
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.label} 
                className={`cat-item ${activeCategory === cat.label ? 'is-active' : ''}`} 
                onClick={() => handleCategoryClick(cat.label)}
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer',
                  backgroundColor: activeCategory === cat.label ? 'rgba(18,168,150,0.1)' : 'transparent',
                  color: activeCategory === cat.label ? 'var(--teal)' : 'var(--ink-soft)'
                }}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ EVENT GRID ═══ */}
      <section className="block">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="kicker">{events.length} event tersedia</div>
              <h2>
                {search ? (
                  <>Hasil: <span className="place">"{search}"</span></>
                ) : (
                  <>Event <span className="place">Terbaru</span></>
                )}
              </h2>
            </div>
            <div className="tabs">
              {tabs.map((t) => (
                <button
                  key={t}
                  className={activeTab === t ? 'is-active' : ''}
                  onClick={() => setActiveTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {events.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🎫</div>
              <p>Belum ada event yang tersedia</p>
            </div>
          ) : (
            <div className="event-grid">
              {events.map((event, idx) => {
                const minPrice = event.ticket_types?.length > 0
                  ? Math.min(...event.ticket_types.map(t => parseFloat(t.price)))
                  : null;
                const palette = PALETTES[idx % PALETTES.length];
                const hasBanner = !!event.banners?.[0]?.image_url;

                return (
                  <article key={event.id} className="ticket-card">
                    {/* Thumb */}
                    <div className={`thumb ${!hasBanner ? palette : ''}`}>
                      {hasBanner && (
                        <img src={event.banners[0].image_url} alt={event.title} />
                      )}
                      <span className="thumb-tag">
                        {event.is_exclusive ? 'Eksklusif' : 'Event'}
                      </span>
                    </div>

                    {/* Tear line */}
                    <div className="tear" />

                    {/* Info */}
                    <div className="info">
                      <h3>{event.title}</h3>
                      <p className="meta">
                        {event.location_name || 'Lokasi TBA'} · {formatDate(event.event_date)}
                      </p>
                      <div className="row">
                        <span className="ticket-price">
                          {minPrice !== null ? (
                            <>Mulai {formatPrice(minPrice)}<span>per tiket</span></>
                          ) : (
                            <span>Gratis</span>
                          )}
                        </span>
                        <Link to={`/event/${event.id}`} className="btn btn-teal">
                          Beli tiket
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══ NEWSLETTER BAND ═══ */}
      <section className="newsletter-band">
        <div className="container row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <h3>Jangan lewatkan event terbaru</h3>
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Alamat email kamu" />
            <button type="submit" className="sub-btn" aria-label="Subscribe">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
