/* Router, page templates and the lab engine. */
(function () {
  const main = document.getElementById("main"), LABS = window.LABS, M = window.COURSE.modules, labById = Object.fromEntries(LABS.map(l => [l.id, l]));
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const math = el => window.renderMathInElement && renderMathInElement(el, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }], throwOnError: false });
  const tilesHtml = t => t.length ? `<div class="tiles">${t.map(x => `<div class="tile"><div class="k">${x.k}</div><div class="v">${x.v}</div>${x.s ? `<div class="s">${x.s}</div>` : ""}</div>`).join("")}</div>` : "";
  let redraw = null, stopHero = null;

  /* ---------- Overview ---------- */
  function overview() {
    main.innerHTML = `<div class="wrap">
      <section class="hero">
        <div>
          <h1>Sixteen lectures of statistics, rebuilt as things you can run</h1>
          <p class="lede">My record of Applied Statistics &amp; Data Science I at Johns Hopkins: every topic from counting to the lasso, turned into an interactive lab or a short report on real data.</p>
          <p class="who">Sahil, MSE in Data Science. Course 413/613, Fall 2026, taught by Prof. Suryanarayana Maddu.</p>
          <div class="cta"><a class="btn" href="#labs">Open the labs</a><a class="btn ghost" href="#reports">Read the reports</a></div>
        </div>
        <figure class="stage"><canvas id="hero" aria-label="Animation: sample means piling up into a bell curve"></canvas>
          <figcaption>Each dot is the average of 30 draws from the two-humped population on the left. The pile it lands in is the central limit theorem. <a href="#labs/clt">Try other populations</a></figcaption></figure>
      </section>
      <div class="counts"><div><b>16</b><span>lectures covered</span></div><div><b>${LABS.length}</b><span>interactive labs</span></div><div><b>6</b><span>real datasets analysed</span></div><div><b>13</b><span>course notebooks re-implemented in JavaScript</span></div></div>

      <section class="block"><div class="head"><div><h2>The path through the course</h2><p>Six modules, each building on the last. Select one to see its lectures.</p></div><a class="btn ghost small" href="#course">Full course map</a></div>
        <div class="path">${M.map(m => `<a href="#course/${m.id}"><span class="lec">${m.lectures}</span><h4>${m.title}</h4><p>${m.blurb}</p></a>`).join("")}</div></section>

      <section class="block two">
        <div class="panel"><h3>Where to start</h3>
          <ul class="feature-list">
            <li><a href="#labs/clt">Sampling distributions and the central limit theorem</a><span>Pick a population that looks nothing like a bell and watch one appear.</span></li>
            <li><a href="#labs/penguins">Simple regression on Palmer penguins</a><span>A slope that is negative overall and positive inside every species.</span></li>
            <li><a href="#labs/diabetes">Multiple regression and ridge</a><span>Two collinear predictors, their runaway standard errors, and the penalty that fixes them.</span></li>
            <li><a href="#reports/r-michelson">Michelson's speed of light</a><span>A confidence interval that is narrow, well computed, and misses the truth.</span></li>
          </ul></div>
        <div class="panel"><h3>Course timeline</h3>
          <ul class="timeline">
            <li><time>Start of term</time><span>Probability, random variables and the binomial family (Lectures 1 to 3)</span></li>
            <li><time>Oct 5</time><span>Assignment 1 due: 25 true-or-false statements, each needing a derivation or a counterexample</span></li>
            <li><time>Oct 7</time><span>Exam 1: 40 minutes, open book, printed notes only</span></li>
            <li><time>Oct 26 to 28</time><span>Model selection, ridge and lasso (Lectures 15 and 16)</span></li>
            <li><time>Nov 16</time><span>Midterm 2, covering Lectures 8 to 16</span></li>
          </ul></div>
      </section></div>`;
    stopHero = hero(document.getElementById("hero"));
  }

  function hero(cv) {
    const ctx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1; let W, H; const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }; size();
    const r = S.rng(30), draw1 = () => r.u() < 0.5 ? r.normal(-2, 1) : r.normal(3, 0.5), mu = 0.5, sd = Math.sqrt(0.5 * (1 + 4) + 0.5 * (0.25 + 9) - 0.25), se = sd / Math.sqrt(30);
    const BINS = 31, lo = mu - 3.6 * se, hi = mu + 3.6 * se, counts = new Array(BINS).fill(0), falling = [], TOTAL = 700, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; let made = 0, raf, dead = false;
    const popPts = Array.from({ length: 2400 }, draw1), split = 0.3;
    function frame() {
      if (dead) return; ctx.clearRect(0, 0, W, H); const px = W * split, gx = px + 26, gw = W - gx - 8, base = H - 26, dot = Math.max(2.2, Math.min(4, gw / BINS / 2.4)), step = dot * 2 + 0.6, cap = Math.floor((base - 34) / step);
      // population (sideways histogram)
      ctx.fillStyle = "#eb6834"; const pb = 34, pc = new Array(pb).fill(0); popPts.forEach(v => { const k = Math.floor((v + 5.5) / 10.5 * pb); if (k >= 0 && k < pb) pc[k]++; }); const pm = Math.max(...pc);
      pc.forEach((c, k) => { const y = 30 + (pb - 1 - k) * ((base - 30) / pb); ctx.fillRect(0, y, (px - 22) * c / pm, (base - 30) / pb - 1.5); });
      ctx.fillStyle = "#5b6672"; ctx.font = "600 12px 'Public Sans', sans-serif"; ctx.fillText("Population", 0, 16); ctx.fillText("Means of 30 draws", gx, 16);
      ctx.strokeStyle = "#8b96a3"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, base + 0.5); ctx.lineTo(W - 8, base + 0.5); ctx.stroke();
      const scale = Math.max(1, Math.max(...counts) / cap);
      // stacked dots
      ctx.fillStyle = "#2a78d6"; counts.forEach((c, k) => { const n = Math.round(c / scale), x = gx + (k + 0.5) * gw / BINS; for (let j = 0; j < n; j++) { ctx.beginPath(); ctx.arc(x, base - dot - j * step, dot, 0, 6.3); ctx.fill(); } });
      // normal curve, scaled to expected counts
      if (made > 60) { ctx.strokeStyle = "#101820"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 120; i++) { const v = lo + (hi - lo) * i / 120, e = made * S.normPdf(v, mu, se) * (hi - lo) / BINS / scale, x = gx + (v - lo) / (hi - lo) * gw, y = base - e * step; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
      // falling dots
      ctx.fillStyle = "#2a78d6"; for (let i = falling.length - 1; i >= 0; i--) { const d = falling[i]; d.y += d.v; d.v += 0.5; const ty = base - dot - Math.round(counts[d.k] / scale) * step; if (d.y >= ty) { counts[d.k]++; falling.splice(i, 1); continue; } ctx.beginPath(); ctx.arc(gx + (d.k + 0.5) * gw / BINS, d.y, dot, 0, 6.3); ctx.fill(); }
      const perFrame = made < 40 ? 0.35 : 3; let add = perFrame < 1 ? (Math.random() < perFrame ? 1 : 0) : perFrame;
      while (add-- > 0 && made < TOTAL) { let t = 0; for (let j = 0; j < 30; j++) t += draw1(); const k = Math.floor((t / 30 - lo) / (hi - lo) * BINS); made++; if (k < 0 || k >= BINS) continue; falling.push({ k, y: 24, v: 2 + Math.random() * 2 }); }
      if (made < TOTAL || falling.length) raf = requestAnimationFrame(frame);
    }
    if (reduce) { while (made < TOTAL) { let t = 0; for (let j = 0; j < 30; j++) t += draw1(); const k = Math.floor((t / 30 - lo) / (hi - lo) * BINS); made++; if (k >= 0 && k < BINS) counts[k]++; } }
    frame(); const onR = () => { size(); if (made >= TOTAL && !falling.length) frame(); }; window.addEventListener("resize", onR);
    return () => { dead = true; cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
  }

  /* ---------- Course map ---------- */
  function course(target) {
    main.innerHTML = `<div class="wrap"><div class="page-head"><h1>Course map</h1><p>What each lecture covered, the one formula I would keep from it, and the lab where it can be tried. Summaries are in my own words; the lecture notes themselves belong to the course and are not reproduced here.</p></div>
      <section class="block" style="padding-top:28px">${M.map(m => `<div class="module" id="${m.id}"><header><h2>${m.title}</h2><span>${m.lectures}</span></header>
        ${m.items.map(l => `<article class="lecture"><div class="num" aria-label="Lecture ${l.n}">${l.n}</div><div><h4>${l.title}</h4><p>${l.summary}</p><div class="links">${l.labs.map(id => `<a class="chip" href="#labs/${id}">${labById[id].title}</a>`).join("")}</div></div><div class="side formula">$$${l.tex}$$</div></article>`).join("")}</div>`).join("")}</section></div>`;
    math(main); if (target) { const e = document.getElementById(target); if (e) e.scrollIntoView(); }
  }

  /* ---------- Labs ---------- */
  function labs(id) {
    const lab = labById[id] || LABS[0], groups = [...new Set(LABS.map(l => l.group))];
    main.innerHTML = `<div class="wrap labs"><aside class="labnav" aria-label="Labs">
        <select class="labpick" aria-label="Choose a lab">${LABS.map(l => `<option value="${l.id}" ${l === lab ? "selected" : ""}>${l.group}: ${l.title}</option>`).join("")}</select>
        <div class="list">${groups.map(g => `<h4>${g}</h4>${LABS.filter(l => l.group === g).map(l => `<a href="#labs/${l.id}" ${l === lab ? 'aria-current="true"' : ""}>${l.title}</a>`).join("")}`).join("")}</div></aside>
      <article class="lab"><header><span class="chip">${lab.from}</span><h2 style="margin-top:10px">${lab.title}</h2><p>${lab.intro}</p></header>
        <div class="controls"></div><div class="out"></div></article></div>`;
    main.querySelector(".labpick").addEventListener("change", e => location.hash = "#labs/" + e.target.value);
    const s = lab._state || (lab._state = JSON.parse(JSON.stringify(lab.state))), cbox = main.querySelector(".controls"), out = main.querySelector(".out");
    function render() {
      if (!document.body.contains(out)) return; const v = lab.view(s, render);
      out.innerHTML = (v.status ? `<div class="status" role="status">${v.status}</div>` : "") + tilesHtml(v.tiles) + `<div class="charts ${v.charts.length === 1 ? "one" : ""}">${v.charts.map((c, i) => `<div class="chartcard ${c.wide ? "wide" : ""}"><h4>${c.title}</h4><p class="sub">${c.sub || ""}</p><div class="plot" data-i="${i}"></div></div>`).join("")}</div>` + (v.notice ? `<div class="notice"><h4>What to notice</h4><p>${v.notice}</p></div>` : "");
      out.querySelectorAll(".plot").forEach(p => Chart.draw(p, { ...v.charts[+p.dataset.i].spec, title: v.charts[+p.dataset.i].title }));
    }
    function controls() {
      cbox.innerHTML = ""; lab.controls.forEach((c, i) => { const d = document.createElement("div"); d.className = "ctl" + (c.type === "checks" ? " checks" : ""); const cid = `c-${lab.id}-${i}`;
        if (c.type === "range") { const fm = c.fmt || (v => v); d.innerHTML = `<label for="${cid}">${c.label}<output>${fm(s[c.key])}</output></label><input id="${cid}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${s[c.key]}">`;
          d.querySelector("input").addEventListener("input", e => { s[c.key] = +e.target.value; d.querySelector("output").textContent = fm(s[c.key]); render(); }); }
        else if (c.type === "select") { d.innerHTML = `<label for="${cid}">${c.label}</label><select id="${cid}">${c.options.map(o => `<option value="${o[0]}" ${String(s[c.key]) === o[0] ? "selected" : ""}>${o[1]}</option>`).join("")}</select>`; d.querySelector("select").addEventListener("change", e => { s[c.key] = e.target.value; render(); }); }
        else if (c.type === "button") { d.innerHTML = `<button class="btn ghost small" type="button">${c.label}</button>`; d.querySelector("button").addEventListener("click", () => { c.act(s); controls(); render(); }); }
        else if (c.type === "checks") { d.innerHTML = `<label>${c.label}</label><div>${c.options.map(o => `<label><input type="checkbox" value="${o[0]}" ${s[c.key].includes(o[0]) ? "checked" : ""}> ${o[1]}</label>`).join("")}</div>`; d.addEventListener("change", () => { s[c.key] = [...d.querySelectorAll("input:checked")].map(x => x.value); render(); }); }
        cbox.appendChild(d); });
    }
    controls(); render(); redraw = render;
  }

  /* ---------- Reports ---------- */
  function reports(target) {
    const R = window.REPORTS();
    main.innerHTML = `<div class="wrap"><div class="page-head"><h1>Data reports</h1><p>Six short write-ups, one per dataset used in the course. Each asks one question, shows the numbers, and says what they do and do not support. Every figure is recomputed from the raw data when this page loads.</p></div>
      <section class="block" style="padding-top:28px"><div class="toc">${R.map(r => `<a class="chip" href="#reports/${r.id}">${r.title}</a>`).join("")}</div>
      ${R.map((r, i) => `<article class="report" id="${r.id}"><header><h2>${r.title}</h2><span class="chip">${r.source}</span></header><p class="q">${r.q}</p>${tilesHtml(r.tiles)}
        <div class="body"><div>${r.html}<p><a class="btn ghost small" href="#labs/${r.lab}">Open the related lab</a></p></div><div class="chartcard"><h4>${r.chart.title}</h4><p class="sub">${r.chart.sub}</p><div class="plot" data-i="${i}"></div></div></div></article>`).join("")}</section></div>`;
    const draw = () => main.querySelectorAll(".report .plot").forEach(p => Chart.draw(p, { ...R[+p.dataset.i].chart.spec, title: R[+p.dataset.i].chart.title }));
    draw(); redraw = draw; if (target) { const e = document.getElementById(target); if (e) e.scrollIntoView(); }
  }

  /* ---------- About ---------- */
  function about() {
    main.innerHTML = `<div class="wrap"><div class="page-head"><h1>About this site</h1><p>What it is, where the data come from, and what is deliberately left out.</p></div>
      <section class="block credits" style="padding-top:28px">
        <div class="panel"><h3>What this is</h3>
          <p style="margin-top:10px">A portfolio of my work through 413/613 Applied Statistics &amp; Data Science I at Johns Hopkins University in Fall 2026. The course is taught by Prof. Suryanarayana Maddu in the Department of Applied Mathematics and Statistics and the Data Science and AI Institute.</p>
          <p>The course's computational notebooks are in Python. For this site I re-implemented their analyses in plain JavaScript so they run in a browser with no server: the distributions, the bootstrap, least squares and ridge by the normal equations, K-fold cross-validation and the Student t quantiles are all written from scratch in one small statistics file.</p>
          <p>The results were checked against the notebook outputs. For example the penguin regression gives an intercept of −5780.83 g and a slope of 49.69 g/mm, and the ten-predictor diabetes model reproduces every coefficient and standard error to the printed precision.</p>
          <h3 style="margin-top:22px">What is left out</h3>
          <p style="margin-top:10px">The lecture notes, the assignment and its solutions, and the exams belong to the course and are not posted here. The course map summarises each lecture in my own words. The ideas, the choice of examples and the datasets come from Prof. Maddu's course; mistakes in the re-implementation are mine.</p></div>
        <div class="panel"><h3>Data sources</h3>
          <ul>
            <li><b>NHANES 2017–2018.</b> US Centers for Disease Control and Prevention, National Center for Health Statistics; public-use files DEMO_J and BMX_J, adults with complete records. Used unweighted, so results describe the sample, not the US population.</li>
            <li><b>Prussian horse-kick deaths.</b> Bortkiewicz's cavalry data, 280 corps-years.</li>
            <li><b>Speed of light.</b> A. A. Michelson's 1879 measurements, 100 runs.</li>
            <li><b>Palmer penguins.</b> Gorman, Williams and Fraser (2014), Palmer Station, Antarctica.</li>
            <li><b>Diabetes progression.</b> Efron, Hastie, Johnstone and Tibshirani (2004), as distributed with scikit-learn; predictors are standardised.</li>
            <li><b>Iris.</b> Fisher (1936), measurements by Edgar Anderson.</li>
            <li><b>Earthquakes.</b> US Geological Survey earthquake catalogue, downloaded live by that lab.</li>
          </ul>
          <h3 style="margin-top:22px">Built with</h3>
          <p style="margin-top:10px">Hand-written HTML, CSS and JavaScript; charts drawn as SVG without a charting library; KaTeX for the formulas. Simulations use a seeded random number generator, so a result changes only when you ask for a new sample.</p></div>
      </section></div>`;
  }

  /* ---------- Router ---------- */
  function route() {
    if (stopHero) { stopHero(); stopHero = null; } redraw = null;
    const [view, arg] = (location.hash.replace(/^#\/?/, "") || "overview").split("/"), v = { overview, course, labs, reports, about }[view] ? view : "overview";
    document.querySelectorAll("[data-nav]").forEach(a => a.dataset.nav === v ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
    window.scrollTo(0, 0); ({ overview, course, labs, reports, about })[v](arg);
    document.title = ({ overview: "Applied Statistics & Data Science I: course portfolio by Sahil", course: "Course map", labs: (labById[arg] || LABS[0]).title, reports: "Data reports", about: "About" })[v] + (v === "overview" ? "" : " | ASDA portfolio");
  }
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => redraw && redraw(), 150); });
  window.addEventListener("hashchange", route);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(route); else route();
})();
