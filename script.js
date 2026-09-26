/* ============================================================
   NEXUS Cybercafé — interacciones
   Todo es estático: no hay backend, los datos viven aquí.
   ============================================================ */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const money = n => '$' + n.toFixed(2);

/* ------------------------------------------------------------
   1. Navegación: sticky, menú móvil y enlace activo
   ------------------------------------------------------------ */
const nav      = $('#nav');
const burger   = $('#burger');
const navLinks = $('#navLinks');

burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
});

navLinks.addEventListener('click', e => {
  if (e.target.tagName === 'A') {
    navLinks.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
});

const toTop = $('#toTop');
const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle('stuck', y > 20);
  toTop.classList.toggle('show', y > 600);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Enlace activo según la sección visible
const sections = $$('section[id]');
const linkFor  = id => $(`.nav-links a[href="#${id}"]`);
const spy = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    $$('.nav-links a').forEach(a => a.classList.remove('active'));
    linkFor(en.target.id)?.classList.add('active');
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => spy.observe(s));

/* ------------------------------------------------------------
   2. Reveal on scroll
   ------------------------------------------------------------ */
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach((en, i) => {
    if (!en.isIntersecting) return;
    setTimeout(() => en.target.classList.add('in'), i * 70);
    obs.unobserve(en.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px' });

const watchReveals = () => $$('.reveal:not(.in)').forEach(el => revealObserver.observe(el));
watchReveals();

/* ------------------------------------------------------------
   3. Contadores del hero
   ------------------------------------------------------------ */
$$('.stat b').forEach(el => {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();
    const dur = 1400, t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { threshold: 0.5 }).observe(el);
});

// Contador "en vivo" de equipos libres
const liveCount = $('#liveCount');
setInterval(() => {
  const now = Number(liveCount.textContent);
  const next = Math.min(26, Math.max(9, now + (Math.random() < 0.5 ? -1 : 1)));
  liveCount.textContent = next;
}, 4500);

/* ------------------------------------------------------------
   4. Tarifas
   ------------------------------------------------------------ */
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

const pricingGrid = $('#pricingGrid');
const renderPlans = key => {
  pricingGrid.innerHTML = PLANS[key].map(p => `
    <article class="card price ${p.featured ? 'featured' : ''} reveal">
      ${p.tag ? `<span class="price-tag">${p.tag}</span>` : ''}
      <h3>${p.name}</h3>
      <p class="p-desc">${p.desc}</p>
      <div class="p-amount"><b class="grad">$${p.amount}</b><i>${p.unit}</i></div>
      <ul class="p-feats">${p.feats.map(f => `<li>${f}</li>`).join('')}</ul>
      <a href="#reserva" class="btn ${p.featured ? 'btn-primary' : ''}">Elegir plan</a>
    </article>`).join('');
  watchReveals();
};

const pill = $('#togglePill');
const movePill = btn => {
  pill.style.left  = btn.offsetLeft + 'px';
  pill.style.width = btn.offsetWidth + 'px';
};

$$('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.toggle-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    movePill(btn);
    renderPlans(btn.dataset.plan);
  });
});

renderPlans('hora');
movePill($('.toggle-btn.active'));
window.addEventListener('resize', () => movePill($('.toggle-btn.active')));

/* ------------------------------------------------------------
   5. Mapa de estaciones
   ------------------------------------------------------------ */
const ZONES = [
  { el: '#seatsA', prefix: 'A', count: 24, zone: 'gaming', vip: false },
  { el: '#seatsB', prefix: 'V', count: 8,  zone: 'vip',    vip: true  },
  { el: '#seatsC', prefix: 'C', count: 12, zone: 'cowork', vip: false }
];

const selectedSeatLabel = $('#selectedSeat');
const seatInput         = $('#fSeat');
const zoneSelect        = $('#fZone');
let selectedSeat = null;

