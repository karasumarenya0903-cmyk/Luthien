"use strict";

const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow, dialog, ipcMain, Menu, screen } = require("electron");
const { clampPosition, followStep, keyboardStep } = require("./runtime-utils");

const WINDOW_MAX_SIZE = 420;
const KEYBOARD_SPEED = 260;
const POINTER_RESPONSE_RATE = 7.5;

let petWindow = null;
let selectorWindow = null;
let petCatalog = [];
let petConfig = null;
let activePetId = null;
let activeMode = "relax";
let pressedCodes = new Set();
let shiftHeld = false;
let movementTimer = null;
let lastMovementTime = 0;
let mediaSized = false;
const qaCheckpoints = {};

if (process.env.ARKPETS_QA_USER_DATA) {
  app.setPath("userData", path.resolve(process.env.ARKPETS_QA_USER_DATA));
}

function setMacDockVisible(visible) {
  if (process.platform !== "darwin" || !app.dock) return;
  if (visible) app.dock.show();
  else app.dock.hide();
}

function configureMacApplicationMenu() {
  if (process.platform !== "darwin") return;
  const menu = Menu.buildFromTemplate([
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    { role: "editMenu" },
    { role: "windowMenu" }
  ]);
  Menu.setApplicationMenu(menu);
}

function libraryRoot() {
  if (process.env.ARKPETS_LIBRARY_ROOT) {
    return path.resolve(process.env.ARKPETS_LIBRARY_ROOT);
  }
  return app.isPackaged
    ? path.join(process.resourcesPath, "pets")
    : path.resolve(__dirname, "..", "..", "pets");
}

function assertInside(root, candidate) {
  const normalizedRoot = path.resolve(root) + path.sep;
  const normalizedCandidate = path.resolve(candidate);
  if (!normalizedCandidate.startsWith(normalizedRoot)) {
    throw new Error(`Asset path escapes the pet library: ${candidate}`);
  }
  return normalizedCandidate;
}

function loadCatalog() {
  const catalogPath = path.join(libraryRoot(), "catalog.json");
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const builtIn = catalog.pets.map((pet) => ({
    ...pet,
    petRoot: path.join(libraryRoot(), pet.libraryPath),
    source: "built-in"
  }));
  const importedRoot = path.join(app.getPath("userData"), "imported-pets");
  const importedCatalogPath = path.join(importedRoot, "catalog.json");
  let imported = [];
  if (fs.existsSync(importedCatalogPath)) {
    const importedCatalog = JSON.parse(fs.readFileSync(importedCatalogPath, "utf8"));
    imported = importedCatalog.pets.map((pet) => ({
      ...pet,
      petRoot: path.join(importedRoot, pet.libraryPath),
      source: "imported"
    }));
  }
  return [...builtIn, ...imported].filter((pet) =>
    fs.existsSync(path.join(pet.petRoot, "behavior.json"))
  );
}

function publicCatalog() {
  return petCatalog.map((pet) => {
    const behavior = JSON.parse(fs.readFileSync(path.join(pet.petRoot, "behavior.json"), "utf8"));
    const relaxPath = assertInside(pet.petRoot, path.resolve(pet.petRoot, behavior.states.relax.asset));
    return {
      id: pet.id,
      displayName: pet.displayName,
      characterName: pet.characterName,
      source: pet.source,
      hasSpecial: Boolean(behavior.states.special),
      iconUrl: pathToFileURL(relaxPath).href
    };
  });
}

function loadPetConfig(petId) {
  if (!petCatalog.some((pet) => pet.id === petId)) {
    throw new Error(`Unknown pet id: ${petId}`);
  }
  const catalogPet = petCatalog.find((pet) => pet.id === petId);
  const petRoot = catalogPet.petRoot;
  const behaviorPath = path.join(petRoot, "behavior.json");
  const behavior = JSON.parse(fs.readFileSync(behaviorPath, "utf8"));
  const states = {};

  for (const [stateName, state] of Object.entries(behavior.states)) {
    const assetPath = assertInside(petRoot, path.resolve(petRoot, state.asset));
    if (!fs.existsSync(assetPath)) {
      throw new Error(`Missing ${petId}/${stateName} asset: ${assetPath}`);
    }
    states[stateName] = {
      loop: Boolean(state.loop),
      url: pathToFileURL(assetPath).href
    };
  }

  return {
    petId,
    displayName: behavior.displayName,
    initialMode: behavior.initialMode,
    baseModeCycle: behavior.baseModeCycle,
    interactionReturnMode: behavior.input.leftClick.returnMode,
    accelerationMultiplier: behavior.input.moveMode.keyboard.accelerationMultiplier,
    qaInteraction: process.env.ARKPETS_QA_INTERACTION === "1",
    qaSpecial: process.env.ARKPETS_QA_SPECIAL === "1",
    qaMoveReturnRepeats: Math.max(0, Number.parseInt(
      process.env.ARKPETS_QA_MOVE_RETURN_REPEATS ||
        (process.env.ARKPETS_QA_MOVE_RETURN === "1" ? "1" : "0"),
      10
    ) || 0),
    states
  };
}

