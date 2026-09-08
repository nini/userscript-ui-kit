// Shared floating-panel UI for LinkedIn userscripts (LnPanel).
// Loaded via @require by linkedin_lead_scraper_greasemonkey.js and
// linkedin_lead_outreach.js so every panel shares one theme, position,
// and stacking behavior instead of each script rolling its own DOM/CSS.
(function (global) {
    'use strict';

    if (!document.getElementById('ln-panel-styles')) {
        const s = document.createElement('style');
        s.id = 'ln-panel-styles';
        s.textContent = `
            .ln-panel {
                position: fixed;
                right: 24px;
                z-index: 2147483645;
                width: 320px;
                background: #0f0f0f;
                border: 1px solid #2a2a2a;
                border-radius: 14px;
                box-shadow: 0 12px 48px rgba(0,0,0,0.7);
                font-family: -apple-system, system-ui, sans-serif;
                color: #e8e8e8;
                overflow: hidden;
                transition: bottom 0.2s ease, all 0.25s ease;
            }
            .ln-panel.collapsed { width: auto; border-radius: 30px; }
            .ln-panel-header {
                display: flex; align-items: center; justify-content: space-between;
                gap: 8px;
                padding: 13px 16px; background: #161616;
                border-bottom: 1px solid #222; user-select: none;
            }
            .ln-panel-header .ln-title   { font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap; }
            .ln-panel-header .ln-counter { font-size: 12px; color: #888; font-variant-numeric: tabular-nums; margin-left: auto; }
            .ln-panel-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
            .ln-btn {
                padding: 9px 14px; border: none; border-radius: 8px;
                font-size: 13px; font-weight: 600; cursor: pointer;
                transition: opacity 0.15s, transform 0.1s; letter-spacing: 0.01em;
            }
            .ln-btn:hover  { opacity: 0.85; }
            .ln-btn:active { transform: scale(0.97); }
            .ln-btn:disabled { cursor: not-allowed; opacity: 0.5; }
            .ln-btn:disabled:hover { opacity: 0.5; transform: none; }
            .ln-status { font-size: 11px; color: #555; text-align: center; min-height: 16px; }
            .ln-status.ok   { color: #22c55e; }
            .ln-status.err  { color: #ef4444; }
            .ln-status.info { color: #3b82f6; }
            .ln-collapse-btn {
                background: none; border: none; color: #555;
                font-size: 18px; cursor: pointer; padding: 0 2px; line-height: 1;
            }
            .ln-collapse-btn:hover { color: #aaa; }
            .ln-mini {
                display: none; padding: 14px 18px; cursor: pointer;
                font-size: 18px; align-items: center; justify-content: center;
            }
            .ln-panel.collapsed .ln-panel-body   { display: none; }
            .ln-panel.collapsed .ln-panel-header { border-bottom: none; }
            .ln-panel.collapsed .ln-mini         { display: flex; }
            .ln-progress-bar-wrap { height: 3px; background: #1e1e1e; overflow: hidden; }
            .ln-progress-bar { height: 100%; background: #2563eb; transition: width 0.4s ease; }
        `;
        document.head.appendChild(s);
    }

    // Shared registry so multiple LinkedIn userscript panels on the same
    // page stack above one another instead of overlapping.
    const stack = (global.__lnPanelStack = global.__lnPanelStack || []);
    const GAP = 12;
    const MARGIN = 24;

    function restack() {
        let bottom = MARGIN;
        for (const entry of stack) {
            entry.el.style.bottom = `${bottom}px`;
            bottom += entry.el.offsetHeight + GAP;
        }
    }

    function create({ id, icon = '', title = '', storageKey }) {
        document.getElementById(id)?.remove();
        const existingIdx = stack.findIndex(e => e.id === id);
        if (existingIdx !== -1) stack.splice(existingIdx, 1);

        const collapsedKey = `${storageKey}_Collapsed`;

        const panel = document.createElement('div');
        panel.id = id;
        panel.className = 'ln-panel';
        if (localStorage.getItem(collapsedKey) === '1') panel.classList.add('collapsed');

        panel.innerHTML = `
            <div class="ln-panel-header">
                <span class="ln-title">${icon ? icon + ' ' : ''}${title}</span>
                <span class="ln-counter"></span>
                <button class="ln-collapse-btn" title="Minimise">−</button>
            </div>
            <div class="ln-progress-bar-wrap" style="display:none;"><div class="ln-progress-bar" style="width:0%"></div></div>
            <div class="ln-mini">${icon || '•'}</div>
            <div class="ln-panel-body"></div>
        `;

        document.body.appendChild(panel);

        const counterEl  = panel.querySelector('.ln-counter');
        const bodyEl     = panel.querySelector('.ln-panel-body');
        const progWrapEl = panel.querySelector('.ln-progress-bar-wrap');
        const progBarEl  = panel.querySelector('.ln-progress-bar');
        const miniEl     = panel.querySelector('.ln-mini');

        panel.querySelector('.ln-collapse-btn').onclick = () => {
            panel.classList.add('collapsed');
            localStorage.setItem(collapsedKey, '1');
            restack();
        };
        miniEl.onclick = () => {
            panel.classList.remove('collapsed');
            localStorage.setItem(collapsedKey, '0');
            restack();
        };

        const entry = { id, el: panel };
        stack.push(entry);
        restack();

        const handle = {
            el: panel,
            body: bodyEl,
            setBody(html) { bodyEl.innerHTML = html; restack(); },
            setCounter(text) { counterEl.textContent = text || ''; },
            setStatus(text, cls = '') {
                const el = bodyEl.querySelector('.ln-status') || panel.querySelector('.ln-status');
                if (el) { el.textContent = text; el.className = `ln-status ${cls}`.trim(); }
            },
            setProgress(pct) {
                progWrapEl.style.display = '';
                progBarEl.style.width = `${pct}%`;
            },
            destroy() {
                const idx = stack.findIndex(e => e.id === id);
                if (idx !== -1) stack.splice(idx, 1);
                panel.remove();
                restack();
            },
        };

        return handle;
    }

    global.LnPanel = { create };
})(window);