ZONES.forEach(z => {
  const host = $(z.el);
  host.innerHTML = '';
  for (let i = 1; i <= z.count; i++) {
    const id   = `${z.prefix}${String(i).padStart(2, '0')}`;
    const busy = Math.random() < (z.vip ? 0.38 : 0.28);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `seat${z.vip ? ' vip' : ''}${busy ? ' busy' : ''}`;
    b.textContent = id;
    b.dataset.zone = z.zone;
    b.disabled = busy;
    b.setAttribute('aria-label', `Estación ${id} — ${busy ? 'ocupada' : 'libre'}`);
    if (!busy) b.addEventListener('click', () => selectSeat(b, id, z.zone));
    host.appendChild(b);
  }
});

function selectSeat(btn, id, zone) {
  if (selectedSeat === btn) {                      // volver a tocar = deseleccionar
    btn.classList.remove('selected');
    selectedSeat = null;
    selectedSeatLabel.textContent = 'Ninguna';
    seatInput.value = '';
    return;
  }
  selectedSeat?.classList.remove('selected');
  btn.classList.add('selected');
  selectedSeat = btn;
  selectedSeatLabel.textContent = id;
  seatInput.value = id;
  if ([...zoneSelect.options].some(o => o.value === zone)) {
    zoneSelect.value = zone;
    updateTotal();
  }
  toast('Estación seleccionada', `${id} reservada temporalmente durante 5 minutos.`);
}

/* ------------------------------------------------------------
   6. Cuenta regresiva del torneo (próximo viernes 20:00)
   ------------------------------------------------------------ */
function nextFriday() {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  const diff = (5 - d.getDay() + 7) % 7;          // 5 = viernes
  d.setDate(d.getDate() + (diff === 0 && Date.now() > d ? 7 : diff));
  return d;
}
let eventDate = nextFriday();
const pad = n => String(n).padStart(2, '0');

function tickCountdown() {
  let ms = eventDate - Date.now();
  if (ms <= 0) { eventDate = nextFriday(); ms = eventDate - Date.now(); }
  const s = Math.floor(ms / 1000);
  $('#cdD').textContent = pad(Math.floor(s / 86400));
  $('#cdH').textContent = pad(Math.floor(s / 3600) % 24);
  $('#cdM').textContent = pad(Math.floor(s / 60) % 60);
  $('#cdS').textContent = pad(s % 60);
}
tickCountdown();
setInterval(tickCountdown, 1000);

/* ------------------------------------------------------------
   7. Cafetería
   ------------------------------------------------------------ */
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

const menuGrid = $('#menuGrid');
const renderMenu = cat => {
  const list = cat === 'todo' ? MENU : MENU.filter(m => m.c === cat);
  menuGrid.innerHTML = list.map((m, i) => `
    <article class="item" style="animation-delay:${i * 45}ms">
      <div class="item-img">${m.e}</div>
      <div class="item-body">
        <h4>${m.n}</h4>
        <p>${m.d}</p>
        <div class="item-foot">
          <span class="item-price">${money(m.p)}</span>
          <button class="add" type="button" aria-label="Añadir ${m.n} al pedido" data-name="${m.n}">+</button>
        </div>
      </div>
    </article>`).join('');
};

$$('.menu-tabs .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    $$('.menu-tabs .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderMenu(chip.dataset.cat);
  });
});
renderMenu('todo');

let orderCount = 0;
menuGrid.addEventListener('click', e => {
  const btn = e.target.closest('.add');
  if (!btn) return;
  orderCount++;
  toast('Añadido al pedido', `${btn.dataset.name} · ${orderCount} producto${orderCount > 1 ? 's' : ''} en tu bandeja.`);
});

/* ------------------------------------------------------------
   8. Formulario de reserva
   ------------------------------------------------------------ */
const form       = $('#bookingForm');
const hoursInput = $('#fHours');
const hoursLabel = $('#hoursLabel');
const totalPrice = $('#totalPrice');
const totalBreak = $('#totalBreak');
const dateInput  = $('#fDate');

// Fecha mínima = hoy; valor por defecto = hoy
const today = new Date().toISOString().split('T')[0];
dateInput.min = today;
dateInput.value = today;

