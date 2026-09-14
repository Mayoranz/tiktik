import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  IoQrCodeOutline, IoCheckmarkCircle, IoCloseCircle,
  IoAlertCircle, IoCameraOutline, IoKeypadOutline, IoRefreshOutline,
} from 'react-icons/io5';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MODE = { CAMERA: 'camera', MANUAL: 'manual' };
const SCANNER_ID = 'qr-reader-cam';

export default function ScannerPage() {
  const [mode, setMode] = useState(MODE.CAMERA);
  const [qrInput, setQrInput] = useState('');
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const inputRef = useRef(null);
  const html5QrRef = useRef(null);
  const processingRef = useRef(false); // prevent double-fire
  const isInitializingRef = useRef(false);

  /* ─── Camera lifecycle ─── */
  const startCamera = async () => {
    if (html5QrRef.current || isInitializingRef.current) return;
    isInitializingRef.current = true;
    setCameraError(null);
    try {
      const qr = new Html5Qrcode(SCANNER_ID);
      html5QrRef.current = qr;

      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          if (!processingRef.current) {
            processingRef.current = true;
            handleScan(decodedText);
          }
        },
        () => {} // ignore error frames
      );
      
      // Race condition guard: if stopCamera was called while we were starting
      if (html5QrRef.current !== qr) {
         try { await qr.stop(); } catch(e) {}
         try { qr.clear(); } catch(e) {}
         return;
      }
      
      setCameraReady(true);
    } catch (err) {
      setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
      setCameraReady(false);
      html5QrRef.current = null;
    } finally {
      isInitializingRef.current = false;
    }
  };

  const stopCamera = async () => {
    const qr = html5QrRef.current;
    if (qr) {
      html5QrRef.current = null; // Detach immediately
      try {
        await qr.stop();
      } catch (_) {}
      try {
        qr.clear();
      } catch (_) {}
    }
    setCameraReady(false);
  };

  useEffect(() => {
    if (mode === MODE.CAMERA) {
      startCamera();
    } else {
      stopCamera();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => { stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* ─── Scan logic ─── */
  const handleScan = async (token) => {
    if (!token?.trim()) return;
    setScanning(true);
    setResult(null);
    try {
      const { data } = await api.post('/operator/scan', { qr_code_token: token.trim() });
      setResult(data);
      if (data.valid) {
        toast.success('Check-in berhasil!');
      } else {
        toast.error(data.message || 'Tiket tidak valid');
      }
    } catch (err) {
      const data = err.response?.data;
      setResult({ valid: false, message: data?.message || 'Scan gagal', ticket: data?.ticket });
      toast.error(data?.message || 'Scan gagal');
    }
    setScanning(false);
    setQrInput('');
    
    if (mode === MODE.MANUAL) {
      processingRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Pause scanner to stop frame processing visually if supported
      try { html5QrRef.current?.pause(); } catch(e) {}
    }
  };

  const resetResult = () => {
    setResult(null);
    setQrInput('');
    processingRef.current = false;
    
    if (mode === MODE.CAMERA) {
      try { html5QrRef.current?.resume(); } catch(e) {}
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  /* ─── Status colours ─── */
  const resultColor = result?.valid
    ? 'var(--success)'
    : result?.message?.includes('sudah')
      ? 'var(--warning)'
      : 'var(--danger)';

  const ResultIcon = result?.valid
    ? IoCheckmarkCircle
    : result?.message?.includes('sudah')
      ? IoAlertCircle
      : IoCloseCircle;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Scanner QR Ticket</h1>
        <p className="page-subtitle">Scan QR code tiket untuk check-in peserta</p>
      </div>

      {/* ── Mode Toggle ── */}
      <div style={{
        display: 'inline-flex', background: 'var(--paper)',
        borderRadius: 'var(--radius-lg)', padding: 4, marginBottom: '1.5rem', gap: 4,
      }}>
        {[
          { id: MODE.CAMERA, icon: <IoCameraOutline />, label: 'Kamera' },
          { id: MODE.MANUAL, icon: <IoKeypadOutline />, label: 'Manual' },
        ].map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1.2rem', borderRadius: 'var(--radius-md)',
              border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              background: mode === id ? 'var(--teal)' : 'transparent',
              color: mode === id ? '#fff' : 'var(--ink-soft)',
              transition: 'all 0.2s',
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Camera Mode ── */}
      {mode === MODE.CAMERA && (
        <div className="card" style={{ maxWidth: 620, marginBottom: '2rem', display: result ? 'none' : 'block' }}>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <p style={{ textAlign: 'center', color: 'var(--ink-soft)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Arahkan kamera ke QR code pada tiket
            </p>

            {cameraError ? (
              <div style={{
                textAlign: 'center', padding: '2rem',
                background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)',
              }}>
                <IoCloseCircle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{cameraError}</p>
                <button className="btn btn-primary btn-sm" onClick={startCamera}>
                  <IoRefreshOutline /> Coba Lagi
                </button>
              </div>
            ) : (
              <>
                {/* html5-qrcode mounts here */}
                <div
                  id={SCANNER_ID}
                  style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
                />
                {scanning && (
                  <p style={{ textAlign: 'center', color: 'var(--teal)', marginTop: '1rem', fontWeight: 600 }}>
                    Memproses tiket...
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Manual Mode ── */}
      {mode === MODE.MANUAL && (
        <div className="card" style={{ maxWidth: 620, marginBottom: '2rem' }}>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <IoQrCodeOutline size={64} color="var(--teal)" style={{ marginBottom: '1rem' }} />
            <p style={{ color: 'var(--ink-soft)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Hubungkan barcode scanner eksternal atau ketik kode tiket secara manual
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleScan(qrInput); }}>
              <input
                ref={inputRef}
                type="text"
                className="form-input"
                placeholder="Scan atau ketik kode QR ticket..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '1rem', letterSpacing: '0.05em' }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={scanning || !qrInput.trim()}>
                {scanning ? 'Memproses...' : 'Verifikasi Tiket'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Result Panel ── */}
      {result && (
        <div className="card" style={{ maxWidth: 620, animation: 'slideUp 0.3s ease' }}>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <ResultIcon size={80} color={resultColor} style={{ marginBottom: '0.75rem' }} />
            <h2 style={{ color: resultColor, marginBottom: '0.5rem', fontSize: '1.4rem' }}>
              {result.valid ? 'Check-in Berhasil!' : result.message}
            </h2>

            {result.ticket && (
              <div style={{
                textAlign: 'left', marginTop: '1.25rem', padding: '1rem 1.25rem',
                background: 'var(--paper)', borderRadius: 'var(--radius-md)',
                display: 'grid', gap: '0.5rem',
              }}>
                {[
                  ['Event', result.ticket.transaction?.event?.title],
                  ['Jenis Tiket', result.ticket.ticket_type?.name],
                  result.ticket.seat ? ['Kursi', result.ticket.seat.seat_number] : null,
                  ['Pembeli', result.ticket.transaction?.user?.username],
                ].filter(Boolean).map(([label, value]) => (
                  <p key={label} style={{ margin: 0, fontSize: '0.9rem' }}>
                    <strong style={{ color: 'var(--ink-soft)', minWidth: 90, display: 'inline-block' }}>{label}:</strong>
                    {' '}<span style={{ color: 'var(--ink)' }}>{value}</span>
                  </p>
                ))}
              </div>
            )}

            <button
              className="btn btn-secondary btn-sm"
              onClick={resetResult}
              style={{ marginTop: '1.25rem' }}
            >
              <IoRefreshOutline /> Scan Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
