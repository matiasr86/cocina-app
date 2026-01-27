// Definición de las 3 calidades + matriz comparativa (puede crecer fácil)
export const QUALITIES = [
  { id: 'started', name: 'Started', highlight: 'Funcional y económica' },
  { id: 'premium', name: 'Premium', highlight: 'Mejor relación precio/calidad' },
  { id: 'deluxe',  name: 'Deluxe',  highlight: 'Performance top' },
];

// Tabla comparativa: secciones y filas; cada fila mapea calidad→valor
export const QUALITY_MATRIX = [
  {
    section: 'Fondo Blanco en 3mm',
    rows: [
      { label: '', started: 'No Contiene', premium: 'Engrampado', deluxe: 'Ranurado' },
    ],
  },
  {
    section: 'Puertas',
    header: { started: 'Cierre Común', premium: 'Cierre Suave / Push', deluxe: 'Cierre Suave / Push' },
    rows: [
      { label: 'Bisagras',             started: 'Bronzen / Eurohard',       premium: 'Bronzen / Eurohard',         deluxe: 'Häfele 3D Clip' },
      { label: 'Sistema de apertura',  started: 'Manija / Tirador',         premium: 'Perfil tipo J / Push Open',  deluxe: 'Perfil Gola / Push Open' },
      { label: 'Canto',                started: '0.5 mm',                   premium: '2 mm PVC',                   deluxe: '2 mm PVC' },
    ],
  },
  {
    section: 'Cajones',
    header: { started: 'Artesanal', premium: 'Artesanal / Lateral Metálico', deluxe: 'Lateral Cajón Metálico' },
    rows: [
      { label: 'Correderas',  started: 'Bronzen / Eurohard (Común)', premium: 'Bronzen / Eurohard (Cierre Suave / Push)', deluxe: 'Häfele (Cierre Suave / push)' },
      { label: 'Canto',       started: '0.5 mm',                     premium: '2 mm PVC',                       deluxe: '2 mm PVC' },
    ],
  },
  {
    section: 'Zócalos',
    rows: [
      { label: '', started: 'Melamina', premium: 'Aluminio 10–15 cm', deluxe: 'Aluminio 10–15 cm' },
    ],
  },
];
