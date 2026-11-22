/* Small statistics library used by every lab and report on this site. */
(function (root) {
  const S = {};
  S.sum = a => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };
  S.mean = a => S.sum(a) / a.length;
  S.variance = (a, ddof = 1) => { const m = S.mean(a); let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - m) ** 2; return s / (a.length - ddof); };
  S.sd = (a, ddof = 1) => Math.sqrt(S.variance(a, ddof));
  S.min = a => a.reduce((m, v) => Math.min(m, v), Infinity);
  S.max = a => a.reduce((m, v) => Math.max(m, v), -Infinity);
  S.quantile = (a, q) => { const s = Float64Array.from(a).sort(); const h = (s.length - 1) * q, lo = Math.floor(h); return s[lo] + (h - lo) * ((s[Math.min(lo + 1, s.length - 1)]) - s[lo]); };
  S.cov = (a, b) => { const ma = S.mean(a), mb = S.mean(b); let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb); return s / (a.length - 1); };
  S.corr = (a, b) => S.cov(a, b) / (S.sd(a) * S.sd(b));
  S.range = (a, b, step = 1) => { const r = []; for (let v = a; v <= b + 1e-12; v += step) r.push(v); return r; };
  S.linspace = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * i / (n - 1));
  S.hist = (a, bins, lo, hi) => {
    lo = lo ?? S.min(a); hi = hi ?? S.max(a); const w = (hi - lo) / bins; const c = new Array(bins).fill(0); let n = 0;
    for (const v of a) { if (v < lo || v > hi) continue; let k = Math.floor((v - lo) / w); if (k >= bins) k = bins - 1; c[k]++; n++; }
    return c.map((cnt, k) => ({ x0: lo + k * w, x1: lo + (k + 1) * w, x: lo + (k + 0.5) * w, count: cnt, density: cnt / (a.length * w), prob: cnt / a.length }));
  };
  S.counts = a => { const m = new Map(); for (const v of a) m.set(v, (m.get(v) || 0) + 1); return [...m.entries()].sort((p, q) => p[0] - q[0]).map(([value, count]) => ({ value, count, prob: count / a.length })); };

  // --- special functions ---
  S.lgamma = x => { const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - S.lgamma(1 - x);
    x -= 1; let a = c[0]; const t = x + g + 0.5; for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); };
  S.erf = x => { const s = x < 0 ? -1 : 1; x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; };
  S.normPdf = (x, mu = 0, sd = 1) => Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
  // high-accuracy normal CDF (Hart/West double-precision algorithm)
  S.normCdf = (x, mu = 0, sd = 1) => { const z = (x - mu) / sd, a = Math.abs(z); let c;
    if (a > 37) c = 0; else { const e = Math.exp(-a * a / 2);
      if (a < 7.07106781186547) { let n = 3.52624965998911e-2 * a + 0.700383064443688; n = n * a + 6.37396220353165; n = n * a + 33.912866078383; n = n * a + 112.079291497871; n = n * a + 221.213596169931; n = n * a + 220.206867912376;
        let d = 8.83883476483184e-2 * a + 1.75566716318264; d = d * a + 16.064177579207; d = d * a + 86.7807322029461; d = d * a + 296.564248779674; d = d * a + 637.333633378831; d = d * a + 793.826512519948; d = d * a + 440.413735824752; c = e * n / d; }
      else { let b = a + 0.65; b = a + 4 / b; b = a + 3 / b; b = a + 2 / b; b = a + 1 / b; c = e / b / 2.506628274631; } }
    return z > 0 ? 1 - c : c; };
  S.normInv = p => { let lo = -10, hi = 10; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (S.normCdf(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
  S.binomPmf = (k, n, p) => { if (k < 0 || k > n) return 0; if (p === 0) return k === 0 ? 1 : 0; if (p === 1) return k === n ? 1 : 0;
    return Math.exp(S.lgamma(n + 1) - S.lgamma(k + 1) - S.lgamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p)); };
  S.poisPmf = (k, lam) => Math.exp(k * Math.log(lam) - lam - S.lgamma(k + 1));
  S.poisLogLik = (data, lam) => { let s = 0; for (const x of data) s += x * Math.log(lam) - lam - S.lgamma(x + 1); return s; };
  S.betaPdf = (x, a, b) => (x <= 0 || x >= 1) ? 0 : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) + S.lgamma(a + b) - S.lgamma(a) - S.lgamma(b));
  // regularized incomplete beta I_x(a,b), continued fraction (Lentz)
  S.ibeta = (x, a, b) => { if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(S.lgamma(a + b) - S.lgamma(a) - S.lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    const cf = (x, a, b) => { const T = 1e-300; let c = 1, d = 1 - (a + b) * x / (a + 1); if (Math.abs(d) < T) d = T; d = 1 / d; let h = d;
      for (let m = 1; m <= 300; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
        d = 1 + aa * d; if (Math.abs(d) < T) d = T; c = 1 + aa / c; if (Math.abs(c) < T) c = T; d = 1 / d; h *= d * c;
        aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
        d = 1 + aa * d; if (Math.abs(d) < T) d = T; c = 1 + aa / c; if (Math.abs(c) < T) c = T; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break; }
      return h; };
    return x < (a + 1) / (a + b + 2) ? bt * cf(x, a, b) / a : 1 - bt * cf(1 - x, b, a) / b; };
  S.betaInv = (p, a, b) => { let lo = 0, hi = 1; for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2; if (S.ibeta(m, a, b) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
  S.tCdf = (t, df) => { const x = df / (df + t * t), p = 0.5 * S.ibeta(x, df / 2, 0.5); return t > 0 ? 1 - p : p; };
  S.tInv = (p, df) => { let lo = -200, hi = 200; for (let i = 0; i < 90; i++) { const m = (lo + hi) / 2; if (S.tCdf(m, df) < p) lo = m; else hi = m; } return (lo + hi) / 2; };

  // --- seeded random numbers ---
  S.rng = seed => { let a = seed >>> 0; const u = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    let spare = null;
    const normal = (mu = 0, sd = 1) => { if (spare !== null) { const v = spare; spare = null; return mu + sd * v; }
      let u1 = 0; while (u1 === 0) u1 = u(); const r = Math.sqrt(-2 * Math.log(u1)), th = 2 * Math.PI * u(); spare = r * Math.sin(th); return mu + sd * r * Math.cos(th); };
    const poisson = lam => { const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= u(); } while (p > L); return k - 1; };
    const int = n => Math.floor(u() * n);
    const choice = (arr, n) => { const o = new Array(n); for (let i = 0; i < n; i++) o[i] = arr[int(arr.length)]; return o; };
    return { u, normal, poisson, int, choice }; };

  // --- linear algebra ---
  S.inv = A => { const n = A.length, M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
    for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]];
      const d = M[c][c]; for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; if (f !== 0) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j]; } }
    return M.map(r => r.slice(n)); };
  S.xtx = (X, ridge = 0, skip = 0) => { const p = X[0].length, G = Array.from({ length: p }, () => new Array(p).fill(0));
    for (const r of X) for (let i = 0; i < p; i++) { const ri = r[i]; for (let j = i; j < p; j++) G[i][j] += ri * r[j]; }
    for (let i = 0; i < p; i++) { for (let j = 0; j < i; j++) G[i][j] = G[j][i]; if (i >= skip) G[i][i] += ridge; } return G; };
  S.xty = (X, y) => { const p = X[0].length, v = new Array(p).fill(0); X.forEach((r, k) => { for (let i = 0; i < p; i++) v[i] += r[i] * y[k]; }); return v; };
  S.matVec = (M, v) => M.map(r => r.reduce((s, m, i) => s + m * v[i], 0));
  /* Ordinary least squares. X rows must already include the leading 1 for the intercept.
     ridge > 0 adds lambda to the diagonal for every slope (the intercept is left unpenalised). */
  S.ols = (X, y, ridge = 0) => { const n = X.length, k = X[0].length; const Ginv = S.inv(S.xtx(X, ridge, 1)); const beta = S.matVec(Ginv, S.xty(X, y));
    const fitted = X.map(r => r.reduce((s, v, i) => s + v * beta[i], 0)); const resid = y.map((v, i) => v - fitted[i]);
    const rss = S.sum(resid.map(e => e * e)), ybar = S.mean(y), tss = S.sum(y.map(v => (v - ybar) ** 2));
    const df = n - k, sigma2 = rss / df; const se = Ginv.map((r, i) => Math.sqrt(sigma2 * r[i]));
    const tcrit = S.tInv(0.975, df);
    return { beta, se, fitted, resid, rss, tss, r2: 1 - rss / tss, adjR2: 1 - (rss / df) / (tss / (n - 1)), sigma: Math.sqrt(sigma2), rmse: Math.sqrt(rss / n), df, tcrit,
      ci: beta.map((b, i) => [b - tcrit * se[i], b + tcrit * se[i]]), n, k }; };
  S.cheb = (x, deg) => { const t = [1]; if (deg >= 1) t.push(x); for (let k = 2; k <= deg; k++) t.push(2 * x * t[k - 1] - t[k - 2]); return t; };

  root.S = S; if (typeof module !== "undefined") module.exports = S;
})(typeof window !== "undefined" ? window : globalThis);