function directoryBytes(directoryPath) {
  if (!fs.existsSync(directoryPath)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name);
    total += entry.isDirectory() ? directoryBytes(entryPath) : fs.statSync(entryPath).size;
  }
  return total;
}

async function deleteImportedPet(petId, options = {}) {
  const pet = petCatalog.find((entry) => entry.id === petId);
  if (!pet || pet.source !== "imported") {
    return { ok: false, error: "只能删除用户导入的桌宠。" };
  }

  if (!options.skipConfirmation) {
    const owner = selectorWindow || petWindow;
    const result = await dialog.showMessageBox(owner, {
      type: "warning",
      title: "删除导入的桌宠",
      message: `确定删除 ${pet.displayName}？`,
      detail: "这会永久删除该桌宠保存在本机的五个或六个 WebM 动画，且无法撤销。",
      buttons: ["取消", "删除"],
      defaultId: 0,
      cancelId: 0,
      noLink: true
    });
    if (result.response !== 1) return { ok: false, canceled: true };
  }

  try {
    const importedRoot = path.join(app.getPath("userData"), "imported-pets");
    const charactersRoot = path.resolve(importedRoot, "characters");
    const targetRoot = path.resolve(pet.petRoot);
    if (!targetRoot.startsWith(charactersRoot + path.sep)) {
      throw new Error("导入目录不安全，已取消删除。");
    }

    const reclaimedBytes = directoryBytes(targetRoot);
    const catalogPath = path.join(importedRoot, "catalog.json");
    let importedCatalog = { schemaVersion: 1, pets: [] };
    if (fs.existsSync(catalogPath)) {
      importedCatalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    }
    importedCatalog.pets = importedCatalog.pets.filter((entry) => entry.id !== petId);
    fs.rmSync(targetRoot, { recursive: true, force: true });
    fs.writeFileSync(catalogPath, JSON.stringify(importedCatalog, null, 2) + "\n");
    petCatalog = loadCatalog();
    return { ok: true, displayName: pet.displayName, reclaimedBytes, pets: publicCatalog() };
  } catch (error) {
    return { ok: false, canceled: false, error: error.message };
  }
}

function stateFromFilename(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  for (const state of ["relax", "interact", "special", "sit", "sleep", "move"]) {
    if (new RegExp(`(?:^|[-_ ])${state}(?:[-_ ]|$)`, "i").test(basename)) return state;
  }
  return null;
}

function inferImportedName(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  return basename
    .replace(/[-_ ](?:Relax|Interact|Special|Sit|Sleep|Move)(?:[-_ ]x\d+)?$/i, "")
    .replace(/[-_ ]基建$/i, "")
    .replace(/[-_ ]默认$/i, "")
    .trim() || "Imported Pet";
}

function safeImportedId(displayName, fileMap) {
  const digest = crypto.createHash("sha256")
    .update(displayName)
    .update(Object.values(fileMap).sort().join("|"))
    .digest("hex")
    .slice(0, 12);
  return `imported-${digest}`;
}

function validateWebM(filePath) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size < 1024) throw new Error(`${path.basename(filePath)} 不是有效的动画文件。`);
  const fd = fs.openSync(filePath, "r");
  const magic = Buffer.alloc(4);
  fs.readSync(fd, magic, 0, 4, 0);
  fs.closeSync(fd);
  if (!magic.equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    throw new Error(`${path.basename(filePath)} 不是 WebM/Matroska 文件。`);
  }
}

