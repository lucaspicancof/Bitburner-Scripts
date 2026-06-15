/**
 * Toolkit de UI para dashboards: janela flutuante arrastável, minimizável, com
 * barra de abas clicável, área de conteúdo e gerador de sparklines. CSS injetado 1x.
 *
 * A "casca" (header + abas) é construída UMA vez e os listeners ficam presos a ela;
 * só o corpo (.body) é re-renderizado a cada tick, preservando a interatividade.
 */

const DOC = eval("document");
const STYLE_ID = "bb-dash-style";

const CSS = `
.bb-dash {
    position: fixed; top: 80px; right: 24px;
    width: 580px; max-height: 80vh;
    background: #0b0e14; color: #c9d1d9;
    border: 1px solid #1f2430; border-radius: 10px;
    box-shadow: 0 12px 40px rgba(0,0,0,.55);
    font-family: "JetBrains Mono", Consolas, monospace; font-size: 12px;
    z-index: 1500; display: flex; flex-direction: column; overflow: hidden;
}
.bb-dash-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 12px; cursor: move;
    background: linear-gradient(90deg, #11161f, #0d1119);
    border-bottom: 1px solid #1f2430;
}
.bb-dash-title { font-weight: 600; letter-spacing: .5px; color: #58a6ff; }
.bb-dash-ctrls { display: flex; gap: 10px; }
.bb-dash-btn { cursor: pointer; color: #6e7681; padding: 0 2px; user-select: none; }
.bb-dash-btn:hover { color: #c9d1d9; }
.bb-dash-close:hover { color: #f85149; }
.bb-dash-tabs { display: flex; gap: 2px; padding: 6px 8px 0; background: #0d1119; flex-wrap: wrap; }
.bb-dash-tab {
    background: transparent; color: #8b949e; border: none;
    padding: 6px 12px; cursor: pointer; font-family: inherit; font-size: 12px;
    border-radius: 6px 6px 0 0; border-bottom: 2px solid transparent;
}
.bb-dash-tab:hover { color: #c9d1d9; background: #131a24; }
.bb-dash-tab.active { color: #58a6ff; border-bottom-color: #58a6ff; background: #0b0e14; }
.bb-dash-body { padding: 14px 16px; overflow-y: auto; }
.bb-dash-body::-webkit-scrollbar { width: 8px; }
.bb-dash-body::-webkit-scrollbar-thumb { background: #1f2430; border-radius: 4px; }
.bb-dash.collapsed .bb-dash-tabs, .bb-dash.collapsed .bb-dash-body { display: none; }

.bb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
.bb-stat { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #161b22; }
.bb-stat .k { color: #8b949e; }
.bb-stat .v { color: #e6edf3; font-weight: 600; }
.bb-section { margin: 4px 0 10px; color: #58a6ff; font-weight: 600; letter-spacing: .4px; }
.bb-table { width: 100%; border-collapse: collapse; }
.bb-table th { text-align: left; color: #6e7681; font-weight: 500; padding: 3px 6px; border-bottom: 1px solid #1f2430; }
.bb-table td { padding: 3px 6px; border-bottom: 1px solid #11161f; }
.bb-bar { height: 6px; background: #161b22; border-radius: 3px; overflow: hidden; }
.bb-bar > i { display: block; height: 100%; background: linear-gradient(90deg,#3fb950,#58a6ff); }
.bb-good { color: #3fb950; } .bb-warn { color: #d29922; } .bb-bad { color: #f85149; }
.bb-muted { color: #6e7681; }
.bb-spark { display: block; }
.bb-card { background: #0d1119; border: 1px solid #161b22; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
.bb-card .lbl { color: #8b949e; font-size: 11px; }
.bb-card .big { color: #e6edf3; font-size: 16px; font-weight: 600; }
`;

function injectCSS() {
    if (DOC.getElementById(STYLE_ID)) return;
    const s = DOC.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    DOC.head.appendChild(s);
}

