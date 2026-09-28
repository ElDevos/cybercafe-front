/* ============================================================
   NEXUS Cybercafé — datos del negocio
   Antes vivían en el navegador; ahora los sirve la API.
   ============================================================ */

const PLANS = {
  hora: [
    { name: 'Coworking',   desc: 'Cabina silenciosa con doble monitor', amount: '2.50', unit: '/hora',
      feats: ['Doble monitor Full HD', 'Silla ergonómica', 'Café americano incluido', 'Enchufes y luz individual', 'Impresión B/N (5 hojas)'] },
    { name: 'Gaming',      desc: 'La estación más pedida del local', amount: '3.50', unit: '/hora', featured: true, tag: 'Popular',
      feats: ['RTX 4080 · 240 Hz', 'Periféricos Razer/HyperX', 'Bebida ilimitada', 'Juegos precargados', 'Guardado en la nube'] },
    { name: 'VIP / Stream',desc: 'Cabina privada con equipo de streaming', amount: '5.00', unit: '/hora',
      feats: ['Cabina insonorizada', 'Cámara 4K + croma', 'Luces LED y micrófono', 'OBS configurado', 'Snack de cortesía'] }
  ],
  pase: [
    { name: 'Pase Día',    desc: '12 horas continuas, cualquier zona', amount: '24.00', unit: '/día',
      feats: ['12 h de juego seguidas', 'Cambio de zona libre', '2 bebidas incluidas', 'Casillero del día', 'Sin recargo nocturno'] },
    { name: 'Membresía',   desc: '40 horas al mes + beneficios', amount: '59.00', unit: '/mes', featured: true, tag: 'Mejor valor',
      feats: ['40 h mensuales acumulables', 'Reserva prioritaria', 'Inscripción gratis a torneos', '15 % en cafetería', 'Casillero permanente'] },
    { name: 'Pase Noche',  desc: 'De 22:00 a 07:00, ideal para maratones', amount: '15.00', unit: '/noche',
      feats: ['9 h de barra libre de PC', 'Café ilimitado', 'Manta y almohada', 'Desayuno a las 6:00', 'Zona silenciosa'] }
  ]
};

const MENU = [
  { n: 'Espresso doble',   c: 'cafe',   e: '☕', p: 2.20, d: 'Grano de especialidad tostado cada semana.' },
  { n: 'Latte caramelo',   c: 'cafe',   e: '🥛', p: 3.40, d: 'Leche vaporizada, caramelo salado y canela.' },
  { n: 'Cold brew 16 oz',  c: 'cafe',   e: '🧊', p: 3.80, d: 'Extracción en frío de 18 horas. Sin azúcar.' },
  { n: 'Matcha latte',     c: 'cafe',   e: '🍵', p: 3.90, d: 'Matcha ceremonial con leche de avena.' },
  { n: 'Nachos con queso', c: 'snack',  e: '🧀', p: 4.50, d: 'Porción grande para compartir entre dos.' },
  { n: 'Alitas BBQ (6)',   c: 'snack',  e: '🍗', p: 6.90, d: 'Con papas y salsa ranch de la casa.' },
  { n: 'Papas gamer',      c: 'snack',  e: '🍟', p: 3.60, d: 'Crujientes, con especias y sin grasa en el teclado.' },
  { n: 'Brownie caliente', c: 'snack',  e: '🍫', p: 3.20, d: 'Con helado de vainilla encima.' },
  { n: 'Combo Rusher',     c: 'combo',  e: '🔥', p: 8.90, d: 'Hamburguesa + papas + energética grande.' },
  { n: 'Combo Maratón',    c: 'combo',  e: '🎮', p: 12.50,d: '2 h de juego + pizza personal + refresco.' },
  { n: 'Combo Dúo',        c: 'combo',  e: '👥', p: 15.90,d: 'Dos estaciones 2 h + nachos + 2 bebidas.' },
  { n: 'Combo Desvelo',    c: 'combo',  e: '🌙', p: 10.00,d: 'Café ilimitado de 22:00 a 6:00 + sándwich.' },
  { n: 'Energética 500ml', c: 'bebida', e: '⚡', p: 3.00, d: 'Fría, la clásica de todas las partidas.' },
  { n: 'Limonada de menta',c: 'bebida', e: '🍋', p: 2.80, d: 'Natural, sin azúcar añadida.' },
  { n: 'Agua mineral',     c: 'bebida', e: '💧', p: 1.50, d: 'Porque hidratarse también sube el rank.' },
  { n: 'Smoothie de frutas',c:'bebida', e: '🥤', p: 4.20, d: 'Fresa, plátano y mango. Sin lácteos.' }
];

// Tarifa por hora de cada zona (coincide con el <select> del formulario)
const ZONES = {
  gaming: { label: 'Gaming',          rate: 3.5 },
  vip:    { label: 'VIP / Streaming', rate: 5   },
  cowork: { label: 'Coworking',       rate: 2.5 },
  vr:     { label: 'Sala VR',         rate: 8   }
};

const EXTRAS = {
  combo:     { label: 'Combo gamer',     price: 6 },
  headset:   { label: 'Headset premium', price: 3 },
  casillero: { label: 'Casillero',       price: 4 }
};

// Filas del mapa de estaciones
const SEAT_ROWS = [
  { prefix: 'A', count: 24, zone: 'gaming', busyRate: 0.28 },
  { prefix: 'V', count: 8,  zone: 'vip',    busyRate: 0.38 },
  { prefix: 'C', count: 12, zone: 'cowork', busyRate: 0.28 }
];

module.exports = { PLANS, MENU, ZONES, EXTRAS, SEAT_ROWS };
