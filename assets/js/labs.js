/* Twelve interactive labs. Each lab is { controls, state, view(state) -> {tiles, charts, notice} }. */
(function () {
  const C = Chart.C, D = window.DATA, f = (v, d = 3) => Number(v).toFixed(d), pct = (v, d = 1) => (100 * v).toFixed(d) + "%";
  const big = v => Math.round(v).toLocaleString("en-US");
  const LABS = [];

  /* ---------- 1. Binomial ---------- */
  LABS.push({
    id: "binomial", group: "Probability", title: "Binomial explorer", from: "Lectures 2 and 3",
    intro: "Toss a coin N times with probability p of heads and count the heads. Move the sliders to see when the Gaussian approximation is good and when the Poisson limit takes over.",
    state: { N: 100, p: 0.5, overlay: "gauss" },
    controls: [
      { type: "range", key: "N", label: "Number of tosses N", min: 1, max: 300, step: 1 },
      { type: "range", key: "p", label: "P(heads) p", min: 0.01, max: 0.99, step: 0.01, fmt: v => f(v, 2) },
      { type: "select", key: "overlay", label: "Overlay", options: [["gauss", "Gaussian, mean Np and variance Npq"], ["pois", "Poisson, rate Np"], ["both", "Both"], ["none", "None"]] }
    ],
    view(s) {
      const { N, p } = s, q = 1 - p, mu = N * p, v = N * p * q, sd = Math.sqrt(v);
      const lo = Math.max(0, Math.floor(mu - 5 * sd - 1)), hi = Math.min(N, Math.ceil(mu + 5 * sd + 1));
      const pmf = S.range(lo, hi).map(k => ({ x: k, y: S.binomPmf(k, N, p) }));
      let cum = 0; for (let k = 0; k < lo; k++) cum += S.binomPmf(k, N, p);
      const cdf = pmf.map(d => ({ x: d.x, y: (cum += d.y) }));
      const gx = S.linspace(lo - 0.5, hi + 0.5, 200).map(x => ({ x, y: S.normPdf(x, mu, sd) }));
      const px = pmf.map(d => ({ x: d.x, y: S.poisPmf(d.x, mu) }));
      const gapG = Math.max(...pmf.map(d => Math.abs(d.y - S.normPdf(d.x, mu, sd)))), gapP = Math.max(...pmf.map(d => Math.abs(d.y - S.poisPmf(d.x, mu))));
      const layers = [{ type: "bars", data: pmf, width: 1, color: C.blue, tip: d => `<b>k = ${d.x}</b><br>P(X = k) = ${f(d.y, 4)}` }], legend = [{ label: "Binomial PMF", color: C.blue }];
      if (s.overlay === "gauss" || s.overlay === "both") { layers.push({ type: "line", data: gx, color: C.ink }); legend.push({ label: "Gaussian", color: C.ink, kind: "line" }); }
      if (s.overlay === "pois" || s.overlay === "both") { layers.push({ type: "line", data: px, color: C.orange, dash: "5 4" }, { type: "dots", data: px, color: C.orange, r: 3, opacity: 1 }); legend.push({ label: "Poisson", color: C.orange, kind: "dash" }); }
      return {
        tiles: [{ k: "Mean Np", v: f(mu, 2) }, { k: "Variance Npq", v: f(v, 2) }, { k: "Standard deviation", v: f(sd, 3) }, { k: "Largest gap to Gaussian", v: f(gapG, 4), s: "max |PMF − density|" }, { k: "Largest gap to Poisson", v: f(gapP, 4), s: "max |PMF − Poisson|" }],
        charts: [
          { title: "Probability mass function", sub: `P(X = k) for N = ${N}, p = ${f(p, 2)}`, spec: { x: { label: "Number of heads k", domain: [lo - 0.6, hi + 0.6] }, y: { label: "Probability", zero: true }, layers, legend } },
          { title: "Cumulative distribution function", sub: "F(k) = P(X ≤ k); each jump equals P(X = k)", spec: { x: { label: "Number of heads k", domain: [lo - 0.6, hi + 0.6] }, y: { label: "F(k)", domain: [0, 1.02] }, layers: [{ type: "step", data: cdf, color: C.blue, tip: d => `<b>k = ${d.x}</b>: P(X ≤ k) = ${f(d.y, 4)}` }] } }
        ],
        notice: (gapG < gapP ? "Right now the Gaussian is the closer approximation. " : "Right now the Poisson is the closer approximation. ") + "Try N = 300 with p = 0.5, then N = 300 with p = 0.01. The Gaussian needs Np and Nq both large; the Poisson needs p small with Np moderate. Both are limits of the same binomial."
      };
    }
  });

  /* ---------- 2. NHANES ---------- */
  LABS.push({
    id: "nhanes", group: "Probability", title: "Random variables in CDC health data", from: "Lectures 2 to 4",
    intro: "One sample space, many random variables. Each of 5,434 adults in the NHANES 2017–2018 teaching extract gives a discrete household size and a continuous height. Probabilities of events are just averages of indicators.",
    state: { k: 4, a: 165, b: 175 },
    controls: [
      { type: "range", key: "k", label: "Indicator B = 1 if household size ≥", min: 2, max: 7, step: 1 },
      { type: "range", key: "a", label: "Height interval from (cm)", min: 140, max: 195, step: 1 },
      { type: "range", key: "b", label: "Height interval to (cm)", min: 140, max: 198, step: 1 }
    ],
    view(s) {
      const hh = D.nhanes.hh, h = D.nhanes.height, n = hh.length; const a = Math.min(s.a, s.b), b = Math.max(s.a, s.b);
      const pmf = S.counts(hh), ph = hh.filter(v => v >= s.k).length / n, pi = h.filter(v => v > a && v < b).length / n;
      const hist = S.hist(h, 30, 138, 198), mu = S.mean(h), sd = S.sd(h), pn = S.normCdf(b, mu, sd) - S.normCdf(a, mu, sd);
      const Ns = S.range(20, 2000, 20).map(N => ({ x: N, y: Math.sqrt(ph * (1 - ph) / N) }));
      return {
        tiles: [{ k: "Adults in sample", v: big(n) }, { k: `P(household ≥ ${s.k})`, v: f(ph, 3), s: "mean of the indicator B" }, { k: "Bernoulli variance p(1−p)", v: f(ph * (1 - ph), 3) }, { k: `P(${a} < height < ${b})`, v: f(pi, 3), s: `Gaussian model says ${f(pn, 3)}` }, { k: "Height mean and SD", v: `${f(mu, 1)} cm`, s: `SD ${f(sd, 2)} cm` }],
        charts: [
          { title: "Discrete: household size", sub: "Empirical PMF; the CDC codes 7 as “7 or more”. Darker bars are the event B = 1.", spec: { x: { label: "People in household", domain: [0.4, 7.6], ticks: [1, 2, 3, 4, 5, 6, 7], format: v => v === 7 ? "7+" : v }, y: { label: "Empirical probability", zero: true }, layers: [{ type: "bars", data: pmf.map(d => ({ x: d.value, y: d.prob, n: d.count, color: d.value >= s.k ? C.navy : "#9fc0ea" })), width: 0.8, tip: d => `<b>${d.x === 7 ? "7 or more" : d.x} people</b><br>${big(d.n)} adults, ${pct(d.y)}` }], legend: [{ label: `B = 1 (size ≥ ${s.k})`, color: C.navy }, { label: "B = 0", color: "#9fc0ea" }] } },
          { title: "Continuous: standing height", sub: "Histogram as a density, with the fitted Gaussian. The shaded band is the interval.", spec: { x: { label: "Height (cm)", domain: [138, 198] }, y: { label: "Density", zero: true }, layers: [{ type: "band", x0: a, x1: b, color: C.orange, opacity: 0.16 }, { type: "bars", data: hist.map(d => ({ x: d.x, y: d.density, n: d.count, x0: d.x0, x1: d.x1 })), width: 2, color: C.blue, tip: d => `<b>${f(d.x0, 0)}–${f(d.x1, 0)} cm</b><br>${big(d.n)} adults` }, { type: "line", data: S.linspace(138, 198, 150).map(x => ({ x, y: S.normPdf(x, mu, sd) })), color: C.ink }], legend: [{ label: "Observed", color: C.blue }, { label: "Gaussian fit", color: C.ink, kind: "line" }] } },
          { wide: true, title: "How uncertain is a sample proportion?", sub: `If only N adults had been measured, the standard deviation of p̂ would be √(p(1−p)/N), using p = ${f(ph, 3)}.`, spec: { h: 230, x: { label: "Sample size N" }, y: { label: "SD of p̂", zero: true }, layers: [{ type: "line", data: Ns, color: C.blue, tip: d => `N = ${d.x}: SD(p̂) = ${f(d.y, 4)}` }] } }
        ],
        notice: "A sample proportion is a sample mean of 0/1 indicators, which is why the same 1/√N law governs both. The records are used unweighted here, so these are statements about this sample and not about the US population; NHANES needs its survey weights for that."
      };
    }
  });

  /* ---------- 3. CLT ---------- */
  const POPS = {
    mix: { label: "Two-humped Gaussian mixture", make: () => { const r = S.rng(413), a = []; for (let i = 0; i < 20000; i++) a.push(i % 2 ? r.normal(-2, 1) : r.normal(3, 0.5)); return a; } },
    skew: { label: "Skewed (exponential waiting times)", make: () => { const r = S.rng(99), a = []; for (let i = 0; i < 20000; i++) a.push(-Math.log(1 - r.u()) * 2); return a; } },
    height: { label: "NHANES heights (cm)", make: () => D.nhanes.height },
    hh: { label: "NHANES household size", make: () => D.nhanes.hh }
  };
  const popCache = {};
  LABS.push({
    id: "clt", group: "Sampling", title: "Sampling distributions and the central limit theorem", from: "Lectures 4 and 5",
    intro: "Pick a population that is nothing like a bell curve, draw 2,000 samples of size n, and plot the 2,000 sample means. The lower chart follows one running mean as it settles: the law of large numbers.",
    state: { pop: "mix", n: 30, seed: 1 },
    controls: [
      { type: "select", key: "pop", label: "Population", options: Object.entries(POPS).map(([k, v]) => [k, v.label]) },
      { type: "range", key: "n", label: "Sample size n", min: 1, max: 300, step: 1 },
      { type: "button", label: "Draw new samples", act: s => s.seed++ }
    ],
    view(s) {
      const pop = popCache[s.pop] || (popCache[s.pop] = POPS[s.pop].make()), mu = S.mean(pop), sg = S.sd(pop, 0), r = S.rng(1000 + s.seed), M = 2000, means = new Array(M);
      for (let i = 0; i < M; i++) { let t = 0; for (let j = 0; j < s.n; j++) t += pop[r.int(pop.length)]; means[i] = t / s.n; }
      const se = sg / Math.sqrt(s.n), emp = S.sd(means), lo = mu - 4.5 * se, hi = mu + 4.5 * se, hist = S.hist(means, 40, lo, hi);
      const plo = S.min(pop), phi = S.max(pop), discrete = s.pop === "hh", ph = discrete ? S.counts(pop).map(d => ({ x: d.value, y: d.prob })) : S.hist(pop, 50, plo, phi).map(d => ({ x: d.x, y: d.density }));
      const run = []; let acc = 0; const r2 = S.rng(77 + s.seed); for (let i = 1; i <= 1000; i++) { acc += pop[r2.int(pop.length)]; run.push({ x: i, y: acc / i }); }
      return {
        tiles: [{ k: "Population mean μ", v: f(mu, 3) }, { k: "Population SD σ", v: f(sg, 3) }, { k: "Theory: σ/√n", v: f(se, 4) }, { k: "Observed SD of the 2,000 means", v: f(emp, 4), s: `${pct(emp / se - 1)} from theory` }, { k: "Mean of the sample means", v: f(S.mean(means), 3) }],
        charts: [
          { title: "The population", sub: POPS[s.pop].label, spec: { x: { label: "Value" }, y: { label: discrete ? "Probability" : "Density", zero: true }, layers: [{ type: "bars", data: ph, width: discrete ? 0.8 : (phi - plo) / 50, color: C.orange }, { type: "vline", x: mu, color: C.ink, label: "μ" }] } },
          { title: `Distribution of the sample mean, n = ${s.n}`, sub: "2,000 sample means against the CLT prediction N(μ, σ²/n)", spec: { x: { label: "Sample mean", domain: [lo, hi] }, y: { label: "Density", zero: true }, layers: [{ type: "bars", data: hist.map(d => ({ x: d.x, y: d.density, n: d.count })), width: (hi - lo) / 40, color: C.blue, tip: d => `mean ≈ ${f(d.x, 2)}<br>${d.n} of 2,000 samples` }, { type: "line", data: S.linspace(lo, hi, 160).map(x => ({ x, y: S.normPdf(x, mu, se) })), color: C.ink }], legend: [{ label: "Simulated means", color: C.blue }, { label: "CLT prediction", color: C.ink, kind: "line" }] } },
          { wide: true, title: "One running mean", sub: "Average of the first N draws, for N from 1 to 1,000", spec: { h: 230, x: { label: "Number of observations N" }, y: { label: "Running mean", domain: [mu - 1.2 * sg, mu + 1.2 * sg] }, layers: [{ type: "hline", y: mu, color: C.ink, label: "population mean" }, { type: "line", data: run, color: C.blue, tip: d => `N = ${d.x}: running mean ${f(d.y, 3)}` }] } }
        ],
        notice: s.n < 5 ? "With n this small the sample mean still carries the population's shape. Raise n and watch the humps or the skew dissolve into a bell." : "The histogram is bell-shaped even though the population is not, and its width matches σ/√n. Quadrupling n halves the spread. Set n = 1 or 2 to see where the approximation fails."
      };
    }
  });

  /* ---------- 4. Hypothesis test ---------- */
  LABS.push({
    id: "test", group: "Inference", title: "Is the coin biased? Tests and confidence intervals", from: "Lectures 6 to 8",
    intro: "A z-test for a proportion, the lecture's coin example. Choose the data and the null value; the chart shows the null distribution of p̂, the rejection region and where the observation fell.",
    state: { n: 100, ph: 0.6, p0: 0.5, alt: "two", alpha: "0.05", seed: 1 },
    controls: [
      { type: "range", key: "n", label: "Tosses n", min: 10, max: 1000, step: 10 },
      { type: "range", key: "ph", label: "Observed share of heads p̂", min: 0, max: 1, step: 0.01, fmt: v => f(v, 2) },
      { type: "range", key: "p0", label: "Null value p₀", min: 0.05, max: 0.95, step: 0.01, fmt: v => f(v, 2) },
      { type: "select", key: "alt", label: "Alternative", options: [["two", "p ≠ p₀ (two-sided)"], ["greater", "p > p₀"], ["less", "p < p₀"]] },
      { type: "select", key: "alpha", label: "Significance level α", options: [["0.10", "0.10"], ["0.05", "0.05"], ["0.01", "0.01"]] },
      { type: "button", label: "Redraw the 100 intervals", act: s => s.seed++ }
    ],
    view(s) {
      const { n, ph, p0 } = s, al = +s.alpha, se0 = Math.sqrt(p0 * (1 - p0) / n), z = (ph - p0) / se0;
      const pval = s.alt === "two" ? 2 * (1 - S.normCdf(Math.abs(z))) : s.alt === "greater" ? 1 - S.normCdf(z) : S.normCdf(z);
      const zc = s.alt === "two" ? S.normInv(1 - al / 2) : S.normInv(1 - al), reject = pval < al;
      const lo = p0 - 4.5 * se0, hi = p0 + 4.5 * se0, curve = S.linspace(lo, hi, 240).map(x => ({ x, y: S.normPdf(x, p0, se0) }));
      const bands = []; if (s.alt !== "less") bands.push({ type: "area", data: curve.filter(d => d.x >= p0 + zc * se0), color: C.orange, opacity: 0.45 }); if (s.alt !== "greater") bands.push({ type: "area", data: curve.filter(d => d.x <= p0 - zc * se0), color: C.orange, opacity: 0.45 });
      const seh = Math.sqrt(ph * (1 - ph) / n), ci = [ph - 1.96 * seh, ph + 1.96 * seh];
      const r = S.rng(500 + s.seed); let cover = 0; const ints = [];
      for (let i = 0; i < 100; i++) { let k = 0; for (let j = 0; j < n; j++) if (r.u() < p0) k++; const p = k / n, e = 1.96 * Math.sqrt(p * (1 - p) / n), ok = p - e <= p0 && p0 <= p + e; cover += ok; ints.push({ x: p, lo: p - e, hi: p + e, y: i + 1, color: ok ? C.blue : C.orange, ok }); }
      return {
        tiles: [{ k: "z statistic", v: f(z, 3), s: "(p̂ − p₀) / √(p₀(1−p₀)/n)" }, { k: "p-value", v: pval < 0.0001 ? "< 0.0001" : f(pval, 4) }, { k: `Decision at α = ${s.alpha}`, v: reject ? "Reject H₀" : "Do not reject", s: `critical |z| = ${f(zc, 3)}` }, { k: "95% confidence interval for p", v: `${f(ci[0], 3)} to ${f(ci[1], 3)}`, s: "p̂ ± 1.96 √(p̂(1−p̂)/n)" }, { k: "Heads observed", v: big(ph * n), s: `of ${n} tosses` }],
        charts: [
          { title: "Where the observation falls under H₀", sub: `If p really were ${f(p0, 2)}, p̂ would follow this curve. The orange tails hold probability α.`, spec: { h: 420, x: { label: "Share of heads p̂", domain: [Math.min(lo, ph - se0), Math.max(hi, ph + se0)] }, y: { label: "Density under H₀", zero: true }, layers: [{ type: "area", data: curve, color: C.blue, opacity: 0.12 }, ...bands, { type: "line", data: curve, color: C.blue }, { type: "vline", x: ph, color: C.ink, dash: "", width: 2, label: `observed ${f(ph, 2)}` }], legend: [{ label: "Null distribution", color: C.blue, kind: "line" }, { label: "Rejection region", color: C.orange }] } },
          { title: "What “95% confident” means", sub: `100 experiments simulated with true p = ${f(p0, 2)}; ${cover} of the 100 intervals contain it.`, spec: { h: 420, x: { label: "p" }, y: { label: "Experiment", domain: [0, 101], ticks: [1, 25, 50, 75, 100] }, layers: [{ type: "vline", x: p0, color: C.ink, dash: "" }, { type: "interval", data: ints, sw: 1.5, r: 1.8, hit: 4, tip: d => `p̂ = ${f(d.x, 3)}<br>${f(d.lo, 3)} to ${f(d.hi, 3)}<br>${d.ok ? "contains the true p" : "<b>misses the true p</b>"}` }], legend: [{ label: "Covers true p", color: C.blue, kind: "line" }, { label: "Misses", color: C.orange, kind: "line" }] } }
        ],
        notice: `60 heads in 100 tosses gives z = 2 and a two-sided p-value near 0.046: just significant at 5%, not at 1%. Keep p̂ = 0.60 and raise n; the same 10-point gap becomes overwhelming evidence, because the null curve narrows like 1/√n. The interval chart shows the other half of the story: the parameter is fixed and the interval is what varies.`
      };
    }
  });

  /* ---------- 5. Horse kicks: Poisson + likelihood ---------- */
  LABS.push({
    id: "horse", group: "Estimation", title: "Horse kicks: fitting a Poisson by maximum likelihood", from: "Lectures 3, 8, 9 and 10",
    intro: "280 corps-years of Prussian cavalry records, each counting deaths from horse kicks. Slide λ and watch the log-likelihood; the peak sits exactly at the sample mean, which is also the method-of-moments answer.",
    state: { lam: 0.7 },
    controls: [{ type: "range", key: "lam", label: "Candidate rate λ", min: 0.2, max: 1.6, step: 0.01, fmt: v => f(v, 2) }],
    view(s) {
      const x = D.horse, n = x.length, lh = S.mean(x), v = S.variance(x), obs = S.counts(x), ks = [0, 1, 2, 3, 4, 5];
      const grid = S.linspace(0.2, 1.6, 141).map(l => ({ x: l, y: S.poisLogLik(x, l) })), lmax = S.poisLogLik(x, lh), lcur = S.poisLogLik(x, s.lam), se = Math.sqrt(lh / n);
      return {
        tiles: [{ k: "Corps-years n", v: n }, { k: "MLE λ̂ = sample mean", v: f(lh, 3) }, { k: "Sample variance", v: f(v, 3), s: `variance / mean = ${f(v / lh, 2)}` }, { k: "Standard error √(λ̂/n)", v: f(se, 4), s: `95% CI ${f(lh - 1.96 * se, 3)} to ${f(lh + 1.96 * se, 3)}` }, { k: `Log-likelihood at λ = ${f(s.lam, 2)}`, v: f(lcur, 2), s: `${f(lmax - lcur, 2)} below the maximum` }],
        charts: [
          { title: "Observed counts against the Poisson model", sub: `Bars: data. Dots: expected corps-years under Poisson(${f(s.lam, 2)}).`, spec: { x: { label: "Deaths in one corps-year", domain: [-0.6, 5.6], ticks: ks }, y: { label: "Corps-years", zero: true }, layers: [{ type: "bars", data: ks.map(k => ({ x: k, y: (obs.find(o => o.value === k) || { count: 0 }).count })), width: 0.8, color: C.blue, tip: d => `<b>${d.x} deaths</b>: ${d.y} corps-years observed<br>expected ${f(n * S.poisPmf(d.x, s.lam), 1)}` }, { type: "line", data: ks.map(k => ({ x: k, y: n * S.poisPmf(k, s.lam) })), color: C.orange }, { type: "dots", data: ks.map(k => ({ x: k, y: n * S.poisPmf(k, s.lam) })), color: C.orange, r: 5, opacity: 1 }], legend: [{ label: "Observed", color: C.blue }, { label: "Poisson expectation", color: C.orange, kind: "dot" }] } },
          { title: "Log-likelihood ℓ(λ)", sub: "The data are fixed; the parameter varies.", spec: { x: { label: "λ" }, y: { label: "ℓ(λ)", domain: [lmax - 60, lmax + 4] }, layers: [{ type: "line", data: grid, color: C.blue, tip: d => `λ = ${f(d.x, 2)}: ℓ = ${f(d.y, 2)}` }, { type: "vline", x: lh, color: C.ink, label: `λ̂ = ${f(lh, 2)}` }, { type: "vline", x: s.lam, color: C.orange, dash: "", label: "candidate", dy: 16 }] } }
        ],
        notice: "For a Poisson the mean and variance are equal, and here they are 0.70 and 0.76: a quick diagnostic that the model is reasonable before any fitting. The curvature of ℓ at its peak is what sets the standard error; a sharper peak means a more precise estimate."
      };
    }
  });

  /* ---------- 6. Bootstrap ---------- */
  LABS.push({
    id: "bootstrap", group: "Estimation", title: "Bootstrap against the formula", from: "Lecture 9",
    intro: "When a standard error has a formula, the bootstrap should reproduce it. When it has none (try the median), the bootstrap still answers. Data: Michelson's 100 speed-of-light runs from 1879, or the horse-kick counts.",
    state: { data: "mich", stat: "mean", method: "param", B: 5000, seed: 1 },
    controls: [
      { type: "select", key: "data", label: "Dataset", options: [["mich", "Michelson speed of light (n = 100)"], ["horse", "Horse-kick deaths (n = 280)"]] },
      { type: "select", key: "stat", label: "Statistic", options: [["mean", "Mean"], ["var", "Variance"], ["median", "Median"]] },
      { type: "select", key: "method", label: "Bootstrap type", options: [["param", "Parametric (simulate from fitted model)"], ["nonparam", "Nonparametric (resample the data)"]] },
      { type: "range", key: "B", label: "Resamples B", min: 500, max: 20000, step: 500, fmt: big },
      { type: "button", label: "Resample", act: s => s.seed++ }
    ],
    view(s) {
      const x = s.data === "mich" ? D.michelson.speed : D.horse, n = x.length, m = S.mean(x), sd = S.sd(x), r = S.rng(7 + s.seed * 31);
      const stat = a => s.stat === "mean" ? S.mean(a) : s.stat === "var" ? S.variance(a) : S.quantile(a, 0.5), est = stat(x), boot = new Array(s.B), buf = new Array(n);
      for (let b = 0; b < s.B; b++) { for (let i = 0; i < n; i++) buf[i] = s.method === "nonparam" ? x[r.int(n)] : s.data === "mich" ? r.normal(m, sd) : r.poisson(m); boot[b] = stat(buf); }
      const bse = S.sd(boot); let ase = null, formula = "no closed form used here";
      if (s.stat === "mean") { ase = s.data === "mich" ? sd / Math.sqrt(n) : Math.sqrt(m / n); formula = s.data === "mich" ? "S / √n" : "√(λ̂ / n)"; }
      else if (s.stat === "var" && s.data === "mich") { ase = sd * sd * Math.sqrt(2 / (n - 1)); formula = "S² √(2/(n−1)), Gaussian model"; }
      const lo = S.quantile(boot, 0.0005), hi = S.quantile(boot, 0.9995), bins = s.stat === "median" && s.data === "horse" ? 12 : 45, hist = S.hist(boot, bins, lo, hi), unit = s.data === "mich" ? (s.stat === "var" ? " (km/s)²" : " km/s") : "";
      const layers = [{ type: "bars", data: hist.map(d => ({ x: d.x, y: d.density, n: d.count })), width: (hi - lo) / bins, color: C.blue, tip: d => `≈ ${f(d.x, 2)}<br>${big(d.n)} resamples` }], legend = [{ label: "Bootstrap distribution", color: C.blue }];
      if (ase) { layers.push({ type: "line", data: S.linspace(lo, hi, 160).map(v => ({ x: v, y: S.normPdf(v, est, ase) })), color: C.ink }); legend.push({ label: "Normal with the formula SE", color: C.ink, kind: "line" }); }
      layers.push({ type: "vline", x: est, color: C.orange, dash: "", label: "estimate" });
      return {
        tiles: [{ k: "Estimate from the data", v: f(est, s.data === "mich" ? 1 : 3) + unit, s: s.data === "mich" && s.stat !== "var" ? `speed ≈ ${big(299000 + est)} km/s` : "" }, { k: "Bootstrap standard error", v: f(bse, s.data === "mich" ? 3 : 4) }, { k: "Formula standard error", v: ase ? f(ase, s.data === "mich" ? 3 : 4) : "none", s: formula }, { k: "Bootstrap 95% interval", v: `${f(S.quantile(boot, 0.025), s.data === "mich" ? 1 : 3)} to ${f(S.quantile(boot, 0.975), s.data === "mich" ? 1 : 3)}`, s: "2.5th to 97.5th percentile" }],
        charts: [{ wide: true, title: "Bootstrap distribution of the statistic", sub: `${big(s.B)} ${s.method === "param" ? "datasets simulated from the fitted " + (s.data === "mich" ? "Gaussian" : "Poisson") : "resamples drawn with replacement from the data"}`, spec: { h: 320, x: { label: `Bootstrap ${s.stat === "var" ? "variance" : s.stat}`, domain: [lo, hi] }, y: { label: "Density", zero: true }, layers, legend } }],
        notice: "For the mean the two standard errors agree to about two digits, which is the check that the bootstrap is doing what the algebra does. Switch to the median: there is no formula in the panel, and the bootstrap still gives an answer. Switch between parametric and nonparametric on the Michelson variance and the two disagree a little, because the parametric version trusts the Gaussian model and the data are slightly heavier-tailed."
      };
    }
  });

  /* ---------- 7. Bayes ---------- */
  LABS.push({
    id: "bayes", group: "Estimation", title: "Bayesian coin: prior × likelihood → posterior", from: "Lectures 10 and 11",
    intro: "A Beta prior on the probability of heads, updated by observed flips. The second chart replays the lecture's sequential test between a fair coin and a 70% coin as the flips arrive one at a time.",
    state: { a: 2, b: 6, h: 7, t: 3, truth: 0.5, seed: 1 },
    controls: [
      { type: "range", key: "a", label: "Prior α", min: 0.5, max: 30, step: 0.5, fmt: v => f(v, 1) },
      { type: "range", key: "b", label: "Prior β", min: 0.5, max: 30, step: 0.5, fmt: v => f(v, 1) },
      { type: "range", key: "h", label: "Heads observed", min: 0, max: 100, step: 1 },
      { type: "range", key: "t", label: "Tails observed", min: 0, max: 100, step: 1 },
      { type: "button", label: "Three heads, Beta(10,10) prior", act: s => Object.assign(s, { a: 10, b: 10, h: 3, t: 0 }) },
      { type: "range", key: "truth", label: "True θ for the sequential test", min: 0.3, max: 0.9, step: 0.01, fmt: v => f(v, 2) },
      { type: "button", label: "New sequence of flips", act: s => s.seed++ }
    ],
    view(s) {
      const { a, b, h, t } = s, A = a + h, B = b + t, n = h + t, th = S.linspace(0.001, 0.999, 300);
      const prior = th.map(x => ({ x, y: S.betaPdf(x, a, b) })), post = th.map(x => ({ x, y: S.betaPdf(x, A, B) }));
      const ll = th.map(x => h * Math.log(x) + t * Math.log(1 - x)), lm = Math.max(...ll), pm = Math.max(...post.map(d => d.y)), like = th.map((x, i) => ({ x, y: n ? Math.exp(ll[i] - lm) * pm : pm * 0.5 }));
      const ymax = Math.min(Math.max(pm, ...prior.map(d => d.y)) * 1.08, 40);
      const mle = n ? h / n : NaN, mean = A / (A + B), map = A > 1 && B > 1 ? (A - 1) / (A + B - 2) : NaN, ci = [S.betaInv(0.025, A, B), S.betaInv(0.975, A, B)];
      const r = S.rng(70 + s.seed), seq = [{ x: 0, y: 0.5 }]; let pf = 0.5, heads = 0;
      for (let i = 1; i <= 60; i++) { const xi = r.u() < s.truth ? 1 : 0; heads += xi; const lf = 0.5, lb = xi ? 0.7 : 0.3; pf = lf * pf / (lf * pf + lb * (1 - pf)); seq.push({ x: i, y: pf, heads }); }
      return {
        tiles: [{ k: "Posterior", v: `Beta(${+A.toFixed(1)}, ${+B.toFixed(1)})` }, { k: "Maximum likelihood h/n", v: n ? f(mle, 3) : "no data" }, { k: "Posterior mean", v: f(mean, 3), s: isNaN(map) ? "" : `posterior mode (MAP) ${f(map, 3)}` }, { k: "95% credible interval", v: `${f(ci[0], 3)} to ${f(ci[1], 3)}` }, { k: "Weight on the data", v: pct(n / (n + a + b), 0), s: "n / (n + α + β)" }],
        charts: [
          { title: "Updating a belief about θ", sub: "Likelihood is rescaled to the posterior's height so the shapes can be compared.", spec: { h: 300, x: { label: "θ = P(heads)", domain: [0, 1] }, y: { label: "Density", domain: [0, ymax] }, layers: [{ type: "area", data: post, color: C.blue, opacity: 0.14 }, { type: "line", data: prior, color: C.muted, dash: "5 4", tip: d => `prior density ${f(d.y, 2)} at θ = ${f(d.x, 2)}` }, { type: "line", data: like, color: C.orange }, { type: "line", data: post, color: C.blue, width: 2.5, tip: d => `posterior density ${f(d.y, 2)}` }], legend: [{ label: "Prior", color: C.muted, kind: "dash" }, { label: "Likelihood (scaled)", color: C.orange, kind: "line" }, { label: "Posterior", color: C.blue, kind: "line" }] } },
          { title: "Sequential test: fair coin or 70% coin?", sub: `Posterior probability of “fair” after each flip, starting from 50:50. Flips generated with true θ = ${f(s.truth, 2)}.`, spec: { h: 300, x: { label: "Flips observed", domain: [0, 60] }, y: { label: "P(fair | data)", domain: [0, 1] }, layers: [{ type: "hline", y: 0.5, color: C.muted }, { type: "line", data: seq, color: C.blue, tip: d => `after ${d.x} flips${d.x ? ` (${d.heads} heads)` : ""}: P(fair) = ${f(d.y, 3)}` }] } }
        ],
        notice: "Press “Three heads, Beta(10,10) prior”. Maximum likelihood says θ = 1, a coin that can never land tails. The posterior mean is 13/23 ≈ 0.565: three flips shift the belief without overturning it. Then add data and watch the weight on the data climb toward 100%; with enough flips the prior stops mattering."
      };
    }
  });

  /* ---------- 8. 2D Gaussian ---------- */
  LABS.push({
    id: "gauss2d", group: "Estimation", title: "Shape of a two-dimensional Gaussian", from: "Multivariate notebooks, before Lecture 12",
    intro: "A covariance matrix is a shape. The sliders set the two standard deviations and the correlation; the ellipses are the 1σ and 2σ contours and the lines are the eigenvectors, scaled by the square roots of the eigenvalues.",
    state: { s1: 1.5, s2: 1, rho: 0.6, seed: 1 },
    controls: [
      { type: "range", key: "s1", label: "σ₁", min: 0.3, max: 3, step: 0.1, fmt: v => f(v, 1) },
      { type: "range", key: "s2", label: "σ₂", min: 0.3, max: 3, step: 0.1, fmt: v => f(v, 1) },
      { type: "range", key: "rho", label: "Correlation ρ", min: -0.95, max: 0.95, step: 0.05, fmt: v => f(v, 2) },
      { type: "button", label: "New sample", act: s => s.seed++ }
    ],
    view(s) {
      const { s1, s2, rho } = s, c = rho * s1 * s2, a = s1 * s1, d = s2 * s2, tr = a + d, det = a * d - c * c, disc = Math.sqrt(tr * tr / 4 - det), l1 = tr / 2 + disc, l2 = tr / 2 - disc;
      const ang = Math.abs(c) < 1e-12 ? (a >= d ? 0 : Math.PI / 2) : Math.atan2(l1 - a, c), v1 = [Math.cos(ang), Math.sin(ang)], v2 = [-v1[1], v1[0]];
      const r = S.rng(11 + s.seed), pts = [], xs = [], ys = []; for (let i = 0; i < 500; i++) { const z1 = r.normal(), z2 = r.normal(), x = s1 * z1, y = s2 * (rho * z1 + Math.sqrt(1 - rho * rho) * z2); pts.push({ x, y }); xs.push(x); ys.push(y); }
      const ell = k => S.linspace(0, 2 * Math.PI, 90).map(t => ({ x: k * (Math.sqrt(l1) * Math.cos(t) * v1[0] + Math.sqrt(l2) * Math.sin(t) * v2[0]), y: k * (Math.sqrt(l1) * Math.cos(t) * v1[1] + Math.sqrt(l2) * Math.sin(t) * v2[1]) }));
      const ax = (v, l) => [{ x: -v[0] * Math.sqrt(l), y: -v[1] * Math.sqrt(l) }, { x: v[0] * Math.sqrt(l), y: v[1] * Math.sqrt(l) }];
      return {
        tiles: [{ k: "Covariance Σ₁₂ = ρσ₁σ₂", v: f(c, 3) }, { k: "Eigenvalues of Σ", v: `${f(l1, 3)}, ${f(l2, 3)}`, s: "variances along the principal axes" }, { k: "Major-axis angle", v: `${f(ang * 180 / Math.PI, 1)}°` }, { k: "Correlation in this sample", v: f(S.corr(xs, ys), 3), s: "500 draws" }],
        charts: [{ wide: true, title: "500 draws from N(0, Σ)", sub: "Axes share one scale, so the ellipse is drawn true to shape.", spec: { h: 440, equal: true, x: { label: "X₁", domain: [-8, 8] }, y: { label: "X₂" }, layers: [{ type: "dots", data: pts, color: C.blue, r: 3, opacity: 0.5, ring: false }, { type: "path", data: ell(1), color: C.ink, closed: true, fill: C.ink }, { type: "path", data: ell(2), color: C.ink, closed: true, dash: "5 4" }, { type: "path", data: ax(v1, l1), color: C.orange, width: 2.5 }, { type: "path", data: ax(v2, l2), color: C.orange, width: 2.5 }], legend: [{ label: "Samples", color: C.blue, kind: "dot" }, { label: "1σ and 2σ contours", color: C.ink, kind: "line" }, { label: "Eigenvectors × √eigenvalue", color: C.orange, kind: "line" }] } }],
        notice: "Changing ρ with σ₁ = σ₂ rotates nothing: the axes stay at ±45° and only the ellipse's thinness changes. Make σ₁ ≠ σ₂ and the tilt depends on all three numbers. Covariance has units and correlation does not, which is why ρ is the slider that stays between −1 and 1. Regression enters here: the slope of X₂ on X₁ is Σ₁₂/σ₁²."
      };
    }
  });

  /* ---------- 9. Penguins ---------- */
  const PX = { flipper: ["Flipper length (mm)", "g per mm"], bill_length: ["Bill length (mm)", "g per mm"], bill_depth: ["Bill depth (mm)", "g per mm"] }, SPC = { Adelie: C.blue, Gentoo: C.orange, Chinstrap: C.aqua };
  LABS.push({
    id: "penguins", group: "Regression", title: "Simple regression on Palmer penguins", from: "Lectures 12 and 13",
    intro: "Predict a penguin's body mass from one measurement. Least squares gives the line; the residual plot shows what the line misses. Choose bill depth and fit by species to meet Simpson's paradox.",
    state: { x: "flipper", by: "pooled" },
    controls: [
      { type: "select", key: "x", label: "Predictor", options: Object.entries(PX).map(([k, v]) => [k, v[0]]) },
      { type: "select", key: "by", label: "Fit", options: [["pooled", "One line for all 342 penguins"], ["species", "A separate line per species"]] }
    ],
    view(s) {
      const P = D.penguins, x = P[s.x], y = P.mass, n = x.length, fit = S.ols(x.map(v => [1, v]), y), sp = ["Adelie", "Gentoo", "Chinstrap"];
      const pts = x.map((v, i) => ({ x: v, y: y[i], sp: P.species[i], color: SPC[P.species[i]] })), layers = [{ type: "dots", data: pts, r: 3.6, opacity: 0.7, tip: d => `<b>${d.sp}</b><br>${PX[s.x][0]}: ${d.x}<br>Body mass: ${big(d.y)} g` }];
      const groups = sp.map(g => { const idx = P.species.map((q, i) => q === g ? i : -1).filter(i => i >= 0), gx = idx.map(i => x[i]), gy = idx.map(i => y[i]); return { g, idx, gx, fit: S.ols(gx.map(v => [1, v]), gy) }; });
      let resid;
      if (s.by === "pooled") { const a = S.min(x), b = S.max(x); layers.push({ type: "line", data: [{ x: a, y: fit.beta[0] + fit.beta[1] * a }, { x: b, y: fit.beta[0] + fit.beta[1] * b }], color: C.ink, width: 2.5 }); resid = pts.map((d, i) => ({ ...d, y: fit.resid[i] })); }
      else { resid = new Array(n); groups.forEach(G => { const a = S.min(G.gx), b = S.max(G.gx); layers.push({ type: "line", data: [{ x: a, y: G.fit.beta[0] + G.fit.beta[1] * a }, { x: b, y: G.fit.beta[0] + G.fit.beta[1] * b }], color: SPC[G.g], width: 2.5 }); G.idx.forEach((i, j) => resid[i] = { ...pts[i], y: G.fit.resid[j] }); }); }
      const legend = [...sp.map(g => ({ label: g, color: SPC[g], kind: "dot" })), ...(s.by === "pooled" ? [{ label: "Least-squares line", color: C.ink, kind: "line" }] : [])];
      const tiles = s.by === "pooled" ? [{ k: "Slope β̂₁", v: f(fit.beta[1], 2), s: `${PX[s.x][1]}, SE ${f(fit.se[1], 2)}` }, { k: "95% CI for the slope", v: `${f(fit.ci[1][0], 1)} to ${f(fit.ci[1][1], 1)}`, s: `t with ${fit.df} df` }, { k: "Intercept β̂₀", v: big(fit.beta[0]) + " g" }, { k: "R²", v: f(fit.r2, 3), s: "share of variance explained" }, { k: "Residual SD σ̂", v: big(fit.sigma) + " g" }]
        : [...groups.map(G => ({ k: `${G.g} slope (n = ${G.idx.length})`, v: f(G.fit.beta[1], 1), s: `R² ${f(G.fit.r2, 2)}, SE ${f(G.fit.se[1], 1)}` })), { k: "Pooled slope, for comparison", v: f(fit.beta[1], 1), s: `R² ${f(fit.r2, 2)}` }];
      const paradox = s.x === "bill_depth";
      return { tiles, charts: [
        { title: "Body mass against " + PX[s.x][0].toLowerCase(), sub: `n = ${n} penguins with complete measurements`, spec: { h: 340, x: { label: PX[s.x][0] }, y: { label: "Body mass (g)" }, layers, legend } },
        { title: "Residuals", sub: "Observed minus fitted. A good linear fit leaves a structureless band around zero.", spec: { h: 340, x: { label: PX[s.x][0] }, y: { label: "Residual (g)" }, layers: [{ type: "hline", y: 0, color: C.ink }, { type: "dots", data: resid, r: 3.4, opacity: 0.7, tip: d => `<b>${d.sp}</b><br>residual ${big(d.y)} g` }], legend: sp.map(g => ({ label: g, color: SPC[g], kind: "dot" })) } }
      ], notice: paradox ? `Simpson's paradox. Pooled, the slope is ${f(fit.beta[1], 0)} g per mm: deeper bills, lighter penguins. Within every species the slope is positive (${groups.map(G => f(G.fit.beta[1], 0)).join(", ")}). Gentoos are heavy and have shallow bills, so species is a lurking variable that reverses the sign. This is the case for multiple regression.` : s.x === "flipper" ? "Each extra millimetre of flipper goes with about 50 g more body mass, and flipper length alone explains about three quarters of the variance. In the pooled residual plot the species sit in clumps rather than a uniform band: some of what the model calls noise is structure it was never shown." : "Bill length is a weaker predictor on its own, and the residuals split cleanly by species. Fit by species to see three steeper, tighter relationships hiding inside one loose one." };
    }
  });

  /* ---------- 10. Diabetes: multiple regression + ridge ---------- */
  const DC = D.diabetes.cols, LAMS = S.linspace(-4, 1, 26).map(e => Math.pow(10, e));
  const folds = (() => { const n = D.diabetes.y.length, r = S.rng(2026), idx = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = r.int(i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; } return idx.map((_, i) => i % 5).reduce((a, fo, i) => (a[idx[i]] = fo, a), new Array(n)); })();
  function cvRmse(X, y, lam, fold, K = 5) { let sse = 0; for (let k = 0; k < K; k++) { const tr = [], te = []; fold.forEach((fo, i) => (fo === k ? te : tr).push(i)); const m = S.ols(tr.map(i => X[i]), tr.map(i => y[i]), lam); for (const i of te) { const p = X[i].reduce((a, v, j) => a + v * m.beta[j], 0); sse += (y[i] - p) ** 2; } } return Math.sqrt(sse / y.length); }
  LABS.push({
    id: "diabetes", group: "Regression", title: "Multiple regression and ridge on clinical data", from: "Lectures 12, 13, 14 and 16",
    intro: "442 patients, ten baseline measurements, one target: disease progression a year later. Choose the predictors, read each coefficient with its 95% interval, then turn up the ridge penalty and watch the unstable ones shrink.",
    state: { cols: [...DC], loglam: -4.2 },
    controls: [
      { type: "checks", key: "cols", label: "Predictors in the model", options: DC.map(c => [c, c]) },
      { type: "range", key: "loglam", label: "Ridge penalty λ", min: -4.2, max: 1, step: 0.2, fmt: v => v < -4.1 ? "0 (least squares)" : Number(Math.pow(10, v).toPrecision(2)).toString() }
    ],
    view(s) {
      const cols = DC.filter(c => s.cols.includes(c)); if (!cols.length) return { tiles: [], charts: [], status: "Tick at least one predictor to fit a model." };
      const ix = cols.map(c => DC.indexOf(c)), X = D.diabetes.X.map(r => [1, ...ix.map(i => r[i])]), y = D.diabetes.y, lam = s.loglam < -4.1 ? 0 : Math.pow(10, s.loglam), ols = S.ols(X, y), fit = lam ? S.ols(X, y, lam) : ols;
      const rows = cols.map((c, j) => ({ name: c, y: cols.length - j, x: fit.beta[j + 1], lo: lam ? fit.beta[j + 1] : ols.ci[j + 1][0], hi: lam ? fit.beta[j + 1] : ols.ci[j + 1][1], ols: ols.beta[j + 1], se: ols.se[j + 1], color: !lam && ols.ci[j + 1][0] * ols.ci[j + 1][1] > 0 ? C.blue : lam ? C.blue : "#93a0ad" }));
      const path = LAMS.map(l => ({ x: Math.log10(l), tr: S.ols(X, y, l).rmse, cv: cvRmse(X, y, l, folds) })), best = path.reduce((a, b) => b.cv < a.cv ? b : a), cv0 = cvRmse(X, y, lam, folds);
      const ext = Math.max(...rows.map(r => Math.max(Math.abs(r.lo), Math.abs(r.hi), Math.abs(r.ols)))) * 1.08, layers = [{ type: "vline", x: 0, color: C.ink, dash: "" }];
      if (lam) layers.push({ type: "dots", data: rows.map(r => ({ x: r.ols, y: r.y })), color: "#93a0ad", r: 4, opacity: 1 });
      layers.push({ type: "interval", data: rows, tip: d => `<b>${d.name}</b><br>${lam ? "ridge" : "estimate"} ${f(d.x, 1)}` + (lam ? `<br>least squares ${f(d.ols, 1)}` : `<br>SE ${f(d.se, 1)}<br>95% CI ${f(d.lo, 0)} to ${f(d.hi, 0)}`) });
      const sig = rows.filter(r => r.lo * r.hi > 0).map(r => r.name);
      return {
        tiles: [{ k: "Predictors", v: cols.length, s: `n = ${y.length} patients` }, { k: "R²", v: f(fit.r2, 3), s: lam ? "with ridge penalty" : `adjusted ${f(ols.adjR2, 3)}` }, { k: "Training RMSE", v: f(fit.rmse, 2) }, { k: "5-fold CV RMSE", v: f(cv0, 2), s: "error on patients held out" }, { k: "CV-best penalty", v: Number(Math.pow(10, best.x).toPrecision(2)), s: `CV RMSE ${f(best.cv, 2)}` }],
        charts: [
          { title: lam ? "Ridge coefficients against least squares" : "Coefficients with 95% confidence intervals", sub: lam ? "Blue: ridge estimate. Grey: the least-squares value it started from." : "Blue intervals exclude zero; grey intervals include it.", spec: { h: 60 + 30 * cols.length, x: { label: "Coefficient (response units per unit of standardised predictor)", domain: [-ext, ext] }, y: { domain: [0.3, cols.length + 0.7], ticks: [] }, ylabels: rows.map(r => ({ y: r.y, text: r.name })), layers, legend: lam ? [{ label: "Ridge", color: C.blue, kind: "dot" }, { label: "Least squares", color: "#93a0ad", kind: "dot" }] : [{ label: "Excludes zero", color: C.blue, kind: "line" }, { label: "Includes zero", color: "#93a0ad", kind: "line" }] } },
          { title: "Choosing λ by cross-validation", sub: "Training error can only rise with λ. Held-out error can fall first.", spec: { h: 60 + 30 * Math.max(cols.length, 7), x: { label: "log₁₀ λ" }, y: { label: "RMSE" }, layers: [{ type: "line", data: path.map(d => ({ x: d.x, y: d.tr })), color: C.muted, dash: "5 4", tip: d => `training RMSE ${f(d.y, 2)}` }, { type: "line", data: path.map(d => ({ x: d.x, y: d.cv })), color: C.blue, tip: d => `5-fold CV RMSE ${f(d.y, 2)} at λ = ${Number(Math.pow(10, d.x).toPrecision(2))}` }, ...(lam ? [{ type: "vline", x: s.loglam, color: C.orange, dash: "", label: "current λ" }] : []), { type: "vline", x: best.x, color: C.ink, label: "CV minimum", dy: 16 }], legend: [{ label: "5-fold CV", color: C.blue, kind: "line" }, { label: "Training", color: C.muted, kind: "dash" }] } }
        ],
        notice: cols.length === 10 && !lam ? `With all ten predictors only ${sig.join(", ")} have intervals clear of zero. s1 and s2 are two blood-serum measures with correlation 0.90, so the data cannot separate them: their standard errors are about six times larger than BMI's. Untick s2 and watch s1's interval collapse. The model still predicts as well as before; collinearity hurts interpretation, not prediction.` : lam ? "Ridge pulls every slope toward zero and pulls hardest on the directions the data pin down least, which is why s1 and s2 move the most. A small penalty costs almost nothing in training error and buys stability." : "A coefficient in a multiple regression answers a conditional question: the change in expected response for one unit of this predictor with the others held fixed. Add or remove a correlated predictor and the question, and therefore the number, changes."
      };
    }
  });

  /* ---------- 11. Polynomial complexity + CV ---------- */
  LABS.push({
    id: "polycv", group: "Model selection", title: "Bias, variance and cross-validation", from: "Lectures 14 and 15",
    intro: "Noisy points around a sine curve, fitted with a polynomial of your chosen degree. Too rigid and the fit misses the shape; too flexible and it chases the noise. Training error cannot tell the difference. Cross-validation can.",
    state: { deg: 3, n: 40, noise: 0.3, seed: 1 },
    controls: [
      { type: "range", key: "deg", label: "Polynomial degree", min: 0, max: 12, step: 1 },
      { type: "range", key: "n", label: "Sample size n", min: 15, max: 200, step: 5 },
      { type: "range", key: "noise", label: "Noise SD σ", min: 0.05, max: 1, step: 0.05, fmt: v => f(v, 2) },
      { type: "button", label: "New sample", act: s => s.seed++ }
    ],
    view(s) {
      const r = S.rng(300 + s.seed), truth = x => Math.sin(2 * Math.PI * x), xs = [], ys = []; for (let i = 0; i < s.n; i++) { const x = r.u(); xs.push(x); ys.push(truth(x) + r.normal(0, s.noise)); }
      const feat = (x, d) => S.cheb(2 * x - 1, d), fold = xs.map((_, i) => i % 5), DEG = S.range(0, 12);
      const curve = DEG.map(d => { const X = xs.map(x => feat(x, d)); if (s.n - Math.ceil(s.n / 5) <= d + 1) return { x: d, tr: NaN, cv: NaN }; const m = S.ols(X, ys); return { x: d, tr: m.rss / s.n, cv: cvRmse(X, ys, 0, fold) ** 2 }; }).filter(d => isFinite(d.cv));
      const best = curve.reduce((a, b) => b.cv < a.cv ? b : a), cur = curve.find(d => d.x === s.deg) || curve[curve.length - 1], m = S.ols(xs.map(x => feat(x, cur.x)), ys);
      const g = S.linspace(0, 1, 200), cap = Math.max(curve[0].cv * 1.15, s.noise ** 2 * 3);
      return {
        tiles: [{ k: `Training MSE, degree ${cur.x}`, v: f(cur.tr, 4) }, { k: "5-fold CV MSE", v: f(cur.cv, 4), s: `${f(cur.cv / cur.tr, 1)}× the training error` }, { k: "Degree chosen by CV", v: best.x, s: `CV MSE ${f(best.cv, 4)}` }, { k: "Noise floor σ²", v: f(s.noise ** 2, 4), s: "no model can beat this" }, { k: "Parameters fitted", v: cur.x + 1, s: `from ${s.n} points` }],
        charts: [
          { title: `Degree-${cur.x} fit`, sub: "Dashed: the true curve sin(2πx) that generated the data.", spec: { h: 330, x: { label: "x", domain: [0, 1] }, y: { label: "y", domain: [-1.2 - 2.2 * s.noise, 1.2 + 2.2 * s.noise] }, layers: [{ type: "dots", data: xs.map((x, i) => ({ x, y: ys[i] })), color: C.muted, r: 3.2, opacity: 0.6 }, { type: "line", data: g.map(x => ({ x, y: truth(x) })), color: C.ink, dash: "5 4" }, { type: "line", data: g.map(x => ({ x, y: feat(x, cur.x).reduce((a, v, j) => a + v * m.beta[j], 0) })), color: C.blue, width: 2.5 }], legend: [{ label: "Data", color: C.muted, kind: "dot" }, { label: "Truth", color: C.ink, kind: "dash" }, { label: "Fitted polynomial", color: C.blue, kind: "line" }] } },
          { title: "Error against complexity", sub: "Training error always falls. Cross-validated error turns back up.", spec: { h: 330, x: { label: "Polynomial degree", domain: [0, 12], ticks: [0, 2, 4, 6, 8, 10, 12] }, y: { label: "Mean squared error", domain: [0, cap] }, layers: [{ type: "hline", y: s.noise ** 2, color: C.muted, label: "σ²" }, { type: "line", data: curve.map(d => ({ x: d.x, y: d.tr })), color: C.muted, dash: "5 4", tip: d => `degree ${d.x}: training MSE ${f(d.y, 4)}` }, { type: "line", data: curve.map(d => ({ x: d.x, y: d.cv })), color: C.blue, tip: d => `degree ${d.x}: CV MSE ${f(d.y, 4)}` }, { type: "vline", x: cur.x, color: C.orange, dash: "", label: "current" }, { type: "vline", x: best.x, color: C.ink, label: "CV minimum", dy: 16 }], legend: [{ label: "5-fold CV", color: C.blue, kind: "line" }, { label: "Training", color: C.muted, kind: "dash" }] } }
        ],
        notice: "Degree 0 and 1 are biased: no straight line follows a sine wave, however much data arrives. Degree 12 on 40 points has high variance: press “New sample” a few times and the fitted curve thrashes while a degree-3 or degree-5 fit barely moves. Training error falls below the noise floor σ², which is the signature of fitting noise. Raise n to 200 and the penalty for extra flexibility shrinks."
      };
    }
  });

  /* ---------- 12. Earthquakes (live) ---------- */
  const quakeCache = {};
  LABS.push({
    id: "quakes", group: "Probability", title: "Are large earthquakes Poisson? (live USGS data)", from: "Lecture 3 notebook",
    intro: "This lab downloads the global catalogue of large earthquakes from the US Geological Survey when you open it, counts them per calendar month from 1900 to 2025, and compares the counts with a Poisson model.",
    state: { mag: "7.0" },
    controls: [{ type: "select", key: "mag", label: "Minimum magnitude", options: [["6.85", "6.85 (as in the course notebook)"], ["7.0", "7.0"], ["7.5", "7.5"]] }],
    view(s, rerender) {
      const c = quakeCache[s.mag];
      if (!c) { quakeCache[s.mag] = { loading: true };
        fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=csv&starttime=1900-01-01&endtime=2025-12-31&minmagnitude=${s.mag}&orderby=time-asc`).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
          .then(t => { const m = new Array(1512).fill(0), yr = new Array(126).fill(0); let n = 0; t.split("\n").slice(1).forEach(l => { const y = +l.slice(0, 4), mo = +l.slice(5, 7); if (y >= 1900 && y <= 2025 && mo >= 1) { m[(y - 1900) * 12 + mo - 1]++; yr[y - 1900]++; n++; } }); if (!n) throw new Error("empty response"); quakeCache[s.mag] = { m, yr, n }; rerender(); })
          .catch(e => { quakeCache[s.mag] = { error: String(e.message || e) }; rerender(); });
        return { tiles: [], charts: [], status: "Downloading the catalogue from earthquake.usgs.gov…" }; }
      if (c.loading) return { tiles: [], charts: [], status: "Downloading the catalogue from earthquake.usgs.gov…" };
      if (c.error) return { tiles: [], charts: [], status: `The USGS catalogue could not be reached (${c.error}). This lab needs a live connection to earthquake.usgs.gov; the other eleven labs work offline. Reload to try again.` };
      const mean = S.mean(c.m), v = S.variance(c.m, 0), kmax = Math.max(S.max(c.m), Math.ceil(mean + 5 * Math.sqrt(mean))), ks = S.range(0, kmax), emp = ks.map(k => ({ x: k, y: c.m.filter(q => q === k).length / c.m.length }));
      return {
        tiles: [{ k: `Earthquakes of magnitude ≥ ${s.mag}`, v: big(c.n), s: "1900 to 2025" }, { k: "Months", v: big(c.m.length) }, { k: "Mean per month λ̂", v: f(mean, 3) }, { k: "Variance", v: f(v, 3) }, { k: "Variance / mean", v: f(v / mean, 2), s: "1.00 for an exact Poisson" }],
        charts: [
          { title: "Monthly counts against Poisson(λ̂)", sub: "Bars: share of months with k earthquakes. Line: Poisson with the same mean.", spec: { x: { label: "Earthquakes in one month k", domain: [-0.6, kmax + 0.6] }, y: { label: "Probability", zero: true }, layers: [{ type: "bars", data: emp, width: 0.8, color: C.blue, tip: d => `<b>k = ${d.x}</b><br>observed ${pct(d.y)}<br>Poisson ${pct(S.poisPmf(d.x, mean))}` }, { type: "line", data: ks.map(k => ({ x: k, y: S.poisPmf(k, mean) })), color: C.orange }, { type: "dots", data: ks.map(k => ({ x: k, y: S.poisPmf(k, mean) })), color: C.orange, r: 4, opacity: 1 }], legend: [{ label: "Observed", color: C.blue }, { label: "Poisson", color: C.orange, kind: "dot" }] } },
          { title: "Earthquakes per year", sub: "A constant-rate model predicts a flat band; clusters are aftershock sequences.", spec: { x: { label: "Year", domain: [1899, 2026], format: v => v }, y: { label: "Count", zero: true }, layers: [{ type: "bars", data: c.yr.map((y, i) => ({ x: 1900 + i, y })), width: 1, color: C.blue, tip: d => `<b>${d.x}</b>: ${d.y} earthquakes` }, { type: "hline", y: mean * 12, color: C.ink, label: "long-run mean" }] } }
        ],
        notice: "A Poisson model assumes events arrive independently at a constant rate, so its variance equals its mean. Earthquakes break the first assumption: a large shock triggers aftershocks, months with many events are more common than Poisson allows, and the variance exceeds the mean. Raising the magnitude threshold thins out the aftershocks and brings the ratio back toward 1."
      };
    }
  });

  window.LABS = LABS;
})();
