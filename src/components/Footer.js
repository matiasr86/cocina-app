// src/components/Footer.js
import React from 'react';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer" role="contentinfo" aria-label="Pie de página">
      <div className="app-footer__inner">
        <div className="app-footer__left">
          <span className="app-footer__brand">Easy Kitchen Design</span>
          <span className="app-footer__dot" aria-hidden>•</span>
          <span className="app-footer__tag">Beta</span>
        </div>

        <div className="app-footer__right">
          <span className="app-footer__credit">
            App desarrollada por <strong>Devcode73</strong>
          </span>
          <span className="app-footer__sep" aria-hidden>—</span>
          <span className="app-footer__year">© {year}</span>
        </div>
      </div>
    </footer>
  );
}
