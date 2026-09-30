// Family actors: position, facing, simple state (idle / walk / win), drawing.
(function () {
  const KEYS = ["dad", "mom", "sis", "dog"];
  SF.actors = [];

  SF.makeActors = () => {
    SF.actors = KEYS.map((key) => ({ key, x: -50, y: 0, dir: 1, state: "idle", t: Math.random(), tx: null, speed: 55, jumpT: 0 }));
    return SF.actors;
  };
  SF.actor = (key) => SF.actors.find((a) => a.key === key);

  SF.walkTo = (a, tx) => { a.tx = tx; a.state = "walk"; a.dir = tx >= a.x ? 1 : -1; };

  SF.updateActors = (dt) => {
    for (const a of SF.actors) {
      a.t += dt;
      if (a.state === "walk" && a.tx !== null) {
        const d = a.tx - a.x, step = a.speed * dt;
        if (Math.abs(d) <= step) { a.x = a.tx; a.tx = null; a.state = "idle"; a.dir = a.faceAfter || a.dir; }
        else { a.x += Math.sign(d) * step; a.dir = Math.sign(d); }
      }
    }
  };

  // frame for an actor at its current state
  SF.actorFrame = (a) => {
    const F = SF.family[a.key];
    if (a.state === "win") return F.win;
    if (a.state === "walk") return F.walk[Math.floor(a.t * 7) % 2];
    if (a.key === "dog") return F.wag[[0, 1, 2, 1][Math.floor(a.t * 8) % 4]];
    return F.idle[Math.floor(a.t * 2) % 2];
  };

  SF.drawActor = (c, a, scale) => {
    const k = scale || a.scale || 1;
    let y = a.y;
    if (a.state === "win") y -= Math.round(Math.abs(Math.sin(a.t * 6)) * 6 * k);
    // shadow
    c.fillStyle = "rgba(0,0,0,.28)";
    const s = SF.actorFrame(a);
    c.fillRect(Math.round(a.x - s.w * k * 0.35), Math.round(a.y - k), Math.round(s.w * k * 0.7), Math.max(1, Math.round(2 * k)));
    SF.drawSprite(c, s, a.x, y, a.dir < 0, k);
  };

  SF.drawActors = (c) => {
    [...SF.actors].sort((a, b) => a.y - b.y).forEach((a) => SF.drawActor(c, a));
  };
})();
