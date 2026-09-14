import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

// ── OTP Input Component ──────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const inputsRef = useRef([]);
  const digits = value.split('');

  const handleKey = (e, idx) => {
    if (e.key === 'Backspace') {
      const next = [...digits];
      next[idx] = '';
      onChange(next.join(''));
      if (idx > 0) inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleChange = (e, idx) => {
    const char = e.target.value.replace(/\D/, '').slice(-1);
    const next = [...Array(6)].map((_, i) => digits[i] || '');
    next[idx] = char;
    onChange(next.join(''));
    if (char && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '8px 0' }}>
      {Array(6).fill(0).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digits[idx] || ''}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKey(e, idx)}
          onPaste={handlePaste}
          style={{
            width: 46,
            height: 56,
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            border: `2px solid ${digits[idx] ? 'var(--teal)' : 'var(--line)'}`,
            borderRadius: 'var(--radius-md)',
            background: digits[idx] ? 'rgba(18,168,150,0.06)' : 'var(--paper)',
            color: 'var(--ink)',
            outline: 'none',
            transition: 'var(--transition)',
            fontFamily: 'var(--font-body)',
          }}
        />
      ))}
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function Countdown({ seconds, onFinish }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const t = setInterval(() => {
      setLeft((p) => {
        if (p <= 1) { clearInterval(t); onFinish(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const m = String(Math.floor(left / 60)).padStart(2, '0');
  const s = String(left % 60).padStart(2, '0');
  return (
    <span style={{ color: left <= 30 ? 'var(--danger)' : 'var(--teal)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
      {m}:{s}
    </span>
  );
}

// ── RegisterPage ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
  // step: 'form' | 'otp'
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({
    username: '', nik: '', email: '', phone: '', password: '', password_confirmation: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [errors, setErrors] = useState({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);
  const [otpKey, setOtpKey] = useState(0); // resets countdown

  const { register, sendOtp, verifyOtp, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
    // jika email berubah, reset verifikasi
    if (e.target.name === 'email') {
      setEmailVerified(false);
      setStep('form');
    }
  };

  // Kirim OTP ke email
  const handleSendOtp = async () => {
    if (!form.email) return toast.error('Masukkan email terlebih dahulu');
    const emailRgx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRgx.test(form.email)) return toast.error('Format email tidak valid');
    try {
      await sendOtp(form.email, 'register');
      toast.success(`Kode OTP dikirim ke ${form.email}`);
      setOtpCode('');
      setOtpExpired(false);
      setOtpKey((k) => k + 1);
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim OTP');
    }
  };

  // Verifikasi OTP
  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) return toast.error('Masukkan 6 digit kode OTP');
    try {
      await verifyOtp(form.email, otpCode, 'register');
      setEmailVerified(true);
      setStep('form');
      toast.success('Email berhasil diverifikasi! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kode OTP salah atau sudah kedaluwarsa');
    }
  };

  // Submit form register
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailVerified) return toast.error('Verifikasi email Anda terlebih dahulu');
    setErrors({});
    try {
      await register(form);
      toast.success('Registrasi berhasil! Selamat datang 🎉');
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
      toast.error(err.response?.data?.message || 'Registrasi gagal');
    }
  };

  const fields = [
    { name: 'username', label: 'Username', type: 'text', placeholder: 'Nama pengguna' },
    { name: 'nik', label: 'NIK (16 digit)', type: 'text', placeholder: '1234567890123456', maxLength: 16 },
    { name: 'phone', label: 'Nomor HP', type: 'text', placeholder: '081234567890' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Minimal 8 karakter' },
    { name: 'password_confirmation', label: 'Konfirmasi Password', type: 'password', placeholder: 'Ulangi password' },
  ];

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        {/* Logo */}
        <div className="auth-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--ink)' }}>
              TIK<em style={{ fontStyle: 'normal', color: 'var(--orange)' }}>TIK</em>
            </span>
          </div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
            {step === 'otp' ? 'Verifikasi Email' : 'Buat Akun Baru'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
            {step === 'otp'
              ? `Kode OTP dikirim ke ${form.email}`
              : 'Daftar untuk membeli tiket event'}
          </p>
        </div>

        {/* ── Step OTP ── */}
        {step === 'otp' && (
          <div style={{ textAlign: 'center', padding: '0 4px' }}>
            {/* OTP Digits */}
            <OtpInput value={otpCode} onChange={setOtpCode} disabled={loading} />

            {/* Countdown */}
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 10 }}>
              {otpExpired ? (
                <span style={{ color: 'var(--danger)' }}>Kode kedaluwarsa.</span>
              ) : (
                <>Kode berlaku selama&nbsp;<Countdown key={otpKey} seconds={300} onFinish={() => setOtpExpired(true)} /></>
              )}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyOtp}
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || otpCode.length < 6}
              style={{ marginTop: 20 }}
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi Kode OTP'}
            </button>

            {/* Resend */}
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              style={{
                marginTop: 14,
                background: 'none',
                border: 'none',
                color: 'var(--teal)',
                cursor: 'pointer',
                fontSize: '0.88rem',
                textDecoration: 'underline',
                fontFamily: 'var(--font-body)',
              }}
            >
              Kirim ulang kode OTP
            </button>

            {/* Back */}
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setStep('form')}
                style={{
                  background: 'none', border: 'none', color: 'var(--muted)',
                  fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                ← Kembali ke formulir
              </button>
            </div>
          </div>
        )}

        {/* ── Step Form ── */}
        {step === 'form' && (
          <form onSubmit={handleSubmit}>
            {/* Email field + tombol Verifikasi */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Email</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="email"
                    name="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="email@contoh.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={{
                      paddingRight: emailVerified ? '2.5rem' : undefined,
                      borderColor: emailVerified ? 'var(--success)' : undefined,
                    }}
                  />
                  {emailVerified && (
                    <span style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--success)', fontSize: '1.1rem',
                    }}>✓</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || !form.email}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '0 14px',
                    height: 42,
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${emailVerified ? 'var(--success)' : 'var(--teal)'}`,
                    background: emailVerified ? 'rgba(16,185,129,0.1)' : 'rgba(18,168,150,0.1)',
                    color: emailVerified ? 'var(--success)' : 'var(--teal)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: loading || !form.email ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'var(--transition)',
                    flexShrink: 0,
                  }}
                >
                  {emailVerified ? '✓ Terverifikasi' : loading ? '...' : 'Verifikasi'}
                </button>
              </div>
              {errors.email && <p className="form-error">{errors.email[0]}</p>}
              {!emailVerified && (
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
                  Klik "Verifikasi" untuk mengirim kode OTP ke email Anda.
                </p>
              )}
            </div>

            {/* Field lainnya */}
            {fields.map((f) => (
              <div className="form-group" key={f.name} style={{ marginBottom: '1rem' }}>
                <label className="form-label">{f.label}</label>
                <input
                  type={f.type}
                  name={f.name}
                  className={`form-input ${errors[f.name] ? 'error' : ''}`}
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={handleChange}
                  maxLength={f.maxLength}
                  required
                />
                {errors[f.name] && <p className="form-error">{errors[f.name][0]}</p>}
              </div>
            ))}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || !emailVerified}
              style={{
                marginTop: '0.5rem',
                opacity: !emailVerified ? 0.6 : 1,
                cursor: !emailVerified ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Memproses...' : !emailVerified ? 'Verifikasi email dulu' : 'Daftar'}
            </button>
          </form>
        )}

        <div className="auth-footer" style={{ marginTop: step === 'otp' ? 0 : undefined }}>
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </div>
      </div>
    </div>
  );
}
