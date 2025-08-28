function togglePauseMenu() {
    const menu = document.getElementById("pause-menu");
    // Alterna mostrar/ocultar
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

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