function makeDraggable(win, handle) {
    let dx = 0, dy = 0, dragging = false;
    handle.addEventListener("mousedown", e => {
        if (e.target.classList.contains("bb-dash-btn")) return; // não arrasta ao clicar nos botões
        dragging = true;
        const r = win.getBoundingClientRect();
        dx = e.clientX - r.left; dy = e.clientY - r.top;
        win.style.right = "auto";
        e.preventDefault();
    });
    DOC.addEventListener("mousemove", e => {
        if (!dragging) return;
        win.style.left = `${e.clientX - dx}px`;
        win.style.top = `${e.clientY - dy}px`;
    });
    DOC.addEventListener("mouseup", () => { dragging = false; });
}

/**
 * Cria a janela do dashboard.
 * @param {{id:string, title:string, tabs:{id:string,label:string}[]}} cfg
 */
export function createDashboard(cfg) {
    injectCSS();

    const existing = DOC.getElementById(cfg.id);
    if (existing) existing.remove();

    const win = DOC.createElement("div");
    win.id = cfg.id;
    win.className = "bb-dash";
    win.innerHTML = `
        <div class="bb-dash-header">
            <span class="bb-dash-title">${cfg.title}</span>
            <span class="bb-dash-ctrls">
                <span class="bb-dash-btn bb-dash-min" title="minimizar">—</span>
                <span class="bb-dash-btn bb-dash-close" title="fechar">✕</span>
            </span>
        </div>
        <div class="bb-dash-tabs"></div>
        <div class="bb-dash-body"></div>
    `;
    DOC.body.appendChild(win);

    const tabBar = win.querySelector(".bb-dash-tabs");
    const body = win.querySelector(".bb-dash-body");
    const buttons = {};
    let active = cfg.tabs[0].id;
    let closed = false;

    function setActive(id) {
        active = id;
        for (const [tid, b] of Object.entries(buttons)) {
            b.classList.toggle("active", tid === id);
        }
    }

    for (const t of cfg.tabs) {
        const b = DOC.createElement("button");
        b.className = "bb-dash-tab";
        b.textContent = t.label;
        b.addEventListener("click", () => setActive(t.id));
        tabBar.appendChild(b);
        buttons[t.id] = b;
    }
    setActive(active);

    makeDraggable(win, win.querySelector(".bb-dash-header"));
    win.querySelector(".bb-dash-min").addEventListener("click", () => win.classList.toggle("collapsed"));
    win.querySelector(".bb-dash-close").addEventListener("click", () => { closed = true; win.remove(); });

    return {
        getActive: () => active,
        setActive,
        isCollapsed: () => win.classList.contains("collapsed"),
        setBody: html => { if (body && DOC.body.contains(win)) body.innerHTML = html; },
        isClosed: () => closed,
        reattach: () => { if (!closed && !DOC.body.contains(win)) DOC.body.appendChild(win); },
        destroy: () => { closed = true; win.remove(); }
    };
}

/**
 * Gera um sparkline (mini-gráfico de linha) como SVG inline.
 * @param {number[]} values
 * @param {{width?:number,height?:number,color?:string,fill?:string}} [opts]
 */
export function sparkline(values, opts = {}) {
    const w = opts.width ?? 150, h = opts.height ?? 32;
    const color = opts.color ?? "#58a6ff";
    const fill = opts.fill ?? "rgba(88,166,255,.12)";

    if (!values || values.length < 2) {
        return `<svg width="${w}" height="${h}" class="bb-spark"></svg>`;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;
    const xs = i => (i / (values.length - 1)) * w;
    const ys = v => h - ((v - min) / range) * (h - 3) - 2;

    const line = values.map((v, i) => `${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join(" ");
    const area = `0,${h} ${line} ${w},${h}`;

    return `<svg width="${w}" height="${h}" class="bb-spark">
        <polyline points="${area}" fill="${fill}" stroke="none"/>
        <polyline points="${line}" fill="none" stroke="${color}" stroke-width="1.5"/>
    </svg>`;
}
