(function () {
  const n = document.createElement("link").relList;
  if (n && n.supports && n.supports("modulepreload")) return;
  for (const s of document.querySelectorAll('link[rel="modulepreload"]')) o(s);
  new MutationObserver((s) => {
    for (const a of s)
      if (a.type === "childList")
        for (const i of a.addedNodes)
          i.tagName === "LINK" && i.rel === "modulepreload" && o(i);
  }).observe(document, {
    childList: !0,
    subtree: !0,
  });
  function r(s) {
    const a = {};
    return (
      s.integrity && (a.integrity = s.integrity),
      s.referrerPolicy && (a.referrerPolicy = s.referrerPolicy),
      s.crossOrigin === "use-credentials"
        ? (a.credentials = "include")
        : s.crossOrigin === "anonymous"
          ? (a.credentials = "omit")
          : (a.credentials = "same-origin"),
      a
    );
  }
  function o(s) {
    if (s.ep) return;
    s.ep = !0;
    const a = r(s);
    fetch(s.href, a);
  }
})();
const K = "modulepreload",
  Q = function (e) {
    return "/" + e;
  },
  O = {},
  X = function (n, r, o) {
    let s = Promise.resolve();
    if (r && r.length > 0) {
      document.getElementsByTagName("link");
      const i = document.querySelector("meta[property=csp-nonce]"),
        c =
          (i == null ? void 0 : i.nonce) ||
          (i == null ? void 0 : i.getAttribute("nonce"));
      s = Promise.allSettled(
        r.map((l) => {
          if (((l = Q(l)), l in O)) return;
          O[l] = !0;
          const f = l.endsWith(".css"),
            g = f ? '[rel="stylesheet"]' : "";
          if (document.querySelector(`link[href="${l}"]${g}`)) return;
          const u = document.createElement("link");
          if (
            ((u.rel = f ? "stylesheet" : K),
            f || (u.as = "script"),
            (u.crossOrigin = ""),
            (u.href = l),
            c && u.setAttribute("nonce", c),
            document.head.appendChild(u),
            f)
          )
            return new Promise((p, b) => {
              (u.addEventListener("load", p),
                u.addEventListener("error", () =>
                  b(new Error(`Unable to preload CSS for ${l}`)),
                ));
            });
        }),
      );
    }
    function a(i) {
      const c = new Event("vite:preloadError", {
        cancelable: !0,
      });
      if (((c.payload = i), window.dispatchEvent(c), !c.defaultPrevented))
        throw i;
    }
    return s.then((i) => {
      for (const c of i || []) c.status === "rejected" && a(c.reason);
      return n().catch(a);
    });
  },
  t = {
    handLandmarker: null,
    webcamStream: null,
    isReady: !1,
    strokes: [],
    currentStroke: null,
    activeColor: "#00f0ff",
    thickness: 6,
    glowIntensity: 60,
    currentGesture: "idle",
    previousGesture: "idle",
    gestureStableFrames: 0,
    gestureStartTime: 0,
    isModalOpen: !0,
    isGrabbing: !1,
    grabStartPos: null,
    grabOffset: {
      x: 0,
      y: 0,
    },
    totalOffset: {
      x: 0,
      y: 0,
    },
    nearestStrokeIdx: -1,
    eraserRadius: 28,
    showCamera: !0,
    cameraOpacity: 0.35,
    particles: [],
    smoothPos: {
      x: 0,
      y: 0,
    },
    smoothFactor: 0.35,
    width: 0,
    height: 0,
    audioCtx: null,
  },
  h = (e) => document.getElementById(e),
  A = h("loading-screen"),
  Y = h("app"),
  v = h("webcam"),
  H = h("camera-canvas"),
  D = h("drawing-canvas"),
  U = h("ui-canvas"),
  w = H.getContext("2d"),
  I = D.getContext("2d"),
  d = U.getContext("2d"),
  Z = h("gesture-hud"),
  ee = h("gesture-icon"),
  te = h("gesture-label"),
  G = h("thickness-slider"),
  ne = h("thickness-value"),
  _ = h("glow-slider"),
  oe = h("glow-value"),
  T = h("camera-mode-text"),
  S = h("camera-mode-indicator"),
  W = h("onboarding-modal"),
  re = h("btn-start");
