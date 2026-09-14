import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoMailOutline, IoLockClosedOutline } from 'react-icons/io5';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const { login: doLogin, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await doLogin(login, password);
      toast.success('Login berhasil!');
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'operator') navigate('/operator');
      else navigate('/');  // buyer → landing page

    } catch (err) {
      toast.error(err.response?.data?.errors?.login?.[0] || 'Login gagal');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <IoMailOutline size={0} style={{ display: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--ink)' }}>
              TIK<em style={{ fontStyle: 'normal', color: 'var(--orange)' }}>TIK</em>
            </span>
          </div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Masuk ke akun Anda</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
            Selamat datang kembali 👋
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email atau No. HP</label>
            <div style={{ position: 'relative' }}>
              <IoMailOutline
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="email@contoh.com atau 0812xxxxx"
                value={login}
                onChange={(e) => { setLogin(e.target.value); clearError(); }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <IoLockClosedOutline
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}
              />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                required
              />
            </div>
          </div>
          <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 8 }}>
            <Link to="/forgot-password" style={{ fontSize: '0.83rem', color: 'var(--teal)', textDecoration: 'none', fontWeight: 500 }}>
              Lupa password?
            </Link>
          </div>

          {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}


          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="auth-footer">
          Belum punya akun? <Link to="/register">Daftar sekarang</Link>
        </div>
      </div>
    </div>
  );
}
