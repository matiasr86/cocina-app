// src/components/ProjectsModal.js
import React, { useEffect, useMemo, useState } from 'react';
import { ProjectsApi } from '../api/ProjectsApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ToastProvider';
import './ProjectsModal.css';

/* Mini confirm inline (sin window.confirm) */
function ConfirmInline({ open, text, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="pm-confirm" onClick={onCancel}>
      <div className="pm-confirm__box" onClick={(e) => e.stopPropagation()}>
        <div className="pm-confirm__text">{text}</div>
        <div className="pm-confirm__actions">
          <button className="btn" onClick={onCancel}>Cancelar</button>
          <button className="btn danger" onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsModal({
  open,
  onClose,
  getCurrentDesign,       // () => diseño actual
  onLoadProject,          // (project) => void
}) {
  const { getIdToken } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');

  // confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(p => (p.title || '').toLowerCase().includes(q));
  }, [projects, search]);

  // listar al abrir
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoading(true);
        const token = await getIdToken();
        const res = await ProjectsApi.list(token);
        const items = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
        setProjects(items);
      } catch (err) {
        console.error('list projects error:', err);
        toast.error('Error al listar proyectos');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, getIdToken, toast]);

  async function handleCreate() {
    const title = newName.trim();
    if (!title) return;
    try {
      setLoading(true);
      const token = await getIdToken();
      const snap = typeof getCurrentDesign === 'function' ? getCurrentDesign() : {};
      const created = await ProjectsApi.create(token, { title, ...snap });
      const doc = created?.project || created;
      setProjects(p => [doc, ...p]);
      setNewName('');
      toast.success('Proyecto creado');
    } catch (err) {
      console.error('create project error:', err);
      if (err?.status === 409 || String(err?.message).includes('409')) {
        toast.warning('Alcanzaste el máximo de 5 proyectos.');
      } else {
        toast.error(`Error al crear: ${err?.message || 'desconocido'}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen(projectId) {
    try {
      setLoading(true);
      const token = await getIdToken();
      const res = await ProjectsApi.read(token, projectId);
      const project = res?.project || res;
      if (!project) {
        toast.warning('Proyecto no encontrado');
        return;
      }
      onLoadProject?.(project);
      onClose?.();
      toast.info('Proyecto cargado');
    } catch (err) {
      console.error('open project error:', err);
      toast.error('Error al abrir el proyecto.');
    } finally {
      setLoading(false);
    }
  }

  function askDelete(id) {
    setConfirmId(id);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    const id = confirmId;
    setConfirmOpen(false);
    setConfirmId(null);
    if (!id) return;

    try {
      setLoading(true);
      const token = await getIdToken();
      await ProjectsApi.remove(token, id);
      setProjects(p => p.filter(x => x._id !== id));
      toast.success('Proyecto eliminado');
    } catch (err) {
      console.error('delete project error:', err);
      toast.error('No se pudo borrar el proyecto.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pm-header">
          <h3>Mis proyectos</h3>
          <button className="btn ghost" onClick={onClose}>Cerrar</button>
        </div>

        {/* Body */}
        <div className="pm-body">
          <div className="pm-toolbar">
            <input
              className="input"
              placeholder="Buscar por nombre…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="pm-new">
              <input
                className="input"
                placeholder="Nombre del proyecto"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              />
              <button className="btn primary" onClick={handleCreate} disabled={loading}>Nuevo</button>
            </div>
          </div>

          {loading && <div className="hint">Cargando...</div>}
          {!loading && filtered.length === 0 && (
            <div className="hint">No tenés proyectos guardados.</div>
          )}

          <div className="pm-list">
            {filtered.map(p => (
              <div key={p._id} className="pm-row">
                <div className="pm-meta">
                  <div className="pm-title">{p.title || '(sin título)'}</div>
                  <div className="pm-sub">{new Date(p.updatedAt || p.createdAt).toLocaleString()}</div>
                </div>
                <div className="pm-actions">
                  <button className="btn" onClick={() => handleOpen(p._id)}>Abrir</button>
                  <button className="btn danger outline" onClick={() => askDelete(p._id)}>Borrar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* confirm propio */}
      <ConfirmInline
        open={confirmOpen}
        text="¿Eliminar este proyecto?"
        onCancel={() => { setConfirmOpen(false); setConfirmId(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
