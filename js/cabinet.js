// Arcade cabinet: static art, animated marquee/CRT/coin door, DOM photo layer on the CRT,
// plus scene 3 (CABINET ARRIVES).
(function () {
  const C = SF.CONFIG;
  // Size follows the view: tall enough to tower over the family, CRT as big as fits (4:5 vertical monitor)
  let W = 84, H = 160, SCR = { x: 18, y: 32, w: 48, h: 60 }, M = {};
  const cab = (SF.cab = { w: W, h: H, x: 0, y: 0, screen: "off", coinBlink: false, flash: 0 });
  let art = null;

  function layout() {
    const { W: vw, H: vh } = SF.view;
    // total height = 32 (hood+marquee+bezel top) + scrH + 6 + 18 (panel) + 52 (lower body)
    const byH = Math.floor(((Math.min(vh - 16, 300) * 0.86 - 108) / 1.25) + 36);
    W = Math.max(84, Math.min(Math.round(vw * 0.62), byH, 170)) & ~1;
    SCR = { x: 18, y: 32, w: W - 36, h: Math.round((W - 36) * 1.25) };
    M.cp = SCR.y + SCR.h + 6;          // control panel top
    M.low = M.cp + 18;                 // lower body top
    H = M.low + 52;
    M.door = { x: (W >> 1) - 15, y: M.low + 10 };
    cab.w = W; cab.h = H;
  }

  function paint() {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    // side panels with flame side-art
    R(0, 0, W, H, "#241640");
    for (let y = 0; y < H; y++) {
      const f = Math.sin(y * 0.18) * 2;
      R(0, y, 5 + f, 1, y % 20 < 10 ? "#e04020" : "#ff9a20");
      R(W - 5 - f, y, 5 + f, 1, y % 20 < 10 ? "#e04020" : "#ff9a20");
    }
    R(6, 0, W - 12, H, "#1a1030"); R(6, 0, 2, H, "#2e2050"); R(W - 8, 0, 2, H, "#120a22");
    // hood + marquee frame
    R(3, 0, W - 6, 3, "#3a2a60"); R(5, 3, W - 10, 23, "#0a0612");
    // bezel
    R(9, 27, W - 18, M.cp - 28, "#0c0c10"); R(10, 28, W - 20, M.cp - 30, "#20202a");
    R(SCR.x - 3, SCR.y - 3, SCR.w + 6, SCR.h + 6, "#050505");
    R(11, 29, 2, M.cp - 32, "#34344a");                                                 // bezel highlight
    // control panel (slanted)
    for (let i = 0; i < 18; i++) R(6 - (i >> 2), M.cp + i, W - 12 + (i >> 1), 1, i < 2 ? "#6a58a0" : i < 12 ? "#3a2c6a" : "#2a1e50");
    const jx = Math.round(W * 0.22);
    R(jx + 2, M.cp + 6, 4, 6, "#222"); R(jx, M.cp + 2, 8, 6, "#e02828"); R(jx + 1, M.cp + 2, 3, 2, "#ff9090");  // joystick
    const btn = ["#3aa0ff", "#3aa0ff", "#3aa0ff", "#ff4040", "#ff4040", "#ff4040"];
    const bx0 = Math.round(W * 0.46);
    btn.forEach((col, i) => { const bx = bx0 + (i % 3) * 9, by = M.cp + 3 + ((i / 3) | 0) * 6 - (i % 3); R(bx, by, 6, 4, "#111"); R(bx, by, 6, 3, col); R(bx + 1, by, 3, 1, "#fff"); });
    // lower body + coin door
    R(8, M.low, W - 16, H - M.low, "#160c2a");
    for (let y = M.low + 4; y < H - 6; y += 3) { R(12, y, 8, 1, "#241640"); R(W - 20, y, 8, 1, "#241640"); }  // speaker slots
    const d = M.door;
    R(d.x - 1, d.y - 1, 32, 28, "#6a6a80"); R(d.x, d.y, 30, 26, "#9a9ab0"); R(d.x, d.y, 30, 1, "#d0d0e0");
    R(d.x + 3, d.y + 3, 9, 8, "#303040"); R(d.x + 17, d.y + 3, 9, 8, "#303040");        // slot plates
    R(d.x + 5, d.y + 15, 5, 5, "#303040"); R(d.x + 19, d.y + 15, 5, 5, "#303040");      // coin returns
    R(10, H - 4, W - 20, 4, "#0a0612");
    return c;
  }

  cab.build = () => { layout(); art = paint(); };
  cab.place = () => { const S = SF.street; cab.x = Math.round(S.W / 2); cab.y = S.ground + 2; };
  cab.left = () => cab.x - W / 2;
  cab.top = () => cab.y - H;
  cab.screenRect = () => ({ x: cab.left() + SCR.x, y: cab.top() + SCR.y, w: SCR.w, h: SCR.h });
  cab.slot = () => ({ x: cab.left() + M.door.x + 7, y: cab.top() + M.door.y + 6 });

  // camera zoom that makes the CRT fill most of the screen
  cab.zoomFor = () => {
    const { W: vw, H: vh } = SF.view;
    return Math.min((vw * 0.92) / SCR.w, (vh * 0.74) / SCR.h);
  };

  cab.draw = (c, yOff) => {
    const x = cab.left(), y = cab.top() + (yOff || 0);
    // glow on the pavement
    c.fillStyle = "rgba(120,200,255,.12)"; c.fillRect(x - 10, cab.y - 3, W + 20, 4);
    c.drawImage(art, x, y);
    // marquee (lit) with the title wrapped onto 2 lines
    const mg = SF.blink(0.5) ? "#ffe9a0" : "#fff0b8";
    c.fillStyle = mg; c.fillRect(x + 6, y + 4, W - 12, 21);
    c.fillStyle = "#ffb040"; c.fillRect(x + 6, y + 20, W - 12, 5);
    const lines = wrap(C.title, Math.floor((W - 14) / 8));
    lines.forEach((ln, i) => SF.text(c, ln, x + W / 2, y + 5 + i * 9 + (lines.length === 1 ? 4 : 0), { size: 8, color: "#d01818", outline: 1, outlineColor: "#3a0808" }));
    // CRT
    const s = { x: x + SCR.x, y: y + SCR.y, w: SCR.w, h: SCR.h };
    drawScreen(c, s);
    // coin slot lights
    const on = cab.coinBlink ? SF.blink(3) : true, d = M.door;
    c.fillStyle = on ? "#ff7a1a" : "#5a2a10";
    c.fillRect(x + d.x + 6, y + d.y + 4, 3, 5); c.fillRect(x + d.x + 20, y + d.y + 4, 3, 5);
    if (cab.coinBlink && on) { c.fillStyle = "rgba(255,140,40,.35)"; c.fillRect(x + d.x + 1, y + d.y + 1, 28, 12); }
    if (cab.flash > 0) { c.fillStyle = "rgba(255,255,255," + cab.flash + ")"; c.fillRect(x, y, W, H); }
  };

  // one line if it fits, else split at the space nearest the middle
  function wrap(str, max) {
    if (str.length <= Math.min(max, 9) || str.indexOf(' ') < 0) return [str];
    let best = -1;
    for (let i = 0; i < str.length; i++) if (str[i] === ' ' && (best < 0 || Math.abs(i - str.length / 2) < Math.abs(best - str.length / 2))) best = i;
    return [str.slice(0, best), str.slice(best + 1)];
  }

  function drawScreen(c, s) {
    const t = SF.time;
    if (cab.screen === "off") {
      c.fillStyle = "#0a1a18"; c.fillRect(s.x, s.y, s.w, s.h);
      c.fillStyle = "rgba(255,255,255,.08)"; c.fillRect(s.x + 3, s.y + 3, 10, 3);
    } else if (cab.screen === "attract") {
      c.fillStyle = "#0a0a3a"; c.fillRect(s.x, s.y, s.w, s.h);
      for (let i = 0; i < 14; i++) { // starfield
        const sy = (i * 37 + t * (10 + i * 3)) % s.h;
        c.fillStyle = i % 3 ? "#8888ff" : "#ffffff"; c.fillRect(s.x + ((i * 29) % s.w), s.y + sy, 1, 1);
      }
      SF.drawSprite(c, SF.coin[Math.floor(t * 6) % 3], s.x + s.w / 2, s.y + Math.round(s.h * 0.42));
      if (SF.blink(2)) { SF.text(c, "INSERT", s.x + s.w / 2, s.y + Math.round(s.h * 0.42) + 8, { size: 8, color: "#ffd400", outline: 1 }); SF.text(c, "COIN", s.x + s.w / 2, s.y + Math.round(s.h * 0.42) + 18, { size: 8, color: "#ffd400", outline: 1 }); }
      SF.text(c, "CR " + String(cab.credits || 0).padStart(2, "0"), s.x + s.w / 2, s.y + 4, { size: 8, color: "#fff", outline: 0 });
    } else if (cab.screen === "static") {
      for (let y = 0; y < s.h; y += 1) for (let x = 0; x < s.w; x += 2) {
        const v = (Math.random() * 200) | 0; c.fillStyle = "rgb(" + v + "," + v + "," + v + ")"; c.fillRect(s.x + x, s.y + y, 2, 1);
      }
    } else if (cab.screen === "count") {           // SF2-style continue countdown on the CRT
      c.fillStyle = "#000"; c.fillRect(s.x, s.y, s.w, s.h);
      SF.text(c, "CONTINUE", s.x + s.w / 2, s.y + 6, { size: SF.fitSize("CONTINUE", 8, s.w - 2), color: "#fff", outline: 0 });
      const n = String(cab.count), size = s.h >= 80 ? 32 : 24;
      SF.text(c, n, s.x + s.w / 2, s.y + (s.h - size) / 2 + 4, { size, color: "#ff3a1a", gradient: "#ffd400", outline: 2 });
      if (SF.blink(3)) SF.drawSprite(c, SF.coin[0], s.x + s.w / 2, s.y + s.h - 6);
    } else if (cab.screen === "black") {
      c.fillStyle = "#000"; c.fillRect(s.x, s.y, s.w, s.h);
    }
    // "photo" mode: canvas leaves it black, the DOM layer shows the picture
    if (cab.screen === "photo") { c.fillStyle = "#000"; c.fillRect(s.x, s.y, s.w, s.h); }
    // glass sheen
    c.fillStyle = "rgba(255,255,255,.06)"; c.fillRect(s.x, s.y, s.w, 1); c.fillRect(s.x, s.y, 1, s.h);
  }

  // ---- DOM photo layer on the CRT (keeps real photos sharp)
  const crt = document.getElementById("crt"), img = document.getElementById("crtImg");
  cab.dom = { on: false, open: 1 };
  cab.showPhoto = (src) => {
    img.onerror = () => { img.removeAttribute("src"); img.style.display = "none"; cab.dom.missing = true; };
    img.style.display = ""; cab.dom.missing = false; img.src = src;
    cab.dom.on = true; cab.screen = "photo";
  };
  cab.hidePhoto = () => { cab.dom.on = false; crt.style.display = "none"; };
  cab.syncDom = () => {
    if (!cab.dom.on) { crt.style.display = "none"; return; }
    const r = cab.screenRect(), a = SF.worldToCss(r.x, r.y), b = SF.worldToCss(r.x + r.w, r.y + r.h);
    const open = cab.dom.open;                 // 0..1 vertical "CRT opening" animation
    const h = (b.y - a.y) * open, top = a.y + ((b.y - a.y) - h) / 2;
    Object.assign(crt.style, { display: "block", left: a.x + "px", top: top + "px", width: b.x - a.x + "px", height: Math.max(2, h) + "px" });
  };

  // ------------------------------------------------------------------
  // 3. CABINET ARRIVES - family steps aside, cabinet slams down, dust + flash
  const dust = [];
  SF.scenes.cabinet = {
    enter() {
      const S = SF.street;
      SF.camReset(); S.dim = 0; S.cheer = false;
      cab.build(); cab.place(); cab.screen = "off"; cab.coinBlink = false; cab.credits = 0;
      const acts = SF.makeActors();
      const row = [-54, -22, 8, 34];
      acts.forEach((a, i) => { a.x = cab.x + row[i]; a.y = S.ground + (i % 2); a.dir = 1; a.state = "idle"; });
      this.fallY = -SF.view.H; this.landed = false; this.ready = false;
      dust.length = 0;
    },
    positions() {
      const S = SF.street, L = cab.left(), Rt = cab.x + W / 2;
      const dad = Math.min(L - 16, Math.max(46, L - 16)), mom = Math.max(15, Math.min(dad - 30, L - 46));
      const sis = Math.max(Rt + 10 > S.W - 50 ? S.W - 50 : Rt + 10, cab.x + 24), dog = Math.min(S.W - 19, Math.max(sis + 30, Rt + 36));
      return { dad: Math.max(46, dad), mom, sis, dog };
    },
    update(dt) {
      SF.street.update(dt); SF.updateActors(dt);
      const t = this.t;
      if (t > 0.5 && !this.moved) {
        this.moved = true; const p = this.positions();
        SF.actors.forEach((a) => { a.speed = 95; a.faceAfter = a.key === "dad" || a.key === "mom" ? 1 : -1; SF.walkTo(a, p[a.key]); });
        SF.audio.sfx("blip");
      }
      if (t > 1.5 && !this.landed) {
        const k = SF.clamp((t - 1.5) / 0.45, 0, 1);
        this.fallY = SF.lerp(-SF.view.H, 0, k * k);
        if (k >= 1) this.land();
      }
      if (this.landed) cab.flash = Math.max(0, cab.flash - dt * 3);
      if (this.landed && t > this.landT + 0.6 && cab.screen === "off") { cab.screen = "attract"; SF.audio.sfx("crtOn"); }
      if (this.landed && t > this.landT + 1.2) { this.ready = true; cab.coinBlink = true; }
      for (const d of dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 30 * dt; d.life -= dt; }
      for (let i = dust.length - 1; i >= 0; i--) if (dust[i].life <= 0) dust.splice(i, 1);
    },
    land() {
      this.landed = true; this.landT = this.t; this.fallY = 0;
      SF.cam.shake = 6; cab.flash = 0.9; SF.audio.sfx("slam");
      for (let i = 0; i < 26; i++) dust.push({ x: cab.x + SF.rand(-W / 2 - 6, W / 2 + 6), y: cab.y - SF.rand(0, 6), vx: SF.rand(-60, 60), vy: -SF.rand(10, 45), life: SF.rand(0.4, 0.9), s: SF.rand(2, 4) | 0 });
      SF.actors.forEach((a) => { a.state = "win"; a.t = 0; setTimeout(() => { if (a.state === "win") a.state = "idle"; }, 700); });
    },
    resize() {   // phone rotated: re-anchor cabinet and family
      cab.build(); cab.place(); const p = this.positions();
      SF.actors.forEach((a, i) => { a.x = p[a.key]; a.tx = null; a.state = "idle"; a.y = SF.street.ground + (i % 2); });
    },
    onInput() {
      if (this.ready && SF.scenes.coin) SF.go("coin", 1);
      else if (!this.landed && this.t < 1.5) this.t = 1.5;   // skip ahead
    },
    draw(c) {
      SF.street.draw(c);
      SF.applyCam(c);
      if (!this.landed && this.t > 0.4) { // growing shadow
        const k = SF.clamp((this.t - 0.4) / 1.5, 0, 1);
        c.fillStyle = "rgba(0,0,0," + 0.35 * k + ")"; c.fillRect(Math.round(cab.x - (W / 2) * k), cab.y - 2, Math.round(W * k), 3);
      }
      cab.draw(c, this.fallY);
      SF.drawActors(c);
      for (const d of dust) { c.fillStyle = "rgba(210,200,220," + SF.clamp(d.life * 1.5, 0, 1) + ")"; c.fillRect(Math.round(d.x), Math.round(d.y), d.s, d.s); }
      cab.syncDom();
      c.setTransform(1, 0, 0, 1, 0, 0);
      const { W: vw, H: vh } = SF.view;
      if (this.t > 0.2 && this.t < 1.4) SF.text(c, "!", cab.x, cab.y - 70, { size: 16, color: "#ffd400", outline: 2 });
      if (this.ready && SF.blink(2)) SF.text(c, "TAP TO INSERT COIN", vw / 2, vh - 12, { size: 8, color: "#ffd400", outline: 1 });
    },
  };
})();
