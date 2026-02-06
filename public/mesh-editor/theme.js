// Theme system - controls all UI/UX
export const defaultTheme = {
    name: 'dark',
    
    // Colors
    colors: {
        background: '#1a1a2e',
        surface: '#16213e',
        surfaceHover: '#1f3460',
        primary: '#0f3460',
        accent: '#e94560',
        text: '#eaeaea',
        textMuted: '#888888',
        grid: '#333355',
        gridSub: '#222244',
        selection: '#00ff88',
        axisX: '#ff4444',
        axisY: '#44ff44',
        axisZ: '#4444ff',
        objectDefault: '#00ff88',
        objectWireframe: '#00ffff'
    },
    
    // Layout
    layout: {
        toolbarPosition: 'top',
        toolbarHeight: '48px',
        sidebarPosition: 'right',
        sidebarWidth: '260px',
        statusBarHeight: '28px',
        borderRadius: '6px',
        spacing: '8px'
    },
    
    // Toolbar buttons
    toolbar: {
        buttons: [
            { id: 'save', icon: '💾', label: 'Save', action: 'save' },
            { id: 'load', icon: '📂', label: 'Load', action: 'load' },
            { id: 'export', icon: '📤', label: 'Export', action: 'export' },
            { id: 'sep1', type: 'separator' },
            { id: 'duplicate', icon: '📋', label: 'Duplicate', action: 'duplicate' },
            { id: 'delete', icon: '🗑️', label: 'Delete', action: 'delete' },
            { id: 'sep2', type: 'separator' },
            { id: 'addQuad', icon: '⬜', label: 'Add Quad', action: 'addQuad' },
            { id: 'addCube', icon: '📦', label: 'Add Cube', action: 'addCube' }
        ]
    },
    
    // Sidebar panels
    sidebar: {
        panels: [
            {
                id: 'grid',
                title: 'Grid',
                type: 'gridControl'
            },
            {
                id: 'objects',
                title: 'Objects',
                type: 'objectList'
            },
            {
                id: 'transform',
                title: 'Transform',
                type: 'transform',
                fields: ['position', 'rotation', 'scale']
            }
        ]
    },
    
    // Viewport settings
    viewport: {
        defaultView: 'top',  // top-down
        showGrid: true,
        showAxes: true,
        gridSize: 10,
        gridDivisions: 20,
        defaultGridPlane: 'xz'  // xz (ground), xy (front), yz (side)
    },
    
    // Controls
    controls: {
        snapKey: 'Shift',
        altDragSnap: true,
        snapAngle: 15,  // degrees
        snapPosition: 0.5,  // grid snap
        gridSnapKey: 'g'
    },
    
    // Status bar
    statusBar: {
        show: true,
        items: ['mode', 'selection', 'position', 'snap', 'grid']
    }
};

// Apply theme to DOM
export function applyTheme(theme) {
    const root = document.documentElement;
    const { colors, layout } = theme;
    
    // CSS variables for colors
    Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
    });
    
    // CSS variables for layout
    Object.entries(layout).forEach(([key, value]) => {
        root.style.setProperty(`--layout-${key}`, value);
    });
    
    // Build toolbar
    buildToolbar(theme);
    
    // Build sidebar
    buildSidebar(theme);
    
    // Build status bar
    buildStatusBar(theme);
}

function buildToolbar(theme) {
    const toolbar = document.getElementById('toolbar');
    toolbar.innerHTML = '';
    toolbar.className = `toolbar toolbar-${theme.layout.toolbarPosition}`;
    
    theme.toolbar.buttons.forEach(btn => {
        if (btn.type === 'separator') {
            const sep = document.createElement('div');
            sep.className = 'toolbar-separator';
            toolbar.appendChild(sep);
        } else {
            const button = document.createElement('button');
            button.className = 'toolbar-btn';
            button.id = `btn-${btn.id}`;
            button.dataset.action = btn.action;
            button.title = btn.label;
            button.innerHTML = `<span class="icon">${btn.icon}</span><span class="label">${btn.label}</span>`;
            toolbar.appendChild(button);
        }
    });
}

function buildSidebar(theme) {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '';
    sidebar.className = `sidebar sidebar-${theme.layout.sidebarPosition}`;
    
    theme.sidebar.panels.forEach(panel => {
        const panelEl = document.createElement('div');
        panelEl.className = 'panel';
        panelEl.id = `panel-${panel.id}`;
        
        const header = document.createElement('div');
        header.className = 'panel-header';
        header.textContent = panel.title;
        panelEl.appendChild(header);
        
        const content = document.createElement('div');
        content.className = 'panel-content';
        content.id = `panel-content-${panel.id}`;
        panelEl.appendChild(content);
        
        sidebar.appendChild(panelEl);
    });
}

function buildStatusBar(theme) {
    const statusBar = document.getElementById('status-bar');
    statusBar.innerHTML = '';
    
    if (!theme.statusBar.show) {
        statusBar.style.display = 'none';
        return;
    }
    
    theme.statusBar.items.forEach(item => {
        const span = document.createElement('span');
        span.className = 'status-item';
        span.id = `status-${item}`;
        statusBar.appendChild(span);
    });
}

// Theme customization helper
export function mergeTheme(base, overrides) {
    return JSON.parse(JSON.stringify({
        ...base,
        ...overrides,
        colors: { ...base.colors, ...overrides.colors },
        layout: { ...base.layout, ...overrides.layout },
        toolbar: { ...base.toolbar, ...overrides.toolbar },
        sidebar: { ...base.sidebar, ...overrides.sidebar },
        viewport: { ...base.viewport, ...overrides.viewport },
        controls: { ...base.controls, ...overrides.controls },
        statusBar: { ...base.statusBar, ...overrides.statusBar }
    }));
}
