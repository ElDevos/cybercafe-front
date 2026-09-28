/* ============================================================
   NEXUS Cybercafé — interacciones
   Los datos (tarifas, menú, estaciones) vienen de la API de Node.js.
   ============================================================ */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const money = n => '$' + n.toFixed(2);

async function api(path, body) {
  const res = await fetch(path, body === undefined ? {} : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error('API ' + res.status), { status: res.status, data });
  return data;
}

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
  const next = Math.max(0, now + (Math.random() < 0.5 ? -1 : 1));
  liveCount.textContent = next;
}, 4500);

/* ------------------------------------------------------------
   4. Tarifas
   ------------------------------------------------------------ */
let PLANS = { hora: [], pase: [] };

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

movePill($('.toggle-btn.active'));
api('/api/plans')
  .then(data => { PLANS = data; renderPlans($('.toggle-btn.active').dataset.plan); })
  .catch(() => toastError('Sin conexión', 'No se pudieron cargar las tarifas.'));
window.addEventListener('resize', () => movePill($('.toggle-btn.active')));

/* ------------------------------------------------------------
   5. Mapa de estaciones
   ------------------------------------------------------------ */
const SEAT_HOSTS = { A: '#seatsA', V: '#seatsB', C: '#seatsC' };

const selectedSeatLabel = $('#selectedSeat');
const seatInput         = $('#fSeat');
const zoneSelect        = $('#fZone');
let selectedSeat = null;

function renderSeats(seats) {
  Object.values(SEAT_HOSTS).forEach(sel => { $(sel).innerHTML = ''; });
  selectedSeat = null;
  selectedSeatLabel.textContent = 'Ninguna';
  seatInput.value = '';
  seats.forEach(({ id, zone, busy }) => {
    const vip = zone === 'vip';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `seat${vip ? ' vip' : ''}${busy ? ' busy' : ''}`;
    b.textContent = id;
    b.dataset.zone = zone;
    b.disabled = busy;
    b.setAttribute('aria-label', `Estación ${id} — ${busy ? 'ocupada' : 'libre'}`);
    if (!busy) b.addEventListener('click', () => selectSeat(b, id, zone));
    $(SEAT_HOSTS[id[0]]).appendChild(b);
  });
}

const loadSeats = () => api('/api/seats').then(({ seats, free }) => {
  renderSeats(seats);
  liveCount.textContent = free;
});
loadSeats().catch(() => toastError('Sin conexión', 'No se pudo cargar el mapa de estaciones.'));

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
let MENU = [];

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
api('/api/menu')
  .then(data => { MENU = data; renderMenu($('.menu-tabs .chip.active')?.dataset.cat || 'todo'); })
  .catch(() => toastError('Sin conexión', 'No se pudo cargar el menú.'));

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
  const extras = $$('.checks input:checked').reduce((s, i) => s + Number(i.dataset.price), 0);
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

form.addEventListener('submit', async e => {
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

  const submitBtn = $('button[type="submit"]', form);
  submitBtn.disabled = true;
  let r;
  try {
    r = await api('/api/reservations', {
      nombre:   name.value.trim(),
      fecha:    dateInput.value,
      hora:     time.value,
      zona:     zoneSelect.value,
      estacion: seatInput.value || null,
      horas:    Number(hoursInput.value),
      extras:   $$('.checks input:checked').map(i => i.value)
    });
  } catch (err) {
    const errors = err.data?.errors;
    if (errors?.nombre) setError(name.closest('.field'), errors.nombre);
    if (errors?.fecha)  setError(dateInput.closest('.field'), errors.fecha);
    if (errors?.hora)   setError(time.closest('.field'), errors.hora);
    toastError('No se pudo reservar',
      errors ? Object.values(errors).join(' ') : 'El servidor no responde. Inténtalo de nuevo.');
    if (err.status === 409) loadSeats().catch(() => {});
    return;
  } finally {
    submitBtn.disabled = false;
  }

  toast('¡Reserva confirmada!',
        `#${r.id} · ${r.nombre} · ${r.zonaLabel} ${r.estacion || 'la primera libre'} · ${r.fecha} a las ${r.hora} por ${r.horas} h · ${money(r.total)}`);

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
$('#newsForm').addEventListener('submit', async e => {
  e.preventDefault();
  const newsForm = e.target;
  const input = newsForm.querySelector('input');
  if (!input.checkValidity()) { toastError('Correo inválido', 'Revisa la dirección e inténtalo otra vez.'); return; }
  try {
    const { email } = await api('/api/newsletter', { email: input.value });
    toast('¡Suscripción lista!', `Te escribiremos a ${email} una vez al mes.`);
    newsForm.reset();
  } catch (err) {
    toastError('No se pudo suscribir', err.data?.errors?.email || 'El servidor no responde. Inténtalo de nuevo.');
  }
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
