// src/components/TopBar.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import './TopBar.css';

export default function TopBar({ qualityName, onChangeQuality, onAdmin, onOpenAdminLogin }) {
  const { user, loginGoogle, logout } = useAuth();

  const handleNewProject = () => {
    if (!window.confirm('Esto borrará tu proyecto guardado en este navegador y reiniciará la app. ¿Continuar?')) {
      return;
    }
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('kitchen.')) localStorage.removeItem(k);
      }
    } catch {}
    window.location.reload();
  };

  return (
    <header className="topbar">
      {/* Izquierda - marca */}
      <div className="topbar__brand">
        <img src="/dk.png" width="100" height="55" alt="Logo Dekam" />
        <span className="topbar__brandName">Easy Kitchen Design</span>
      </div>

      {/* Centro - nuevo proyecto + calidad */}
      <div className="topbar__center">
        {/* 👉 Movido acá para que no quede tan a la izquierda */}
        <button className="btn outline" onClick={handleNewProject} title="Borra el proyecto y reinicia">
          Nuevo proyecto
        </button>

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
