// Wire-up: size the view, build the street, wait for the font, start the loop.
(function () {
  SF.onResize = () => {
    SF.street.build();
    SF.camReset();
    if (SF.scene && SF.scene.resize) SF.scene.resize();
  };

  const mute = document.getElementById("mute");
  mute.addEventListener("click", (e) => {
    e.stopPropagation();
    const m = !SF.audio.muted;
    SF.audio.setMuted(m);
    SF.audio.muted = m;
    mute.classList.toggle("off", m);
    mute.setAttribute("aria-label", m ? "Unmute sound" : "Mute sound");
  });

  const fontReady = document.fonts && document.fonts.load
    ? Promise.race([document.fonts.load('16px "Press Start 2P"'), new Promise((r) => setTimeout(r, 2500))])
    : Promise.resolve();

  fontReady.then(() => {
    SF.resize();
    SF.go("boot");
    SF.start();
  });
})();
