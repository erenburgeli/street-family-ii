// 2. CHARACTER INTRO - SF2 select-style: each family member slides in with a flash + name plate,
// then a group pose with "READY?". Tap skips ahead.
(function () {
  const C = SF.CONFIG;
  const ORDER = ["dad", "mom", "sis", "dog"];
  const PER = 2.0, GROUP = 2.8;

  SF.scenes.intro = {
    enter() {
      this.i = -1; this.local = 0; this.group = false; this.flash = 0;
      this.shown = [];
      SF.camReset(); SF.street.dim = 0.5; SF.street.cheer = false;
      this.next();
    },
    next() {
      this.i++; this.local = 0;
      if (this.i >= ORDER.length) { this.group = true; this.flash = 1; SF.audio.sfx("ready"); return; }
      this.dirIn = this.i % 2 ? -1 : 1;
      SF.audio.sfx("whoosh");
    },
    update(dt) {
      SF.street.update(dt);
      this.local += dt; this.flash = Math.max(0, this.flash - dt * 4);
      if (!this.group) {
        if (this.local >= 0.28 && !this.hit) { this.hit = true; this.flash = 1; SF.audio.sfx("hit"); SF.cam.shake = 2; }
        if (this.local >= PER) { this.hit = false; this.shown.push(ORDER[this.i]); this.next(); }
      } else if (this.local >= GROUP) this.finish();
    },
    finish() { SF.street.dim = 0; SF.go(SF.scenes.cabinet ? "cabinet" : "street"); },
    onInput() {
      if (this.group) this.finish();
      else { this.shown = ORDER.slice(); this.i = ORDER.length - 1; this.hit = false; this.next(); }
    },
    draw(c) {
      const { W, H } = SF.view;
      SF.street.draw(c);
      c.setTransform(1, 0, 0, 1, 0, 0);
      const k = Math.max(2, Math.min(4, Math.floor((H * 0.42) / 48)));
      const cy = Math.round(H * 0.5);

      // roster of already-introduced fighters along the top
      const rs = SF.clamp(Math.floor(W / 110), 1, 2);
      this.shown.forEach((key, n) => {
        if (this.group) return;
        const x = W / 2 + (n - 1.5) * (W / 4.4);
        c.fillStyle = "rgba(20,30,90,.8)"; c.fillRect(Math.round(x - 22), 18, 44, 43 + 8 * rs);
        c.fillStyle = "#ffd400"; c.fillRect(Math.round(x - 22), 18, 44, 1); c.fillRect(Math.round(x - 22), 61 + 8 * rs, 44, 1);
        SF.drawActor(c, { key, x, y: 50 + 8 * rs, dir: 1, state: "idle", t: SF.time }, rs * 0.6);
        SF.text(c, C.characters[key], x, 60 + 8 * rs - 10, { size: 8, color: "#ffd400" });
      });

      // blue SF2 band
      const bandH = Math.round(48 * k * 0.8);
      for (let y = 0; y < bandH; y++) {
        c.fillStyle = y % 4 < 2 ? "rgba(30,70,200,.55)" : "rgba(20,40,150,.55)";
        c.fillRect(0, cy - bandH / 2 + y, W, 1);
      }
      c.fillStyle = "#ffd400"; c.fillRect(0, cy - bandH / 2 - 2, W, 2); c.fillRect(0, cy + bandH / 2, W, 2);

      if (!this.group) {
        const key = ORDER[this.i];
        const p = SF.easeOutBack(this.local / 0.28);
        const x = SF.lerp(W / 2 + this.dirIn * -(W / 2 + 60), W / 2 - 30 * Math.sign(this.dirIn) * 0, p);
        const y = cy + bandH / 2 - 4;
        SF.drawActor(c, { key, x, y, dir: this.dirIn, state: this.local > 1.2 ? "win" : "idle", t: this.local }, k);
        if (this.local > 0.28) {
          const ns = SF.fitSize(C.characters[key], 24, W - 20);
          const ty = cy + bandH / 2 + 10;
          SF.text(c, C.characters[key], W / 2, ty, { size: ns, color: "#ff3a1a", gradient: "#ffd400", outline: 2 });
          SF.text(c, C.roles[key], W / 2, ty + ns + 8, { size: 8, color: "#fff" });
          SF.text(c, (this.i + 1) + "P", W / 2 - this.dirIn * (W / 2 - 22), cy - bandH / 2 - 16, { size: 8, color: this.i % 2 ? "#ff5a5a" : "#5ab4ff" });
        }
      } else {
        const widths = ORDER.map((key) => SF.family[key].idle[0].w), pad = 8;
        const sum = widths.reduce((a, b) => a + b, 0);
        const gk = SF.clamp(Math.floor((2 * (W - 16 - pad * 3)) / sum) / 2, 1, k);
        let gx = W / 2 - (sum * gk + pad * 3) / 2;
        ORDER.forEach((key, n) => {
          const x = gx + (widths[n] * gk) / 2; gx += widths[n] * gk + pad;
          SF.drawActor(c, { key, x, y: cy + bandH / 2 - 4, dir: n < 2 ? 1 : -1, state: "win", t: this.local + n * 0.3 }, gk);
          SF.text(c, C.characters[key], x, cy + bandH / 2 + 6 + (W < 300 && n % 2 ? 11 : 0), { size: 8, color: "#ffd400" });
        });
        if (SF.blink(3)) SF.text(c, "READY?", W / 2, cy - bandH / 2 - 34, { size: SF.fitSize("READY?", 24, W - 20), color: "#ff3a1a", gradient: "#ffd400", outline: 2 });
      }
      if (this.flash > 0) { c.fillStyle = "rgba(255,255,255," + this.flash * 0.8 + ")"; c.fillRect(0, 0, W, H); }
      if (!this.group) SF.text(c, "TAP TO SKIP", W / 2, H - 12, { size: 8, color: "#bbb", outline: 1 });
    },
  };
})();
