(() => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const closingRoot = document.querySelector('.closing');
  const closingCanvas = document.getElementById('closing-canvas');
  const closingCtx = closingCanvas?.getContext('2d');
  const closingLabels = [
    document.getElementById('closing-orbit-lig'),
    document.getElementById('closing-orbit-person'),
  ];
  const labels = [
    { element: document.getElementById('orbit-lig'), radius: 1, speed: .52, phase: .35 },
    { element: document.getElementById('orbit-person'), radius: .79, speed: -.38, phase: 2.45 },
  ];

  const TAU = Math.PI * 2;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stars = Array.from({ length: 130 }, (_, i) => ({
    x: (Math.sin(i * 217.43) * 43758.5453) % 1,
    y: (Math.sin(i * 91.71 + 2) * 32713.344) % 1,
    size: i % 11 === 0 ? 1.7 : .65,
    phase: i * 1.93,
  }));
  let width = 0;
  let height = 0;
  let dpr = 1;
  let tick = 0;
  let pointer = { x: .5, y: .5 };
  let drift = { x: 0, y: 0 };
  let closingVisible = false;
  let closingPointer = { x: .5, y: .5 };

  const position = (angle, radius, squeeze = .61) => ({
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius * squeeze,
  });

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (closingCanvas && closingCtx) {
      closingCanvas.width = Math.round(closingCanvas.clientWidth * dpr);
      closingCanvas.height = Math.round(closingCanvas.clientHeight * dpr);
      closingCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawClosing();
    }
    if (reduced.matches) draw();
  }

  function starfield() {
    for (const star of stars) {
      const x = Math.abs(star.x) * width;
      const y = Math.abs(star.y) * height;
      const pulse = .22 + (Math.sin(tick * .47 + star.phase) + 1) * .13;
      ctx.fillStyle = `rgba(200,225,235,${pulse})`;
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, TAU);
      ctx.fill();
    }
  }

  function orbit(radius, squeeze, index) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * squeeze, 0, 0, TAU);
    ctx.strokeStyle = index === 0 ? 'rgba(243,209,145,.40)' : 'rgba(133,199,219,.20)';
    ctx.lineWidth = index === 0 ? 1.35 : .9;
    if (index === 1) ctx.setLineDash([3, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    const orbitAngle = tick * [.52, -.38, .13][index] + [.35, 2.45, 4.6][index];
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * squeeze, 0, orbitAngle - .64, orbitAngle + .35);
    ctx.strokeStyle = index === 0 ? 'rgba(244,208,144,.78)' : 'rgba(133,220,245,.48)';
    ctx.lineWidth = index === 0 ? 2.3 : 1.8;
    ctx.shadowBlur = 16;
    ctx.shadowColor = index === 0 ? '#e9c783' : '#74d9ef';
    ctx.stroke();
    ctx.restore();
  }

  function satellite(radius, squeeze, speed, phase, warm, size) {
    const angle = tick * speed + phase;
    const hue = warm ? '235,201,134' : '129,222,246';
    for (let i = 25; i >= 0; i--) {
      const p = position(angle - i * (speed < 0 ? -.015 : .015), radius, squeeze);
      ctx.beginPath();
      ctx.fillStyle = `rgba(${hue},${(1 - i / 26) * .52})`;
      ctx.arc(p.x, p.y, Math.max(.5, size * (1 - i / 27) * .45), 0, TAU);
      ctx.fill();
    }
    const p = position(angle, radius, squeeze);
    const aura = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 7);
    aura.addColorStop(0, `rgba(${hue},.48)`);
    aura.addColorStop(1, `rgba(${hue},0)`);
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = warm ? '#fff1c5' : '#d0f7ff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(${hue},.23)`;
    ctx.lineWidth = .7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function moveLabels(cx, cy, radius) {
    const rotation = -.29;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    for (const label of labels) {
      if (!label.element) continue;
      const point = position(tick * label.speed + label.phase, radius * label.radius);
      const dx = point.x * cosine - point.y * sine;
      const dy = point.x * sine + point.y * cosine;
      label.element.style.left = `${cx + dx}px`;
      label.element.style.top = `${cy + dy}px`;
      label.element.classList.toggle('is-right', dx > 0);
    }
  }

  function draw() {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    starfield();
    drift.x += ((pointer.x - .5) * 15 - drift.x) * .045;
    drift.y += ((pointer.y - .5) * 10 - drift.y) * .045;

    const mobile = width < 650;
    const x = width * (mobile ? .60 : .735) + drift.x;
    const y = height * (mobile ? .26 : .51) + drift.y;
    const r = Math.min(width * (mobile ? .39 : .31), height * (mobile ? .22 : .46));
    const glow = ctx.createRadialGradient(x, y, r * .08, x, y, r * 1.18);
    glow.addColorStop(0, 'rgba(75,158,182,.17)');
    glow.addColorStop(.52, 'rgba(33,106,142,.095)');
    glow.addColorStop(1, 'rgba(18,74,112,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.2, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-.29);
    for (let i = 0; i < 3; i++) orbit(r * [1, .79, .57][i], .61, i);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.12, r * .67, 0, -1.14, -.83);
    ctx.strokeStyle = 'rgba(204,231,235,.20)';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let i = 0; i < 68; i++) {
      const a = (i / 68) * TAU;
      const p = position(a, r * 1.045, .61);
      const q = position(a, r * (i % 4 === 0 ? 1.085 : 1.066), .61);
      ctx.strokeStyle = i % 4 === 0 ? 'rgba(226,218,184,.47)' : 'rgba(157,195,206,.18)';
      ctx.lineWidth = i % 4 === 0 ? 1.2 : .7;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }

    const sweep = tick * .15;
    for (let i = 0; i < 35; i++) {
      const a = sweep - i * .008;
      const p = position(a, r * .51, .61);
      ctx.strokeStyle = `rgba(133,220,241,${.15 * (1 - i / 35)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    satellite(r, .61, .52, .35, true, mobile ? 3.3 : 5);
    satellite(r * .79, .61, -.38, 2.45, false, mobile ? 2.6 : 3.6);
    satellite(r * .57, .61, .13, 4.6, true, mobile ? 2 : 2.8);
    ctx.restore();
    moveLabels(x, y, r);

    const beam = ctx.createLinearGradient(0, y, width, y);
    beam.addColorStop(0, 'rgba(120,197,212,0)');
    beam.addColorStop(.71, 'rgba(165,215,220,.18)');
    beam.addColorStop(1, 'rgba(120,197,212,0)');
    ctx.fillStyle = beam;
    ctx.fillRect(0, y, width, 1);
  }

  function drawClosing() {
    if (!closingCanvas || !closingCtx) return;
    const w = closingCanvas.clientWidth;
    const h = closingCanvas.clientHeight;
    if (!w || !h) return;
    const c = closingCtx;
    c.clearRect(0, 0, w, h);
    const mobile = w < 650;
    const cx = w * .52 + (closingPointer.x - .5) * 16;
    const cy = h * (mobile ? .52 : .51) + (closingPointer.y - .5) * 12;
    const r = Math.min(w * (mobile ? .39 : .35), h * (mobile ? .36 : .44));
    const tilt = -.22;
    const squash = .59;

    for (const star of stars.slice(0, 84)) {
      const px = Math.abs(star.x) * w;
      const py = Math.abs(star.y) * h;
      c.beginPath();
      c.fillStyle = `rgba(181,218,235,${.12 + (Math.sin(tick * .6 + star.phase) + 1) * .13})`;
      c.arc(px, py, star.size, 0, TAU);
      c.fill();
    }

    const glow = c.createRadialGradient(cx, cy, 0, cx, cy, r * 1.55);
    glow.addColorStop(0, 'rgba(74,149,176,.19)');
    glow.addColorStop(.52, 'rgba(34,95,141,.09)');
    glow.addColorStop(1, 'rgba(34,95,141,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, w, h);

    c.save();
    c.translate(cx, cy);
    c.rotate(tilt);
    [1, .76, 1.15].forEach((scale, i) => {
      c.beginPath();
      c.ellipse(0, 0, r * scale, r * scale * squash, 0, 0, TAU);
      c.strokeStyle = i === 0 ? 'rgba(232,207,159,.40)' : 'rgba(147,209,225,.16)';
      c.lineWidth = i === 0 ? 1.45 : .9;
      if (i === 1) c.setLineDash([3, 8]);
      c.stroke();
      c.setLineDash([]);
    });

    // Both names use the same angular speed and direction, half an orbit apart.
    const sharedAngle = tick * .42 + .35;
    [0, Math.PI].forEach((offset, i) => {
      const angle = sharedAngle + offset;
      const color = i === 0 ? '235,201,134' : '129,222,246';
      for (let j = 22; j >= 0; j--) {
        const p = position(angle - j * .018, r, squash);
        c.beginPath();
        c.fillStyle = `rgba(${color},${(1 - j / 23) * .55})`;
        c.arc(p.x, p.y, Math.max(.7, 3.3 * (1 - j / 25)), 0, TAU);
        c.fill();
      }
      const p = position(angle, r, squash);
      const light = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 32);
      light.addColorStop(0, `rgba(${color},.75)`);
      light.addColorStop(1, `rgba(${color},0)`);
      c.fillStyle = light;
      c.beginPath();
      c.arc(p.x, p.y, 32, 0, TAU);
      c.fill();

      const dx = p.x * Math.cos(tilt) - p.y * Math.sin(tilt);
      const dy = p.x * Math.sin(tilt) + p.y * Math.cos(tilt);
      const label = closingLabels[i];
      if (label) {
        label.style.left = `${cx + dx}px`;
        label.style.top = `${cy + dy}px`;
        label.classList.toggle('is-right', dx > 0);
      }
    });
    c.restore();
  }

  function loop() {
    if (!document.hidden) {
      tick += .016;
      draw();
      if (closingVisible) drawClosing();
    }
    if (!reduced.matches) requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize, { passive: true });
  if (closingRoot && closingCanvas && closingCtx) {
    const observer = new IntersectionObserver((entries) => {
      closingVisible = entries[0].isIntersecting;
      if (closingVisible) drawClosing();
    }, { rootMargin: '120px' });
    observer.observe(closingRoot);
    closingRoot.addEventListener('pointermove', (event) => {
      const bounds = closingRoot.getBoundingClientRect();
      closingPointer = {
        x: (event.clientX - bounds.left) / bounds.width,
        y: (event.clientY - bounds.top) / bounds.height,
      };
      if (reduced.matches) drawClosing();
    }, { passive: true });
    closingRoot.addEventListener('pointerleave', () => {
      closingPointer = { x: .5, y: .5 };
      if (reduced.matches) drawClosing();
    });
  }
  window.addEventListener('pointermove', (event) => {
    pointer = { x: event.clientX / innerWidth, y: event.clientY / innerHeight };
  }, { passive: true });
  reduced.addEventListener?.('change', () => {
    if (reduced.matches) { draw(); drawClosing(); }
    else requestAnimationFrame(loop);
  });
  resize();
  loop();
})();
