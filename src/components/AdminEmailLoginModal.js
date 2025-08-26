// src/components/AdminEmailLoginModal.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminEmailLoginModal({ onClose }) {
  const { loginAdminWithPassword, isAdmin, adminError } = useAuth();
  const [email, setEmail] = useState(process.env.REACT_APP_ADMIN_EMAIL || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setBusy(true);
    try {
      await loginAdminWithPassword(email.trim(), password);
      onClose?.(); // si loguea OK, cerramos modal
    } catch (err) {
      setLocalError(err?.message || 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 360, background: '#fff', borderRadius: 12, padding: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Acceso administrador</h3>
          <button className="btn ghost" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Email</span>
            <input
              type="email"
              placeholder="admin@tudominio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>Contraseña</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {(localError || adminError) && (
            <div style={{ color: '#b00020', fontSize: 13 }}>
              {localError || adminError}
            </div>
          )}

          <button className="btn primary" type="submit" disabled={busy}>
            {busy ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p style={{ marginTop: 10, color: '#666', fontSize: 12 }}>
          Este acceso es exclusivo para administradores. Los usuarios comunes pueden usar “Iniciar sesión” con Google.
        </p>
      </div>
    </div>
  );
}
