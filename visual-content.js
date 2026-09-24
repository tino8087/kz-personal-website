(function () {
  "use strict";

  var CONTENT_URL = "content/visual-site.json";

  function readPath(source, path) {
    return path.split(".").reduce(function (value, key) {
      return value && Object.prototype.hasOwnProperty.call(value, key) ? value[key] : undefined;
    }, source);
  }

  function setTextContent(data) {
    document.querySelectorAll("[data-content]").forEach(function (element) {
      var value = readPath(data, element.getAttribute("data-content"));
      if (typeof value !== "string" && typeof value !== "number") return;
      element.textContent = String(value);
      if (String(value).indexOf("\n") !== -1) element.style.whiteSpace = "pre-line";
    });
  }

  function setLinks(data) {
    document.querySelectorAll("[data-link]").forEach(function (element) {
      var value = readPath(data, element.getAttribute("data-link"));
      if (typeof value !== "string") return;
      if (value.trim()) {
        element.setAttribute("href", value.trim());
        element.removeAttribute("aria-disabled");
        element.classList.remove("no-link");
      } else {
        element.removeAttribute("href");
        element.setAttribute("aria-disabled", "true");
        element.classList.add("no-link");
      }
    });
  }

  function createMedia(media) {
    if (!media || typeof media.src !== "string" || !media.src.trim()) return null;
    var isVideo = media.type === "video";
    var element = document.createElement(isVideo ? "video" : "img");
    element.className = "cms-media";

    if (isVideo) {
      element.autoplay = true;
      element.loop = true;
      element.muted = true;
      element.playsInline = true;
      element.preload = "metadata";
      if (media.poster) element.poster = media.poster;
      element.setAttribute("aria-label", media.alt || "網站影片");
    } else {
      element.alt = media.alt || "";
      element.loading = "lazy";
      element.decoding = "async";
    }

    element.src = media.src.trim();
    return element;
  }

  function setMedia(data) {
    document.querySelectorAll("[data-media-slot]").forEach(function (container) {
      var media = readPath(data, container.getAttribute("data-media-slot"));
      var current = container.querySelector(":scope > .cms-media");
      if (current) current.remove();
      container.classList.remove("has-media", "has-video");

      var mediaElement = createMedia(media);
      if (!mediaElement) return;

      container.prepend(mediaElement);
      container.classList.add("has-media");
      if (media.type === "video") container.classList.add("has-video");
    });
  }

  function setBranding(data) {
    if (data.site && data.site.title) document.title = data.site.title;

    var description = document.querySelector('meta[name="description"]');
    if (description && data.site && data.site.description) description.content = data.site.description;

    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor && data.site && data.site.theme_color) themeColor.content = data.site.theme_color;

    if (data.theme) {
      if (data.theme.orange) document.documentElement.style.setProperty("--orange", data.theme.orange);
      if (data.theme.black) document.documentElement.style.setProperty("--black", data.theme.black);
      if (data.theme.cream) document.documentElement.style.setProperty("--cream", data.theme.cream);
    }

    var logoSlot = document.querySelector("[data-logo-slot]");
    if (logoSlot && data.navigation && data.navigation.logo) {
      logoSlot.replaceChildren();
      var logo = document.createElement("img");
      logo.src = data.navigation.logo;
      logo.alt = data.navigation.logo_alt || "KZ Logo";
      logoSlot.appendChild(logo);
      logoSlot.classList.add("has-logo");
    }
  }

  function bindSoundControl(data) {
    var button = document.querySelector("[data-sound-control]");
    var video = document.querySelector('[data-media-slot="hero.media"] > video');
    if (!button) return;

    if (!video) {
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      return;
    }

    button.disabled = false;
    button.removeAttribute("aria-disabled");
    button.textContent = data.hero.sound_off_label || "聲音 OFF";
    button.addEventListener("click", function () {
      video.muted = !video.muted;
      button.textContent = video.muted
        ? data.hero.sound_off_label || "聲音 OFF"
        : data.hero.sound_on_label || "聲音 ON";
    });
  }

  function applyContent(data) {
    setBranding(data);
    setTextContent(data);
    setLinks(data);
    setMedia(data);
    bindSoundControl(data);
    window.KZ_SITE_CONTENT = data;
    document.dispatchEvent(new CustomEvent("kz:content-ready", { detail: data }));
  }

  fetch(CONTENT_URL, { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) throw new Error("Content request failed: " + response.status);
      return response.json();
    })
    .then(applyContent)
    .catch(function (error) {
      console.warn("KZ content could not be loaded. The built-in page content remains visible.", error);
    });
})();
