import React, { useMemo, useState } from 'react';
import { useModules } from '../context/ModulesContext';
import './AdminPanel.css';

/**
 * AdminPanel:
 * - Lista catálogo completo (catalogAdmin del contexto).
 * - Edita: name, visible, prices (started/premium/deluxe), sizes [{width,height,isStandard,deltaPct}]
 * - Asegura UNA sola medida estándar.
 * - Guarda por módulo (updateOverride(type, patch)).
 * - Reset global (resetOverrides).
 */

function NumberInput({ value, onChange, step = 1, min, max, placeholder }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
      style={{ width: 90 }}
    />
  );
}

export default function AdminPanel({ onClose }) {
  const { catalogAdmin, updateOverride, resetOverrides } = useModules();

  const [q, setQ] = useState('');
  const nq = useMemo(
    () => q.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''),
    [q]
  );

  const filtered = useMemo(() => {
    return catalogAdmin.filter((m) => {
      const hay = `${m.type} ${m.name || ''} ${m.title || ''}`.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      return nq === '' || hay.includes(nq);
    });
  }, [catalogAdmin, nq]);

  const handleSave = async (type, draft) => {
    // normalizamos sizes: una sola estándar
    const sizes = Array.isArray(draft.sizes) ? draft.sizes : [];
    let stdIndex = sizes.findIndex((s) => s?.isStandard);
    if (sizes.length > 0) {
      if (stdIndex === -1) stdIndex = 0;
      sizes.forEach((s, i) => { s.isStandard = i === stdIndex; });
    }

    const patch = {
      name: draft.name ?? null,
      visible: !!draft.visible,
      prices: {
        started: draft.prices?.started ?? null,
        premium: draft.prices?.premium ?? null,
        deluxe:  draft.prices?.deluxe  ?? null,
      },
      sizes: sizes.map((s) => ({
        width: Number(s.width) || 0,
        height: Number(s.height) || 0,
        isStandard: !!s.isStandard,
        deltaPct: (s.deltaPct === 0 || s.deltaPct) ? Number(s.deltaPct) : 0,
      })).filter((s) => s.width > 0 && s.height > 0),
    };

    await updateOverride(type, patch);
  };

  const handleReset = async () => {
    if (!window.confirm('¿Seguro que querés reestablecer todos los valores?')) return;
    await resetOverrides();
  };

  return (
    <div className="admin-modal">
      <div className="admin-modal__card">
        <div className="admin-modal__header">
          <h2>Panel de Administración</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="Buscar módulo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ padding: '6px 8px', minWidth: 220 }}
            />
            <button className="btn danger" onClick={handleReset}>Reestablecer todo</button>
            <button className="btn" onClick={onClose}>Cerrar</button>
          </div>
        </div>

        <div className="admin-list">
          {filtered.map((m) => (
            <ModuleEditor
              key={m.type}
              base={m}
              onSave={(draft) => handleSave(m.type, draft)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------ Editor de un módulo ------------ */
function ModuleEditor({ base, onSave }) {
  const [draft, setDraft] = useState(() => ({
    name: base.name ?? base.title ?? base.type,
    visible: base.visible !== false,
    prices: {
      started: base.prices?.started ?? '',
      premium: base.prices?.premium ?? '',
      deluxe:  base.prices?.deluxe  ?? '',
    },
    sizes: Array.isArray(base.sizes) ? base.sizes.map(s => ({ ...s })) : [],
  }));

  const setField = (key, val) => setDraft((d) => ({ ...d, [key]: val }));
  const setPrice = (k, v) => setDraft((d) => ({ ...d, prices: { ...(d.prices || {}), [k]: v === '' ? '' : Number(v) } }));

  const addSize = () => {
    setDraft((d) => ({
      ...d,
      sizes: [...(d.sizes || []), { width: 60, height: 70, isStandard: d.sizes?.length ? false : true, deltaPct: 0 }],
    }));
  };

  const removeSize = (idx) => {
    setDraft((d) => {
      const next = [...(d.sizes || [])];
      next.splice(idx, 1);
      // Si quitamos la estándar, marcamos la primera (si existe)
      if (!next.some(s => s.isStandard) && next.length > 0) next[0].isStandard = true;
      return { ...d, sizes: next };
    });
  };

  const setSize = (idx, patch) => {
    setDraft((d) => {
      const next = [...(d.sizes || [])];
      const cur = { ...(next[idx] || {}) , ...patch };
      next[idx] = cur;
      // Forzar una sola estándar
      if (patch.isStandard) {
        next.forEach((s, i) => { s.isStandard = i === idx; });
      }
      return { ...d, sizes: next };
    });
  };

  return (
    <div className="admin-item">
      <div className="admin-item__left">
        <div className="thumb">
          {base.src ? <img src={base.src} alt={base.type} /> : <div className="thumb__ph">Sin imagen</div>}
        </div>
        <div className="meta">
          <div className="type">{base.type}</div>
          <div className="title">
            <label>Nombre visible</label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder={base.title || base.type}
            />
          </div>
          <label className="chk">
            <input
              type="checkbox"
              checked={!!draft.visible}
              onChange={(e) => setField('visible', e.target.checked)}
            />
            Visible en catálogo
          </label>
        </div>
      </div>

      <div className="admin-item__prices">
        <div className="prices-row">
          <span>Started</span>
          <NumberInput value={draft.prices.started} onChange={(v) => setPrice('started', v)} step={1} min={0} />
        </div>
        <div className="prices-row">
          <span>Premium</span>
          <NumberInput value={draft.prices.premium} onChange={(v) => setPrice('premium', v)} step={1} min={0} />
        </div>
        <div className="prices-row">
          <span>Deluxe</span>
          <NumberInput value={draft.prices.deluxe} onChange={(v) => setPrice('deluxe', v)} step={1} min={0} />
        </div>
      </div>

      <div className="admin-item__sizes">
        <div className="sizes-header">
          <strong>Medidas</strong>
          <button className="btn ghost" onClick={addSize}>+ Agregar</button>
        </div>
        <div className="sizes-list">
          {(draft.sizes || []).map((s, idx) => (
            <div key={idx} className={`size-row ${s.isStandard ? 'is-std' : ''}`}>
              <NumberInput value={s.width}  onChange={(v) => setSize(idx, { width: v })}  step={1} min={1} placeholder="Ancho (cm)" />
              <NumberInput value={s.height} onChange={(v) => setSize(idx, { height: v })} step={1} min={1} placeholder="Alto (cm)" />
              <NumberInput value={s.deltaPct} onChange={(v) => setSize(idx, { deltaPct: v })} step={1} placeholder="% ajuste" />
              <label className="chk">
                <input
                  type="radio"
                  name={`std-${base.type}`}
                  checked={!!s.isStandard}
                  onChange={() => setSize(idx, { isStandard: true })}
                />
                Estándar
              </label>
              <button className="btn danger" onClick={() => removeSize(idx)}>Eliminar</button>
            </div>
          ))}
          {(draft.sizes || []).length === 0 && (
            <div className="sizes-empty">Sin medidas. Agregá al menos una.</div>
          )}
        </div>
      </div>

      <div className="admin-item__actions">
        <button className="btn primary" onClick={() => onSave(draft)}>Guardar</button>
      </div>
    </div>
  );
}
