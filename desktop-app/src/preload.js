"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopPet", {
  getCatalog: () => ipcRenderer.invoke("pet:get-catalog"),
  importPet: () => ipcRenderer.invoke("pet:import"),
  deleteImportedPet: (petId) => ipcRenderer.invoke("pet:delete-imported", petId),
  getConfig: () => ipcRenderer.invoke("pet:get-config"),
  choosePet: (petId) => ipcRenderer.send("pet:choose", petId),
  closeSelector: () => ipcRenderer.send("pet:close-selector"),
  switchPet: () => ipcRenderer.send("pet:switch"),
  setMode: (mode) => ipcRenderer.send("pet:set-mode", mode),
  setKeys: (codes, shiftHeld) => ipcRenderer.send("pet:set-keys", { codes, shiftHeld }),
  setMediaSize: (width, height) => ipcRenderer.send("pet:media-size", { width, height }),
  showMenu: (mode) => ipcRenderer.send("pet:show-menu", mode),
  rendererReady: () => ipcRenderer.send("pet:renderer-ready"),
  transitionSample: () => ipcRenderer.send("pet:qa-transition-sample"),
  actionSample: (stateName) => ipcRenderer.send("pet:qa-action-sample", stateName),
  qaCheckpoint: (name) => ipcRenderer.send("pet:qa-checkpoint", name),
  onSelectMode: (callback) => {
    const listener = (_event, mode) => callback(mode);
    ipcRenderer.on("pet:select-mode", listener);
    return () => ipcRenderer.removeListener("pet:select-mode", listener);
  },
  onCatalogUpdated: (callback) => {
    const listener = (_event, pets) => callback(pets);
    ipcRenderer.on("pet:catalog-updated", listener);
    return () => ipcRenderer.removeListener("pet:catalog-updated", listener);
  }
});
