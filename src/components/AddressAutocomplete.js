// src/components/AddressAutocomplete.js
import React, { useEffect, useRef, useState } from 'react';

const GEO_KEY =process.env?.REACT_APP_GEOAPIFY_KEY

const API_URL = 'https://api.geoapify.com/v1/geocode/autocomplete';
const COUNTRY = 'ar'; // forzamos Argentina

function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/**
 * Props:
 *  - value, onChange, onSelect({ address, city, province, zip, lat, lng })
 *  - placeholder, disabled
 *  - biasLatLng?: { lat, lng }
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Dirección…',
  disabled = false,
  biasLatLng = null,
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const controllerRef = useRef(null);

  const q = useDebounced((value || '').trim(), 250);

  useEffect(() => {
    if (!q || !GEO_KEY) {
      setItems([]);
      setOpen(false);
      return;
    }

    // cancelá la request previa
    try { controllerRef.current?.abort(); } catch {}
    const ctrl = new AbortController();
    controllerRef.current = ctrl;

    setLoading(true);

    const params = new URLSearchParams({
      text: q,
      apiKey: GEO_KEY,
      lang: 'es',
      limit: '8',
      filter: `countrycode:${COUNTRY}`,
    });

    // Geoapify espera bias=proximity:lon,lat
    if (biasLatLng && typeof biasLatLng.lat === 'number' && typeof biasLatLng.lng === 'number') {
      params.set('bias', `proximity:${biasLatLng.lng},${biasLatLng.lat}`);
    }

    fetch(`${API_URL}?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((js) => {
        const feats = Array.isArray(js?.features) ? js.features : [];
        const list = feats.map((f) => {
          const p = f.properties || {};
          const lat = typeof p.lat === 'number' ? p.lat : f.geometry?.coordinates?.[1];
          const lng = typeof p.lon === 'number' ? p.lon : f.geometry?.coordinates?.[0];
          return {
            id: p.place_id || `${lng},${lat}`,
            label: p.formatted || p.address_line1 || '',
            city: p.city || p.town || p.village || p.municipality || '',
            province: p.state || '',
            zip: p.postcode || '',
            lat, lng,
          };
        });
        setItems(list);
        setOpen(list.length > 0);
      })
      .catch((e) => {
        if (e?.name !== 'AbortError') {
          console.warn('[AddressAutocomplete] fallo de autocompletado', e);
          setItems([]);
          setOpen(false);
        }
      })
      .finally(() => setLoading(false));

    return () => {
      try { ctrl.abort(); } catch {}
    };
  }, [q, biasLatLng]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // debug si falta key
  useEffect(() => {
    if (!GEO_KEY) {
      console.warn('[AddressAutocomplete] Falta REACT_APP_GEOAPIFY_KEY');
    }
  }, []);

  const showSpinner = loading && items.length === 0;

  return (
    <div
      ref={boxRef}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        zIndex: 5000, // arriba de todo
      }}
    >
      <label style={{ fontSize: 13, color: '#bbb' }}>Dirección</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => items.length > 0 && setOpen(true)}
        style={{
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid #2a2a2a',
          background: '#161616',
          color: '#eee',
          outline: 'none',
        }}
      />

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#111',
            border: '1px solid #2b2b2b',
            borderRadius: 10,
            marginTop: 6,
            maxHeight: 260,
            overflow: 'auto',
            boxShadow: '0 10px 24px rgba(0,0,0,.55)',
          }}
        >
          {items.length === 0 ? (
            <div style={{ padding: 10, color: '#aaa' }}>
              {showSpinner ? 'Buscando…' : 'Sin resultados'}
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 6, display: 'grid', gap: 6 }}>
              {items.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onSelect?.({
                        address: it.label,
                        city: it.city,
                        province: it.province,
                        zip: it.zip,
                        lat: it.lat,
                        lng: it.lng,
                      });
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: '#171717',
                      border: '1px solid #2a2a2a',
                      color: '#ddd',
                      cursor: 'pointer',
                    }}
                  >
                    {it.label}
                    {(it.city || it.province) && (
                      <div style={{ fontSize: 12, color: '#9aa' }}>
                        {it.city || '—'} {it.province ? `• ${it.province}` : ''}
                        {it.zip ? ` • ${it.zip}` : ''}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
