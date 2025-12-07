import { useState, useEffect } from "react";
import { ThemeProvider } from '@mui/material/styles';
import theme from "./theme";
import "./App.css";
import SocialIcons from "./components/SocialIcons";
import HomePage from "./pages/HomePage";
import SoloProjectPage from "./pages/SoloProjectPage";
import GDDPage from "./pages/GDDPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  const [activePage, setActivePage] = useState(() =>
    (typeof window !== "undefined" && window.location.hash.replace("#", "")) || "home"
  );

  useEffect(() => {
    const applyHash = () => {
      const next = window.location.hash.replace("#", "") || "home";
      setActivePage(next);
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
          <div className="topbar-center">
            <a href="#home">
              <button
                className={`nav-button ${activePage === "home" ? "active" : ""}`}
                onClick={() => setActivePage("home")}>
                H.T
              </button>
            </a>
            <a href="#SoloProject">
              <button
                className={`nav-button ${activePage === "SoloProject" ? "active" : ""}`}
                onClick={() => setActivePage("SoloProject")}>
                Solo Project
              </button>
            </a>
            <a href="#GDD">
              <button
                className={`nav-button ${activePage === "GDD" ? "active" : ""}`}
                onClick={() => setActivePage("GDD")}>
                GDD
              </button>
            </a>
            <a href="#About">
              <button
                className={`nav-button ${activePage === "About" ? "active" : ""}`}
                onClick={() => setActivePage("About")}>
                About
              </button>
            </a>
          </div>
        </div>

        {activePage === "home" && <HomePage />}

        {activePage === "SoloProject" && <SoloProjectPage />}

        {activePage === "GDD" && <GDDPage />}

        {activePage === "About" && <AboutPage />}

        {/* --- Footer (sticky) --- */}
        <footer className="footer">
          <div className="footer-left">
            <span className="footer-name">Go_Hei!Hei?,</span>
            <span className="footer-role"> IT Be Dev</span>
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
