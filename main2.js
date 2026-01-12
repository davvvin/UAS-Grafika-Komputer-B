import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";


let MODE = "day";
const colors = { dayBg: 0x0a2a3a, nightBg: 0x04111f };

const scene = new THREE.Scene();
scene.background = new THREE.Color(colors.dayBg);
scene.fog = new THREE.FogExp2(colors.dayBg, 0.015); // Sedikit dikurangi agar bisa melihat permukaan dari bawah

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(0, 20, 0);
scene.add(camera);

// --- WIKI DATA ---
const animalWiki = {
    whale: {
        title: "Paus Biru (Whale)",
        desc: "Hewan terbesar di planet ini. Mereka berkomunikasi melalui nyanyian bawah air yang sangat keras dan bermigrasi ribuan mil setiap tahunnya.",
        fact: "Jantung seekor paus biru seukuran mobil kecil!"
    },
    manta: {
        title: "Manta Ray (Ikan Pari Manta)",
        desc: "Ikan pari raksasa yang lembut. Mereka tidak memiliki sengat beracun dan memakan plankton sambil 'terbang' di dalam air.",
        fact: "Manta Ray memiliki rasio otak-ke-tubuh terbesar di antara semua ikan di dunia!"
    }
};

// --- UI ELEMENTS ---
const wikiPopup = document.createElement("div");
wikiPopup.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    width: 300px; padding: 20px; background: rgba(0, 20, 40, 0.85);
    color: #eaf7ff; border: 1px solid #00aaff; border-radius: 12px;
    font-family: system-ui, Arial; backdrop-filter: blur(10px);
    display: none; z-index: 100; pointer-events: none;
`;
document.body.appendChild(wikiPopup);

const crosshair = document.createElement("div");
crosshair.style.cssText = `
    position: fixed; top: 50%; left: 50%; width: 24px; height: 24px;
    transform: translate(-50%, -50%);
    background-image: url('./textures/crosshair.png'); 
    background-size: contain; background-repeat: no-repeat;
    background-color: rgba(255, 255, 255, 0.5); 
    border-radius: 50%; border: 2px solid rgba(0, 170, 255, 0.8);
    pointer-events: none; display: none; z-index: 100;
`;
document.body.appendChild(crosshair);

const overlay = document.createElement("div");
overlay.style.cssText = `
  position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
  background:rgba(0,0,0,.35); color:#d7f2ff; font-family:system-ui,Arial;
  text-align:center; padding:24px; cursor:pointer; user-select:none;
`;
overlay.innerHTML = `
  <div style="max-width:760px">
    <div style="font-size:28px; font-weight:800; letter-spacing:.3px">Underwater World</div>
    <div style="margin-top:10px; font-size:14px; opacity:.95; line-height:1.6">
      Klik untuk mulai (Pointer Lock)<br/>
      WASD = gerak, Space = naik, Shift = turun, Esc = keluar<br/>
      Klik hewan untuk info
    </div>
  </div>
`;
document.body.appendChild(overlay);

const btn = document.createElement("button");
btn.textContent = "Mode: Day";
btn.style.cssText = `
  position:fixed; top:16px; right:16px; z-index:10;
  padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,.18);
  background:rgba(0,0,0,.35); color:#eaf7ff; font-family:system-ui,Arial;
  cursor:pointer; backdrop-filter: blur(6px);
