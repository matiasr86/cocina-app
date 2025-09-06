// src/components/AdminPanel.js
import React, { useMemo, useState, useRef, useEffect, useCallback, memo } from 'react';
import * as XLSX from 'xlsx';
import { useModules } from '../context/ModulesContext';
import './AdminPanel.css';

/**
 * AdminPanel
 * - Edición en vivo (sin botón Guardar por módulo).
 * - "Guardar y cerrar" persiste TODOS los cambios pendientes.
 * - ⚠️ Recarga catálogo SOLO cuando:
 *     a) Guardamos y cerramos
 *     b) Terminamos una importación desde Excel
 *   (No recarga automáticamente al abrir el modal)
 */

function NumberInput({ value, onChange, step = 1, min, max, placeholder }) {
  return (
    <input
      type="number"
      inputMode="numeric"
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

/* ---------- Helpers ---------- */
function normalizeSizes(list) {
  const sizes = Array.isArray(list)
    ? list.map((s) => ({
        width: Number(s?.width) || 0,
        height: Number(s?.height) || 0,
        isStandard: !!s?.isStandard,
        deltaPct: (s?.deltaPct === 0 || s?.deltaPct) ? Number(s?.deltaPct) : 0,
      }))
    : [];

  const valid = sizes.filter((s) => s.width > 0 && s.height > 0);
  if (valid.length > 0) {
    let idxStd = valid.findIndex((s) => s.isStandard);
    if (idxStd === -1) idxStd = 0;
    valid.forEach((s, i) => {
      s.isStandard = i === idxStd;
    });
  }
  return valid;
}

function buildPatchFromDraft(draft) {
  return {
    name: draft.name ?? null,
    visible: !!draft.visible,
    ...(draft.subtitle !== undefined ? { subtitle: draft.subtitle } : {}),
    prices: {
      started: draft.prices?.started ?? null,
      premium: draft.prices?.premium ?? null,
      deluxe: draft.prices?.deluxe ?? null,
    },
    sizes: normalizeSizes(draft.sizes),
  };
}

function shallowEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function createDraftFromBase(base) {
  return {
    name: base.name ?? base.title ?? base.type,
    subtitle: base.subtitle ?? '',
    visible: base.visible !== false,
    prices: {
      started: base.prices?.started ?? '',
      premium: base.prices?.premium ?? '',
      deluxe: base.prices?.deluxe ?? '',
    },
    sizes: Array.isArray(base.sizes) ? base.sizes.map((s) => ({ ...s })) : [],
  };
}

export default function AdminPanel({ onClose }) {
  const { catalogAdmin, updateOverride, resetOverrides, reloadCatalog, loading } = useModules();

  const [q, setQ] = useState('');
  const nq = useMemo(
    () => q.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, ''),
    [q]
  );

  // Drafts por type (ediciones en el panel)
  const [draftsByType, setDraftsByType] = useState({});

  // ❌ (Quitado) Recarga automática al abrir el modal.
  // useEffect(() => { reloadCatalog({ force: true, noFallback: true }); }, [reloadCatalog]);

  // Cuando cambia el catálogo (p.ej. tras guardar o importar), inicializamos drafts
  useEffect(() => {
    const next = {};
    for (const m of catalogAdmin) next[m.type] = createDraftFromBase(m);
    setDraftsByType(next);
  }, [catalogAdmin]);

  const filtered = useMemo(() => {
    return catalogAdmin.filter((m) => {
      const hay = `${m.type} ${m.name || ''} ${m.title || ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
      return nq === '' || hay.includes(nq);
    });
  }, [catalogAdmin, nq]);

  const handleDraftChange = useCallback((type, draft) => {
    setDraftsByType((prev) => (prev[type] === draft ? prev : { ...prev, [type]: draft }));
  }, []);

  // Guardado MASIVO al cerrar → recarga UNA sola vez al final
  const handleCloseAndSaveAll = useCallback(async () => {
    try {
      let changed = 0;
      for (const m of catalogAdmin) {
        const draft = draftsByType[m.type];
        if (!draft) continue;

        const patch = buildPatchFromDraft(draft);
        const current = buildPatchFromDraft(createDraftFromBase(m));

        if (!shallowEqual(current, patch)) {
          await updateOverride(m.type, patch);
          changed++;
        }
      }
      if (changed > 0) {
        await reloadCatalog({ force: true, noFallback: true });
      }
    } finally {
      onClose?.();
    }
  }, [catalogAdmin, draftsByType, updateOverride, reloadCatalog, onClose]);

  const handleReset = async () => {
    if (!window.confirm('¿Seguro que querés reestablecer todos los valores?')) return;
    await resetOverrides();
    // (opcional) Podríamos recargar aquí, pero para minimizar requests lo evitamos.
    // Si preferís que el panel se actualice visualmente tras el reset, descomentá:
    // await reloadCatalog({ force: true, noFallback: true });
  };

  /* ----------------- Exportar a Excel ----------------- */
  const exportExcel = () => {
    const rowsMod = catalogAdmin.map((m) => ({
      type: m.type,
      name: m.name ?? m.title ?? '',
      visible: m.visible !== false ? true : false,
      subtitle: m.subtitle ?? '',
      price_started:
        (m.prices?.started ?? '') === '' ? '' : Number(m.prices?.started || 0),
      price_premium:
        (m.prices?.premium ?? '') === '' ? '' : Number(m.prices?.premium || 0),
      price_deluxe:
        (m.prices?.deluxe ?? '') === '' ? '' : Number(m.prices?.deluxe || 0),
    }));
    const wsMod = XLSX.utils.json_to_sheet(rowsMod);
    XLSX.utils.sheet_add_aoa(
      wsMod,
      [['type', 'name', 'visible', 'subtitle', 'price_started', 'price_premium', 'price_deluxe']],
      { origin: 'A1' }
    );

    const rowsSizes = [];
    catalogAdmin.forEach((m) => {
      (m.sizes || []).forEach((s) => {
        rowsSizes.push({
          type: m.type,
          width: Number(s.width) || 0,
          height: Number(s.height) || 0,
          isStandard: !!s.isStandard,
          deltaPct: (s.deltaPct === 0 || s.deltaPct) ? Number(s.deltaPct) : 0,
        });
      });
    });
    const wsSizes = XLSX.utils.json_to_sheet(rowsSizes);
    XLSX.utils.sheet_add_aoa(wsSizes, [['type', 'width', 'height', 'isStandard', 'deltaPct']], {
      origin: 'A1',
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsMod, 'Modulos');
    XLSX.utils.book_append_sheet(wb, wsSizes, 'Medidas');

    const filename = `catalogo_modulos_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  /* ----------------- Importar desde Excel ----------------- */
  const fileRef = useRef(null);
  const askImport = () => fileRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });

      const wsMod = wb.Sheets['Modulos'];
      const wsSizes = wb.Sheets['Medidas'];

      if (!wsMod || !wsSizes) {
        alert('El Excel debe contener las hojas "Modulos" y "Medidas".');
        return;
      }

      const mods = XLSX.utils.sheet_to_json(wsMod, { defval: '' });
      const sizes = XLSX.utils.sheet_to_json(wsSizes, { defval: '' });

      const byType = new Map();

      // 1) Módulos
      for (const r of mods) {
        const type = String(r.type || '').trim();
        if (!type) continue;
        const name = r.name === '' ? null : String(r.name);
        const visible =
          String(r.visible).toLowerCase() === 'true' || r.visible === true || r.visible === 1;
        const subtitle = r.subtitle === '' ? null : String(r.subtitle);

        const prices = {
          started: r.price_started === '' ? null : Number(r.price_started),
          premium: r.price_premium === '' ? null : Number(r.price_premium),
          deluxe: r.price_deluxe === '' ? null : Number(r.price_deluxe),
        };

        byType.set(type, { type, name, visible, subtitle, prices, sizes: [] });
      }

      // 2) Medidas
      for (const r of sizes) {
        const type = String(r.type || '').trim();
        if (!type) continue;
        const width = Number(r.width) || 0;
        const height = Number(r.height) || 0;
        const isStandard =
          String(r.isStandard).toLowerCase() === 'true' ||
          r.isStandard === true ||
          r.isStandard === 1;
        const deltaPct =
          r.deltaPct === '' || r.deltaPct === null || r.deltaPct === undefined
            ? 0
            : Number(r.deltaPct);

        if (!byType.has(type)) {
          byType.set(type, {
            type,
            name: null,
            visible: true,
            subtitle: null,
            prices: { started: null, premium: null, deluxe: null },
            sizes: [],
          });
        }
        byType.get(type).sizes.push({ width, height, isStandard, deltaPct });
      }

      // 3) Normalizar UNA estándar
      for (const [, m] of byType) {
        const list = Array.isArray(m.sizes) ? m.sizes : [];
        if (list.length > 0) {
          const idxStd = list.findIndex((s) => s.isStandard);
          if (idxStd === -1) list[0].isStandard = true;
          if (idxStd !== -1) {
            let first = true;
            list.forEach((s) => {
              if (s.isStandard) {
                if (first) {
                  first = false;
                  s.isStandard = true;
                } else s.isStandard = false;
              }
            });
          }
        }
      }

      // 4) Aplicar overrides
      if (!window.confirm('Se actualizarán los módulos según el Excel. ¿Continuar?')) return;

      let ok = 0, fail = 0;
      for (const [type, m] of byType) {
        const patch = {
          name: m.name,
          visible: !!m.visible,
          prices: m.prices,
          sizes: (m.sizes || []).map((s) => ({
            width: Number(s.width) || 0,
            height: Number(s.height) || 0,
            isStandard: !!s.isStandard,
            deltaPct: (s.deltaPct === 0 || s.deltaPct) ? Number(s.deltaPct) : 0,
          })),
          ...(m.subtitle !== undefined ? { subtitle: m.subtitle } : {}),
        };
        try {
          await updateOverride(type, patch);
          ok++;
        } catch (e1) {
          console.error('updateOverride error', type, e1);
          fail++;
        }
      }

      // ✅ Recarga SOLO al finalizar la importación
      await reloadCatalog({ force: true, noFallback: true });
      alert(`Importación finalizada.\nCorrectos: ${ok}\nErrores: ${fail}`);
    } catch (err) {
      console.error('Import Excel error:', err);
      alert('No se pudo importar el Excel. Ver consola para más detalles.');
    }
  };

  return (
    <div className="admin-modal">
      <div className="admin-modal__card">
        <div className="admin-modal__header">
          <h2>Panel de Administración</h2>
          {loading && (
            <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>Actualizando…</span>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              placeholder="Buscar módulo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ padding: '6px 8px', minWidth: 220 }}
            />
            <button type="button" className="btn outline" onClick={exportExcel}>
              Exportar Excel
            </button>
            <button type="button" className="btn" onClick={askImport}>
              Importar Excel
            </button>
            <input
              type="file"
              ref={fileRef}
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
            <button type="button" className="btn danger" onClick={handleReset}>
              Reestablecer todo
            </button>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="btn primary"
                onClick={handleCloseAndSaveAll}
                disabled={loading}
                title="Guarda todos los cambios y cierra"
              >
                Guardar y cerrar
              </button>
            </div>
          </div>
        </div>

        <div className="admin-list">
          {filtered.map((m) => (
            <ModuleEditor
              key={m.type}
              base={m}
              initial={draftsByType[m.type] || null}
              onDraftChange={(draft) => handleDraftChange(m.type, draft)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------ Editor de un módulo ------------ */
const ModuleEditor = memo(function ModuleEditor({ base, initial, onDraftChange }) {
  const [draft, setDraft] = useState(() => initial ?? createDraftFromBase(base));

  useEffect(() => {
    const next = initial ?? createDraftFromBase(base);
    if (JSON.stringify(next) !== JSON.stringify(draft)) {
      setDraft(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, base]);

  const emit = useCallback(
    (next) => {
      setDraft(next);
      onDraftChange?.(next);
    },
    [onDraftChange]
  );

  const setField = (key, val) =>
    emit({ ...draft, [key]: val });

  const setPrice = (k, v) =>
    emit({ ...draft, prices: { ...(draft.prices || {}), [k]: v === '' ? '' : Number(v) } });

  const addSize = () => {
    const firstStd = !(draft.sizes && draft.sizes.length);
    emit({
      ...draft,
      sizes: [
        ...(draft.sizes || []),
        { width: 60, height: 70, isStandard: firstStd, deltaPct: 0 },
      ],
    });
  };

  const removeSize = (idx) => {
    const next = [...(draft.sizes || [])];
    next.splice(idx, 1);
    if (!next.some((s) => s.isStandard) && next.length > 0) next[0].isStandard = true;
    emit({ ...draft, sizes: next });
  };

  const setSize = (idx, patch) => {
    const next = [...(draft.sizes || [])];
    const cur = { ...(next[idx] || {}), ...patch };
    next[idx] = cur;
    if (patch.isStandard) {
      next.forEach((s, i) => { s.isStandard = i === idx; });
    }
    emit({ ...draft, sizes: next });
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

          <div className="title" style={{ marginTop: 6 }}>
            <label>Subtítulo</label>
            <input
              type="text"
              value={draft.subtitle}
              onChange={(e) => setField('subtitle', e.target.value)}
              placeholder={base.subtitle || ''}
            />
          </div>

          <label className="chk" style={{ marginTop: 6 }}>
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
          <button type="button" className="btn ghost" onClick={addSize}>+ Agregar</button>
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
              <button type="button" className="btn danger" onClick={() => removeSize(idx)}>
                Eliminar
              </button>
            </div>
          ))}
          {(draft.sizes || []).length === 0 && (
            <div className="sizes-empty">Sin medidas. Agregá al menos una.</div>
          )}
        </div>
      </div>
    </div>
  );
});
