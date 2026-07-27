/* ==========================================================================
   main.js
   Petite machine à états qui enchaîne les 5 écrans de l'expérience.
   ========================================================================== */

(function(){
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Utilitaires écrans                                                  */
  /* ------------------------------------------------------------------ */
  const screens = {
    1: document.getElementById("screen-1"),
    2: document.getElementById("screen-2"),
    3: document.getElementById("screen-3"),
    4: document.getElementById("screen-4"),
    5: document.getElementById("screen-5"),
  };

  /** Bascule vers l'écran demandé (fondu géré en CSS via la classe .active). */
  function goToScreen(n){
    Object.values(screens).forEach(s => s.classList.remove("active"));
    screens[n].classList.add("active");
    onScreenEnter(n);
  }

  /** Rejoue une animation CSS en forçant un reflow (utile pour .paper.unfold-in). */
  function replay(el, className){
    el.classList.remove(className);
    void el.offsetWidth; // force le reflow
    el.classList.add(className);
  }

  const state = { nonClicks: 0, screen2Typed: false };

  function onScreenEnter(n){
    if(n === 2){
      window.PetalField.setMode("petals");
      if(!state.screen2Typed){
        state.screen2Typed = true;
        typeLetter();
      }
    }
    if(n === 4){
      replay(document.getElementById("paper-4"), "unfold-in");
      setTimeout(() => {
        document.getElementById("btn-to-5").classList.add("visible");
      }, 900);
    }
    if(n === 5){
      window.PetalField.setMode("petals");
    }
  }

  /* ------------------------------------------------------------------ */
  /* ÉCRAN 1 — ouverture de l'enveloppe                                  */
  /* ------------------------------------------------------------------ */
  const envelopeBtn = document.getElementById("envelope-btn");
  const envelope = document.getElementById("envelope");
  const waxSeal = document.getElementById("wax-seal");
  let envelopeOpened = false;

  envelopeBtn.addEventListener("click", () => {
    if(envelopeOpened) return;
    envelopeOpened = true;

    // 1. le cachet "craque" et vibre légèrement
    waxSeal.classList.add("crack");
    window.SoundFX.playSealStamp();
    window.SoundFX.vibrate(18);

    // 2. un court instant après, l'enveloppe s'ouvre réellement
    setTimeout(() => {
      envelope.classList.add("is-opening");
      window.SoundFX.playPaperOpen();
      window.SoundFX.vibrate([12, 40, 16]);
      window.SoundFX.playMusic(); // la musique démarre sur ce premier vrai geste
    }, 260);

    // 3. une fois la lettre sortie, on passe à l'écran suivant
    setTimeout(() => {
      goToScreen(2);
    }, 1500);
  });

  /* ------------------------------------------------------------------ */
  /* ÉCRAN 2 — machine à écrire                                          */
  /* ------------------------------------------------------------------ */
  const LETTER_TEXT =
`Coucou Mymy,

Depuis plusieurs jours, on échange et j’avoue que j’apprécie vraiment chacune de nos conversations.

J’aimerais beaucoup apprendre à te connaître davantage, mais cette fois en dehors d’un écran.

Avant ton long périple en Normandie, je me suis dit que ce serait dommage de ne pas saisir cette occasion.

Alors je voulais te poser une petite question…`;

  function typeLetter(){
    const target = document.getElementById("typewriter-text");
    const continueBtn = document.getElementById("btn-to-3");
    target.textContent = "";

    const cursor = document.createElement("span");
    cursor.className = "typewriter-cursor";
    cursor.textContent = "\u00A0";

    let i = 0;
    function tick(){
      if(i < LETTER_TEXT.length){
        target.textContent = LETTER_TEXT.slice(0, i + 1);
        target.appendChild(cursor);
        i++;
        // rythme naturel : pause plus longue sur la ponctuation
        const c = LETTER_TEXT[i - 1];
        let delay = 26;
        if(c === "\n") delay = 90;
        else if(",;".includes(c)) delay = 160;
        else if(".!?…".includes(c)) delay = 320;
        setTimeout(tick, delay);
      } else {
        cursor.remove();
        continueBtn.hidden = false;
        requestAnimationFrame(() => continueBtn.classList.add("visible"));
      }
    }
    tick();
  }

  document.getElementById("btn-to-3").addEventListener("click", () => {
    window.SoundFX.playSoftClick();
    goToScreen(3);
  });

  /* ------------------------------------------------------------------ */
  /* ÉCRAN 3 — Oui / Non                                                 */
  /* ------------------------------------------------------------------ */
  const btnOui = document.getElementById("btn-oui");
  const btnNon = document.getElementById("btn-non");
  const taunt = document.getElementById("taunt-text");

  const TAUNTS = [
    "Tu es sûre ? 🥺",
    "Réfléchis encore…",
    "Promis je suis sympa 😄",
    "Tu me fais peur 😅",
    "Bon… je vais finir par enlever ce bouton.",
  ];

  function showTaunt(msg){
    taunt.classList.remove("visible");
    setTimeout(() => {
      taunt.textContent = msg;
      taunt.classList.add("visible");
    }, 150);
  }

  btnNon.addEventListener("click", () => {
    if(state.nonClicks >= 5) return;
    state.nonClicks++;
    window.SoundFX.playSoftClick();
    window.SoundFX.vibrate(10);

    showTaunt(TAUNTS[state.nonClicks - 1]);

    if(state.nonClicks >= 5){
      // le bouton "Non" s'évanouit dans un nuage de pétales
      const rect = btnNon.getBoundingClientRect();
      window.PetalField.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 22);
      btnNon.classList.add("poof");
      setTimeout(() => { btnNon.style.visibility = "hidden"; }, 500);
    } else {
      btnNon.classList.remove("shrink-1","shrink-2","shrink-3","shrink-4");
      btnNon.classList.add("shrink-" + state.nonClicks);
      btnOui.classList.remove("grow-1","grow-2","grow-3","grow-4");
      btnOui.classList.add("grow-" + state.nonClicks);
    }
  });

  btnOui.addEventListener("click", () => {
    window.SoundFX.playYesChime();
    window.SoundFX.vibrate([10, 30, 10, 30, 20]);
    window.ConfettiField.fire();
    taunt.classList.remove("visible");
    setTimeout(() => goToScreen(4), 900);
  });

  /* ------------------------------------------------------------------ */
  /* ÉCRAN 4 -> 5                                                        */
  /* ------------------------------------------------------------------ */
  document.getElementById("btn-to-5").addEventListener("click", () => {
    window.SoundFX.playSoftClick();
    goToScreen(5);
  });

})();
