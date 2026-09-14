import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IoMenu, IoClose, IoTicketOutline } from 'react-icons/io5';
import useAuthStore from '../../stores/authStore';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const close = (e) => { 
      if (!e.target.closest('.navbar-actions')) {
        setDropdownOpen(false); 
        setMobileOpen(false); 
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'operator') return '/operator';
    return '/dashboard';
  };

  return (
    <nav className="navbar">
      <div className="container">
        {/* Logo */}
        <Link to="/" className="navbar-brand" onClick={(e) => e.stopPropagation()}>
          <IoTicketOutline size={28} color="var(--orange)" />
          <span>TIK<em>TIK</em></span>
        </Link>

        {/* Desktop nav links (public) */}
        <div className="navbar-links" style={{
          display: 'flex', alignItems: 'center', gap: 32,
        }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.78)', fontSize: 14.5, fontWeight: 500, padding: '6px 0' }}>
            Browse Events
          </Link>
        </div>

        {/* Actions */}
        <div className="navbar-actions" onClick={(e) => e.stopPropagation()}>
          {isAuthenticated() ? (
            <div style={{ position: 'relative' }}>
              <button
                className="navbar-user"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="navbar-user-avatar">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--paper)' }}>
                  {user?.username}
                </span>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: 'var(--paper)', border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)', minWidth: 180,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                  zIndex: 1100, overflow: 'hidden',
                  animation: 'slideUp 0.2s ease',
                }}>
                  {/* Dashboard link */}
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setDropdownOpen(false)}
                    style={{ display: 'block', padding: '0.7rem 1rem', fontSize: '0.9rem', color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-tint)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    Dashboard
                  </Link>

                  {user?.role === 'buyer' && (
                    <>
                      <Link
                        to="/tickets"
                        onClick={() => setDropdownOpen(false)}
                        style={{ display: 'block', padding: '0.7rem 1rem', fontSize: '0.9rem', color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-tint)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        Tiket Saya
                      </Link>
                      <Link
                        to="/history"
                        onClick={() => setDropdownOpen(false)}
                        style={{ display: 'block', padding: '0.7rem 1rem', fontSize: '0.9rem', color: 'var(--muted)', borderBottom: '1px solid var(--line)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-tint)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        Riwayat
                      </Link>
                    </>
                  )}

                  <button
                    onClick={() => { setDropdownOpen(false); handleLogout(); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.9rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-white btn-sm">
                Masuk
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
