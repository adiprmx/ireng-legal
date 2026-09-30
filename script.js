/* Ireng legal pages — interactions v2 */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ——— reading progress + hero parallax ——— */
  var bar = document.getElementById("progress"),
      heroInner = document.querySelector(".hero-inner"),
      mark = document.querySelector(".watermark"),
      topBtn = document.getElementById("topBtn"),
      ticking = false;

  function onScroll() {
    var h = document.documentElement,
        max = h.scrollHeight - h.clientHeight,
        p = max > 0 ? h.scrollTop / max : 0;
    bar.style.width = (p * 100) + "%";
    topBtn.classList.toggle("show", h.scrollTop > 700);
    if (!reduced && heroInner && h.scrollTop < window.innerHeight) {
      var y = h.scrollTop;
      heroInner.style.transform = "translateY(" + y * 0.22 + "px)";
      heroInner.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.75));
      if (mark) mark.style.transform = "translate(-50%, calc(-52% + " + y * 0.12 + "px))";
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  topBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  /* ——— reveal on scroll ——— */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.07, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ——— scrollspy ——— */
  var links = Array.prototype.slice.call(document.querySelectorAll(".rail a[href^='#']"));
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        links.forEach(function (l) {
          l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id);
        });
      }
    });
  }, { rootMargin: "-28% 0px -62% 0px" });
  document.querySelectorAll("main .chapter[id]").forEach(function (s) { spy.observe(s); });

  /* ——— FAQ accordion ——— */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q"), a = item.querySelector(".faq-a");
    q.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
      q.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ——— copy chapter link + toast ——— */
  var toast = document.getElementById("toast"), toastT;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove("show"); }, 2200);
  }
  document.querySelectorAll(".copylink").forEach(function (btn) {
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      var url = location.origin + location.pathname + "#" + btn.dataset.target;
      function done() { showToast("Tautan bab disalin ✓"); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { showToast(url); });
      } else { showToast(url); }
    });
  });

  /* ——— cursor glow (desktop) ——— */
  var glow = document.getElementById("glow");
  if (glow && window.matchMedia("(hover:hover) and (pointer:fine)").matches && !reduced) {
    var gx = -600, gy = -600, tx = gx, ty = gy;
    window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function follow() {
      gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08;
      glow.style.transform = "translate(" + (gx - 280) + "px," + (gy - 280) + "px)";
      window.requestAnimationFrame(follow);
    })();
  } else if (glow) { glow.style.display = "none"; }

  /* ——— gold dust canvas: fine dust + bokeh orbs ——— */
  var cv = document.getElementById("dust");
  if (cv && !reduced) {
    var ctx = cv.getContext("2d"), W, H, dust = [], orbs = [];
    function size() {
      var r = cv.parentElement.getBoundingClientRect();
      W = cv.width = r.width; H = cv.height = r.height;
    }
    size(); window.addEventListener("resize", size);
    for (var i = 0; i < 70; i++) dust.push({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.7 + 0.4,
      s: Math.random() * 0.00045 + 0.00012,
      o: Math.random() * 0.5 + 0.15,
      ph: Math.random() * 6.28, dx: (Math.random() - 0.5) * 0.0003
    });
    for (var j = 0; j < 7; j++) orbs.push({
      x: Math.random(), y: Math.random() * 0.8 + 0.1,
      r: Math.random() * 46 + 26,
      vx: (Math.random() - 0.5) * 0.00022, vy: (Math.random() - 0.5) * 0.00016,
      o: Math.random() * 0.05 + 0.025, ph: Math.random() * 6.28
    });
    (function tick(t) {
      ctx.clearRect(0, 0, W, H);
      var k;
      for (k = 0; k < orbs.length; k++) {
        var o = orbs[k];
        o.x = (o.x + o.vx + 1) % 1; o.y = (o.y + o.vy + 1) % 1;
        var g = ctx.createRadialGradient(o.x * W, o.y * H, 0, o.x * W, o.y * H, o.r);
        g.addColorStop(0, "rgba(212,175,55," + (o.o * (0.7 + 0.3 * Math.sin(t * 0.0006 + o.ph))) + ")");
        g.addColorStop(1, "rgba(212,175,55,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(o.x * W, o.y * H, o.r, 0, 6.29); ctx.fill();
      }
      for (k = 0; k < dust.length; k++) {
        var p = dust[k];
        var tw = 0.55 + 0.45 * Math.sin(t * 0.001 + p.ph);
        var yy = (((p.y - (t * p.s % 1)) % 1) + 1) % 1;
        var xx = (p.x + t * p.dx) % 1;
        ctx.beginPath();
        ctx.arc(xx * W, yy * H, p.r, 0, 6.29);
        ctx.fillStyle = "rgba(232,201,106," + (p.o * tw) + ")";
        ctx.fill();
      }
      window.requestAnimationFrame(tick);
    })(0);
  }
})();
