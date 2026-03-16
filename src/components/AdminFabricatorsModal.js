// src/components/AdminFabricatorsModal.js
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { API_BASE_URL_CREDITS } from '../api/http';
import { useToast } from './ToastProvider';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AdminFabricatorsModal.css';


const GEO_KEY =
  (typeof process !== 'undefined' && process.env?.REACT_APP_GEOAPIFY_KEY) ||
  (typeof window !== 'undefined' ? window.GEOAPIFY_KEY : null);

/* ============================================================
   Mapa interactivo (Leaflet) con zoom y pan
   ============================================================ */
function MapPreview({ lat, lng, address }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  const hasCoords = (lat || lat === 0) && (lng || lng === 0);

  useEffect(() => {
    if (!containerRef.current || !hasCoords) return;

    // destruye mapa previo si existe
    if (mapRef.current) {
      try { mapRef.current.remove(); } catch {}
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    const tileUrl = GEO_KEY
      ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEO_KEY}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution = GEO_KEY
      ? '© OpenStreetMap, © Geoapify'
      : '© OpenStreetMap contributors';

    L.tileLayer(tileUrl, { maxZoom: 20, attribution }).addTo(map);

    const pt = L.latLng(lat, lng);
    map.setView(pt, 16);

    // marcador simple (evita problemas de assets del ícono por defecto)
    L.circleMarker(pt, {
      radius: 8,
      color: '#ff6f00',
      weight: 2,
      fillColor: '#ff6f00',
      fillOpacity: 0.9,
    }).addTo(map);

    // fix de tamaño al mostrarse dentro del modal
    setTimeout(() => map.invalidateSize(), 120);

    return () => {
      try { map.remove(); } catch {}
      mapRef.current = null;
    };
  }, [lat, lng, hasCoords]);

  if (!hasCoords) {
    return (
      <div className="afm-mapLinks">
        {address ? (
          <a
            className="afm-pill afm-pill--link"
            href={`https://www.google.com/maps?q=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noreferrer"
          >
            Abrir en Google Maps
          </a>
        ) : (
          <span className="afm-pill afm-pill--warn">
            Sin coordenadas
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="afm-mapBlock">
      <div
        ref={containerRef}
        className="afm-mapCanvas"
      />
      <div className="afm-mapLinks">
        <a
          className="afm-pill afm-pill--link"
          href={`https://www.google.com/maps?q=${encodeURIComponent(address || `${lat},${lng}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          Abrir en Google Maps
        </a>
        <a
          className="afm-pill afm-pill--link"
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
        >
          Abrir en OpenStreetMap
        </a>
      </div>
    </div>
  );
}

/* ============================================================
   Modal de administración
   ============================================================ */
export default function AdminFabricatorsModal({ open, onClose }) {
  const toast = useToast();
  const { user, isAdmin, authReady } = useAuth();

  const [tab, setTab] = useState('pending'); // 'pending' | 'approved' | 'rejected'
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [openMapId, setOpenMapId] = useState(null); // toggle por item
  const [busyId, setBusyId] = useState(null); // deshabilita botones por fila mientras parchea

  const norm = (s) =>
    (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

  const filtered = useMemo(() => {
    if (!q) return items;
    const nq = norm(q);
    return items.filter((f) =>
      norm(`${f.name} ${f.city} ${f.province} ${f.zip} ${f.email} ${f.address}`).includes(nq),
    );
  }, [items, q]);

  const fetchList = useCallback(async () => {
    if (!authReady) return;
    if (!user || !isAdmin) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const r = await fetch(`${API_BASE_URL_CREDITS}/fabricators/admin?status=${tab}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.status === 401 || r.status === 403) {
        toast.error('No autorizado', 'Iniciá sesión como admin.');
        setItems([]);
        return;
      }
      const js = await r.json().catch(() => null);
      if (!r.ok) throw new Error(js?.error || `HTTP ${r.status}`);
      setItems(Array.isArray(js?.items) ? js.items : []);
    } catch (e) {
      console.error('[admin/fabricators] fetch error', e);
      toast.error('No se pudo cargar la lista de fabricantes.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [authReady, user, isAdmin, tab, toast]);

  useEffect(() => {
    if (!open) return;
    fetchList();
  }, [open, tab, fetchList]);

  const askConfirm = async ({ title, description }) => {
    if (toast?.confirm) {
      return await toast.confirm({
        title,
        description,
        confirmText: 'Sí, confirmar',
        cancelText: 'Cancelar',
      });
    }
    return window.confirm(title);
  };

  // ---- PATCH helper: ahora recibe la acción ('approve'|'reject') ----
  const doPatch = useCallback(
    async (id, action) => {
      if (!user || !isAdmin) {
        toast.error('No autorizado');
        return false;
      }
      try {
        const token = await user.getIdToken();
        const r = await fetch(`${API_BASE_URL_CREDITS}/fabricators/admin/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        });
        const js = await r.json().catch(() => null);
        if (!r.ok) throw new Error(js?.error || `HTTP ${r.status}`);
        return true;
      } catch (e) {
        console.error('[admin/fabricators] patch error', e);
        // Si el backend responde { error: 'bad_action' }, se muestra claro:
        toast.error(
          e?.message === 'bad_action'
            ? "Acción inválida (debe ser 'approve' o 'reject')."
            : 'No se pudo actualizar el registro.'
        );
        return false;
      }
    },
    [user, isAdmin, toast],
  );

  const handleApprove = async (f) => {
    const ok = await askConfirm({
      title: `¿Aprobar "${f.name}"?`,
      description: 'El fabricante quedará visible en la búsqueda pública.',
    });
    if (!ok) return;
    setBusyId(f._id);
    const done = await doPatch(f._id, 'approve');
    setBusyId(null);
    if (done) {
      toast.success('Registro aprobado');
      fetchList();
    }
  };

  const handleReject = async (f) => {
    const ok = await askConfirm({
      title: `¿Rechazar "${f.name}"?`,
      description: 'El fabricante no estará visible en la búsqueda pública.',
    });
    if (!ok) return;
    setBusyId(f._id);
    const done = await doPatch(f._id, 'reject');
    setBusyId(null);
    if (done) {
      toast.success('Registro rechazado');
      fetchList();
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="afm-overlay"
    >

      {/* NO cerrar al click afuera */}
      <div
        className="afm-card"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="afm-header">
          <strong className="afm-title">Administrar fabricantes</strong>

          <div className="afm-tabs">
            <button className={`btn ${tab === 'pending' ? 'primary' : ''}`} onClick={() => setTab('pending')}>
              Pendientes
            </button>
            <button className={`btn ${tab === 'approved' ? 'primary' : ''}`} onClick={() => setTab('approved')}>
              Aprobados
            </button>
            <button className={`btn ${tab === 'rejected' ? 'primary' : ''}`} onClick={() => setTab('rejected')}>
              Rechazados
            </button>
          </div>

          <div className="afm-spacer" />


          <div className="afm-header__right">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, localidad, CP, email…"
              className="afm-input"
            />
            <button className="btn" onClick={fetchList} disabled={loading}>
              {loading ? 'Buscando…' : 'Buscar'}
            </button>
            <button className="btn" onClick={onClose}>
              Cerrar
            </button>
          </div>

        </div>

        {/* Body */}
        <div className="afm-body">

          {loading ? (
            <div className="afm-hint">Cargando…</div>

          ) : filtered.length === 0 ? (
            <div className="afm-hint">No hay registros.</div>

          ) : (
            <ul className="afm-list">

              {filtered.map((f) => {
                const lat = f?.geo?.lat;
                const lng = f?.geo?.lng;
                const hasCoords = (lat || lat === 0) && (lng || lng === 0);

                return (
                  <li key={f._id} className="afm-item">

                    <div className="afm-row">
                      <strong className="afm-item__title">{f.name}</strong>

                      <span className="afm-pill">

                        {f.city || '—'}, {f.province || '—'} {f.zip ? `(${f.zip})` : ''}
                      </span>

                      {(() => {
                        if (!f.website) return null;
                        const raw = String(f.website).trim();
                        const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`;
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="afm-pill afm-pill--link"
                          >
                            Sitio web
                          </a>
                        );
                      })()}

                      <div className="afm-spacer" />


                      {f.phone && (
                        <span className="afm-muted">
                          <span>📞 </span>
                          {f.phone}
                        </span>
                      )}
                      {f.email && (
                        <span className="afm-muted">
                          &nbsp;• ✉️ {f.email}
                        </span>
                      )}
                    </div>

                    {f.address && (
                      <div className="afm-address">
                        <a
                          href={`https://www.google.com/maps?q=${encodeURIComponent(f.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#cfd3ff', textDecoration: 'none' }}
                          title="Abrir en Google Maps"
                        >
                          {f.address}
                        </a>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="afm-actions">
                      {tab !== 'approved' && (
                        <button
                          className="btn primary"
                          onClick={() => handleApprove(f)}
                          disabled={busyId === f._id}
                        >
                          {busyId === f._id ? 'Procesando…' : 'Aprobar'}
                        </button>
                      )}
                      {tab !== 'rejected' && (
                        <button
                          className="btn danger"
                          onClick={() => handleReject(f)}
                          disabled={busyId === f._id}
                        >
                          {busyId === f._id ? 'Procesando…' : 'Rechazar'}
                        </button>
                      )}
                      <button
                        className="btn"
                        onClick={() => setOpenMapId((id) => (id === f._id ? null : f._id))}
                        title={openMapId === f._id ? 'Ocultar mapa' : 'Ver mapa'}
                      >
                        {openMapId === f._id ? 'Ocultar mapa' : 'Ver mapa'}
                      </button>
                      {hasCoords && (
                        <span className="afm-pill afm-pill--coords">
                          {lat.toFixed(6)}, {lng.toFixed(6)}
                        </span>
                      )}
                    </div>

                    {/* Mapa interactivo (toggle) */}
                    {openMapId === f._id && <MapPreview lat={lat} lng={lng} address={f.address} />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
