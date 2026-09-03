"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Panel de diagnóstico del viewport. TEMPORAL: se borra cuando el fallo de la
 * restauración de pestaña en Chrome de iPhone esté cerrado.
 *
 * Solo mide. No corrige nada, no escribe ni un estilo fuera de sus propios
 * nodos y no mueve el documento: nada de `scrollTo`, `focus`, `blur` ni
 * `preventDefault`. Todo lo que añade al DOM es `position: fixed`, así que
 * queda fuera del flujo y no suma a `scrollHeight`.
 *
 * Se enciende con `?viewportDebug=1` y se apaga con `?viewportDebug=0`. El
 * interruptor queda en `sessionStorage` porque las navegaciones internas
 * pierden el parámetro, y el histórico también, para que sobreviva a una carga
 * de documento nueva dentro de la misma pestaña: sin eso no habría forma de
 * comparar el estado sano con el roto.
 *
 * `DOC_ID` se genera al evaluar el módulo, así que es distinto en cada
 * documento. Si al volver por el enlace cambia, Chrome hizo una carga nueva; si
 * es el mismo, reutilizó el documento que ya tenía.
 */

const STORAGE_KEY = "bintuitive-viewport-debug";
const FLAG_KEY = "bintuitive-viewport-debug-on";
const MAX_SNAPSHOTS = 80;
const DOC_ID = Math.random().toString(36).slice(2, 7);

type Box = {
  t: number;
  b: number;
  l: number;
  r: number;
  w: number;
  h: number;
} | null;

type Snapshot = {
  n: number;
  clock: string;
  event: string;
  doc: string;
  navType: string;
  persisted: boolean | null;
  visibility: string;
  innerH: number;
  innerW: number;
  cliH: number;
  vvH: number | null;
  vvTop: number | null;
  vvScale: number | null;
  scrollY: number;
  scrH: number;
  scrCliH: number;
  bodyScrH: number;
  svh: number | null;
  vh: number | null;
  dvh: number | null;
  safeT: number | null;
  safeB: number | null;
  shellMinH: string;
  contentMinH: string;
  navPos: string;
  shell: Box;
  header: Box;
  content: Box;
  nav: Box;
};

type Probe = {
  root: HTMLDivElement;
  svh: HTMLDivElement;
  vh: HTMLDivElement;
  dvh: HTMLDivElement;
  safe: HTMLDivElement;
};

const round = (value: number) => Math.round(value * 10) / 10;

function box(el: Element | null): Box {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    t: round(r.top),
    b: round(r.bottom),
    l: round(r.left),
    r: round(r.right),
    w: round(r.width),
    h: round(r.height),
  };
}

function px(
  el: HTMLElement | undefined,
  property: "height" | "paddingTop" | "paddingBottom",
) {
  if (!el) return null;
  const value = parseFloat(getComputedStyle(el)[property]);
  return Number.isFinite(value) ? round(value) : null;
}

/**
 * Sonda oculta: convierte a píxeles las longitudes que no se pueden leer de
 * ninguna otra forma. `position: fixed` con tamaño cero y `overflow: hidden`,
 * así que no entra en el flujo, no suma a `scrollHeight` y no puede recibir un
 * toque. Los hijos siguen resolviendo su alto contra el viewport aunque estén
 * recortados y no se pinten: `visibility` no afecta a la disposición.
 */
function createProbe(): Probe {
  const root = document.createElement("div");
  root.setAttribute("data-viewport-probe", "");
  root.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;";

  const child = (css: string) => {
    const el = document.createElement("div");
    el.style.cssText = "width:0;" + css;
    root.appendChild(el);
    return el;
  };

  const probe: Probe = {
    root,
    svh: child("height:100svh;"),
    vh: child("height:100vh;"),
    dvh: child("height:100dvh;"),
    safe: child(
      "height:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);",
    ),
  };

  document.body.appendChild(root);
  return probe;
}

function readNavType() {
  const entry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return entry?.type ?? "?";
}

