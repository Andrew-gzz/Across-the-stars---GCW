// scripts/core/input.js
export const input = {
  _keys: { left: false, right: false, up: false, down: false }
};

window.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") input._keys.left = true;
  if (e.key === "ArrowRight") input._keys.right = true;
  if (e.key === "ArrowUp") input._keys.up = true;
  if (e.key === "ArrowDown") input._keys.down = true;
});

window.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") input._keys.left = false;
  if (e.key === "ArrowRight") input._keys.right = false;
  if (e.key === "ArrowUp") input._keys.up = false;
  if (e.key === "ArrowDown") input._keys.down = false;
});
