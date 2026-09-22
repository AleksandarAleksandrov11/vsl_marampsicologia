// MARAM — formulario multi-paso, WhatsApp y eventos de Meta Pixel.
(function () {
  "use strict";

  var CFG = window.MARAM || {};
  var PHONE = (CFG.phone || "34698994566").replace(/\D/g, "");
  var ENDPOINT = CFG.leadEndpoint || "/api/lead";
  var MSG_DEFAULT = "Hola, me gustaría reservar una primera sesión de terapia online con MARAM.";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  // Meta Pixel
  var CONSENT_KEY = CFG.consentKey || "maram_cookie_consent";

  function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function writeConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  }

  // El píxel se carga en la cabecera; aquí solo se concede o revoca el envío.
  function applyConsent(value) {
    if (typeof window.fbq !== "function") return;
    window.fbq("consent", value === "rejected" ? "revoke" : "grant");
  }

  // Un solo Lead por visita. El eventID permite deduplicar con la API de Conversiones.
  var leadFired = false;
  var eventId = "maram-" + Date.now().toString(36) + "-" +
                Math.random().toString(36).slice(2, 10);

  function trackLead(source) {
    if (leadFired) return;
    leadFired = true;
    if (typeof window.fbq === "function") {
      window.fbq("track", "Lead", {
        content_name: "Reserva primera sesion",
        content_category: source,
        currency: "EUR",
        value: 45
      }, { eventID: eventId });
    }
  }

  // WhatsApp: los enlaces se construyen aquí, sin depender del backend.
  function waUrl(message) {
    return "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(message || MSG_DEFAULT);
  }

  function setWaLinks(message) {
    $$(".js-wa").forEach(function (el) {
      if (el.id === "wa-thanks") return; // el de gracias se personaliza aparte
      el.href = waUrl(message);
    });
  }

  setWaLinks(MSG_DEFAULT);

  document.addEventListener("click", function (ev) {
    var link = ev.target.closest ? ev.target.closest(".js-wa") : null;
    if (link) trackLead("whatsapp-" + (link.getAttribute("data-wa") || "enlace"));
  });

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Intro de la mariposa. La capa se desvanece por CSS; aquí solo se salta y se recuerda.
  (function () {
    var intro = $("#intro");
    if (!intro) return;

    var root = document.documentElement;
    var closed = false;

    function close(skipped) {
      if (closed) return;
      closed = true;
      if (skipped) root.classList.add("intro-skipped");
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      window.removeEventListener("scroll", onSkip);
      window.removeEventListener("touchstart", onSkip);
      window.removeEventListener("keydown", onSkip);
      window.removeEventListener("pointerdown", onSkip);
    }
    function onSkip() { close(true); }

    try { sessionStorage.setItem("maram-intro", "1"); } catch (e) {}

    if (root.classList.contains("intro-skip")) { close(false); return; }

    window.addEventListener("scroll", onSkip, { passive: true, once: true });
    window.addEventListener("touchstart", onSkip, { passive: true, once: true });
    window.addEventListener("pointerdown", onSkip, { once: true });
    window.addEventListener("keydown", onSkip, { once: true });

    // Red de seguridad: aunque algo falle, la capa se retira igualmente.
    setTimeout(function () { close(false); }, 2400);
  })();

  // Apariciones al hacer scroll
  (function () {
    var items = $$(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  })();

  // Carrusel de reseñas. La lista se duplica para que el bucle no tenga costura.
  (function () {
    var track = $("#marquee-track");
    if (!track || reduceMotion) return;

    var originals = $$(".quote", track);
    if (!originals.length) return;

    originals.forEach(function (item) {
      var copy = item.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    });

    track.style.animationDuration = Math.round(originals.length * 6.5) + "s";
  })();

  // Consentimiento de cookies
  (function () {
    var bar = $("#cookiebar");
    var decision = readConsent();

    if (decision) applyConsent(decision);

    function settle(value) {
      writeConsent(value);
      applyConsent(value);
      if (bar) bar.hidden = true;
      document.body.classList.remove("cookies-pending");
    }

    function openBanner() {
      if (!bar) return;
      bar.hidden = false;
      document.body.classList.add("cookies-pending");
    }

    if (!decision) {
      // El banner no debe quedar por debajo de la intro.
      var introVivo = $("#intro") &&
        !document.documentElement.classList.contains("intro-skip");
      if (introVivo) setTimeout(openBanner, 2200);
      else openBanner();
    }

    $$("#cookie-accept, .js-cookie-accept").forEach(function (b) {
      b.addEventListener("click", function () { settle("accepted"); closeModals(); });
    });
    $$("#cookie-reject, .js-cookie-reject").forEach(function (b) {
      b.addEventListener("click", function () { settle("rejected"); closeModals(); });
    });
    $$(".js-cookie-settings").forEach(function (b) {
      b.addEventListener("click", function () { openModal("modal-cookies"); });
    });
  })();

  // Ventanas legales. Se abren sobre la página: no hay enlaces de salida.
  function openModal(id) {
    var dlg = document.getElementById(id);
    if (!dlg) return;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }

  function closeModals() {
    $$(".modal").forEach(function (dlg) {
      if (typeof dlg.close === "function" && dlg.open) dlg.close();
      else dlg.removeAttribute("open");
    });
  }

  $$(".js-modal").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openModal(btn.getAttribute("data-modal"));
    });
  });

  $$(".js-modal-close").forEach(function (btn) {
    btn.addEventListener("click", closeModals);
  });

  // Clic en el fondo oscuro: cerrar
  $$(".modal").forEach(function (dlg) {
    dlg.addEventListener("click", function (ev) {
      if (ev.target === dlg) closeModals();
    });
  });

  // Parámetros de campaña. Se guardan en la sesión por si la URL se limpia.
  var CAMPOS_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var UTM_KEY = "maram_utm";

  var utm = (function () {
    var guardado = {};
    try { guardado = JSON.parse(sessionStorage.getItem(UTM_KEY) || "{}"); } catch (e) {}

    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { params = null; }

    var encontrado = false;
    if (params) {
      CAMPOS_UTM.forEach(function (campo) {
        var valor = params.get(campo);
        if (valor) { guardado[campo] = valor.slice(0, 120); encontrado = true; }
      });
      // Identificador de clic de Meta: útil para casar el lead con el anuncio
      var fbclid = params.get("fbclid");
      if (fbclid) { guardado.fbclid = fbclid.slice(0, 200); encontrado = true; }
    }

    if (encontrado) {
      try { sessionStorage.setItem(UTM_KEY, JSON.stringify(guardado)); } catch (e) {}
    }
    return guardado;
  })();

  // Año del footer
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Formulario multi-paso
  var form = $("#lead-form");
  var thanks = $("#thanks");
  var panels = $$(".panel", form);
  var fill = $("#progress-fill");
  var dots = $$("#progress-dots .dot");
  var label = $("#progress-label");
  var TOTAL = panels.length;
  var current = 1;

  function panelAt(step) {
    return panels.filter(function (p) { return Number(p.dataset.step) === step; })[0];
  }

  function updateProgress() {
    if (fill) fill.style.width = (current / TOTAL * 100) + "%";
    dots.forEach(function (d) {
      var n = Number(d.dataset.step);
      d.classList.toggle("is-active", n === current);
      d.classList.toggle("is-done", n < current);
    });
    if (label) label.textContent = "Paso " + current + " de " + TOTAL;
  }

  function goTo(step, direction) {
    var from = panelAt(current);
    var to = panelAt(step);
    if (!to || step === current) return;

    from.hidden = true;
    from.classList.remove("is-entering", "is-entering-back");

    to.hidden = false;
    if (!reduceMotion) {
      to.classList.add(direction === "back" ? "is-entering-back" : "is-entering");
      setTimeout(function () {
        to.classList.remove("is-entering", "is-entering-back");
      }, 340);
    }

    current = step;
    updateProgress();

    var field = to.querySelector(".field");
    if (field) field.focus({ preventScroll: true });
  }

  // Validación
  function showError(field, message) {
    var errEl = $("#" + field.id + "-error");
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    if (errEl) errEl.textContent = message;
  }

  function clearError(field) {
    var errEl = $("#" + field.id + "-error");
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    if (errEl) errEl.textContent = "";
  }

  var nombre = $("#nombre");
  var telefono = $("#telefono");
  var motivo = $("#motivo");

  function validateNombre() {
    var v = nombre.value.trim();
    if (v.length < 2) {
      showError(nombre, "Escribe tu nombre para continuar.");
      return false;
    }
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+$/.test(v)) {
      showError(nombre, "El nombre solo puede contener letras.");
      return false;
    }
    clearError(nombre);
    return true;
  }

  function validateTelefono() {
    var digits = telefono.value.replace(/\D/g, "").replace(/^34/, "");
    if (!digits) {
      showError(telefono, "Necesitamos un teléfono para poder contactarte.");
      return false;
    }
    if (!/^[6-9]\d{8}$/.test(digits)) {
      showError(telefono, "Introduce un móvil o fijo español de 9 dígitos (ej. 612 345 678).");
      return false;
    }
    clearError(telefono);
    return true;
  }

  function validateStep(step) {
    if (step === 1) return validateNombre();
    if (step === 2) return validateTelefono();
    return true;
  }

  // Formateo suave del teléfono mientras se escribe: 612 345 678
  if (telefono) {
    telefono.addEventListener("input", function () {
      var d = telefono.value.replace(/\D/g, "").replace(/^34/, "").slice(0, 9);
      telefono.value = d.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
      if (telefono.classList.contains("is-invalid")) clearError(telefono);
    });
  }
  if (nombre) {
    nombre.addEventListener("input", function () {
      if (nombre.classList.contains("is-invalid")) clearError(nombre);
    });
  }

  // Navegación entre pasos
  $$(".js-next", form).forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!validateStep(current)) {
        var f = panelAt(current).querySelector(".field");
        if (f) f.focus();
        return;
      }
      goTo(current + 1, "next");
    });
  });

  $$(".js-back", form).forEach(function (btn) {
    btn.addEventListener("click", function () { goTo(current - 1, "back"); });
  });

  // Enter avanza de paso (en el textarea permite salto de línea)
  form.addEventListener("keydown", function (ev) {
    if (ev.key !== "Enter" || ev.shiftKey) return;
    if (ev.target.tagName === "TEXTAREA") return;
    ev.preventDefault();
    if (current < TOTAL) {
      var next = panelAt(current).querySelector(".js-next");
      if (next) next.click();
    } else {
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });

  // Envío
  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function buildThanksMessage(data) {
    var base = "Hola, soy " + data.nombre + ", acabo de rellenar el formulario de la web.";
    return data.motivo
      ? base + " Me gustaría hablar sobre: " + data.motivo
      : base + " Me gustaría reservar mi primera sesión.";
  }

  function showThanks(data) {
    form.hidden = true;
    var nameEl = $("#thanks-name");
    if (nameEl) nameEl.textContent = capitalize(data.nombre.split(/\s+/)[0]);

    var waThanks = $("#wa-thanks");
    if (waThanks) waThanks.href = waUrl(buildThanksMessage(data));
    setWaLinks(buildThanksMessage(data));

    thanks.hidden = false;
    document.body.classList.add("is-thanks");
    thanks.focus({ preventScroll: true });
    thanks.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    hideStickyBar();
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!validateNombre()) { goTo(1, "back"); return; }
    if (!validateTelefono()) { goTo(2, "back"); return; }

    var data = {
      nombre: nombre.value.trim(),
      telefono: "+34 " + telefono.value.trim(),
      motivo: motivo ? motivo.value.trim() : "",
      web: ($("#web") ? $("#web").value : ""),
      eventId: eventId,
      origen: "landing-reserva",
      url: window.location.href,
      referrer: document.referrer || "",
      utm: utm
    };

    var submitBtn = $(".js-submit", form);
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enviando…";
    }

    trackLead("formulario");

    // El backend no bloquea: gracias y WhatsApp funcionan aunque falle.
    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      showThanks(data);
    };

    var timer = setTimeout(finish, 4000);

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      keepalive: true
    })["catch"](function () { /* la red falla: seguimos igualmente */ })
      .then(function () { clearTimeout(timer); finish(); });
  });

  // Barra fija móvil: aparece pasado el hero y se esconde sobre el formulario.
  var bar = $("#stickybar");
  var hero = $("#hero");
  var formSection = $("#formulario");
  var pastHero = false;
  var formVisible = false;

  function syncStickyBar() {
    if (!bar) return;
    var show = pastHero && !formVisible && form && !form.hidden;
    if (show) {
      bar.hidden = false;
      requestAnimationFrame(function () { bar.classList.add("is-visible"); });
      document.body.classList.add("has-stickybar");
    } else {
      bar.classList.remove("is-visible");
      document.body.classList.remove("has-stickybar");
    }
  }

  function hideStickyBar() {
    formVisible = true;
    syncStickyBar();
  }

  if ("IntersectionObserver" in window && bar) {
    if (hero) {
      new IntersectionObserver(function (entries) {
        pastHero = !entries[0].isIntersecting;
        syncStickyBar();
      }, { rootMargin: "-40px 0px 0px 0px" }).observe(hero);
    }
    if (formSection) {
      new IntersectionObserver(function (entries) {
        formVisible = entries[0].isIntersecting;
        syncStickyBar();
      }, { threshold: 0.12 }).observe(formSection);
    }
  }

  // CTAs: scroll suave y foco en el primer campo.
  $$(".js-cta").forEach(function (cta) {
    cta.addEventListener("click", function (ev) {
      if (!formSection) return;
      ev.preventDefault();
      formSection.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      window.setTimeout(function () {
        if (form.hidden) return;
        var field = panelAt(current) && panelAt(current).querySelector(".field");
        if (field) field.focus({ preventScroll: true });
      }, reduceMotion ? 60 : 620);
    });
  });

  updateProgress();
})();
