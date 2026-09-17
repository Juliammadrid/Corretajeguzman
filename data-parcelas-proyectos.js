/* ============================================================
   PARCELAS — proyectos de loteo (aliado Parcelas en Venta)
   Campo Alto Roble · Villarrica, La Araucanía
   Valor UF referencia del cuadro: $37.372
   status: "disponible" | "reservada" | "vendida"
   ============================================================ */
window.PARCELA_PROYECTOS = {
  "campo-alto-roble": {
    name: "Campo Alto Roble",
    sector: "Villarrica",
    region: "La Araucanía",
    address: "Camino Villarrica–Pucón, 2ª faja, Villarrica",
    desdeUF: 2400,
    ufRef: 37372,
    ufSim: 40746.28,
    credito: {
      pieMin: 40,
      pieDefault: 50,
      tasaMes: 1.0,
      plazos: [12, 24, 36],
      recargo: 6,
      nota: "Simulación referencial de financiamiento directo con el propietario del proyecto. Pie mínimo 40%, tasa 1% mensual. Valores sujetos a evaluación y al valor de la UF del día."
    },
    supParcela: 5000,
    entornoTitulo: "Villarrica: naturaleza con vida de ciudad",
    entornoLead: "Villarrica entrega la combinación perfecta entre áreas verdes y urbanidad. A orillas del lago y frente al volcán, es una de las ciudades del sur con mayor crecimiento y plusvalídad sostenida: clínicas y hospital, colegios de excelencia — incluido un colegio inglés contiguo al proyecto —, supermercados, comercio, restaurantes y una agenda turística todo el año. Vivir aquí es tener la tranquilidad del campo sin renunciar a nada.",
    entornoRazones: [
      { t: "Lago Villarrica y playas a minutos", d: "Deportes náuticos, playas y costanera durante todo el verano.", ic: "waves" },
      { t: "Volcán y centro de ski", d: "Vista permanente al volcán Villarrica y ski en temporada de invierno.", ic: "mountain-snow" },
      { t: "Plusvalía sostenida", d: "Destino turístico consolidado con demanda estable de arriendo y segunda vivienda.", ic: "trending-up" },
      { t: "Servicios completos", d: "Hospital, clínicas, bancos, supermercados y comercio a pocos minutos.", ic: "building-2" },
      { t: "Educación de excelencia", d: "Colegios reconocidos del sur, con colegio inglés contiguo al loteo.", ic: "graduation-cap" },
      { t: "Conectividad", d: "Ruta pavimentada a Pucón y Temuco, con aeropuerto La Araucanía a 1 hora.", ic: "route" }
    ],
    proyectoEnfoque: [],
    lat: -39.3121548,
    lng: -72.1920067,
    heroImg: "/assets/parc/car-hero.jpg",
    masterplan: "/assets/parc/car-masterplan.jpg",
    lead: "Campo Alto Roble es un loteo de parcelas de 5.000 m² con urbanización de alto estándar a solo 4 km de Villarrica. Cada parcela cuenta con electricidad, agua y fibra óptica, además de un reglamento interno con normativas de construcción, diseño y administración que protegen la plusvalía del conjunto. Vistas al volcán Villarrica, bosque nativo y lagunas dentro del proyecto.",
    urbanizacion: [
      { t: "100% Urbanizados", ic: "home" },
      { t: "Agua en cada parcela", ic: "droplet" },
      { t: "Electricidad", ic: "plug-zap" },
      { t: "Internet fibra óptica", ic: "wifi" },
      { t: "Conectividad vial", ic: "route" },
      { t: "Seguridad y acceso controlado", ic: "shield-check" }
    ],
    entorno: [],
    distancias: [
      { k: "Villarrica", v: "4 km" },
      { k: "Supermercado", v: "2 km" },
      { k: "Servicentro", v: "2 km" },
      { k: "Hospital", v: "3 km" },
      { k: "Bomberos", v: "6,5 km" },
      { k: "Pucón", v: "18 km" }
    ],
    galeria: [
      { src: "/assets/parc/car-volcan.jpg", t: "Vista al volcán Villarrica" },
      { src: "/assets/parc/car-lago.jpg", t: "Lagunas y lago Villarrica" },
      { src: "/assets/parc/car-acceso.jpg", t: "Acceso urbanizado" },
      { src: "/assets/parc/car-atardecer.jpg", t: "Atardecer sobre el campo" },
      { src: "/assets/parc/car-caminos.jpg", t: "Caminos interiores" },
      { src: "/assets/parc/car-laguna.jpg", t: "Laguna interior" },
      { src: "/assets/parc/car-vacas-volcan.jpg", t: "Praderas con vista al volcán" },
      { src: "/assets/parc/car-valle.jpg", t: "El valle y la cordillera" },
      { src: "/assets/parc/car-aereo1.jpg", t: "Vista aérea del loteo" },
      { src: "/assets/parc/car-aereo2.jpg", t: "Parcelas y bosque" },
      { src: "/assets/parc/car-detalle.jpg", t: "Bosque nativo" }
    ],
    /* Cuadro de superficies — todas de 5.000 m² aprox */
    parcelas: [
      { n: 3,  uf: 3100, clp: 115853200 }, { n: 8,  uf: 3100, clp: 115853200 },
      { n: 16, uf: 3000, clp: 112116000, status: "reservada" },
      { n: 21, uf: 2800, clp: 104641600 }, { n: 22, uf: 2900, clp: 108378800 },
      { n: 23, uf: 2900, clp: 108378800 }, { n: 24, uf: 2600, clp: 97167200 },
      { n: 29, uf: 2800, clp: 104641600 }, { n: 30, uf: 2600, clp: 97167200 },
      { n: 31, uf: 2600, clp: 97167200 },  { n: 34, uf: 2800, clp: 104641600 },
      { n: 35, uf: 2500, clp: 93430000 },  { n: 36, uf: 2500, clp: 93430000 },
      { n: 37, uf: 2400, clp: 89692800 },  { n: 38, uf: 2400, clp: 89692800 },
      { n: 39, uf: 2400, clp: 89692800 },  { n: 40, uf: 2400, clp: 89692800 },
      { n: 41, uf: 2400, clp: 89692800 },  { n: 42, uf: 2500, clp: 93430000 },
      { n: 43, uf: 2500, clp: 93430000 },  { n: 44, uf: 2500, clp: 93430000 },
      { n: 45, uf: 2500, clp: 93430000 },  { n: 46, uf: 2500, clp: 93430000 },
      { n: 47, uf: 2500, clp: 93430000 },  { n: 48, uf: 2600, clp: 97167200 },
      { n: 49, uf: 2600, clp: 97167200 },  { n: 50, uf: 2500, clp: 93430000 },
      { n: 52, uf: 2700, clp: 100904400 }, { n: 53, uf: 2700, clp: 100904400 },
      { n: 54, uf: 2600, clp: 97167200 },  { n: 55, uf: 2600, clp: 97167200 },
      { n: 56, uf: 2400, clp: 89692800 },  { n: 64, uf: 2700, clp: 100904400 },
      { n: 69, uf: 2700, clp: 100904400 }, { n: 70, uf: 2700, clp: 100904400 },
      { n: 71, uf: 2900, clp: 108378800 }
    ],
    wa: "56944637680",
    whatsapps: ["56944637680", "56944717233"]
  }
};
