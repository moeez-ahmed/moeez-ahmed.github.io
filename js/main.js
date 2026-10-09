import { SITE, FILMS, PROJECTS, SYSTEMS, EXPERIENCE } from "./data.js";

/* ---------------------------------------------------------------
   Helpers
   --------------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE_POINTER = matchMedia("(hover: hover) and (pointer: fine)").matches;
const SMALL = matchMedia("(max-width: 760px)").matches;
const byId = new Map(PROJECTS.map((p) => [p.id, p]));
const filmById = new Map(FILMS.map((f) => [f.id, f]));

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function fmt(sec) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function parseDuration(text) {
  if (!text) return 0;
  const parts = String(text).split(":").map(Number);
  return parts.reduce((acc, n) => acc * 60 + (Number.isFinite(n) ? n : 0), 0);
}

const WEBGL = (() => {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
})();

/** Mount a 3D scene the first time its canvas comes near the viewport. */
function lazyMount(el, mount, onFail) {
  if (!el) return;
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      Promise.resolve()
        .then(mount)
        .catch((err) => {
          console.warn("3D scene could not start:", err);
          onFail?.();
        });
    },
    { rootMargin: "300px 0px" }
  );
  io.observe(el);
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
}

/* ---------------------------------------------------------------
   Static bindings
   --------------------------------------------------------------- */
function initBindings() {
  $$("[data-bind]").forEach((el) => {
    const value = SITE[el.dataset.bind];
    if (value) el.textContent = value;
  });
  $("#footer-copy").textContent = `© ${new Date().getFullYear()} ${SITE.name}`;
}

/* ---------------------------------------------------------------
   Loader: sand gathers into the initials, then the hero arrives
   --------------------------------------------------------------- */
async function runLoader() {
  const loader = $("#loader");
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    document.body.classList.remove("is-loading");
    loader?.classList.add("is-done");
    setTimeout(() => loader?.remove(), 800);
    try {
      sessionStorage.setItem("ms-intro", "1");
    } catch {}
  };

  // whatever happens below, the page is never left behind the loader
  const failsafe = setTimeout(finish, 3500);
  let seen = false;
  try {
    seen = sessionStorage.getItem("ms-intro") === "1";
  } catch {}
  const canvas = $("#loader-canvas");
  const ctx = canvas?.getContext("2d");
  if (REDUCED || seen || !ctx) {
    clearTimeout(failsafe);
    finish();
    return;
  }

  const W = innerWidth;
  const H = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  try {
    await Promise.race([document.fonts.load('600 200px "Cormorant Garamond"'), new Promise((r) => setTimeout(r, 700))]);
  } catch {}

  const size = Math.min(W * 0.34, 230);
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const o = off.getContext("2d");
  o.fillStyle = "#fff";
  o.font = `600 ${size}px "Cormorant Garamond", Garamond, serif`;
  o.textAlign = "center";
  o.textBaseline = "middle";
  o.fillText(SITE.initials || "", W / 2, H / 2);
  const data = o.getImageData(0, 0, W, H).data;
  const step = Math.max(3, Math.round(size / 60));
  const grains = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 128) {
        grains.push({
          tx: x,
          ty: y,
          sx: x + (Math.random() - 0.5) * W * 0.7,
          sy: H + Math.random() * H * 0.25,
          delay: Math.random() * 380 + (y / H) * 120,
          r: 0.6 + Math.random() * 1.1,
          c: Math.random() < 0.12 ? "224,120,47" : Math.random() < 0.5 ? "207,162,102" : "236,225,203",
        });
      }
    }
  }

  const start = performance.now();
  const GATHER = 900;
  const HOLD_UNTIL = 1450;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    for (const g of grains) {
      let p = clamp((t - g.delay) / GATHER, 0, 1);
      p = easeOut(p);
      let x = g.sx + (g.tx - g.sx) * p;
      let y = g.sy + (g.ty - g.sy) * p;
      if (t > HOLD_UNTIL) {
        const k = (t - HOLD_UNTIL) / 600;
        x += k * k * 140 * (0.5 + g.r);
        y -= k * 40 * g.r;
      }
      ctx.fillStyle = `rgba(${g.c},${0.35 + p * 0.6})`;
      ctx.fillRect(x, y, g.r * 1.6, g.r * 1.6);
    }
    if (t > HOLD_UNTIL && !finished) {
      clearTimeout(failsafe);
      finish();
    }
    if (t < HOLD_UNTIL + 700) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------------------------------------------------------------
   Navigation
   --------------------------------------------------------------- */
