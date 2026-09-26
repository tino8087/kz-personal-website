(function () {
  "use strict";

  var CONTENT_URL = "content/visual-site.json";
  var COLOR_VERSIONS = {
    original: {
      attribute: "original",
      primary: "#f2674a",
      dark: "#15130f",
      light: "#f5e8d0",
      accent: "#f2674a",
      card: "#f5e8d0"
    },
    kz_brand: {
      attribute: "kz-brand",
      primary: "#8c9dad",
      dark: "#303b43",
      light: "#f8f6f2",
      accent: "#ffbe98",
      card: "#f3e6dc"
    },
    orange_creative: {
      attribute: "orange-creative",
      primary: "#eb670e",
      dark: "#2a3582",
      light: "#ffffff",
      accent: "#eb670e",
      card: "#ffffff"
    }
  };

  function normalizeHex(value, fallback) {
    var hex = typeof value === "string" ? value.trim() : "";
    if (/^#[0-9a-f]{6}$/i.test(hex)) return hex.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(hex)) {
      return "#" + hex.slice(1).split("").map(function (part) { return part + part; }).join("").toLowerCase();
    }
    return fallback;
  }

  function hexToRgb(value) {
    var hex = normalizeHex(value, "#000000").slice(1);
    return [0, 2, 4].map(function (index) { return parseInt(hex.slice(index, index + 2), 16); }).join(" ");
  }

  function getPalette(data) {
    var theme = data && data.theme || {};
    if (theme.version !== "custom") return COLOR_VERSIONS[theme.version] || COLOR_VERSIONS.original;
    return {
      attribute: "custom",
      primary: normalizeHex(theme.primary, "#eb670e"),
      dark: normalizeHex(theme.dark, "#2a3582"),
      light: normalizeHex(theme.light, "#ffffff"),
      accent: normalizeHex(theme.accent, "#eb670e"),
      card: normalizeHex(theme.card, "#ffffff")
    };
  }

  function applyPalette(data) {
    var palette = getPalette(data);
    var style = document.documentElement.style;
    document.documentElement.setAttribute("data-color-version", palette.attribute);

    if (palette.attribute === "custom") {
      style.setProperty("--orange", palette.primary);
      style.setProperty("--black", palette.dark);
      style.setProperty("--cream", palette.light);
      style.setProperty("--accent", palette.accent);
      style.setProperty("--card", palette.card);
      style.setProperty("--cream-rgb", hexToRgb(palette.light));
      style.setProperty("--black-rgb", hexToRgb(palette.dark));
      style.setProperty("--shadow-rgb", hexToRgb(palette.dark));
    }
    return palette;
  }
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
    var palette = applyPalette(data);
    if (data.site && data.site.title) document.title = data.site.title;

    var description = document.querySelector('meta[name="description"]');
    if (description && data.site && data.site.description) description.content = data.site.description;

    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = palette.primary;

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

  function tidyActionLabels() {
    var label = document.querySelector('[data-content="navigation.follow_label"]');
    var arrow = document.querySelector("[data-follow-arrow]");
    if (label && arrow) arrow.hidden = /[↗→]/.test(label.textContent);
  }

  function bindSoundControl(data) {
    var button = document.querySelector("[data-sound-control]");
    var video = document.querySelector('[data-media-slot="hero.media"] > video');
    if (!button) return;

    if (!video) {
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      button.hidden = true;
      return;
    }

    button.hidden = false;
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
    tidyActionLabels();
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