function se() {
  return (
    t.audioCtx ||
      (t.audioCtx = new (window.AudioContext || window.webkitAudioContext)()),
    t.audioCtx
  );
}
function m(e, n, r = "sine", o = 0.06) {
  try {
    const s = se(),
      a = s.createOscillator(),
      i = s.createGain();
    ((a.type = r),
      a.frequency.setValueAtTime(e, s.currentTime),
      i.gain.setValueAtTime(o, s.currentTime),
      i.gain.exponentialRampToValueAtTime(0.001, s.currentTime + n),
      a.connect(i),
      i.connect(s.destination),
      a.start(),
      a.stop(s.currentTime + n));
  } catch {}
}
function ie() {
  m(880, 0.08, "sine", 0.04);
}
function ae() {
  m(440, 0.1, "sine", 0.03);
}
function le() {
  m(200, 0.06, "triangle", 0.03);
}
function ce() {
  m(660, 0.1, "sine", 0.05);
}
function de() {
  m(330, 0.15, "sine", 0.04);
}
function V() {
  m(1200, 0.05, "sine", 0.03);
}
function $() {
  const e = window.innerWidth,
    n = window.innerHeight;
  ((t.width = e),
    (t.height = n),
    [H, D, U].forEach((r) => {
      ((r.width = e), (r.height = n));
    }));
}
window.addEventListener("resize", () => {
  ($(), y());
});
async function ue() {
  const { FilesetResolver: e, HandLandmarker: n } = await X(async () => {
      const { FilesetResolver: o, HandLandmarker: s } =
        await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs");
      return {
        FilesetResolver: o,
        HandLandmarker: s,
      };
    }, []),
    r = await e.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm",
    );
  return (
    (t.handLandmarker = await n.createFromOptions(r, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.5,
    })),
    !0
  );
}
async function he() {
  const e = await navigator.mediaDevices.getUserMedia({
    video: {
      width: {
        ideal: 1280,
      },
      height: {
        ideal: 720,
      },
      facingMode: "user",
    },
  });
  return (
    (v.srcObject = e),
    (t.webcamStream = e),
    new Promise((n) => {
      v.onloadedmetadata = () => {
        (v.play(), n());
      };
    })
  );
}
function fe(e) {
  if (!e || e.length === 0) return "none";
  const n = e,
    r = n[4],
    o = n[3],
    s = n[8],
    a = n[6];
  n[5];
  const i = n[12],
    c = n[10],
    l = n[16],
    f = n[14],
    g = n[20],
    u = n[18],
    p = s.y < a.y - 0.02,
    b = i.y > c.y,
    M = l.y > f.y,
    j = g.y > u.y,
    C = i.y < c.y,
    L = l.y < f.y,
    x = g.y < u.y,
    J = Math.abs(r.x - o.x) > 0.03 || r.y < o.y;
  return Math.hypot(r.x - s.x, r.y - s.y) < 0.06 && !C && !L && !x
    ? "pinch"
    : p && C && L && x && J
      ? "open_palm"
      : p && b && M && j
        ? "index_finger"
        : !p && !C && !L && !x
          ? "fist"
          : "idle";
}
function ge(e) {
  if (e === t.currentGesture)
    return (
      (t.previousGesture = e),
      (t.gestureStableFrames = 0),
      t.currentGesture
    );
  e === t.previousGesture
    ? t.gestureStableFrames++
    : ((t.previousGesture = e), (t.gestureStableFrames = 1));
  const n = e === "pinch" ? 3 : 4;
  if (t.gestureStableFrames >= n) {
    const r = t.currentGesture;
    return (
      (t.currentGesture = e),
      (t.gestureStableFrames = 0),
      (t.gestureStartTime = Date.now()),
      r !== e && B(r, e),
      e
    );
  }
  return t.currentGesture;
}
function B(e, n) {
  (n === "index_finger"
    ? ie()
    : n === "open_palm"
      ? V()
      : n === "pinch"
        ? ce()
        : e === "index_finger" && ae(),
    e === "index_finger" &&
      t.currentStroke &&
      (t.currentStroke.points.length > 1 &&
        t.strokes.push({
          ...t.currentStroke,
        }),
      (t.currentStroke = null)),
    e === "pinch" && be(),
    N(n));
}
function N(e) {
  const n = {
      index_finger: {
        icon: "☝️",
        label: "Drawing",
        cls: "drawing",
      },
      open_palm: {
        icon: "✋",
        label: "Erasing",
        cls: "erasing",
      },
      pinch: {
        icon: "🤏",
        label: "Grab",
        cls: "grabbing",
      },
      fist: {
        icon: "✊",
        label: "Idle",
        cls: "",
      },
      idle: {
        icon: "🖐️",
        label: "Ready",
        cls: "",
      },
      none: {
        icon: "👋",
        label: "Show hand",
        cls: "",
      },
    },
    r = n[e] || n.idle;
  ((ee.textContent = r.icon),
    (te.textContent = r.label),
    (Z.className = r.cls));
}
function k(e) {
  return {
    x: (1 - e.x) * t.width,
    y: e.y * t.height,
  };
}
function me(e) {
  return (
    (t.smoothPos.x += (e.x - t.smoothPos.x) * t.smoothFactor),
    (t.smoothPos.y += (e.y - t.smoothPos.y) * t.smoothFactor),
    {
      x: t.smoothPos.x,
      y: t.smoothPos.y,
    }
  );
}
function pe(e) {
  const n = e[8],
    r = k(n),
    o = me(r);
  if (Date.now() - t.gestureStartTime < 300) {
    t.smoothPos = {
      ...r,
    };
    return;
  }
  (t.currentStroke
    ? t.currentStroke.points.push({
        ...o,
      })
    : ((t.currentStroke = {
        points: [o],
        color: t.activeColor,
        thickness: t.thickness,
        glow: t.glowIntensity,
      }),
      (t.smoothPos = {
        ...r,
      })),
    Pe(o.x, o.y, t.activeColor),
    y());
}
function ye(e) {
  const n = e[0],
    r = e[9],
    o = {
      x: (1 - (n.x + r.x) / 2) * t.width,
      y: ((n.y + r.y) / 2) * t.height,
    },
    s = t.eraserRadius;
  let a = !1;
  const i = [];
  for (let c = 0; c < t.strokes.length; c++) {
    const l = t.strokes[c],
      f = [];
    let g = [];
    for (const u of l.points) {
      const p = u.x - o.x,
        b = u.y - o.y;
      Math.sqrt(p * p + b * b) >= s
        ? g.push(u)
        : ((a = !0), g.length >= 2 && f.push(g), (g = []));
    }
    if ((g.length >= 2 && f.push(g), !(f.length === 0 && l.points.length > 0)))
      if (f.length === 1 && f[0].length === l.points.length) i.push(l);
      else
        for (const u of f)
          i.push({
            points: u,
            color: l.color,
            thickness: l.thickness,
            glow: l.glow,
          });
  }
  ((t.strokes = i),
    a && le(),
    d.beginPath(),
    d.arc(o.x, o.y, s, 0, Math.PI * 2),
    (d.strokeStyle = "rgba(255, 45, 107, 0.5)"),
    (d.lineWidth = 1.5),
    d.setLineDash([5, 5]),
    d.stroke(),
    d.setLineDash([]),
    (d.fillStyle = "rgba(255, 45, 107, 0.05)"),
    d.fill(),
    y());
}
function we(e) {
  const n = e[4],
    r = e[8],
    o = {
      x: (1 - (n.x + r.x) / 2) * t.width,
      y: ((n.y + r.y) / 2) * t.height,
    };
  if (!t.isGrabbing)
    ((t.isGrabbing = !0),
      (t.grabStartPos = {
        ...o,
      }),
      (t.nearestStrokeIdx = ke(o)));
  else {
    const s = o.x - t.grabStartPos.x,
      a = o.y - t.grabStartPos.y;
    if (t.nearestStrokeIdx >= 0 && t.nearestStrokeIdx < t.strokes.length) {
      const i = t.strokes[t.nearestStrokeIdx],
        c = t.grabOffset.x,
        l = t.grabOffset.y,
        f = s - c,
        g = a - l;
      for (let u = 0; u < i.points.length; u++)
        ((i.points[u].x += f), (i.points[u].y += g));
    }
    t.grabOffset = {
      x: s,
      y: a,
    };
  }
  (d.beginPath(),
    d.arc(o.x, o.y, 18, 0, Math.PI * 2),
    (d.strokeStyle = "rgba(255, 215, 0, 0.7)"),
    (d.lineWidth = 2),
    d.stroke(),
    (d.fillStyle = "rgba(255, 215, 0, 0.1)"),
    d.fill(),
    t.nearestStrokeIdx >= 0 &&
      t.nearestStrokeIdx < t.strokes.length &&
      ve(t.strokes[t.nearestStrokeIdx]),
    y());
}
function be() {
  (t.isGrabbing && t.nearestStrokeIdx >= 0 && de(),
    (t.isGrabbing = !1),
    (t.grabStartPos = null),
    (t.grabOffset = {
      x: 0,
      y: 0,
    }),
    (t.nearestStrokeIdx = -1),
    y());
}
function ke(e) {
  let n = 1 / 0,
    r = -1;
  for (let o = 0; o < t.strokes.length; o++) {
    const s = t.strokes[o];
    for (const a of s.points) {
      const i = Math.hypot(a.x - e.x, a.y - e.y);
      i < n && ((n = i), (r = o));
    }
  }
  return n < 80 ? r : -1;
}
function ve(e) {
  if (!(!e || e.points.length < 2)) {
    (d.save(), d.beginPath(), d.moveTo(e.points[0].x, e.points[0].y));
    for (let n = 1; n < e.points.length; n++)
      d.lineTo(e.points[n].x, e.points[n].y);
    ((d.strokeStyle = "rgba(255, 215, 0, 0.3)"),
      (d.lineWidth = e.thickness + 12),
      (d.lineCap = "round"),
      (d.lineJoin = "round"),
      d.setLineDash([8, 8]),
      d.stroke(),
      d.setLineDash([]),
      d.restore());
  }
}
function F(e, n, r = !1) {
  if (!n || n.points.length < 2) return;
  const o = n.points,
    s = n.color,
    a = n.thickness,
    i = n.glow / 100;
  if ((e.save(), (e.lineCap = "round"), (e.lineJoin = "round"), i > 0)) {
    (e.beginPath(), e.moveTo(o[0].x, o[0].y));
    for (let c = 1; c < o.length; c++) {
      const l = o[c - 1],
        f = o[c],
        g = (l.x + f.x) / 2,
        u = (l.y + f.y) / 2;
      e.quadraticCurveTo(l.x, l.y, g, u);
    }
    (e.lineTo(o[o.length - 1].x, o[o.length - 1].y),
      (e.strokeStyle = s),
      (e.lineWidth = a * 3),
      (e.globalAlpha = 0.1 * i),
      (e.shadowColor = s),
      (e.shadowBlur = 35 * i),
      e.stroke());
  }
  if (i > 0) {
    (e.beginPath(), e.moveTo(o[0].x, o[0].y));
    for (let c = 1; c < o.length; c++) {
      const l = o[c - 1],
        f = o[c],
        g = (l.x + f.x) / 2,
        u = (l.y + f.y) / 2;
      e.quadraticCurveTo(l.x, l.y, g, u);
    }
    (e.lineTo(o[o.length - 1].x, o[o.length - 1].y),
      (e.strokeStyle = s),
      (e.lineWidth = a * 1.6),
      (e.globalAlpha = 0.35 * i),
      (e.shadowBlur = 15 * i),
      e.stroke());
  }
  (e.beginPath(), e.moveTo(o[0].x, o[0].y));
  for (let c = 1; c < o.length; c++) {
    const l = o[c - 1],
      f = o[c],
      g = (l.x + f.x) / 2,
      u = (l.y + f.y) / 2;
    e.quadraticCurveTo(l.x, l.y, g, u);
  }
  (e.lineTo(o[o.length - 1].x, o[o.length - 1].y),
    (e.strokeStyle = Se(s, 0.5)),
    (e.lineWidth = a),
    (e.globalAlpha = 1),
    (e.shadowBlur = 6 * i),
    (e.shadowColor = s),
    e.stroke(),
    e.restore());
}
function Se(e, n) {
  const r = parseInt(e.slice(1, 3), 16),
    o = parseInt(e.slice(3, 5), 16),
    s = parseInt(e.slice(5, 7), 16),
    a = Math.min(255, Math.round(r + (255 - r) * n)),
    i = Math.min(255, Math.round(o + (255 - o) * n)),
    c = Math.min(255, Math.round(s + (255 - s) * n));
  return `rgb(${a}, ${i}, ${c})`;
}
function y() {
  I.clearRect(0, 0, t.width, t.height);
  for (const e of t.strokes) F(I, e);
  t.currentStroke &&
    t.currentStroke.points.length > 1 &&
    F(I, t.currentStroke, !0);
}
function Pe(e, n, r) {
  for (let o = 0; o < 2; o++)
    t.particles.push({
      x: e,
      y: n,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      life: 1,
      decay: 0.02 + Math.random() * 0.03,
      size: 2 + Math.random() * 3,
      color: r,
    });
}
function Ce(e) {
  for (let n = t.particles.length - 1; n >= 0; n--) {
    const r = t.particles[n];
    if (
      ((r.x += r.vx),
      (r.y += r.vy),
      (r.life -= r.decay),
      (r.size *= 0.97),
      r.life <= 0)
    ) {
      t.particles.splice(n, 1);
      continue;
    }
    (e.save(),
      (e.globalAlpha = r.life * 0.7),
      (e.fillStyle = r.color),
      (e.shadowColor = r.color),
      (e.shadowBlur = 10),
      e.beginPath(),
      e.arc(r.x, r.y, r.size, 0, Math.PI * 2),
      e.fill(),
      e.restore());
  }
}
const Le = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];
function xe(e, n) {
  if (!n) return;
  (e.save(), (e.globalAlpha = 0.3));
  for (const [o, s] of Le) {
    const a = k(n[o]),
      i = k(n[s]);
    (e.beginPath(),
      e.moveTo(a.x, a.y),
      e.lineTo(i.x, i.y),
      (e.strokeStyle = "rgba(255, 255, 255, 0.3)"),
      (e.lineWidth = 1.5),
      e.stroke());
  }
  for (let o = 0; o < n.length; o++) {
    const s = k(n[o]);
    (e.beginPath(),
      e.arc(s.x, s.y, 3, 0, Math.PI * 2),
      (e.fillStyle = "rgba(255, 255, 255, 0.5)"),
      e.fill());
  }
  const r = [4, 8, 12, 16, 20];
  for (const o of r) {
    const s = k(n[o]);
    (e.beginPath(),
      e.arc(s.x, s.y, 5, 0, Math.PI * 2),
      (e.fillStyle = "rgba(255, 255, 255, 0.6)"),
      (e.shadowColor = "#ffffff"),
      (e.shadowBlur = 10),
      e.fill(),
      (e.shadowBlur = 0));
  }
  e.restore();
}
function Ie(e, n, r) {
  if (r === "index_finger") {
    const o = k(n[8]);
    (e.save(),
      e.beginPath(),
      e.arc(o.x, o.y, t.thickness / 2 + 6, 0, Math.PI * 2),
      (e.strokeStyle = t.activeColor),
      (e.lineWidth = 1.5),
      (e.globalAlpha = 0.5),
      (e.shadowColor = t.activeColor),
      (e.shadowBlur = 8),
      e.stroke(),
      e.beginPath(),
      e.arc(o.x, o.y, 3, 0, Math.PI * 2),
      (e.fillStyle = t.activeColor),
      (e.globalAlpha = 0.9),
      e.fill(),
      e.restore());
  }
}
let R = -1;
function E() {
  if (!t.handLandmarker || !t.isReady) {
    requestAnimationFrame(E);
    return;
  }
  const e = v,
    n = performance.now();
  if (
    (w.clearRect(0, 0, t.width, t.height),
    t.showCamera &&
      (w.save(),
      (w.globalAlpha = t.cameraOpacity),
      w.translate(t.width, 0),
      w.scale(-1, 1),
      w.drawImage(e, 0, 0, t.width, t.height),
      w.restore()),
    d.clearRect(0, 0, t.width, t.height),
    e.readyState >= 2 && e.currentTime !== R)
  ) {
    R = e.currentTime;
    const r = t.handLandmarker.detectForVideo(e, n);
    if (r.landmarks && r.landmarks.length > 0) {
      const o = r.landmarks[0],
        s = fe(o),
        a = ge(s);
      (t.isModalOpen ||
        (a === "index_finger" && pe(o),
        a === "open_palm" && ye(o),
        a === "pinch" && we(o),
        a !== "index_finger" &&
          t.currentStroke &&
          t.currentStroke.points.length > 1 &&
          (t.strokes.push({
            ...t.currentStroke,
          }),
          (t.currentStroke = null))),
        xe(d, o),
        Ie(d, o, a));
    } else
      (t.currentGesture !== "none" &&
        (B(t.currentGesture, "none"), (t.currentGesture = "none")),
        t.currentStroke &&
          t.currentStroke.points.length > 1 &&
          (t.strokes.push({
            ...t.currentStroke,
          }),
          (t.currentStroke = null),
          y()));
  }
  (Ce(d), requestAnimationFrame(E));
}
const P = h("color-palette"),
  z = h("color-picker-toggle"),
  q = h("active-color-preview");
