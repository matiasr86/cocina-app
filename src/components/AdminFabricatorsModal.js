// src/components/AdminFabricatorsModal.js
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { API_BASE_URL_CREDITS } from '../api/http';
import { useToast } from './ToastProvider';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {address ? (
          <a
            className="pill"
            href={`https://www.google.com/maps?q=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noreferrer"
          >
            Abrir en Google Maps
          </a>
        ) : (
          <span className="pill" style={{ background: '#251e00', color: '#ffda7f' }}>
            Sin coordenadas
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 280,
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid #2a2a2a',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <a
          className="pill"
          href={`https://www.google.com/maps?q=${encodeURIComponent(address || `${lat},${lng}`)}`}
          target="_blank"
          rel="noreferrer"
        >
          Abrir en Google Maps
        </a>
        <a
          className="pill"
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2200,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(0,0,0,.5)',
      }}
    >
      {/* NO cerrar al click afuera */}
      <div
        style={{
          width: 'min(1100px, 95vw)',
          maxHeight: '90vh',
          background: '#0f0f0f',
          color: '#eee',
          borderRadius: 14,
          boxShadow: '0 10px 40px rgba(0,0,0,.55)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 14,
            borderBottom: '1px solid #222',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <strong style={{ fontSize: 18 }}>Administrar fabricantes</strong>

          <div style={{ display: 'flex', gap: 8, marginLeft: 10 }}>
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

          <div style={{ flex: 1 }} />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, localidad, CP, email…"
            style={{
              padding: '8px 10px',
              borderRadius: 10,
              background: '#171717',
              color: '#ddd',
              border: '1px solid #2a2a2a',
              minWidth: 360,
            }}
          />
          <button className="btn" onClick={fetchList} disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
          <button className="btn" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 14, overflow: 'auto' }}>
          {loading ? (
            <div style={{ color: '#bbb' }}>Cargando…</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: '#bbb' }}>No hay registros.</div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {filtered.map((f) => {
                const lat = f?.geo?.lat;
                const lng = f?.geo?.lng;
                const hasCoords = (lat || lat === 0) && (lng || lng === 0);

                return (
                  <li
                    key={f._id}
                    style={{
                      border: '1px solid #2a2a2a',
                      borderRadius: 10,
                      padding: 12,
                      background: '#131313',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ color: '#fff' }}>{f.name}</strong>

                      <span className="pill" style={{ background: '#1e1e1e', color: '#ddd' }}>
                        {f.city || '—'}, {f.province || '—'} {f.zip ? `(${f.zip})` : ''}
                      </span>

                      {f.website && (
                        <a
                          href={f.website}
                          target="_blank"
                          rel="noreferrer"
                          className="pill"
                          style={{ textDecoration: 'none' }}
                        >
                          Sitio web
                        </a>
                      )}

                      <div style={{ flex: 1 }} />

                      {f.phone && (
                        <span style={{ color: '#bbb' }}>
                          <span>📞 </span>
                          {f.phone}
                        </span>
                      )}
                      {f.email && (
                        <span style={{ color: '#bbb' }}>
                          &nbsp;• ✉️ {f.email}
                        </span>
                      )}
                    </div>

                    {f.address && (
                      <div style={{ color: '#aaa', marginTop: 6 }}>
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
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                        <span className="pill" style={{ background: '#16211f', color: '#b0ffe0' }}>
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
