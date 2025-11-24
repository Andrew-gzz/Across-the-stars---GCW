import { getCurrentUser } from "../config/firebase.js";

// Función global para calcular y enviar puntuaciones
export async function enviarPuntos({
    nivel,
    dificultad,
    esmeraldas,
    diamantes,
    tiempo_final
}) {
    const user = getCurrentUser();
    if (!user) {
        console.warn("No hay usuario autenticado, no se puede enviar puntuación.");
        return;
    }

    // Fórmula recomendada
    const puntos = (diamantes * 50) + (esmeraldas * 25) + (tiempo_final * 10 || 0);

    const payload = {
        uid: user.uid,
        username: user.displayName,
        photo_url: user.photoURL,
        dificultad,
        nivel,
        esmeraldas,
        diamantes,
        tiempo_final,
        puntos
    };

    try {
        const res = await fetch("http://localhost:3000/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const responseData = await res.json();
        console.log("Puntuación enviada:", responseData);
        return responseData;
    } catch (err) {
        console.error("Error enviando puntuación:", err);
        return null;
    }
}
