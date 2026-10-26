/* ============================================================
   NEURIA — Sistema de Assistência Técnica
   Progressive enhancement: navigation, tabs, lightbox, copy, motion
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var header = document.querySelector(".site-header");
  var nav = document.getElementById("menu-principal");
  var menuToggle = document.querySelector(".menu-toggle");
  var progressBar = document.querySelector(".scroll-progress span");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav > a"));
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));

  /* ---------- Header: scroll progress + active link ---------- */
  var ticking = false;

  function updateScrollUI() {
    var y = window.scrollY || window.pageYOffset;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;

    if (progressBar) {
      var ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      progressBar.style.transform = "scaleX(" + ratio + ")";
    }

    if (header) {
      header.classList.toggle("is-scrolled", y > 8);
    }

    var offset = (header ? header.offsetHeight : 0) + 140;
    var current = "";
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];
      if (section.offsetTop <= y + offset) {
        current = section.id;
      }
    }

    navLinks.forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var isCurrent = href === "#" + current;
      link.classList.toggle("is-active", isCurrent);
      if (isCurrent) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    ticking = false;
  }

  function requestScrollUI() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }

  window.addEventListener("scroll", requestScrollUI, { passive: true });
  window.addEventListener("resize", requestScrollUI);
  updateScrollUI();

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    if (!header || !menuToggle) return;
    header.classList.toggle("nav-open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    var label = menuToggle.querySelector(".sr-only");
    if (label) label.textContent = open ? "Fechar menu de navegação" : "Abrir menu de navegação";
    document.body.classList.toggle("menu-open", open);
  }

  if (menuToggle && header) {
    menuToggle.addEventListener("click", function () {
      setMenu(!header.classList.contains("nav-open"));
    });

    if (nav) {
      nav.addEventListener("click", function (event) {
        if (event.target.closest("a")) setMenu(false);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && header.classList.contains("nav-open")) {
        setMenu(false);
        menuToggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (
        header.classList.contains("nav-open") &&
        !header.contains(event.target)
      ) {
        setMenu(false);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1080) setMenu(false);
    });
  }

  /* ---------- Scroll reveals ---------- */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  /* ---------- Product tour tabs ---------- */
  var tour = document.querySelector("[data-tour]");

  if (tour) {
    var tabs = Array.prototype.slice.call(tour.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(tour.querySelectorAll('[role="tabpanel"]'));

    function activateTab(tab, focusTab) {
      tabs.forEach(function (item) {
        var selected = item === tab;
        item.setAttribute("aria-selected", selected ? "true" : "false");
        item.tabIndex = selected ? 0 : -1;
        item.classList.toggle("is-active", selected);
      });

      panels.forEach(function (panel) {
        var active = panel.id === tab.getAttribute("aria-controls");
        panel.hidden = !active;
        panel.classList.toggle("is-active", active);
        if (active) {
          panel.classList.remove("is-entering");
          // Restart the entrance animation without a layout jump.
          void panel.offsetWidth;
          panel.classList.add("is-entering");
        }
      });

      if (focusTab) tab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activateTab(tab, false);
      });

      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          next = tabs[(index + 1) % tabs.length];
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          next = tabs[(index - 1 + tabs.length) % tabs.length];
        } else if (event.key === "Home") {
          next = tabs[0];
        } else if (event.key === "End") {
          next = tabs[tabs.length - 1];
        }
        if (next) {
          event.preventDefault();
          activateTab(next, true);
        }
      });
    });
  }

  /* ---------- Lightbox ---------- */
  var dialog = document.getElementById("lightbox");

  if (dialog && typeof dialog.showModal === "function") {
    var dialogImage = dialog.querySelector(".lightbox-img");
    var dialogCaption = dialog.querySelector(".lightbox-caption");
    var closeButton = dialog.querySelector(".lightbox-close");
    var lastTrigger = null;

    function openLightbox(trigger) {
      var image = trigger.querySelector("img");
      if (!image) return;

      lastTrigger = trigger;
      dialogImage.src = image.currentSrc || image.src;
      dialogImage.alt = image.alt || "";
      dialogCaption.textContent = trigger.getAttribute("data-caption") || image.alt || "";

      document.body.style.overflow = "hidden";
      dialog.showModal();

      if (closeButton) closeButton.focus();
    }

    function closeLightbox() {
      if (dialog.open) dialog.close();
    }

    document.querySelectorAll("[data-lightbox]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        openLightbox(trigger);
      });
    });

    if (closeButton) {
      closeButton.addEventListener("click", closeLightbox);
    }

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeLightbox();
    });

    dialog.addEventListener("close", function () {
      document.body.style.overflow = "";
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    });
  }

  /* ---------- Copy SHA-256 ---------- */
  var toastRegion = document.querySelector(".toast-region");

  function showToast(message) {
    if (!toastRegion) return;
    var toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML =
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5 9 17.5 20 6.5"/></svg>';
    var text = document.createElement("span");
    text.textContent = message;
    toast.appendChild(text);
    toastRegion.appendChild(toast);

    window.setTimeout(function () {
      toast.classList.add("is-leaving");
      window.setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    }, 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        var ok = document.execCommand("copy");
        document.body.removeChild(area);
        if (ok) resolve();
        else reject(new Error("copy-failed"));
      } catch (error) {
        document.body.removeChild(area);
        reject(error);
      }
    });
  }

  document.querySelectorAll(".copy-btn").forEach(function (button) {
    var label = button.querySelector(".copy-label");
    var resetTimer = null;

    button.addEventListener("click", function () {
      var value = button.getAttribute("data-copy") || "";
      if (!value) return;

      copyText(value)
        .then(function () {
          button.classList.add("is-copied");
          if (label) label.textContent = "Copiado";
          showToast("SHA-256 copiado para a área de transferência.");
          window.clearTimeout(resetTimer);
          resetTimer = window.setTimeout(function () {
            button.classList.remove("is-copied");
            if (label) label.textContent = "Copiar";
          }, 2600);
        })
        .catch(function () {
          showToast("Não foi possível copiar. Selecione o hash manualmente.");
        });
    });
  });

  /* ---------- FAQ: keep aria-expanded in sync ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var summary = item.querySelector("summary");
    if (!summary) return;

    function sync() {
      summary.setAttribute("aria-expanded", item.open ? "true" : "false");
    }

    sync();
    item.addEventListener("toggle", sync);
  });
})();
