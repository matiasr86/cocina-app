import React, { useState } from 'react';

export default function AdminLoginModal({ onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  const check = () => {
    // PIN provisional; luego lo cambiamos por Auth real
    if (pin === '1234') { onSuccess?.(); onClose?.(); }
    else setErr('PIN incorrecto');
  };

  return (
    <div className="qp__overlay" onClick={onClose}>
      <div className="qp__dialog" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Acceso de administrador</h3>
        <p className="muted" style={{ marginTop: -8 }}>Funcionalidades avanzadas de catálogo.</p>
        <div className="field">
          <label>PIN</label>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
          <button className="btn primary" onClick={check}>Entrar</button>
        </div>
        {err && <div style={{ color: '#c00', marginTop: 8 }}>{err}</div>}
      </div>
    </div>
  );
}