function initNav() {
  const nav = $("#nav");
  const toggle = $("#nav-toggle");
  const links = $("#nav-links");

  const onScroll = () => nav.classList.toggle("is-solid", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    links.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && links.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  // highlight the section currently in view
  const map = new Map($$("a[href^='#']", links).map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        map.forEach((a) => a.classList.remove("is-active"));
        map.get(entry.target.id)?.classList.add("is-active");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  map.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) io.observe(section);
  });
}

/* ---------------------------------------------------------------
   Hero
   --------------------------------------------------------------- */
function initHero() {
  const hero = $(".hero");
  const video = $("#hero-video");
  const button = $("#hero-motion");
  const watch = $("#hero-watch");
  let motionOn = !REDUCED;
  let sand = null;
  let heroVisible = true;

  if (SITE.heroPoster) {
    hero.style.backgroundImage = `url("${SITE.heroPoster}")`;
    video.poster = SITE.heroPoster;
  }

  const film = filmById.get(SITE.heroFilm) || FILMS[0];
  if (film) {
    watch.textContent = `Watch ${film.title}`;
    watch.addEventListener("click", () => selectFilm(film.id));
  } else watch.hidden = true;

  function apply() {
    button.setAttribute("aria-pressed", String(!motionOn));
    button.textContent = motionOn ? "Pause background" : "Play background";
    if (motionOn && heroVisible && SITE.heroVideo) {
      if (!video.getAttribute("src")) video.src = SITE.heroVideo;
      video.play().catch(() => {});
    } else video.pause();
    sand?.setPaused(!motionOn);
  }
  button.addEventListener("click", () => {
    motionOn = !motionOn;
    apply();
  });
  if (!SITE.heroVideo) button.hidden = true;

  // pause the background film while it is scrolled away
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    apply();
  }).observe(hero);

  if (WEBGL) {
    import("./three/hero-sand.js")
      .then(({ mountSand }) => {
        sand = mountSand($("#hero-sand"), { count: SMALL ? 2400 : 7000, still: !motionOn });
        let ticking = false;
        addEventListener(
          "scroll",
          () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
              ticking = false;
              sand.setOpacity(clamp(1 - scrollY / (hero.offsetHeight * 0.9), 0, 1));
            });
          },
          { passive: true }
        );
      })
      .catch((err) => console.warn("Sand could not start:", err));
  }
  apply();
}

/* ---------------------------------------------------------------
   Films: tabs + custom player with chapters
   --------------------------------------------------------------- */
const P = {};
let currentFilm = null;

