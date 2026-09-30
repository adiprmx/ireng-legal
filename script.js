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
        /* Mode Cepat: bab yang tertutup jangan merebut status aktif —
           bab yang sedang terbuka yang berkuasa atas rail + dropdown. */
        if (typeof viewMode !== "undefined" && viewMode === "cepat" && e.target.classList.contains("is-closed")) return;
        links.forEach(function (l) {
          l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id);
        });
        if (typeof chapterJump !== "undefined" && chapterJump && document.activeElement !== chapterJump) {
          chapterJump.value = e.target.id;
        }
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


  /* ——— UX satset: mode Cepat, lompat bab, dan pencarian ——— */
  var quickbar = document.getElementById("quickbar"),
      chapterSearch = document.getElementById("chapterSearch"),
      clearSearch = document.getElementById("clearSearch"),
      chapterJump = document.getElementById("chapterJump"),
      quickResults = document.getElementById("quickResults"),
      chapters = Array.prototype.slice.call(document.querySelectorAll("main .chapter[id]")),
      chaptersById = {},
      viewButtons = Array.prototype.slice.call(document.querySelectorAll(".view-switch button")),
      viewMode = "cepat";

  function syncQuickbarHeight() {
    if (quickbar) document.documentElement.style.setProperty("--qb", quickbar.offsetHeight + "px");
  }

  function refreshFaqHeights(scope) {
    (scope || document).querySelectorAll(".faq-item.open .faq-a").forEach(function (a) {
      a.style.maxHeight = a.scrollHeight + "px";
    });
  }

  function chapterTitle(chapter) {
    var h2 = chapter.querySelector("h2");
    return h2 && h2.childNodes.length ? h2.childNodes[0].textContent.trim() : chapter.id;
  }

  chapters.forEach(function (chapter) {
    var h2 = chapter.querySelector("h2");
    if (!h2) return;
    var bodyWrap = document.createElement("div");
    bodyWrap.className = "chapter-body";
    bodyWrap.id = chapter.id + "-body";
    var node = h2.nextSibling;
    while (node) {
      var next = node.nextSibling;
      bodyWrap.appendChild(node);
      node = next;
    }
    chapter.appendChild(bodyWrap);
    chapter._bodyWrap = bodyWrap;

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "chapter-toggle";
    toggle.innerHTML = "<span aria-hidden='true'>▾</span>";
    toggle.setAttribute("aria-controls", bodyWrap.id);
    toggle.setAttribute("aria-label", "Buka atau tutup bab " + chapterTitle(chapter));
    chapter._toggle = toggle;
    h2.appendChild(toggle);
    chaptersById[chapter.id] = chapter;

    toggle.addEventListener("click", function () {
      if (viewMode !== "cepat") return;
      var willOpen = chapter.classList.contains("is-closed");
      chapters.forEach(function (other) { setChapterOpen(other, other === chapter ? willOpen : false); });
      if (willOpen) { markActive(chapter.id); window.requestAnimationFrame(function () { refreshFaqHeights(chapter); }); }
    });
  });

  function setChapterOpen(chapter, open) {
    chapter.classList.toggle("is-closed", !open);
    if (chapter._bodyWrap) chapter._bodyWrap.hidden = viewMode === "cepat" && !open;
    if (chapter._toggle) chapter._toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function markActive(id) {
    links.forEach(function (l) { l.classList.toggle("active", l.getAttribute("href") === "#" + id); });
    if (chapterJump) chapterJump.value = id;
  }

  function activateChapter(id, opts) {
    var chapter = chaptersById[id];
    if (!chapter) return;
    opts = opts || {};
    if (viewMode === "cepat") {
      chapters.forEach(function (other) { setChapterOpen(other, other === chapter); });
    }
    markActive(id);
    if (opts.scroll !== false) {
      window.requestAnimationFrame(function () {
        chapter.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        refreshFaqHeights(chapter);
      });
    }
  }

  function setView(mode, activeId) {
    viewMode = mode === "penuh" ? "penuh" : "cepat";
    document.body.setAttribute("data-view", viewMode);
    viewButtons.forEach(function (btn) {
      var active = btn.getAttribute("data-view") === viewMode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (viewMode === "penuh") {
      chapters.forEach(function (chapter) { setChapterOpen(chapter, true); });
    } else {
      var keep = chaptersById[activeId] || chapters.filter(function (c) { return !c.classList.contains("is-closed"); })[0] || chapters[0];
      chapters.forEach(function (chapter) { setChapterOpen(chapter, chapter === keep); });
      if (keep) markActive(keep.id);
    }
    try { localStorage.setItem("ireng-legal-view", viewMode); } catch (e) {}
    window.requestAnimationFrame(function () { syncQuickbarHeight(); refreshFaqHeights(document); });
  }

  if (chapterJump) {
    var firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = "Pilih bab…";
    chapterJump.appendChild(firstOption);
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      if (!chaptersById[id]) return;
      var option = document.createElement("option");
      option.value = id;
      var num = link.querySelector(".n");
      option.textContent = (num ? num.textContent.trim() + " · " : "") + chapterTitle(chaptersById[id]);
      chapterJump.appendChild(option);
    });
    chapterJump.addEventListener("change", function () {
      if (chapterJump.value) activateChapter(chapterJump.value, { scroll: true });
    });
  }

  function pushHash(id) { try { history.pushState(null, "", "#" + id); } catch (e) {} }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (ev) {
      var id = link.getAttribute("href").slice(1);
      if (!chaptersById[id]) return;
      ev.preventDefault();
      activateChapter(id, { scroll: true });
      pushHash(id);
    });
  });

  viewButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var current = chapters.filter(function (c) { return !c.classList.contains("is-closed"); })[0] || chapters[0];
      setView(btn.getAttribute("data-view"), current ? current.id : null);
    });
  });

  function snippetFor(chapter, q) {
    var text = chapter.textContent.replace(/\s+/g, " ").trim();
    var idx = text.toLowerCase().indexOf(q);
    if (idx < 0) return text.slice(0, 118) + "…";
    var start = Math.max(0, idx - 36), end = Math.min(text.length, idx + q.length + 68);
    return (start ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  }

  function renderSearch() {
    if (!chapterSearch || !quickResults) return;
    var q = chapterSearch.value.trim().toLowerCase();
    if (clearSearch) clearSearch.hidden = !q;
    chapters.forEach(function (chapter) { chapter.classList.remove("search-match"); });
    if (q.length < 2) {
      quickResults.hidden = true;
      quickResults.innerHTML = "";
      syncQuickbarHeight();
      return;
    }
    var matches = chapters.filter(function (chapter) {
      return chapter.textContent.toLowerCase().indexOf(q) !== -1;
    });
    matches.forEach(function (chapter) { chapter.classList.add("search-match"); });
    if (!matches.length) {
      quickResults.innerHTML = "<p class='quick-results-head'><strong>0 bab ketemu</strong></p><div class='no-result'>Nggak ketemu buat “" + q.replace(/</g, "&lt;") + "”. Coba kata yang lebih umum.</div>";
    } else {
      var html = "<p class='quick-results-head'><strong>" + matches.length + " bab ketemu</strong> — klik buat langsung lompat.</p><div class='result-list'>";
      matches.slice(0, 6).forEach(function (chapter) {
        html += "<button type='button' class='result-chip' data-target='" + chapter.id + "'><strong>" + chapterTitle(chapter) + "</strong><span>" + snippetFor(chapter, q).replace(/</g, "&lt;") + "</span></button>";
      });
      html += "</div>";
      quickResults.innerHTML = html;
      quickResults.querySelectorAll(".result-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          activateChapter(chip.getAttribute("data-target"), { scroll: true });
          pushHash(chip.getAttribute("data-target"));
        });
      });
    }
    quickResults.hidden = false;
    syncQuickbarHeight();
  }

  if (chapterSearch) {
    chapterSearch.addEventListener("input", renderSearch);
    chapterSearch.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        var first = quickResults.querySelector(".result-chip");
        if (first) { ev.preventDefault(); first.click(); }
      }
      if (ev.key === "Escape") {
        chapterSearch.value = "";
        renderSearch();
        chapterSearch.blur();
      }
    });
  }
  if (clearSearch && chapterSearch) {
    clearSearch.addEventListener("click", function () {
      chapterSearch.value = "";
      renderSearch();
      chapterSearch.focus();
    });
  }
  document.addEventListener("keydown", function (ev) {
    var tag = document.activeElement && document.activeElement.tagName;
    if (ev.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(tag || "")) {
      ev.preventDefault();
      if (chapterSearch) chapterSearch.focus();
    }
  });

  try { viewMode = localStorage.getItem("ireng-legal-view") || "cepat"; } catch (e) { viewMode = "cepat"; }
  var initialId = location.hash ? location.hash.slice(1) : null;
  setView(viewMode, chaptersById[initialId] ? initialId : (chapters[0] && chapters[0].id));
  if (chaptersById[initialId]) activateChapter(initialId, { scroll: true });
  syncQuickbarHeight();
  window.addEventListener("resize", function () { syncQuickbarHeight(); refreshFaqHeights(document); });

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
