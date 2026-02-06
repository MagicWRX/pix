import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { defaultTheme, applyTheme } from './theme.js';

class MeshEditor {
    constructor() {
        this.theme = defaultTheme;
        this.objects = [];
        this.selectedObject = null;
        this.isShiftHeld = false;
        this.isAltHeld = false;
        this.gridSnapEnabled = false;
        this.objectIdCounter = 0;
        this.currentGridPlane = 'xz';
        this.grids = {};
        
        this.init();
    }
    
    init() {
        // Apply theme first
        applyTheme(this.theme);
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.theme.colors.background);
        
        // Camera - top-down view (looking down Y axis)
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.setTopDownView();
        
        // Renderer
        const canvas = document.getElementById('viewport');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.updateRendererSize();
        
        // Orbit controls
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.08;
        this.orbitControls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
        
        // Transform controls
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.transformControls.addEventListener('dragging-changed', (e) => {
            this.orbitControls.enabled = !e.value;
        });
        this.transformControls.addEventListener('change', () => this.updateTransformPanel());
        this.transformControls.addEventListener('objectChange', () => this.updateStatus());
        this.scene.add(this.transformControls);
        
        // Lights
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 5);
        this.scene.add(dirLight);
        
        // Create all grids
        this.createGrids();
        this.setGridPlane(this.theme.viewport.defaultGridPlane);
        
        // Axes
        if (this.theme.viewport.showAxes) {
            this.scene.add(new THREE.AxesHelper(2));
        }
        
        // Raycaster for selection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Event listeners
        this.setupEventListeners();
        
        // Build grid control panel
        this.buildGridPanel();
        
        // Add initial quad
        this.addQuad();
        
        // Start render loop
        this.animate();
    }
    
    createGrids() {
        const size = this.theme.viewport.gridSize;
        const divisions = this.theme.viewport.gridDivisions;
        const color1 = this.theme.colors.grid;
        const color2 = this.theme.colors.gridSub;
        
        // XZ grid (ground plane - default)
        this.grids.xz = new THREE.GridHelper(size, divisions, color1, color2);
        this.grids.xz.visible = false;
        this.scene.add(this.grids.xz);
        
        // XY grid (front plane)
        this.grids.xy = new THREE.GridHelper(size, divisions, color1, color2);
        this.grids.xy.rotation.x = Math.PI / 2;
        this.grids.xy.visible = false;
        this.scene.add(this.grids.xy);
        
        // YZ grid (side plane)
        this.grids.yz = new THREE.GridHelper(size, divisions, color1, color2);
        this.grids.yz.rotation.z = Math.PI / 2;
        this.grids.yz.visible = false;
        this.scene.add(this.grids.yz);
    }
    
    setGridPlane(plane) {
        // Hide all grids
        Object.values(this.grids).forEach(g => g.visible = false);
        
        // Show selected grid
        if (this.grids[plane]) {
            this.grids[plane].visible = true;
            this.currentGridPlane = plane;
        }
        
        this.updateGridPanel();
        this.updateStatus();
    }
    
    buildGridPanel() {
        const container = document.getElementById('panel-content-grid');
        if (!container) return;
        
        container.innerHTML = `
            <div class="grid-controls">
                <label>View Plane:</label>
                <div class="grid-buttons">
                    <button class="grid-btn ${this.currentGridPlane === 'xz' ? 'active' : ''}" data-plane="xz">
                        <span style="color:var(--color-axisX)">X</span><span style="color:var(--color-axisZ)">Z</span> (Ground)
                    </button>
                    <button class="grid-btn ${this.currentGridPlane === 'xy' ? 'active' : ''}" data-plane="xy">
                        <span style="color:var(--color-axisX)">X</span><span style="color:var(--color-axisY)">Y</span> (Front)
                    </button>
                    <button class="grid-btn ${this.currentGridPlane === 'yz' ? 'active' : ''}" data-plane="yz">
                        <span style="color:var(--color-axisY)">Y</span><span style="color:var(--color-axisZ)">Z</span> (Side)
                    </button>
                </div>
                <div class="snap-controls">
                    <label>
                        <input type="checkbox" id="grid-snap-toggle" ${this.gridSnapEnabled ? 'checked' : ''}>
                        Grid Snap (G)
                    </label>
                    <div class="snap-size">
                        <label>Snap Size:</label>
                        <input type="number" id="snap-size-input" value="${this.theme.controls.snapPosition}" min="0.1" max="2" step="0.1">
                    </div>
                </div>
                <div class="hint">
                    <strong>Alt+Drag</strong> = Snap mode<br>
                    <strong>Alt+Shift+Drag</strong> = Fine snap
                </div>
            </div>
        `;
        
        // Grid plane buttons
        container.querySelectorAll('.grid-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setGridPlane(btn.dataset.plane);
            });
        });
        
        // Grid snap toggle
        const snapToggle = container.querySelector('#grid-snap-toggle');
        snapToggle?.addEventListener('change', (e) => {
            this.gridSnapEnabled = e.target.checked;
            this.updateSnapping();
        });
        
        // Snap size input
        const snapSizeInput = container.querySelector('#snap-size-input');
        snapSizeInput?.addEventListener('change', (e) => {
            this.theme.controls.snapPosition = parseFloat(e.target.value);
            this.updateSnapping();
        });
    }
    
    updateGridPanel() {
        const container = document.getElementById('panel-content-grid');
        if (!container) return;
        
        container.querySelectorAll('.grid-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.plane === this.currentGridPlane);
        });
        
        const snapToggle = container.querySelector('#grid-snap-toggle');
        if (snapToggle) snapToggle.checked = this.gridSnapEnabled;
    }
    
    setTopDownView() {
        this.camera.position.set(0, 8, 0);
        this.camera.lookAt(0, 0, 0);
    }
    
    updateRendererSize() {
        const toolbar = document.getElementById('toolbar');
        const sidebar = document.getElementById('sidebar');
        const statusBar = document.getElementById('status-bar');
        
        const width = window.innerWidth - sidebar.offsetWidth;
        const height = window.innerHeight - toolbar.offsetHeight - statusBar.offsetHeight;
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
    
    setupEventListeners() {
        // Resize
        window.addEventListener('resize', () => this.updateRendererSize());
        
        // Keyboard
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse selection
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
        this.renderer.domElement.addEventListener('touchend', (e) => this.onTouch(e));
        
        // Toolbar buttons
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleAction(btn.dataset.action));
        });
    }
    
    updateSnapping() {
        const shouldSnap = this.gridSnapEnabled || this.isAltHeld;
        const fineSnap = this.isShiftHeld && this.isAltHeld;
        
        if (shouldSnap) {
            const snapVal = fineSnap ? this.theme.controls.snapPosition / 4 : this.theme.controls.snapPosition;
            this.transformControls.setTranslationSnap(snapVal);
            this.transformControls.setRotationSnap(THREE.MathUtils.degToRad(this.theme.controls.snapAngle));
        } else if (this.isShiftHeld) {
            // Shift only = axis lock snapping
            this.transformControls.setTranslationSnap(this.theme.controls.snapPosition);
            this.transformControls.setRotationSnap(THREE.MathUtils.degToRad(this.theme.controls.snapAngle));
        } else {
            this.transformControls.setTranslationSnap(null);
            this.transformControls.setRotationSnap(null);
        }
        
        this.updateStatus();
    }
    
    onKeyDown(e) {
        // Shift key
        if (e.key === 'Shift') {
            this.isShiftHeld = true;
            this.updateSnapping();
        }
        
        // Alt key
        if (e.key === 'Alt') {
            e.preventDefault();
            this.isAltHeld = true;
            this.updateSnapping();
        }
        
        // G key - toggle grid snap
        if (e.key === 'g' && !e.ctrlKey) {
            this.gridSnapEnabled = !this.gridSnapEnabled;
            this.updateGridPanel();
            this.updateSnapping();
        }
        
        // Grid plane shortcuts
        if (e.key === '1') this.setGridPlane('xz');
        if (e.key === '2') this.setGridPlane('xy');
        if (e.key === '3') this.setGridPlane('yz');
        
        // Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
            this.deleteSelected();
        }
        
        // Duplicate
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            this.duplicateSelected();
        }
        
        // Save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.save();
        }
        
        // Export
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            this.export();
        }
        
        // Transform modes
        if (e.key === 'r' && !e.ctrlKey) {
            this.transformControls.setMode('rotate');
            this.updateStatus();
        }
        if (e.key === 't') {
            this.transformControls.setMode('translate');
            this.updateStatus();
        }
        if (e.key === 's' && !e.ctrlKey) {
            this.transformControls.setMode('scale');
            this.updateStatus();
        }
    }
    
    onKeyUp(e) {
        if (e.key === 'Shift') {
            this.isShiftHeld = false;
            this.updateSnapping();
        }
        
        if (e.key === 'Alt') {
            this.isAltHeld = false;
            this.updateSnapping();
        }
    }
    
    onClick(e) {
        // Ignore if clicking on transform controls
        if (this.transformControls.dragging) return;
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.performSelection();
    }
    
    onTouch(e) {
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
            this.performSelection();
        }
    }
    
    performSelection() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const meshes = this.objects.map(o => o.mesh);
        const intersects = this.raycaster.intersectObjects(meshes, true);
        
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            // Find the parent object data
            while (obj.parent && !this.objects.find(o => o.mesh === obj)) {
                obj = obj.parent;
            }
            const objData = this.objects.find(o => o.mesh === obj);
            if (objData) {
                this.selectObject(objData);
            }
        } else {
            this.deselectAll();
        }
    }
    
    selectObject(objData) {
        this.deselectAll();
        this.selectedObject = objData;
        
        // Highlight
        if (objData.mesh.material) {
            objData.originalColor = objData.mesh.material.color.getHex();
            objData.mesh.material.emissive = new THREE.Color(this.theme.colors.selection);
            objData.mesh.material.emissiveIntensity = 0.3;
        }
        
        this.transformControls.attach(objData.mesh);
        this.updateObjectList();
        this.updateTransformPanel();
        this.updateStatus();
    }
    
    deselectAll() {
        if (this.selectedObject && this.selectedObject.mesh.material) {
            this.selectedObject.mesh.material.emissiveIntensity = 0;
        }
        this.selectedObject = null;
        this.transformControls.detach();
        this.updateObjectList();
        this.updateTransformPanel();
        this.updateStatus();
    }
    
    handleAction(action) {
        switch (action) {
            case 'save': this.save(); break;
            case 'load': this.load(); break;
            case 'export': this.export(); break;
            case 'duplicate': this.duplicateSelected(); break;
            case 'delete': this.deleteSelected(); break;
            case 'addQuad': this.addQuad(); break;
            case 'addCube': this.addCube(); break;
        }
    }
    
    createObjectMaterial() {
        return new THREE.MeshStandardMaterial({
            color: this.theme.colors.objectDefault,
            side: THREE.DoubleSide,
            roughness: 0.7
        });
    }
    
    addQuad() {
        const geo = new THREE.PlaneGeometry(1, 1);
        const mat = this.createObjectMaterial();
        const mesh = new THREE.Mesh(geo, mat);
        
        // Position on Y axis (flat on XZ plane)
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0;
        
        const objData = {
            id: ++this.objectIdCounter,
            name: `Quad_${this.objectIdCounter}`,
            type: 'quad',
            mesh
        };
        
        this.scene.add(mesh);
        this.objects.push(objData);
        this.selectObject(objData);
        this.updateObjectList();
    }
    
    addCube() {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = this.createObjectMaterial();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.5;
        
        const objData = {
            id: ++this.objectIdCounter,
            name: `Cube_${this.objectIdCounter}`,
            type: 'cube',
            mesh
        };
        
        this.scene.add(mesh);
        this.objects.push(objData);
        this.selectObject(objData);
        this.updateObjectList();
    }
    
    duplicateSelected() {
        if (!this.selectedObject) return;
        
        const orig = this.selectedObject;
        const mesh = orig.mesh.clone();
        mesh.material = this.createObjectMaterial();
        mesh.position.x += 1;
        
        const objData = {
            id: ++this.objectIdCounter,
            name: `${orig.name}_copy`,
            type: orig.type,
            mesh
        };
        
        this.scene.add(mesh);
        this.objects.push(objData);
        this.selectObject(objData);
        this.updateObjectList();
    }
    
    deleteSelected() {
        if (!this.selectedObject) return;
        
        this.scene.remove(this.selectedObject.mesh);
        this.selectedObject.mesh.geometry.dispose();
        this.selectedObject.mesh.material.dispose();
        
        this.objects = this.objects.filter(o => o !== this.selectedObject);
        this.deselectAll();
        this.updateObjectList();
    }
    
    save() {
        const data = {
            version: 1,
            gridPlane: this.currentGridPlane,
            objects: this.objects.map(o => ({
                id: o.id,
                name: o.name,
                type: o.type,
                position: o.mesh.position.toArray(),
                rotation: o.mesh.rotation.toArray().slice(0, 3),
                scale: o.mesh.scale.toArray()
            }))
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    export() {
        // Export as GLB (binary GLTF) - widely supported format
        const exporter = new GLTFExporter();
        
        // Create export scene with only user objects
        const exportScene = new THREE.Scene();
        this.objects.forEach(o => {
            const clone = o.mesh.clone();
            clone.material = clone.material.clone();
            clone.material.emissiveIntensity = 0;
            exportScene.add(clone);
        });
        
        exporter.parse(
            exportScene,
            (result) => {
                const blob = new Blob([result], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = 'scene.glb';
                
                // Trigger download with save dialog
                a.click();
                
                URL.revokeObjectURL(url);
            },
            (error) => {
                console.error('Export failed:', error);
                alert('Export failed: ' + error.message);
            },
            { binary: true }
        );
    }
    
    load() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    this.loadScene(data);
                } catch (err) {
                    console.error('Failed to load:', err);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    
    loadScene(data) {
        // Clear existing
        this.objects.forEach(o => {
            this.scene.remove(o.mesh);
            o.mesh.geometry.dispose();
            o.mesh.material.dispose();
        });
        this.objects = [];
        this.deselectAll();
        
        // Set grid plane
        if (data.gridPlane) {
            this.setGridPlane(data.gridPlane);
        }
        
        // Load objects
        data.objects.forEach(o => {
            let mesh;
            const mat = this.createObjectMaterial();
            
            if (o.type === 'quad') {
                const geo = new THREE.PlaneGeometry(1, 1);
                mesh = new THREE.Mesh(geo, mat);
            } else if (o.type === 'cube') {
                const geo = new THREE.BoxGeometry(1, 1, 1);
                mesh = new THREE.Mesh(geo, mat);
            } else {
                return; // Unknown type
            }
            
            mesh.position.fromArray(o.position);
            mesh.rotation.fromArray([...o.rotation, 'XYZ']);
            mesh.scale.fromArray(o.scale);
            
            const objData = {
                id: o.id,
                name: o.name,
                type: o.type,
                mesh
            };
            
            this.scene.add(mesh);
            this.objects.push(objData);
        });
        
        this.objectIdCounter = Math.max(0, ...this.objects.map(o => o.id));
        this.updateObjectList();
    }
    
    updateObjectList() {
        const container = document.getElementById('panel-content-objects');
        if (!container) return;
        
        container.innerHTML = '';
        this.objects.forEach(o => {
            const item = document.createElement('div');
            item.className = 'object-item' + (o === this.selectedObject ? ' selected' : '');
            item.textContent = o.name;
            item.addEventListener('click', () => this.selectObject(o));
            container.appendChild(item);
        });
    }
    
    updateTransformPanel() {
        const container = document.getElementById('panel-content-transform');
        if (!container) return;
        
        if (!this.selectedObject) {
            container.innerHTML = '<div class="empty">No selection</div>';
            return;
        }
        
        const m = this.selectedObject.mesh;
        const pos = m.position;
        const rot = m.rotation;
        const scale = m.scale;
        
        container.innerHTML = `
            <div class="transform-group">
                <label>Position</label>
                <div class="transform-row">
                    <span class="axis-label" style="color:var(--color-axisX)">X</span>
                    <input type="number" step="0.1" value="${pos.x.toFixed(2)}" data-prop="position.x">
                    <span class="axis-label" style="color:var(--color-axisY)">Y</span>
                    <input type="number" step="0.1" value="${pos.y.toFixed(2)}" data-prop="position.y">
                    <span class="axis-label" style="color:var(--color-axisZ)">Z</span>
                    <input type="number" step="0.1" value="${pos.z.toFixed(2)}" data-prop="position.z">
                </div>
            </div>
            <div class="transform-group">
                <label>Rotation (°)</label>
                <div class="transform-row">
                    <span class="axis-label" style="color:var(--color-axisX)">X</span>
                    <input type="number" step="5" value="${THREE.MathUtils.radToDeg(rot.x).toFixed(0)}" data-prop="rotation.x">
                    <span class="axis-label" style="color:var(--color-axisY)">Y</span>
                    <input type="number" step="5" value="${THREE.MathUtils.radToDeg(rot.y).toFixed(0)}" data-prop="rotation.y">
                    <span class="axis-label" style="color:var(--color-axisZ)">Z</span>
                    <input type="number" step="5" value="${THREE.MathUtils.radToDeg(rot.z).toFixed(0)}" data-prop="rotation.z">
                </div>
            </div>
            <div class="transform-group">
                <label>Scale</label>
                <div class="transform-row">
                    <span class="axis-label" style="color:var(--color-axisX)">X</span>
                    <input type="number" step="0.1" value="${scale.x.toFixed(2)}" data-prop="scale.x">
                    <span class="axis-label" style="color:var(--color-axisY)">Y</span>
                    <input type="number" step="0.1" value="${scale.y.toFixed(2)}" data-prop="scale.y">
                    <span class="axis-label" style="color:var(--color-axisZ)">Z</span>
                    <input type="number" step="0.1" value="${scale.z.toFixed(2)}" data-prop="scale.z">
                </div>
            </div>
        `;
        
        // Input handlers
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const [prop, axis] = e.target.dataset.prop.split('.');
                let val = parseFloat(e.target.value);
                
                if (prop === 'rotation') {
                    val = THREE.MathUtils.degToRad(val);
                }
                
                this.selectedObject.mesh[prop][axis] = val;
            });
        });
    }
    
    updateStatus() {
        const mode = document.getElementById('status-mode');
        const selection = document.getElementById('status-selection');
        const position = document.getElementById('status-position');
        const snap = document.getElementById('status-snap');
        const grid = document.getElementById('status-grid');
        
        if (mode) mode.textContent = `Mode: ${this.transformControls.mode}`;
        if (selection) selection.textContent = this.selectedObject ? `Selected: ${this.selectedObject.name}` : 'No selection';
        if (position && this.selectedObject) {
            const p = this.selectedObject.mesh.position;
            position.textContent = `Pos: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}`;
        } else if (position) {
            position.textContent = '';
        }
        
        // Snap status
        let snapText = '';
        if (this.gridSnapEnabled) snapText = '🔒 Grid Snap';
        else if (this.isAltHeld && this.isShiftHeld) snapText = '🔒 Fine Snap';
        else if (this.isAltHeld) snapText = '🔒 Alt Snap';
        else if (this.isShiftHeld) snapText = '🔒 Axis Snap';
        if (snap) snap.textContent = snapText;
        
        // Grid status
        const planeLabels = { xz: 'XZ (Ground)', xy: 'XY (Front)', yz: 'YZ (Side)' };
        if (grid) grid.textContent = `Grid: ${planeLabels[this.currentGridPlane]}`;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.orbitControls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    window.editor = new MeshEditor();
});
