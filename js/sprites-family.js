// Family sprites (ELI, ADI, ARBEL, TOKYO), drawn procedurally per pose into offscreen canvases.
// Each character: { idle:[2], walk:[2], win } ; dog also { wag:[2] }. Facing right.
(function () {
  function canvasSprite(w, h, fn) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    const R = (x, y, ww, hh, col) => { if (ww > 0 && hh > 0) { g.fillStyle = col; g.fillRect(x | 0, y | 0, ww | 0, hh | 0); } };
    fn(R);
    const f = document.createElement("canvas"); f.width = w; f.height = h;
    const fg = f.getContext("2d"); fg.translate(w, 0); fg.scale(-1, 1); fg.drawImage(c, 0, 0);
    return { img: c, flip: f, w, h };
  }

  // Generic humanoid. o = proportions + palette + detail painters; p = pose
  function human(o, p) {
    return canvasSprite(o.w, o.h, (R) => {
      const cx = o.w >> 1, b = p.bob || 0, P = o.pal;
      const jump = p.legs === "jump";
      const tY = o.torsoY + b, tX = cx - (o.torsoW >> 1);
      // --- legs
      const legBot = o.h - o.shoeH - (jump ? 3 : 0);
      const legs = [
        { x: cx - o.legGap - o.legW, sw: p.legs === "walkA" ? -2 : p.legs === "walkB" ? 1 : jump ? -1 : -1 },
        { x: cx + o.legGap, sw: p.legs === "walkA" ? 2 : p.legs === "walkB" ? -1 : jump ? 1 : 1 },
      ];
      for (const L of legs) {
        const mid = o.hipY + ((legBot - o.hipY) >> 1);
        R(L.x, o.hipY + b, o.legW, mid - o.hipY - b, P.leg);
        R(L.x + (L.sw >> 1), mid, o.legW, legBot - mid, P.leg);
        R(L.x + L.sw, legBot - 2, o.legW, 2, P.legShade || P.leg);
        const sx = L.x + L.sw - (o.shoeFront ? 0 : 0);
        R(sx, legBot, o.legW + o.shoeFront, o.shoeH, P.shoe);
        if (P.sole) R(sx, legBot + o.shoeH - 1, o.legW + o.shoeFront, 1, P.sole);
      }
      // --- lower garment (shorts / dress / skirt)
      o.lower(R, cx, o.hipY + b, p);
      // --- back arm, torso, front arm
      const armLen = o.armLen, sl = o.sleeve;
      const arm = (x, dir, front) => {
        const col = front ? P.skin : P.skinShade;
        if (p.arms === "up") {
          R(x, tY - armLen + 3, o.armW, armLen - 2, col);
          R(x, tY, o.armW, sl, front ? P.top : P.topShade);
          R(x - (dir < 0 ? 1 : 0), tY - armLen + 1, o.armW + 1, 2, col);  // fist
        } else {
          const swing = p.arms === "swingA" ? (front ? 1 : -1) : p.arms === "swingB" ? (front ? -1 : 1) : 0;
          R(x, tY + 1, o.armW, sl, front ? P.top : P.topShade);
          R(x + (swing > 0 ? 1 : swing < 0 ? -1 : 0), tY + 1 + sl, o.armW, armLen - sl, col);
          R(x + (swing > 0 ? 1 : swing < 0 ? -1 : 0), tY + armLen, o.armW, 2, P.skinShade);
        }
      };
      arm(tX - o.armW + 1, -1, false);
      o.torso(R, tX, tY, o.torsoW, o.hipY + b - tY, p);
      arm(tX + o.torsoW - 1, 1, true);
      // --- neck + head
      const hx = cx - (o.headW >> 1) + 1, hy = o.headY + b;
      R(cx - 1, hy + o.headH - 1, 3, tY - (hy + o.headH) + 2, P.skinShade);
      R(hx + 1, hy, o.headW - 2, o.headH, P.skin);
      R(hx, hy + 1, o.headW, o.headH - 3, P.skin);
      R(hx, hy + o.headH - 3, 2, 2, P.skinShade);
      o.head(R, hx, hy, p);
    });
  }

  const eyes = (R, hx, hy, o, col) => {
    const ey = hy + Math.round(o.headH * 0.45);
    R(hx + o.headW - 3, ey, 1, 2, col); R(hx + o.headW - 6, ey, 1, 2, col);
  };

  // ---------------- ELI: buzz cut, beard, cream patterned shirt, khaki shorts, sneakers
  const dad = {
    w: 28, h: 48, headY: 2, headW: 11, headH: 12, torsoY: 15, torsoW: 14, hipY: 30,
    armW: 3, armLen: 14, sleeve: 6, legW: 4, legGap: 1, shoeH: 3, shoeFront: 2,
    pal: { skin: "#f0c09a", skinShade: "#cf9670", top: "#f2ead6", topShade: "#cfc4a8", leg: "#e8b28c", legShade: "#cf9670", shoe: "#8a7a64", sole: "#eeeeee" },
    head(R, hx, hy, p) {
      R(hx + 1, hy - 1, 9, 2, "#a07850"); R(hx, hy, 3, 4, "#a07850"); R(hx + 3, hy + 1, 6, 1, "#b8906a");
      R(hx + 2, hy + 4, 2, 2, "#e0a882");                                    // ear
      R(hx + 3, hy + 8, 8, 4, "#9a5a30"); R(hx + 5, hy + 12, 5, 1, "#9a5a30");  // beard
      R(hx + 7, hy + 7, 4, 1, "#9a5a30");                                    // moustache
      R(hx + 7, hy + 9, 3, 1, p.happy ? "#ffffff" : "#7a3a20");              // smile
      eyes(R, hx, hy, this, "#2a1a10");
      R(hx + 7, hy + 4, 4, 1, "#8a6040");                                    // brows
    },
    torso(R, x, y, w, h) {
      R(x, y, w, h, this.pal.top);
      R(x, y, 2, h, this.pal.topShade);
      for (let yy = y + 1; yy < y + h; yy += 3) for (let xx = x + ((yy >> 1) % 3); xx < x + w; xx += 4) {
        R(xx, yy, 1, 1, (xx + yy) % 2 ? "#a08060" : "#6a8ab0");
      }
      R(x + (w >> 1) + 1, y, 1, h, "#d8ccb0");                               // button line
      R(x + 5, y, 4, 2, "#e8c8a0");                                          // open collar
    },
    lower(R, cx, y) {
      R(cx - 7, y - 1, 14, 8, "#b8a074"); R(cx - 7, y - 1, 14, 1, "#8a7650");
      R(cx - 1, y + 3, 1, 4, "#9a8458"); R(cx - 7, y + 5, 2, 2, "#9a8458");
    },
  };

  // ---------------- ADI: long brown hair, blue-and-white floral dress, barefoot
  const mom = {
    w: 28, h: 48, headY: 3, headW: 10, headH: 11, torsoY: 15, torsoW: 12, hipY: 27,
    armW: 2, armLen: 13, sleeve: 4, legW: 3, legGap: 1, shoeH: 2, shoeFront: 1,
    pal: { skin: "#f2c6a2", skinShade: "#d4a07c", top: "#f4f4fa", topShade: "#c8d0e8", leg: "#f2c6a2", legShade: "#d4a07c", shoe: "#e0ac88" },
    head(R, hx, hy) {
      const H = "#6a4428", Hl = "#8a5a36";
      R(hx, hy - 1, 10, 3, H); R(hx - 1, hy, 4, 16, H); R(hx - 2, hy + 4, 3, 14, H);  // hair falls behind
      R(hx + 2, hy - 1, 6, 1, Hl); R(hx + 7, hy + 1, 3, 2, H);
      eyes(R, hx, hy, this, "#2a1a10");
      R(hx + 6, hy + 8, 3, 1, "#c0505a");                                   // lips
      R(hx + 8, hy + 6, 1, 1, "#e8a890");                                   // cheek
    },
    torso(R, x, y, w, h) { floral(R, x, y, w, h); R(x + 3, y, 6, 2, this.pal.skin); },
    lower(R, cx, y) { floral(R, cx - 8, y, 16, 11); R(cx - 8, y + 10, 16, 1, "#3a6ac8"); },
  };
  function floral(R, x, y, w, h) {
    R(x, y, w, h, "#f4f4fa");
    for (let yy = y; yy < y + h; yy += 3) for (let xx = x + ((yy * 7) % 4); xx < x + w; xx += 4) {
      R(xx, yy, 2, 1, "#3a6ac8"); R(xx, yy + 1, 1, 1, "#9ab8e8");
    }
  }

  // ---------------- ARBEL: toddler, big head, red headband, white top, red sandals
  const sis = {
    w: 16, h: 26, headY: 1, headW: 10, headH: 10, torsoY: 11, torsoW: 8, hipY: 17,
    armW: 2, armLen: 6, sleeve: 2, legW: 2, legGap: 0, shoeH: 2, shoeFront: 1,
    pal: { skin: "#f6ceb0", skinShade: "#dcaa88", top: "#fafafa", topShade: "#d8d8e0", leg: "#f6ceb0", legShade: "#dcaa88", shoe: "#d0303a" },
    head(R, hx, hy, p) {
      const H = "#4a2a18";
      R(hx, hy, 10, 3, H); R(hx - 1, hy + 2, 3, 6, H); R(hx + 8, hy + 2, 2, 2, H);
      R(hx - 1, hy + 1, 11, 2, "#d0303a"); R(hx + 2, hy + 1, 1, 1, "#fff"); R(hx + 6, hy + 1, 1, 1, "#fff");
      R(hx + 3, hy - 1, 3, 2, "#d0303a");                                   // bow
      eyes(R, hx, hy, this, "#2a1a10");
      R(hx + 6, hy + 7, 3, 1, p.happy ? "#c03040" : "#d06060");
      R(hx + 8, hy + 6, 2, 1, "#f0a0a0");
    },
    torso(R, x, y, w, h) { R(x, y, w, h, "#fafafa"); R(x, y + h - 1, w, 1, "#e0e0ea"); },
    lower(R, cx, y) { R(cx - 4, y, 9, 4, "#f4d8e0"); R(cx - 3, y + 1, 1, 1, "#d0303a"); R(cx + 2, y + 2, 1, 1, "#3a6ac8"); },
  };

  function frames(o) {
    return {
      idle: [human(o, { legs: "stand", arms: "down", bob: 0 }), human(o, { legs: "stand", arms: "down", bob: 1 })],
      walk: [human(o, { legs: "walkA", arms: "swingA" }), human(o, { legs: "walkB", arms: "swingB" })],
      win: human(o, { legs: "jump", arms: "up", happy: true }),
    };
  }

  // ---------------- TOKYO: big white dog, tan ears, tongue out, wagging tail
  function dog(p) {
    return canvasSprite(36, 24, (R) => {
      const W = "#f6f4ee", S = "#d8d4c8", T = "#d8a060", b = p.bob || 0, jy = p.jump ? -3 : 0;
      // legs
      const legs = p.jump ? [[8, 0], [12, 0], [24, 0], [28, 0]]
        : p.step === 0 ? [[7, -1], [12, 1], [23, 1], [28, -1]] : p.step === 1 ? [[8, 1], [11, -1], [24, -1], [27, 1]] : [[8, 0], [12, 0], [24, 0], [28, 0]];
      legs.forEach(([x, s], i) => {
        const len = p.jump ? 3 : 6;
        R(x + s, 17 + jy, 3, len, i % 2 ? W : S);
        R(x + s, 17 + jy + len - 1, 4, 1, S);
      });
      // tail
      const tail = p.tail === 1 ? [[2, 6], [3, 7], [4, 8], [5, 9]] : p.tail === 2 ? [[1, 11], [2, 10], [3, 10], [4, 10]] : [[3, 4], [3, 5], [4, 6], [5, 8]];
      tail.forEach(([x, y]) => R(x, y + b + jy, 3, 2, W));
      // body
      R(6, 8 + b + jy, 22, 10, W); R(5, 9 + b + jy, 24, 8, W);
      R(6, 16 + b + jy, 22, 2, S); R(10, 9 + b + jy, 6, 3, "#ffffff");
      // head
      const hy = 2 + b + jy;
      R(25, 6 + b + jy, 5, 5, W);                                           // neck
      R(26, hy, 9, 9, W); R(27, hy - 1, 7, 1, W);
      R(33, hy + 4, 3, 4, W);                                               // snout
      R(35, hy + 4, 1, 2, "#2a1a1a");                                       // nose
      R(26, hy, 3, 6, T); R(25, hy + 1, 2, 6, T); R(31, hy - 1, 2, 2, T);   // ears
      R(31, hy + 2, 1, 1, "#2a1a1a");                                       // eye
      R(30, hy + 1, 3, 1, "#e8c090");
      R(33, hy + 8, 2, p.pant ? 4 : 3, "#e86080"); R(33, hy + 8, 1, 1, "#c04060");  // tongue
      R(25, hy + 8, 5, 2, "#555a66");                                       // collar
    });
  }

  SF.family = {
    dad: frames(dad), mom: frames(mom), sis: frames(sis),
    dog: {
      idle: [dog({ tail: 0, pant: 0 }), dog({ tail: 1, bob: 0, pant: 1 })],
      walk: [dog({ step: 0, tail: 1 }), dog({ step: 1, tail: 0 })],
      wag: [dog({ tail: 0 }), dog({ tail: 1 }), dog({ tail: 2 })],
      win: dog({ jump: true, tail: 1, pant: 1 }),
    },
  };
})();