function initFilms() {
  const section = $("#films");
  if (!FILMS.length) {
    section.hidden = true;
    $("a[href='#films']")?.closest("li")?.remove();
    return;
  }
  Object.assign(P, {
    root: $("#player"),
    stage: $("#player-stage"),
    video: $("#film-video"),
    cover: $("#player-cover"),
    pp: $("#pp-btn"),
    mute: $("#mute-btn"),
    fs: $("#fs-btn"),
    scrub: $("#scrub"),
    fill: $("#scrub-fill"),
    buffer: $("#scrub-buffer"),
    thumb: $("#scrub-thumb"),
    ticks: $("#scrub-ticks"),
    now: $("#t-now"),
    total: $("#t-total"),
    chapters: $("#chapters"),
    caseBtn: $("#film-case"),
    tabs: $("#film-tabs"),
  });

  P.tabs.innerHTML = FILMS.map(
    (f) =>
      `<button class="tab" role="tab" type="button" aria-selected="false" aria-controls="player" data-film="${esc(f.id)}">${
        f.native ? `<span class="tab__native" lang="ar">${esc(f.native)}</span>` : ""
      }<span>${esc(f.title)}</span></button>`
  ).join("");
  if (FILMS.length < 2) P.tabs.hidden = true;
  P.tabs.addEventListener("click", (e) => {
    const b = e.target.closest("[data-film]");
    if (b) selectFilm(b.dataset.film);
  });
  P.tabs.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const tabs = $$(".tab", P.tabs);
    const i = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    next.focus();
    selectFilm(next.dataset.film);
  });

  const v = P.video;
  P.cover.addEventListener("click", play);
  v.addEventListener("click", () => (v.paused ? play() : v.pause()));
  P.pp.addEventListener("click", () => (v.paused ? play() : v.pause()));
  P.mute.addEventListener("click", () => (v.muted = !v.muted));
  P.fs.addEventListener("click", toggleFullscreen);
  P.caseBtn.addEventListener("click", () => currentFilm?.project && openProject(currentFilm.project));
  P.chapters.addEventListener("click", (e) => {
    const b = e.target.closest("[data-t]");
    if (b) seekTo(Number(b.dataset.t), true);
  });

  v.addEventListener("play", () => {
    P.root.classList.add("is-playing");
    P.pp.setAttribute("aria-label", "Pause");
    P.cover.classList.add("is-hidden");
  });
  v.addEventListener("pause", () => {
    P.root.classList.remove("is-playing");
    P.pp.setAttribute("aria-label", "Play");
  });
  v.addEventListener("ended", () => P.cover.classList.remove("is-hidden"));
  v.addEventListener("volumechange", () => {
    P.root.classList.toggle("is-muted", v.muted);
    P.mute.setAttribute("aria-label", v.muted ? "Unmute" : "Mute");
  });
  v.addEventListener("loadedmetadata", () => {
    P.total.textContent = fmt(v.duration);
    renderTicks();
    updateProgress();
  });
  v.addEventListener("timeupdate", updateProgress);
  v.addEventListener("progress", updateBuffer);

  initScrubber();
  selectFilm(FILMS[0].id);
}

function filmDuration() {
  const d = P.video.duration;
  return Number.isFinite(d) && d > 0 ? d : parseDuration(currentFilm?.duration);
}

function selectFilm(id) {
  const f = filmById.get(id);
  if (!f || !P.video) return;
  $$(".tab", P.tabs).forEach((t) => {
    const on = t.dataset.film === id;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  });
  if (currentFilm === f) return;
  currentFilm = f;

  const v = P.video;
  v.pause();
  v.removeAttribute("src");
  v.load();
  v.dataset.src = f.src;
  v.poster = f.poster || "";
  P.root.classList.remove("is-playing");

  P.cover.style.backgroundImage = f.poster ? `url("${f.poster}")` : "none";
  P.cover.classList.remove("is-hidden");
  P.cover.setAttribute("aria-label", `Play ${f.title}${f.duration ? `, ${f.duration}` : ""}`);
  $("#cover-native").textContent = f.native || "";
  $("#cover-title").textContent = f.title;
  $("#cover-hint").textContent = f.duration ? `Play film, ${f.duration}` : "Play film";
  $("#film-blurb").textContent = f.blurb || "";
  P.caseBtn.hidden = !byId.has(f.project);

  const chapters = f.chapters || [];
  $(".films__chapters-title").hidden = chapters.length === 0;
  P.chapters.innerHTML = chapters
    .map(
      (c, i) =>
        `<li><button class="chapter" type="button" data-t="${Number(c.t) || 0}"><span class="chapter__n">${i + 1}</span><span>${esc(
          c.title
        )}</span><span class="chapter__t">${fmt(c.t)}</span></button></li>`
    )
    .join("");

  P.total.textContent = f.duration || "0:00";
  P.now.textContent = "0:00";
  P.fill.style.width = "0%";
  P.buffer.style.width = "0%";
  P.thumb.style.left = "0%";
  renderTicks();
  updateActiveChapter(0);
}

