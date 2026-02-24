import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './TopBar.css';

/** Dialogo de confirmación simple (sin window.confirm) */
function ConfirmDialog({ open, text, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="confirmOverlay" onClick={onCancel}>
      <div className="confirmBox" onClick={(e) => e.stopPropagation()}>
        <div style={{ marginBottom: 8 }}>{text}</div>
        <div className="confirmActions">
          <button className="btn" onClick={onCancel}>Cancelar</button>
          <button className="btn danger" onClick={onConfirm}>Aceptar</button>
        </div>
      </div>
    </div>
  );
}

export default function TopBar({
  qualityName,
  onChangeQuality,
  onAdmin,
  onOpenAdminLogin,
  onOpenShowcase,
  showQualityControls = true,
}) {
  const { user, isAdmin, loginGoogle, logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const runNewProject = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('kitchen.')) localStorage.removeItem(k);
      }
    } catch {}
    window.location.reload();
  };

  const handleNewProject = () => setConfirmOpen(true);

  return (
    <>
      <header className="topbar">
        {/* Izquierda - marca */}
        <div className="topbar__brand">
          {/*<img src="/dk.png" width="100" height="55" alt="Logo Dekam" /> */}
          <img src="/CocinaPlayLogo2.png" width="180" height="70" alt="Logo Cocinaplay" />
          {/*<span className="topbar__brandName">Dekam</span> */}
          <span className="app-footer__tag">Beta</span>
        </div>

        {/* Centro - nuevo proyecto + calidad */}
        <div className="topbar__center">
          <button
            className="btn outline"
            onClick={handleNewProject}
            title="Borra el proyecto y reinicia"
          >
            Nuevo proyecto
          </button>

          {showQualityControls && (
            <>
              <div className="topbar__qualityBadge" title="Calidad seleccionada">
                <span className="dot" />
                <span className="label">
                  Calidad: <strong>{qualityName || '—'}</strong>
                </span>
              </div>

              <button className="btn ghost" onClick={onChangeQuality}>
                Cambiar calidad
              </button>
            </>
          )}

          {/* 👇 Botón nuevo */}
          <button
            className="btn primary"
            onClick={onOpenShowcase}
            title="Ver ejemplos de diseños y renders"
            aria-label="Ver ejemplos y renders"
          >
            Inspírate ✨
          </button>
        </div>

        {/* Derecha - acciones */}
        <div className="topbar__actions">
          <button className="btn outline" onClick={onOpenAdminLogin} title="Ingresar como administrador">
            Acceso admin
          </button>

          {user && isAdmin && (
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
        <div className="topbar__tagline">
          Diseña facil y jugando tu cocina modular en 2D. Renderiza con IA probando distintos acabados
        </div>

      </header>
      

      <ConfirmDialog
        open={confirmOpen}
        text="Esto borrará tu proyecto guardado en este navegador y reiniciará la app. ¿Continuar?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={runNewProject}
      />
    </>
  );
}