async function importPet() {
  let selectedPaths;
  if (process.env.ARKPETS_QA_IMPORT_FILES) {
    selectedPaths = JSON.parse(process.env.ARKPETS_QA_IMPORT_FILES);
  } else {
    const owner = selectorWindow || petWindow;
    const result = await dialog.showOpenDialog(owner, {
      title: "选择五个基础 WebM，可额外选择 Special",
      buttonLabel: "导入桌宠",
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "WebM 动画", extensions: ["webm"] }]
    });
    if (result.canceled) return { ok: false, canceled: true };
    selectedPaths = result.filePaths;
  }

  try {
    const fileMap = {};
    for (const filePath of selectedPaths) {
      validateWebM(filePath);
      const state = stateFromFilename(filePath);
      if (!state) throw new Error(`无法从文件名识别动作：${path.basename(filePath)}`);
      if (fileMap[state]) throw new Error(`动作 ${state} 被选择了两次。`);
      fileMap[state] = filePath;
    }
    const required = ["relax", "interact", "sit", "sleep", "move"];
    const missing = required.filter((state) => !fileMap[state]);
    if (missing.length) throw new Error(`缺少动作文件：${missing.join(", ")}`);
    const selectedStates = fileMap.special ? [...required, "special"] : required;

    const displayName = inferImportedName(fileMap.relax);
    const petId = safeImportedId(displayName, fileMap);
    const importedRoot = path.join(app.getPath("userData"), "imported-pets");
    const petRoot = path.join(importedRoot, "characters", petId);
    const assetDir = path.join(petRoot, "assets", "source-webm");
    fs.mkdirSync(assetDir, { recursive: true });

    const states = {};
    const assets = [];
    for (const state of selectedStates) {
      const target = path.join(assetDir, `${state}.webm`);
      fs.copyFileSync(fileMap[state], target);
      const bytes = fs.readFileSync(target);
      const sha256 = crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase();
      states[state] = state === "interact" || state === "special"
        ? { asset: `assets/source-webm/${state}.webm`, loop: false, returnToMode: "relax" }
        : { asset: `assets/source-webm/${state}.webm`, loop: true };
      assets.push({ state, path: `assets/source-webm/${state}.webm`, bytes: bytes.length, sha256 });
    }

    const behavior = {
      schemaVersion: 1,
      petId,
      displayName,
      initialMode: "relax",
      baseModeCycle: ["relax", "sit", "sleep", "move"],
      states,
      input: {
        leftClick: { sequence: ["play-interact-once", "return-to-relax"], returnMode: "relax" },
        ...(fileMap.special ? {
          doubleLeftClick: { sequence: ["play-special-once", "return-to-relax"], returnMode: "relax" }
        } : {}),
        moveMode: {
          followPointer: true,
          keyboard: {
            up: "KeyW", left: "KeyA", down: "KeyS", right: "KeyD",
            accelerationModifier: ["ShiftLeft", "ShiftRight"],
            accelerationMultiplier: 2,
            whileDirectionalKeyHeld: "keyboard-overrides-pointer-follow",
            onDirectionalKeyRelease: "resume-pointer-follow"
          }
        }
      }
    };
    fs.writeFileSync(path.join(petRoot, "behavior.json"), JSON.stringify(behavior, null, 2) + "\n");
    fs.writeFileSync(path.join(petRoot, "asset-manifest.json"), JSON.stringify({
      schemaVersion: 1, petId, displayName, characterName: displayName, sourceSet: "user-import", assets
    }, null, 2) + "\n");

    const catalogPath = path.join(importedRoot, "catalog.json");
    let catalog = { schemaVersion: 1, pets: [] };
    if (fs.existsSync(catalogPath)) catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
    const entry = {
      id: petId,
      displayName,
      characterName: displayName,
      libraryPath: `characters/${petId}`,
      status: "user-imported"
    };
    catalog.pets = [...catalog.pets.filter((pet) => pet.id !== petId), entry];
    fs.mkdirSync(importedRoot, { recursive: true });
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
    petCatalog = loadCatalog();
    return { ok: true, petId, displayName, pets: publicCatalog() };
  } catch (error) {
    return { ok: false, canceled: false, error: error.message };
  }
}

function initialWindowPosition(width, height) {
  const workArea = screen.getPrimaryDisplay().workArea;
  return {
    x: Math.round(workArea.x + workArea.width - width - 36),
    y: Math.round(workArea.y + workArea.height - height - 24)
  };
}

