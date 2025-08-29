// src/components/TopBar.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import './TopBar.css';

export default function TopBar({ qualityName, onChangeQuality, onAdmin, onOpenAdminLogin }) {
  const { user, loginGoogle, logout } = useAuth();

  return (
    <header className="topbar">
      {/* Izquierda - marca */}
      <div className="topbar__brand">
        <img src="/dk.png" width="100" height="55" alt="Logo Dekam" />
        <span className="topbar__brandName">Easy Kitchen Design</span>
      </div>

      {/* Centro - calidad */}
      <div className="topbar__center">
        <div className="topbar__qualityBadge" title="Calidad seleccionada">
          <span className="dot" />
          <span className="label">
            Calidad: <strong>{qualityName || '—'}</strong>
          </span>
        </div>
        <button className="btn ghost" onClick={onChangeQuality}>
          Cambiar calidad
        </button>
      </div>

      {/* Derecha - acciones */}
      <div className="topbar__actions">
        <button className="btn outline" onClick={onOpenAdminLogin} title="Ingresar como administrador">
          Acceso admin
        </button>

        {user && (
          <button className="btn primary" onClick={onAdmin}>
            Configuración
          </button>
        )}

        {!user ? (
          <button className="btn primary" onClick={loginGoogle}>
            Iniciar sesión
          </button>
        ) : (
          <div className="topbar__user">
            <img
              className="topbar__avatar"
              src={
                user.photoURL ||
                'https://ui-avatars.com/api/?background=ddd&name=' +
                  encodeURIComponent(user.displayName || 'U')
              }
              alt={user.displayName || user.email || 'Usuario'}
            />
            <button className="btn danger outline" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
