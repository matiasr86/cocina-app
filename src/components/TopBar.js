import React, { useEffect, useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const instancia = (process.env.REACT_APP_INSTANCIA || 'base').toLowerCase().trim();

  const helpUrl =
    instancia === 'fabricante'
      ? 'https://www.devcode73.com.ar/ayuda-cocinaplay-fabricante'
      : 'https://www.devcode73.com.ar/ayuda-cocinaplay';

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 640) setMobileMenuOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const openHelp = () => {
    closeMobileMenu();
    window.open(helpUrl, '_blank', 'noopener,noreferrer');
  };

  const runNewProject = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('kitchen.')) localStorage.removeItem(k);
      }
    } catch {}
    window.location.reload();
  };

  const handleNewProject = () => {
    closeMobileMenu();
    setConfirmOpen(true);
  };

  const handleShowcase = () => {
    closeMobileMenu();
    onOpenShowcase?.();
  };

  const handleChangeQuality = () => {
    closeMobileMenu();
    onChangeQuality?.();
  };

  const handleAdminLogin = () => {
    closeMobileMenu();
    onOpenAdminLogin?.();
  };

  const handleAdmin = () => {
    closeMobileMenu();
    onAdmin?.();
  };

  const handleLogin = () => {
    closeMobileMenu();
    loginGoogle?.();
  };

  const handleLogout = () => {
    closeMobileMenu();
    logout?.();
  };

  return (
    <>
      <header className={`topbar ${mobileMenuOpen ? 'is-mobile-open' : ''}`}>
        {/* Marca */}
        <div className="topbar__brand">
          <img
            src="/CocinaPlayLogo2.png"
            className="topbar__brandImg"
            alt="Logo Cocinaplay"
          />
          <span className="topbar__betaTag">Beta</span>
        </div>

        {/* Toggle mobile */}
        <button
          type="button"
          className={`topbar__mobileToggle ${mobileMenuOpen ? 'is-open' : ''}`}
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        {/* Desktop - centro */}
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

              <button className="btn ghost" onClick={handleChangeQuality}>
                Cambiar calidad
              </button>
            </>
          )}

          <button
            className="btn primary"
            onClick={handleShowcase}
            title="Ver ejemplos de diseños y renders"
            aria-label="Ver ejemplos y renders"
          >
            Inspírate ✨
          </button>
        </div>

        {/* Desktop - acciones */}
        <div className="topbar__actions">
          <button
            className="btn outline"
            onClick={openHelp}
            title="Abrir centro de ayuda"
            aria-label="Abrir ayuda"
          >
            Ayuda
          </button>

          <button
            className="btn outline"
            onClick={handleAdminLogin}
            title="Ingresar como administrador"
          >
            Acceso admin
          </button>

          {user && isAdmin && (
            <button className="btn primary" onClick={handleAdmin}>
              Configuración
            </button>
          )}

          {!user ? (
            <button className="btn primary" onClick={handleLogin}>
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
              <button className="btn danger outline" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

        {/* Desktop tagline */}
        <div className="topbar__tagline">
          Diseña facil y jugando tu cocina modular en 2D. Renderiza con IA probando distintos acabados
        </div>

        {/* Mobile panel */}
        <div className="topbar__mobilePanel">
          <div className="topbar__mobileTagline">
            Diseña facil y jugando tu cocina modular en 2D. Renderiza con IA probando distintos acabados
          </div>

          <div className="topbar__mobileSection">
            <button
              className="btn outline"
              onClick={handleNewProject}
              title="Borra el proyecto y reinicia"
            >
              Nuevo proyecto
            </button>

            <button
              className="btn primary"
              onClick={handleShowcase}
              title="Ver ejemplos de diseños y renders"
              aria-label="Ver ejemplos y renders"
            >
              Inspírate ✨
            </button>

            {showQualityControls && (
              <>
                <div className="topbar__qualityBadge topbar__qualityBadge--mobile" title="Calidad seleccionada">
                  <span className="dot" />
                  <span className="label">
                    Calidad: <strong>{qualityName || '—'}</strong>
                  </span>
                </div>

                <button className="btn ghost" onClick={handleChangeQuality}>
                  Cambiar calidad
                </button>
              </>
            )}

            <button
              className="btn outline"
              onClick={openHelp}
              title="Abrir centro de ayuda"
              aria-label="Abrir ayuda"
            >
              Ayuda
            </button>

            <button
              className="btn outline"
              onClick={handleAdminLogin}
              title="Ingresar como administrador"
            >
              Acceso admin
            </button>

            {user && isAdmin && (
              <button className="btn primary" onClick={handleAdmin}>
                Configuración
              </button>
            )}

            {!user ? (
              <button className="btn primary" onClick={handleLogin}>
                Iniciar sesión
              </button>
            ) : (
              <div className="topbar__mobileUser">
                <img
                  className="topbar__avatar"
                  src={
                    user.photoURL ||
                    'https://ui-avatars.com/api/?background=ddd&name=' +
                      encodeURIComponent(user.displayName || 'U')
                  }
                  alt={user.displayName || user.email || 'Usuario'}
                />
                <button className="btn danger outline" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
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