function ensureSource() {
  const v = P.video;
  if (!v.getAttribute("src") && v.dataset.src) v.src = v.dataset.src;
}
function play() {
  ensureSource();
  P.cover.classList.add("is-hidden");
  P.video.play().catch((err) => {
    console.warn("Film could not play:", err);
    P.cover.classList.remove("is-hidden");
  });
}
function seekTo(t, andPlay = false) {
  ensureSource();
  const v = P.video;
  const go = () => {
    v.currentTime = clamp(t, 0, filmDuration() || t);
    updateProgress();
  };
  if (v.readyState >= 1) go();
  else v.addEventListener("loadedmetadata", go, { once: true });
  if (andPlay) play();
  else if (v.readyState < 1) v.load();
}

function renderTicks() {
  const d = filmDuration();
  const chapters = currentFilm?.chapters || [];
  P.ticks.innerHTML = d
    ? chapters
        .filter((c) => c.t > 0 && c.t < d)
        .map((c) => `<span class="scrub__tick" style="left:${(c.t / d) * 100}%" title="${esc(c.title)}"></span>`)
        .join("")
    : "";
  P.scrub.setAttribute("aria-valuemax", String(Math.round(d)));
}

function updateProgress() {
  const v = P.video;
  const d = filmDuration();
  const t = v.currentTime || 0;
  const pct = d ? (t / d) * 100 : 0;
  P.fill.style.width = `${pct}%`;
  P.thumb.style.left = `${pct}%`;
  P.now.textContent = fmt(t);
  P.scrub.setAttribute("aria-valuenow", String(Math.round(t)));
  P.scrub.setAttribute("aria-valuetext", `${fmt(t)} of ${fmt(d)}`);
  updateActiveChapter(t);
}

function updateBuffer() {
  const v = P.video;
  const d = filmDuration();
  if (!d || !v.buffered.length) return;
  P.buffer.style.width = `${(v.buffered.end(v.buffered.length - 1) / d) * 100}%`;
}

function updateActiveChapter(t) {
  const chapters = currentFilm?.chapters || [];
  let idx = -1;
  chapters.forEach((c, i) => {
    if (t + 0.25 >= c.t) idx = i;
  });
  $$(".chapter", P.chapters).forEach((b, i) => {
    const on = i === idx;
    b.classList.toggle("is-active", on);
    if (on) b.setAttribute("aria-current", "true");
    else b.removeAttribute("aria-current");
  });
}

function initScrubber() {
  const s = P.scrub;
  let dragging = false;
  const ratioAt = (e) => {
    const r = s.getBoundingClientRect();
    return clamp((e.clientX - r.left) / r.width, 0, 1);
  };
  s.addEventListener("pointerdown", (e) => {
    dragging = true;
    s.setPointerCapture(e.pointerId);
    s.classList.add("is-dragging");
    seekTo(ratioAt(e) * filmDuration(), P.video.paused && !P.cover.classList.contains("is-hidden"));
  });
  s.addEventListener("pointermove", (e) => {
    if (dragging) seekTo(ratioAt(e) * filmDuration());
  });
  const stop = () => {
    dragging = false;
    s.classList.remove("is-dragging");
  };
  s.addEventListener("pointerup", stop);
  s.addEventListener("pointercancel", stop);
  s.addEventListener("keydown", (e) => {
    const t = P.video.currentTime || 0;
    const map = { ArrowRight: t + 5, ArrowLeft: t - 5, PageUp: t + 30, PageDown: t - 30, Home: 0, End: filmDuration() };
    if (e.key in map) {
      e.preventDefault();
      seekTo(map[e.key]);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      P.video.paused ? play() : P.video.pause();
    }
  });
}

function toggleFullscreen() {
  const v = P.video;
  if (document.fullscreenElement) {
    document.exitFullscreen?.();
  } else if (P.stage.requestFullscreen) {
    P.stage.requestFullscreen().catch(() => {});
  } else if (v.webkitEnterFullscreen) {
    ensureSource();
    v.webkitEnterFullscreen();
  }
}

