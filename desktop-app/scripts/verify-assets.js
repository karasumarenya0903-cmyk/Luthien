"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const libraryRoot = path.resolve(__dirname, "..", "..", "pets");
const catalog = JSON.parse(fs.readFileSync(path.join(libraryRoot, "catalog.json"), "utf8"));
const expectedModes = ["relax", "sit", "sleep", "move"];
const requiredStates = [...expectedModes, "interact"];
const expectedStates = new Set([...requiredStates, "special"]);
let verifiedAssets = 0;

function fail(message) {
  throw new Error(message);
}

for (const pet of catalog.pets) {
  const petRoot = path.join(libraryRoot, pet.libraryPath);
  const behavior = JSON.parse(fs.readFileSync(path.join(petRoot, "behavior.json"), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(petRoot, "asset-manifest.json"), "utf8"));
  const manifestByState = new Map(manifest.assets.map((asset) => [asset.state, asset]));

  if (behavior.petId !== pet.id) fail(`${pet.id}: behavior petId mismatch.`);
  if (behavior.initialMode !== "relax") fail(`${pet.id}: initial mode must be relax.`);
  if (behavior.input.leftClick.returnMode !== "relax") fail(`${pet.id}: left click must return to relax.`);
  if (behavior.states.interact.returnToMode !== "relax") fail(`${pet.id}: interact must return to relax.`);
  for (const requiredState of requiredStates) {
    if (!behavior.states[requiredState]) fail(`${pet.id}: missing required state ${requiredState}.`);
  }
  if (behavior.states.special) {
    if (behavior.states.special.returnToMode !== "relax") fail(`${pet.id}: special must return to relax.`);
    if (behavior.input.doubleLeftClick?.returnMode !== "relax") {
      fail(`${pet.id}: double left click must return to relax.`);
    }
  }
  if (behavior.input.leftClick.sequence.includes("advance-base-mode")) {
    fail(`${pet.id}: left click must not advance to another base mode.`);
  }
  if (JSON.stringify(behavior.baseModeCycle) !== JSON.stringify(expectedModes)) {
    fail(`${pet.id}: unexpected selectable modes: ${behavior.baseModeCycle.join(", ")}`);
  }

  for (const [stateName, state] of Object.entries(behavior.states)) {
    if (!expectedStates.has(stateName)) fail(`${pet.id}: unexpected state ${stateName}.`);
    const assetPath = path.resolve(petRoot, state.asset);
    if (!assetPath.startsWith(petRoot + path.sep)) fail(`${pet.id}: unsafe asset path ${state.asset}.`);
    const bytes = fs.readFileSync(assetPath);
    if (bytes.length < 1024) fail(`${pet.id}/${stateName} is unexpectedly small.`);
    if (!(bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3)) {
      fail(`${pet.id}/${stateName} is not WebM/Matroska.`);
    }
    const manifestAsset = manifestByState.get(stateName);
    if (!manifestAsset) fail(`${pet.id}/${stateName} is missing from asset-manifest.json.`);
    const hash = crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase();
    if (hash !== manifestAsset.sha256) fail(`${pet.id}/${stateName} SHA-256 mismatch.`);
    verifiedAssets += 1;
  }
}

console.log(`Verified ${verifiedAssets} WebM states across ${catalog.pets.length} pets.`);
