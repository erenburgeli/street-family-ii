// Scene state machine. Each scene: enter(arg) / update(dt) / draw(ctx) / onInput().
(function () {
  const C = SF.CONFIG;

  // 0. BOOT - black screen, blinking PRESS START (this tap also unlocks audio)
  SF.scenes.boot = {
    draw(c) {
      const { W, H } = SF.view;
      c.setTransform(1, 0, 0, 1, 0, 0);
      const ts = SF.fitSize(C.title, 16, W - 16);
      SF.text(c, C.title, W / 2, H * 0.32, { size: ts, color: "#ffd400", gradient: "#fff27a", outline: 2, outlineColor: "#a01010" });
      if (SF.blink(2)) SF.text(c, "PRESS START", W / 2, H * 0.58, { size: 8, color: "#fff" });
      SF.text(c, String.fromCharCode(169) + " 2026 " + C.characters.dad + " & " + C.characters.mom, W / 2, H - 24, { size: 8, color: "#888", outline: 0 });
    },
    onInput() {
      SF.audio.start();
      SF.go(SF.scenes.intro ? "intro" : "street");
    },
  };

  // 1. STREET - plain street (used while later scenes are being built)
  SF.scenes.street = {
    update(dt) { SF.street.update(dt); },
    draw(c) { SF.street.draw(c); },
    onInput() { SF.street.cheer = !SF.street.cheer; },
  };
})();