`;
document.body.appendChild(btn);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);
overlay.addEventListener("click", () => controls.lock());
controls.addEventListener("lock", () => { overlay.style.display = "none"; crosshair.style.display = "block"; });
controls.addEventListener("unlock", () => { overlay.style.display = "flex"; crosshair.style.display = "none"; wikiPopup.style.display = "none"; });

// --- INTERACTION LOGIC ---
const raycaster = new THREE.Raycaster();
window.addEventListener("click", () => {
    if (!controls.isLocked) return;
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    if (whaleRig) {
        const intersectsWhale = raycaster.intersectObject(whaleRig, true);
        if (intersectsWhale.length > 0) { showWiki("whale"); return; }
    }
    if (mantaRig) {
        const intersectsManta = raycaster.intersectObject(mantaRig, true);
        if (intersectsManta.length > 0) { showWiki("manta"); return; }
    }
    wikiPopup.style.display = "none"; 
});

function showWiki(id) {
    const data = animalWiki[id];
    wikiPopup.innerHTML = `
        <h3 style="margin:0 0 8px; color:#00d2ff">${data.title}</h3>
        <p style="font-size:14px; line-height:1.5; margin-bottom:10px">${data.desc}</p>
        <div style="font-size:12px; opacity:0.8; font-style:italic">Fakta: ${data.fact}</div>
    `;
    wikiPopup.style.display = "block";
    setTimeout(() => { wikiPopup.style.display = "none"; }, 5000);
}

// --- LIGHTING ---
const ambient = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambient);
const hemi = new THREE.HemisphereLight(0x88ddff, 0x001018, 0.55);
hemi.position.set(0, 120, 0);
scene.add(hemi);
const topLight = new THREE.DirectionalLight(0xffffff, 1.1);
topLight.position.set(30, 140, 10);
scene.add(topLight);

function applyLighting(mode) {
    MODE = mode;
    if (mode === "day") {
        btn.textContent = "Mode: Day";
        scene.background.setHex(colors.dayBg);
        scene.fog.color.setHex(colors.dayBg);
        scene.fog.density = 0.015;
        topLight.intensity = 1.25; ambient.intensity = 0.28;
    } else {
        btn.textContent = "Mode: Night";
        scene.background.setHex(colors.nightBg);
        scene.fog.color.setHex(colors.nightBg);
        scene.fog.density = 0.024;
        topLight.intensity = 0.45; ambient.intensity = 0.14;
    }
}
btn.addEventListener("click", () => applyLighting(MODE === "day" ? "night" : "day"));
applyLighting("day");

const WORLD_RADIUS = 250;
const MAX_Y_SURFACE = 100.0; // Tinggi permukaan air

// --- TEXTURES ---
const texLoader = new THREE.TextureLoader();
const seafloorTex = texLoader.load("./models/tex.jpg");
seafloorTex.colorSpace = THREE.SRGBColorSpace;
seafloorTex.wrapS = seafloorTex.wrapT = THREE.RepeatWrapping;

// --- SEAFLOOR (TERRAIN GENERATION) ---
// [BARU] Fungsi ketinggian untuk membuat lantai bergelombang
function getSeafloorHeight(x, z) {
    // Kombinasi gelombang besar dan kecil untuk variasi terrain
    return Math.sin(x * 0.02) * 8 + Math.cos(z * 0.02) * 8 
         + Math.sin(x * 0.05 + z * 0.05) * 3;
}

const seafloorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0, metalness: 0.0, map: seafloorTex });
// [BARU] Menambah segmen menjadi 128x128 agar terrain terlihat halus
const seafloorGeo = new THREE.PlaneGeometry(1000, 1000, 128, 128);

// [BARU] Modifikasi vertices lantai secara manual
const posAttribute = seafloorGeo.attributes.position;
for (let i = 0; i < posAttribute.count; i++) {
    const x = posAttribute.getX(i);
    const y = posAttribute.getY(i); // Ini Y lokal plane (sebelum rotasi), yang jadi Z dunia nantinya
    
    // Terapkan rumus ketinggian
    // Kita gunakan x dan -y karena setelah rotasi -Math.PI/2, sumbu Y lokal menjadi sumbu Z dunia terbalik
    const zHeight = getSeafloorHeight(x, -y); 
    
    posAttribute.setZ(i, zHeight); // Ubah Z lokal (yang jadi Y dunia setelah rotasi)
}

seafloorGeo.computeVertexNormals(); // Penting agar bayangan di bukit terlihat benar

const seafloor = new THREE.Mesh(seafloorGeo, seafloorMat);
seafloor.rotation.x = -Math.PI / 2;
seafloor.position.y = 0;
scene.add(seafloor);

// --- WATER SURFACE (THE DIVIDER) ---
// [BARU] Kita clone texture lantai untuk air, tapi diberi warna biru
const waterTex = seafloorTex.clone();
waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
waterTex.repeat.set(5, 5); // Ulangi tekstur agar detail riaknya terlihat kecil

const waterMat = new THREE.MeshStandardMaterial({
    color: 0xADD8E6,
    map: waterTex,
    transparent: true,
    opacity: 0.8,           // Transparan agar bisa melihat 'langit' samar-samar
    side: THREE.DoubleSide, // PENTING: Agar terlihat saat mendongak dari bawah
    roughness: 0.1,
    metalness: 0.1
});

const waterSurface = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), waterMat);
waterSurface.rotation.x = Math.PI / 2; // Menghadap ke bawah/atas
waterSurface.position.y = MAX_Y_SURFACE;
scene.add(waterSurface);

// --- MULTIPLE GODRAYS SETUP ---
const godRays = [];
const rayTex = texLoader.load('./textures/godray_alpha.png'); 
rayTex.wrapS = rayTex.wrapT = THREE.RepeatWrapping;

// [BARU] Geometri kerucut (atas kecil, bawah lebar) agar tidak terlihat kotak
const rayGeo = new THREE.CylinderGeometry(5, 60, 800, 32, 1, true);

// [BARU] Kembali ke MeshBasicMaterial agar godrays selalu "menyala" (tidak terpengaruh lighting)
const baseRayMat = new THREE.MeshBasicMaterial({
    color: 0x0000ff, 
    transparent: true, 
    opacity: 0.05, 
    // alphaMap: rayTex, 
    blending: THREE.AdditiveBlending, 
    // side: THREE.DoubleSide, // Agar terlihat dari semua sisi (dalam/luar)
    depthWrite: false
});

// Spawn multiple rays
const rayCount = 30; // Jumlah berkas cahaya
for (let i = 0; i < rayCount; i++) {
    const mat = baseRayMat.clone();
    
    const scaleY = 0.8 + Math.random() * 0.5;
    const mesh = new THREE.Mesh(rayGeo, mat);
    
    // Posisi acak di sekitar player
    const x = (Math.random() - 0.5) * 350; 
    const z = (Math.random() - 0.5) * 350;
    
    // Posisi Y diatur agar pangkal cylinder ada di dekat permukaan air
    mesh.position.set(x, 100, z);
    
    // [BARU] Non-uniform scale agar bentuk cahaya lebih variatif (lonjong/oval)
    const scaleX = 0.5 + Math.random() * 1.0;
    const scaleZ = 0.5 + Math.random() * 1.0;
    mesh.scale.set(scaleX, scaleY, scaleZ);
    
    // Rotasi awal acak
    mesh.rotation.x = (Math.random() - 0.5) * 0.3; 
    mesh.rotation.z = (Math.random() - 0.5) * 0.3; 
    
    // Simpan rotasi awal untuk referensi animasi sway nanti
    mesh.userData = {
        initialRotX: mesh.rotation.x,
        initialRotZ: mesh.rotation.z
    };
    
    scene.add(mesh);
    
    godRays.push({
        mesh: mesh,
        speed: 0.5 + Math.random() * 1.5, 
        baseOpacity: 0.1 + Math.random() * 0.1 
    });
}
// --- END GODRAYS ---

// --- LOADER & MODELS ---
const gltfLoader = new GLTFLoader();

// Whale
let whaleRig = null, whaleMixer = null, whaleBottomOffset = 0;
const whaleState = { pos: new THREE.Vector3(0, 16, 0), vel: new THREE.Vector3(1, 0, 0), speed: 9.0, yMin: 10, yMax: 30, margin: 0.8 };
gltfLoader.load("./models/Whale.glb", (gltf) => {
    whaleRig = new THREE.Group(); scene.add(whaleRig);
    const whaleModel = gltf.scene; whaleModel.scale.set(3.2, 3.2, 3.2); whaleRig.add(whaleModel);
    const box = new THREE.Box3().setFromObject(whaleModel); whaleBottomOffset = -box.min.y;
    if (gltf.animations.length) { whaleMixer = new THREE.AnimationMixer(whaleModel); whaleMixer.clipAction(gltf.animations[0]).play(); }
    whaleRig.position.copy(whaleState.pos);
});

// Manta
let mantaRig = null, mantaMixer = null;
const mantaState = { pos: new THREE.Vector3(-50, 25, -50), vel: new THREE.Vector3(0.8, 0.5, 1), speed: 12.0, yMin: 15, yMax: 45 };
gltfLoader.load("./models/Manta_ray.glb", (gltf) => {
    mantaRig = new THREE.Group(); scene.add(mantaRig);
    const mantaModel = gltf.scene; mantaModel.scale.set(2.5, 2.5, 2.5); mantaRig.add(mantaModel);
    if (gltf.animations.length) { mantaMixer = new THREE.AnimationMixer(mantaModel); mantaMixer.clipAction(gltf.animations[0]).play(); }
    mantaRig.position.copy(mantaState.pos);
}, undefined, (err) => console.error("Gagal load Manta:", err));

// Obstacles
const obstacles = [];
const PLAYER_R = 1.5; 
function hitObstacle(x, y, z) {
  // Cek tabrakan dengan objek/batu
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    const halfH = (o.h / 2) + 2;
    if (y < o.y - halfH || y > o.y + halfH) continue;
    const dx = x - o.x; const dz = z - o.z;
    const distSq = dx * dx + dz * dz; const minCleanDist = (PLAYER_R + o.r);
    if (distSq < minCleanDist * minCleanDist) return true;
  }
  
  // [BARU] Cek tabrakan dengan TERRAIN (agar tidak tembus lantai bergelombang)
  const terrainHeight = getSeafloorHeight(x, z);
  if (y < terrainHeight + 2) return true; // +2 buffer aman

  return false;
}
function randm(min, max) { return min + Math.random() * (max - min); }
const x_min = -200, x_max = 200, z_min = -200, z_max = 200;

function spawnAntekAntek(path, count, type) {
    gltfLoader.load(path, (g) => {
        for (let i = 0; i < count; i++) {
            const antek = g.scene.clone(true);
            let s_min, s_max;
            if (type === "coral") { s_min = 30; s_max = 50; }
            else if (type === "rock") { s_min = 50; s_max = 100; }
            else if (type === "coralB") { s_min = 10; s_max = 25; }
            else if (type === "kelp") { s_min = 5; s_max = 5; }
            else { s_min = 1; s_max = 1; }
            const s = randm(s_min, s_max);
            antek.scale.set(s, s, s);
            
            let randX, randZ;
            let safe = false;
            while (!safe) {
                randX = randm(x_min, x_max);
                randZ = randm(z_min, z_max);
                // Cek jarak dari (0,0). Radius aman 25 unit.
                if (Math.sqrt(randX * randX + randZ * randZ) > 25) {
                    safe = true;
                }
            }
            antek.position.set(randX, 0, randZ);
            antek.rotation.y = randm(0, Math.PI * 2);
            antek.updateMatrixWorld(true);
            
            const box = new THREE.Box3().setFromObject(antek);
            const size = new THREE.Vector3(); box.getSize(size);
            const center = new THREE.Vector3(); box.getCenter(center);
            
            // [BARU] Kalkulasi Grounding pada Terrain Bergelombang
            const groundY = getSeafloorHeight(randX, randZ);
            
            // Letakkan objek di atas groundY, kurangi offset model
            antek.position.y = groundY - box.min.y;  
            if (type === "rock") antek.position.y -= 1.0; 

            antek.updateMatrixWorld(true);
            scene.add(antek);
            
            const finalBox = new THREE.Box3().setFromObject(antek);
            finalBox.getCenter(center);
            
            obstacles.push({ x: center.x, y: center.y, z: center.z, r: Math.max(size.x, size.z) * 0.4, h: size.y });
        }
    });
}
spawnAntekAntek("./models/Kelp.glb", 200, "kelp");
spawnAntekAntek("./models/Rock 1.glb", 40, "rock");
spawnAntekAntek("./models/Rock 2.glb", 40, "rock");
spawnAntekAntek("./models/Rock 3.glb", 40, "rock");
spawnAntekAntek("./models/Coral 1.glb", 15, "coral");
spawnAntekAntek("./models/Coral 2.glb", 10, "coralB");
spawnAntekAntek("./models/Starfish.glb", 30, "else");

// --- PARTICLES ---
const particleCount = 10000; 
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount * 3; i++) { 
    pPos[i] = (Math.random() - 0.5) * 400; 
    pPos[i+1] = Math.random() * MAX_Y_SURFACE; // Batasi partikel hanya sampai permukaan
    pPos[i+2] = (Math.random() - 0.5) * 400;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.4, depthWrite: false });
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// --- CONTROLS ---
const keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
function setKey(e, down) {
    if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyW") keys.w = down; if (e.code === "KeyA") keys.a = down; if (e.code === "KeyS") keys.s = down; if (e.code === "KeyD") keys.d = down; if (e.code === "Space") keys.space = down; if (e.code === "ShiftLeft") keys.shift = down;
}
window.addEventListener("keydown", (e) => setKey(e, true)); window.addEventListener("keyup", (e) => setKey(e, false));

const up = new THREE.Vector3(0, 1, 0), forward = new THREE.Vector3(), right = new THREE.Vector3(), wish = new THREE.Vector3();
const SPEED = 12.0, VERT_SPEED = 9.0, MIN_Y = 1.6;

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    const time = now * 0.001;

    // Animate Water Surface
    if (waterTex) {
        waterTex.offset.x += dt * 0.05; 
        waterTex.offset.y += dt * 0.02;
    }

    // [BARU] Animasi Godrays yang diperbaiki
    godRays.forEach((ray, i) => {
        // Menggeser tekstur alphaMap (efek aliran cahaya) alih-alih memutar objek gepeng
        // if (ray.mesh.material.alphaMap) {
        //     ray.mesh.material.alphaMap.offset.y -= 0.02 * ray.speed * dt * 60; 
        // }
        
        // Tetap gunakan sway (goyang) halus
        ray.mesh.rotation.z = ray.mesh.userData.initialRotZ + Math.sin(time * 0.5 * ray.speed + i) * 0.02;
        ray.mesh.rotation.x = ray.mesh.userData.initialRotX + Math.cos(time * 0.3 * ray.speed + i) * 0.02;
        
        // Denyut Opacity halus
        ray.mesh.material.opacity = ray.baseOpacity + Math.sin(time * 1.5 * ray.speed) * 0.03;
    });

    if (whaleMixer) whaleMixer.update(dt);
    if (whaleRig) {
        whaleState.pos.addScaledVector(whaleState.vel.clone().setY(0), whaleState.speed * dt);
        whaleState.pos.y += whaleState.vel.y * dt;
        if (Math.abs(whaleState.pos.x) > WORLD_RADIUS) whaleState.vel.x *= -1;
        if (Math.abs(whaleState.pos.z) > WORLD_RADIUS) whaleState.vel.z *= -1;
        if (whaleState.pos.y > whaleState.yMax || whaleState.pos.y < whaleState.yMin) whaleState.vel.y *= -1;
        whaleRig.position.copy(whaleState.pos);
        whaleRig.lookAt(whaleState.pos.clone().add(whaleState.vel));
    }

    if (mantaMixer) mantaMixer.update(dt);
    if (mantaRig) {
        mantaState.pos.addScaledVector(mantaState.vel.clone().setY(0), mantaState.speed * dt);
        mantaState.pos.y += mantaState.vel.y * dt;
        if (Math.abs(mantaState.pos.x) > WORLD_RADIUS) mantaState.vel.x *= -1;
        if (Math.abs(mantaState.pos.z) > WORLD_RADIUS) mantaState.vel.z *= -1;
        if (mantaState.pos.y > mantaState.yMax || mantaState.pos.y < mantaState.yMin) mantaState.vel.y *= -1;
        mantaRig.position.copy(mantaState.pos);
        mantaRig.lookAt(mantaState.pos.clone().add(mantaState.vel));
    }

    if (controls.isLocked) {
        camera.getWorldDirection(forward); forward.y = 0; forward.normalize(); right.crossVectors(forward, up).normalize();
        wish.set(0, 0, 0);
        if (keys.w) wish.add(forward); if (keys.s) wish.sub(forward); if (keys.d) wish.add(right); if (keys.a) wish.sub(right);
        if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(SPEED * dt);
        
        const ox = camera.position.x, oy = camera.position.y, oz = camera.position.z;
        const nx = ox + wish.x, nz = oz + wish.z;
        if (!hitObstacle(nx, oy, nz)) { camera.position.x = nx; camera.position.z = nz; }
        else { if (!hitObstacle(nx, oy, oz)) camera.position.x = nx; if (!hitObstacle(ox, oy, nz)) camera.position.z = nz; }

        const nextY_up = camera.position.y + VERT_SPEED * dt;
        const nextY_down = camera.position.y - VERT_SPEED * dt;
        if (keys.space && !hitObstacle(camera.position.x, nextY_up, camera.position.z)) camera.position.y = nextY_up;
        if (keys.shift && !hitObstacle(camera.position.x, nextY_down, camera.position.z)) camera.position.y = nextY_down;

        camera.position.y = THREE.MathUtils.clamp(camera.position.y, MIN_Y, MAX_Y_SURFACE); // Batasi kamera tidak lewat permukaan
        const dist = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
        if (dist > WORLD_RADIUS) { const k = WORLD_RADIUS / (dist + 1e-6); camera.position.x *= k; camera.position.z *= k; }
    }
    
    // Animate Particles
	particles.rotation.y += dt * 0.1;
    
    renderer.render(scene, camera);
}
animate();