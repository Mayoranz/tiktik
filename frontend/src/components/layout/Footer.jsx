export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="logo-mark">TIK<em>TIK</em></div>
            <p>
              Platform pemesanan tiket terpercaya untuk konser, festival, teater, dan event lainnya —
              harga terbaik, pengalaman tanpa ribet.
            </p>
            <div className="socials" style={{ marginTop: 18 }}>
              <a href="#" aria-label="Facebook">f</a>
              <a href="#" aria-label="Instagram">ig</a>
              <a href="#" aria-label="Twitter">tw</a>
            </div>
          </div>

          {/* Navigasi */}
          <div className="footer-col">
            <h5>Navigasi</h5>
            <ul>
              <li><a href="/">Beranda</a></li>
              <li><a href="/login">Masuk</a></li>
              <li><a href="/register">Daftar</a></li>
            </ul>
          </div>

          {/* Bantuan */}
          <div className="footer-col">
            <h5>Bantuan</h5>
            <ul>
              <li><a href="#">Cara Beli Tiket</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Hubungi Kami</a></li>
            </ul>
          </div>

          {/* Organizer */}
          <div className="footer-col">
            <h5>Untuk Organizer</h5>
            <ul>
              <li><a href="#">Partnership</a></li>
              <li><a href="#">Daftarkan Event</a></li>
              <li><a href="#">Business Support</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} TIKTIK. All rights reserved.</span>
          <span>Made for live events, everywhere.</span>
        </div>
      </div>
    </footer>
  );
}