function createPetWindow(petId) {
  setMacDockVisible(false);
  petConfig = loadPetConfig(petId);
  activePetId = petId;
  activeMode = petConfig.initialMode;
  mediaSized = false;

  const initialSize = { width: WINDOW_MAX_SIZE, height: WINDOW_MAX_SIZE };
  const initialPosition = initialWindowPosition(initialSize.width, initialSize.height);
  petWindow = new BrowserWindow({
    ...initialSize,
    ...initialPosition,
    transparent: true,
    backgroundColor: "#00000000",
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    roundedCorners: false,
    show: false,
    title: petConfig.displayName,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  petWindow.setAlwaysOnTop(true, "floating");
  petWindow.setMenuBarVisibility(false);
  petWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  petWindow.once("ready-to-show", () => {
    if (!process.env.ARKPETS_QA_SCREENSHOT) {
      petWindow.show();
      petWindow.focus();
    }
  });
  petWindow.on("closed", () => {
    petWindow = null;
    stopMovementLoop();
  });
}

function createSelectorWindow(closePet = false) {
  if (selectorWindow && !selectorWindow.isDestroyed()) {
    setMacDockVisible(true);
    selectorWindow.show();
    selectorWindow.focus();
    return;
  }

  setMacDockVisible(true);

  selectorWindow = new BrowserWindow({
    width: 720,
    height: 620,
    minWidth: 560,
    minHeight: 430,
    center: true,
    frame: false,
    resizable: true,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    backgroundColor: "#10141f",
    title: "Arkpets Desktop Pets",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  selectorWindow.setMenuBarVisibility(false);
  selectorWindow.loadFile(path.join(__dirname, "selector", "index.html"));
  selectorWindow.webContents.once("did-finish-load", async () => {
    if (process.env.ARKPETS_QA_IMPORT_FILES) {
      const importResult = await importPet();
      if (importResult.ok && process.env.ARKPETS_QA_DELETE_IMPORTED === "1") {
        await deleteImportedPet(importResult.petId, { skipConfirmation: true });
      }
      selectorWindow?.webContents.send("pet:catalog-updated", publicCatalog());
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const screenshotPath = process.env.ARKPETS_QA_SELECTOR_SCREENSHOT;
    if (!screenshotPath || !selectorWindow) return;
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await selectorWindow.webContents.executeJavaScript("window.scrollTo(0, 0)");
    const image = await selectorWindow.webContents.capturePage();
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    fs.writeFileSync(screenshotPath, image.toPNG());
    app.quit();
  });
  selectorWindow.on("closed", () => {
    selectorWindow = null;
    if (!petWindow) app.quit();
  });

  if (closePet && petWindow) {
    const oldWindow = petWindow;
    petWindow = null;
    stopMovementLoop();
    oldWindow.destroy();
  }
}

function choosePet(petId) {
  if (!petCatalog.some((pet) => pet.id === petId)) return;
  if (petWindow) {
    const oldWindow = petWindow;
    petWindow = null;
    oldWindow.destroy();
  }
  stopMovementLoop();
  createPetWindow(petId);
  if (selectorWindow) {
    const oldSelector = selectorWindow;
    selectorWindow = null;
    oldSelector.destroy();
  }
}

function currentWorkArea(bounds) {
  return screen.getDisplayMatching(bounds).workArea;
}

function movementTick() {
  if (!petWindow || petWindow.isDestroyed() || activeMode !== "move") return;
  const now = performance.now();
  const dt = Math.min(0.05, Math.max(0, (now - lastMovementTime) / 1000));
  lastMovementTime = now;
  const bounds = petWindow.getBounds();
  const position = { x: bounds.x, y: bounds.y };
  let nextPosition;

  if (pressedCodes.size > 0) {
    nextPosition = keyboardStep(
      position,
      pressedCodes,
      shiftHeld,
      KEYBOARD_SPEED,
      petConfig.accelerationMultiplier,
      dt
    );
  } else {
    const cursor = screen.getCursorScreenPoint();
    nextPosition = followStep(position, {
      x: cursor.x - bounds.width / 2,
      y: cursor.y - bounds.height / 2
    }, POINTER_RESPONSE_RATE, dt);
  }

  const clamped = clampPosition(
    nextPosition,
    { width: bounds.width, height: bounds.height },
    currentWorkArea(bounds)
  );
  petWindow.setPosition(Math.round(clamped.x), Math.round(clamped.y), false);
}

function startMovementLoop() {
  if (movementTimer) return;
  lastMovementTime = performance.now();
  movementTimer = setInterval(movementTick, 16);
}

function stopMovementLoop() {
  if (movementTimer) clearInterval(movementTimer);
  movementTimer = null;
  pressedCodes = new Set();
  shiftHeld = false;
}

function updateMode(mode) {
  if (!petConfig || !petConfig.baseModeCycle.includes(mode)) return;
  activeMode = mode;
  if (mode === "move") startMovementLoop();
  else stopMovementLoop();
}

function showContextMenu(mode) {
  if (!petWindow || !petConfig) return;
  const modeItems = petConfig.baseModeCycle.map((modeName) => ({
    label: modeName === "relax" ? "Relax（默认）" : modeName[0].toUpperCase() + modeName.slice(1),
    type: "radio",
    checked: modeName === mode,
    click: () => petWindow?.webContents.send("pet:select-mode", modeName)
  }));
  const menu = Menu.buildFromTemplate([
    { label: petConfig.displayName, enabled: false },
    { type: "separator" },
    ...modeItems,
    { type: "separator" },
    { label: "切换桌宠…", click: () => createSelectorWindow(true) },
    { label: "退出桌宠", click: () => app.quit() }
  ]);
  menu.popup({ window: petWindow });
}

function registerIpc() {
  ipcMain.handle("pet:get-catalog", () => publicCatalog());
  ipcMain.handle("pet:import", () => importPet());
  ipcMain.handle("pet:delete-imported", (_event, petId) => deleteImportedPet(petId));
  ipcMain.handle("pet:get-config", () => petConfig);
  ipcMain.on("pet:choose", (_event, petId) => choosePet(petId));
  ipcMain.on("pet:close-selector", () => app.quit());
  ipcMain.on("pet:switch", () => createSelectorWindow(true));
  ipcMain.on("pet:set-mode", (_event, mode) => {
    if (typeof mode === "string") updateMode(mode);
  });
  ipcMain.on("pet:set-keys", (_event, payload) => {
    if (!payload || !Array.isArray(payload.codes)) return;
    const allowed = new Set(["KeyW", "KeyA", "KeyS", "KeyD"]);
    pressedCodes = new Set(payload.codes.filter((code) => allowed.has(code)));
    shiftHeld = Boolean(payload.shiftHeld);
  });
  ipcMain.on("pet:show-menu", (_event, mode) => showContextMenu(mode));
  ipcMain.on("pet:qa-transition-sample", async () => {
    const screenshotPath = process.env.ARKPETS_QA_TRANSITION_SCREENSHOT;
    if (!screenshotPath || !petWindow) return;
    const image = await petWindow.webContents.capturePage();
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    fs.writeFileSync(screenshotPath, image.toPNG());
  });
  ipcMain.on("pet:qa-action-sample", async (_event, stateName) => {
    const screenshotPath = process.env.ARKPETS_QA_ACTION_SCREENSHOT;
    if (!screenshotPath || !petWindow || typeof stateName !== "string") return;
    const image = await petWindow.webContents.capturePage();
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    fs.writeFileSync(screenshotPath, image.toPNG());
  });
  ipcMain.on("pet:qa-checkpoint", (_event, name) => {
    const reportPath = process.env.ARKPETS_QA_STATE_REPORT;
    if (!reportPath || !petWindow || typeof name !== "string") return;
    qaCheckpoints[name] = { mode: activeMode, bounds: petWindow.getBounds() };
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(qaCheckpoints, null, 2) + "\n");
  });
  ipcMain.on("pet:media-size", (_event, size) => {
    if (mediaSized || !petWindow || !size || size.width <= 0 || size.height <= 0) return;
    const ratio = size.width / size.height;
    const width = ratio >= 1 ? WINDOW_MAX_SIZE : Math.round(WINDOW_MAX_SIZE * ratio);
    const height = ratio >= 1 ? Math.round(WINDOW_MAX_SIZE / ratio) : WINDOW_MAX_SIZE;
    const oldBounds = petWindow.getBounds();
    const workArea = currentWorkArea(oldBounds);
    const next = clampPosition({ x: oldBounds.x, y: oldBounds.y }, { width, height }, workArea);
    petWindow.setBounds({ x: Math.round(next.x), y: Math.round(next.y), width, height }, false);
    mediaSized = true;
  });
  ipcMain.on("pet:renderer-ready", async () => {
    const screenshotPath = process.env.ARKPETS_QA_SCREENSHOT;
    if (!screenshotPath || !petWindow) return;
    await new Promise((resolve) => setTimeout(resolve, 350));
    const image = await petWindow.webContents.capturePage();
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    fs.writeFileSync(screenshotPath, image.toPNG());
    app.quit();
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const window = selectorWindow || petWindow;
    if (window) {
      window.show();
      window.focus();
    }
  });

  app.whenReady().then(() => {
    configureMacApplicationMenu();
    petCatalog = loadCatalog();
    registerIpc();
    const qaPetId = process.env.ARKPETS_QA_PET_ID;
    if (qaPetId && petCatalog.some((pet) => pet.id === qaPetId)) createPetWindow(qaPetId);
    else createSelectorWindow(false);
  });

  app.on("window-all-closed", () => app.quit());
}
