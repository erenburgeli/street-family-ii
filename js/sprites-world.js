// Background sprites: crowd NPCs, pigeon, e-scooter rider, street cats, coin.
(function () {
  // NPC templates, 10x16, facing right. h hair, s skin, e eye, t top, p pants, f shoes
  const HEAD = [
    "   hhhh   ",
    "  hhhhhh  ",
    "  hhssss  ",
    "  hssses  ",
    "   ssss   ",
  ];
  const BODY = [
    "    ss    ",
    "   tttt   ",
    "  tttttt  ",
    "  tttttt  ",
    "  tttttt  ",
    "  stttts  ",
  ];
  const CHEER_BODY = [
    " s  ss  s ",
    " t tttt t ",
    "  tttttt  ",
    "   tttt   ",
    "   tttt   ",
    "   tttt   ",
  ];
  const LEGS_A = ["   pppp   ", "  pp  pp  ", "  pp  pp  ", "  pp  pp  ", " ff   ff  "];
  const LEGS_B = ["   pppp   ", "   pppp   ", "   pp pp  ", "   pp pp  ", "   ffff   "];
  const SKIRT_A = ["  pppppp  ", "  pppppp  ", "   s  s   ", "   s  s   ", "  ff  ff  "];
  const SKIRT_B = ["  pppppp  ", "  pppppp  ", "    ss    ", "    ss    ", "   ffff   "];
  const BALD = ["          ", "   ssss   ", "  sssss   ", "  sssses  ", "   ssss   "];
  const CAP = ["   cccc   ", "  cccccccc", "  hhssss  ", "  hssses  ", "   ssss   "];

  const SKIN = ["#f1c7a0", "#d9a27a", "#b07650", "#7a4e33", "#f5d5b8"];
  const HAIR = ["#2b1a10", "#5a3a1e", "#c9a04a", "#1a1a1a", "#8a4a2a", "#bbbbbb"];
  const TOPS = ["#c0392b", "#2e6db4", "#3c9a5f", "#e0a030", "#7b4ea0", "#e8e8e8", "#20a0a8", "#d05890", "#404050"];
  const PANTS = ["#2a3550", "#3a3a3a", "#6a5a40", "#1e2a40", "#5a2a2a"];
  const SHOES = ["#111", "#eee", "#5a3a20"];

  function build(head, body, legs, pal) { return SF.sprite(head.concat(body, legs), pal); }

  // A crowd member: random look, frames {a, b, cheer}
  SF.makeNPC = () => {
    const skirt = Math.random() < 0.3;
    const headT = Math.random() < 0.12 ? BALD : Math.random() < 0.18 ? CAP : HEAD;
    const pal = {
      h: SF.pick(HAIR), s: SF.pick(SKIN), e: "#111", t: SF.pick(TOPS),
      p: skirt ? SF.pick(TOPS) : SF.pick(PANTS), f: SF.pick(SHOES), c: SF.pick(TOPS),
    };
    const la = skirt ? SKIRT_A : LEGS_A, lb = skirt ? SKIRT_B : LEGS_B;
    return {
      a: build(headT, BODY, la, pal),
      b: build(headT, BODY, lb, pal),
      cheer: build(headT, CHEER_BODY, lb, pal),
    };
  };

  // Pigeon 7x5, 2 frames (peck / walk)
  const PPAL = { g: "#8a8f9a", d: "#5a5f6a", w: "#c8ccd4", o: "#e08a30", e: "#111", n: "#5a9a7a" };
  SF.pigeon = [
    SF.sprite(["    gg ", "   gegO".replace("O", "o"), " dgnggg", "ddgggg ", "  o o  "], PPAL),
    SF.sprite(["       ", "    gg ", " dggego", "ddgggn ", "  o  o "], PPAL),
  ];
  SF.pigeonFly = [
    SF.sprite(["d     d", " dd dd ", "  ggge ", "   gg o", "       "], PPAL),
    SF.sprite(["       ", "  ggge ", " dgggdo", "dd   dd", "       "], PPAL),
  ];

  // E-scooter rider 14x20, facing right (standing, slight lean), 2 frames (hair/shirt flutter)
  const EPAL = { k: "#1a1a1a", s: "#e0b08a", h: "#3a2414", t: "#30b0a0", p: "#2a3550", g: "#6a6a70", w: "#dddddd", r: "#ff3a3a" };
  const SC_BASE = [
    "      tttt k   ",
    "     tttt  k   ",
    "     tttt  k   ",
    "     pppp  k   ",
    "     pp pp k   ",
    "     pp pp k   ",
    "    kk  kk k   ",
    "  gggggggggg   ",
    " kkk      kkk  ",
    " kwk      kwk  ",
    " kkk      kkk  ",
  ];
  SF.scooter = [
    SF.sprite(["       hhh     ", "      hhhhh    ", "       sss     ", "       ss      ", "     tttttt rrk".slice(0, 15), "    tt tt  sk  ", "    s  tttss   ", "      ttt   k  ", "      ttt   k  "].concat(SC_BASE), EPAL),
    SF.sprite(["        hh     ", "      hhhhh    ", "     h sss     ", "       ss      ", "     tttttt rrk".slice(0, 15), "    tt tt  sk  ", "    s  tttss   ", "      tttt  k  ", "      ttt   k  "].concat(SC_BASE), EPAL),
  ];

  // Street cats 11x8: sit (2 frames tail flick), walk (2 frames)
  const CAT = [{ o: "#e08a3a", d: "#b0602a", e: "#40c040", n: "#f0a0a0", w: "#f4e8d8" }, { o: "#3a3a40", d: "#1e1e24", e: "#e0d040", n: "#e090a0", w: "#dddddd" }];
  SF.cats = CAT.map((P) => ({
    sit: [
      SF.sprite(["        d d", "        ooo", "d      oeoe", "d     ooonw", " d   oooo  ", " dooooooo  ", "  oooooo   ", "  ow  ow   "], P),
      SF.sprite(["        d d", "        ooo", "       oeoe", "      ooonw", "     oooo  ", "ddooooooo  ", "  oooooo   ", "  ow  ow   "], P),
    ],
    walk: [
      SF.sprite(["         dd", "d       ooo", " d      oeo", "  ooooooonw", "  oodoodoo ", "  oooooooo ", "  o o  o o ", " o   o  o  "], P),
      SF.sprite(["         dd", "d       ooo", " d      oeo", "  ooooooonw", "  oodoodoo ", "  oooooooo ", "   oo  oo  ", "   o    o  "], P),
    ],
  }));

  // Coin 8x8, 3 spin frames
  const GPAL = { y: "#ffd400", o: "#c88a00", w: "#fff6b0", k: "#6a4a00" };
  SF.coin = [
    SF.sprite(["  kkkk  ", " kyyyyk ", "kywyyyok", "kywyyook", "kyyyyook", "kyyyoook", " koooook", "  kkkk  "], GPAL),
    SF.sprite(["   kk   ", "  kyyk  ", "  kwyk  ", "  kwok  ", "  kyok  ", "  kyok  ", "  kook  ", "   kk   "], GPAL),
    SF.sprite(["   kk   ", "   kk   ", "   kk   ", "   kk   ", "   kk   ", "   kk   ", "   kk   ", "   kk   "], GPAL),
  ];
})();
