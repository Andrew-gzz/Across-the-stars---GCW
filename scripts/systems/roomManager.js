// scripts/systems/roomManager.js
import { auth, db, ref, set, onValue, get, remove, onDisconnect, update } from '../config/firebase.js';

export class RoomManager {
    constructor() {
        this.currentRoomId = null;
        this.currentUserId = null;
        this.isHost = false;
        this.onRoomUpdate = null; // Callback para actualizar UI
        this.onGameStart = null; // Callback para iniciar juego
    }

    // 🔹 Crear una nueva sala
    async createRoom(level = 3) {
        if (!auth.currentUser) {
            throw new Error("Debes iniciar sesión primero");
        }

        this.currentUserId = auth.currentUser.uid;
        this.currentRoomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.isHost = true;

        const roomData = {
            host: this.currentUserId,
            guest: null,
            status: "waiting",
            level: level,
            createdAt: Date.now(),
            players: {
                [this.currentUserId]: {
                    name: auth.currentUser.displayName || "Player 1",
                    photoURL: auth.currentUser.photoURL || "",
                    ready: false,
                    x: 0,
                    z: 20,
                    animation: "idle",
                    timestamp: Date.now()
                }
            }
        };

        await set(ref(db, `rooms/${this.currentRoomId}`), roomData);
        
        // Configurar limpieza automática si el host se desconecta
        const roomRef = ref(db, `rooms/${this.currentRoomId}`);
        onDisconnect(roomRef).remove();

        console.log("✅ Sala creada:", this.currentRoomId);
        this._listenToRoom();
        
        return this.currentRoomId;
    }

    // 🔹 Buscar una sala disponible y unirse
    async joinAvailableRoom() {
        if (!auth.currentUser) {
            throw new Error("Debes iniciar sesión primero");
        }

        this.currentUserId = auth.currentUser.uid;

        // Buscar salas disponibles
        const roomsRef = ref(db, 'rooms');
        const snapshot = await get(roomsRef);

        if (!snapshot.exists()) {
            throw new Error("No hay salas disponibles. Crea una nueva.");
        }

        const rooms = snapshot.val();
        let availableRoom = null;

        // Buscar sala con guest = null
        for (const [roomId, roomData] of Object.entries(rooms)) {
            if (roomData.guest === null && roomData.status === "waiting") {
                availableRoom = { id: roomId, data: roomData };
                break;
            }
        }

        if (!availableRoom) {
            throw new Error("No hay salas disponibles. Crea una nueva.");
        }

        // Unirse a la sala
        this.currentRoomId = availableRoom.id;
        this.isHost = false;

        await set(ref(db, `rooms/${this.currentRoomId}/guest`), this.currentUserId);
        await set(ref(db, `rooms/${this.currentRoomId}/players/${this.currentUserId}`), {
            name: auth.currentUser.displayName || "Player 2",
            photoURL: auth.currentUser.photoURL || "",
            ready: false,
            x: 0,
            z: 20,
            animation: "idle",
            timestamp: Date.now()
        });

        // Si el guest se desconecta, solo removerlo
        const playerRef = ref(db, `rooms/${this.currentRoomId}/players/${this.currentUserId}`);
        onDisconnect(playerRef).remove();

        console.log("✅ Unido a sala:", this.currentRoomId);
        this._listenToRoom();

        return this.currentRoomId;
    }

    // 🔹 Marcar jugador como "listo"
    async setReady(ready = true) {
        if (!this.currentRoomId || !this.currentUserId) return;

        await update(
            ref(db, `rooms/${this.currentRoomId}/players/${this.currentUserId}`),
            { ready: ready }
        );

        console.log(`✅ ${ready ? 'Listo' : 'No listo'}`);

        // Verificar si ambos están listos
        await this._checkBothReady();
    }

    // 🔹 Verificar si ambos jugadores están listos
    async _checkBothReady() {
        const snapshot = await get(ref(db, `rooms/${this.currentRoomId}/players`));
        const players = snapshot.val();

        if (!players) return;

        const playerList = Object.values(players);
        
        // Si hay 2 jugadores y ambos están ready
        if (playerList.length === 2 && playerList.every(p => p.ready)) {
            console.log("🎮 ¡Ambos jugadores listos! Iniciando en 3 segundos...");
            
            // Cambiar estado a "ready" (preludio al inicio)
            await update(ref(db, `rooms/${this.currentRoomId}`), { status: "ready" });
            
            // Esperar 3 segundos y luego iniciar
            setTimeout(async () => {
                await update(ref(db, `rooms/${this.currentRoomId}`), { status: "playing" });
            }, 3000);
        }
    }

    // 🔹 Escuchar cambios en la sala
    _listenToRoom() {
        const roomRef = ref(db, `rooms/${this.currentRoomId}`);
        
        onValue(roomRef, (snapshot) => {
            const roomData = snapshot.val();
            
            if (!roomData) {
                console.log("❌ La sala fue eliminada");
                return;
            }

            console.log("📡 Actualización de sala:", roomData.status);

            // Callback para actualizar UI
            if (this.onRoomUpdate) {
                this.onRoomUpdate(roomData);
            }

            // Si el estado cambia a "playing", iniciar juego
            if (roomData.status === "playing" && this.onGameStart) {
                console.log("🚀 ¡Iniciando juego!");
                this.onGameStart();
            }
        });
    }

    // 🔹 Actualizar posición del jugador
    async updatePlayerPosition(x, z, animation = "idle") {
        if (!this.currentRoomId || !this.currentUserId) return;

        await update(ref(db, `rooms/${this.currentRoomId}/players/${this.currentUserId}`), {
            x: Math.round(x * 100) / 100, // Redondear para reducir tráfico
            z: Math.round(z * 100) / 100,
            animation: animation,
            timestamp: Date.now()
        });
    }

    // 🔹 Escuchar posiciones de otros jugadores
    listenToOtherPlayers(callback) {
        if (!this.currentRoomId || !this.currentUserId) return;

        const playersRef = ref(db, `rooms/${this.currentRoomId}/players`);
        
        onValue(playersRef, (snapshot) => {
            const players = snapshot.val();
            if (!players) return;

            // Filtrar solo el otro jugador
            const otherPlayers = Object.entries(players)
                .filter(([id, _]) => id !== this.currentUserId)
                .map(([id, data]) => ({ id, ...data }));

            callback(otherPlayers);
        });
    }

    // 🔹 Salir de la sala
    async leaveRoom() {
        if (!this.currentRoomId || !this.currentUserId) return;

        // Si eres el host, eliminar toda la sala
        if (this.isHost) {
            await remove(ref(db, `rooms/${this.currentRoomId}`));
            console.log("🏠 Sala eliminada (eras el host)");
        } else {
            // Si eres guest, solo eliminarte
            await update(ref(db, `rooms/${this.currentRoomId}`), { guest: null });
            await remove(ref(db, `rooms/${this.currentRoomId}/players/${this.currentUserId}`));
            console.log("👋 Saliste de la sala (eras guest)");
        }

        this.currentRoomId = null;
    }
}