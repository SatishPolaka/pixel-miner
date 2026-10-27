// Pixel Miner – core game logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W, H;
function resize(){
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();
// Game state
let player, bullets, asteroids, minerals, score, gameOver, gameStarted, lastSpawn;
// Constants
const PLAYER_W = 40, PLAYER_H = 30;
const BULLET_W = 4, BULLET_H = 10;
const ASTEROID_MIN_R = 15, ASTEROID_MAX_R = 30;
const MINERAL_R = 8;
// Input handling
const keys = {};
window.addEventListener('keydown', e=>{keys[e.code]=true; if(e.code==='Space') e.preventDefault();});
window.addEventListener('keyup', e=>{keys[e.code]=false;});
// Mobile button helpers
const leftBtn=document.getElementById('leftBtn');
const rightBtn=document.getElementById('rightBtn');
const fireBtn=document.getElementById('fireBtn');
let touchLeft=false, touchRight=false, touchFire=false;
leftBtn.addEventListener('touchstart', e=>{e.preventDefault(); touchLeft=true;});
leftBtn.addEventListener('touchend', e=>{e.preventDefault(); touchLeft=false;});
rightBtn.addEventListener('touchstart', e=>{e.preventDefault(); touchRight=true;});
rightBtn.addEventListener('touchend', e=>{e.preventDefault(); touchRight=false;});
fireBtn.addEventListener('touchstart', e=>{e.preventDefault(); touchFire=true;});
fireBtn.addEventListener('touchend', e=>{e.preventDefault(); touchFire=false;});
function init(){
  player={x:W/2-PLAYER_W/2, y:H-PLAYER_H-10, w:PLAYER_W, h:PLAYER_H, speed:5};
  bullets=[]; asteroids=[]; minerals=[]; score=0; gameOver=false; gameStarted=false; lastSpawn=0;
}
function startGame(){
  if(!gameStarted){
    gameStarted=true;
    requestAnimationFrame(loop);
  }
}
function reset(){
  init();
  startGame();
}
function spawnAsteroid(){
  const r = Math.random()*(ASTEROID_MAX_R-ASTEROID_MIN_R)+ASTEROID_MIN_R;
  const x = Math.random()*(W-2*r)+r;
  const speed = Math.random()*2+1;
  asteroids.push({x, y:-r, r, speed});
}
function spawnMineral(x, y){
  minerals.push({x, y, r:MINERAL_R});
}
function update(dt){
  // Player movement
  if(keys['ArrowLeft']||touchLeft) player.x-=player.speed;
  if(keys['ArrowRight']||touchRight) player.x+=player.speed;
  player.x = Math.max(0, Math.min(W-player.w, player.x));
  // Shooting
  if((keys['Space']||touchFire) && gameStarted){
    // simple fire rate control
    if(!player.lastShot || Date.now()-player.lastShot>200){
      bullets.push({x:player.x+player.w/2-BULLET_W/2, y:player.y, w:BULLET_W, h:BULLET_H});
      player.lastShot=Date.now();
    }
  }
  // Update bullets
  bullets.forEach(b=>b.y-=8);
  bullets = bullets.filter(b=>b.y+b.h>0);
  // Update asteroids
  asteroids.forEach(a=>a.y+=a.speed);
  // Collision bullet‑asteroid
  bullets.forEach((b, bi)=>{
    asteroids.forEach((a, ai)=>{
      const dx = b.x + b.w/2 - a.x;
      const dy = b.y + b.h/2 - a.y;
      const dist = Math.hypot(dx, dy);
      if(dist < a.r){
        // destroy asteroid
        asteroids.splice(ai,1);
        bullets.splice(bi,1);
        score+=10;
        // 20% chance to drop mineral
        if(Math.random()<0.2) spawnMineral(a.x, a.y);
      }
    });
  });
  // Update minerals (fall slowly)
  minerals.forEach(m=>m.y+=1.5);
  // Check ship‑asteroid collision (game over)
  asteroids.forEach(a=>{
    const dx = player.x + player.w/2 - a.x;
    const dy = player.y + player.h/2 - a.y;
    const dist = Math.hypot(dx, dy);
    if(dist < a.r + Math.max(player.w, player.h)/2){
      gameOver=true;
    }
  });
  // Collect mineral
  minerals.forEach((m, mi)=>{
    if(m.x > player.x && m.x < player.x+player.w && m.y > player.y && m.y < player.y+player.h){
      score+=20;
      minerals.splice(mi,1);
    }
  });
  // Remove off‑screen asteroids/minerals
  asteroids = asteroids.filter(a=>a.y-a.r<H);
  minerals = minerals.filter(m=>m.y-m.r<H);
  // Spawn new asteroids over time
  if(Date.now()-lastSpawn>800){
    spawnAsteroid();
    lastSpawn=Date.now();
  }
}
function draw(){
  ctx.clearRect(0,0,W,H);
  // Background stars (optional simple)
  ctx.fillStyle='#222';
  ctx.fillRect(0,0,W,H);
  // Player ship
  ctx.fillStyle='#0f0';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y+player.h);
  ctx.lineTo(player.x+player.w/2, player.y);
  ctx.lineTo(player.x+player.w, player.y+player.h);
  ctx.closePath();
  ctx.fill();
  // Bullets
  ctx.fillStyle='#ff0';
  bullets.forEach(b=>{ctx.fillRect(b.x,b.y,b.w,b.h);});
  // Asteroids
  ctx.fillStyle='#888';
  asteroids.forEach(a=>{
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
    ctx.fill();
  });
  // Minerals
  ctx.fillStyle='#0ff';
  minerals.forEach(m=>{
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI*2);
    ctx.fill();
  });
  // Score
  ctx.fillStyle='#fff';
  ctx.font='20px sans-serif';
  ctx.fillText('Score: '+score, 10, 30);
  // Start screen / Game over overlay
  if(!gameStarted){
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';
    ctx.textAlign='center';
    ctx.font='30px sans-serif';
    ctx.fillText('Pixel Miner', W/2, H/2-40);
    ctx.font='20px sans-serif';
    ctx.fillText('Arrow keys to move, Space to fire', W/2, H/2);
    ctx.fillText('Tap controls for mobile', W/2, H/2+30);
    ctx.fillText('Tap Fire to start', W/2, H/2+70);
  }
  if(gameOver){
    ctx.fillStyle='rgba(0,0,0,0.8)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#f44';
    ctx.textAlign='center';
    ctx.font='40px sans-serif';
    ctx.fillText('Game Over', W/2, H/2-20);
    ctx.font='30px sans-serif';
    ctx.fillText('Score: '+score, W/2, H/2+20);
    ctx.font='20px sans-serif';
    ctx.fillText('Tap anywhere to restart', W/2, H/2+60);
  }
}
function loop(){
  if(!gameStarted) return;
  const now = Date.now();
  const dt = now - (loop.last||now);
  loop.last = now;
  if(!gameOver){
    update(dt);
    draw();
    requestAnimationFrame(loop);
  } else {
    draw();
    // Wait for click/tap to restart
    canvas.addEventListener('click', reset, {once:true});
    canvas.addEventListener('touchstart', reset, {once:true});
  }
}
// Start on first user interaction
canvas.addEventListener('click', startGame);
canvas.addEventListener('touchstart', startGame);
init();