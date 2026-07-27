/* ==========================================================================
   confetti.js
   Petite explosion de confettis sobre (pas de couleurs criardes), sur un
   canvas dédié qui reste vide/transparent le reste du temps.
   ========================================================================== */

(function(){
  "use strict";

  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = 0, height = 0;
  let pieces = [];
  let active = false;

  const COLORS = ["#CE9AA1", "#C5A15C", "#EFDDBB", "#EAC7C7", "#FFFDF9"];

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

  function rand(min, max){ return min + Math.random() * (max - min); }

  /** Déclenche une explosion élégante et discrète de confettis. */
  function fire(){
    pieces = [];
    const originX = width / 2;
    const originY = height * .38;
    const count = 90;

    for(let i = 0; i < count; i++){
      const angle = rand(0, Math.PI * 2);
      const force = rand(120, 420);
      pieces.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * force * .6,
        vy: Math.sin(angle) * force - 260,
        w: rand(6, 10),
        h: rand(9, 14),
        rotation: rand(0, 360),
        rotSpeed: rand(-260, 260),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
      });
    }
    active = true;
  }

  let lastTime = performance.now();
  function step(t){
    const dt = Math.min((t - lastTime) / 1000, .05);
    lastTime = t;
    ctx.clearRect(0, 0, width, height);

    if(active){
      let alive = false;
      for(const p of pieces){
        p.vy += 420 * dt;       // gravité
        p.vx *= .992;           // frottement doux
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotSpeed * dt;
        p.life -= dt * .28;

        if(p.life > 0 && p.y < height + 40){
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(p.life, 0);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }
      active = alive;
    }

    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  window.ConfettiField = { fire };
})();