/* ---------------------------------------------------------------
   Work: cards, filters, hover previews, case-study modal
   --------------------------------------------------------------- */
function coverHTML(p) {
  const glyph = (p.title || "?").trim().charAt(0);
  return `<div class="cover" style="--accent:${esc(p.accent || "#6b4428")}"><span class="cover__glyph">${esc(glyph)}</span></div>`;
}

function cardHTML(p) {
  const meta = [p.engine, p.platform, p.year].filter(Boolean).join(", ");
  const film = p.film && filmById.get(p.film);
  const badge = film
    ? `<span class="card__badge card__badge--film">Film, ${esc(film.duration || "")}</span>`
    : p.status
    ? `<span class="card__badge">${esc(p.status)}</span>`
    : "";
  const media = p.card ? `<img src="${esc(p.card)}" alt="" loading="lazy" decoding="async">` : coverHTML(p);
  const preview = p.preview ? `<video muted loop playsinline preload="none" data-src="${esc(p.preview)}" aria-hidden="true"></video>` : "";
  return `<a class="card${p.wide ? " card--wide" : ""}" href="#project/${esc(p.id)}" data-project="${esc(p.id)}" data-cat="${esc(p.category || "")}">
    <div class="card__media"><div class="card__layer">${media}${preview}</div>${badge}</div>
    <div class="card__body">
      <h3 class="card__title">${esc(p.title)}${p.native ? `<span class="card__native" lang="ar">${esc(p.native)}</span>` : ""}</h3>
      ${p.tagline ? `<p class="card__tagline">${esc(p.tagline)}</p>` : ""}
      ${p.studio ? `<p class="card__studio">${esc(p.studio)}</p>` : ""}
      ${meta ? `<p class="card__meta">${esc(meta)}</p>` : ""}
    </div>
  </a>`;
}

/**
 * On wide screens the grid has 6 columns: wide cards take 3, normal cards 2.
 * If the last row would be left half empty, widen the last normal cards so
 * every row is full, however many projects are added later.
 */
function balanceGrid(grid) {
  const cards = $$(".card", grid).filter((c) => !c.hidden);
  cards.forEach((c) => c.classList.remove("card--fill"));
  const normals = cards.filter((c) => !c.classList.contains("card--wide"));
  const units = cards.reduce((sum, c) => sum + (c.classList.contains("card--wide") ? 3 : 2), 0);
  const rem = units % 6;
  // rem 4: two normals share a row -> make both wide (3 + 3)
  // rem 2: one normal alone -> make the last four normals wide (two full rows)
  const widen = rem === 4 ? 2 : rem === 2 && normals.length >= 4 ? 4 : 0;
  normals.slice(normals.length - widen).forEach((c) => c.classList.add("card--fill"));
}

