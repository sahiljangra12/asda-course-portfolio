/* Router, page templates and the lab engine. */
(function () {
  const main = document.getElementById("main"), LABS = window.LABS, LEARN = window.LEARN, M = window.COURSE.modules, labById = Object.fromEntries(LABS.map(l => [l.id, l]));
  const num = i => String(i + 1).padStart(2, "0");
  const math = el => window.renderMathInElement && renderMathInElement(el, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }], throwOnError: false });
  const tilesHtml = t => t.length ? `<div class="tiles">${t.map(x => `<div class="tile"><div class="k">${x.k}</div><div class="v">${x.v}</div>${x.s ? `<div class="s">${x.s}</div>` : ""}</div>`).join("")}</div>` : "";
  let redraw = null, stopHero = null;
  const BANDS = { m1: { labs: ["binomial", "nhanes", "quakes"], show: ["binomial", 0] }, m2: { labs: ["clt"], show: ["clt", 1] }, m3: { labs: ["test"], show: ["test", 0] }, m4: { labs: ["horse", "sp500", "bootstrap", "bayes", "gauss2d"], show: ["bayes", 0] }, m5: { labs: ["penguins", "diabetes"], show: ["penguins", 0] }, m6: { labs: ["polycv"], show: ["polycv", 1] } };

  /* ---------- Home ---------- */
  function home() {
    const R = window.REPORTS();
    main.innerHTML = `<section class="hero"><canvas id="hero" aria-hidden="true"></canvas>
        <div class="inner"><p class="kicker">Applied statistics, hands on</p><h1>Learn statistics by running it</h1>
          <p class="lede">Thirteen labs you can steer, from a coin toss to ridge regression. Move a slider, see the mathematics respond, on real data.</p>
          <div class="btnrow"><a class="btn solid" href="#labs/${LABS[0].id}">Start lab 01</a><a class="btn" href="#labs">All labs</a></div></div>
        <p class="cap">Each dot is the mean of 30 random draws. The pile is the central limit theorem.</p></section>
      <div class="stats"><div><b>${LABS.length}</b><span>Interactive labs</span></div><div><b>16</b><span>Lectures covered</span></div><div><b>8</b><span>Real datasets</span></div><div><b>0</b><span>Installs needed</span></div></div>
      ${M.map((m, i) => { const b = BANDS[m.id]; return `<section class="band"><div class="copy"><p class="kicker">Module ${num(i)} / ${m.lectures}</p><h2>${m.title}</h2><p>${m.blurb}</p>
          <div class="links">${b.labs.map(id => `<a href="#labs/${id}">${labById[id].title}<span>Lab ${num(LABS.indexOf(labById[id]))}</span></a>`).join("")}</div>
          <a class="btn" href="#labs/${b.labs[0]}">Open the lab</a></div>
        <div class="visual"><p class="cap"><span>${labById[b.show[0]].title}</span><span>Live</span></p><div class="plot" data-lab="${b.show[0]}" data-i="${b.show[1]}"></div></div></section>`; }).join("")}
      <section class="stories"><p class="kicker">Six short investigations</p><h2>Data stories</h2>
        <div class="rows">${R.map((r, i) => `<a href="#reports/${r.id}"><span class="n">${num(i)}</span><span class="t">${r.title}</span><span class="go">Read</span></a>`).join("")}</div></section>`;
    const draw = () => main.querySelectorAll(".band .plot").forEach(p => { const lab = labById[p.dataset.lab], v = lab.view(JSON.parse(JSON.stringify(lab.state)), () => {}), c = v.charts[+p.dataset.i]; Chart.draw(p, { ...c.spec, h: 360, title: c.title }); });
    draw(); redraw = draw; stopHero = hero(document.getElementById("hero"));
  }

  function hero(cv) {
    const ctx = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1); let W, H; const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }; size();
    const r = S.rng(30), draw1 = () => r.u() < 0.5 ? r.normal(-2, 1) : r.normal(3, 0.5), mu = 0.5, sd = Math.sqrt(0.5 * 5 + 0.5 * 9.25 - 0.25), se = sd / Math.sqrt(30);
    const BINS = 45, lo = mu - 3.8 * se, hi = mu + 3.8 * se, counts = new Array(BINS).fill(0), falling = [], TOTAL = 1500, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; let made = 0, raf, dead = false;
    const next = () => { let t = 0; for (let j = 0; j < 30; j++) t += draw1(); made++; return Math.floor((t / 30 - lo) / (hi - lo) * BINS); };
    function frame() {
      if (dead) return; ctx.clearRect(0, 0, W, H); const narrow = W < 700, gx = narrow ? W * 0.04 : W * 0.4, gw = narrow ? W * 0.92 : W * 0.56, base = H * (narrow ? 0.5 : 0.8), dot = Math.max(1.6, Math.min(3.4, gw / BINS / 2.5)), step = dot * 2 + 0.8, cap = Math.floor((base - H * 0.14) / step), scale = Math.max(1, Math.max(...counts) / cap);
      ctx.fillStyle = "rgba(255,255,255,.92)"; counts.forEach((c, k) => { const n = Math.round(c / scale), x = gx + (k + 0.5) * gw / BINS; for (let j = 0; j < n; j++) { ctx.beginPath(); ctx.arc(x, base - dot - j * step, dot, 0, 6.3); ctx.fill(); } });
      if (made > 80) { ctx.strokeStyle = "#3987e5"; ctx.lineWidth = 2.5; ctx.beginPath(); for (let i = 0; i <= 160; i++) { const v = lo + (hi - lo) * i / 160, e = made * S.normPdf(v, mu, se) * (hi - lo) / BINS / scale, x = gx + (v - lo) / (hi - lo) * gw, y = base - e * step; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
      ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, base + 0.5); ctx.lineTo(gx + gw, base + 0.5); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.75)"; for (let i = falling.length - 1; i >= 0; i--) { const d = falling[i]; d.y += d.v; d.v += 0.45; const ty = base - dot - Math.round(counts[d.k] / scale) * step; if (d.y >= ty) { counts[d.k]++; falling.splice(i, 1); continue; } ctx.beginPath(); ctx.arc(gx + (d.k + 0.5) * gw / BINS, d.y, dot, 0, 6.3); ctx.fill(); }
      let add = made < 50 ? (Math.random() < 0.4 ? 1 : 0) : 5; while (add-- > 0 && made < TOTAL) { const k = next(); if (k >= 0 && k < BINS) falling.push({ k, y: -6, v: 3 + Math.random() * 3 }); }
      if (made < TOTAL || falling.length) raf = requestAnimationFrame(frame);
    }
    if (reduce) while (made < TOTAL) { const k = next(); if (k >= 0 && k < BINS) counts[k]++; }
    frame(); const onR = () => { size(); if (made >= TOTAL && !falling.length) frame(); }; window.addEventListener("resize", onR);
    return () => { dead = true; cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
  }

  /* ---------- Lectures ---------- */
  function course(target) {
    main.innerHTML = `<div class="wrap"><div class="page-head"><p class="kicker">Sixteen lectures, six modules</p><h1>Lectures</h1><p>What each lecture covers, the one formula to keep from it, and the lab where you can try it. Summaries are in my own words.</p></div>
      <section class="block">${M.map(m => `<div class="module" id="${m.id}"><header><h2>${m.title}</h2><span>${m.lectures}</span></header>
        ${m.items.map(l => `<article class="lecture"><div class="num" aria-label="Lecture ${l.n}">${String(l.n).padStart(2, "0")}</div><div><h4>${l.title}</h4><p>${l.summary}</p><div class="links">${l.labs.map(id => `<a class="chip" href="#labs/${id}">${labById[id].title}</a>`).join("")}</div></div><div class="side formula">$$${l.tex}$$</div></article>`).join("")}</div>`).join("")}</section></div>`;
    math(main); if (target) { const e = document.getElementById(target); if (e) e.scrollIntoView(); }
  }

  /* ---------- Labs ---------- */
  function labs(id) {
    const lab = labById[id] || LABS[0], idx = LABS.indexOf(lab), L = LEARN[lab.id], groups = [...new Set(LABS.map(l => l.group))], prev = LABS[idx - 1], next = LABS[idx + 1];
    main.innerHTML = `<div class="labs"><aside class="labnav" aria-label="Labs">
        <select class="labpick" aria-label="Choose a lab">${LABS.map((l, i) => `<option value="${l.id}" ${l === lab ? "selected" : ""}>${num(i)}  ${l.title}</option>`).join("")}</select>
        <div class="list">${groups.map(g => `<h4>${g}</h4>${LABS.filter(l => l.group === g).map(l => `<a href="#labs/${l.id}" ${l === lab ? 'aria-current="true"' : ""}><i>${num(LABS.indexOf(l))}</i>${l.title}</a>`).join("")}`).join("")}</div></aside>
      <article class="lab"><header><div class="meta"><b>Lab ${num(idx)} / ${LABS.length}</b><span>${lab.group}</span><span>${lab.from}</span></div><h2>${lab.title}</h2><p>${lab.intro}</p></header>
        <section class="step"><h3>The idea</h3><div class="idea"><p>${L.idea}</p><div class="formula">$$${L.tex}$$</div></div></section>
        <section class="step"><h3>Play</h3><div class="controls"></div><div class="out"></div></section>
        <section class="step"><h3>Try this</h3><ol class="missions">${L.tries.map((t, i) => `<li><b>Mission ${i + 1}</b>${t}</li>`).join("")}</ol></section>
        <section class="step"><h3>Check yourself</h3><div class="quiz"><p class="q">${L.quiz.q}</p><div class="opts">${L.quiz.options.map((o, i) => `<button type="button" data-i="${i}">${o}</button>`).join("")}</div><p class="why" hidden></p></div></section>
        <nav class="pager" aria-label="Previous and next lab">${prev ? `<a class="prev" href="#labs/${prev.id}"><small>Previous lab</small><span>${prev.title}</span></a>` : ""}${next ? `<a class="next" href="#labs/${next.id}"><small>Next lab</small><span>${next.title}</span></a>` : `<a class="next" href="#reports"><small>Finished all ${LABS.length}</small><span>Read the data stories</span></a>`}</nav>
      </article></div>`;
    math(main.querySelector(".idea"));
    main.querySelector(".labpick").addEventListener("change", e => location.hash = "#labs/" + e.target.value);
    const quiz = main.querySelector(".quiz"); quiz.addEventListener("click", e => { const b = e.target.closest("button"); if (!b || b.disabled) return; const ok = +b.dataset.i === L.quiz.answer;
      quiz.querySelectorAll("button").forEach(x => { x.disabled = true; if (+x.dataset.i === L.quiz.answer) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
      const w = quiz.querySelector(".why"); w.hidden = false; w.innerHTML = `<b>${ok ? "Correct." : "Not quite."}</b> ${L.quiz.why}`; fixHats(w); });
    const s = lab._state || (lab._state = JSON.parse(JSON.stringify(lab.state))), cbox = main.querySelector(".controls"), out = main.querySelector(".out");
    function render() {
      if (!document.body.contains(out)) return; const v = lab.view(s, render);
      out.innerHTML = (v.status ? `<div class="status" role="status">${v.status}</div>` : "") + tilesHtml(v.tiles) + `<div class="charts ${v.charts.length === 1 ? "one" : ""}">${v.charts.map((c, i) => `<div class="chartcard ${c.wide ? "wide" : ""}"><h4>${c.title}</h4><p class="sub">${c.sub || ""}</p><div class="plot" data-i="${i}"></div></div>`).join("")}</div>` + (v.notice ? `<div class="notice"><p>${v.notice}</p></div>` : "");
      out.querySelectorAll(".plot").forEach(p => Chart.draw(p, { ...v.charts[+p.dataset.i].spec, title: v.charts[+p.dataset.i].title })); fixHats(out);
    }
    function controls() {
      cbox.innerHTML = ""; lab.controls.forEach((c, i) => { const d = document.createElement("div"); d.className = "ctl" + (c.type === "checks" ? " checks" : ""); const cid = `c-${lab.id}-${i}`;
        if (c.type === "range") { const fm = c.fmt || (v => v); d.innerHTML = `<label for="${cid}">${c.label}<output>${fm(s[c.key])}</output></label><input id="${cid}" type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${s[c.key]}">`;
          d.querySelector("input").addEventListener("input", e => { s[c.key] = +e.target.value; d.querySelector("output").textContent = fm(s[c.key]); render(); }); }
        else if (c.type === "select") { d.innerHTML = `<label for="${cid}">${c.label}</label><select id="${cid}">${c.options.map(o => `<option value="${o[0]}" ${String(s[c.key]) === o[0] ? "selected" : ""}>${o[1]}</option>`).join("")}</select>`; d.querySelector("select").addEventListener("change", e => { s[c.key] = e.target.value; render(); }); }
        else if (c.type === "button") { d.innerHTML = `<button class="btn small" type="button">${c.label}</button>`; d.querySelector("button").addEventListener("click", () => { c.act(s); controls(); render(); }); }
        else if (c.type === "checks") { d.innerHTML = `<label>${c.label}</label><div>${c.options.map(o => `<label><input type="checkbox" value="${o[0]}" ${s[c.key].includes(o[0]) ? "checked" : ""}> ${o[1]}</label>`).join("")}</div>`; d.addEventListener("change", () => { s[c.key] = [...d.querySelectorAll("input:checked")].map(x => x.value); render(); }); }
        cbox.appendChild(d); });
      const reset = document.createElement("div"); reset.className = "ctl"; reset.style.flex = "0 0 auto"; reset.style.minWidth = "0"; reset.innerHTML = `<button class="btn small" type="button">Reset</button>`; reset.querySelector("button").addEventListener("click", () => { Object.keys(s).forEach(k => delete s[k]); Object.assign(s, JSON.parse(JSON.stringify(lab.state))); controls(); render(); }); cbox.appendChild(reset); fixHats(cbox);
    }
    controls(); render(); redraw = render;
  }

  /* ---------- Data stories ---------- */
  function reports(target) {
    const R = window.REPORTS();
    main.innerHTML = `<div class="wrap"><div class="page-head"><p class="kicker">Six short investigations</p><h1>Data stories</h1><p>One question per dataset: the numbers, a chart, and what the evidence does and does not support. Every figure is recomputed from the raw data when this page loads.</p>
        <div class="toc" style="margin-top:26px">${R.map((r, i) => `<a class="chip" href="#reports/${r.id}">${num(i)} ${r.title}</a>`).join("")}</div></div>
      ${R.map((r, i) => `<article class="report" id="${r.id}"><header><p class="kicker">Story ${num(i)} / ${r.source}</p><h2>${r.title}</h2></header><p class="q">${r.q}</p>${tilesHtml(r.tiles)}
        <div class="body"><div>${r.html}<p style="margin-top:22px"><a class="btn small" href="#labs/${r.lab}">Play with it in the lab</a></p></div><div class="chartcard"><h4>${r.chart.title}</h4><p class="sub">${r.chart.sub}</p><div class="plot" data-i="${i}"></div></div></div></article>`).join("")}</div>`;
    const draw = () => main.querySelectorAll(".report .plot").forEach(p => Chart.draw(p, { ...R[+p.dataset.i].chart.spec, title: R[+p.dataset.i].chart.title }));
    draw(); redraw = draw; if (target) { const e = document.getElementById(target); if (e) e.scrollIntoView(); }
  }

  /* ---------- About ---------- */
  function about() {
    main.innerHTML = `<div class="wrap"><div class="page-head"><p class="kicker">Who, what, and where the data come from</p><h1>About</h1><p>ASDA Lab is a place to learn statistics by changing things and watching what happens.</p></div>
      <section class="block credits">
        <div><h3>What this is</h3>
          <p>I built this while taking 413/613 Applied Statistics &amp; Data Science I at Johns Hopkins University in Fall 2026, taught by Prof. Suryanarayana Maddu in the Department of Applied Mathematics and Statistics and the Data Science and AI Institute.</p>
          <p>Each lab has four parts: the idea in plain words with its formula, a live experiment you control, three missions to try, and one question to check yourself. The labs run in order from a coin toss to model selection, and each one links to the next.</p>
          <h3>How it works</h3>
          <p>The course notebooks are in Python. I re-implemented their analyses in plain JavaScript so everything runs in your browser with nothing to install: distributions, the bootstrap, least squares, ridge, cross-validation and Student t quantiles are written from scratch in one small file.</p>
          <p>The results were checked against the notebook outputs. The penguin regression gives an intercept of −5780.83 g and a slope of 49.69 g/mm, and the ten-predictor diabetes model reproduces every coefficient and standard error to the printed precision. Simulations use a seeded random number generator, so results change only when you ask for a new sample.</p>
          <h3>What is not here</h3>
          <p>The lecture notes, assignments, solutions and exams belong to the course and are not posted. The ideas, the examples and the choice of datasets are Prof. Maddu's; any mistakes in this re-implementation are mine.</p></div>
        <div><h3>Data sources</h3>
          <ul>
            <li><b>NHANES 2017–2018.</b> US Centers for Disease Control and Prevention, National Center for Health Statistics; adults with complete records. Used unweighted, so results describe the sample and not the US population.</li>
            <li><b>Earthquakes.</b> US Geological Survey earthquake catalogue, magnitude 6.85 and above, 1900 to 2025; 2,117 events, downloaded 21 November 2026.</li>
            <li><b>S&amp;P 500.</b> Daily closing values, 2 January 2024 to 5 October 2026, from FRED, Federal Reserve Bank of St. Louis; 692 values.</li>
            <li><b>Prussian horse-kick deaths.</b> Bortkiewicz's cavalry data, 280 corps-years.</li>
            <li><b>Speed of light.</b> A. A. Michelson's 1879 measurements, 100 runs.</li>
            <li><b>Palmer penguins.</b> Gorman, Williams and Fraser (2014), Palmer Station, Antarctica.</li>
            <li><b>Diabetes progression.</b> Efron, Hastie, Johnstone and Tibshirani (2004), as distributed with scikit-learn; predictors are standardised.</li>
            <li><b>Iris.</b> Fisher (1936), measurements by Edgar Anderson.</li>
          </ul>
          <h3>Built with</h3>
          <p>Hand-written HTML, CSS and JavaScript. Charts are drawn as SVG without a charting library. Formulas are set with KaTeX; the typeface is Barlow.</p>
          <p><a class="btn small" href="https://github.com/sahiljangra12/asda-course-portfolio">Source on GitHub</a></p></div>
      </section></div>`;
  }

  /* ---------- Router ---------- */
  function route() {
    if (stopHero) { stopHero(); stopHero = null; } redraw = null;
    const views = { home, course, labs, reports, about }, [view, arg] = (location.hash.replace(/^#\/?/, "") || "home").split("/"), v = views[view] ? view : "home";
    document.querySelectorAll("[data-nav]").forEach(a => a.dataset.nav === v ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
    window.scrollTo(0, 0); views[v](arg); fixHats(main);
    document.title = ({ home: "ASDA Lab: learn statistics by running it", course: "Lectures", labs: (labById[arg] || LABS[0]).title, reports: "Data stories", about: "About" })[v] + (v === "home" ? "" : " | ASDA Lab");
  }
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => redraw && redraw(), 150); });
  window.addEventListener("hashchange", route);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(route); else route();
})();
