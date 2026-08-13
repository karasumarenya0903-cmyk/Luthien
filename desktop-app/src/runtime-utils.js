(function exposeRuntimeUtils(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.PetRuntime = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createRuntimeUtils() {
  "use strict";

  function keyboardVector(pressedCodes) {
    const pressed = pressedCodes instanceof Set ? pressedCodes : new Set(pressedCodes || []);
    let x = 0;
    let y = 0;
    if (pressed.has("KeyA")) x -= 1;
    if (pressed.has("KeyD")) x += 1;
    if (pressed.has("KeyW")) y -= 1;
    if (pressed.has("KeyS")) y += 1;

    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    return { x, y, active: length > 0 };
  }

  function keyboardStep(position, pressedCodes, shiftHeld, speed, accelerationMultiplier, dtSeconds) {
    const vector = keyboardVector(pressedCodes);
    if (!vector.active) return { ...position };
    const multiplier = shiftHeld ? accelerationMultiplier : 1;
    return {
      x: position.x + vector.x * speed * multiplier * dtSeconds,
      y: position.y + vector.y * speed * multiplier * dtSeconds
    };
  }

  function followStep(position, target, responseRate, dtSeconds) {
    const alpha = 1 - Math.exp(-Math.max(0, responseRate) * Math.max(0, dtSeconds));
    return {
      x: position.x + (target.x - position.x) * alpha,
      y: position.y + (target.y - position.y) * alpha
    };
  }

  function clampPosition(position, windowSize, workArea) {
    const minX = workArea.x;
    const minY = workArea.y;
    const maxX = Math.max(minX, workArea.x + workArea.width - windowSize.width);
    const maxY = Math.max(minY, workArea.y + workArea.height - windowSize.height);
    return {
      x: Math.min(maxX, Math.max(minX, position.x)),
      y: Math.min(maxY, Math.max(minY, position.y))
    };
  }

  return {
    clampPosition,
    followStep,
    keyboardStep,
    keyboardVector
  };
});
