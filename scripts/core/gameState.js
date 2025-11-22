// VARIABLES GLOBALES DEL JUEGO
export const gameState = {
  esmeraldas: 10,
  diamantes: 0,
  // ⚡ POTENCIADOR THUNDER
  thunderActive: false,
  thunderTime: 0,
  thunderTimeout: null,
  thunderInterval: null,

  reset() {
    this.esmeraldas = 10;
    this.diamantes = 0;
    this.thunderActive=false;
  }
};