function Te(e) {
  (q.style.setProperty("--swatch-color", e), (q.dataset.color = e));
}
document.querySelectorAll("#color-palette .color-swatch").forEach((e) => {
  e.addEventListener("click", () => {
    (document
      .querySelectorAll("#color-palette .color-swatch")
      .forEach((n) => n.classList.remove("active")),
      e.classList.add("active"),
      (t.activeColor = e.dataset.color),
      Te(e.dataset.color),
      m(1e3, 0.05, "sine", 0.03),
      P.classList.remove("mobile-open"));
  });
});
z.addEventListener("click", () => {
  P.classList.toggle("mobile-open");
});
document.addEventListener("pointerdown", (e) => {
  !P.contains(e.target) &&
    !z.contains(e.target) &&
    P.classList.remove("mobile-open");
});
G.addEventListener("input", () => {
  ((t.thickness = parseInt(G.value)), (ne.textContent = `${t.thickness}px`));
});
_.addEventListener("input", () => {
  ((t.glowIntensity = parseInt(_.value)),
    (oe.textContent = `${t.glowIntensity}%`));
});
h("btn-undo").addEventListener("click", () => {
  t.strokes.length > 0 && (t.strokes.pop(), y(), m(500, 0.08, "sine", 0.03));
});
h("btn-clear").addEventListener("click", () => {
  ((t.strokes = []),
    (t.currentStroke = null),
    (t.particles = []),
    y(),
    m(300, 0.15, "triangle", 0.04));
});
h("btn-camera-toggle").addEventListener("click", () => {
  (t.showCamera && t.cameraOpacity > 0.2
    ? ((t.cameraOpacity = 0.15),
      (T.textContent = "Camera DIM"),
      S.classList.remove("dark-mode"))
    : t.showCamera && t.cameraOpacity <= 0.2
      ? ((t.showCamera = !1),
        (t.cameraOpacity = 0),
        (T.textContent = "Dark Canvas"),
        S.classList.add("dark-mode"),
        h("btn-camera-toggle").classList.remove("active"))
      : ((t.showCamera = !0),
        (t.cameraOpacity = 0.35),
        (T.textContent = "Camera ON"),
        S.classList.remove("dark-mode"),
        h("btn-camera-toggle").classList.add("active")),
    V());
});
S.addEventListener("click", () => {
  h("btn-camera-toggle").click();
});
h("btn-save").addEventListener("click", () => {
  const e = document.createElement("canvas");
  ((e.width = t.width), (e.height = t.height));
  const n = e.getContext("2d");
  ((n.fillStyle = "#07070d"),
    n.fillRect(0, 0, t.width, t.height),
    n.drawImage(D, 0, 0));
  const r = document.createElement("a");
  ((r.download = `air-draw-${Date.now()}.png`),
    (r.href = e.toDataURL("image/png")),
    r.click(),
    m(800, 0.1, "sine", 0.04));
});
re.addEventListener("click", () => {
  (W.classList.add("hidden"),
    (t.isModalOpen = !1),
    m(800, 0.1, "sine", 0.04),
    N("idle"));
});
async function Ee() {
  $();
  try {
    const [e] = await Promise.all([ue(), he()]);
    t.isReady = !0;
    const n = document.querySelector(".loader-bar-fill");
    ((n.style.animation = "none"),
      (n.style.width = "100%"),
      (n.style.transition = "width 0.4s ease"),
      setTimeout(() => {
        (A.classList.add("fade-out"),
          Y.classList.remove("hidden"),
          W.classList.remove("hidden"));
      }, 600),
      setTimeout(() => {
        A.style.display = "none";
      }, 1200),
      E());
  } catch (e) {
    (console.error("Failed to initialize Air Draw:", e),
      (document.querySelector(".loader-subtitle").textContent =
        "Error: Camera access required. Please allow camera permissions and reload."),
      (document.querySelector(".loader-subtitle").style.color = "#ff2d6b"),
      (document.querySelector(".loader-bar").style.display = "none"));
  }
}
Ee();
