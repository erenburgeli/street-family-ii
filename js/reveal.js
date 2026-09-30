// 4/6. COIN + REVEAL, 5. HERE COMES A NEW CHALLENGER, 7. FINALE.
(function () {
  const C = SF.CONFIG, cab = SF.cab;
  const fx = document.getElementById("crtFx"), fg = fx.getContext("2d");
  const img = document.getElementById("crtImg");

  // ---------- shared helpers
  function camTween(from, to, k) {
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    SF.cam.zoom = SF.lerp(from.zoom, to.zoom, e);
    SF.cam.cx = SF.lerp(from.cx, to.cx, e); SF.cam.cy = SF.lerp(from.cy, to.cy, e);
  }
  const camNow = () => ({ zoom: SF.cam.zoom, cx: SF.cam.cx, cy: SF.cam.cy });
  const camHome = () => ({ zoom: 1, cx: SF.view.W / 2, cy: SF.view.H / 2 });
  const camCrt = (f) => {
    const r = cab.screenRect(), z = cab.zoomFor(), h = camHome();
    const zz = 1 + (z - 1) * (f || 1), lift = (SF.view.H * 0.07) / zz;   // CRT sits a bit low, leaving room for the title
    return { zoom: zz, cx: SF.lerp(h.cx, r.x + r.w / 2, f || 1), cy: SF.lerp(h.cy, r.y + r.h / 2 - lift, f || 1) };
  };

  // mosaic-to-sharp reveal drawn on the fx canvas over the DOM photo; k 0..1
  function mosaic(k) {
    if (k >= 1 && !cab.dom.missing) { fx.style.display = "none"; return; }
    fx.style.display = "block";
    const steps = [3, 5, 8, 12, 18, 26, 38, 56];
    const r = cab.dom.missing ? 48 : steps[Math.min(steps.length - 1, Math.floor(k * steps.length))];
    const rh = Math.round(r * 1.25);
    if (fx.width !== r) { fx.width = r; fx.height = rh; }
    fg.imageSmoothingEnabled = true;
    if (cab.dom.missing) placeholder(r, rh);
    else if (img.complete && img.naturalWidth) fg.drawImage(img, 0, 0, r, rh);
    else { fg.fillStyle = "#000"; fg.fillRect(0, 0, r, rh); }
  }
  function placeholder(w, h) {
    fg.fillStyle = "#1a2a6a"; fg.fillRect(0, 0, w, h);
    fg.fillStyle = "#ffd400"; fg.fillRect(2, 2, w - 4, 1); fg.fillRect(2, h - 3, w - 4, 1); fg.fillRect(2, 2, 1, h - 4); fg.fillRect(w - 3, 2, 1, h - 4);
    fg.font = "8px " + SF.FONT; fg.textAlign = "center"; fg.textBaseline = "top"; fg.fillStyle = "#fff";
    fg.fillText("PHOTO", w / 2, h / 2 - 9); fg.fillText("HERE", w / 2, h / 2 + 1);
  }

  // confetti (screen space)
  const confetti = [];
  function burstConfetti(cols, n) {
    const { W } = SF.view;
    for (let i = 0; i < n; i++) confetti.push({ x: SF.rand(0, W), y: SF.rand(-80, -4), vy: SF.rand(18, 40), sw: SF.rand(0, 6), c: SF.pick(cols), s: SF.rand(0, 6) });
  }
  function drawConfetti(c, dt) {
    const { H } = SF.view;
    for (const p of confetti) {
      p.y += p.vy * dt; p.sw += dt * 3; p.s += dt * 8;
      const w = Math.abs(Math.cos(p.s)) > 0.4 ? 2 : 1;
      c.fillStyle = p.c; c.fillRect(Math.round(p.x + Math.sin(p.sw) * 3), Math.round(p.y), w, 2);
    }
    for (let i = confetti.length - 1; i >= 0; i--) if (confetti[i].y > H + 4) confetti.splice(i, 1);
  }

  function bigText(c, str, y, size, t) {
    const { W } = SF.view;
    const s = SF.fitSize(str, size, W - 12);
    c.fillStyle = "rgba(0,0,0,.55)"; c.fillRect(0, Math.round(y - 5), W, s + 10);
    const pop = t < 0.25 ? SF.easeOutBack(t / 0.25) : 1;
    c.save(); c.translate(W / 2, y + s / 2); c.scale(pop, pop); c.translate(-W / 2, -(y + s / 2));
    SF.text(c, str, W / 2, y, { size: s, color: "#ff3a1a", gradient: "#ffd400", outline: Math.max(2, s / 8) });
    c.restore();
    return s;
  }

  const BLUES = ["#3a8aff", "#7ac0ff", "#1e4ec8", "#ffffff", "#a0e0ff"];
  const PINKS = ["#ff5ab4", "#ff9ad0", "#e0307a", "#ffffff", "#ffc0e0"];

  // ---------- 4/6. COIN + REVEAL (n = 1 boy, 2 girl)
  SF.scenes.coin = {
    enter(n) {
      this.n = n; this.photo = n === 1 ? C.photos.boy : C.photos.girl;
      this.label = n === 1 ? C.texts.boy : C.texts.girl;
      this.cols = n === 1 ? BLUES : PINKS;
      this.step = "drop"; this.from = camNow(); this.clink = false; this.powered = false;
      this.hold = C.revealHoldMs / 1000; this.lastTick = -1; this.canGo = false;
      cab.coinBlink = false; confetti.length = 0; SF.street.cheer = false;
      SF.audio.sfx("blip");
    },
    update(dt) {
      SF.street.update(dt); SF.updateActors(dt);
      const t = this.t;
      if (t >= 0.7 && !this.clink) { this.clink = true; cab.credits = (cab.credits || 0) + 1; SF.audio.sfx("coin"); cab.flash = 0.3; }
      cab.flash = Math.max(0, cab.flash - dt * 2);
      if (t >= 0.9 && t < 2.0) camTween(this.from, camCrt(), (t - 0.9) / 1.1);
      if (t >= 2.0 && !this.powered) { this.powered = true; cab.screen = "static"; SF.audio.sfx("crtOn"); }
      if (t >= 2.35 && cab.screen === "static") { cab.showPhoto(this.photo); cab.dom.open = 0.02; }
      if (cab.dom.on) {
        cab.dom.open = SF.clamp((t - 2.35) / 0.25, 0.02, 1);
        mosaic(SF.clamp((t - 2.6) / 1.0, 0, 1));
      }
      if (t >= 3.7 && !this.won) {
        this.won = true; this.wonT = t; SF.audio.sfx("fanfare"); SF.street.cheer = true;
        burstConfetti(this.cols, 90); SF.actors.forEach((a) => (a.state = "win"));
      }
      if (this.won && t - this.wonT < 3 && Math.random() < dt * 8) burstConfetti(this.cols, 4);
      if (this.won && t - this.wonT >= this.hold) this.canGo = true;
      if (this.won && t - this.wonT >= C.revealAutoMs / 1000) this.onInput();   // auto-advance for non-gamers
    },
    onInput() {
      if (!this.canGo) return;
      SF.actors.forEach((a) => (a.state = "idle"));
      SF.go(this.n === 1 ? "challenger" : "finale");
    },
    draw(c) {
      SF.street.draw(c);
      SF.applyCam(c);
      cab.draw(c, 0);
      SF.drawActors(c);
      // flying coin (world space) from below the view into the slot
      if (this.t < 0.75) {
        const k = this.t / 0.7, s = cab.slot();
        const x = SF.lerp(SF.view.W / 2 + 40, s.x, k), y = SF.lerp(SF.view.H + 10, s.y, k) - Math.sin(k * Math.PI) * 60;
        SF.drawSprite(c, SF.coin[Math.floor(this.t * 14) % 3], x, y + 4);
      }
      cab.syncDom();
      c.setTransform(1, 0, 0, 1, 0, 0);
      const { W, H } = SF.view;
      if (this.clink && this.t < 2.2 && SF.blink(4)) SF.text(c, "CREDIT " + String(cab.credits).padStart(2, "0"), W / 2, 10, { size: 8, color: "#fff" });
      const h = SF.hud;
      drawConfetti(h, 1 / 60);
      if (this.won) {
        const r = cab.screenRect();
        const size = SF.fitSize(this.label, 32, W - 12);
        bigText(h, this.label, Math.round(H / 2 - size / 2), 32, this.t - this.wonT);
        if (this.canGo && SF.blink(2)) {
          const bot = SF.worldToCss(0, r.y + r.h).y / SF.view.scale;
          SF.text(h, "PRESS TO CONTINUE", W / 2, SF.clamp(bot + 10, H * 0.6, H - 16), { size: 8, color: "#ffd400" });
        }
      }
    },
  };

  // ---------- 5. HERE COMES A NEW CHALLENGER!
  SF.scenes.challenger = {
    enter() {
      this.from = camNow(); this.ready = false;
      cab.hidePhoto(); fx.style.display = "none"; cab.screen = "black";
      SF.street.cheer = false; confetti.length = 0;
      SF.audio.sfx("alarm");
    },
    update(dt) {
      SF.street.update(dt); SF.updateActors(dt);
      const t = this.t;
      if (t < 0.7) camTween(this.from, camHome(), t / 0.7);
      SF.street.dim = t < 3.2 ? SF.clamp(t / 0.3, 0, 0.82) : SF.clamp(0.82 - (t - 3.2) * 2, 0, 0.82);
      if (t > 1.5 && !this.alarm2) { this.alarm2 = true; SF.audio.sfx("alarm"); }
      if (t > 1.0 && !this.jumped) { this.jumped = true; SF.actors.forEach((a) => { a.state = "win"; setTimeout(() => (a.state = "idle"), 500); }); }
      if (t > 3.4 && !this.ready) { this.ready = true; this.readyT = t; cab.screen = "count"; cab.coinBlink = true; SF.audio.sfx("crtOn"); }
      if (this.ready) {
        const n = Math.max(0, C.continueSeconds - Math.floor(t - this.readyT));
        if (n !== cab.count) { cab.count = n; SF.audio.sfx("tick"); }
        if (t - this.readyT >= C.continueSeconds + 0.6) SF.go("coin", 2);   // at 0 the game inserts it for you
      }
    },
    onInput() { if (this.ready) SF.go("coin", 2); },
    draw(c) {
      SF.street.draw(c);
      SF.applyCam(c);
      cab.draw(c, 0);
      SF.drawActors(c);
      c.setTransform(1, 0, 0, 1, 0, 0);
      const { W, H } = SF.view, t = this.t;
      if (t > 0.3 && t < 3.4) {
        const flashCol = Math.floor(t * 6) % 2 ? "#ffffff" : "#ff2a2a";
        const words = C.texts.challenger.split(" "), mid = Math.ceil(words.length / 2);
        const lines = W < 360 ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")] : [C.texts.challenger];
        const size = Math.min(...lines.map((l) => SF.fitSize(l, 16, W - 12)));
        const y0 = H * 0.3;
        c.fillStyle = "rgba(160,0,0,.55)"; c.fillRect(0, y0 - 8, W, lines.length * (size + 6) + 12);
        lines.forEach((l, i) => SF.text(c, l, W / 2, y0 + i * (size + 6), { size, color: flashCol, outline: 2 }));
      }
      if (this.ready) {
        const st = t - this.readyT;
        const top = cab.top(), size = SF.fitSize(C.texts.notOver, 24, W - 12);
        const y0 = SF.clamp(top - size - 40, 6, H * 0.25);
        bigText(c, C.texts.notOver, y0, 24, st);
        const words = C.texts.oneMore.split(" "), mid = Math.ceil(words.length / 2);
        const lines = W < 300 ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")] : [C.texts.oneMore];
        const ls = Math.min(...lines.map((l) => SF.fitSize(l, 8, W - 8)));
        const ly = y0 + size + 14 + (lines.length - 1) * (ls + 3) / 2;
        const pulse = Math.floor(SF.time * 3) % 2 ? "#ffd400" : "#ffffff";
        if (st > 0.3) lines.forEach((l, i) => SF.text(c, l, W / 2, ly + i * (ls + 3) - (lines.length - 1) * (ls + 3) / 2, { size: ls, color: pulse }));
      }
    },
  };

  // ---------- 7. FINALE - twins photo, COMING FALL '27, fireworks, victory
  const fw = [];
  function launch() {
    const S = SF.street;
    fw.push({ x: SF.rand(S.W * 0.1, S.W * 0.9), y: S.walkTop, vy: -SF.rand(110, 150), tY: SF.rand(S.H * 0.08, S.walkTop * 0.55), rocket: true, c: SF.pick(["#ff5ab4", "#3a8aff", "#ffd400", "#ffffff", "#7affc0"]) });
  }
  function updateFw(dt) {
    for (const p of fw) {
      if (p.rocket) {
        p.y += p.vy * dt;
        if (p.y <= p.tY) {
          p.dead = true; SF.audio.sfx("firework");
          const n = 28, c2 = SF.pick(["#ff5ab4", "#3a8aff", "#ffffff"]);
          for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, v = SF.rand(35, 55); fw.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: SF.rand(0.9, 1.4), c: i % 2 ? p.c : c2 }); }
        }
      } else { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; p.vx *= 0.985; p.life -= dt; if (p.life <= 0) p.dead = true; }
    }
    for (let i = fw.length - 1; i >= 0; i--) if (fw[i].dead) fw.splice(i, 1);
  }
  function drawFw(c) {
    for (const p of fw) {
      c.fillStyle = p.rocket ? "#fff0b0" : p.c;
      if (!p.rocket && p.life < 0.4 && Math.random() < 0.5) continue;
      c.fillRect(Math.round(p.x), Math.round(p.y), p.rocket ? 1 : 2, p.rocket ? 3 : 2);
    }
  }

  // banner plane (screen space, flies right to left)
  const PLANE = SF.sprite([
    "            bb        ",
    "           bwwb       ",
    "  kkk     bwwwb       ",
    " kwwwwwwwwwwwwwwwwk   ",
    "kwkwkwkwbbbbbbbbbwwwk ",
    " kwwwwwwwwwwwwwwwwwwwk",
    "   wwwwwwwbbbbwwwwwwk ",
    "          bwwb        ",
    "           bb         ",
  ], { k: "#2a2a3a", w: "#f4f6fa", b: "#1e4ec8" });
  function drawPlane(c, x, y, t) {
    const txt = C.texts.banner, bw = txt.length * 8 + 12, bx = x + PLANE.w + 14;
    c.fillStyle = "#555";
    for (let i = 0; i < 14; i++) c.fillRect(Math.round(x + PLANE.w - 1 + i), Math.round(y + 5 + i * 0.1), 1, 1);  // tow rope
    for (let col = 0; col < bw; col += 2) {                    // waving banner
      const oy = Math.round(Math.sin(t * 6 - col * 0.12) * (col / bw) * 3);
      c.fillStyle = "#fff8e0"; c.fillRect(Math.round(bx + col), Math.round(y + oy), 2, 13);
      c.fillStyle = "#d01818"; c.fillRect(Math.round(bx + col), Math.round(y + oy), 2, 1); c.fillRect(Math.round(bx + col), Math.round(y + oy + 12), 2, 1);
    }
    SF.text(c, txt, bx + bw / 2, y + 3 + Math.round(Math.sin(t * 6 - 0.6) * 1.5), { size: 8, color: "#1e4ec8", outline: 0 });
    SF.drawSprite(c, PLANE, x + PLANE.w / 2, y + PLANE.h - 2 + Math.round(Math.sin(t * 2) * 1), true);
    if (Math.floor(t * 4) % 2) { c.fillStyle = "#ff3030"; c.fillRect(Math.round(x + 9), Math.round(y + 7), 1, 1); }
  }

  SF.scenes.finale = {
    enter() {
      this.from = camNow(); fw.length = 0; confetti.length = 0; this.nextFw = 1.4;
      cab.hidePhoto(); fx.style.display = "none"; cab.screen = "static"; cab.coinBlink = false;
      SF.street.dim = 0; SF.street.cheer = false;
      SF.audio.sfx("crtOn");
    },
    update(dt) {
      SF.street.update(dt); SF.updateActors(dt); updateFw(dt);
      const t = this.t;
      if (t < 0.9) camTween(this.from, camHome(), t / 0.9);
      if (t >= 0.6 && !cab.dom.on) { cab.showPhoto(C.photos.twins); cab.dom.open = 0.02; }
      if (cab.dom.on) { cab.dom.open = SF.clamp((t - 0.6) / 0.25, 0.02, 1); mosaic(SF.clamp((t - 0.85) / 0.9, 0, 1)); }
      if (t >= 1.8 && !this.slam) {
        this.slam = true; SF.cam.shake = 4; SF.audio.sfx("fanfare"); SF.street.cheer = true;
        SF.actors.forEach((a, i) => { a.state = "win"; a.t = i * 0.25; });
        burstConfetti(BLUES.concat(PINKS), 120);
      }
      if (this.slam && t > this.nextFw) { launch(); this.nextFw = t + SF.rand(0.35, 0.9); }
      if (t > 6.5) this.thanks = true;
      if (t > 3.0) { const span = SF.view.W + C.texts.banner.length * 8 + 80; this.planeX = SF.view.W + 10 - ((t - 3.0) * 38) % (span + 160); }
    },
    onInput() {
      if (this.thanks) { cab.hidePhoto(); fx.style.display = "none"; SF.street.cheer = false; SF.go("intro"); }
      else launch();
    },
    draw(c) {
      SF.street.draw(c);
      SF.applyCam(c);
      drawFw(c);
      cab.draw(c, 0);
      SF.drawActors(c);
      cab.syncDom();
      c.setTransform(1, 0, 0, 1, 0, 0);
      const { W, H } = SF.view;
      if (this.planeX !== undefined) drawPlane(c, this.planeX, this.planeY || 20, this.t);
      drawConfetti(SF.hud, 1 / 60);
      if (this.slam) {
        // IT'S TWINS! + COMING SPRING '27 stacked in the sky, kept clear of the photo on the CRT
        const r = cab.screenRect(), parts = C.texts.finale.split(" ");
        const oneLine = SF.fitSize(C.texts.finale, 24, W - 12) >= 12 || parts.length < 2;
        const lines = oneLine ? [C.texts.finale] : [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
        const muteW = Math.ceil(60 / SF.view.scale);   // keep clear of the mute button
        let ts = SF.fitSize(C.texts.twins, 32, W - 12 - 2 * muteW), size = Math.min(...lines.map((l) => SF.fitSize(l, 24, W - 12)));
        const blockH = () => ts + 14 + lines.length * (size + 6);
        // prefer the sky above the cabinet; fall back to overlapping the marquee, never the photo
        const limit = blockH() <= cab.top() - 10 ? cab.top() - 4 : r.y - 6;
        while (blockH() > limit - 6 && (ts > 8 || size > 8)) { if (ts >= size && ts > 8) ts -= 2; else size -= 2; }
        const y0 = SF.clamp(limit - blockH(), 6, H * 0.3);
        this.planeY = y0 > 40 ? Math.round(y0 * 0.35) : Math.round(y0 + 2);
        bigText(SF.hud, C.texts.twins, y0, ts, this.t - 1.8);
        const y1 = y0 + ts + 14;
        if (this.t > 2.6) lines.forEach((l, i) => bigText(SF.hud, l, y1 + i * (size + 6), size, this.t - 2.6 - i * 0.12));
      }
      if (this.thanks) {
        const y = H - 30;
        c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(0, y - 6, W, 30);
        SF.text(c, C.texts.thanks, W / 2, y, { size: SF.fitSize(C.texts.thanks, 8, W - 8), color: "#fff" });
        if (SF.blink(2)) SF.text(c, "TAP TO REPLAY", W / 2, y + 12, { size: 8, color: "#ffd400" });
      }
    },
  };
})();
