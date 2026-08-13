"use strict";

window.probeWebM = function probeWebM(url) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const timeout = setTimeout(() => finish({ ok: false, error: "timeout" }), 15000);

    function finish(result) {
      clearTimeout(timeout);
      video.pause();
      video.removeAttribute("src");
      video.load();
      resolve(result);
    }

    video.muted = true;
    video.preload = "auto";
    video.addEventListener("canplay", () => finish({
      ok: true,
      width: video.videoWidth,
      height: video.videoHeight,
      durationSeconds: Number(video.duration.toFixed(3))
    }), { once: true });
    video.addEventListener("error", () => finish({
      ok: false,
      error: video.error ? video.error.message : "media-error"
    }), { once: true });
    video.src = url;
    video.load();
  });
};

