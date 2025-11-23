import { gameState } from "./core/gameState.js";

function togglePauseMenu() {
    const menu = document.getElementById("pause-menu");
    const visible = menu.style.display === "block";

    if (visible) {
        // ──────────────── REANUDAR ────────────────
        menu.style.display = "none";
        gameState.paused = false;
        gameState.freezeBernice = false;

        // Reanudar tiempo SOLO si hay tiempo (dificultad difícil)
        if (gameState.dificultad === "dificil") {
            iniciarTimerOtraVez();
        }

    } else {
        // ──────────────── PAUSAR IGUAL QUE GAME OVER ────────────────
        menu.style.display = "block";
        gameState.paused = true;
        gameState.freezeBernice = true;

        // Pausar tiempo
        if (gameState.timeInterval) clearInterval(gameState.timeInterval);
    }
}

window.togglePauseMenu = togglePauseMenu;
window.resumeGame = () => togglePauseMenu(); // usa lo mismo


function resumeGame() {
    document.getElementById("pause-menu").style.display = "none";
}

function restartGame() {
    alert("Reiniciar juego");
}

function exitGame() {
    alert("Salir al menú principal");
    window.location.href = "index.html";
}

function options() {
    const confirmOptions = confirm("¿Desea continuar? Los cambios no se guardarán.");
    if (confirmOptions) {
        window.location.href = "opciones.html";
    }
}