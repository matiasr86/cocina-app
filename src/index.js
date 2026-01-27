import React from 'react';
import { createRoot } from 'react-dom/client';
import AppLayout from './components/AppLayout'; // 👈 porque está en src/components

createRoot(document.getElementById('root')).render(<AppLayout />);
