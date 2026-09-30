// The always-on Tel Aviv street: layers from street-bg.js + animated details + crowd, cats, pigeons, scooter.
(function () {
  const S = (SF.street = { cheer: false, dim: 0 });
  let L = null, crowd = [], pigeons = [], cats = [], scoot = null, scootTimer = 3;

  S.build = () => {
    const { W, H } = SF.view;
    S.W = W; S.H = H;
    S.walkTop = H - 44;         // top of sidewalk
    S.ground = H - 16;          // feet line for the family / cabinet
    S.laneTop = S.walkTop + 4;  // crowd lanes (behind the family)
    S.laneBot = S.walkTop + 16;
    L = SF.paintStreet(S);

    crowd = [];
    const n = Math.max(10, Math.round(W / 14));
    for (let i = 0; i < n; i++) crowd.push(newWalker(Math.random() * W));
    pigeons = [];
    for (let i = 0; i < 2; i++) pigeons.push({ x: SF.rand(10, W - 10), y: S.ground + 5 - i, t: Math.random() * 3, fly: false, vy: 0, vx: 0 });
    cats = [
      { spr: SF.cats[0], x: W * 0.12, y: S.walkTop + 3, walk: false, dir: 1, t: 0 },
      { spr: SF.cats[1], x: W * 0.8, y: S.ground + 6, walk: true, dir: -1, t: 0 },
    ];
  };

  function newWalker(x) {
    return {
      x, y: SF.rand(S.laneTop, S.laneBot), dir: Math.random() < 0.5 ? 1 : -1, spd: SF.rand(10, 26),
      spr: SF.makeNPC(), dist: Math.random() * 10, bob: Math.random() * 6,
    };
  }

  S.update = (dt) => {
    for (const w of L.dyn.windows) { w.t -= dt; if (w.t < 0) { w.t = SF.rand(3, 14); if (Math.random() < 0.3) w.on = !w.on; } }
    for (const p of crowd) {
      if (S.cheer) { p.bob += dt * SF.rand(8, 12); continue; }
      p.x += p.dir * p.spd * dt; p.dist += p.spd * dt;
      if (p.x < -12 || p.x > S.W + 12) { const d = p.dir; Object.assign(p, newWalker(d > 0 ? -10 : S.W + 10), { dir: d }); }
    }
    crowd.sort((a, b) => a.y - b.y);
    for (const p of pigeons) {
      p.t += dt;
      if (S.cheer && !p.fly) { p.fly = true; p.vx = SF.rand(-40, 40); p.vy = -SF.rand(30, 50); }
      if (p.fly) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.y < -20 && !S.cheer) { p.fly = false; p.y = S.ground + 5; p.x = SF.rand(10, S.W - 10); } }
    }
    for (const c of cats) {
      c.t += dt;
      if (c.walk && !S.cheer) { c.x += c.dir * 9 * dt; if (c.x < 8 || c.x > S.W - 8) c.dir *= -1; }
    }
    scootTimer -= dt;
    if (!scoot && scootTimer < 0) { const d = Math.random() < 0.5 ? 1 : -1; scoot = { x: d > 0 ? -20 : S.W + 20, d, t: 0 }; }
    if (scoot) { scoot.x += scoot.d * 75 * dt; scoot.t += dt; if (scoot.x < -30 || scoot.x > S.W + 30) { scoot = null; scootTimer = SF.rand(7, 14); } }
  };

  // parallax: each layer zooms by a fraction of the camera zoom
  function withLayer(c, f, fn) {
    const cam = SF.cam, z = 1 + (cam.zoom - 1) * f;
    const cx = S.W / 2 + (cam.cx - S.W / 2) * f, cy = S.H / 2 + (cam.cy - S.H / 2) * f;
    const o = SF.camOffset();
    c.setTransform(z, 0, 0, z, Math.round(S.W / 2 - cx * z + o.x * f), Math.round(S.H / 2 - cy * z + o.y * f));
    fn();
  }
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };

  S.draw = (c) => {
    const t = SF.time, d = L.dyn;
    withLayer(c, 0.1, () => c.drawImage(L.sky, 0, 0));
    withLayer(c, 0.15, () => { const ox = (t * 2) % S.W; c.drawImage(L.clouds, Math.round(ox), 0); c.drawImage(L.clouds, Math.round(ox - S.W), 0); });
    withLayer(c, 0.3, () => {
      c.drawImage(L.far, 0, 0);
      if (Math.floor(t * 1.2) % 2) for (const p of d.lights) R(c, p.x - 1, p.y, 2, 2, "#ff3030");
    });
    withLayer(c, 0.65, () => {
      c.drawImage(L.mid, 0, 0);
      for (const w of d.windows) if (w.h > 0) R(c, w.x, w.y, w.w, w.h, w.on ? "#ffcf70" : "#2a2844");
      for (const f of d.flags) flag(c, f.x, f.y, t + f.t);
      for (const p of d.palms) palm(c, p.x, p.y, t + p.ph);
      if (d.neon) neon(c, d.neon.x, d.neon.y);
    });
    withLayer(c, 0.8, () => { c.drawImage(L.poles, 0, 0); bunting(c, d.bunting, t); });
    SF.applyCam(c);
    c.drawImage(L.walk, 0, 0);
    for (const k of cats) {
      const fr = k.walk && !S.cheer ? k.spr.walk[Math.floor(k.t * 5) % 2] : k.spr.sit[Math.floor(k.t * 0.7) % 2];
      SF.drawSprite(c, fr, k.x, k.y, k.dir < 0);
    }
    for (const p of crowd) {
      let s, y = p.y;
      if (S.cheer) { s = p.spr.cheer; y -= Math.abs(Math.sin(p.bob)) * 3; }
      else s = Math.floor(p.dist / 5) % 2 ? p.spr.a : p.spr.b;
      SF.drawSprite(c, s, p.x, y, p.dir < 0);
    }
    for (const p of pigeons) {
      const fr = p.fly ? SF.pigeonFly[Math.floor(p.t * 10) % 2] : SF.pigeon[Math.floor(p.t * 1.5) % 2];
      SF.drawSprite(c, fr, p.x, p.y, p.vx < 0);
    }
    if (scoot) SF.drawSprite(c, SF.scooter[Math.floor(scoot.t * 5) % 2], scoot.x, S.H - 1, scoot.d < 0);
    if (S.dim > 0) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = "rgba(0,0,0," + S.dim + ")"; c.fillRect(0, 0, S.W, S.H); }
  };

  // Israeli flag on a short balcony pole, waving
  function flag(c, x, y, t) {
    R(c, x, y - 10, 1, 11, "#5a4a3a");
    for (let col = 0; col < 11; col++) {
      const oy = Math.round(Math.sin(t * 4 - col * 0.7) * (col / 10) * 1.5);
      const fx = x + 1 + col, fy = y - 10 + oy;
      R(c, fx, fy, 1, 8, "#f8f8f8");
      R(c, fx, fy + 1, 1, 1, "#1e4ec8"); R(c, fx, fy + 6, 1, 1, "#1e4ec8");
      if (col >= 4 && col <= 6) { R(c, fx, fy + 3, 1, 1, "#1e4ec8"); if (col !== 5) R(c, fx, fy + 4, 1, 1, "#1e4ec8"); else R(c, fx, fy + 2, 1, 1, "#1e4ec8"), R(c, fx, fy + 5, 1, 1, "#1e4ec8"); }
    }
  }

  function palm(c, x, y, t) {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI + (i / (n - 1)) * Math.PI + Math.sin(t * 1.3 + i) * 0.06;
      const len = 16 + (i % 2) * 5;
      for (let s = 0; s <= len; s++) {
        const k = s / len, px = x + Math.cos(a) * s, py = y + Math.sin(a) * s * 0.6 + k * k * 9;
        R(c, px, py, 2, 1, s < len * 0.5 ? "#2e7a3a" : "#3e9a44");
        if (s % 2 === 0 && s > 2) R(c, px, py + 1 + (k > 0.5 ? 1 : 0), 1, 2, "#256a30");
      }
    }
    R(c, x - 1, y, 2, 2, "#6a4020"); R(c, x + 1, y + 1, 2, 2, "#5a3418");
  }

  // blue/white bunting strung between the poles
  function bunting(c, b, t) {
    for (let i = 0; i < b.pxs.length - 1; i++) {
      const a = b.pxs[i] + 1, e = b.pxs[i + 1] + 1;
      for (let x = a + 5, k = 0; x < e - 4; x += 7, k++) {
        const tt = (x - a) / (e - a), y = Math.round(b.y0 + b.sag * 4 * tt * (1 - tt));
        const sw = Math.round(Math.sin(t * 2.2 + x * 0.15) * 1);
        const col = k % 2 ? "#f4f4f4" : "#1e4ec8";
        for (let r = 0; r < 5; r++) R(c, x - 2 + (r >> 1) + (r > 2 ? sw : 0), y + r, 5 - r * 1 - (r >> 1), 1, col);
      }
    }
  }

  function neon(c, x, y) {
    const on = Math.floor(SF.time * 3) % 13 !== 0;
    SF.text(c, "ARCADE", x, y + 1, { size: 8, color: on ? "#ff5ab4" : "#4a1a38", outline: 0, shadow: on ? "#7ff8ff" : null });
  }
})();
