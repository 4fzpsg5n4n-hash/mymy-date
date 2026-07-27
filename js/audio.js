/* ==========================================================================
   audio.js
   Tous les effets sonores sont synthétisés en direct avec la Web Audio API :
   aucun fichier binaire requis, donc rien à télécharger pour que le clic sur
   l'enveloppe "sonne" correctement. La musique de fond, elle, reste un vrai
   fichier audio à déposer dans assets/music/ (voir le README de ce dossier).
   ========================================================================== */

(function(){
  "use strict";

  let audioCtx = null;

  /** Crée (une seule fois) le contexte audio, au premier geste utilisateur. */
  function getCtx(){
    if(!audioCtx){
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    if(audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  /** Bruit blanc filtré, utilisé comme base pour le froissement de papier. */
  function noiseBuffer(ctx, duration){
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for(let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  /** Effet "froissement / ouverture d'enveloppe" : souffle filtré, montée puis chute. */
  function playPaperOpen(){
    const ctx = getCtx();
    const now = ctx.currentTime;
    const duration = .9;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, duration);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.linearRampToValueAtTime(2600, now + duration * .55);
    filter.frequency.linearRampToValueAtTime(900, now + duration);
    filter.Q.value = .7;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.16, now + .12);
    gain.gain.linearRampToValueAtTime(.08, now + duration * .6);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);
  }

  /** Petit "clac" chaleureux pour le cachet de cire. */
  function playSealStamp(){
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + .18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(.22, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + .22);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + .25);
  }

  /** Clic doux et léger (boutons Oui / Non / Continuer). */
  function playSoftClick(){
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + .09);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(.09, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + .12);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + .13);
  }

  /** Petit arpège chaleureux pour marquer la réponse "Oui". */
  function playYesChime(){
    const ctx = getCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // Do - Mi - Sol

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const start = now + i * .1;
      osc.frequency.setValueAtTime(freq, start);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.14, start + .04);
      gain.gain.exponentialRampToValueAtTime(.001, start + .5);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + .55);
    });
  }

  /** Vibration légère si l'appareil le permet (ignorée silencieusement sinon). */
  function vibrate(pattern){
    if(navigator.vibrate){
      try{ navigator.vibrate(pattern); } catch(e){ /* silencieux */ }
    }
  }

  /** Démarre la musique de fond en fondu, en avalant l'erreur si le fichier est absent. */
  function playMusic(){
    const music = document.getElementById("bg-music");
    if(!music) return;
    music.volume = 0;
    const p = music.play();
    if(p && p.catch) p.catch(() => { /* pas de fichier fourni : on ignore */ });

    let vol = 0;
    const fade = setInterval(() => {
      vol += .04;
      music.volume = Math.min(vol, .55);
      if(vol >= .55) clearInterval(fade);
    }, 120);
  }

  window.SoundFX = {
    playPaperOpen, playSealStamp, playSoftClick, playYesChime,
    vibrate, playMusic,
  };
})();
