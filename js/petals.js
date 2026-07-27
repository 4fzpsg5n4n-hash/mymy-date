/* ==========================================================================
   petals.js
   Système de particules léger dessiné sur <canvas>, partagé par tous les
   écrans : petits cœurs flottants (écran 1) puis pétales de cerisier
   (écrans 2 à 5). Un seul rAF, un seul canvas -> fluide sur mobile.
   ========================================================================== */

(function(){
  "use strict";

  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");

  let dpr = Math.min(window.devicePixelRatio || 1, 2); // on plafonne pour rester léger
  let width = 0, height = 0;

  /** Redimensionne le canvas en tenant compte du pixel ratio. */
  function resize(){
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // Mode courant du champ de particules : "hearts", "petals" ou "off"
  let mode = "hearts";
  let particles = [];
  let burstParticles = []; // particules ponctuelles (ex : disparition du bouton "Non")
  let running = true;
  let lastTime = performance.now();

  const MAX_AMBIENT = 16; // nombre de particules "ambiance", volontairement discret

  function rand(min, max){ return min + Math.random() * (max - min); }

  /** Crée une particule cœur (écran 1) : monte doucement, très discrète. */
  function makeHeart(){
    return {
      type: "heart",
      x: rand(0, width),
      y: height + rand(0, 60),
      size: rand(8, 16),
      speed: rand(6, 14),        // px/s vers le haut
      sway: rand(10, 26),
      swaySpeed: rand(.3, .6),
      phase: rand(0, Math.PI * 2),
      opacity: rand(.12, .28),
      rotation: rand(-15, 15),
    };
  }

  /** Crée un pétale de cerisier (écrans suivants) : tombe en tournoyant. */
  function makePetal(){
    return {
      type: "petal",
      x: rand(0, width),
      y: -rand(0, 60),
      size: rand(10, 18),
      speed: rand(18, 36),       // px/s vers le bas
      sway: rand(16, 40),
      swaySpeed: rand(.25, .55),
      phase: rand(0, Math.PI * 2),
      opacity: rand(.55, .9),
      rotation: rand(0, 360),
      rotSpeed: rand(-40, 40),   // deg/s
      hue: Math.random() > .5 ? "blush" : "cream",
    };
  }

  function fillAmbient(){
    particles = [];
    const factory = mode === "hearts" ? makeHeart : makePetal;
    if(mode === "off") return;
    for(let i = 0; i < MAX_AMBIENT; i++){
      const p = factory();
      // on répartit les positions initiales sur tout l'écran, pas seulement au bord
      p.y = rand(0, height);
      particles.push(p);
    }
  }

  /** Change le mode d'affichage ("hearts" | "petals" | "off"). */
  function setMode(next){
    if(mode === next) return;
    mode = next;
    fillAmbient();
  }

  /** Dessine un petit cœur simple avec deux arcs + une pointe. */
  function drawHeart(p){
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.scale(p.size / 16, p.size / 16);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = "#CE9AA1";
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-8, -6, -16, 4, 0, 14);
    ctx.bezierCurveTo(16, 4, 8, -6, 0, 4);
    ctx.fill();
    ctx.restore();
  }

  /** Dessine un pétale (forme d'amande douce). */
  function drawPetal(p){
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.hue === "blush" ? "#E9C4C9" : "#EFDDBB";
    ctx.beginPath();
    ctx.moveTo(0, -p.size / 2);
    ctx.quadraticCurveTo(p.size / 2, 0, 0, p.size / 2);
    ctx.quadraticCurveTo(-p.size / 2, 0, 0, -p.size / 2);
    ctx.fill();
    ctx.restore();
  }

  function step(t){
    const dt = Math.min((t - lastTime) / 1000, .05); // clamp pour éviter les sauts
    lastTime = t;

    ctx.clearRect(0, 0, width, height);

    if(running){
      // --- particules d'ambiance ---
      for(const p of particles){
        p.phase += p.swaySpeed * dt;
        p.x += Math.sin(p.phase) * p.sway * dt * .6;

        if(p.type === "heart"){
          p.y -= p.speed * dt;
          if(p.y < -20){ Object.assign(p, makeHeart()); p.y = height + 20; }
        } else {
          p.y += p.speed * dt;
          p.rotation += p.rotSpeed * dt;
          if(p.y > height + 20){ Object.assign(p, makePetal()); p.y = -20; }
        }
      }

      // --- particules de rafale (poof du bouton Non, etc.) ---
      burstParticles = burstParticles.filter(p => p.life > 0);
      for(const p of burstParticles){
        p.life -= dt;
        p.vy += 60 * dt; // légère gravité
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotSpeed * dt;
      }
    }

    for(const p of particles){
      if(p.type === "heart") drawHeart(p); else drawPetal(p);
    }
    for(const p of burstParticles){
      ctx.save();
      ctx.globalAlpha = Math.max(p.life / p.maxLife, 0);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.quadraticCurveTo(p.size / 2, 0, 0, p.size / 2);
      ctx.quadraticCurveTo(-p.size / 2, 0, 0, -p.size / 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(step);
  }

  /** Fait "exploser" un petit nuage de pétales depuis un point précis de l'écran. */
  function burst(x, y, count){
    count = count || 18;
    for(let i = 0; i < count; i++){
      const angle = rand(0, Math.PI * 2);
      const force = rand(60, 160);
      burstParticles.push({
        x, y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force - 40,
        size: rand(8, 14),
        rotation: rand(0, 360),
        rotSpeed: rand(-180, 180),
        color: Math.random() > .5 ? "#E9C4C9" : "#EFDDBB",
        life: 1,
        maxLife: 1,
      });
    }
  }

  // On met en pause quand l'onglet n'est pas visible, pour économiser la batterie.
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    lastTime = performance.now();
  });

  fillAmbient();
  requestAnimationFrame(step);

  // API exposée au reste de l'application
  window.PetalField = { setMode, burst };
})();
