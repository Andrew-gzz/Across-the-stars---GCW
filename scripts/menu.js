// scripts/menu.js
function togglePauseMenu() {
  const menu = document.getElementById("pause-menu");

  gameState.paused = !gameState.paused;
  menu.style.display = gameState.paused ? "block" : "none";
}

function resumeGame() {
    gameState.paused = false;
    document.getElementById("pause-menu").style.display = "none";

    //window.startGameLoop();
}

function restartGame() {
    alert("Reiniciar juego");
}

function exitGame() {
    alert("Salir al menú principal");
    window.location.href = "index.html";
}

function options() {
    const pauseMenu   = document.getElementById("pause-menu");
    const optionsMenu = document.getElementById("options-menu");

    if (!optionsMenu) return;

    // Mantener el juego en pausa, solo cambiamos de menú
    if (pauseMenu) pauseMenu.style.display = "none";
    optionsMenu.style.display = "block";

    // Inicializar los controles con lo que haya en localStorage
    initOptionsUI();
}

function closeOptions() {
    const pauseMenu   = document.getElementById("pause-menu");
    const optionsMenu = document.getElementById("options-menu");

    if (optionsMenu) optionsMenu.style.display = "none";
    if (pauseMenu)   pauseMenu.style.display   = "block";
}

document.addEventListener('DOMContentLoaded', () => {
  const bgMusic = document.getElementById('bg-music');
  if (bgMusic) {
    // 🎵 Track
    const savedTrack = localStorage.getItem('musicTrack');
    if (savedTrack) {
      bgMusic.src = savedTrack;
    } else {
      bgMusic.src = 'sound/Sound1.mp3'; // default
    }

    // 🔊 Volumen
    const savedVolume = localStorage.getItem('musicVolume');
    if (savedVolume !== null) {
      bgMusic.volume = parseFloat(savedVolume);  // 0–1
    } else {
      bgMusic.volume = 0.5;
    }

    bgMusic.load();
    bgMusic.play().catch(() => {});
  }

  // ⬇️ configurar UI de opciones si existe en esta página
  initOptionsUI(bgMusic);
});

function initOptionsUI(bgMusic) {
  const volumenInput = document.getElementById('volumen');
  const trackSelect  = document.getElementById('musicTrack');
  const sfxCheckbox  = document.getElementById('efectos');

  // Si esta página no tiene modal de opciones, salir
  if (!volumenInput && !trackSelect && !sfxCheckbox) return;

  // Volumen
  const savedVolume = localStorage.getItem('musicVolume');
  let currentVolume = savedVolume !== null ? parseFloat(savedVolume) : 0.5;

  if (volumenInput) {
    volumenInput.value = Math.round(currentVolume * 100);
    volumenInput.addEventListener('input', () => {
      const vol = volumenInput.value / 100;
      localStorage.setItem('musicVolume', vol);
      if (bgMusic) bgMusic.volume = vol;
    });
  }

  // Track
  const savedTrack = localStorage.getItem('musicTrack');
  if (trackSelect) {
    if (savedTrack) {
      trackSelect.value = savedTrack;
    }
    trackSelect.addEventListener('change', () => {
      const track = trackSelect.value;
      localStorage.setItem('musicTrack', track);
      if (bgMusic) {
        bgMusic.src = track;
        bgMusic.load();
        bgMusic.play().catch(() => {});
      }
    });
  }

  // SFX
  const savedSfx = localStorage.getItem('sfxEnabled');
  if (sfxCheckbox) {
    if (savedSfx !== null) {
      sfxCheckbox.checked = savedSfx === 'true';
    }
    sfxCheckbox.addEventListener('change', () => {
      localStorage.setItem('sfxEnabled', sfxCheckbox.checked);
    });
  }
}
