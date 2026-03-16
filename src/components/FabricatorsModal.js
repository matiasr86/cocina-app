import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './FabricatorsModal.css';

import { API_BASE_URL_CREDITS } from '../api/http';
import { useToast } from './ToastProvider';
import AddressAutocomplete from './AddressAutocomplete';

const GEO_KEY =
  (typeof process !== 'undefined' && process.env?.REACT_APP_GEOAPIFY_KEY) ||
  (typeof window !== 'undefined' ? window.GEOAPIFY_KEY : null);

/* =============== Mapa (Leaflet) =============== */
function MapBox({ center, markers, height = 360 }) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: true, attributionControl: false, scrollWheelZoom: true });
    mapRef.current = map;

    const tileUrl = GEO_KEY
      ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEO_KEY}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution = GEO_KEY ? '© OpenStreetMap, © Geoapify' : '© OpenStreetMap contributors';
    L.tileLayer(tileUrl, { maxZoom: 20, attribution }).addTo(map);

    map.setView(L.latLng(center.lat, center.lng), 12);
    setTimeout(() => map.invalidateSize(), 100);
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(L.latLng(center.lat, center.lng));
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return;
      map.removeLayer(layer);
    });

    const bounds = [];
    markers.forEach((m) => {
      const pt = L.latLng(m.lat, m.lng);
      bounds.push(pt);
      const color = m.color || '#0ea5e9';
      L.circleMarker(pt, { radius: 9, weight: 2, color, fillColor: color, fillOpacity: 0.9 })
        .addTo(map)
        .bindTooltip(m.title || '', { direction: 'top' });
    });

    if (bounds.length > 1) map.fitBounds(bounds, { padding: [26, 26] });
    else if (bounds.length === 1) map.setView(bounds[0], 14);
  }, [markers]);

  return <div className="fm-map" style={{ '--fm-map-h': `${height}px` }} ref={ref} />;
}

/* =============== Utils =============== */
function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s1 = Math.sin(dLat / 2), s2 = Math.sin(dLng / 2);
  const A = s1 * s1 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * s2 * s2;
  const c = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
  return R * c;
}

