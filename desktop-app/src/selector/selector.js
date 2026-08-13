"use strict";

const petList = document.getElementById("pet-list");
const closeButton = document.getElementById("close-button");
const importButton = document.getElementById("import-button");
const importStatus = document.getElementById("import-status");

closeButton.addEventListener("click", () => window.desktopPet.closeSelector());

function createPetMark(iconUrl) {
  const mark = document.createElement("div");
  mark.className = "pet-mark";
  const icon = document.createElement("video");
  icon.src = iconUrl;
  icon.muted = true;
  icon.playsInline = true;
  icon.preload = "auto";

  icon.addEventListener("loadedmetadata", () => {
    const duration = Number.isFinite(icon.duration) ? icon.duration : 1;
    icon.currentTime = Math.max(0.05, Math.min(duration * 0.45, duration - 0.05));
  }, { once: true });
  icon.addEventListener("seeked", async () => {
    await icon.play();
    if (typeof icon.requestVideoFrameCallback === "function") {
      await new Promise((resolve) => icon.requestVideoFrameCallback(() => resolve()));
    }
    icon.pause();
    const canvas = document.createElement("canvas");
    canvas.width = 176;
    canvas.height = 176;
    canvas.className = "pet-icon";
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(icon, 0, 0, canvas.width, canvas.height);
    mark.replaceChildren(canvas);
    icon.pause();
    icon.removeAttribute("src");
    icon.load();
  }, { once: true });
  icon.addEventListener("error", () => mark.classList.add("is-unavailable"), { once: true });
  mark.appendChild(icon);
  icon.load();
  return mark;
}

function renderPets(pets) {
  petList.replaceChildren();
  for (const pet of pets) {
    const card = document.createElement("article");
    card.className = "pet-card";

    const launchButton = document.createElement("button");
    launchButton.type = "button";
    launchButton.className = "pet-launch";

    const mark = createPetMark(pet.iconUrl);

    const title = document.createElement("h2");
    title.textContent = pet.displayName;

    const subtitle = document.createElement("p");
    const tags = [];
    if (pet.source === "imported") tags.push("用户导入");
    if (pet.hasSpecial) tags.push("双击 Special");
    subtitle.textContent = [pet.characterName || pet.id, ...tags].join(" · ");

    launchButton.append(mark, title, subtitle);
    launchButton.addEventListener("click", () => window.desktopPet.choosePet(pet.id));
    card.appendChild(launchButton);

    if (pet.source === "imported") {
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-pet";
      deleteButton.textContent = "删除";
      deleteButton.setAttribute("aria-label", `删除 ${pet.displayName}`);
      deleteButton.addEventListener("click", async () => {
        deleteButton.disabled = true;
        importStatus.classList.remove("is-error");
        const result = await window.desktopPet.deleteImportedPet(pet.id);
        deleteButton.disabled = false;
        if (result.canceled) return;
        if (!result.ok) {
          importStatus.classList.add("is-error");
          importStatus.textContent = result.error || "删除失败。";
          return;
        }
        renderPets(result.pets);
        const megabytes = result.reclaimedBytes / (1024 * 1024);
        importStatus.textContent = `已删除 ${result.displayName}，释放 ${megabytes.toFixed(1)} MB。`;
      });
      card.appendChild(deleteButton);
    }
    petList.appendChild(card);
  }
}

importButton.addEventListener("click", async () => {
  importButton.disabled = true;
  importStatus.classList.remove("is-error");
  importStatus.textContent = "请选择 Relax、Interact、Sit、Sleep、Move；Special 可作为第六个文件…";
  const result = await window.desktopPet.importPet();
  importButton.disabled = false;
  if (result.canceled) {
    importStatus.textContent = "已取消导入。";
    return;
  }
  if (!result.ok) {
    importStatus.classList.add("is-error");
    importStatus.textContent = result.error || "导入失败。";
    return;
  }
  renderPets(result.pets);
  importStatus.textContent = `已导入 ${result.displayName}。`;
});

window.desktopPet.getCatalog().then(renderPets);
window.desktopPet.onCatalogUpdated(renderPets);
