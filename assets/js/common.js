// Shared helpers: content loading, header, menu, film player, lightbox, reveal-on-scroll.
const KA = (() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const KA_reduced = reduced;
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  let cache;
  async function load() {
    if (cache) return cache;
    const [p, pr] = await Promise.all([
      fetch("/content/profile.json").then((r) => r.json()),
      fetch("/content/projects.json").then((r) => r.json()),
    ]);
    const projects = (pr.projects || []).slice().sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    cache = { profile: p, projects };
    return cache;
  }

  // Accepts a bare YouTube id or any youtube.com / youtu.be URL.
  function ytId(v = "") {
    v = String(v).trim();
    if (!v) return "";
    const m = v.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
    return m ? m[1] : /^[\w-]{11}$/.test(v) ? v : "";
  }
  const playable = (p) => (p.films || []).filter((f) => ytId(f.youtube));
  // Films that can play on the site (self-hosted file, or YouTube as a fallback).
  const filmsOf = (p) => {
    const f = (p.films || []).filter((x) => x.video || ytId(x.youtube));
    return f.length ? f : p.preview ? [{ title: p.subtitle || p.title, video: p.preview }] : [];
  };
  // Width ÷ height of a film: stored "1920:1080", else the project's orientation.
  const ratio = (f, p) => {
    const m = String((f && f.aspect) || "").match(/(\d+(?:\.\d+)?)\s*[:x\/]\s*(\d+(?:\.\d+)?)/);
    if (m) return +m[1] / +m[2];
    return ((f && f.orientation) || (p && p.orientation)) === "vertical" ? 9 / 16 : 16 / 9;
  };
  function fullscreen(v) {
    if (!v) return;
    if (v.requestFullscreen) {
      v.requestFullscreen().then(() => { v.controls = true; v.play().catch(() => {}); }).catch(() => {});
      const off = () => { if (!document.fullscreenElement) { v.controls = false; document.removeEventListener("fullscreenchange", off); } };
      document.addEventListener("fullscreenchange", off);
    } else if (v.webkitEnterFullscreen) {
      v.webkitEnterFullscreen(); // iPhone
    }
  }
  // Small window thumbnail for an image under /assets/media/ (falls back to the full image via onerror).
  const thumb = (x = "") => (x.startsWith("/assets/media/") && !x.startsWith("/assets/media/thumbs/") ? "/assets/media/thumbs/" + x.slice(14) : x);
  const ICON = {
    muted: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m23 9-6 6M17 9l6 6"/></svg>',
    sound: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    fs: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>',
  };
  const projectUrl = (p) => `/work/?p=${encodeURIComponent(p.slug)}`;
  const focus = (p) => (p.cover_focus && p.cover_focus !== "center" ? p.cover_focus : "center");

  function header() {
    const h = $(".site-header");
    if (h && !h.classList.contains("always")) {
      const on = () => h.classList.toggle("solid", scrollY > innerHeight * 0.6);
      addEventListener("scroll", on, { passive: true });
      on();
    }
    const btn = $(".menu-btn"), menu = $(".mobile-menu");
    if (btn && menu) {
      const set = (o) => { menu.classList.toggle("open", o); btn.setAttribute("aria-expanded", o); document.body.style.overflow = o ? "hidden" : ""; };
      btn.addEventListener("click", () => set(!menu.classList.contains("open")));
      $$("a", menu).forEach((a) => a.addEventListener("click", () => set(false)));
    }
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
    $$("[data-top]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: KA_reduced ? "auto" : "smooth" }); }));
    // "Back" returns to where the visitor came from on this site, otherwise home.
    $$("[data-back]").forEach((a) => a.addEventListener("click", (e) => {
      if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) { e.preventDefault(); history.back(); }
    }));
  }

  function reveal() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  // ---- modal: films (YouTube) and image galleries ----
  let modal, list = [], idx = 0, lastFocus;
  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("div");
    modal.className = "modal";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `<button class="x" aria-label="Close">✕</button><button class="nav prev" aria-label="Previous">←</button><div class="stage-m"></div><button class="nav next" aria-label="Next">→</button><div class="cap mono"></div>`;
    document.body.appendChild(modal);
    $(".x", modal).onclick = close;
    $(".prev", modal).onclick = () => step(-1);
    $(".next", modal).onclick = () => step(1);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    addEventListener("keydown", (e) => {
      if (modal.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    });
    return modal;
  }
  function render() {
    const it = list[idx], st = $(".stage-m", modal);
    st.innerHTML = "";
    if (it.youtube) {
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${it.youtube}?autoplay=1&rel=0&modestbranding=1`;
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      f.title = it.title || "Film";
      if (it.vertical) f.className = "v";
      st.appendChild(f);
    } else {
      const img = new Image();
      img.src = it.src;
      img.alt = it.title || "";
      st.appendChild(img);
    }
    $(".cap", modal).textContent = list.length > 1 ? `${it.title || ""} — ${idx + 1} / ${list.length}` : it.title || "";
    $$(".nav", modal).forEach((b) => (b.hidden = list.length < 2));
  }
  function open(items, i = 0) {
    ensureModal();
    list = items; idx = i; lastFocus = document.activeElement;
    render();
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("show"));
    document.body.style.overflow = "hidden";
    $(".x", modal).focus();
  }
  function close() {
    modal.classList.remove("show");
    setTimeout(() => { modal.hidden = true; $(".stage-m", modal).innerHTML = ""; }, 300);
    document.body.style.overflow = "";
    lastFocus && lastFocus.focus();
  }
  function step(d) { if (list.length < 2) return; idx = (idx + d + list.length) % list.length; render(); }
  const isV = (p, f) => ((f && f.orientation) || p.orientation) === "vertical";
  const playFilms = (p, i = 0) => open(playable(p).map((f) => ({ youtube: ytId(f.youtube), title: `${p.title} — ${f.title}`, vertical: isV(p, f) })), i);

  function fillProfile(profile) {
    $$("[data-cv]").forEach((a) => { a.href = profile.cv_file || "/cv/"; a.target = "_blank"; a.rel = "noopener"; a.removeAttribute("download"); });
    const c = profile.contact || {};
    $$("[data-email]").forEach((a) => { a.href = `mailto:${c.email}`; if (a.dataset.email === "text") a.firstChild.textContent = c.email + " "; });
    $$("[data-whatsapp]").forEach((a) => (a.href = `https://wa.me/${String(c.whatsapp || "").replace(/\D/g, "")}`));
    $$("[data-linkedin]").forEach((a) => (a.href = c.linkedin));
    $$("[data-instagram]").forEach((a) => (a.href = c.instagram));
  }

  return { thumb, filmsOf, ratio, fullscreen, ICON, isV, $, $$, esc, load, ytId, playable, projectUrl, focus, header, reveal, open, playFilms, fillProfile, reduced };
})();
