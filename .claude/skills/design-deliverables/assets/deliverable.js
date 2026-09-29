/* Deliverable runtime — inlined into every bundle. Zero dependencies, zero network.
   Screens live in <script type="text/html" data-key="page/platform/state"> so shared CSS ships once. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var json = function (id) { try { var e = document.getElementById(id); return e ? JSON.parse(e.textContent) : null; } catch (x) { return null; } };
  var _ledger = null;
  function ledgerNodes() { if (!_ledger) _ledger = (json("__ids") || {}).nodes || {}; return _ledger; }
  var flows = json("__flows");
  var css = ($("#__css") || {}).textContent || "";
  var WIDTH = { "web-desktop": 1440, "portal-desktop": 1440, "web-mobile": 390 };
  var frames = {}, rlOn = false, sel = null;

  function docFor(key) {
    var t = $('script[data-key="' + key.replace(/"/g, '\\"') + '"]');
    if (!t) return null;
    var html = t.textContent.replace(/<\\\/script/g, "</script");
    var marker = t.getAttribute("data-marker");
    var head = "<style>" + css + "</style>" + (marker ? "<style>[data-state]{display:none!important}[data-state=\"" + marker + "\"]{display:block!important}</style>" : "");
    return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, head + "</head>") : head + html;
  }
  function fit(box, fr, plat) {
    var w = WIDTH[plat] || 1200, avail = box.clientWidth || w, s = Math.min(1, avail / w);
    fr.style.width = w + "px"; fr.style.transform = "scale(" + s + ")";
    var h = 400;
    try { h = Math.max(400, Math.min(2400, fr.contentDocument.documentElement.scrollHeight)); } catch (e) {}
    fr.style.height = h + "px"; box.style.height = Math.round(h * s) + "px";
  }
  function mount(box) {
    if (box.__mounted) return; box.__mounted = true;
    var key = box.getAttribute("data-key"), plat = box.getAttribute("data-platform");
    var fr = document.createElement("iframe");
    fr.setAttribute("title", key); fr.setAttribute("sandbox", "allow-same-origin");
    fr.srcdoc = docFor(key) || "<p>missing screen</p>";
    fr.addEventListener("load", function () { fit(box, fr, plat); bindRedline(fr); if (box.__onload) box.__onload(fr); });
    box.appendChild(fr); frames[key] = fr;
    window.addEventListener("resize", function () { fit(box, fr, plat); });
  }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { mount(e.target); io.unobserve(e.target); } });
  }, { rootMargin: "400px" }) : null;
  $$(".dd-frame-box[data-key]").forEach(function (b) { io ? io.observe(b) : mount(b); });

  /* state / platform pickers: buttons switch which .dd-screen variant is visible */
  $$(".dd-picker").forEach(function (bar) {
    var grp = bar.getAttribute("data-group");
    $$("button", bar).forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$("button", bar).forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        $$('.dd-variant[data-group="' + grp + '"]').forEach(function (v) {
          var on = v.getAttribute("data-variant") === btn.getAttribute("data-variant");
          v.hidden = !on; if (on) $$(".dd-frame-box", v).forEach(mount);
        });
        try { history.replaceState(null, "", "?screen=" + encodeURIComponent(grp) + "&state=" + encodeURIComponent(btn.getAttribute("data-variant"))); } catch (e) {}
      });
    });
  });

  /* redline inspector: R toggles; click a node in any screen */
  var panel = document.createElement("div"); panel.id = "dd-rl"; document.body.appendChild(panel);
  function bindRedline(fr) {
    var d; try { d = fr.contentDocument; } catch (e) { return; } if (!d || d.__rl) return; d.__rl = true;
    var st = d.createElement("style");
    st.textContent = "[data-node-id].rl-hot{outline:1px solid #3a88ef!important;outline-offset:1px}[data-node-id].rl-sel{outline:2px solid #e00000!important;outline-offset:1px}";
    d.head.appendChild(st);
    d.addEventListener("mouseover", function (e) { if (!rlOn) return; $$(".rl-hot", d).forEach(function (x) { x.classList.remove("rl-hot"); }); var n = e.target.closest && e.target.closest("[data-node-id]"); if (n) n.classList.add("rl-hot"); });
    d.addEventListener("click", function (e) {
      if (!rlOn) return; var n = e.target.closest && e.target.closest("[data-node-id]"); if (!n) return;
      e.preventDefault(); e.stopPropagation();
      if (sel) sel.classList.remove("rl-sel"); sel = n; n.classList.add("rl-sel"); describe(n, d);
    }, true);
  }
  function describe(n, d) {
    var id = n.getAttribute("data-node-id"), m = ledgerNodes()[id] || {}, r = n.getBoundingClientRect(), cs = d.defaultView.getComputedStyle(n);
    var rows = [["id", id], ["role", m.role], ["component", m.component], ["kind", m.kind], ["pair", m.pair],
      ["box", Math.round(r.width) + " × " + Math.round(r.height)], ["padding", cs.padding], ["margin", cs.margin],
      ["font", cs.fontWeight + " " + cs.fontSize + "/" + cs.lineHeight], ["color", cs.color], ["background", cs.backgroundColor],
      ["radius", cs.borderRadius], ["classes", typeof n.className === "string" ? n.className : ""]];
    panel.innerHTML = "<h4>" + id + "</h4><dl>" + rows.map(function (x) { return "<dt>" + x[0] + "</dt><dd>" + (x[1] || "—") + "</dd>"; }).join("") +
      "</dl><p><button class='dd-btn' id='dd-copy'>copy id</button></p>";
    $("#dd-copy").onclick = function () { try { navigator.clipboard.writeText(id); this.textContent = "copied"; } catch (e) {} };
  }
  function setRl(on) { rlOn = on; panel.classList.toggle("on", on); var b = $("#dd-rl-toggle"); if (b) b.setAttribute("aria-pressed", on); if (!on) { panel.innerHTML = ""; $$("iframe").forEach(function (f) { try { $$(".rl-hot,.rl-sel", f.contentDocument).forEach(function (x) { x.classList.remove("rl-hot", "rl-sel"); }); } catch (e) {} }); } }
  document.addEventListener("keydown", function (e) { if ((e.key === "r" || e.key === "R") && !/input|textarea/i.test(e.target.tagName || "")) setRl(!rlOn); });
  var rlb = $("#dd-rl-toggle"); if (rlb) rlb.addEventListener("click", function () { setRl(!rlOn); });

  /* prototype runner: flows.json transitions key on node ids; back / reset / state picker / deep link / hotspots */
  var stage = $("#dd-proto");
  if (stage && flows) {
    var cur = flows.entry, hist = [], hot = false, box = $("#dd-proto-box"), title = $("#dd-proto-title");
    var qs = new URLSearchParams(location.search);
    function keyOf(id) { return (flows.screens[id] || {}).key; }
    function show(id, push) {
      if (!flows.screens[id]) return; if (push) hist.push(cur); cur = id;
      title.textContent = id + " — " + (flows.screens[id].kind || "page");
      box.innerHTML = ""; box.setAttribute("data-key", keyOf(id)); box.setAttribute("data-platform", flows.screens[id].platform || "web-desktop");
      box.__mounted = false; box.__onload = wire; mount(box);
    }
    function wire(fr) {
      var d = fr.contentDocument;
      (flows.transitions || []).filter(function (t) { return t.from === cur && t.node; }).forEach(function (t) {
        var el = d.querySelector('[data-node-id="' + t.node + '"]'); if (!el) return;
        el.addEventListener("click", function (e) { e.preventDefault(); if (t.kind === "back" || t.kind === "dismiss" || t.kind === "close") back(); else show(t.to, true); }, true);
        el.style.cursor = "pointer";
        if (hot) { var r = el.getBoundingClientRect(), s = parseFloat(fr.style.transform.replace(/[^0-9.]/g, "")) || 1; var h = document.createElement("div"); h.className = "dd-spot"; h.style.cssText = "left:" + r.left * s + "px;top:" + r.top * s + "px;width:" + r.width * s + "px;height:" + r.height * s + "px"; box.appendChild(h); }
      });
    }
    function back() { if (hist.length) show(hist.pop(), false); }
    $("#dd-proto-back").onclick = back;
    $("#dd-proto-reset").onclick = function () { hist = []; show(flows.entry, false); };
    $("#dd-proto-hot").onclick = function () { hot = !hot; this.setAttribute("aria-pressed", hot); show(cur, false); };
    var pick = $("#dd-proto-pick");
    Object.keys(flows.screens).forEach(function (id) { var o = document.createElement("option"); o.value = id; o.textContent = id; pick.appendChild(o); });
    pick.onchange = function () { show(pick.value, true); };
    show(flows.screens[qs.get("screen")] ? qs.get("screen") : flows.entry, false);
  }
  /* deep link into a state picker: ?screen=<group>&state=<variant> */
  (function () { var q = new URLSearchParams(location.search), g = q.get("screen"), s = q.get("state"); if (!g || !s) return;
    var bar = $('.dd-picker[data-group="' + g.replace(/"/g, '') + '"]'); if (!bar) return;
    var b = $('button[data-variant="' + s.replace(/"/g, '') + '"]', bar); if (b) { b.click(); bar.scrollIntoView(); } })();
})();
