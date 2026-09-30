// Core: canvas sizing, camera, loop, input, scene manager, sprite + text helpers.
(function () {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const V = { W: 320, H: 240, scale: 1, left: 0, top: 0 };
  const hud = document.getElementById("hud"), hctx = hud.getContext("2d");  // overlay above the DOM photo
  SF.canvas = canvas; SF.ctx = ctx; SF.hud = hctx; SF.view = V;

  // ---- sizing: height ~240 on landscape; on portrait keep >=200 wide and grow taller
  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const aspect = vw / vh;
    let H = SF.CONFIG.viewHeight, W = Math.round(H * aspect);
    if (W < 200) { W = 200; H = Math.round(W / aspect); }
    V.W = W; V.H = H;
    V.scale = Math.min(vw / W, vh / H);
    canvas.width = W; canvas.height = H;
    canvas.style.width = W * V.scale + "px";
    canvas.style.height = H * V.scale + "px";
    V.left = (vw - W * V.scale) / 2; V.top = (vh - H * V.scale) / 2;
    hud.width = W; hud.height = H;
    Object.assign(hud.style, { width: canvas.style.width, height: canvas.style.height, left: V.left + "px", top: V.top + "px" });
    ctx.imageSmoothingEnabled = false; hctx.imageSmoothingEnabled = false;
    if (SF.onResize) SF.onResize();
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 200));
  SF.resize = resize;

  // ---- camera (world coords == canvas coords when zoom=1, cx/cy = screen centre)
  SF.cam = { cx: 0, cy: 0, zoom: 1, shake: 0 };
  SF.camReset = () => { SF.cam.cx = V.W / 2; SF.cam.cy = V.H / 2; SF.cam.zoom = 1; };
  SF.camOffset = () => {
    const s = SF.cam.shake > 0 ? SF.cam.shake : 0;
    return { x: s ? (Math.random() * 2 - 1) * s : 0, y: s ? (Math.random() * 2 - 1) * s : 0 };
  };
  SF.applyCam = (c) => {
    const o = SF.camOffset(), z = SF.cam.zoom;
    c.setTransform(z, 0, 0, z, Math.round(V.W / 2 - SF.cam.cx * z + o.x), Math.round(V.H / 2 - SF.cam.cy * z + o.y));
  };
  // world point -> CSS pixel position on the page (for the DOM photo layer)
  SF.worldToCss = (x, y) => {
    const z = SF.cam.zoom;
    return {
      x: V.left + (V.W / 2 + (x - SF.cam.cx) * z) * V.scale,
      y: V.top + (V.H / 2 + (y - SF.cam.cy) * z) * V.scale,
    };
  };

  // ---- scenes
  SF.scenes = {};
  SF.scene = null; SF.sceneName = "";
  SF.go = (name, arg) => {
    SF.sceneName = name; SF.scene = SF.scenes[name];
    SF.scene.t = 0;
    if (SF.scene.enter) SF.scene.enter(arg);
  };

  // ---- input: one handler, debounced
  let lastInput = 0;
  function input(e) {
    const now = performance.now();
    if (now - lastInput < 300) return;
    lastInput = now;
    if (SF.onAnyInput) SF.onAnyInput();
    if (SF.scene && SF.scene.onInput) SF.scene.onInput();
  }
  window.addEventListener("pointerdown", (e) => {
    if (e.target.closest && e.target.closest("#mute")) return;
    e.preventDefault(); input(e);
  }, { passive: false });
  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (e.key === "Enter" || e.key === " " || e.code === "Space") { e.preventDefault(); input(e); }
  });
  document.addEventListener("dblclick", (e) => e.preventDefault());

  // ---- loop
  SF.time = 0;
  let last = 0;
  function frame(ts) {
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0);
    last = ts; SF.time += dt;
    if (SF.cam.shake > 0) SF.cam.shake = Math.max(0, SF.cam.shake - dt * 20);
    if (SF.scene) {
      SF.scene.t += dt;
      if (SF.scene.update) SF.scene.update(dt);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, V.W, V.H);
      hctx.clearRect(0, 0, V.W, V.H);
      if (SF.scene.draw) SF.scene.draw(ctx);
    }
    requestAnimationFrame(frame);
  }
  SF.start = () => requestAnimationFrame(frame);

  // ---- sprites: rows of chars -> offscreen canvas (+ mirrored copy)
  SF.sprite = (rows, pal) => {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
      const col = pal[rows[y][x]];
      if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    }
    const f = document.createElement("canvas"); f.width = w; f.height = h;
    const fg = f.getContext("2d"); fg.translate(w, 0); fg.scale(-1, 1); fg.drawImage(c, 0, 0);
    return { img: c, flip: f, w, h };
  };
  // draw a sprite with its feet at (x, y), centred horizontally
  SF.drawSprite = (c, s, x, y, flip, scale) => {
    const k = scale || 1;
    c.drawImage(flip ? s.flip : s.img, Math.round(x - (s.w * k) / 2), Math.round(y - s.h * k), s.w * k, s.h * k);
  };

  // ---- text: Press Start 2P with a hard outline
  SF.FONT = '"Press Start 2P", monospace';
  SF.text = (c, str, x, y, o) => {
    o = o || {};
    const size = o.size || 8;
    c.font = size + "px " + SF.FONT;
    c.textAlign = o.align || "center"; c.textBaseline = "top";
    x = Math.round(x); y = Math.round(y);
    const ol = o.outline === undefined ? Math.max(1, Math.round(size / 8)) : o.outline;
    if (ol) {
      c.fillStyle = o.outlineColor || "#000";
      for (let dy = -ol; dy <= ol; dy++) for (let dx = -ol; dx <= ol; dx++) if (dx || dy) c.fillText(str, x + dx, y + dy);
    }
    if (o.shadow) { c.fillStyle = o.shadow; c.fillText(str, x, y + ol + 1); }
    c.fillStyle = o.color || "#fff"; c.fillText(str, x, y);
    if (o.gradient) { // two-tone SF2 style: top colour over bottom half
      c.save(); c.beginPath(); c.rect(0, y, 99999, size / 2); c.clip();
      c.fillStyle = o.gradient; c.fillText(str, x, y); c.restore();
    }
  };
  // shrink font size until text fits maxW
  SF.fitSize = (str, size, maxW) => {
    while (size > 8 && str.length * size > maxW) size -= 2;
    return size;
  };

  // ---- misc helpers
  SF.rand = (a, b) => a + Math.random() * (b - a);
  SF.pick = (arr) => arr[(Math.random() * arr.length) | 0];
  SF.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  SF.lerp = (a, b, t) => a + (b - a) * t;
  SF.easeOut = (t) => 1 - Math.pow(1 - SF.clamp(t, 0, 1), 3);
  SF.easeOutBack = (t) => { t = SF.clamp(t, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  SF.blink = (rate) => Math.floor(SF.time * (rate || 2)) % 2 === 0;
})();
