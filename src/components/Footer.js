// src/components/Footer.js
import React from 'react';
import './Footer.css';
import { useConsent } from "../consent/ConsentContext";


export default function Footer() {
  const year = new Date().getFullYear();
  const { setOpenPanel } = useConsent();
  return (
    <footer className="app-footer" role="contentinfo" aria-label="Pie de página">
      <div className="app-footer__inner">
        <div className="app-footer__left">
          <span className="app-footer__brand">Cocinaplay</span>
          <span className="app-footer__dot" aria-hidden>•</span>
          <span className="app-footer__tag">Beta</span>
        </div>
        <button className="app-footer__cookiesBtn" onClick={() => setOpenPanel(true)}>
          Gestionar cookies
        </button>


        <div className="app-footer__right">
          <span className="app-footer__credit">
            App desarrollada por {" "} 
            <strong>
              <a href="https://devcode73.com.ar" target="_blank" rel="noopener noreferrer" className="footer-link">Devcode73</a>
            </strong>
          </span>
          <span className="app-footer__sep" aria-hidden>—</span>
          <span className="app-footer__year">© {year}</span>
        </div>
      </div>
    </footer>
  );
}