function updateTotal() {
  const hours = Number(hoursInput.value);
  const rate  = Number(zoneSelect.selectedOptions[0].dataset.rate);
  const extras = $$('.checks input:checked').reduce((s, i) => s + Number(i.value), 0);
  const total = hours * rate + extras;

  hoursLabel.textContent = `${hours} hora${hours > 1 ? 's' : ''}`;
  totalPrice.textContent = money(total);
  totalBreak.textContent = `${hours} h × ${money(rate)}` + (extras ? ` + ${money(extras)} extras` : '');
}

['input', 'change'].forEach(ev => form.addEventListener(ev, updateTotal));
updateTotal();

function setError(field, msg) {
  field.classList.toggle('invalid', Boolean(msg));
  const slot = $('.err', field);
  if (slot) slot.textContent = msg || '';
  return !msg;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#fName');
  const time = $('#fTime');

  let ok = true;
  ok = setError(name.closest('.field'), name.value.trim().length < 3 ? 'Escribe tu nombre completo.' : '') && ok;
  ok = setError(dateInput.closest('.field'), !dateInput.value ? 'Elige una fecha.' : '') && ok;
  ok = setError(time.closest('.field'), !time.value ? 'Elige una hora de inicio.' : '') && ok;

  if (!ok) {
    toastError('Revisa el formulario', 'Faltan datos por completar.');
    return;
  }

  const seat  = seatInput.value || 'la primera libre';
  const zone  = zoneSelect.selectedOptions[0].textContent.split('—')[0].trim();
  const hours = hoursInput.value;

  toast('¡Reserva confirmada!',
        `${name.value.trim()} · ${zone} ${seat} · ${dateInput.value} a las ${time.value} por ${hours} h · ${totalPrice.textContent}`);

  form.reset();
  dateInput.value = today;
  $('#fTime').value = '18:00';
  if (selectedSeat) {
    selectedSeat.classList.remove('selected');
    selectedSeat.classList.add('busy');
    selectedSeat.disabled = true;
    selectedSeat = null;
    selectedSeatLabel.textContent = 'Ninguna';
  }
  updateTotal();
});

/* Newsletter */
$('#newsForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  if (!input.checkValidity()) { toastError('Correo inválido', 'Revisa la dirección e inténtalo otra vez.'); return; }
  toast('¡Suscripción lista!', `Te escribiremos a ${input.value} una vez al mes.`);
  e.target.reset();
});

/* ------------------------------------------------------------
   9. Toast
   ------------------------------------------------------------ */
const toastEl = $('#toast');
let toastTimer;

function showToast(title, msg, ok = true) {
  $('#toastTitle').textContent = title;
  $('#toastMsg').textContent   = msg;
  const icon = $('.toast-icon', toastEl);
  icon.textContent = ok ? '✓' : '!';
  icon.style.background = ok ? 'var(--lime)' : '#ff6b9d';
  toastEl.style.borderColor = ok ? 'rgba(182,255,61,.35)' : 'rgba(255,107,157,.45)';
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4800);
}
const toast      = (t, m) => showToast(t, m, true);
const toastError = (t, m) => showToast(t, m, false);

toastEl.addEventListener('click', () => toastEl.classList.remove('show'));

/* ------------------------------------------------------------
   10. Konami code — modo arcade 🎮
   ------------------------------------------------------------ */
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let buffer = [];
window.addEventListener('keydown', e => {
  buffer.push(e.key);
  buffer = buffer.slice(-KONAMI.length);
  if (buffer.join(',').toLowerCase() === KONAMI.join(',').toLowerCase()) {
    document.body.style.transition = 'filter .6s ease';
    document.body.style.filter = 'hue-rotate(160deg) saturate(1.4)';
    toast('¡Modo arcade activado!', 'Has desbloqueado 1 hora gratis. Enséñale esto al mostrador 😉');
    setTimeout(() => { document.body.style.filter = ''; }, 6000);
  }
});

})();
