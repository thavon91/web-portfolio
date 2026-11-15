import { useState, useEffect, useRef } from "react";
import { ThemeProvider } from '@mui/material/styles';
import theme from "./theme";
import "./App.css";
import SocialIcons from "./components/SocialIcons";
import HomePage from "./pages/HomePage";
import SoloProjectPage from "./pages/SoloProjectPage";
import GDDPage from "./pages/GDDPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggle = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event) => { if (!event.target.closest('.topbar')) setMenuOpen(false); };
    const closeEscape = (event) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuToggle.current?.focus(); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [menuOpen]);
  const [activePage, setActivePage] = useState(() =>
    (typeof window !== "undefined" && window.location.hash.replace("#", "")) || "home"
  );

  useEffect(() => {
    const applyHash = () => {
      const next = window.location.hash.replace("#", "") || "home";
      setActivePage(next);
      setMenuOpen(false);
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('.reveal-on-scroll'));
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        }
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activePage]);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="menu">
        <div className="topbar">
          <a className="brand" href="#home">PORT<span>FOLIO</span></a>
          <button ref={menuToggle} type="button" className="mobile-menu-toggle"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen} aria-controls="portfolio-navigation"
            onClick={() => setMenuOpen(open => !open)}>
            <span /><span /><span />
          </button>
          <nav id="portfolio-navigation" aria-label="Main navigation"
            className={`topbar-center${menuOpen ? ' is-open' : ''}`}>
            {[['home', 'Home'], ['SoloProject', 'Solo Project'], ['GDD', 'GDD'], ['About', 'About']].map(([page, label]) => (
              <a key={page} href={`#${page}`} className={`nav-button ${activePage === page ? 'active' : ''}`}
                aria-current={activePage === page ? 'page' : undefined}
                onClick={() => { setActivePage(page); setMenuOpen(false); }}>
                {label}
              </a>
            ))}
          </nav>
        </div>

        {activePage === "home" && <HomePage />}

        {activePage === "SoloProject" && <SoloProjectPage />}

        {activePage === "GDD" && <GDDPage />}

        {activePage === "About" && <AboutPage />}

        {/* --- Footer (sticky) --- */}
        <footer className="footer">
          <div className="footer-left">
            <span className="footer-name">Go_Hei!Hei?,</span>
            <span className="footer-role"> IT Can Be Dev</span>
          </div>

          <div className="footer-center">
            <SocialIcons size={35} />
          </div>

          <div className="footer-right">
            <button
              className="back-to-top"
              onClick={handleBackToTop}
            >
              ↑ Top
            </button>
          </div>
        </footer>

      </div>
    </ThemeProvider>
  );
}
