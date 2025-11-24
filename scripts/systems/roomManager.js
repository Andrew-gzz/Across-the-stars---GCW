// scripts/systems/roomManager.js
import { auth, db, ref, set, onValue, get, remove, onDisconnect, update } from '../config/firebase.js';

export class RoomManager {
    constructor() {
        this.currentRoomId = null;
        this.currentUserId = null;
        this.isHost = false;
        this.onRoomUpdate = null;
        this.onGameStart = null;
    }

    // 🔹 Crear una sala con código personalizado
    async createRoom(customCode = null, level = 3) {
        if (!auth.currentUser) {
            throw new Error("Debes iniciar sesión primero");
        }

        this.currentUserId = auth.currentUser.uid;
        
        // Si hay código personalizado, usarlo; si no, generar uno aleatorio
        const roomCode = customCode 
            ? customCode.toUpperCase().trim()
            : this._generateRoomCode();
        
        this.currentRoomId = `room_${roomCode}`;
        this.isHost = true;

        // Verificar si la sala ya existe
        const existingRoom = await get(ref(db, `rooms/${this.currentRoomId}`));
        if (existingRoom.exists()) {
            throw new Error(`Ya existe una sala con el código "${roomCode}". Usa otro código.`);
        }

        const roomData = {
            code: roomCode, // Guardar código legible
            host: this.currentUserId,
            guest: null,
            status: "waiting",
            level: level,
            createdAt: Date.now(),
            players: {
                [this.currentUserId]: {
                    name: auth.currentUser.displayName || "Player 1",
                    photoURL: auth.currentUser.photoURL || "/Img/pfp.jpg",
                    ready: false,
                    x: 0,
                    z: 20,
                    animation: "idle",
                    timestamp: Date.now()
                }
            }
        };

        await set(ref(db, `rooms/${this.currentRoomId}`), roomData);
        
        // Configurar limpieza automática
        const roomRef = ref(db, `rooms/${this.currentRoomId}`);
        onDisconnect(roomRef).remove();

        console.log("✅ Sala creada con código:", roomCode);
        this._listenToRoom();
        
        return roomCode;
    }

    // 🔹 Unirse a una sala usando código
    async joinRoomByCode(roomCode) {
        if (!auth.currentUser) {
            throw new Error("Debes iniciar sesión primero");
        }

        this.currentUserId = auth.currentUser.uid;
        
        const cleanCode = roomCode.toUpperCase().trim();
        this.currentRoomId = `room_${cleanCode}`;

        try {
            // Intentar obtener la sala
            const snapshot = await get(ref(db, `rooms/${this.currentRoomId}`));

            if (!snapshot.exists()) {
                throw new Error(`No existe una sala con el código "${cleanCode}"`);
            }

            const roomData = snapshot.val();

            // Verificar que no seas el host tratando de unirte a tu propia sala
            if (roomData.host === this.currentUserId) {
                throw new Error("No puedes unirte a tu propia sala");
            }

            // Verificar que la sala está disponible
            if (roomData.guest !== null && roomData.guest !== undefined) {
                throw new Error("Esta sala ya está llena (2/2 jugadores)");
            }

            if (roomData.status !== "waiting") {
                throw new Error("Esta sala ya comenzó o finalizó");
            }

            this.isHost = false;

            // Unirse a la sala
            await update(ref(db, `rooms/${this.currentRoomId}`), {
                guest: this.currentUserId
            });

            await set(ref(db, `rooms/${this.currentRoomId}/players/${this.currentUserId}`), {
                name: auth.currentUser.displayName || "Player 2",
                photoURL: auth.currentUser.photoURL || "/Img/pfp.jpg",
                ready: false,
                x: 0,
                z: 20,
                animation: "idle",
                timestamp: Date.now()
            });

            // Configurar limpieza si se desconecta
            const playerRef = ref(db, `rooms/${this.currentRoomId}/players/${this.currentUserId}`);
            onDisconnect(playerRef).remove();

            console.log("✅ Unido a sala:", cleanCode);
            this._listenToRoom();

            return cleanCode;

        } catch (error) {
            console.error("❌ Error al unirse:", error);
            throw error;
        }
    }

    // 🔹 Generar código aleatorio de 6 caracteres
    _generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // 🔹 Marcar jugador como "listo"
    async setReady(ready = true) {
        if (!this.currentRoomId || !this.currentUserId) return;

        await update(
            ref(db, `rooms/${this.currentRoomId}/players/${this.currentUserId}`),
            { ready: ready }
        );

        console.log(`✅ ${ready ? 'Listo' : 'No listo'}`);
        await this._checkBothReady();
    }

    // 🔹 Verificar si ambos están listos
    async _checkBothReady() {
        const snapshot = await get(ref(db, `rooms/${this.currentRoomId}/players`));
        const players = snapshot.val();

        if (!players) return;

        const playerList = Object.values(players);
        
        if (playerList.length === 2 && playerList.every(p => p.ready)) {
            console.log("🎮 ¡Ambos jugadores listos!");
            
            await update(ref(db, `rooms/${this.currentRoomId}`), { status: "ready" });
            
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

            if (this.onRoomUpdate) {
                this.onRoomUpdate(roomData);
            }

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
            x: Math.round(x * 100) / 100,
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

            const otherPlayers = Object.entries(players)
                .filter(([id, _]) => id !== this.currentUserId)
                .map(([id, data]) => ({ id, ...data }));

            callback(otherPlayers);
        });
    }

    // 🔹 Salir de la sala
    async leaveRoom() {
        if (!this.currentRoomId || !this.currentUserId) return;

        if (this.isHost) {
            await remove(ref(db, `rooms/${this.currentRoomId}`));
            console.log("🏠 Sala eliminada (eras el host)");
        } else {
            await update(ref(db, `rooms/${this.currentRoomId}`), { guest: null });
            await remove(ref(db, `rooms/${this.currentRoomId}/players/${this.currentUserId}`));
            console.log("👋 Saliste de la sala (eras guest)");
        }

        this.currentRoomId = null;
    }
}