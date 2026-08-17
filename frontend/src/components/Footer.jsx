export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <p className="footer-name">Built by Aakash Sharma</p>
        <div className="footer-links">
          <a href="mailto:sharma.aakash9877@gmail.com" className="link-muted">
            sharma.aakash9877@gmail.com
          </a>
          <span className="footer-sep">·</span>
          <a href="https://www.linkedin.com/in/aakash-sharma-432a0526a/" target="_blank" rel="noopener noreferrer" className="link-muted">
            LinkedIn
          </a>
          <span className="footer-sep">·</span>
          <a href="https://wa.me/918368548880" target="_blank" rel="noopener noreferrer" className="link-muted">
            WhatsApp queries
          </a>
        </div>
      </div>
    </footer>
  );
}