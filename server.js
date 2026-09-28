/* ============================================================
   NEXUS Cybercafé — servidor Node.js (Express)
   Sirve el frontend de /public y expone una API JSON.
   El estado (estaciones, reservas, suscriptores) vive en memoria
   y se reinicia cada vez que arranca el proceso.
   ============================================================ */
const path = require('path');
const express = require('express');
const { PLANS, MENU, ZONES, EXTRAS, SEAT_ROWS } = require('./src/data');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ------------------------------------------------------------
   Estado en memoria
   ------------------------------------------------------------ */
const seats = SEAT_ROWS.flatMap(row =>
  Array.from({ length: row.count }, (_, i) => ({
    id: `${row.prefix}${String(i + 1).padStart(2, '0')}`,
    zone: row.zone,
    busy: Math.random() < row.busyRate
  }))
);
const reservations = [];
const subscribers = new Set();

const round2 = n => Math.round(n * 100) / 100;

/* ------------------------------------------------------------
   API
   ------------------------------------------------------------ */
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/plans', (req, res) => res.json(PLANS));

app.get('/api/menu', (req, res) => res.json(MENU));

app.get('/api/seats', (req, res) => {
  res.json({ seats, free: seats.filter(s => !s.busy).length });
});

app.post('/api/reservations', (req, res) => {
  const { nombre, fecha, hora, zona, estacion, horas, extras = [] } = req.body || {};
  const errors = {};

  const name = typeof nombre === 'string' ? nombre.trim() : '';
  if (name.length < 3) errors.nombre = 'Escribe tu nombre completo.';

  const today = new Date().toISOString().split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) errors.fecha = 'Elige una fecha.';
  else if (fecha < today) errors.fecha = 'La fecha no puede ser anterior a hoy.';

  if (!/^\d{2}:\d{2}$/.test(hora || '')) errors.hora = 'Elige una hora de inicio.';

  const zone = ZONES[zona];
  if (!zone) errors.zona = 'Zona no válida.';

  const hours = Number(horas);
  if (!Number.isInteger(hours) || hours < 1 || hours > 8) errors.horas = 'La duración debe ser de 1 a 8 horas.';

  const extraList = Array.isArray(extras) ? extras : [];
  if (extraList.some(x => !EXTRAS[x])) errors.extras = 'Extra no válido.';

  let seat = null;
  if (estacion) {
    seat = seats.find(s => s.id === estacion);
    if (!seat) errors.estacion = 'Estación inexistente.';
    else if (zone && seat.zone !== zona) errors.estacion = 'La estación no pertenece a esa zona.';
  }

  if (Object.keys(errors).length) return res.status(400).json({ errors });

  if (seat?.busy) {
    return res.status(409).json({ errors: { estacion: `La estación ${seat.id} ya está ocupada.` } });
  }

  const extrasTotal = extraList.reduce((s, x) => s + EXTRAS[x].price, 0);
  const reservation = {
    id: reservations.length + 1,
    nombre: name,
    fecha,
    hora,
    zona,
    zonaLabel: zone.label,
    estacion: seat ? seat.id : null,
    horas: hours,
    extras: extraList,
    total: round2(hours * zone.rate + extrasTotal),
    creada: new Date().toISOString()
  };

  if (seat) seat.busy = true;
  reservations.push(reservation);
  res.status(201).json(reservation);
});

app.post('/api/newsletter', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ errors: { email: 'Correo inválido.' } });
  }
  subscribers.add(email);
  res.status(201).json({ email });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.listen(PORT, () => {
  console.log(`NEXUS Cybercafé escuchando en http://localhost:${PORT}`);
});
