/* Minimal SVG chart helper: linear scales, bars, lines, areas, dots, rules, with hover tooltips. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const C = { blue: "#2a78d6", orange: "#eb6834", aqua: "#1baf7a", ink: "#101820", muted: "#5b6672", grid: "#e3e7ec", navy: "#002d72" };

  function niceTicks(lo, hi, n = 5) {
    if (hi === lo) { hi = lo + 1; }
    const span = hi - lo, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    const step = (r >= 5 ? 10 : r >= 2 ? 5 : r >= 1 ? 2 : 1) * mag; const t = [];
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) t.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
    return t;
  }
  const fmt = v => { const a = Math.abs(v); if (a === 0) return "0"; if (a >= 10000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 }); if (a >= 100) return (+v.toFixed(0)).toString(); if (a >= 1) return (+v.toFixed(2)).toString(); if (a >= 0.01) return (+v.toFixed(3)).toString(); return v.toExponential(1); };

  let tipEl;
  function tip() { if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "tip"; tipEl.setAttribute("role", "status"); document.body.appendChild(tipEl); } return tipEl; }
  function showTip(html, ev) { const t = tip(); t.innerHTML = html; t.style.display = "block"; const pad = 14, w = t.offsetWidth, h = t.offsetHeight;
    let x = ev.clientX + pad, y = ev.clientY - h - pad; if (x + w > window.innerWidth - 8) x = ev.clientX - w - pad; if (y < 8) y = ev.clientY + pad; t.style.left = x + "px"; t.style.top = y + "px"; }
  function hideTip() { if (tipEl) tipEl.style.display = "none"; }

  /* spec: { h, x:{domain,label,ticks,format}, y:{domain,label,ticks,format,zero}, layers:[...], legend:[{label,color,kind}] } */
  function draw(host, spec) {
    host = typeof host === "string" ? document.querySelector(host) : host; if (!host) return;
    const W = Math.max(280, host.clientWidth || 600), H = spec.h || 280;
    const m = { t: 12, r: 14, b: spec.x && spec.x.label ? 44 : 28, l: spec.y && spec.y.label ? 58 : 46 };
    host.innerHTML = "";
    if (spec.legend && spec.legend.length > 1) { const lg = document.createElement("div"); lg.className = "legend";
      spec.legend.forEach(i => { const s = document.createElement("span"); s.innerHTML = `<i class="sw ${i.kind || "box"}" style="--c:${i.color}"></i>${i.label}`; lg.appendChild(s); }); host.appendChild(lg); }
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height: H, role: "img", "aria-label": spec.title || "chart" }); host.appendChild(svg);
    const xs = [], ys = [];
    spec.layers.forEach(L => { (L.data || []).forEach(d => { if (L.type === "bars") { xs.push(d.x - (L.width || 1) / 2, d.x + (L.width || 1) / 2); ys.push(d.y, 0); } else if (L.type === "interval") { xs.push(d.lo, d.hi); ys.push(d.y); } else { xs.push(d.x); ys.push(d.y); if (d.y0 != null) ys.push(d.y0); } }); if (L.type === "vline") xs.push(L.x); if (L.type === "hline") ys.push(L.y); });
    const xd = (spec.x && spec.x.domain) || [Math.min(...xs), Math.max(...xs)];
    let yd = (spec.y && spec.y.domain) || [Math.min(...ys), Math.max(...ys)];
    if (!(spec.y && spec.y.domain)) { const pad = (yd[1] - yd[0]) * 0.06 || 1; yd = [spec.y && spec.y.zero ? Math.min(0, yd[0]) : yd[0] - pad, yd[1] + pad]; if (spec.y && spec.y.zero && yd[0] > 0) yd[0] = 0; }
    if (spec.equal) { const r = (xd[1] - xd[0]) / 2 * (H - m.t - m.b) / (W - m.l - m.r); yd = [-r, r]; }
    const px = v => m.l + (v - xd[0]) / (xd[1] - xd[0]) * (W - m.l - m.r), py = v => H - m.b - (v - yd[0]) / (yd[1] - yd[0]) * (H - m.t - m.b);
    const g = el("g", {}, svg);
    const yt = (spec.y && spec.y.ticks) || niceTicks(yd[0], yd[1], 5), xt = (spec.x && spec.x.ticks) || niceTicks(xd[0], xd[1], Math.max(3, Math.floor(W / 90)));
    const yf = (spec.y && spec.y.format) || fmt, xf = (spec.x && spec.x.format) || fmt;
    yt.forEach(v => { if (v < yd[0] - 1e-9 || v > yd[1] + 1e-9) return; el("line", { x1: m.l, x2: W - m.r, y1: py(v), y2: py(v), stroke: C.grid, "stroke-width": 1 }, g); const t = el("text", { x: m.l - 8, y: py(v) + 4, "text-anchor": "end", class: "tick" }, g); t.textContent = yf(v); });
    xt.forEach(v => { if (v < xd[0] - 1e-9 || v > xd[1] + 1e-9) return; const t = el("text", { x: px(v), y: H - m.b + 17, "text-anchor": "middle", class: "tick" }, g); t.textContent = xf(v); });
    el("line", { x1: m.l, x2: W - m.r, y1: py(Math.max(yd[0], Math.min(0, yd[1]))), y2: py(Math.max(yd[0], Math.min(0, yd[1]))), stroke: "#8b96a3", "stroke-width": 1 }, g);
    if (spec.x && spec.x.label) { const t = el("text", { x: m.l + (W - m.l - m.r) / 2, y: H - 6, "text-anchor": "middle", class: "axis-label" }, g); t.textContent = spec.x.label; }
    if (spec.y && spec.y.label) { const t = el("text", { transform: `translate(14 ${m.t + (H - m.t - m.b) / 2}) rotate(-90)`, "text-anchor": "middle", class: "axis-label" }, g); t.textContent = spec.y.label; }
    const clipId = "c" + Math.random().toString(36).slice(2); const cp = el("clipPath", { id: clipId }, svg); el("rect", { x: m.l, y: m.t - 4, width: W - m.l - m.r, height: H - m.t - m.b + 4 }, cp);
    const plot = el("g", { "clip-path": `url(#${clipId})` }, svg); const hoverLines = [];
    spec.layers.forEach(L => {
      const col = L.color || C.blue;
      if (L.type === "band") { el("rect", { x: px(Math.max(xd[0], L.x0)), y: m.t, width: Math.max(0, px(Math.min(xd[1], L.x1)) - px(Math.max(xd[0], L.x0))), height: H - m.t - m.b, fill: col, opacity: L.opacity || 0.12 }, plot); }
      else if (L.type === "bars") { const bw = L.width || 1; L.data.forEach(d => { const x0 = px(d.x - bw / 2), x1 = px(d.x + bw / 2), gap = Math.min(2, (x1 - x0) * 0.15), y0 = py(0), y1 = py(d.y), hh = Math.abs(y0 - y1), w = Math.max(1, x1 - x0 - gap), rr = Math.min(3, w / 2, hh);
          const top = Math.min(y0, y1); const r = el("path", { d: d.y >= 0 ? `M${x0 + gap / 2},${y0} V${top + rr} q0,${-rr} ${rr},${-rr} H${x0 + gap / 2 + w - rr} q${rr},0 ${rr},${rr} V${y0} Z` : `M${x0 + gap / 2},${y0} V${y1} H${x0 + gap / 2 + w} V${y0} Z`, fill: d.color || col, opacity: L.opacity || 1 }, plot);
          if (L.tip) { r.addEventListener("mousemove", ev => showTip(L.tip(d), ev)); r.addEventListener("mouseleave", hideTip); r.style.cursor = "default"; } }); }
      else if (L.type === "area") { let p = ""; L.data.forEach((d, i) => p += (i ? "L" : "M") + px(d.x) + "," + py(d.y)); for (let i = L.data.length - 1; i >= 0; i--) p += "L" + px(L.data[i].x) + "," + py(L.data[i].y0 ?? 0); el("path", { d: p + "Z", fill: col, opacity: L.opacity || 0.18 }, plot); }
      else if (L.type === "line") { let p = ""; L.data.forEach((d, i) => p += (i ? "L" : "M") + px(d.x).toFixed(1) + "," + py(d.y).toFixed(1)); el("path", { d: p, fill: "none", stroke: col, "stroke-width": L.width || 2, "stroke-dasharray": L.dash || null, "stroke-linejoin": "round", "stroke-linecap": "round" }, plot); if (L.tip) hoverLines.push(L); }
      else if (L.type === "step") { let p = ""; L.data.forEach((d, i) => { p += i ? `H${px(d.x)}V${py(d.y)}` : `M${px(d.x)},${py(d.y)}`; }); p += `H${px(xd[1])}`; el("path", { d: p, fill: "none", stroke: col, "stroke-width": 2 }, plot); if (L.tip) hoverLines.push(L); }
      else if (L.type === "dots") { L.data.forEach(d => { const c = el("circle", { cx: px(d.x), cy: py(d.y), r: L.r || 3.5, fill: d.color || col, "fill-opacity": L.opacity || 0.75, stroke: "#fff", "stroke-width": L.ring === false ? 0 : 1 }, plot);
          if (L.tip) { c.addEventListener("mousemove", ev => showTip(L.tip(d), ev)); c.addEventListener("mouseleave", hideTip); } }); }
      else if (L.type === "interval") { L.data.forEach(d => { el("line", { x1: px(d.lo), x2: px(d.hi), y1: py(d.y), y2: py(d.y), stroke: d.color || col, "stroke-width": L.sw || 2, "stroke-linecap": "round" }, plot); const c = el("circle", { cx: px(d.x), cy: py(d.y), r: L.r || 5, fill: d.color || col, stroke: "#fff", "stroke-width": L.r ? 0 : 2 }, plot);
          const hh = L.hit || 20; const hit = el("rect", { x: m.l, y: py(d.y) - hh / 2, width: W - m.l - m.r, height: hh, fill: "transparent" }, plot); if (L.tip) { hit.addEventListener("mousemove", ev => showTip(L.tip(d), ev)); hit.addEventListener("mouseleave", hideTip); } }); }
      else if (L.type === "vline") { el("line", { x1: px(L.x), x2: px(L.x), y1: m.t, y2: H - m.b, stroke: col, "stroke-width": L.width || 1.5, "stroke-dasharray": L.dash === undefined ? "5 4" : L.dash }, plot);
        if (L.label) { const right = px(L.x) < W - m.r - 90; const t = el("text", { x: px(L.x) + (right ? 6 : -6), y: m.t + 10 + (L.dy || 0), "text-anchor": right ? "start" : "end", class: "anno" }, svg); t.textContent = L.label; } }
      else if (L.type === "hline") { el("line", { x1: m.l, x2: W - m.r, y1: py(L.y), y2: py(L.y), stroke: col, "stroke-width": 1.5, "stroke-dasharray": "5 4" }, plot); if (L.label) { const t = el("text", { x: W - m.r - 4, y: py(L.y) - 6, "text-anchor": "end", class: "anno" }, svg); t.textContent = L.label; } }
      else if (L.type === "path") { let p = ""; L.data.forEach((d, i) => p += (i ? "L" : "M") + px(d.x).toFixed(1) + "," + py(d.y).toFixed(1)); el("path", { d: p + (L.closed ? "Z" : ""), fill: L.fill || "none", "fill-opacity": 0.08, stroke: col, "stroke-width": L.width || 1.5, "stroke-dasharray": L.dash || null }, plot); }
    });
    if (spec.ylabels) spec.ylabels.forEach(l => { const t = el("text", { x: m.l - 8, y: py(l.y) + 4, "text-anchor": "end", class: "tick strong" }, svg); t.textContent = l.text; });
    if (hoverLines.length) {
      const cross = el("line", { y1: m.t, y2: H - m.b, stroke: "#8b96a3", "stroke-width": 1, visibility: "hidden" }, svg);
      const marks = hoverLines.map(L => el("circle", { r: 4.5, fill: L.color || C.blue, stroke: "#fff", "stroke-width": 2, visibility: "hidden" }, svg));
      const hit = el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: "transparent" }, svg);
      hit.addEventListener("mousemove", ev => { const r = svg.getBoundingClientRect(); const xv = xd[0] + ((ev.clientX - r.left) * (W / r.width) - m.l) / (W - m.l - m.r) * (xd[1] - xd[0]); let html = "", cx = null;
        hoverLines.forEach((L, i) => { let best = null, bd = Infinity; if (L.type === "step") { for (const d of L.data) if (d.x <= xv) best = d; best = best || L.data[0]; } else for (const d of L.data) { const dd = Math.abs(d.x - xv); if (dd < bd) { bd = dd; best = d; } }
          if (!best) return; cx = px(best.x); marks[i].setAttribute("cx", px(best.x)); marks[i].setAttribute("cy", py(best.y)); marks[i].setAttribute("visibility", "visible"); html += `<div><i class="sw line" style="--c:${L.color || C.blue}"></i>${L.tip(best)}</div>`; });
        if (cx != null) { cross.setAttribute("x1", cx); cross.setAttribute("x2", cx); cross.setAttribute("visibility", "visible"); } showTip(html, ev); });
      hit.addEventListener("mouseleave", () => { hideTip(); cross.setAttribute("visibility", "hidden"); marks.forEach(c => c.setAttribute("visibility", "hidden")); });
    }
  }
  window.Chart = { draw, C, fmt, niceTicks };
})();
