import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function FirebaseAuthModal({ onClose }) {
  const { user, loginGoogle, logout } = useAuth();
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.25)',display:'grid',placeItems:'center',zIndex:999}}>
      <div onClick={(e)=>e.stopPropagation()} style={{background:'#fff',padding:16,borderRadius:10,minWidth:320}}>
        <h3 style={{marginTop:0}}>{user ? 'Sesión iniciada' : 'Iniciar sesión'}</h3>
        {user ? (
          <>
            <p>Logueado como <b>{user.email || user.displayName}</b></p>
            <button onClick={logout}>Cerrar sesión</button>
          </>
        ) : (
          <button onClick={loginGoogle}>Ingresar con Google</button>
        )}
      </div>
    </div>
  );
}