/* =============== Modal principal =============== */
export default function FabricatorsModal({ open, onClose }) {
  const toast = useToast();
  const [tab, setTab] = useState('search'); // search | create

  // filtros / resultados
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [zipLocked, setZipLocked] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  // dirección del usuario (para cercanía)
  const [myAddr, setMyAddr] = useState('');
  const [myPos, setMyPos] = useState(null);

  const DEFAULT_BIAS = useMemo(() => ({ lat: -32.958, lng: -60.639 }), []);
  const biasLatLng = myPos || DEFAULT_BIAS;

  // alta
  const [form, setForm] = useState({
    name: '', province: '', city: '', zip: '',
    address: '', phone: '', website: '', email: '',
    lat: '', lng: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const onChangeForm = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (province.trim()) qs.set('province', province.trim());
      if (city.trim()) qs.set('city', city.trim());
      const r = await fetch(`${API_BASE_URL_CREDITS}/fabricators?${qs.toString()}`);
      const js = await r.json().catch(() => null);
      if (!r.ok) throw new Error(js?.error || `HTTP ${r.status}`);

      let items = Array.isArray(js?.items) ? js.items : [];

      if (zip.trim() && (zipLocked || !myPos)) {
        const z = zip.trim().toLowerCase();
        items = items.filter((f) => String(f?.zip || '').toLowerCase().includes(z));
      }

      setList(items);
    } catch {
      toast.error('No se pudieron obtener los fabricantes.');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [province, city, zip, zipLocked, myPos, toast]);

  useEffect(() => { if (open) fetchList(); }, [open, fetchList]);

  const visibleList = useMemo(() => {
    if (!myPos) return list;
    const withD = list.map((f) => {
      const lat = f?.geo?.lat; const lng = f?.geo?.lng;
      const d = (typeof lat === 'number' && typeof lng === 'number')
        ? haversineKm(myPos, { lat, lng })
        : null;
      return { ...f, _distanceKm: d };
    });
    return withD
      .sort((a, b) => (a._distanceKm ?? 1e9) - (b._distanceKm ?? 1e9))
      .slice(0, 10);
  }, [list, myPos]);

  const markers = useMemo(() => {
    const arr = [];
    if (myPos) arr.push({ lat: myPos.lat, lng: myPos.lng, title: 'Mi dirección', color: '#22c55e' });
    visibleList.forEach((f) => {
      const lat = f?.geo?.lat; const lng = f?.geo?.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        arr.push({ lat, lng, title: f.name, color: '#0ea5e9' });
      }
    });
    return arr;
  }, [visibleList, myPos]);

  const mapCenter = useMemo(() => myPos || { lat: -32.958, lng: -60.639 }, [myPos]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!form.name.trim()) return toast.info('Ingresá el nombre de la fábrica.');
    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        province: form.province.trim(),
        city: form.city.trim(),
        zip: form.zip.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        email: form.email.trim(),
        geo: {
          lat: form.lat !== '' ? Number(form.lat) : undefined,
          lng: form.lng !== '' ? Number(form.lng) : undefined,
        },
      };
      const r = await fetch(`${API_BASE_URL_CREDITS}/fabricators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const js = await r.json().catch(() => null);
      if (!r.ok) throw new Error(js?.error || `HTTP ${r.status}`);

      toast.success('¡Registro enviado! Un admin lo aprobará.');
      setForm({
        name: '', province: '', city: '', zip: '',
        address: '', phone: '', website: '', email: '', lat: '', lng: '',
      });
      setTab('search');
      fetchList();
    } catch (e2) {
      toast.error(e2?.message || 'No se pudo completar el registro.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fm-modal-backdrop" role="dialog" aria-modal="true">
      <div className="fm-card" onClick={(e) => e.stopPropagation()}>
        <div className="fm-header">
          <strong>Fabricantes</strong>
          <div className="fm-tabs">
            <button className={`fm-btn ${tab === 'search' ? 'primary' : ''}`} onClick={() => setTab('search')}>Buscar</button>
            <button className={`fm-btn ${tab === 'create' ? 'primary' : ''}`} onClick={() => setTab('create')}>Nuevo registro</button>
          </div>
          <div className="fm-spacer" />
          <button className="fm-btn" onClick={onClose}>Cerrar</button>
        </div>

        <div className="fm-body">
          {tab === 'search' ? (
            <div className="fm-search-grid">
              <div className="fm-panel">
                <div className="fm-field">
                  <label>Provincia</label>
                  <input className="fm-input" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Santa Fe" />
                </div>
                <div className="fm-field">
                  <label>Localidad</label>
                  <input className="fm-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Rosario" />
                </div>
                <div className="fm-field">
                  <label>Código postal</label>
                  <input
                    className="fm-input"
                    value={zip}
                    onChange={(e) => { setZip(e.target.value); setZipLocked(true); }}
                    placeholder="(opcional)"
                  />
                  {zip && zipLocked && <span className="fm-tip">Filtrando por ZIP (escrito manualmente)</span>}
                </div>

                <div className="fm-field">
                  <AddressAutocomplete
                    value={myAddr}
                    onChange={(v) => setMyAddr(v)}
                    onSelect={(sel) => {
                      setMyAddr(sel.address || '');
                      if (sel.city && !city) setCity(sel.city);
                      if (sel.province && !province) setProvince(sel.province);
                      if (typeof sel.lat === 'number' && typeof sel.lng === 'number') {
                        setMyPos({ lat: sel.lat, lng: sel.lng });
                      }
                    }}
                    placeholder="Tu dirección (para ordenar por cercanía)"
                    biasLatLng={biasLatLng}
                  />
                  {!!myPos && (
                    <div className="fm-addr-actions">
                      <span className="fm-pill">Origen fijado</span>
                      <button
                        type="button"
                        className="fm-btn"
                        onClick={() => { setMyPos(null); setMyAddr(''); }}
                      >
                        Limpiar dirección
                      </button>
                    </div>
                  )}
                </div>

                <div className="fm-actions">
                  <button className="fm-btn primary" onClick={fetchList} disabled={loading}>
                    {loading ? 'Buscando…' : 'Buscar'}
                  </button>
                  <button
                    className="fm-btn"
                    onClick={() => { setProvince(''); setCity(''); setZip(''); setZipLocked(false); }}
                  >
                    Limpiar filtros
                  </button>
                </div>

                <p className="fm-tip">
                  Ingresá tu dirección para ver los <b>10 más cercanos</b>.
                  Si además querés limitar por código postal, escribilo manualmente.
                </p>
              </div>

              <div className="fm-right">
                <MapBox center={mapCenter} markers={markers} height={360} />

                <div className="fm-results">
                  {loading ? (
                    <div className="fm-empty">Cargando…</div>
                  ) : visibleList.length === 0 ? (
                    <div className="fm-empty">Sin resultados.</div>
                  ) : (
                    <ul className="fm-list">
                      {visibleList.map((f) => {
                        const lat = f?.geo?.lat; const lng = f?.geo?.lng;
                        const hasCoords = (typeof lat === 'number' && typeof lng === 'number');
                        const dist = hasCoords && myPos ? haversineKm(myPos, { lat, lng }) : null;
                        return (
                          <li key={f._id} className="fm-item">
                            <div className="fm-row">
                              <strong className="fm-title">{f.name}</strong>
                              <span className="fm-pill">{f.city || '—'}, {f.province || '—'} {f.zip ? `(${f.zip})` : ''}</span>
                              <div className="fm-spacer" />
                              {f.phone && <span className="fm-muted">📞 {f.phone}</span>}
                              {f.email && <span className="fm-muted">&nbsp;• ✉️ {f.email}</span>}
                            </div>

                            {f.address && <div className="fm-address">{f.address}</div>}

                            <div className="fm-cta">
                              {hasCoords && (
                                <a
                                  className="fm-pill link"
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${myPos ? `&origin=${myPos.lat},${myPos.lng}` : ''}`}
                                  target="_blank" rel="noreferrer"
                                >
                                  Cómo llegar
                                </a>
                              )}
                              {f.website && (() => {
                                const raw = String(f.website).trim();
                                const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
                                return (
                                  <a className="fm-pill link" href={href} target="_blank" rel="noreferrer">
                                    Sitio web
                                  </a>
                                );
                              })()}
                              {dist != null && <span className="fm-pill dist">{dist.toFixed(1)} km</span>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form className="fm-create-grid" onSubmit={handleSubmit}>
              <div className="fm-panel fm-form">
                <div className="fm-field">
                  <label>Nombre de la fábrica</label>
                  <input className="fm-input" value={form.name} onChange={(e) => onChangeForm('name', e.target.value)} placeholder="Carpintería X" />
                </div>
                <div className="fm-field">
                  <label>Provincia</label>
                  <input className="fm-input" value={form.province} onChange={(e) => onChangeForm('province', e.target.value)} placeholder="Santa Fe" />
                </div>
                <div className="fm-field">
                  <label>Localidad</label>
                  <input className="fm-input" value={form.city} onChange={(e) => onChangeForm('city', e.target.value)} placeholder="Rosario" />
                </div>
                <div className="fm-field">
                  <label>Código postal</label>
                  <input className="fm-input" value={form.zip} onChange={(e) => onChangeForm('zip', e.target.value)} placeholder="2000" />
                </div>

                <div className="fm-field fm-col-2">
                  <AddressAutocomplete
                    value={form.address}
                    onChange={(v) => onChangeForm('address', v)}
                    onSelect={(sel) => {
                      onChangeForm('address', sel.address || '');
                      if (sel.city) onChangeForm('city', sel.city);
                      if (sel.province) onChangeForm('province', sel.province);
                      if (sel.zip) onChangeForm('zip', sel.zip);
                      if (typeof sel.lat === 'number') onChangeForm('lat', sel.lat);
                      if (typeof sel.lng === 'number') onChangeForm('lng', sel.lng);
                    }}
                    biasLatLng={myPos || { lat: -32.958, lng: -60.639 }}
                  />
                </div>

                <div className="fm-field">
                  <label>Teléfono</label>
                  <input className="fm-input" value={form.phone} onChange={(e) => onChangeForm('phone', e.target.value)} placeholder="+54 341 ..." />
                </div>
                <div className="fm-field">
                  <label>Sitio web</label>
                  <input className="fm-input" value={form.website} onChange={(e) => onChangeForm('website', e.target.value)} placeholder="https://..." />
                </div>
                <div className="fm-field">
                  <label>Email</label>
                  <input type="email" className="fm-input" value={form.email} onChange={(e) => onChangeForm('email', e.target.value)} placeholder="contacto@fabrica.com" />
                </div>
                <div className="fm-field">
                  <label>Latitud (opcional)</label>
                  <input className="fm-input" value={form.lat} onChange={(e) => onChangeForm('lat', e.target.value)} placeholder="-32.95" />
                </div>
                <div className="fm-field">
                  <label>Longitud (opcional)</label>
                  <input className="fm-input" value={form.lng} onChange={(e) => onChangeForm('lng', e.target.value)} placeholder="-60.63" />
                </div>

                <div className="fm-actions fm-col-2">
                  <button className="fm-btn primary" type="submit" disabled={submitting}>
                    {submitting ? 'Enviando…' : 'Enviar registro'}
                  </button>
                  <button className="fm-btn" type="button" onClick={() => setTab('search')} disabled={submitting}>
                    Cancelar
                  </button>
                </div>
              </div>

              <div className="fm-panel fm-mapbox">
                <div className="fm-muted small">Vista previa en mapa</div>
                <MapBox
                  center={(() => {
                    if (!isNaN(parseFloat(form.lat)) && !isNaN(parseFloat(form.lng))) {
                      return { lat: parseFloat(form.lat), lng: parseFloat(form.lng) };
                    }
                    return myPos || { lat: -32.958, lng: -60.639 };
                  })()}
                  markers={
                    (!isNaN(parseFloat(form.lat)) && !isNaN(parseFloat(form.lng)))
                      ? [{ lat: parseFloat(form.lat), lng: parseFloat(form.lng), title: form.name || 'Ubicación', color: '#ff6f00' }]
                      : []
                  }
                  height={360}
                />
                <div className="fm-tip small">Usá el autocompletado para fijar coordenadas exactas.</div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}