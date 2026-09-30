/* IRENG LEGAL v3 — interactions.
   Motion budget: reveals guide reading order, parallax gives the
   hero texture depth, everything else is feedback. Nothing loops
   for decoration. All of it settles under reduced-motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* reading progress + back-to-top visibility (rAF-batched) */
  var bar = document.getElementById("progress");
  var toTop = document.getElementById("toTop");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
      toTop.classList.toggle("show", h.scrollTop > 700);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  /* reveal on enter */
  var rv = document.querySelectorAll(".rv");
  if (reduce || !("IntersectionObserver" in window)) {
    rv.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* scrollspy for the chapter rail */
  var links = Array.prototype.slice.call(document.querySelectorAll(".rail a"));
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window && links.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("act"); });
          var a = byId[e.target.id];
          if (a) a.classList.add("act");
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    document.querySelectorAll("section[id]").forEach(function (s) { spy.observe(s); });
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    q.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
    });
  });

  /* copy chapter deep-link */
  var toast = document.getElementById("toast");
  var toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }
  document.querySelectorAll(".copylink").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var url = location.origin + location.pathname + "#" + btn.getAttribute("data-target");
      function done() { showToast("Tautan bab tersalin. Tinggal tempel di mana aja."); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { showToast(url); });
      } else { showToast(url); }
    });
  });

  /* hero texture parallax: depth cue only, transform-only */
  var fig = document.querySelector(".hero-fig img");
  if (fig && !reduce) {
    var pTick = false;
    window.addEventListener("scroll", function () {
      if (pTick) return;
      pTick = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          fig.style.transform = "translate3d(0," + (y * -0.05) + "px,0)";
        }
        pTick = false;
      });
    }, { passive: true });
  }
})();