export default function ViewportDebug() {
  const [enabled, setEnabled] = useState(false);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [atTop, setAtTop] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const probeRef = useRef<Probe | null>(null);
  const counterRef = useRef(0);
  const lastRef = useRef("");
  // Lo rellena el efecto; el botón "medir" reutiliza la misma vía que los
  // eventos en vez de duplicar la lógica de guardado.
  const captureRef = useRef<((event: string) => void) | null>(null);

  // Interruptor: parámetro de la URL, con memoria en la sesión.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("viewportDebug");
    let on = false;
    try {
      if (param === "1") {
        sessionStorage.setItem(FLAG_KEY, "1");
        on = true;
      } else if (param === "0") {
        sessionStorage.removeItem(FLAG_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        on = sessionStorage.getItem(FLAG_KEY) === "1";
      }
    } catch {
      // Navegación privada sin almacenamiento: el parámetro sigue valiendo.
      on = param === "1";
    }
    setEnabled(on);
  }, []);

  const measure = useCallback(
    (event: string, persisted: boolean | null): Snapshot => {
      const probe = probeRef.current;
      const scroller = document.scrollingElement ?? document.documentElement;
      const shell = document.querySelector(".app-shell");
      const content = document.querySelector(".app-shell-content");
      const header = document.querySelector(".app-header");
      const nav = document.querySelector(".bottom-navigation");
      const vv = window.visualViewport ?? null;

      counterRef.current += 1;

      return {
        n: counterRef.current,
        clock: new Date().toTimeString().slice(0, 8),
        event,
        doc: DOC_ID,
        navType: readNavType(),
        persisted,
        visibility: document.visibilityState,
        innerH: round(window.innerHeight),
        innerW: round(window.innerWidth),
        cliH: round(document.documentElement.clientHeight),
        vvH: vv ? round(vv.height) : null,
        vvTop: vv ? round(vv.offsetTop) : null,
        vvScale: vv ? round(vv.scale) : null,
        scrollY: round(window.scrollY),
        scrH: round(scroller.scrollHeight),
        scrCliH: round(scroller.clientHeight),
        bodyScrH: round(document.body.scrollHeight),
        svh: px(probe?.svh, "height"),
        vh: px(probe?.vh, "height"),
        dvh: px(probe?.dvh, "height"),
        safeT: px(probe?.safe, "paddingTop"),
        safeB: px(probe?.safe, "paddingBottom"),
        shellMinH: shell ? getComputedStyle(shell).minHeight : "—",
        contentMinH: content ? getComputedStyle(content).minHeight : "—",
        navPos: nav ? getComputedStyle(nav).position : "—",
        shell: box(shell),
        header: box(header),
        content: box(content),
        nav: box(nav),
      };
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;

    probeRef.current = createProbe();

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Snapshot[];
        setHistory(parsed);
        counterRef.current = parsed.length ? parsed[parsed.length - 1].n : 0;
      }
    } catch {
      // Histórico ilegible: se empieza de cero.
    }

    const frames = new Set<number>();
    const timeouts = new Set<number>();

    const capture = (
      event: string,
      persisted: boolean | null = null,
      dedupe = false,
    ) => {
      const snapshot = measure(event, persisted);

      // Los eventos de redimensionado llegan en ráfaga; si los números son
      // idénticos, una línea más no aporta nada.
      const signature = [
        snapshot.event,
        snapshot.innerH,
        snapshot.cliH,
        snapshot.vvH,
        snapshot.svh,
        snapshot.dvh,
        snapshot.scrH,
        snapshot.nav?.b,
      ].join("|");

      if (dedupe && signature === lastRef.current) {
        counterRef.current -= 1;
        return;
      }
      lastRef.current = signature;

      setHistory((current) => [...current, snapshot].slice(-MAX_SNAPSHOTS));
    };

    captureRef.current = (event: string) => capture(event);

    /**
     * Una sola medida no basta al reanudar: el navegador sigue colocando cosas
     * durante los primeros fotogramas. La ráfaga enseña si el estado roto ya
     * está ahí desde el primer instante o si aparece —o se arregla— después.
     */
    const burst = (event: string, persisted: boolean | null = null) => {
      capture(event, persisted);
      frames.add(
        requestAnimationFrame(() => capture(event + "+raf", persisted)),
      );
      for (const delay of [120, 600, 1500]) {
        timeouts.add(
          window.setTimeout(
            () => capture(event + "+" + delay + "ms", persisted),
            delay,
          ),
        );
      }
    };

    burst("mount");

    const onLoad = () => burst("load");
    const onPageShow = (e: PageTransitionEvent) => burst("pageshow", e.persisted);
    const onPageHide = (e: PageTransitionEvent) => capture("pagehide", e.persisted);
    const onVisibility = () => {
      if (document.visibilityState === "visible") burst("visible");
      else capture("hidden");
    };
    const onResize = () => capture("resize", null, true);
    const onOrientation = () => burst("orientationchange");
    // Volver desde otra aplicación dispara `focus`. Si `visibilitychange` no
    // llegara —una de las preguntas abiertas—, esta es la otra oportunidad de
    // pillar el instante de la reanudación.
    const onFocus = () => capture("focus");
    const onVvResize = () => capture("vv:resize", null, true);
    const onVvScroll = () => capture("vv:scroll", null, true);

    window.addEventListener("load", onLoad);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.visualViewport?.addEventListener("resize", onVvResize);
    window.visualViewport?.addEventListener("scroll", onVvScroll);

    return () => {
      for (const id of frames) cancelAnimationFrame(id);
      for (const id of timeouts) clearTimeout(id);
      captureRef.current = null;
      window.removeEventListener("load", onLoad);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.visualViewport?.removeEventListener("resize", onVvResize);
      window.visualViewport?.removeEventListener("scroll", onVvScroll);
      probeRef.current?.root.remove();
      probeRef.current = null;
    };
  }, [enabled, measure]);

  // Guardar va aparte de medir: así el guardado no es un efecto colateral
  // dentro de un actualizador de estado.
  useEffect(() => {
    if (!enabled || history.length === 0) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Sin almacenamiento el histórico vive solo en memoria.
    }
  }, [enabled, history]);

  const clear = useCallback(() => {
    counterRef.current = 0;
    lastRef.current = "";
    setHistory([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nada que limpiar.
    }
  }, []);

  const copy = useCallback(() => {
    const text = JSON.stringify(history, null, 2);
    navigator.clipboard?.writeText(text).catch(() => setShowJson(true));
  }, [history]);

  if (!enabled) return null;

  const rows = [...history].reverse();
  const latest = history[history.length - 1];

  const buttons: [string, () => void][] = [
    ["medir", () => captureRef.current?.("manual")],
    ["copiar", copy],
    ["json", () => setShowJson((v) => !v)],
    [atTop ? "abajo" : "arriba", () => setAtTop((v) => !v)],
    [collapsed ? "abrir" : "cerrar", () => setCollapsed((v) => !v)],
    ["limpiar", clear],
  ];

  const headers = [
    "#", "hora", "evento", "doc", "navType", "vis", "pers",
    "scrollable", "nav.b-vvH", "cliH-vvH",
    "svh", "vh", "dvh", "safeT", "safeB",
    "innerH", "cliH", "vvH", "vvTop", "scrollY",
    "scrH", "scrCliH", "bodyScrH",
    "shell.t", "shell.h", "hdr.h", "cont.h", "nav.t", "nav.b",
  ];

  const cellsOf = (s: Snapshot) => [
    s.n, s.clock, s.event, s.doc, s.navType, s.visibility,
    s.persisted === null ? "" : String(s.persisted),
    round(s.scrH - s.scrCliH),
    s.vvH === null || !s.nav ? "?" : round(s.nav.b - s.vvH),
    s.vvH === null ? "?" : round(s.cliH - s.vvH),
    s.svh, s.vh, s.dvh, s.safeT, s.safeB,
    s.innerH, s.cliH, s.vvH, s.vvTop, s.scrollY,
    s.scrH, s.scrCliH, s.bodyScrH,
    s.shell?.t, s.shell?.h, s.header?.h, s.content?.h, s.nav?.t, s.nav?.b,
  ];

  return (
    <div
      style={{
        position: "fixed",
        left: 4,
        right: 4,
        top: atTop ? 4 : undefined,
        bottom: atTop ? undefined : 4,
        zIndex: 2147483647,
        maxHeight: collapsed ? undefined : "46vh",
        overflow: "auto",
        background: "rgba(8,8,10,0.93)",
        color: "#e8e8e8",
        font: "10px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace",
        border: "1px solid #555",
        borderRadius: 6,
        padding: 4,
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ color: "#ffc400" }}>viewport · doc {DOC_ID}</strong>
        <span style={{ opacity: 0.7 }}>{history.length} med.</span>
        {buttons.map(([label, action]) => (
          <button
            key={label}
            type="button"
            onClick={action}
            style={{
              font: "inherit",
              padding: "3px 6px",
              background: "#333",
              color: "#eee",
              border: "1px solid #666",
              borderRadius: 4,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {!collapsed && latest && (
        <>
          <div style={{ margin: "4px 0", color: "#ffc400" }}>
            scrollable={round(latest.scrH - latest.scrCliH)}
            {" · nav.b-vvH="}
            {latest.vvH === null || !latest.nav ? "?" : round(latest.nav.b - latest.vvH)}
            {" · cliH-vvH="}
            {latest.vvH === null ? "?" : round(latest.cliH - latest.vvH)}
            <br />
            shell.minH={latest.shellMinH} · cont.minH={latest.contentMinH} · nav.pos=
            {latest.navPos}
            <br />
            svh:{String(CSS.supports("height", "100svh"))} dvh:
            {String(CSS.supports("height", "100dvh"))} · screen.h={window.screen.height}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", whiteSpace: "nowrap" }}>
              <thead>
                <tr style={{ color: "#9fd" }}>
                  {headers.map((h) => (
                    <th
                      key={h}
                      style={{ border: "1px solid #444", padding: "1px 4px", textAlign: "left" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.n}>
                    {cellsOf(s).map((c, i) => (
                      <td key={i} style={{ border: "1px solid #333", padding: "1px 4px" }}>
                        {c === undefined || c === null ? "—" : String(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showJson && (
            <textarea
              readOnly
              value={JSON.stringify(history, null, 2)}
              style={{
                width: "100%",
                height: 120,
                marginTop: 4,
                font: "inherit",
                background: "#111",
                color: "#ddd",
                border: "1px solid #555",
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
