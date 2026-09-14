import { NavLink } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  IoGridOutline, IoCalendarOutline, IoTicketOutline,
  IoPeopleOutline, IoSettingsOutline,
  IoQrCodeOutline, IoPersonOutline, IoTimeOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5';
import useAuthStore from '../../stores/authStore';

const buyerLinks = [
  { to: '/dashboard', icon: <IoGridOutline />, label: 'Dashboard' },
  { to: '/tickets', icon: <IoTicketOutline />, label: 'Tiket Saya' },
  { to: '/history', icon: <IoTimeOutline />, label: 'Riwayat' },
  { to: '/profile', icon: <IoPersonOutline />, label: 'Profil' },
];

const operatorLinks = [
  { to: '/operator', icon: <IoGridOutline />, label: 'Dashboard', end: true },
  { to: '/operator/events', icon: <IoCalendarOutline />, label: 'Kelola Event' },
  { to: '/operator/transactions', icon: <IoCheckmarkCircleOutline />, label: 'Verifikasi' },
  { to: '/operator/scanner', icon: <IoQrCodeOutline />, label: 'Scanner' },
  { to: '/operator/profile', icon: <IoPersonOutline />, label: 'Profil' },
];

const adminLinks = [
  { to: '/admin', icon: <IoGridOutline />, label: 'Dashboard', end: true },
  { to: '/admin/operators', icon: <IoPeopleOutline />, label: 'Kelola Operator' },
  { to: '/admin/events', icon: <IoCalendarOutline />, label: 'Kelola Event' },
  { to: '/admin/users', icon: <IoPeopleOutline />, label: 'Kelola Pengguna' },
  { to: '/admin/settings', icon: <IoSettingsOutline />, label: 'Pengaturan' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuthStore();

  const links = user?.role === 'admin' ? adminLinks
    : user?.role === 'operator' ? operatorLinks
    : buyerLinks;

  const roleLabel = user?.role === 'admin' ? 'Admin Panel'
    : user?.role === 'operator' ? 'Operator Panel'
    : 'Menu';

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 899,
          }}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ top: 0 }}>
        {/* Brand header inside sidebar */}
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '18px 20px 16px',
          borderBottom: '1px solid var(--line)',
          marginBottom: 8,
          background: 'var(--ink)',
        }}>
          <IoTicketOutline size={22} color="var(--orange)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--paper)', letterSpacing: 0.5 }}>
            TIK<em style={{ fontStyle: 'normal', color: 'var(--orange)' }}>TIK</em>
          </span>
        </Link>

        <div className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">{roleLabel}</div>
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="icon">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

