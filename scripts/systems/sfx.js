// scripts/systems/sfx.js

// --- Helpers generales ---

function isSfxEnabled() {
  const flag = localStorage.getItem('sfxEnabled');
  // Si nunca se ha configurado, lo consideramos activado
  return flag === null || flag === 'true';
}

function getSfxVolume() {
  const saved = localStorage.getItem('sfxVolume');
  if (saved === null) return 0.8; // volumen por defecto
  const v = parseFloat(saved);
  return Number.isNaN(v) ? 0.8 : v;
}

// --- Definición de sonidos ---

const explosionSound = new Audio('sound/Explosion.mp3'); // ruta según tu proyecto
explosionSound.volume = getSfxVolume();

const coinSound = new Audio('sound/Coin.mp3');
coinSound.volume = getSfxVolume();

const speedSound = new Audio('sound/Speed.mp3');
speedSound.volume = getSfxVolume();

const healingSound = new Audio('sound/Heal.mp3');
healingSound.volume = getSfxVolume();

let winSound = null;

// --- Funciones públicas ---

export function playExplosion() {
  if (!isSfxEnabled()) return;

  explosionSound.currentTime = 0;
  explosionSound.volume = getSfxVolume();
  explosionSound.play().catch(() => {
  });
}

export function playCoin() {
  if (!isSfxEnabled()) return;

  coinSound.currentTime = 0;
  coinSound.volume = getSfxVolume();
  coinSound.play().catch(() => {
  });
}
export function playSpeed() {
  if (!isSfxEnabled()) return;

  speedSound.currentTime = 0;
  speedSound.volume = getSfxVolume();
  speedSound.play().catch(() => {
  });
}

export function playHealing() {
  if (!isSfxEnabled()) return;

  healingSound.currentTime = 0;
  healingSound.volume = getSfxVolume();
  healingSound.play().catch(() => {
  });
}

export function playWin() {
  // Respetar si el usuario desactivó los SFX
  const sfxEnabled = localStorage.getItem('sfxEnabled');
  if (sfxEnabled === 'false') return;

  // Primero apagamos la música de fondo
  stopMusic();

  // Reutilizar la instancia de Audio
  if (!winSound) {
    winSound = new Audio('/sound/Win.mp3'); // ajusta la ruta si es distinta
  }

  winSound.currentTime = 0;
  winSound.volume = 1; // o usa otro volumen si quieres
  winSound.play().catch(() => {});
}

// Si más adelante quieres un volumen independiente para FX:
export function setSfxVolume(vol) {
  // vol entre 0 y 1
  const clamped = Math.max(0, Math.min(1, vol));
  localStorage.setItem('sfxVolume', clamped);
  explosionSound.volume = clamped;
  coinSound.volume = clamped;
  speedSound.volume = clamped;
  healingSound.volume = clamped;
}

export function stopMusic() {
  const bg = window.bgMusic || document.getElementById('bg-music');
  if (!bg) return;

  bg.pause();
  // Si quieres que al salir al menú vuelva desde el inicio,
  // puedes resetear el tiempo:
  // bg.currentTime = 0;
}