function initWork() {
  const featured = PROJECTS.filter((p) => p.featured !== false);
  const earlier = PROJECTS.filter((p) => p.featured === false);
  const grid = $("#work-grid");
  grid.innerHTML = featured.map(cardHTML).join("");
  balanceGrid(grid);

  // filters, built from whatever categories exist
  const cats = [...new Set(featured.map((p) => p.category).filter(Boolean))];
  const filters = $("#work-filters");
  if (cats.length > 1) {
    filters.innerHTML = ["All", ...cats]
      .map((c, i) => `<button class="chip" type="button" aria-pressed="${i === 0}" data-cat="${esc(c)}">${esc(c)}</button>`)
      .join("");
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      $$(".chip", filters).forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
      const cat = b.dataset.cat;
      $$(".card", grid).forEach((card) => (card.hidden = cat !== "All" && card.dataset.cat !== cat));
      balanceGrid(grid);
    });
  } else filters.hidden = true;

  // earlier work
  const list = $("#earlier-list");
  if (earlier.length) {
    list.innerHTML = earlier
      .map(
        (p) =>
          `<li><button class="earlier__row" type="button" data-project="${esc(p.id)}"><span class="earlier__name">${esc(p.title)}</span><span class="earlier__desc">${esc(
            p.tagline || p.summary || ""
          )}</span><span class="earlier__year">${esc(p.year || "")}</span></button></li>`
      )
      .join("");
  } else $("#earlier").hidden = true;

  // open the case study
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-project]");
    if (!el || el.closest(".modal")) return;
    if (el.classList.contains("card") || el.classList.contains("earlier__row") || el.classList.contains("link-btn")) {
      e.preventDefault();
      openProject(el.dataset.project);
    }
  });

  // 3D tilt + hover preview, mouse only
  if (!FINE_POINTER) return;
  $$(".card", grid).forEach((card) => {
    const media = $(".card__media", card);
    const layer = $(".card__layer", card);
    const vid = $("video", card);
    if (!REDUCED) {
      card.addEventListener("pointermove", (e) => {
        const r = media.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        media.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
        layer.style.transform = `translate3d(${(-x * 10).toFixed(1)}px, ${(-y * 8).toFixed(1)}px, 0) scale(1.03)`;
      });
    }
    card.addEventListener("pointerenter", () => {
      if (!vid || REDUCED) return;
      if (!vid.getAttribute("src")) vid.src = vid.dataset.src;
      vid.play().then(() => card.classList.add("is-previewing")).catch(() => {});
    });
    card.addEventListener("pointerleave", () => {
      media.style.transform = "";
      layer.style.transform = "";
      if (vid) {
        vid.pause();
        card.classList.remove("is-previewing");
      }
    });
  });
}

function openProject(id) {
  const p = byId.get(id);
  const modal = $("#project-modal");
  if (!p || !modal) return;
  const film = p.film && filmById.get(p.film);

  const media =
    p.preview && !REDUCED
      ? `<video src="${esc(p.preview)}" ${p.card ? `poster="${esc(p.card)}"` : ""} muted loop playsinline autoplay aria-hidden="true"></video>`
      : p.card
      ? `<img src="${esc(p.card)}" alt="">`
      : coverHTML(p);

  const facts = [
    ["Studio", p.studio],
    ["Engine", p.engine],
    ["Platform", p.platform],
    ["Year", p.year],
    ["Status", p.status],
    ["Category", p.category],
  ].filter(([, v]) => v);

  const actions = [
    film ? `<button class="btn btn--primary" type="button" data-watch="${esc(film.id)}">Watch the film</button>` : "",
    ...(p.links || []).map((l) => `<a class="btn btn--ghost" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`),
  ].join("");

  $("#modal-inner").innerHTML = `
    <button class="icon-btn modal__close" type="button" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <div class="modal__media">${media}</div>
    ${
      p.gallery?.length
        ? `<div class="modal__gallery" role="group" aria-label="Screenshots">${p.gallery
            .map(
              (src, i) =>
                `<button class="modal__thumb" type="button" aria-pressed="false" aria-label="Screenshot ${i + 1} of ${p.gallery.length}" data-gallery="${esc(src)}"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"></button>`
            )
            .join("")}</div>`
        : ""
    }
    <div class="modal__body">
      <div>
        <h2 class="modal__title" id="modal-title">${esc(p.title)}${p.native ? `<span class="modal__native" lang="ar">${esc(p.native)}</span>` : ""}</h2>
        ${p.tagline ? `<p class="modal__tagline">${esc(p.tagline)}</p>` : ""}
        ${p.summary ? `<p class="modal__summary">${esc(p.summary)}</p>` : ""}
        ${p.highlights?.length ? `<h3 class="modal__h">What I built</h3><ul class="modal__list">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
        ${p.tech?.length ? `<h3 class="modal__h">Tech</h3><div class="tags">${p.tech.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
      </div>
      <div>
        ${facts.length ? `<dl class="modal__facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
        ${actions ? `<div class="modal__actions">${actions}</div>` : ""}
      </div>
    </div>`;

  if (!modal.open) {
    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
  }
  modal.scrollTop = 0;
  history.replaceState(null, "", `#project/${encodeURIComponent(p.id)}`);
}

function initModal() {
  const modal = $("#project-modal");
  const close = () => (typeof modal.close === "function" ? modal.close() : modal.removeAttribute("open"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest(".modal__close")) close();
    const thumb = e.target.closest("[data-gallery]");
    if (thumb) {
      const media = $(".modal__media", modal);
      media.innerHTML = `<img class="is-contain" src="${esc(thumb.dataset.gallery)}" alt="${esc(thumb.getAttribute("aria-label"))}">`;
      $$("[data-gallery]", modal).forEach((t) => t.setAttribute("aria-pressed", String(t === thumb)));
    }
    const watch = e.target.closest("[data-watch]");
    if (watch) {
      close();
      selectFilm(watch.dataset.watch);
      scrollToId("films");
    }
  });
  modal.addEventListener("close", () => {
    $("#modal-inner").innerHTML = "";
    if (location.hash.startsWith("#project/")) history.replaceState(null, "", location.pathname + location.search);
  });
}

