function togglePauseMenu() {
    const menu = document.getElementById("pause-menu");

    // Cambia el estado del juego
    gameState.paused = !gameState.paused;

    // Muestra u oculta el menú
    menu.style.display = gameState.paused ? "block" : "none";
}

function resumeGame() {
    gameState.paused = false;
    document.getElementById("pause-menu").style.display = "none";

    // 🔥 Volver a activar animación
    window.startGameLoop();
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