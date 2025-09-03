
const modules = [
  //Zocalos
  {
    type: "BANQUINA-800-150",
    title: "Banquina",
    subtitle: "10 / 12 / 15 cm",
    section: "ZO",
    sectionLabel: "BANQUINA ESTABLECIDA",
    width: 80,
    height: 15,
    src: "/assets/modules/zocalo/BANQUINA-800-150.png",
     // 👇 NUEVO
    isLinear: true,                 // el Canvas sabrá que el largo es libre
    allowedHeights: [10, 12, 15],   // las 3 alturas válidas
    defaultLinearWidth: 80          // sugerencia inicial (podés cambiarla)
  },
  {
    type: "ZOCALO-800-150",
    title: "Zocalo",
    subtitle: "10 / 12 / 15 cm",
    section: "ZO",
    sectionLabel: "ZOCALO ALUMINIO",
    width: 80,
    height: 15,
    src: "/assets/modules/zocalo/ZOCALO-800-150.png",
     // 👇 NUEVO
    isLinear: true,                 // el Canvas sabrá que el largo es libre
    allowedHeights: [10, 12, 15],   // las 3 alturas válidas
    defaultLinearWidth: 80          // sugerencia inicial (podés cambiarla)
  },

  //Bajo Mesadas
    {
    type: "bm2p",
    title: "BM 2 Puertas",
    subtitle: "1 Estante",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 120,
    height: 90,
    src: "/assets/modules/bajo-mesada/bm2p.png"
  },
  {
    type: "bm1pi",
    title: "BM 1 Puerta Izq",
    subtitle: "1 Estante",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 60,
    height: 90,
    src: "/assets/modules/bajo-mesada/bm1pi.jpeg"
  },
  {
    type: "bm1pd",
    title: "BM 1 Puerta Der",
    subtitle: "1 Estante",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 60,
    height: 90,
    src: "/assets/modules/bajo-mesada/bm1pd.jpeg"
  },
  
  {
    type: "2-drawer-cabinet",
    title: "BM Cajonero",
    subtitle: "2 Cajones",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 120,
    height: 90,
    src: "/assets/modules/bajo-mesada/2-drawer-cabinet.jpeg"
  },
  {
    type: "3-drawer-cabinet",
    title: "BM Cajonero",
    subtitle: "3 Cajones Opc. 1",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 60,
    height: 90,
    src: "/assets/modules/bajo-mesada/3-drawer-cabinet.jpeg"
  },
  {
    type: "3-drawer-cabinet2",
    title: "BM Cajonero",
    subtitle: "3 Cajones Opc. 2",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 60,
    height: 90,
    src: "/assets/modules/bajo-mesada/3-drawer-cabinet2.jpeg"
  },
  {
    type: "BM-oven",
    title: "BM Horno",
    subtitle: "Horno Empotrado",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 60,
    height: 90,
    src: "/assets/modules/bajo-mesada/BM-oven.png"
  },
  {
    type: "BM-trash-can",
    title: "BM Residuos",
    subtitle: "Cesto de residuos integrad0",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 40,
    height: 90,
    src: "/assets/modules/bajo-mesada/BM-trash-can.png"
  },
  {
    type: "spice-rack",
    title: "BM Especiero Cajón",
    subtitle: "20 x 90 cm",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 20,
    height: 90,
    src: "/assets/modules/bajo-mesada/spice-rack.jpeg"
  },
  {
    type: "storekeeper",
    title: "BM Bodeguero",
    subtitle: "6 Vinos - 15 x 90 cm",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 15,
    height: 90,
    src: "/assets/modules/bajo-mesada/storekeeper.jpeg"
  },
  //Alacenas
  {
    type: "Ala35-2P-v",
    title: "AL 2 Puertas",
    subtitle: "2 Puertas + Estante. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 80,
    height: 60,
    src: "/assets/modules/alacenas/Ala35-2P-v.png"
  },
  {
    type: "Ala35-1PD",
    title: "AL 1 Puerta Der",
    subtitle: "1 Puerta + Estante. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 40,
    height: 60,
    src: "/assets/modules/alacenas/Ala35-1PD.png"
  },
  {
    type: "Ala35-1PI",
    title: "AL 1 Puerta Izq",
    subtitle: "1 Puerta + Estante. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 40,
    height: 60,
    src: "/assets/modules/alacenas/Ala35-1PI.png"
  },
  {
    type: "AlaH35-2P",
    title: "AL 2 Puertas",
    subtitle: "2 Puertas Horizontal +1 Estante. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 80,
    height: 60,
    src: "/assets/modules/alacenas/AlaH35-2P.png"
  },
  
  {
    type: "AlaH35-1P",
    title: "AL 1 Puerta",
    subtitle: "1 Puerta Horizontal. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 80,
    height: 30,
    src: "/assets/modules/alacenas/AlaH35-1P.png"
  },
  {
    type: "Ala-extra",
    title: "AL 1 Puerta",
    subtitle: "1 Puerta + Extractor. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 80,
    height: 60,
    src: "/assets/modules/alacenas/Ala-extra.png"
  },
  {
    type: "AlaH35-SP",
    title: "AL Sin Puertas",
    subtitle: "1 Estante. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 80,
    height: 60,
    src: "/assets/modules/alacenas/AlaH35-SP.png"
  },
  {
    type: "AlaH35-SP2",
    title: "AL Sin Puerta",
    subtitle: "Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 80,
    height: 30,
    src: "/assets/modules/alacenas/AlaH35-SP2.png"
  },
  
  //Especiales
  {
    type: "colum1",
    title: "AL Columna 1",
    subtitle: "60 X 211 cm - 2 Cajones + Horno + Micro + Puerta Sup",
    section: "ESP",
    sectionLabel: "ESPECIALES",
    width: 60,
    height: 211,
    src: "/assets/modules/especiales/colum1.jpeg"
  },
  {
    type: "colum2",
    title: "AL Columna 2",
    subtitle: "60 X 211 cm - 1 Puerta + Horno + Puerta Sup",
    section: "ESP",
    sectionLabel: "ESPECIALES",
    width: 60,
    height: 211,
    src: "/assets/modules/especiales/colum2.jpeg"
  },
  {
    type: "colum3",
    title: "AL Columna 3",
    subtitle: "60 X 211 cm - 2 Cajones + Horno + 2 Puertas Sup",
    section: "ESP",
    sectionLabel: "ESPECIALES",
    width: 60,
    height: 213,
    src: "/assets/modules/especiales/colum3.png"
  },
  //Electro
  {
    type: "fridge-right",
    title: "Heladera 1",
    subtitle: "60 x 180 cm",
    section: "ELECTRO",
    sectionLabel: "ELECTRO",
    width: 60,
    height: 180,
    src: "/assets/modules/electro/fridge-right.jpeg"
  },
  {
    type: "double-fridge-right",
    title: "Heladera 2",
    subtitle: "91 x 178 cm",
    section: "ELECTRO",
    sectionLabel: "ELECTRO",
    width: 91,
    height: 178,
    src: "/assets/modules/electro/double-fridge-right.png"
  },
  {
    type: "built-in-range",
    title: "Cocina-Horno",
    subtitle: "60 x 94 cm",
    section: "ELECTRO",
    sectionLabel: "ELECTRO",
    width: 60,
    height: 105,
    src: "/assets/modules/electro/built-in-range.jpeg"
  },
  {
    type: "microwave",
    title: "Microondas",
    subtitle: "48 x 30 cm",
    section: "ELECTRO",
    sectionLabel: "ELECTRO",
    width: 48,
    height: 30,
    src: "/assets/modules/electro/microwave.jpeg"
  },
  {
    type: "washing-machine",
    title: "Lavarropas",
    subtitle: "60 x 90 cm",
    section: "ELECTRO",
    sectionLabel: "ELECTRO",
    width: 60,
    height: 90,
    src: "/assets/modules/electro/washing-machine.jpeg"
  },
  {
    type: "dishwasher",
    title: "Lavavajillas",
    subtitle: "60 x 90 cm",
    section: "ELECTRO",
    sectionLabel: "ELECTRO",
    width: 60,
    height: 90,
    src: "/assets/modules/electro/dishwasher.jpeg"
  },


  // Aquí podés seguir agregando más módulos...
];

export default modules;
