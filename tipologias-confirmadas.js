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

,
  /* -------- Aldunate GO · slug: aldunate-go --------
     Estado: COMPLETO (11 plantas: 1D+1B A–F, 2D+1B A·B, 2D+2B A·B·C). */
  "aldunate-go": [
    { nombre:"1 dormitorio + 1 baño", planta:"A: 202 al 902 · Estudio", plano:"/assets/proy/agt-plano-1d-a.png", m2int:"28,15 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"0 m² aprox",    orientacion:"Oriente",  m2tot:"28,15 m² aprox", desdeUF:2666 },
    { nombre:"1 dormitorio + 1 baño", planta:"B: 311 al 911 · Estudio", plano:"/assets/proy/agt-plano-1d-b.png", m2int:"28,11 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"0 m² aprox",    orientacion:"Norte",    m2tot:"28,11 m² aprox", desdeUF:2718 },
    { nombre:"1 dormitorio + 1 baño", planta:"C: 313 al 813",           plano:"/assets/proy/agt-plano-1d-c.png", m2int:"35,05 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"6,16 m² aprox", orientacion:"Norte",    m2tot:"41,21 m² aprox", desdeUF:3211 },
    { nombre:"1 dormitorio + 1 baño", planta:"D: 226 al 926",           plano:"/assets/proy/agt-plano-1d-d.png", m2int:"33,50 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"2,88 m² aprox", orientacion:"Oriente",  m2tot:"36,38 m² aprox", desdeUF:2924 },
    { nombre:"1 dormitorio + 1 baño", planta:"E: 308 al 908",           plano:"/assets/proy/agt-plano-1d-e.png", m2int:"33,59 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"2,88 m² aprox", orientacion:"Poniente", m2tot:"36,47 m² aprox", desdeUF:2966 },
    { nombre:"1 dormitorio + 1 baño", planta:"F: 324 al 924",           plano:"/assets/proy/agt-plano-1d-f.png", m2int:"33,59 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"2,88 m² aprox", orientacion:"Poniente", m2tot:"36,47 m² aprox", desdeUF:2966 },
    { nombre:"2 dormitorios + 1 baño", planta:"A: 317 al 917",          plano:"/assets/proy/agt-plano-2d1b-a.png", m2int:"43,40 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"7,00 m² aprox", orientacion:"Sur",      m2tot:"50,4 m² aprox",  desdeUF:3714 },
    { nombre:"2 dormitorios + 1 baño", planta:"B: 320 al 920",          plano:"/assets/proy/agt-plano-2d1b-b.png", m2int:"42,23 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"5,66 m² aprox", orientacion:"Poniente", m2tot:"47,89 m² aprox", desdeUF:3639 },
    { nombre:"2 dormitorios + 2 baños", planta:"A: 310 al 910",         plano:"/assets/proy/agt-plano-2d2b-a.png", m2int:"48,72 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"2,36 m² aprox", orientacion:"Norte",   m2tot:"51,08 m² aprox", desdeUF:3928 },
    { nombre:"2 dormitorios + 2 baños", planta:"B: 316 al 916",         plano:"/assets/proy/agt-plano-2d2b-b.png", m2int:"52,74 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"2,84 m² aprox", orientacion:"Norte",   m2tot:"55,58 m² aprox", desdeUF:4097 },
    { nombre:"2 dormitorios + 2 baños", planta:"C: 319 al 919",         plano:"/assets/proy/agt-plano-2d2b-c.png", m2int:"51,03 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"3,24 m² aprox", orientacion:"Sur",     m2tot:"54,27 m² aprox", desdeUF:3987 }
  ],

  /* -------- Onetown Santiago · slug: onetown-santiago --------
     Estado: 2D+1B A y 2D+2B A·B·C·D confirmadas. */
  "onetown-santiago": [
    { nombre:"2 dormitorios + 1 baño", planta:"A: 212 al 912", plano:"/assets/proy/ot-plano-2d1b-a.jpg", m2int:"43,18 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"3,02 m² aprox", orientacion:"Poniente", m2tot:"46,2 m² aprox", desdeUF:3450 },
    { nombre:"2 dormitorios + 2 baños", planta:"A: 313 al 913", plano:"/assets/proy/ot-plano-2d2b-a.jpg", m2int:"54,07 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"3,58 m² aprox", orientacion:"Oriente",  m2tot:"57,65 m² aprox", desdeUF:3625 },
    { nombre:"2 dormitorios + 2 baños", planta:"B: 316 al 916", plano:"/assets/proy/ot-plano-2d2b-b.jpg", m2int:"52,09 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"2,52 m² aprox", orientacion:"Oriente",  m2tot:"54,61 m² aprox", desdeUF:3625 },
    { nombre:"2 dormitorios + 2 baños", planta:"C: 317 al 917", plano:"/assets/proy/ot-plano-2d2b-c.jpg", m2int:"52,29 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"3,04 m² aprox", orientacion:"Poniente", m2tot:"55,33 m² aprox", desdeUF:3625 },
    { nombre:"2 dormitorios + 2 baños", planta:"D: 208 al 908", plano:"/assets/proy/ot-plano-2d2b-d.jpg", m2int:"57,15 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"7,85 m² aprox", orientacion:"Norte",    m2tot:"65 m² aprox",    desdeUF:4395 }
  ],

  /* -------- Best Too Santiago · slug: best-too-santiago --------
     Estado: COMPLETO (5 plantas: 1D+1B A, 2D+1B A, 2D+2B A·B·C). */
  "best-too-santiago": [
    { nombre:"1 dormitorio + 1 baño", planta:"A: 401", plano:"/assets/proy/btt-plano-1d-a.jpg", m2int:"34,28 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"2,97 m² aprox", orientacion:"Norte", m2tot:"37,25 m² aprox", desdeUF:2800 },
    { nombre:"2 dormitorios + 1 baño", planta:"A: 614 al 914", plano:"/assets/proy/btt-plano-2d1b-a.jpg", m2int:"42,95 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"2,97 m² aprox", orientacion:"Oriente", m2tot:"45,92 m² aprox", desdeUF:3490 },
    { nombre:"2 dormitorios + 2 baños", planta:"A: 409 al 709", plano:"/assets/proy/btt-plano-2d2b-a.jpg", m2int:"56,69 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"7,84 m² aprox", orientacion:"Sur",      m2tot:"64,53 m² aprox", desdeUF:4450 },
    { nombre:"2 dormitorios + 2 baños", planta:"B: 415 al 815", plano:"/assets/proy/btt-plano-2d2b-b.jpg", m2int:"50,89 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"5,24 m² aprox", orientacion:"Poniente", m2tot:"56,13 m² aprox", desdeUF:3550 },
    { nombre:"2 dormitorios + 2 baños", planta:"C: 309 al 809", plano:"/assets/proy/btt-plano-2d2b-c.jpg", m2int:"59,69 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"7,84 m² aprox", orientacion:"Sur",      m2tot:"67,53 m² aprox", desdeUF:4450 }
  ],

  /* -------- Best Site Santiago · slug: best-site --------
     Estado: COMPLETO (disponibles: 2D+1B C, 2D+2B D). */
  "best-site": [
    { nombre:"2 dormitorios + 1 baño", planta:"C: 702 al 1402", plano:"/assets/proy/bs-plano-2d1b-c.jpg", m2int:"41,87 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"5,7 m² aprox", orientacion:"Sur", m2tot:"47,57 m² aprox", desdeUF:3393 },
    { nombre:"2 dormitorios + 2 baños", planta:"D: 315 al 1315", plano:"/assets/proy/bs-plano-2d2b-d.jpg", m2int:"49,78 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"2,86 m² aprox", orientacion:"Poniente", m2tot:"52,64 m² aprox", desdeUF:3588 }
  ],

  /* -------- Residential Park Santiago · slug: residential-park-santiago --------
     Estado: COMPLETO (6 plantas: 1D+1B B, 2D+1B A, 2D+2B A·B·C, 3D+2B A). */
  "residential-park-santiago": [
    { nombre:"1 dormitorio + 1 baño", planta:"B: 504 al 1904", plano:"/assets/proy/rps-plano-1d-b.jpg", m2int:"37,90 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"3,12 m² aprox", orientacion:"Poniente", m2tot:"41,02 m² aprox", desdeUF:3544 },
    { nombre:"2 dormitorios + 1 baño", planta:"A: 201 al 1901", plano:"/assets/proy/rps-plano-2d1b-a.jpg", m2int:"44,31 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"6,00 m² aprox", orientacion:"Oriente", m2tot:"50,31 m² aprox", desdeUF:4093 },
    { nombre:"2 dormitorios + 2 baños", planta:"A: 205 al 1905", plano:"/assets/proy/rps-plano-2d2b-a.jpg", m2int:"52,49 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"9,86 m² aprox", orientacion:"Poniente", m2tot:"62,35 m² aprox", desdeUF:3968 },
    { nombre:"2 dormitorios + 2 baños", planta:"B: 202 al 1902", plano:"/assets/proy/rps-plano-2d2b-b.jpg", m2int:"54,43 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"6,16 m² aprox", orientacion:"Oriente",  m2tot:"60,59 m² aprox", desdeUF:4013 },
    { nombre:"2 dormitorios + 2 baños", planta:"C: 209 al 1909", plano:"/assets/proy/rps-plano-2d2b-c.jpg", m2int:"63,29 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"6,70 m² aprox", orientacion:"Oriente",  m2tot:"69,99 m² aprox", desdeUF:4489 },
    { nombre:"3 dormitorios + 2 baños", planta:"A: 208 al 1908", plano:"/assets/proy/rps-plano-3d2b-a.jpg", m2int:"75,02 m² aprox", dormBano:"3 dorm + 2 baños", terraza:"6,98 m² aprox", orientacion:"Poniente", m2tot:"82 m² aprox", desdeUF:5093 }
  ],

  /* -------- Smart Vicuña (San Joaquín) · slug: smart-vicuna --------
     Estado: COMPLETO (6 plantas: 2D+2B A·B·C·D, 3D+2B A·B). */
  "smart-vicuna": [
    { nombre:"2 dormitorios + 2 baños", planta:"A: Torre B 1607",         plano:"/assets/proy/sv-plano-2d2b-a.jpg", m2int:"54,26 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"5,55 m² aprox", orientacion:"Norte", m2tot:"59,81 m² aprox", desdeUF:3995 },
    { nombre:"2 dormitorios + 2 baños", planta:"B: Torre A 1205 al 1605", plano:"/assets/proy/sv-plano-2d2b-b.jpg", m2int:"54,24 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"5,56 m² aprox", orientacion:"Norte", m2tot:"59,8 m² aprox",  desdeUF:4063 },
    { nombre:"2 dormitorios + 2 baños", planta:"C: Torre B 1512",         plano:"/assets/proy/sv-plano-2d2b-c.jpg", m2int:"60,72 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"6,70 m² aprox", orientacion:"Sur",   m2tot:"67,42 m² aprox", desdeUF:4483 },
    { nombre:"2 dormitorios + 2 baños", planta:"D: Torre A 1612",         plano:"/assets/proy/sv-plano-2d2b-d.jpg", m2int:"61,06 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"6,82 m² aprox", orientacion:"Sur",   m2tot:"67,88 m² aprox", desdeUF:4416 },
    { nombre:"3 dormitorios + 2 baños", planta:"A: Torre B 1211 al 1511", plano:"/assets/proy/sv-plano-3d2b-a.jpg", m2int:"72,55 m² aprox", dormBano:"3 dorm + 2 baños", terraza:"6,70 m² aprox", orientacion:"Norte", m2tot:"79,25 m² aprox", desdeUF:5257 },
    { nombre:"3 dormitorios + 2 baños", planta:"B: Torre A 311 al 1611",  plano:"/assets/proy/sv-plano-3d2b-b.jpg", m2int:"72,99 m² aprox", dormBano:"3 dorm + 2 baños", terraza:"6,88 m² aprox", orientacion:"Norte", m2tot:"79,87 m² aprox", desdeUF:5302 }
  ]

  ,
  /* -------- New Life Macul · slug: new-life-macul --------
     Estado: COMPLETO (5 plantas: 2D+1B A, 2D+2B B·C·D, 3D+2B E). */
  "new-life-macul": [
    { nombre:"2 dormitorios + 1 baño", planta:"A: 1014 al 1714", plano:"/assets/proy/nlm-plano-2d1b-a.jpg", m2int:"42,0 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"5,4 m² aprox", orientacion:"Poniente", m2tot:"47,4 m² aprox", desdeUF:4191 },
    { nombre:"2 dormitorios + 2 baños", planta:"B: 1004 al 1504", plano:"/assets/proy/nlm-plano-2d2b-b.jpg", m2int:"48,72 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"9,61 m² aprox", orientacion:"Poniente", m2tot:"58,33 m² aprox", desdeUF:4239 },
    { nombre:"2 dormitorios + 2 baños", planta:"C: 1008 al 1808", plano:"/assets/proy/nlm-plano-2d2b-c.jpg", m2int:"61,89 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"7,16 m² aprox", orientacion:"Sur",      m2tot:"69,05 m² aprox", desdeUF:4895 },
    { nombre:"2 dormitorios + 2 baños", planta:"D: 309 al 1009", plano:"/assets/proy/nlm-plano-2d2b-d.jpg", m2int:"67,63 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"3,76 m² aprox", orientacion:"Norte",    m2tot:"71,39 m² aprox", desdeUF:5299 },
    { nombre:"3 dormitorios + 2 baños", planta:"E: 205 al 1005", plano:"/assets/proy/nlm-plano-3d2b-e.jpg", m2int:"79,48 m² aprox", dormBano:"3 dorm + 2 baños", terraza:"6,78 m² aprox", orientacion:"Norte",    m2tot:"86,26 m² aprox", desdeUF:6246 }
  ],

  /* -------- Smart La Florida · slug: smart-la-florida --------
     Estado: COMPLETO (3 plantas: 1D+1B B, 2D+1B A, 2D+2B A). */
  "smart-la-florida": [
    { nombre:"1 dormitorio + 1 baño", planta:"B: 817 al 1117", plano:"/assets/proy/slf-plano-1d-b.jpg", m2int:"30,40 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"5,26 m² aprox", orientacion:"Sur", m2tot:"35,66 m² aprox", desdeUF:2937 },
    { nombre:"2 dormitorios + 1 baño", planta:"A: 301 al 1101", plano:"/assets/proy/slf-plano-2d1b-a.jpg", m2int:"43,07 m² aprox", dormBano:"2 dorm + 1 baño", terraza:"2,30 m² aprox", orientacion:"Sur", m2tot:"45,37 m² aprox", desdeUF:3460 },
    { nombre:"2 dormitorios + 2 baños", planta:"A: 204 al 1504", plano:"/assets/proy/slf-plano-2d2b-a.jpg", m2int:"50,49 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"2,24 m² aprox", orientacion:"Norte", m2tot:"52,73 m² aprox", desdeUF:3692 }
  ],

  /* -------- Walker Town (La Florida) · slug: walker-town --------
     Estado: COMPLETO (4 plantas: 1D+1B A·B, 2D+2B A·C). */
  "walker-town": [
    { nombre:"1 dormitorio + 1 baño", planta:"A: 701 al 1401", plano:"/assets/proy/wt-plano-1d-a.jpg", m2int:"32,45 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"3,38 m² aprox", orientacion:"Sur", m2tot:"35,83 m² aprox", desdeUF:2939 },
    { nombre:"1 dormitorio + 1 baño", planta:"B: 510 al 1410", plano:"/assets/proy/wt-plano-1d-b.jpg", m2int:"32,80 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"3,50 m² aprox", orientacion:"Sur", m2tot:"36,3 m² aprox",  desdeUF:2892 },
    { nombre:"2 dormitorios + 2 baños", planta:"A: 209 al 1009", plano:"/assets/proy/wt-plano-2d2b-a.jpg", m2int:"60,15 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"8,06 m² aprox", orientacion:"Norte", m2tot:"68,21 m² aprox", desdeUF:4942 },
    { nombre:"2 dormitorios + 2 baños", planta:"C: 405 al 1005", plano:"/assets/proy/wt-plano-2d2b-c.jpg", m2int:"52,09 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"3,32 m² aprox", orientacion:"Sur",   m2tot:"55,41 m² aprox", desdeUF:4358 }
  ],

  /* -------- Concepto Advance (Providencia) · slug: concepto-advance --------
     Estado: COMPLETO (única disponible: 3D+3B A). */
  "concepto-advance": [
    { nombre:"3 dormitorios + 3 baños", planta:"A: 207", plano:"/assets/proy/ca-plano-3d3b-a.jpg", m2int:"113,64 m² aprox", dormBano:"3 dorm + 3 baños", terraza:"22,26 m² aprox", orientacion:"Norte", m2tot:"135,9 m² aprox", desdeUF:13148 }
  ],

  /* -------- Urban Life (Las Condes) · slug: urban-life --------
     Estado: COMPLETO (9 plantas: 1D+1B A·B·C, 2D+2B A·B·C·D·E·F). */
  "urban-life": [
    { nombre:"1 dormitorio + 1 baño", planta:"A: 501 al 701", plano:"/assets/proy/ul-plano-1d-a.jpg", m2int:"41,00 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"3,78 m² aprox", orientacion:"Poniente",   m2tot:"44,78 m² aprox", desdeUF:6117 },
    { nombre:"1 dormitorio + 1 baño", planta:"B: 312 al 712", plano:"/assets/proy/ul-plano-1d-b.jpg", m2int:"40,64 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"5,72 m² aprox", orientacion:"Sur",        m2tot:"46,36 m² aprox", desdeUF:6078 },
    { nombre:"1 dormitorio + 1 baño", planta:"C: 105",        plano:"/assets/proy/ul-plano-1d-c.jpg", m2int:"40,50 m² aprox", dormBano:"1 dorm + 1 baño", terraza:"5,72 m² aprox + jardín 26,63 m²", orientacion:"Nororiente", m2tot:"46,22 m² aprox", desdeUF:7829 },
    { nombre:"2 dormitorios + 2 baños", planta:"A: 302 al 802", plano:"/assets/proy/ul-plano-2d2b-a.jpg", m2int:"57,89 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"7,56 m² aprox", orientacion:"Poniente", m2tot:"65,45 m² aprox", desdeUF:7591 },
    { nombre:"2 dormitorios + 2 baños", planta:"B: 208 al 508", plano:"/assets/proy/ul-plano-2d2b-b.jpg", m2int:"56,01 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"14,22 m² aprox", orientacion:"Oriente", m2tot:"70,23 m² aprox", desdeUF:7982 },
    { nombre:"2 dormitorios + 2 baños", planta:"C: 207 al 807", plano:"/assets/proy/ul-plano-2d2b-c.jpg", m2int:"56,01 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"14,22 m² aprox", orientacion:"Oriente", m2tot:"70,23 m² aprox", desdeUF:8020 },
    { nombre:"2 dormitorios + 2 baños", planta:"D: 213 al 713", plano:"/assets/proy/ul-plano-2d2b-d.jpg", m2int:"61,97 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"10,80 m² aprox", orientacion:"Poniente", m2tot:"72,77 m² aprox", desdeUF:8240 },
    { nombre:"2 dormitorios + 2 baños", planta:"E: 210 al 710", plano:"/assets/proy/ul-plano-2d2b-e.jpg", m2int:"70,52 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"19,88 m² aprox", orientacion:"Oriente", m2tot:"90,4 m² aprox", desdeUF:9517 },
    { nombre:"2 dormitorios + 2 baños", planta:"F: 206 al 706", plano:"/assets/proy/ul-plano-2d2b-f.jpg", m2int:"70,52 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"19,88 m² aprox", orientacion:"Nororiente", m2tot:"90,4 m² aprox", desdeUF:10660 }
  ],

  /* -------- Smart Montemar (Concón) · slug: smart-montemar --------
     Estado: COMPLETO (4 plantas: 2D+2B A·B·C, 3D+2B A). */
  "smart-montemar": [
    { nombre:"2 dormitorios + 2 baños", planta:"A: 404 al 1604", plano:"/assets/proy/sm-plano-2d2b-a.jpg", m2int:"53,60 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"10,08 m² aprox", orientacion:"Oriente", m2tot:"63,68 m² aprox", desdeUF:5029 },
    { nombre:"2 dormitorios + 2 baños", planta:"B: 205 al 1605", plano:"/assets/proy/sm-plano-2d2b-b.jpg", m2int:"62,72 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"20,08 m² aprox", orientacion:"Oriente", m2tot:"82,8 m² aprox",  desdeUF:6015 },
    { nombre:"2 dormitorios + 2 baños", planta:"C: 402 al 1602", plano:"/assets/proy/sm-plano-2d2b-c.jpg", m2int:"66,23 m² aprox", dormBano:"2 dorm + 2 baños", terraza:"12,36 m² aprox", orientacion:"Norte",   m2tot:"78,59 m² aprox", desdeUF:6065 },
    { nombre:"3 dormitorios + 2 baños", planta:"A: 203 al 1603", plano:"/assets/proy/sm-plano-3d2b-a.jpg", m2int:"80,67 m² aprox", dormBano:"3 dorm + 2 baños", terraza:"26,22 m² aprox", orientacion:"Oriente", m2tot:"106,89 m² aprox", desdeUF:7454 }
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
      t.id = t.plano.split('/').pop().replace(/\.(jpg|png)$/i, '');
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
