import { getDatabase } from "firebase-admin/database";

export async function saveScore(req, res) {
    try {
        const {
            uid,
            username,
            photo_url,
            dificultad,
            nivel,
            esmeraldas,
            diamantes,
            tiempo_final,
            puntos
        } = req.body;

        if (!uid || !dificultad || !nivel || puntos === undefined) {
            return res.status(400).json({ error: "Datos incompletos" });
        }

        const db = getDatabase();

        // Ruta estructurada por dificultad y nivel
        const ref = db.ref(`/scores/${dificultad}/${nivel}/${uid}`);

        // Obtener puntaje actual (si ya tiene)
        const snapshot = await ref.get();
        const prev = snapshot.val();

        // Si existe, solo actualizar si es mejor
        if (prev && prev.puntos >= puntos) {
            return res.json({
                status: "OK",
                message: "Puntuación no reemplazada (menor o igual que la existente)",
                puntosActuales: prev.puntos
            });
        }

        // Guardar puntaje mejorado
        await ref.set({
            uid,
            username,
            photo_url,
            dificultad,
            nivel,
            esmeraldas,
            diamantes,
            tiempo_final,
            puntos,
            timestamp: Date.now()
        });

        return res.json({
            status: "OK",
            message: "Puntuación guardada",
            puntos
        });

    } catch (error) {
        console.error("Error guardando puntuación:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}

export async function getLeaderboard(req, res) {
    try {
        const { dificultad, nivel } = req.params;
        const db = getDatabase();

        const snapshot = await db
            .ref(`/scores/${dificultad}/${nivel}`)
            .orderByChild("puntos")
            .limitToLast(20)
            .get();

        const data = snapshot.val() || {};
        const leaderboard = Object.values(data).sort((a, b) => b.puntos - a.puntos);

        res.json(leaderboard);

    } catch (error) {
        console.error("Error obteniendo leaderboard:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}
