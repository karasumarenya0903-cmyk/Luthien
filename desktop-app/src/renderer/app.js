"use strict";

const stage = document.getElementById("pet-stage");
const videos = [
  document.getElementById("pet-video-a"),
  document.getElementById("pet-video-b")
];
const errorMessage = document.getElementById("error-message");
const pressedCodes = new Set();
const movementCodes = new Set(["KeyW", "KeyA", "KeyS", "KeyD"]);
const KEYFRAME_TRANSITION_MS = 220;
const INTERACTION_RETURN_MS = 560;
const DOUBLE_CLICK_DELAY_MS = 320;

let config = null;
let currentBaseMode = null;
let activeVideoIndex = 1;
let oneShotPlaying = false;
let transitionChain = Promise.resolve();
let mediaSizeSent = false;
let pendingSingleClick = null;
let suppressClickUntil = 0;
let oneShotTask = Promise.resolve();

function reportError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function waitForMedia(video, eventName) {
  return new Promise((resolve, reject) => {
    const onReady = () => finish(resolve);
    const onError = () => finish(() => reject(new Error(video.error?.message || "media-error")));
    function finish(callback) {
      video.removeEventListener(eventName, onReady);
      video.removeEventListener("error", onError);
      callback();
    }
    video.addEventListener(eventName, onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

async function prepareVideo(video, stateName, loop) {
  const state = config.states[stateName];
  if (!state) throw new Error(`Unknown animation state: ${stateName}`);
  video.loop = loop;
  video.muted = true;

  if (video.src !== state.url) {
    video.src = state.url;
    video.load();
  }
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await waitForMedia(video, "loadeddata");
  }
  video.currentTime = 0;
  await video.play();
  if (typeof video.requestVideoFrameCallback === "function") {
    await new Promise((resolve) => video.requestVideoFrameCallback(() => resolve()));
  }
  video.pause();
  return video;
}

async function performTransition(stateName, loop, transitionKind = "standard") {
  const nextIndex = 1 - activeVideoIndex;
  const previous = videos[activeVideoIndex];
  const next = videos[nextIndex];
  await prepareVideo(next, stateName, loop);

  next.dataset.state = stateName;
  errorMessage.hidden = true;

  if (!previous.currentSrc) {
    await next.play();
    next.classList.add("is-active");
    activeVideoIndex = nextIndex;
    if (!mediaSizeSent && next.videoWidth > 0 && next.videoHeight > 0) {
      mediaSizeSent = true;
      window.desktopPet.setMediaSize(next.videoWidth, next.videoHeight);
    }
    return next;
  }

  previous.pause();
  if (transitionKind === "interaction-return") {
    await next.play();
    const wipeFrames = [
      { progress: 0, outgoingBottom: 0, incomingTop: 100 },
      { progress: 0.16, outgoingBottom: 7, incomingTop: 93 },
      { progress: 0.34, outgoingBottom: 23, incomingTop: 77 },
      { progress: 0.52, outgoingBottom: 50, incomingTop: 50 },
      { progress: 0.7, outgoingBottom: 76, incomingTop: 24 },
      { progress: 0.86, outgoingBottom: 93, incomingTop: 7 },
      { progress: 1, outgoingBottom: 100, incomingTop: 0 }
    ];
    const outgoing = previous.animate(wipeFrames.map((frame) => ({
      opacity: 1,
      clipPath: `inset(0 0 ${frame.outgoingBottom}% 0)`,
      offset: frame.progress
    })), {
      duration: INTERACTION_RETURN_MS,
      easing: "cubic-bezier(0.33, 0, 0.2, 1)",
      fill: "forwards"
    });
    const incoming = next.animate(wipeFrames.map((frame) => ({
      opacity: 1,
      clipPath: `inset(${frame.incomingTop}% 0 0 0)`,
      offset: frame.progress
    })), {
      duration: INTERACTION_RETURN_MS,
      easing: "cubic-bezier(0.33, 0, 0.2, 1)",
      fill: "forwards"
    });

    await new Promise((resolve) => setTimeout(resolve, INTERACTION_RETURN_MS / 2));
    window.desktopPet.transitionSample();
    await new Promise((resolve) => setTimeout(resolve, INTERACTION_RETURN_MS / 2));
    outgoing.cancel();
    incoming.cancel();
    previous.classList.remove("is-active");
    next.classList.add("is-active");
    previous.pause();
    activeVideoIndex = nextIndex;
    return next;
  }

  const outgoing = previous.animate([
    { opacity: 1, transform: "translateY(0) scale(1)", offset: 0 },
    { opacity: 1, transform: "translateY(2.5%) scale(0.955, 0.92)", offset: 0.49 },
    { opacity: 0, transform: "translateY(2.5%) scale(0.955, 0.92)", offset: 0.5 },
    { opacity: 0, transform: "translateY(2.5%) scale(0.955, 0.92)", offset: 1 }
  ], {
    duration: KEYFRAME_TRANSITION_MS,
    easing: "cubic-bezier(0.22, 0.8, 0.3, 1)",
    fill: "forwards"
  });
  const incoming = next.animate([
    { opacity: 0, transform: "translateY(2.5%) scale(0.955, 0.92)", offset: 0 },
    { opacity: 0, transform: "translateY(2.5%) scale(0.955, 0.92)", offset: 0.49 },
    { opacity: 1, transform: "translateY(2.5%) scale(0.955, 0.92)", offset: 0.5 },
    { opacity: 1, transform: "translateY(0) scale(1)", offset: 1 }
  ], {
    duration: KEYFRAME_TRANSITION_MS,
    easing: "cubic-bezier(0.22, 0.8, 0.3, 1)",
    fill: "forwards"
  });

  await new Promise((resolve) => setTimeout(resolve, KEYFRAME_TRANSITION_MS / 2));
  await next.play();
  window.desktopPet.transitionSample();
  await new Promise((resolve) => setTimeout(resolve, KEYFRAME_TRANSITION_MS / 2));
  outgoing.cancel();
  incoming.cancel();
  previous.classList.remove("is-active");
  next.classList.add("is-active");
  previous.pause();
  activeVideoIndex = nextIndex;

  if (!mediaSizeSent && next.videoWidth > 0 && next.videoHeight > 0) {
    mediaSizeSent = true;
    window.desktopPet.setMediaSize(next.videoWidth, next.videoHeight);
  }
  return next;
}

function transitionTo(stateName, loop, transitionKind = "standard") {
  const queued = transitionChain.then(() => performTransition(stateName, loop, transitionKind));
  transitionChain = queued.catch(() => {});
  return queued;
}

function waitForEnded(video) {
  return new Promise((resolve, reject) => {
    const onEnded = () => finish(resolve);
    const onError = () => finish(() => reject(new Error(video.error?.message || "media-error")));
    function finish(callback) {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      callback();
    }
    video.addEventListener("ended", onEnded, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

function preloadInactiveStates() {
  for (const state of Object.values(config.states)) {
    const preloader = document.createElement("video");
    preloader.muted = true;
    preloader.preload = "auto";
    preloader.src = state.url;
    preloader.load();
  }
}

async function activateBaseMode(mode, transitionKind = "standard") {
  if (!config.baseModeCycle.includes(mode)) return;
  currentBaseMode = mode;
  document.body.dataset.mode = mode;
  window.desktopPet.setMode(mode);
  try {
    await transitionTo(mode, true, transitionKind);
  } catch (error) {
    reportError(`无法播放 ${mode} 动画：${error.message}`);
  }
}

async function playOneShot(stateName) {
  if (oneShotPlaying || !config.states[stateName]) return;
  oneShotPlaying = true;
  window.desktopPet.setMode(config.interactionReturnMode);
  try {
    const actionVideo = await transitionTo(stateName, false);
    if (actionVideo) {
      window.desktopPet.actionSample(stateName);
      await waitForEnded(actionVideo);
    }
  } catch (error) {
    reportError(`无法播放 ${stateName} 动画：${error.message}`);
  } finally {
    await activateBaseMode(config.interactionReturnMode, "interaction-return");
    oneShotPlaying = false;
  }
}

function startOneShot(stateName) {
  oneShotTask = playOneShot(stateName);
  return oneShotTask;
}

const playInteraction = () => startOneShot("interact");
const playSpecial = () => startOneShot("special");

function releaseMovementKeys() {
  if (pressedCodes.size === 0) return;
  pressedCodes.clear();
  window.desktopPet.setKeys([], false);
}

async function handlePrimaryClick() {
  if (oneShotPlaying) return;
  if (currentBaseMode === "move") {
    releaseMovementKeys();
    await activateBaseMode(config.interactionReturnMode);
    return;
  }
  await playInteraction();
}

stage.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || currentBaseMode !== "move") return;
  event.preventDefault();
  suppressClickUntil = performance.now() + DOUBLE_CLICK_DELAY_MS + 120;
  handlePrimaryClick();
});

stage.addEventListener("click", (event) => {
  if (event.button !== 0 || performance.now() < suppressClickUntil) return;
  if (!config.states.special) {
    handlePrimaryClick();
    return;
  }

  if (event.detail >= 2) {
    clearTimeout(pendingSingleClick);
    pendingSingleClick = null;
    playSpecial();
    return;
  }

  clearTimeout(pendingSingleClick);
  pendingSingleClick = setTimeout(() => {
    pendingSingleClick = null;
    handlePrimaryClick();
  }, DOUBLE_CLICK_DELAY_MS);
});

stage.addEventListener("dblclick", (event) => event.preventDefault());

stage.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  clearTimeout(pendingSingleClick);
  pendingSingleClick = null;
  window.desktopPet.showMenu(currentBaseMode);
});

window.addEventListener("keydown", (event) => {
  if (!movementCodes.has(event.code) && !event.code.startsWith("Shift")) return;
  event.preventDefault();
  if (movementCodes.has(event.code)) pressedCodes.add(event.code);
  window.desktopPet.setKeys([...pressedCodes], event.shiftKey);
});

window.addEventListener("keyup", (event) => {
  if (!movementCodes.has(event.code) && !event.code.startsWith("Shift")) return;
  event.preventDefault();
  if (movementCodes.has(event.code)) pressedCodes.delete(event.code);
  window.desktopPet.setKeys([...pressedCodes], event.shiftKey);
});

window.addEventListener("blur", releaseMovementKeys);
window.desktopPet.onSelectMode((mode) => {
  clearTimeout(pendingSingleClick);
  pendingSingleClick = null;
  if (!oneShotPlaying) activateBaseMode(mode);
});

window.desktopPet.getConfig()
  .then(async (loadedConfig) => {
    config = loadedConfig;
    document.title = config.displayName;
    await activateBaseMode(config.initialMode);
    preloadInactiveStates();
    if (config.qaInteraction) await playInteraction();
    if (config.qaSpecial) {
      stage.dispatchEvent(new MouseEvent("click", { button: 0, bubbles: true, detail: 1 }));
      stage.dispatchEvent(new MouseEvent("click", { button: 0, bubbles: true, detail: 2 }));
      await oneShotTask;
    }
    for (let iteration = 1; iteration <= config.qaMoveReturnRepeats; iteration += 1) {
      await activateBaseMode("move");
      window.desktopPet.qaCheckpoint(`before-move-exit-${iteration}`);
      stage.dispatchEvent(new PointerEvent("pointerdown", { button: 0, bubbles: true }));
      await transitionChain;
      window.desktopPet.qaCheckpoint(`after-move-exit-${iteration}`);
    }
    window.desktopPet.rendererReady();
  })
  .catch((error) => reportError(`桌宠启动失败：${error.message}`));
