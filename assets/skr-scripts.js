// Skinritual — JS propio de la tienda. Vanilla, sin librerías externas.
(function () {
  "use strict";

  function initReveal() {
    var els = document.querySelectorAll(".skr-reveal, .skr-reveal-stagger");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("skr-visible"); });
      return;
    }
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("skr-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach(function (el) { obs.observe(el); });
  }

  function initCountUp() {
    var els = document.querySelectorAll(".skr-countup");
    if (!els.length || !("IntersectionObserver" in window)) return;
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          obs.unobserve(el);
          var target = parseFloat(el.getAttribute("data-target") || "0");
          var suffix = el.getAttribute("data-suffix") || "";
          var duration = 1400;
          var start = null;
          function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            var val = target * eased;
            el.textContent = (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.4 }
    );
    els.forEach(function (el) { obs.observe(el); });
  }

  function initGaleriaProducto() {
    var wrap = document.querySelector("[data-skr-galeria]");
    if (!wrap) return;
    var principal = wrap.querySelector("[data-skr-imagen-principal]");
    var thumbs = wrap.querySelectorAll("[data-skr-thumb]");
    if (!principal || !thumbs.length) return;
    thumbs.forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        var full = thumb.getAttribute("data-full");
        var alt = thumb.getAttribute("data-alt") || "";
        if (!full) return;
        principal.src = full;
        principal.alt = alt;
        thumbs.forEach(function (t) { t.classList.remove("skr-thumb-activo"); });
        thumb.classList.add("skr-thumb-activo");
      });
    });
  }

  function initVariantes() {
    var form = document.querySelector("[data-skr-form-producto]");
    if (!form) return;
    var dataEl = form.querySelector("[data-skr-variantes-json]");
    if (!dataEl) return;
    var variantes;
    try {
      variantes = JSON.parse(dataEl.textContent);
    } catch (e) {
      return;
    }
    var selects = form.querySelectorAll("[data-skr-opcion]");
    var idInput = form.querySelector('input[name="id"]');
    var precioEl = form.querySelector("[data-skr-precio]");
    var precioCompareEl = form.querySelector("[data-skr-precio-compare]");
    var botonEl = form.querySelector("[data-skr-boton-comprar]");
    var textoBoton = botonEl ? botonEl.getAttribute("data-texto-normal") : "";
    var textoAgotado = botonEl ? botonEl.getAttribute("data-texto-agotado") : "";

    function moneda(centavos) {
      return (centavos / 100).toLocaleString(document.documentElement.lang || "es", {
        style: "currency",
        currency: (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || "EUR",
      });
    }

    function actualizar() {
      if (!selects.length) return;
      var valores = Array.prototype.map.call(selects, function (s) { return s.value; });
      var match = variantes.find(function (v) {
        return v.options.every(function (opt, i) { return opt === valores[i]; });
      });
      if (!match) return;
      if (idInput) idInput.value = match.id;
      if (precioEl) precioEl.textContent = moneda(match.price);
      if (precioCompareEl) {
        if (match.compare_at_price && match.compare_at_price > match.price) {
          precioCompareEl.textContent = moneda(match.compare_at_price);
          precioCompareEl.style.display = "";
        } else {
          precioCompareEl.style.display = "none";
        }
      }
      if (botonEl) {
        botonEl.disabled = !match.available;
        botonEl.textContent = match.available ? textoBoton : textoAgotado;
      }
    }

    selects.forEach(function (s) { s.addEventListener("change", actualizar); });
    actualizar();
  }

  function initComparador() {
    var els = document.querySelectorAll("[data-skr-comparador]");
    els.forEach(function (wrap) {
      var handle = wrap.querySelector("[data-skr-comparador-handle]");
      var despues = wrap.querySelector("[data-skr-comparador-despues]");
      if (!handle || !despues) return;
      function mover(clientX) {
        var rect = wrap.getBoundingClientRect();
        var pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
        despues.style.clipPath = "inset(0 " + (100 - pct) + "% 0 0)";
        handle.style.left = pct + "%";
      }
      var dragging = false;
      handle.addEventListener("pointerdown", function (e) {
        dragging = true;
        handle.setPointerCapture(e.pointerId);
      });
      handle.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        mover(e.clientX);
      });
      handle.addEventListener("pointerup", function () { dragging = false; });
      wrap.addEventListener("click", function (e) { mover(e.clientX); });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    initCountUp();
    initGaleriaProducto();
    initVariantes();
    initComparador();
  });
})();
