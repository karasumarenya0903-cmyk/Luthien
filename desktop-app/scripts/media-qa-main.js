"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow } = require("electron");

const libraryRoot = path.resolve(__dirname, "..", "..", "pets");
const reportPath = path.resolve(__dirname, "..", "qa", "media-report.json");

async function run() {
  const catalog = JSON.parse(fs.readFileSync(path.join(libraryRoot, "catalog.json"), "utf8"));
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: true
    }
  });
  await window.loadFile(path.join(__dirname, "media-qa.html"));

  const pets = {};
  for (const pet of catalog.pets) {
    const petRoot = path.join(libraryRoot, pet.libraryPath);
    const behavior = JSON.parse(fs.readFileSync(path.join(petRoot, "behavior.json"), "utf8"));
    const states = {};
    for (const [stateName, state] of Object.entries(behavior.states)) {
      const assetUrl = pathToFileURL(path.resolve(petRoot, state.asset)).href;
      states[stateName] = await window.webContents.executeJavaScript(
        `window.probeWebM(${JSON.stringify(assetUrl)})`,
        true
      );
    }
    pets[pet.id] = { ok: Object.values(states).every((state) => state.ok), states };
  }

  const report = {
    ok: Object.values(pets).every((pet) => pet.ok),
    generatedAt: new Date().toISOString(),
    pets
  };
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  window.destroy();
  app.exit(report.ok ? 0 : 1);
}

app.whenReady().then(run).catch((error) => {
  console.error(error);
  app.exit(1);
});

