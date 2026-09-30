// Paints the static Tel Aviv street layers (sky, clouds, far skyline, Bauhaus row, poles, sidewalk).
// Returns canvases + positions of animated bits (windows, flags, palms, bunting, neon, tower lights).
(function () {
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const rnd = SF.rand, pick = SF.pick;

  // Pixel-crisp text (thresholded alpha) — used for the Hebrew shop signs
  SF.crispText = (g, str, x, y, size, col) => {
    const t = mk(str.length * size + 10, size + 6), tg = t.getContext("2d");
    tg.font = "bold " + size + "px Arial, 'Noto Sans Hebrew', sans-serif"; tg.textBaseline = "top";
    tg.fillStyle = col; tg.fillText(str, 2, 1);
    const w = Math.ceil(tg.measureText(str).width);
    const d = tg.getImageData(0, 0, t.width, t.height), p = d.data;
    for (let i = 3; i < p.length; i += 4) p[i] = p[i] > 70 ? 255 : 0;
    tg.putImageData(d, 0, 0);
    g.drawImage(t, Math.round(x - w / 2) - 2, Math.round(y) - 1);
  };

  SF.paintStreet = (S) => {
    const { W, H, walkTop } = S;
    const dyn = { windows: [], flags: [], palms: [], lights: [], neon: null, bunting: null };
    let g;

    // ---------- sky: dithered dusk bands + low sun
    const sky = mk(W, H); g = sky.getContext("2d");
    const bands = ["#241a4e", "#35205e", "#4c2a70", "#6e3478", "#94407c", "#c0507a", "#e46c72", "#f79870", "#fcc47e"];
    const top = walkTop - 10;
    for (let y = 0; y < top; y++) {
      const f = Math.pow(y / top, 0.75) * (bands.length - 1), i = Math.floor(f), fr = f - i;
      for (let x = 0; x < W; x += 1) {
        g.fillStyle = bands[Math.min(bands.length - 1, fr > ((x + y) % 2 ? 0.7 : 0.3) ? i + 1 : i)];
        g.fillRect(x, y, 1, 1);
      }
    }
    g.fillStyle = bands[8]; g.fillRect(0, top, W, H - top);
    const sx = Math.round(W * 0.24), sy = walkTop - 70;
    for (let y = -16; y <= 16; y++) {
      const hw = Math.round(Math.sqrt(256 - y * y));
      if (y > 2 && y % 4 === 0) continue;
      g.fillStyle = y < -6 ? "#fff6d0" : "#ffe08a"; g.fillRect(sx - hw, sy + y, hw * 2, 1);
    }

    // ---------- clouds (separate layer so they can drift)
    const clouds = mk(W, H); g = clouds.getContext("2d");
    const ncl = Math.max(4, Math.round(W / 70));
    for (let k = 0; k < ncl; k++) {
      const cw = rnd(40, 90), x = rnd(-20, W), y = rnd(walkTop * 0.12, walkTop * 0.6);
      const rows = [[0.3, 0.35, "#ffd0c0"], [0.1, 0.75, "#ffb0a8"], [0, 1, "#e07e98"], [0.08, 0.86, "#a85a8c"], [0.3, 0.5, "#7a4280"]];
      rows.forEach(([o, w, c], r) => { g.fillStyle = c; g.fillRect(Math.round(x + cw * o), Math.round(y + r * 2), Math.round(cw * w), 2); });
      g.fillStyle = "#c86a90"; g.fillRect(Math.round(x - cw * 0.4), Math.round(y + 11), Math.round(cw * 1.6), 1);
    }

    // ---------- far skyline + Azrieli towers
    const far = mk(W, H); g = far.getContext("2d");
    const hMax = Math.min(190, walkTop * 0.66);
    const ax = Math.round(W * 0.64);
    let x = -6;
    while (x < W) {
      const bw = rnd(14, 30) | 0, bh = rnd(hMax * 0.25, hMax * 0.55);
      if (x + bw < ax - 4 || x > ax + 64) {
        g.fillStyle = "#7a4a86"; g.fillRect(x, walkTop - bh, bw, bh);
        g.fillStyle = "#6a3e7a"; g.fillRect(x + bw - 2, walkTop - bh, 2, bh);
        g.fillStyle = "#ffcf7a";
        for (let i = 0; i < bw * bh / 60; i++) g.fillRect(x + 2 + ((rnd(0, bw - 4)) | 0), (walkTop - bh + 3 + rnd(0, bh - 20)) | 0, 1, 1);
      }
      x += bw + (rnd(1, 5) | 0);
    }
    const tower = (tx, tw, th, roof) => {
      const ty = walkTop - th;
      g.fillStyle = "#5c4a7e"; g.fillRect(tx, ty, tw, th);
      g.fillStyle = "#806ea4"; g.fillRect(tx, ty, 3, th);
      g.fillStyle = "#4a3a68"; g.fillRect(tx + tw - 3, ty, 3, th);
      g.fillStyle = "#4e3e6e"; for (let y = ty + 4; y < walkTop; y += 3) g.fillRect(tx + 3, y, tw - 6, 1);
      g.fillStyle = "#ffd08a"; for (let i = 0; i < th / 5; i++) g.fillRect(tx + 3 + ((rnd(0, tw - 6)) | 0), (ty + 4 + rnd(0, th - 10)) | 0, 1, 1);
      g.fillStyle = "#5c4a7e";
      if (roof === "round") { g.fillRect(tx + 2, ty - 2, tw - 4, 2); g.fillRect(tx + 5, ty - 3, tw - 10, 1); g.fillRect(tx + (tw >> 1), ty - 14, 1, 11); dyn.lights.push({ x: tx + (tw >> 1), y: ty - 15 }); }
      if (roof === "tri") { for (let i = 0; i < tw; i++) g.fillRect(tx + i, ty - Math.round(i * 0.7), 1, Math.round(i * 0.7) + 1); dyn.lights.push({ x: tx + tw - 1, y: ty - Math.round(tw * 0.7) - 2 }); }
      if (roof === "sq") { g.fillRect(tx + 3, ty - 4, tw - 6, 4); dyn.lights.push({ x: tx + (tw >> 1), y: ty - 6 }); }
    };
    tower(ax, 20, hMax, "round");
    tower(ax + 25, 18, hMax * 0.88, "tri");
    tower(ax + 48, 17, hMax * 0.8, "sq");

    // ---------- mid: Bauhaus row with shops
    const mid = mk(W, H); g = mid.getContext("2d");
    const GF = 32, FH = 22;
    const storeys = SF.clamp(Math.round((walkTop * 0.5 - GF) / FH), 2, 6);
    const shopTypes = ["kiosk", "falafel", "makolet", "arcade", "hummus", "falafel", "makolet"];
    x = -rnd(4, 20) | 0;
    let bi = 0;
    while (x < W) {
      const bw = (rnd(66, 100) | 0), st = SF.clamp(storeys - [0, 2, 1, 0, 3, 1][bi % 6] + (bi % 5 === 0 ? 1 : 0), 1, 7);
      bauhaus(g, x, bw, st, bi, S, GF, FH, dyn);
      shop(g, x + 2, bw - 4, walkTop - GF, GF, shopTypes[bi % shopTypes.length], dyn);
      x += bw + (bi % 2 ? (rnd(6, 14) | 0) : 0); bi++;
    }
    // palms (trunks static, fronds animated)
    const np = Math.max(2, Math.round(W / 150));
    for (let k = 0; k < np; k++) {
      const px = Math.round((k + 0.5) * W / np + rnd(-20, 20)), ph = Math.round(Math.min(walkTop * 0.55, rnd(70, 100)));
      for (let y = 0; y < ph; y++) {
        const ox = Math.round(Math.sin(y / ph * 1.6) * 4);
        g.fillStyle = (y >> 2) % 2 ? "#7a5a3a" : "#5e4228"; g.fillRect(px + ox, walkTop + 2 - y, 3, 1);
      }
      dyn.palms.push({ x: px + Math.round(Math.sin(1.6) * 4) + 1, y: walkTop + 2 - ph, ph: rnd(0, 6) });
    }

    // ---------- poles + wires (bunting is animated)
    const poles = mk(W, H); g = poles.getContext("2d");
    const pTop = Math.max(10, walkTop - 118), pxs = [];
    for (let px = Math.round(W * 0.1); px < W + 60; px += 190) pxs.push(px);
    pxs.unshift(pxs[0] - 190);
    for (const px of pxs) {
      g.fillStyle = "#2e2230"; g.fillRect(px, pTop, 3, walkTop + 4 - pTop);
      g.fillRect(px - 8, pTop + 6, 19, 2); g.fillRect(px - 5, pTop + 12, 13, 2);
      g.fillStyle = "#6a6a70"; g.fillRect(px - 7, pTop + 4, 2, 2); g.fillRect(px + 8, pTop + 4, 2, 2);
      g.fillStyle = "#3a3a44"; g.fillRect(px + 3, pTop + 20, 5, 7);                  // transformer box
    }
    g.fillStyle = "#1c1424";
    for (let i = 0; i < pxs.length - 1; i++) {
      [[pTop + 6, 14], [pTop + 12, 10], [pTop + 7, 20]].forEach(([y0, sag]) => {
        const a = pxs[i], b = pxs[i + 1];
        for (let xx = a; xx <= b; xx++) { const t = (xx - a) / (b - a); g.fillRect(xx, Math.round(y0 + sag * 4 * t * (1 - t)), 1, 1); }
      });
    }
    dyn.bunting = { pxs, y0: pTop + 8, sag: 26 };

    // ---------- sidewalk, painted curb, road
    const walk = mk(W, H); g = walk.getContext("2d");
    g.fillStyle = "#a49ca6"; g.fillRect(0, walkTop, W, H - walkTop);
    g.fillStyle = "#b8b0ba"; g.fillRect(0, walkTop, W, 2);
    g.fillStyle = "#8e8692";
    for (let y = walkTop + 3, r = 0; y < H - 10; y += 5, r++) {
      g.fillRect(0, y, W, 1);
      for (let xx = (r % 2) * 5; xx < W; xx += 10) g.fillRect(xx, y - 4, 1, 4);
    }
    for (let xx = 0; xx < W; xx += 6) {
      const blue = xx > W * 0.66, alt = (xx / 6) % 2;
      g.fillStyle = alt ? "#f2f2f2" : blue ? "#2a5ad0" : "#d8282e";
      g.fillRect(xx, H - 10, 6, 3);
    }
    g.fillStyle = "#2e2a36"; g.fillRect(0, H - 7, W, 7);
    g.fillStyle = "#e8e8e8"; for (let xx = 4; xx < W; xx += 20) g.fillRect(xx, H - 3, 10, 1);

    return { sky, clouds, far, mid, poles, walk, dyn };
  };

  function bauhaus(g, x, bw, st, bi, S, GF, FH, dyn) {
    const top = S.walkTop - GF - st * FH;
    const cols = [["#f2ece0", "#d4ccbc"], ["#efe2cf", "#d0c0a8"], ["#f4dcd2", "#d6b8ae"], ["#e6e2d6", "#c4c0b4"], ["#f3e8c6", "#d4c8a0"]];
    const [col, sh] = cols[bi % cols.length];
    const roundR = bi % 2 === 0;
    const R = (xx, yy, w, h, c) => { g.fillStyle = c; g.fillRect(xx | 0, yy | 0, w | 0, h | 0); };
    R(x, top, bw, S.walkTop - top, col);
    R(x + bw - 3, top, 3, S.walkTop - top, sh);
    // roof: parapet + solar water heaters (dud shemesh)
    R(x, top - 2, bw, 2, sh);
    for (let k = 0, n = Math.max(1, Math.floor((bw - 10) / 20)); k < n; k++) {
      const sx = x + 6 + k * 20;
      R(sx, top - 12, 12, 4, "#e8e6e2"); R(sx, top - 9, 12, 1, "#a8a6a4");            // tank
      for (let i = 0; i < 6; i++) R(sx + 1 + i, top - 7 + (i >> 1), 12 - i, 1, i % 2 ? "#2a3a6a" : "#3e56a0"); // panel
      R(sx + 1, top - 8, 1, 6, "#555"); R(sx + 11, top - 8, 1, 6, "#555");
    }
    if (bi % 3 === 1) { R(x + bw - 16, top - 9, 8, 7, "#2a2a2e"); R(x + bw - 15, top - 10, 6, 1, "#2a2a2e"); } // black water tank
    const stair = bi % 3 === 0;
    const sxw = x + (bw >> 1) - 4;
    for (let f = 0; f < st; f++) {
      const fy = top + f * FH;
      R(x + 4, fy + 3, bw - 8, 12, "#3c3a56");                                        // balcony recess
      for (let wx = x + 5; wx < x + bw - 8; wx += 13) {
        const ww = Math.min(11, x + bw - 5 - wx), down = (rnd(0.2, 0.9) * 10) | 0;
        R(wx, fy + 4, ww, down, "#c4beb0");                                            // trisim shutter
        for (let yy = fy + 5; yy < fy + 4 + down; yy += 2) R(wx, yy, ww, 1, "#a09a8e");
        dyn.windows.push({ x: wx, y: fy + 4 + down, w: ww, h: Math.max(0, 10 - down), on: Math.random() < 0.5, t: rnd(0, 8) });
      }
      R(x, fy + 12, bw, 8, col);                                                       // railing wall
      R(x, fy + 12, bw, 1, "#fffaf0");
      R(x, fy + 20, bw, 1, "#ffffff"); R(x, fy + 21, bw, 1, sh);                         // slab + shadow
      const caps = [1, 2, 3, 3, 3, 3, 3, 3, 2, 1];                                      // rounded balcony end
      caps.forEach((e, r) => R(roundR ? x + bw : x - e, fy + 12 + r, e, 1, r < 1 ? "#fffaf0" : col));
      if (Math.random() < 0.5) { const ax = x + 8 + rnd(0, bw - 24); R(ax, fy + 14, 7, 5, "#eeeeee"); R(ax + 1, fy + 15, 5, 1, "#9a9a9a"); R(ax + 1, fy + 17, 5, 1, "#9a9a9a"); }
      if (Math.random() < 0.3) dyn.flags.push({ x: Math.round(x + 10 + rnd(0, bw - 30)), y: fy + 13, t: rnd(0, 6) });
      if (Math.random() < 0.35) { const px = x + 6 + rnd(0, bw - 16); R(px, fy + 9, 6, 3, "#b0603a"); R(px + 1, fy + 6, 4, 3, "#4a9a4a"); } // plant pot
    }
    if (stair) {                                                                       // "thermometer" stairwell window
      R(sxw - 2, top + 2, 12, st * FH - 2, col);
      R(sxw + 1, top + 4, 6, st * FH - 6, "#6a8ab8");
      for (let yy = top + 6; yy < top + st * FH - 2; yy += 3) R(sxw + 1, yy, 6, 1, "#e8eef8");
      R(sxw + 1, top + 4, 1, st * FH - 6, "#aac4e8");
    }
    if (bi % 4 === 1) {                                                                // bougainvillea cascade
      const bx = roundR ? x + 2 : x + bw - 16, span = st * FH * 0.8;
      for (let i = 0; i < span * 3; i++) {
        const yy = top + Math.pow(Math.random(), 1.6) * span, xx = bx + rnd(0, 14) + Math.sin(yy / 6) * 2;
        R(xx, yy, 2, 2, Math.random() < 0.25 ? "#3a7a3a" : pick(["#e0408a", "#ff70b0", "#b0206a", "#f050a0"]));
      }
    }
  }

  function shop(g, x, w, y, h, type, dyn) {
    const R = (xx, yy, ww, hh, c) => { g.fillStyle = c; g.fillRect(xx | 0, yy | 0, ww | 0, hh | 0); };
    const signs = {
      falafel: ["#ffd84a", "#c81e1e", "פלאפל"], makolet: ["#2e8a4a", "#ffffff", "מכולת"],
      kiosk: ["#2a5ab8", "#ffffff", "קיוסק"], hummus: ["#f2efe4", "#8a4a1a", "חומוס"], arcade: ["#1a1020", "#1a1020", ""],
    };
    const [bg, fg, txt] = signs[type];
    R(x, y, w, 13, "#3a2e2a"); R(x + 1, y + 1, w - 2, 11, bg);
    if (txt) SF.crispText(g, txt, x + w / 2, y + 1, 11, fg);
    const gy = y + 14, gh = h - 14;
    for (let i = 0; i < 3; i++) R(x + 2, gy + i * 2, w - 4, 1, "#8a8690");              // rolled-up shutter
    const iy = gy + 5, ih = gh - 5, iw = w - 18;
    if (type === "falafel" || type === "hummus") {
      R(x + 3, iy, iw, ih, "#4a2e22");
      for (let bx = x + 6; bx < x + iw - 2; bx += 8) R(bx, iy + 2, 2, 2, "#ffe890");     // hanging bulbs
      R(x + 3, iy + ih - 9, iw, 3, "#d0d0d8"); R(x + 3, iy + ih - 6, iw, 6, "#a8a8b0");   // steel counter
      const bowls = ["#4aa040", "#d04030", "#e8c040", "#e08030", "#f0e8d0", "#7a3a8a"];
      for (let bx = x + 5, k = 0; bx < x + iw - 3; bx += 5, k++) R(bx, iy + ih - 11, 4, 2, bowls[k % bowls.length]);
      if (type === "falafel") { R(x + iw - 8, iy + 4, 4, ih - 14, "#b0602a"); R(x + iw - 7, iy + 3, 2, 1, "#ccc"); } // shawarma spit
    } else if (type === "arcade") {
      R(x + 3, iy, iw, ih, "#140c22");
      for (let bx = x + 6; bx < x + iw - 6; bx += 10) { R(bx, iy + 3, 7, 10, "#2a1a4a"); R(bx + 1, iy + 4, 5, 4, pick(["#40e0ff", "#ff50b0", "#80ff60"])); }
      dyn.neon = { x: Math.round(x + w / 2), y: y + 2 };
    } else {
      R(x + 3, iy, iw, ih, "#3a5a6a");
      R(x + 5, iy + 2, 2, ih - 4, "#7aaabb"); R(x + 9, iy + 2, 1, ih - 4, "#7aaabb");
      for (let sy = iy + 4; sy < iy + ih - 2; sy += 5) for (let sx = x + 12; sx < x + iw - 1; sx += 3) R(sx, sy, 2, 2, pick(["#e04040", "#40a0e0", "#f0d040", "#60c060", "#f0f0f0"]));
      if (type === "makolet") {                                                          // fruit crates outside
        for (let k = 0; k < 2; k++) { const cx = x + 4 + k * 12; R(cx, y + h - 6, 10, 6, "#8a5a2a"); R(cx, y + h - 4, 10, 1, "#6a4020");
          for (let i = 0; i < 4; i++) R(cx + 1 + i * 2, y + h - 8, 2, 2, k ? "#ff8a1a" : "#3a9a3a"); }
      }
    }
    R(x + w - 14, gy + 2, 11, gh - 2, "#2a1c16"); R(x + w - 12, gy + 4, 7, gh - 8, "#5a7a88"); R(x + w - 5, gy + gh / 2, 1, 2, "#ffd400"); // door
  }
})();
