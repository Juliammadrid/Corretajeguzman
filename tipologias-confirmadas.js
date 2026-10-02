/* ============================================================
   TIPOLOGÍAS CONFIRMADAS — para que Codex las cargue en cada
   proyecto de data-proyectos-detalle.js (campo tipologiasDisponibles).
   Se completa proyecto por proyecto a medida que se confirma.
   Planos en assets/proy/.
   ============================================================ */
window.TIPOLOGIAS_CONFIRMADAS = {

  /* -------- Metropolitan Park Ñuñoa · slug: metropolitan-park-nunoa --------
     Estado: COMPLETO (9 plantas: 1D+1B A·B·C·E·F, 2D+1B A·B, 2D+2B A·B).
     Nota: el "Studio 206 al 1706" del selector de Imagina no tiene datos ni
     plano propios (la web muestra los de la Planta A 209), por eso no se carga. */
  "metropolitan-park-nunoa": [
    { nombre:"1 dormitorio + 1 baño", planta:"A: 209 al 1609", plano:"/assets/proy/mp-plano-1d-a.jpg", m2int:"34,18 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"2,64 m² aprox", orientacion:"Oriente",    m2tot:"36,82 m² aprox", desdeUF:3542 },
    { nombre:"1 dormitorio + 1 baño", planta:"B: 204 al 1604", plano:"/assets/proy/mp-plano-1d-b.jpg", m2int:"33,71 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"2,64 m² aprox", orientacion:"Oriente",    m2tot:"36,35 m² aprox", desdeUF:3536 },
    { nombre:"1 dormitorio + 1 baño", planta:"C: 205 al 1605", plano:"/assets/proy/mp-plano-1d-c.jpg", m2int:"33,71 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"2,64 m² aprox", orientacion:"Oriente",    m2tot:"36,35 m² aprox", desdeUF:3536 },
    { nombre:"1 dormitorio + 1 baño", planta:"E: 203 al 1603", plano:"/assets/proy/mp-plano-1d-e.jpg", m2int:"34,15 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"2,64 m² aprox", orientacion:"Nororiente", m2tot:"36,79 m² aprox", desdeUF:3528 },
    { nombre:"1 dormitorio + 1 baño", planta:"F: 208 al 1608", plano:"/assets/proy/mp-plano-1d-f.jpg", m2int:"33,71 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"2,64 m² aprox", orientacion:"Oriente",    m2tot:"36,35 m² aprox", desdeUF:3566 },
    { nombre:"2 dormitorios + 1 baño", planta:"A: 201 al 1601", plano:"/assets/proy/mp-plano-2d1b-a.jpg", m2int:"42,17 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"2,64 m² aprox", orientacion:"Poniente", m2tot:"44,81 m² aprox", desdeUF:4360 },
    { nombre:"2 dormitorios + 1 baño", planta:"B: 211 al 1611", plano:"/assets/proy/mp-plano-2d1b-b.jpg", m2int:"42,17 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"2,64 m² aprox", orientacion:"Poniente", m2tot:"44,81 m² aprox", desdeUF:4354 },
    { nombre:"2 dormitorios + 2 baños", planta:"A: 202 al 1602", plano:"/assets/proy/mp-plano-2d2b-a.jpg", m2int:"53,47 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"2,64 m² aprox", orientacion:"Poniente", m2tot:"56,11 m² aprox", desdeUF:4938 },
    { nombre:"2 dormitorios + 2 baños", planta:"B: 210 al 1610", plano:"/assets/proy/mp-plano-2d2b-b.jpg", m2int:"51,90 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"2,70 m² aprox", orientacion:"Poniente", m2tot:"54,6 m² aprox",  desdeUF:4852 }
  ],

  /* -------- Residential Park Ñuñoa · slug: residential-park-nunoa --------
     Estado: COMPLETO (6 plantas: 1D+1B A·B, 2D+1B A, 2D+2B A·B, 3D+2B A). */
  "residential-park-nunoa": [
    { nombre:"1 dormitorio + 1 baño", planta:"A: 202 al 2102", plano:"/assets/proy/rpn-plano-1d-a.jpg", m2int:"35,39 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"3,40 m² aprox", orientacion:"Sur",   m2tot:"38,79 m² aprox", desdeUF:3025 },
    { nombre:"1 dormitorio + 1 baño", planta:"B: 307 al 2207", plano:"/assets/proy/rpn-plano-1d-b.jpg", m2int:"33,81 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"2,88 m² aprox", orientacion:"Norte", m2tot:"36,69 m² aprox", desdeUF:3190 },
    { nombre:"2 dormitorios + 1 baño", planta:"A: 304 al 2104", plano:"/assets/proy/rpn-plano-2d1b-a.jpg", m2int:"43,75 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"8,28 m² aprox", orientacion:"Poniente", m2tot:"52,03 m² aprox", desdeUF:3878 },
    { nombre:"2 dormitorios + 2 baños", planta:"A: 203 al 2203", plano:"/assets/proy/rpn-plano-2d2b-a.jpg", m2int:"52,15 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"3,50 m² aprox", orientacion:"Sur",   m2tot:"55,65 m² aprox", desdeUF:4196 },
    { nombre:"2 dormitorios + 2 baños", planta:"B: 306 al 1906", plano:"/assets/proy/rpn-plano-2d2b-b.jpg", m2int:"60,32 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"11,38 m² aprox", orientacion:"Norte", m2tot:"71,7 m² aprox",  desdeUF:5114 },
    { nombre:"3 dormitorios + 2 baños", planta:"A: 208 al 2008", plano:"/assets/proy/rpn-plano-3d2b-a.jpg", m2int:"82,40 m² aprox", dormBano:"3 dorm + 2 baños", terraza:"12,28 m² aprox", orientacion:"Oriente", m2tot:"94,68 m² aprox", desdeUF:6521 }
  ],

  /* -------- All Ñuñoa II · slug: all-nunoa-2 --------
     Estado: COMPLETO (solo 3D+2B disponible: plantas A y B). */
  "all-nunoa-2": [
    { nombre:"3 dormitorios + 2 baños", planta:"A: 308 al 1308", plano:"/assets/proy/all-nunoa-2-planta-a.jpg", m2int:"79,67 m² aprox", dormBano:"3 dorm + 2 baños", terraza:"12,40 m² aprox", orientacion:"Nororiente", m2tot:"92,07 m² aprox", desdeUF:7689 },
    { nombre:"3 dormitorios + 2 baños", planta:"B: 902 al 1302", plano:"/assets/proy/all-nunoa-2-planta-b.jpg", m2int:"79,74 m² aprox", dormBano:"3 dorm + 2 baños", terraza:"12,36 m² aprox", orientacion:"Suroriente", m2tot:"92,1 m² aprox",  desdeUF:8229 }
  ],

  /* -------- Smart Too Ñuñoa · slug: smart-too --------
     Estado: COMPLETO (solo 2D+2B disponible: plantas A, B, C, D). */
  "smart-too": [
    { nombre:"2 dormitorios + 2 baños", planta:"A: 424",          plano:"/assets/proy/st-plano-2d2b-a.jpg", m2int:"52,74 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"6,76 m² aprox", orientacion:"Poniente", m2tot:"59,5 m² aprox",  desdeUF:4548 },
    { nombre:"2 dormitorios + 2 baños", planta:"B: 1121 al 1621", plano:"/assets/proy/st-plano-2d2b-b.jpg", m2int:"58,37 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"4,00 m² aprox", orientacion:"Norte",    m2tot:"62,37 m² aprox", desdeUF:4889 },
    { nombre:"2 dormitorios + 2 baños", planta:"C: 308 al 708",   plano:"/assets/proy/st-plano-2d2b-c.jpg", m2int:"54,02 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"8,70 m² aprox", orientacion:"Poniente", m2tot:"62,72 m² aprox", desdeUF:4634 },
    { nombre:"2 dormitorios + 2 baños", planta:"D: 210",          plano:"/assets/proy/st-plano-2d2b-d.jpg", m2int:"66,34 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"8,94 m² aprox", orientacion:"Oriente",  m2tot:"75,28 m² aprox", desdeUF:5860 }
  ],

  /* -------- Urban Ñuñoa · slug: urban-nunoa --------
     Estado: COMPLETO (6 plantas: 1D+1B B·C, 2D+1B A, 2D+2B A·B·C). */
  "urban-nunoa": [
    { nombre:"1 dormitorio + 1 baño", planta:"B: 214 al 2414", plano:"/assets/proy/un-plano-1d-b.jpg", m2int:"34,80 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"2,90 m² aprox", orientacion:"Oriente",  m2tot:"37,7 m² aprox", desdeUF:3800 },
    { nombre:"1 dormitorio + 1 baño", planta:"C: 408 al 2408", plano:"/assets/proy/un-plano-1d-c.jpg", m2int:"34,80 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"2,90 m² aprox", orientacion:"Poniente", m2tot:"37,7 m² aprox", desdeUF:3692 },
    { nombre:"2 dormitorios + 1 baño", planta:"A: 309 al 2309", plano:"/assets/proy/un-plano-2d1b-a.jpg", m2int:"42,44 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"7,16 m² aprox", orientacion:"Poniente", m2tot:"49,6 m² aprox", desdeUF:4410 },
    { nombre:"2 dormitorios + 2 baños", planta:"A: 201 al 1601", plano:"/assets/proy/un-plano-2d2b-a.jpg", m2int:"52,25 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"2,94 m² aprox", orientacion:"Poniente", m2tot:"55,19 m² aprox", desdeUF:5019 },
    { nombre:"2 dormitorios + 2 baños", planta:"B: 218 al 1218", plano:"/assets/proy/un-plano-2d2b-b.jpg", m2int:"62,48 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"9,54 m² aprox", orientacion:"Oriente",  m2tot:"72,02 m² aprox", desdeUF:6731 },
    { nombre:"2 dormitorios + 2 baños", planta:"C: 319 al 1319", plano:"/assets/proy/un-plano-2d2b-c.jpg", m2int:"66,19 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"6,64 m² aprox", orientacion:"Poniente", m2tot:"72,83 m² aprox", desdeUF:6574 }
  ],

  /* -------- Best Ñuñoa · slug: best-nunoa --------
     Estado: COMPLETO (única disponible: 3D+2B planta A). */
  "best-nunoa": [
    { nombre:"3 dormitorios + 2 baños", planta:"A: 406 al 1506", plano:"/assets/proy/bn-plano-3d2b-a.jpg", m2int:"79,00 m² aprox", dormBano:"3 dorm + 2 baños", terraza:"11,04 m² aprox", orientacion:"Norte", m2tot:"90,04 m² aprox", desdeUF:8011 }
  ],

  /* -------- Best Level · slug: best-level --------
     Estado: COMPLETO (única disponible: 2D+1B planta B). */
  "best-level": [
    { nombre:"2 dormitorios + 1 baño", planta:"B: 112", plano:"/assets/proy/bl-plano-2d1b-b.jpg", m2int:"45,58 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"6,88 m² aprox", orientacion:"Poniente", m2tot:"52,46 m² aprox", desdeUF:7566 }
  ],

  /* -------- Style Ñuñoa · slug: style-nunoa --------
     Estado: COMPLETO (4 plantas: 2D+2B B, 3D+2B A·B, 3D+3B A). */
  "style-nunoa": [
    { nombre:"2 dormitorios + 2 baños", planta:"B: 106", plano:"/assets/proy/sn-plano-2d2b-b.jpg", m2int:"58,01 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"7,46 m² aprox", orientacion:"Oriente", m2tot:"65,47 m² aprox", desdeUF:7928 },
    { nombre:"3 dormitorios + 2 baños", planta:"A: 216 al 716", plano:"/assets/proy/sn-plano-3d2b-a.jpg", m2int:"96,36 m² aprox", dormBano:"3 dorm + 2 baños", terraza:"12,52 m² aprox", orientacion:"Norponiente", m2tot:"108,88 m² aprox", desdeUF:8985 },
    { nombre:"3 dormitorios + 2 baños", planta:"B: 405 al 705", plano:"/assets/proy/sn-plano-3d2b-b.jpg", m2int:"96,46 m² aprox", dormBano:"3 dorm + 2 baños", terraza:"12,52 m² aprox", orientacion:"Norte",       m2tot:"108,98 m² aprox", desdeUF:9514 },
    { nombre:"3 dormitorios + 3 baños", planta:"A: 309 al 709", plano:"/assets/proy/sn-plano-3d3b-a.jpg", m2int:"103,69 m² aprox", dormBano:"3 dorm + 3 baños", terraza:"18,16 m² aprox", orientacion:"Poniente",   m2tot:"121,85 m² aprox", desdeUF:9579 }
  ],

  /* -------- Hometown Santiago · slug: hometown-santiago --------
     Estado: COMPLETO (única disponible: 2D+2B planta A). */
  "hometown-santiago": [
    { nombre:"2 dormitorios + 2 baños", planta:"A: 215 al 1015", plano:"/assets/proy/ht-plano-2d2b-a.jpg", m2int:"54,79 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"2,94 m² aprox", orientacion:"Oriente", m2tot:"57,73 m² aprox", desdeUF:3800 }
  ]

};

/* ---- Aplica las tipologías confirmadas sobre las fichas ----
   Cargar este archivo DESPUÉS de data-proyectos-detalle.js y ANTES de
   proyecto-ficha.js / simulador.js / cotizacion.js.
   Reemplaza tipologiasDisponibles de cada proyecto y actualiza su
   "desde UF" (ficha y grilla) con el precio más bajo confirmado. */
(function(){
  var C = window.TIPOLOGIAS_CONFIRMADAS || {};
  var F = window.PROYECTO_FICHAS || {};
  var G = window.PROYECTOS || [];
  Object.keys(C).forEach(function(slug){
    var T = C[slug]; if(!T || !T.length) return;
    T.forEach(function(t){
      t.id = t.plano.split('/').pop().replace(/\.jpg$/i, '');
      var partes = t.nombre.match(/(\d+) dormitorio.*?(\d+) baño/);
      t.dormitorios = partes ? Number(partes[1]) : null;
      t.banos = partes ? Number(partes[2]) : null;
    });
    var specs = Array.from(new Set(T.map(function(t){ return t.dormBano; }))).join(' · ');
    var min = Math.min.apply(null, T.map(function(t){ return t.desdeUF || Infinity; }));
    if(F[slug]){
      F[slug].tipologiasDisponibles = T.slice();
      if(isFinite(min)) F[slug].desdeUF = min;
    }
    G.forEach(function(g){ if(g.slug === slug && isFinite(min)){ g.desdeUF = min; g.specs = specs; } });
  });
})();
