(function () {
  "use strict";

  function makeElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function formatDate(value) {
    if (!value) return "";
    var date = new Date(value + "T00:00:00");
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
  }

  function render(resources, readLabel) {
    var list = document.querySelector("[data-resource-list]");
    var empty = document.querySelector("[data-resource-empty]");
    if (!list || !empty) return;

    var published = resources
      .filter(function (resource) { return resource && resource.published && resource.title && resource.slug; })
      .sort(function (a, b) { return String(b.published_date || "").localeCompare(String(a.published_date || "")); });

    if (!published.length) return;

    list.replaceChildren();
    published.forEach(function (resource) {
      var card = makeElement("a", "note-card");
      card.href = "/resources/" + encodeURIComponent(resource.slug) + "/";

      var meta = makeElement("div", "note-card-meta");
      meta.appendChild(makeElement("span", "note-category", resource.category || "KZ NOTE"));
      meta.appendChild(makeElement("time", "note-date", formatDate(resource.published_date)));

      var copy = makeElement("div", "note-card-copy");
      copy.appendChild(makeElement("h3", "", resource.title));
      if (resource.description) copy.appendChild(makeElement("p", "", resource.description));

      card.appendChild(meta);
      card.appendChild(copy);
      card.appendChild(makeElement("span", "note-read", (readLabel || "閱讀內容") + " ↗"));
      list.appendChild(card);
    });

    list.hidden = false;
    empty.hidden = true;
  }

  Promise.all([
    fetch("content/resources.json", { cache: "no-store" }).then(function (response) {
      if (!response.ok) throw new Error("Resources request failed");
      return response.json();
    }),
    fetch("content/visual-site.json", { cache: "no-store" }).then(function (response) {
      return response.ok ? response.json() : {};
    }).catch(function () { return {}; })
  ]).then(function (results) {
    render(results[0].resources || [], results[1].notes && results[1].notes.read_label);
  }).catch(function (error) {
    console.warn("KZ notes could not be loaded. The empty state remains visible.", error);
  });
})();