/* ---------------------------------------------------------------
   Systems: legend + astrolabe
   --------------------------------------------------------------- */
function initSystems() {
  const section = $("#systems");
  const list = $("#systems-list");
  const panel = $("#systems-panel");
  const canvas = $("#astrolabe");
  if (!SYSTEMS.length) {
    section.hidden = true;
    return;
  }
  list.innerHTML = SYSTEMS.map(
    (s, i) =>
      `<li><button class="sys-item" type="button" aria-pressed="false" data-i="${i}"><span class="sys-item__dot" aria-hidden="true"></span>${esc(s.name)}</button></li>`
  ).join("");

  let astro = null;
  let active = -1;
  function setActive(i) {
    if (i === active || !SYSTEMS[i]) return;
    active = i;
    $$(".sys-item", list).forEach((b, j) => {
      b.classList.toggle("is-active", j === i);
      b.setAttribute("aria-pressed", String(j === i));
    });
    const s = SYSTEMS[i];
    const proof = (s.proof || []).map((id) => byId.get(id)).filter(Boolean);
    panel.innerHTML = `<h3>${esc(s.name)}</h3><p>${esc(s.summary)}</p>
      <div class="tags">${(s.items || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      ${
        proof.length
          ? `<p class="systems__proof"><span>Seen in</span>${proof
              .map((p) => `<button class="link-btn" type="button" data-project="${esc(p.id)}">${esc(p.title)}</button>`)
              .join("")}</p>`
          : ""
      }`;
    astro?.setActive(i);
  }
  list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (b) setActive(Number(b.dataset.i));
  });
  list.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const b = e.target.closest("[data-i]");
    if (b) setActive(Number(b.dataset.i));
  });
  list.addEventListener("focusin", (e) => {
    const b = e.target.closest("[data-i]");
    if (b) setActive(Number(b.dataset.i));
  });
  setActive(0);

  const fail = () => section.classList.add("no-webgl");
  if (!WEBGL) return fail();
  lazyMount(
    canvas,
    () =>
      import("./three/astrolabe.js").then(({ mountAstrolabe }) => {
        astro = mountAstrolabe(canvas, {
          rings: SYSTEMS.length,
          still: REDUCED,
          onHover: setActive,
          onSelect: setActive,
        });
        astro.setActive(active);
      }),
    fail
  );
}

/* ---------------------------------------------------------------
   About + procedural city
   --------------------------------------------------------------- */
