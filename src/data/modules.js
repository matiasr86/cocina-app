
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
    isLinear: true,
    allowedHeights: [10, 12, 15],
    defaultLinearWidth: 80,
    row: "base",
    aiHints: {
      common: "banquina visible, continuidad visual con zócalo; color y material a juego con base"
    }
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
    isLinear: true,
    allowedHeights: [10, 12, 15],
    defaultLinearWidth: 80,
    row: "base",
    aiHints: {
      common: "zócalo aluminio simple, línea horizontal limpia, sin cortes visibles al frente"
    }
  },

  //Bajo Mesadas
    {
    type: "bm2p",
    title: "BM 2 Puertas",
    subtitle: "1 Estante",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 120,
    height: 78,
    src: "/assets/modules/bajo-mesada/bm2p.png",
    row: "base",
    aiHints: {
      started: "mueble bajo dos puertas, tiradores rectos simples",
      premium: "mueble bajo dos puertas, acabado mate, tiradores integrados de aluminio tipo J",
      deluxe:  "mueble bajo dos puertas sin tiradores (push-open o uña J), frentes lisos"
    }
  },
  {
    type: "bm1pi",
    title: "BM 1 Puerta Izq",
    subtitle: "1 Estante",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 60,
    height: 78,
    src: "/assets/modules/bajo-mesada/bm1pi.png",
    row: "base",
    aiHints: {
      common: "mueble bajo una puerta, apertura a izquierda; frente liso",
      started: "mueble bajo una puerta, tirador rectos simples",
      premium: "mueble bajo una puerta, acabado mate, tirador integrados de aluminio tipo J",
      deluxe:  "mueble bajo una puerta sin tirador (push-open o uña J), frentes lisos"
    }
  },
  {
    type: "bm1pd",
    title: "BM 1 Puerta Der",
    subtitle: "1 Estante",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 60,
    height: 78,
    src: "/assets/modules/bajo-mesada/bm1pd.png",
    row: "base",
    aiHints: {
      common: "mueble bajo una puerta, apertura a derecha; frente liso",
      started: "mueble bajo una puerta, tirador rectos simples",
      premium: "mueble bajo una puerta, acabado mate, tirador integrados de aluminio tipo J",
      deluxe:  "mueble bajo una puerta sin tirador (push-open o uña J), frentes lisos"
    }
  },
  
  {
    type: "2-drawer-cabinet",
    title: "BM Cajonero",
    subtitle: "2 Cajones",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 120,
    height: 78,
    src: "/assets/modules/bajo-mesada/2-drawer-cabinet.png",
    row: "base",
    aiHints: {
      common: "cajonera de dos cajones amplios; líneas horizontales marcadas",
      started: "mueble bajo dos cajones, tirador rectos simples",
      premium: "mueble bajo dos cajones, acabado mate, tiradores integrados de aluminio tipo J",
      deluxe:  "mueble bajo dos cajones, sin tirador (push-open o uña J), frentes lisos"
    }
  },
  {
    type: "3-drawer-cabinet",
    title: "BM Cajonero",
    subtitle: "3 Cajones Opc. 1",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 60,
    height: 78,
    src: "/assets/modules/bajo-mesada/3-drawer-cabinet.png",
    row: "base",
    aiHints: {
      common: "cajonera tres cajones; los superiores más bajo, el inferior mas profundo",
      started: "mueble bajo tres cajones, tirador rectos simples",
      premium: "mueble bajo tres cajones, acabado mate, tiradores integrados de aluminio tipo J",
      deluxe:  "mueble bajo tres cajones, sin tirador (push-open o uña J), frentes lisos"
    }
  },
  {
    type: "3-drawer-cabinet2",
    title: "BM Cajonero",
    subtitle: "3 Cajones Opc. 2",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 60,
    height: 78,
    src: "/assets/modules/bajo-mesada/3-drawer-cabinet2.png",
    row: "base",
    aiHints: {
      common: "cajonera tres cajones; el superior más bajo, los inferiores mas profundo",
      started: "mueble bajo tres cajones, tirador rectos simples",
      premium: "mueble bajo tres cajones, acabado mate, tiradores integrados de aluminio tipo J",
      deluxe:  "mueble bajo tres cajones, sin tirador (push-open o uña J), frentes lisos"
    }
  },
  {
    type: "BM-oven",
    title: "BM Horno",
    subtitle: "Horno Empotrado",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 60,
    height: 78,
    src: "/assets/modules/bajo-mesada/BM-oven.png",
    row: "base",
    aiHints: {
      common: "horno empotrado bajo mesada, frente de vidrio negro con marco de acero"
    }
  },
  {
    type: "BM-trash-can",
    title: "BM Residuos",
    subtitle: "Cesto de residuos integrad0",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 40,
    height: 78,
    src: "/assets/modules/bajo-mesada/BM-trash-can.png",
    row: "base",
    aiHints: {
      common: "una puerta con apertura tipo cajón",
      started: "mueble bajo una puerta, tirador rectos simples",
      premium: "mueble bajo una puerta, acabado mate, tiradores integrados de aluminio tipo J",
      deluxe:  "mueble bajo una puerta, sin tirador (push-open o uña J), frentes lisos"
    }
  },
  {
    type: "spice-rack",
    title: "BM Especiero Cajón",
    subtitle: "20 x 90 cm",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 20,
    height: 78,
    src: "/assets/modules/bajo-mesada/spice-rack.png",
    row: "base",
    aiHints: {
      common: "mueble bajo una puerta con apertura tipo cajón",
      started: "mueble bajo una puerta, tirador rectos simples",
      premium: "mueble bajo una puerta, acabado mate, tiradores integrados de aluminio tipo J",
      deluxe:  "mueble bajo una puerta, sin tirador (push-open o uña J), frentes lisos"
    }
  },
  {
    type: "storekeeper",
    title: "BM Bodeguero",
    subtitle: "6 Vinos - 15 x 90 cm",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 15,
    height: 78,
    src: "/assets/modules/bajo-mesada/storekeeper.png",
    row: "base",
    aiHints: {
      common: "mueble bajo bodeguero para guardar seis vinos, abierto sin puertas",
      started: "mueble bajo una puerta, tirador rectos simples",
      premium: "mueble bajo una puerta, acabado mate, tiradores integrados de aluminio tipo J",
      deluxe:  "mueble bajo una puerta, sin tirador (push-open o uña J), frentes lisos"
    }
  },
  {
    type: "BM-ESQ-1",
    title: "BM Esquinero",
    subtitle: "Esquinero derecho",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 100,
    height: 78,
    src: "/assets/modules/especiales/BM-ESQ-1.png",
    row: "base",
    aiHints: {
      common: "mueble bajo esquinero derecho con una puerta en vertical, apertura a la izquierda",
      started: "mueble bajo de una puerta, melamina blanca, tirador simple",
      premium: "mueble bajo puertas sin tirador (push-open), frentes lisos",
      deluxe:  "mueble bajo dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "BM-ESQ-2",
    title: "BM Esquinero",
    subtitle: "Esquinero izquierdo",
    section: "BM",
    sectionLabel: "BAJO MESADA",
    width: 100,
    height: 78,
    src: "/assets/modules/especiales/BM-ESQ-2.png",
    row: "base",
    aiHints: {
      common: "mueble bajo esquinero derecho con una puerta en vertical, apertura a la derecha",
      started: "mueble bajo de una puerta, melamina blanca, tirador simple",
      premium: "mueble bajo puertas sin tirador (push-open), frentes lisos",
      deluxe:  "mueble bajo dos puertas sin tirador (push-open), frentes lisos"
    }
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
    src: "/assets/modules/alacenas/Ala35-2P-v.png",
    row: "upper",
    aiHints: {
      common: "alacena con puertas en vertical, profundidad 35 cm",
      started: "alacena de dos puertas, melamina blanca, tiradores simples",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "Ala35-1PI",
    title: "AL 1 Puerta Izq",
    subtitle: "1 Puerta + Estante. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 40,
    height: 60,
    src: "/assets/modules/alacenas/Ala35-1PI.png",
    row: "upper",
    aiHints: {
      common: "alacena con puerta en vertical, profundidad 35 cm, apertura a izquierda",
      started: "alacena de una puerta, melamina blanca, tirador simple",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "Ala35-1PD",
    title: "AL 1 Puerta Izq",
    subtitle: "1 Puerta + Estante. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 40,
    height: 60,
    src: "/assets/modules/alacenas/Ala35-1PD.png",
    row: "upper",
    aiHints: {
      common: "alacena con puerta en vertical, profundidad 35 cm, apertura a la derecha",
      started: "alacena de una puerta, melamina blanca, tirador simple",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "AlaH35-2P",
    title: "AL 2 Puertas",
    subtitle: "2 Puertas Horizontal +1 Estante. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 80,
    height: 60,
    src: "/assets/modules/alacenas/AlaH35-2P.png",
    row: "upper",
    aiHints: {
      common: "alacena con puertas en horizontal, profundidad 35 cm",
      started: "alacena de dos puertas, melamina blanca, tiradores simples",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "AlaH35-1P",
    title: "AL 1 Puerta",
    subtitle: "1 Puerta Horizontal. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 80,
    height: 30,
    src: "/assets/modules/alacenas/AlaH35-1P.png",
    row: "upper",
    aiHints: {
      common: "alacena con puerta en horizontal, profundidad 35 cm",
      started: "alacena de una puerta, melamina blanca, tirador simple",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "Ala-extra",
    title: "AL 1 Puerta",
    subtitle: "1 Puerta + Extractor. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 80,
    height: 60,
    src: "/assets/modules/alacenas/Ala-extra.png",
    row: "upper",
    aiHints: {
      common: "alacena con puerta en vertical, apertura a la derecha, extractor integrado en el inferior, profundidad 35 cm",
      started: "alacena de una puerta, melamina blanca, tirador simple",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "AlaH35-SP",
    title: "AL Sin Puertas",
    subtitle: "1 Estante. Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 80,
    height: 60,
    src: "/assets/modules/alacenas/AlaH35-SP.png",
    row: "upper",
    aiHints: {
      common: "alacena sin puertas, un estante en horizontal en el medio, profundidad 35 cm",
    }
  },
  {
    type: "AlaH35-SP2",
    title: "AL Sin Puerta",
    subtitle: "Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 80,
    height: 30,
    src: "/assets/modules/alacenas/AlaH35-SP2.png",
    row: "upper",
    aiHints: {
      common: "alacena sin puertas, profundidad 35 cm",
    }
  },
  {
    type: "Ala35Esq-400",
    title: "AL Esquinero",
    subtitle: "1 Puerta Derecha, Prof. 35 cm",
    section: "ALA",
    sectionLabel: "ALACENA",
    width: 80,
    height: 75,
    src: "/assets/modules/alacenas/AlaRD400.png",
    row: "upper",
    aiHints: {
      common: "alacena esquinera derecha con una puerta en vertical, apertura a la derecha, profundidad 35 cm",
      started: "alacena de una puerta, melamina blanca, tirador simple",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  //Alacenas Puente
  {
    type: "Ala60-2P-v",
    title: "AL 2 Puertas",
    subtitle: "2 Puertas + Estante. Prof. 58 cm",
    section: "ALAP",
    sectionLabel: "ALACENA PUENTE",
    width: 80,
    height: 60,
    src: "/assets/modules/alacena-puente/Ala60-2P.png",
    row: "upper",
    aiHints: {
      common: "alacena estilo puente, con puertas en vertical, profundidad 58 cm",
      started: "alacena de dos puertas, melamina blanca, tiradores simples",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "Ala60-1PD",
    title: "AL 1 Puerta Der",
    subtitle: "1 Puerta + Estante. Prof. 58 cm",
    section: "ALAP",
    sectionLabel: "ALACENA PUENTE",
    width: 40,
    height: 60,
    src: "/assets/modules/alacena-puente/Ala60-1PD.png",
    row: "upper",
    aiHints: {
      common: "alacena estilo puente con puerta en vertical, profundidad 58 cm, apertura a derecha",
      started: "alacena de una puerta, melamina blanca, tirador simple",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "Ala60-1PI",
    title: "AL 1 Puerta Izq",
    subtitle: "1 Puerta + Estante. Prof. 58 cm",
    section: "ALAP",
    sectionLabel: "ALACENA PUENTE",
    width: 40,
    height: 60,
    src: "/assets/modules/alacena-puente/Ala60-1PI.png",
    row: "upper",
    aiHints: {
      common: "alacena estilo puente con puerta en vertical, profundidad 58 cm, apertura a izquierda",
      started: "alacena de una puerta, melamina blanca, tirador simple",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "AlaH60-2P",
    title: "AL 2 Puertas",
    subtitle: "2 Puertas Horizontal +1 Estante. Prof. 58 cm",
    section: "ALAP",
    sectionLabel: "ALACENA PUENTE",
    width: 80,
    height: 60,
    src: "/assets/modules/alacena-puente/AlaH60-2P.png",
    row: "upper",
    aiHints: {
      common: "alacena estilo puente con puertas en horizontal, profundidad 58 cm",
      started: "alacena de dos puertas, melamina blanca, tiradores simples",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "AlaH60-1P",
    title: "AL 1 Puerta",
    subtitle: "1 Puerta Horizontal. Prof. 58 cm",
    section: "ALAP",
    sectionLabel: "ALACENA PUENTE",
    width: 80,
    height: 30,
    src: "/assets/modules/alacena-puente/AlaH60-1P.png",
    row: "upper",
    aiHints: {
      common: "alacena estilo puente con puerta en horizontal, profundidad 58 cm",
      started: "alacena de una puerta, melamina blanca, tirador simple",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "Ala-extra60",
    title: "AL 1 Puerta",
    subtitle: "1 Puerta + Extractor. Prof. 58 cm",
    section: "ALAP",
    sectionLabel: "ALACENA PUENTE",
    width: 80,
    height: 60,
    src: "/assets/modules/alacena-puente/Ala-extra60.png",
    row: "upper",
    aiHints: {
      common: "alacena estilo puente con puerta en vertical, apertura a la derecha, extractor integrado en el inferior, profundidad 58 cm",
      started: "alacena de una puerta, melamina blanca, tirador simple",
      premium: "alacena dos puertas sin tirador (push-open), frentes lisos",
      deluxe:  "alacena dos puertas sin tirador (push-open), frentes lisos"
    }
  },
  {
    type: "AlaH60-SP",
    title: "AL Sin Puertas",
    subtitle: "1 Estante. Prof. 58 cm",
    section: "ALAP",
    sectionLabel: "ALACENA PUENTE",
    width: 80,
    height: 60,
    src: "/assets/modules/alacena-puente/AlaH60-SP.png",
    row: "upper",
    aiHints: {
      common: "alacena estilo puente sin puertas, un estante en horizontal en el medio, profundidad 58 cm",
    }
  },
  {
    type: "AlaH60-SP2",
    title: "AL Sin Puerta",
    subtitle: "Prof. 58 cm",
    section: "ALAP",
    sectionLabel: "ALACENA PUENTE",
    width: 80,
    height: 30,
    src: "/assets/modules/alacena-puente/AlaH60-SP2.png",
    row: "upper",
    aiHints: {
      common: "alacena estilo puente sin puertas, profundidad 58 cm",
    }
  },
  //Especiales
  {
    type: "colum1",
    title: "AL Columna 1",
    subtitle: "60 X 140 cm - 1 Cajón + Horno + Micro",
    section: "ESP",
    sectionLabel: "ESPECIALES",
    width: 60,
    height: 140,
    src: "/assets/modules/especiales/colum1.png",
    row: "tall",
    aiHints: {
      common: "columna con un cajón, horno integrado, espacio abierto para microondas ",
      started: "tirador rectos simples",
      premium: "tiradores integrados de aluminio tipo J",
      deluxe:  "sin tirador (push-open o uña J), frentes lisos"
    }
  },
  {
    type: "colum2",
    title: "AL Columna 2",
    subtitle: "60 X 140 cm - 2 Cajones + Horno",
    section: "ESP",
    sectionLabel: "ESPECIALES",
    width: 60,
    height: 140,
    src: "/assets/modules/especiales/colum2.png",
    row: "tall",
    aiHints: {
      common: "columna con dos cajones, horno integrado",
      started: "tirador rectos simples",
      premium: "tiradores integrados de aluminio tipo J",
      deluxe:  "sin tirador (push-open o uña J), frentes lisos"
    }
  },
  {
    type: "colum3",
    title: "AL Columna 3",
    subtitle: "60 X 140 cm - 1 Puerta + 1 Estante + Horno",
    section: "ESP",
    sectionLabel: "ESPECIALES",
    width: 60,
    height: 140,
    src: "/assets/modules/especiales/colum3.png",
    row: "tall",
    aiHints: {
      common: "columna con una puerta de apertura a la izquierda, horno integrado",
      started: "tirador rectos simples",
      premium: "tiradores integrados de aluminio tipo J",
      deluxe:  "sin tirador (push-open o uña J), frentes lisos"
    }
  },
  {
    type: "colum4",
    title: "AL Columna 4",
    subtitle: "60 X 140 cm - 1 Puerta Izquierda + 2 Estante",
    section: "ESP",
    sectionLabel: "ESPECIALES",
    width: 60,
    height: 140,
    src: "/assets/modules/especiales/colum4.png",
    row: "tall",
    aiHints: {
      common: "columna despensa con una puerta de apertura a la izquierda",
      started: "tirador rectos simples",
      premium: "tiradores integrados de aluminio tipo J",
      deluxe:  "sin tirador (push-open o uña J), frentes lisos"
    }
  },
  {
    type: "colum5",
    title: "AL Columna 5",
    subtitle: "60 X 140 cm - 1 Puerta Derecha + 2 Estante",
    section: "ESP",
    sectionLabel: "ESPECIALES",
    width: 60,
    height: 140,
    src: "/assets/modules/especiales/colum5.png",
    row: "tall",
    aiHints: {
      common: "columna despensa con una puerta de apertura a la derecha",
      started: "tirador rectos simples",
      premium: "tiradores integrados de aluminio tipo J",
      deluxe:  "sin tirador (push-open o uña J), frentes lisos"
    }
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
    src: "/assets/modules/electro/fridge-right.jpeg",
    row: "tall",
    aiHints: {
      common: "heladera alta independiente, look acero; ubicar en posición según diseño"
    }
  },
  {
    type: "double-fridge-right",
    title: "Heladera 2",
    subtitle: "91 x 178 cm",
    section: "ELECTRO",
    sectionLabel: "ELECTRO",
    width: 91,
    height: 178,
    src: "/assets/modules/electro/double-fridge-right.png",
    row: "tall",
    aiHints: {
      common: "heladera alta independiente, de las de dos puestas anchas, look acero; ubicar en posición según diseño"
    }
  },
  {
    type: "built-in-range",
    title: "Cocina-Horno",
    subtitle: "60 x 94 cm",
    section: "ELECTRO",
    sectionLabel: "ELECTRO",
    width: 60,
    height: 105,
    src: "/assets/modules/electro/built-in-range.jpeg",
    row: "base",
    aiHints: {
      common: "cocina con horno integrada, cuatro hornallas, frente de acero sencillo"
    }
  },
  {
    type: "microwave",
    title: "Microondas",
    subtitle: "48 x 30 cm",
    section: "ELECTRO",
    sectionLabel: "ELECTRO",
    width: 48,
    height: 30,
    src: "/assets/modules/electro/microwave.jpeg",
    row: "upper",
    aiHints: {
      common: "horno electrico microondas, frente de acero sencillo"
    }
  },
  {
    type: "washing-machine",
    title: "Lavarropas",
    subtitle: "60 x 90 cm",
    section: "ELECTRO",
    sectionLabel: "ELECTRO",
    width: 60,
    height: 85,
    src: "/assets/modules/electro/washing-machine.jpeg",
    row: "base",
    aiHints: {
      common: "lavarropa, frente de acero sencillo"
    }
  },
  {
    type: "dishwasher",
    title: "Lavavajillas",
    subtitle: "60 x 90 cm",
    section: "ELECTRO",
    sectionLabel: "ELECTRO",
    width: 60,
    height: 85,
    src: "/assets/modules/electro/dishwasher.jpeg",
    row: "base",
    aiHints: {
      common: "secarropas, frente de acero sencillo"
    }
  },



];

export default modules;
