"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  clampPosition,
  followStep,
  keyboardStep,
  keyboardVector
} = require("../src/runtime-utils");

test("every pet interaction always returns to relax", () => {
  const libraryRoot = path.resolve(__dirname, "..", "..", "pets");
  const catalog = JSON.parse(fs.readFileSync(path.join(libraryRoot, "catalog.json"), "utf8"));
  assert.ok(catalog.pets.length >= 3);
  for (const pet of catalog.pets) {
    const behavior = JSON.parse(
      fs.readFileSync(path.join(libraryRoot, pet.libraryPath, "behavior.json"), "utf8")
    );
    assert.equal(behavior.input.leftClick.returnMode, "relax", pet.id);
    assert.equal(behavior.states.interact.returnToMode, "relax", pet.id);
    if (behavior.states.special) {
      assert.equal(behavior.states.special.returnToMode, "relax", pet.id);
      assert.equal(behavior.input.doubleLeftClick.returnMode, "relax", pet.id);
    }
    assert.ok(!behavior.input.leftClick.sequence.includes("advance-base-mode"), pet.id);
  }
});

test("renderer uses decoded keyframes and a continuous interaction return wipe", () => {
  const rendererRoot = path.resolve(__dirname, "..", "src", "renderer");
  const html = fs.readFileSync(path.join(rendererRoot, "index.html"), "utf8");
  const js = fs.readFileSync(path.join(rendererRoot, "app.js"), "utf8");
  assert.equal((html.match(/class="pet-video"/g) || []).length, 2);
  assert.match(js, /KEYFRAME_TRANSITION_MS\s*=\s*220/);
  assert.match(js, /INTERACTION_RETURN_MS\s*=\s*560/);
  assert.match(js, /requestVideoFrameCallback/);
  assert.match(js, /offset:\s*0\.49/);
  assert.match(js, /offset:\s*0\.5/);
  assert.match(js, /transitionKind === "interaction-return"/);
  assert.match(js, /clipPath/);
  assert.ok(!js.includes(".finished"));
  assert.ok(!js.includes("CROSSFADE_MS"));
});

test("move left click returns to relax without playing interact", () => {
  const js = fs.readFileSync(
    path.resolve(__dirname, "..", "src", "renderer", "app.js"),
    "utf8"
  );
  assert.match(js, /if \(currentBaseMode === "move"\)/);
  assert.match(js, /stage\.addEventListener\("pointerdown"/);
  assert.match(js, /suppressClickUntil = performance\.now\(\)/);
  assert.match(js, /await activateBaseMode\(config\.interactionReturnMode\)/);
  assert.match(js, /return;\s*}\s*await playInteraction\(\)/);
  assert.match(js, /qaMoveReturnRepeats/);
  assert.match(js, /dispatchEvent\(new PointerEvent\("pointerdown"/);
  assert.match(js, /before-move-exit-/);
  assert.match(js, /after-move-exit-/);
  assert.match(js, /transitionChain\.then/);
});

test("optional special state uses double click and the interaction return transition", () => {
  const rendererJs = fs.readFileSync(
    path.resolve(__dirname, "..", "src", "renderer", "app.js"),
    "utf8"
  );
  const mainJs = fs.readFileSync(path.resolve(__dirname, "..", "src", "main.js"), "utf8");
  assert.match(rendererJs, /DOUBLE_CLICK_DELAY_MS\s*=\s*320/);
  assert.match(rendererJs, /config\.states\.special/);
  assert.match(rendererJs, /event\.detail >= 2/);
  assert.match(rendererJs, /startOneShot\("special"\)/);
  assert.match(rendererJs, /new MouseEvent\("click", \{ button: 0, bubbles: true, detail: 2 \}\)/);
  assert.match(rendererJs, /activateBaseMode\(config\.interactionReturnMode, "interaction-return"\)/);
  assert.match(mainJs, /\["relax", "interact", "special", "sit", "sleep", "move"\]/);
  assert.match(mainJs, /fileMap\.special \? \[\.\.\.required, "special"\]/);
});

test("selector exposes user import and imported-only deletion", () => {
  const selectorRoot = path.resolve(__dirname, "..", "src", "selector");
  const selectorJs = fs.readFileSync(path.join(selectorRoot, "selector.js"), "utf8");
  const mainJs = fs.readFileSync(path.resolve(__dirname, "..", "src", "main.js"), "utf8");
  assert.match(selectorJs, /document\.createElement\("video"\)/);
  assert.match(selectorJs, /document\.createElement\("canvas"\)/);
  assert.match(selectorJs, /icon\.removeAttribute\("src"\)/);
  assert.match(selectorJs, /window\.desktopPet\.importPet\(\)/);
  assert.match(selectorJs, /pet\.source === "imported"/);
  assert.match(selectorJs, /pet\.hasSpecial/);
  assert.match(mainJs, /hasSpecial: Boolean\(behavior\.states\.special\)/);
  assert.match(selectorJs, /window\.desktopPet\.deleteImportedPet\(pet\.id\)/);
  assert.match(mainJs, /dialog\.showOpenDialog/);
  assert.match(mainJs, /dialog\.showMessageBox/);
  assert.match(mainJs, /app\.getPath\("userData"\)/);
  assert.match(mainJs, /pet\.source !== "imported"/);
  assert.match(mainJs, /fs\.rmSync\(targetRoot, \{ recursive: true, force: true \}\)/);
  assert.match(mainJs, /ipcMain\.handle\("pet:delete-imported"/);
  assert.match(mainJs, /可额外选择 Special/);
  for (const state of ["relax", "interact", "special", "sit", "sleep", "move"]) {
    assert.match(mainJs, new RegExp(`"${state}"`));
  }
});

test("diagonal keyboard movement is normalized", () => {
  const vector = keyboardVector(["KeyW", "KeyD"]);
  assert.ok(Math.abs(Math.hypot(vector.x, vector.y) - 1) < 1e-9);
});

test("shift doubles keyboard movement", () => {
  const normal = keyboardStep({ x: 0, y: 0 }, ["KeyD"], false, 100, 2, 1);
  const fast = keyboardStep({ x: 0, y: 0 }, ["KeyD"], true, 100, 2, 1);
  assert.equal(normal.x, 100);
  assert.equal(fast.x, 200);
});

test("pointer following approaches without overshooting", () => {
  const next = followStep({ x: 0, y: 0 }, { x: 100, y: 80 }, 7.5, 0.016);
  assert.ok(next.x > 0 && next.x < 100);
  assert.ok(next.y > 0 && next.y < 80);
});

test("window position stays inside the display work area", () => {
  const clamped = clampPosition(
    { x: 2000, y: -50 },
    { width: 420, height: 420 },
    { x: 0, y: 0, width: 1920, height: 1080 }
  );
  assert.deepEqual(clamped, { x: 1500, y: 0 });
});
