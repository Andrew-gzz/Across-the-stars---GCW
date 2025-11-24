function setModo(modo) {
    localStorage.setItem("modo", modo.toLowerCase());
}

function setDificultad(dificultad) {
    // siempre en minúsculas para evitar errores
    localStorage.setItem("dificultad", dificultad.toLowerCase());
}
