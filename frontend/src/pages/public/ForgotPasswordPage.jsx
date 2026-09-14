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

// ── Steps Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = ['Kirim OTP', 'Verifikasi', 'Reset Password'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: done ? 'var(--success)' : active ? 'var(--teal)' : 'var(--line)',
                color: done || active ? '#fff' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.85rem',
                transition: 'var(--transition)',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.72rem', color: active ? 'var(--teal)' : 'var(--muted)', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 40, height: 2, background: done ? 'var(--success)' : 'var(--line)', margin: '0 4px', marginBottom: 18, transition: 'var(--transition)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── ForgotPasswordPage ────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  // step: 0 = kirim OTP, 1 = verifikasi OTP, 2 = reset password
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpExpired, setOtpExpired] = useState(false);
  const [otpKey, setOtpKey] = useState(0);
  const [showPw, setShowPw] = useState(false);

  const { sendOtp, verifyOtp, resetPassword, loading } = useAuthStore();
  const navigate = useNavigate();

  // Step 0 → kirim OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email) return toast.error('Masukkan email Anda');
    try {
      await sendOtp(email, 'forgot_password');
      toast.success(`Kode OTP dikirim ke ${email}`);
      setOtpCode('');
      setOtpExpired(false);
      setOtpKey((k) => k + 1);
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim OTP. Pastikan email terdaftar.');
    }
  };

  // Step 1 → verifikasi OTP
  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) return toast.error('Masukkan 6 digit kode OTP');
    try {
      await verifyOtp(email, otpCode, 'forgot_password');
      toast.success('Kode OTP valid! Silakan buat password baru.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Kode OTP salah atau sudah kedaluwarsa');
    }
  };

  // Step 2 → reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error('Password minimal 8 karakter');
    if (newPassword !== confirmPassword) return toast.error('Konfirmasi password tidak cocok');
    try {
      await resetPassword(email, otpCode, newPassword, confirmPassword);
      toast.success('Password berhasil direset! Silakan masuk.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mereset password');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        {/* Logo */}
        <div className="auth-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--ink)' }}>
              TIK<em style={{ fontStyle: 'normal', color: 'var(--orange)' }}>TIK</em>
            </span>
          </div>
          <h1 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
            {step === 0 && 'Lupa Password'}
            {step === 1 && 'Verifikasi OTP'}
            {step === 2 && 'Buat Password Baru'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
            {step === 0 && 'Masukkan email akun Anda untuk menerima kode OTP'}
            {step === 1 && `Kode OTP telah dikirim ke ${email}`}
            {step === 2 && 'Buat password baru yang kuat dan mudah diingat'}
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} />

        {/* ── Step 0: Input Email ── */}
        {step === 0 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Alamat Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 6 }}>
                Masukkan email yang terdaftar di akun TIKTIK Anda.
              </p>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
            </button>
          </form>
        )}

        {/* ── Step 1: Verifikasi OTP ── */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            {/* Email badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(18,168,150,0.08)', border: '1px solid rgba(18,168,150,0.2)',
              borderRadius: 'var(--radius-full)', padding: '6px 14px',
              fontSize: '0.83rem', color: 'var(--teal)', fontWeight: 500,
              marginBottom: 16,
            }}>
              📧 {email}
            </div>

            <OtpInput value={otpCode} onChange={setOtpCode} disabled={loading} />

            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 12 }}>
              {otpExpired ? (
                <span style={{ color: 'var(--danger)' }}>⏱ Kode kedaluwarsa.</span>
              ) : (
                <>Kode berlaku selama&nbsp;<Countdown key={otpKey} seconds={300} onFinish={() => setOtpExpired(true)} /></>
              )}
            </div>

            <button
              onClick={handleVerifyOtp}
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || otpCode.length < 6}
              style={{ marginTop: 20 }}
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi Kode OTP'}
            </button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              style={{
                marginTop: 14, background: 'none', border: 'none',
                color: 'var(--teal)', cursor: 'pointer', fontSize: '0.88rem',
                textDecoration: 'underline', fontFamily: 'var(--font-body)',
              }}
            >
              Kirim ulang kode OTP
            </button>
          </div>
        )}

        {/* ── Step 2: Reset Password ── */}
        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            {/* Verified badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px',
              marginBottom: 20,
            }}>
              <span style={{ fontSize: '1.1rem' }}>✅</span>
              <div>
                <p style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--success)' }}>Email Terverifikasi</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{email}</p>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Password Baru</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Minimal 8 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1rem',
                  }}
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Konfirmasi Password Baru</label>
              <input
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  borderColor: confirmPassword && confirmPassword !== newPassword ? 'var(--danger)' : undefined,
                }}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="form-error">Password tidak cocok</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || !newPassword || newPassword !== confirmPassword}
            >
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          Ingat password Anda? <Link to="/login">Masuk</Link>
        </div>
      </div>
    </div>
  );
}
