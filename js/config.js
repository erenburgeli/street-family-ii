// Everything you might want to change lives here.
window.SF = window.SF || {};
SF.CONFIG = {
  title: "STREET FAMILY II",
  characters: {
    dad:  "ELI",
    mom:  "ADI",
    sis:  "ARBEL",
    dog:  "TOKYO",
  },
  roles: {                // small subtitle under each name in the intro
    dad: "THE BEARD",
    mom: "THE BOSS",
    sis: "ACTUALLY IN CHARGE",
    dog: "GOOD BOY",
  },
  texts: {
    boy: "IT'S A BOY!",
    girl: "IT'S A GIRL!",
    twins: "IT'S TWINS!",
    finale: "COMING SPRING '27",
    challenger: "HERE COMES A NEW CHALLENGER!",
    notOver: "GAME NOT OVER!",
    oneMore: "INSERT ONE MORE COIN TO CONTINUE",
    thanks: "THANKS FOR PLAYING",
    banner: "MAZAL TOV!",     // towed by the plane in the finale
  },
  photos: {
    boy: "photos/boy.jpg",
    girl: "photos/girl.jpg",
    twins: "photos/twins.jpg",
  },
  revealHoldMs: 1500,   // how long each reveal stays before PRESS TO CONTINUE shows
  revealAutoMs: 4000,   // each reveal moves on by itself after this (tap skips sooner)
  continueSeconds: 10,  // GAME NOT OVER countdown (auto-inserts the coin at 0)
  viewHeight: 240,      // logical pixel height of the game canvas
};