function initAbout() {
  $("#about-body").innerHTML = (SITE.about || []).map((p) => `<p>${esc(p)}</p>`).join("");
  const facts = [
    ["Based in", SITE.location],
    ["Engines", (SITE.engines || []).join(", ")],
    ["Recognition", SITE.recognition],
    ["Education", SITE.education],
  ].filter(([, v]) => v);
  $("#about-facts").innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");

  const section = $("#about");
  const canvas = $("#city");
  const tip = $("#city-tip");
  const fail = () => section.classList.add("no-webgl");
  if (!WEBGL) return fail();
  // one landmark per world, each opening its project
  const lm = (id, sub) => {
    const p = byId.get(id);
    return p ? { id, label: p.title, sub } : undefined;
  };
  const landmarks = {
    settlement: lm("wahm", "The mud-brick settlement"),
    tower: lm("kingdomland", "Riyadh, rebuilt in 3D"),
    oasis: lm("tamr-farm", "Date palms around an oasis"),
    caravan: lm("caravan-of-the-sands", "The caravan route"),
  };
  lazyMount(
    canvas,
    () =>
      import("./three/diorama.js").then(({ mountDiorama }) => {
        mountDiorama(canvas, {
          still: REDUCED,
          landmarks,
          onSelect: (id) => openProject(id),
          onHover(info) {
            if (!info) {
              tip.hidden = true;
              return;
            }
            tip.hidden = false;
            tip.innerHTML = `<strong>${esc(info.label)}</strong>${esc(info.sub)}<span class="city__tip-hint">Click to open</span>`;
            tip.style.left = `${info.x}px`;
            tip.style.top = `${info.y}px`;
          },
        });
      }),
    fail
  );
}

/* ---------------------------------------------------------------
   Journey timeline
   --------------------------------------------------------------- */
function initJourney() {
  const tl = $("#timeline");
  const fill = $("#timeline-fill");
  tl.insertAdjacentHTML(
    "beforeend",
    EXPERIENCE.map((e) => {
      const when = e.end && e.end !== e.start ? `${esc(e.start)}–${esc(e.end)}` : esc(e.start);
      const org = e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.org)}</a>` : esc(e.org);
      return `<li class="stop">
        <div class="stop__when">${when}</div>
        <div class="stop__body">
          <h3 class="stop__role">${esc(e.role)}</h3>
          <p class="stop__org">${org}</p>
          ${e.note ? `<p class="stop__note">${esc(e.note)}</p>` : ""}
          ${e.points?.length ? `<ul class="stop__points">${e.points.map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul>` : ""}
        </div>
      </li>`;
    }).join("")
  );

  const stops = $$(".stop", tl);
  let ticking = false;
  function update() {
    ticking = false;
    const line = innerHeight * 0.62;
    const r = tl.getBoundingClientRect();
    fill.style.height = `${clamp((line - r.top) / r.height, 0, 1) * 100}%`;
    stops.forEach((s) => s.classList.toggle("is-passed", s.getBoundingClientRect().top + 14 < line));
  }
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  addEventListener("resize", update);
  update();
}

/* ---------------------------------------------------------------
   Contact
   --------------------------------------------------------------- */
function initContact() {
  const actions = [
    SITE.email ? `<a class="btn btn--primary" href="mailto:${esc(SITE.email)}">Email me</a>` : "",
    SITE.linkedin ? `<a class="btn btn--ghost" href="${esc(SITE.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : "",
    SITE.cv ? `<a class="btn btn--ghost" href="${esc(SITE.cv)}" download>Download CV</a>` : "",
  ].join("");
  const box = $("#contact-actions");
  box.innerHTML = actions;
  if (SITE.email)
    box.insertAdjacentHTML("afterend", `<p class="contact__email"><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p>`);
}

/* ---------------------------------------------------------------
   Boot
   --------------------------------------------------------------- */
function safely(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`[${name}]`, err);
  }
}

safely("bindings", initBindings);
safely("loader", () => runLoader().catch((err) => console.error("[loader]", err)));
safely("nav", initNav);
safely("films", initFilms);
safely("hero", initHero);
safely("work", initWork);
safely("modal", initModal);
safely("systems", initSystems);
safely("about", initAbout);
safely("journey", initJourney);
safely("contact", initContact);

// deep link: /#project/kingdomland opens that case study
const deep = decodeURIComponent(location.hash).match(/^#project\/(.+)$/);
if (deep && byId.has(deep[1])) openProject(deep[1]);
