// DollarWise — interaktivitas dasar
const navToggle = document.getElementById('navToggle');
const siteMenu = document.getElementById('siteMenu');
const yearSpan = document.getElementById('year');
const form = document.getElementById('newsletterForm');
const formMsg = document.getElementById('formMsg');

// dynamic year
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// mobile nav toggle
if (navToggle && siteMenu){
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    siteMenu.style.display = expanded ? 'none' : 'flex';
  });
}

// simple email validation
function isValidEmail(email){
  return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
}

if (form){
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (form.email?.value || '').trim();
    if (!isValidEmail(email)){
      formMsg.textContent = 'Alamat email tidak valid.';
      formMsg.style.color = '#fca5a5';
      return;
    }
    formMsg.textContent = 'Terima kasih! Kami sudah mengirimkan materi perdana ke email kamu.';
    formMsg.style.color = '#b6f1c9';
    form.reset();
  });
}


// === Canvas Line Chart (vanilla) ===
(function(){
  const canvas = document.getElementById('econChart');
  if (!canvas) return;

  const dpr = Math.max(1, window.devicePixelRatio || 1);

  const data = {
    labels: ['2020','2021','2022','2023','2024','2025'],
    values:  [  2.1 ,  3.7 ,  5.2 ,  4.9 ,  5.1 ,  5.4 ] // dummy persen pertumbuhan
  };

  function getBounds(vals){
    const min = Math.min.apply(null, vals);
    const max = Math.max.apply(null, vals);
    const pad = (max - min) * 0.2 || 1;
    return { min: Math.floor(min - pad), max: Math.ceil(max + pad) };
  }

  function draw(){
    // Resize canvas to element size * DPR for crisp lines
    const rect = canvas.getBoundingClientRect();
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);
    if (canvas.width !== width || canvas.height !== height){
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,width,height);

    // Padding for axes
    const padL = 50 * dpr, padR = 18 * dpr, padT = 18 * dpr, padB = 36 * dpr;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Background grid
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1 * dpr;

    const yTicks = 5;
    for (let i=0;i<=yTicks;i++){
      const y = padT + (plotH * i / yTicks);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();
    }
    ctx.restore();

    // Bounds & scales
    const {min, max} = getBounds(data.values);
    const xStep = plotW / (data.values.length - 1);
    function yScale(v){
      return padT + plotH - ((v - min) / (max - min)) * plotH;
    }

    // Axes labels
    ctx.save();
    ctx.fillStyle = 'rgba(230,237,243,0.9)';
    ctx.font = `${12*dpr}px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.labels.forEach((lbl, i)=>{
      const x = padL + i * xStep;
      ctx.fillText(lbl, x, height - padB + 8*dpr);
    });

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yStep = (max - min) / yTicks;
    for (let i=0;i<=yTicks;i++){
      const val = (min + i*yStep).toFixed(1) + '%';
      const y = padT + (plotH * i / yTicks);
      ctx.fillText(val, padL - 8*dpr, y);
    }
    ctx.restore();

    // Line path
    ctx.save();
    ctx.lineWidth = 2.5 * dpr;
    // gradient stroke (green-ish, no explicit hex setting in CSS context; allowed here for canvas aesthetics)
    const grad = ctx.createLinearGradient(padL, padT, padL, padT + plotH);
    grad.addColorStop(0, '#4ade80');
    grad.addColorStop(1, '#22c55e');
    ctx.strokeStyle = grad;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 14 * dpr;
    ctx.beginPath();
    data.values.forEach((v, i)=>{
      const x = padL + i * xStep;
      const y = yScale(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
    ctx.fillStyle = '#4ade80';
    data.values.forEach((v, i)=>{
      const x = padL + i * xStep;
      const y = yScale(v);
      ctx.beginPath();
      ctx.arc(x, y, 3.5*dpr, 0, Math.PI*2);
      ctx.fill();
    });

    // Tooltip (very lightweight)
    canvas.onmousemove = (e)=>{
      const br = canvas.getBoundingClientRect();
      const mx = (e.clientX - br.left) * dpr;
      const my = (e.clientY - br.top) * dpr;
      let nearest = {i:-1, dist:1e9, x:0, y:0};
      data.values.forEach((v, i)=>{
        const x = padL + i * xStep;
        const y = yScale(v);
        const d = Math.hypot(mx-x, my-y);
        if (d < nearest.dist){ nearest = {i, dist:d, x, y}; }
      });
      // redraw to clear prior tooltip
      draw();
      if (nearest.dist < 12*dpr){
        ctx.save();
        const label = `${data.labels[nearest.i]}: ${data.values[nearest.i]}%`;
        const tw = ctx.measureText(label).width + 12*dpr;
        const th = 22*dpr;
        const tx = Math.min(Math.max(nearest.x - tw/2, padL), width - padR - tw);
        const ty = Math.max(nearest.y - 28*dpr, padT + 4*dpr);
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(tx, ty, tw, th);
        ctx.fillStyle = '#e6edf3';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, tx + 6*dpr, ty + th/2);
        ctx.restore();
      }
    };
  }

  // Initial draw & on resize
  const ro = new ResizeObserver(()=> draw());
  ro.observe(canvas);
  window.addEventListener('orientationchange', draw, {passive:true});
  draw();
})();


// ===== Scroll Reveal (IntersectionObserver) =====
(function(){
  const els = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(el => el.classList.add('reveal-in'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting){
        entry.target.classList.add('reveal-in');
        io.unobserve(entry.target);
      }
    });
  }, {threshold: .12});
  els.forEach(el=> io.observe(el));
})();

// ===== Button ripple =====
(function(){
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
    btn.appendChild(ripple);
    setTimeout(()=> ripple.remove(), 600);
  }, {passive:true});
})();

// ===== Toggle button bar morph =====
if (navToggle){
  navToggle.addEventListener('click', ()=>{
    navToggle.classList.toggle('open');
  });
}



// ===== Circular Ring Gauge (Canvas) =====
(function(){
  const el = document.getElementById('gaugeRing');
  if (!el) return;
  const ctx = el.getContext('2d');
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  function resize(){
    const s = Math.min(220, el.parentElement.clientWidth);
    el.width = Math.floor(s * dpr);
    el.height = Math.floor(s * dpr);
    el.style.width = s + 'px';
    el.style.height = s + 'px';
  }
  function draw(progress){
    const w = el.width, h = el.height;
    const cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 16*dpr;
    ctx.clearRect(0,0,w,h);
    // track
    ctx.lineWidth = 10*dpr;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
    // ring
    const start = -Math.PI/2, end = start + progress*2*Math.PI;
    const grad = ctx.createLinearGradient(cx, cy-r, cx, cy+r);
    grad.addColorStop(0,'#86efac'); grad.addColorStop(1,'#22c55e');
    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 18*dpr;
    ctx.beginPath(); ctx.arc(cx,cy,r,start,end); ctx.stroke();
    // center text
    ctx.shadowBlur = 0; ctx.fillStyle = '#e6edf3';
    ctx.font = `${Math.floor(18*dpr)}px Inter, system-ui`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(progress*100)+'%', cx, cy);
  }
  function animateTo(target=0.78, dur=1200){
    const t0 = performance.now();
    function frame(t){
      const k = Math.min(1, (t - t0)/dur);
      const eased = 1 - Math.pow(1-k, 3);
      draw(eased*target);
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  const ro = new ResizeObserver(()=>{ resize(); draw(.0); animateTo(); });
  ro.observe(el);
})();


// ===== Glassy Modal (reusable) =====
(function(){
  const backdrop = document.getElementById('glassModal');
  if (!backdrop) return;
  const panel = backdrop.querySelector('.modal-panel');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const btnClose = backdrop.querySelector('.modal-close');
  const btnOk = backdrop.querySelector('.modal-ok');
  let lastFocused = null;

  function openGlassModal(t='Info', b='Detail'){
    lastFocused = document.activeElement;
    title.textContent = t;
    body.textContent = b;
    document.body.classList.add('modal-open');
    backdrop.hidden = false;
    requestAnimationFrame(()=>{
      backdrop.classList.add('show');
      panel.focus();
    });
  }
  function closeGlassModal(){
    backdrop.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(()=>{
      backdrop.hidden = true;
      if (lastFocused) lastFocused.focus();
    }, 200);
  }

  // Open from benefit cards
  document.addEventListener('click', (e)=>{
    const card = e.target.closest('.benefit');
    if (!card) return;
    const t = card.getAttribute('data-modal-title') || 'Info';
    const b = card.getAttribute('data-modal-body') || 'Detail';
    openGlassModal(t, b);
  });

  // Close handlers
  btnClose?.addEventListener('click', closeGlassModal);
  btnOk?.addEventListener('click', closeGlassModal);
  backdrop.addEventListener('click', (e)=>{ if (e.target === backdrop) closeGlassModal(); });
  document.addEventListener('keydown', (e)=>{
    if (backdrop.hidden) return;
    if (e.key === 'Escape') closeGlassModal();
    // simple focus trap
    if (e.key === 'Tab'){
      const focusables = panel.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
      const list = Array.from(focusables);
      if (!list.length) return;
      const first = list[0], last = list[list.length-1];
      if (e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
    }
  });
})();


// Defensive: hide modal on DOM ready (prevents accidental blur overlay)
document.addEventListener('DOMContentLoaded', ()=>{
  const mb = document.getElementById('glassModal');
  if (mb){ mb.hidden = true; mb.classList.remove('show'); document.body.classList.remove('modal-open'); }
});


// Ensure old 'ultra' class is removed if cached
document.addEventListener('DOMContentLoaded', ()=>{
  document.documentElement.classList.remove('ultra');
  try{ localStorage.removeItem('ultra'); }catch(e){}
});
