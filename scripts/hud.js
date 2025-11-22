// Variables mutables a través de objetos
export const esmeraldas = { value: 10 };
export const diamantes = { value: 0 };

export function updateHUD() {
  const e = document.getElementById("esmeraldas");
  const d = document.getElementById("diamantes");

  if (e) e.textContent = esmeraldas.value;
  if (d) d.textContent = diamantes.value;
}
