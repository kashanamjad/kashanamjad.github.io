(async () => {
  const { $, $$, esc, load, projectUrl, focus, header, reveal, fillProfile, reduced, ratio, filmsOf, fullscreen, ICON, open, thumb } = KA;
  header();
  const { profile: me, projects } = await load();
  fillProfile(me);

  // 1. Intro
  $("#portrait").style.backgroundImage = `url(${me.portrait})`;
  $("#status").textContent = `● ${me.location} — ${me.status}`;
  $("#first").textContent = me.name_first;
  $("#last").textContent = me.name_last;
  $("#title").textContent = me.title;
  $("#subline").textContent = me.subline;
  $("#intro").textContent = me.intro;
  $("#clients").textContent = (me.worked_with || []).join(" · ");
  $("#contact-h").innerHTML = `${esc(me.contact.headline)} <span class="serif">${esc(me.contact.headline_accent)}</span>`;

  // 2. Stacked carousel — each card is a player sized to its film's real shape.
  const P = projects.filter((p) => p.featured);
  const stage = $("#stage"), dots = $("#dots"), wins = $("#fwins");
  let cur = 0, muted = true;
  const filmIdx = P.map(() => 0);

  const cards = P.map((p, i) => {
    const c = document.createElement("div");
    c.className = "card";
    c.style.backgroundImage = `url(${p.cover})`;
    c.style.setProperty("--pos", focus(p));
    c.setAttribute("role", "group");
    c.setAttribute("aria-label", `${p.title}, ${i + 1} of ${P.length}`);
    c.innerHTML = `<video playsinline loop preload="none" muted></video><img class="still" alt="${esc(p.title)} photograph" />
      <div class="mini">${esc(p.title)}</div>
      <div class="ctrls"><button class="ctl snd" aria-label="Turn sound on">${ICON.muted}</button><button class="ctl fs" aria-label="Full screen">${ICON.fs}</button></div>
      <div class="progress"><i></i></div>`;
    const v = c.querySelector("video");
    v.addEventListener("playing", () => c.classList.add("playing"));
    v.addEventListener("loadedmetadata", () => { if (v.videoWidth) { c.dataset.r = v.videoWidth / v.videoHeight; layout(); } });
    v.addEventListener("timeupdate", () => { if (v.duration) c.querySelector(".progress i").style.width = `${(v.currentTime / v.duration) * 100}%`; });
    c.querySelector(".snd").onclick = (e) => { e.stopPropagation(); muted = !muted; syncSound(); };
    c.querySelector(".fs").onclick = (e) => {
      e.stopPropagation();
      const m = film(i);
      if (m && m.kind === "photo") { const ph = M[i].filter((x) => x.kind === "photo"); open(ph.map((x) => ({ src: x.src, title: P[i].title })), ph.indexOf(m)); }
      else fullscreen(v);
    };
    // Only side cards are clickable: they bring that project forward.
    c.addEventListener("click", () => { if (!dragged && i !== cur) go(i); });
    stage.appendChild(c);
    const d = document.createElement("button");
    d.setAttribute("aria-label", `Show ${p.title}`);
    d.onclick = () => go(i);
    dots.appendChild(d);
    return c;
  });

  // Each project's slides: its films first, then its photos (for projects with a real photo set).
  const mediaOf = (p) => [
    ...filmsOf(p).map((f) => ({ ...f, kind: "film" })),
    ...(p.show_in_photography ? (p.stills || []).map((s, k) => ({ kind: "photo", src: s, title: `Photo ${k + 1}` })) : []),
  ];
  const M = P.map(mediaOf);
  const film = (i) => M[i][filmIdx[i]];
  function load_(i) {
    const c = cards[i], m = film(i), v = c.querySelector("video"), img = c.querySelector(".still");
    const photo = !!m && m.kind === "photo";
    c.classList.toggle("is-photo", photo);
    if (photo) {
      if (!v.paused) v.pause();
      if (img.getAttribute("src") !== m.src) {
        img.style.opacity = 0;
        const pre = new Image();
        pre.onload = () => { img.src = m.src; c.dataset.r = pre.naturalWidth / pre.naturalHeight; img.style.opacity = ""; layout(); };
        pre.src = m.src;
      } else if (img.naturalWidth) { c.dataset.r = img.naturalWidth / img.naturalHeight; }
      return null;
    }
    const src = (m && m.video) || P[i].preview || "";
    if (!src || reduced) return null;
    if (v.getAttribute("src") !== src) { c.classList.remove("playing"); v.src = src; delete c.dataset.r; }
    else if (v.videoWidth) c.dataset.r = v.videoWidth / v.videoHeight;
    return v;
  }
  function syncSound() {
    cards.forEach((c, i) => {
      const v = c.querySelector("video"), on = i === cur && !muted;
      v.muted = !on;
      const b = c.querySelector(".snd");
      b.innerHTML = on ? ICON.sound : ICON.muted;
      b.setAttribute("aria-label", on ? "Mute" : "Turn sound on");
    });
  }

  const mob = () => innerWidth <= 860;
  function layout() {
    const n = P.length, sh = stage.clientHeight, sw = innerWidth;
    const W = mob() ? Math.min(sw * 0.86, sh * 1.778) : Math.min(sw * 0.56, 960, sh * 1.778);
    const VH = mob() ? Math.min(sh, sw * 0.66 * 16 / 9) : Math.min(sh, (W * 9) / 16 * 1.35);
    cards.forEach((c, i) => {
      let d = i - cur;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      const a = Math.abs(d);
      // Exact shape: from the loaded video, else the film's stored aspect, else the project orientation.
      const r = +c.dataset.r || ratio(film(i), P[i]);
      let w, h;
      if (r >= 1) { w = W; h = W / r; if (h > sh) { h = sh; w = h * r; } }
      else { h = VH; w = h * r; }
      c.style.width = w + "px";
      c.style.height = h + "px";
      const step = mob() ? [0, 0.62, 0.98] : [0, 0.5, 0.86], sc = mob() ? [1, 0.84, 0.7] : [1, 0.76, 0.58];
      const x = (a > 2 ? 1.3 : step[a]) * W * Math.sign(d), s = a > 2 ? 0.4 : sc[a];
      c.style.transform = `translate(calc(-50% + ${x}px), -50%) scale(${s})`;
      c.style.zIndex = 10 - a;
      c.style.opacity = a > 2 ? 0 : 1;
      c.style.filter = a === 0 ? "none" : `brightness(${a === 1 ? 0.5 : 0.3}) saturate(.8)`;
      c.style.pointerEvents = a > 2 ? "none" : "auto";
      c.classList.toggle("active", a === 0);
    });
    [...dots.children].forEach((d, i) => d.toggleAttribute("aria-current", i === cur));
  }
  function play() {
    cards.forEach((c, i) => {
      const v = c.querySelector("video");
      if (i === cur) { const lv = load_(i); if (lv) lv.play().catch(() => {}); }
      else if (v.getAttribute("src")) { v.pause(); v.removeAttribute("src"); v.load(); c.classList.remove("playing"); } // stop downloading films that left the screen
    });
    syncSound();
  }
  // Windows under the active card, split by a Films | Photos switch.
  const tab = M.map((m) => (m.some((x) => x.kind === "film") ? "film" : "photo"));
  function filmWindows() {
    const all = M[cur], nf = all.filter((m) => m.kind === "film").length, np = all.length - nf;
    const list = all.map((m, k) => ({ m, k })).filter((x) => x.m.kind === tab[cur]);
    const sw = nf && np
      ? `<div class="fswitch" role="tablist" aria-label="Show films or photos">
           <button role="tab" data-t="film" aria-selected="${tab[cur] === "film"}">${nf > 1 ? "Films" : "Film"} <span>${nf}</span></button>
           <button role="tab" data-t="photo" aria-selected="${tab[cur] === "photo"}">Photos <span>${np}</span></button></div>` : "";
    const row = list.length > 1 || (sw && list.length)
      ? `<div class="frow">${list.map(({ m, k }) => {
          const full = m.kind === "photo" ? m.src : m.poster || P[cur].cover;
          return `<button class="fwin${m.kind === "photo" ? " photo" : ""}${k === filmIdx[cur] ? " on" : ""}" data-k="${k}" aria-label="${esc(m.title)}">
            <img src="${esc(thumb(full))}" data-full="${esc(full)}" alt="" loading="lazy" onerror="this.onerror=null;this.src=this.dataset.full">
            ${m.kind === "photo" ? "" : `<span>${esc(m.title)}</span>`}</button>`; }).join("")}</div>` : "";
    wins.innerHTML = sw + row;
    wins.classList.toggle("has", !!(sw || row));
    $$(".fswitch button", wins).forEach((b) => (b.onclick = () => {
      tab[cur] = b.dataset.t;
      filmIdx[cur] = M[cur].findIndex((m) => m.kind === tab[cur]);
      filmWindows(); play(); layout();
    }));
    $$(".fwin", wins).forEach((b) => (b.onclick = () => {
      filmIdx[cur] = +b.dataset.k; filmWindows(); play(); layout();
      const on = $(".fwin.on", wins); if (on) on.scrollIntoView({ inline: "nearest", block: "nearest" });
    }));
  }
  function info() {
    const p = P[cur], el = $("#info");
    el.classList.add("out");
    setTimeout(() => {
      $("#c-count").textContent = `${String(cur + 1).padStart(2, "0")} / ${P.length} · ${p.type || ""}`;
      $("#c-title").textContent = p.title;
      $("#c-sub").textContent = p.subtitle || "";
      $("#c-agency").textContent = p.agency || "—";
      $("#c-role").textContent = p.role || "";
      el.classList.remove("out");
    }, 300);
    $("#c-ctas").innerHTML = `<a class="pill solid" href="${projectUrl(p)}">View project <i>→</i></a>`;
    $("#ambient").style.backgroundImage = `url(${p.cover})`;
  }
  function go(i) { cur = (i + P.length) % P.length; layout(); info(); filmWindows(); play(); }
  $("#next").onclick = () => go(cur + 1);
  $("#prev").onclick = () => go(cur - 1);

  const reel = $("#work");
  const inView = () => { const r = reel.getBoundingClientRect(); return r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5; };
  addEventListener("keydown", (e) => {
    if (!inView() || document.fullscreenElement || document.querySelector(".modal.show")) return;
    if (e.key === "ArrowRight") go(cur + 1);
    if (e.key === "ArrowLeft") go(cur - 1);
  });
  let x0 = null, dragged = false;
  stage.addEventListener("pointerdown", (e) => { if (e.target.closest(".ctl")) return; x0 = e.clientX; dragged = false; });
  addEventListener("pointermove", (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 8) dragged = true; });
  addEventListener("pointerup", (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (dx < -50) go(cur + 1); else if (dx > 50) go(cur - 1);
    setTimeout(() => (dragged = false), 0);
  });
  let lock = 0;
  stage.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) || Math.abs(e.deltaX) < 15) return;
    e.preventDefault();
    if (Date.now() < lock) return;
    lock = Date.now() + 700;
    go(cur + (e.deltaX > 0 ? 1 : -1));
  }, { passive: false });
  // Pause when the carousel scrolls out of view.
  new IntersectionObserver(([e]) => {
    const v = cards[cur].querySelector("video");
    if (!v.getAttribute("src")) return;
    e.isIntersecting ? v.play().catch(() => {}) : v.pause();
  }, { threshold: 0.35 }).observe(reel);
  addEventListener("resize", layout);
  go(0);

  // 3. More work: windows (all projects)
  const grid = $("#grid");
  const shape = (i) => (i === 0 ? "big" : i % 7 === 5 ? "wide" : "");
  grid.innerHTML = projects.map((p, i) =>
    `<a class="win ${shape(i)}" data-cat="${esc(p.category)}" href="${projectUrl(p)}" style="background-image:url(${esc(p.cover)});--pos:${esc(focus(p))}">
       <div class="cap glass"><b>${esc(p.title)}</b><span>${esc(p.agency)} · ${esc(p.role)}</span></div></a>`).join("");
  $$("#filters button").forEach((b) => b.addEventListener("click", () => {
    $$("#filters button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    const f = b.dataset.f;
    $$(".win", grid).forEach((w) => (w.hidden = f !== "all" && w.dataset.cat !== f));
  }));

  reveal();
})();
