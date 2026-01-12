import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";


let MODE = "day";
const colors = { dayBg: 0x0a2a3a, nightBg: 0x04111f };

const scene = new THREE.Scene();
scene.background = new THREE.Color(colors.dayBg);
scene.fog = new THREE.FogExp2(colors.dayBg, 0.018);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(0, 20, 0);
scene.add(camera);

// onclick wiki popup
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
    },
    nemo: {
        title: "Ikan Badut (Clownfish)",
        desc: "Ikan kecil berwarna cerah yang hidup di antara tentakel anemon laut. Mereka memiliki hubungan simbiotik dengan anemon.",
        fact: "Ikan badut dapat berubah jenis kelamin dari jantan ke betina!"
    }

};

const wikiPopup = document.createElement("div");
wikiPopup.style.cssText = `
    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
    width: 300px; padding: 20px; background: rgba(0, 20, 40, 0.85);
    color: #eaf7ff; border: 1px solid #00aaff; border-radius: 12px;
    font-family: system-ui, Arial; backdrop-filter: blur(10px);
    display: none; z-index: 100; pointer-events: none;
`;
document.body.appendChild(wikiPopup);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener("click", () => {
    if (!controls.isLocked) return;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Cek Klik Whale
    if (whaleRig) {
        const intersectsWhale = raycaster.intersectObject(whaleRig, true);
        if (intersectsWhale.length > 0) {
            showWiki("whale");
            return; // Berhenti jika sudah kena whale
        }
    }

    // Cek Klik Manta
    if (mantaRig) {
        const intersectsManta = raycaster.intersectObject(mantaRig, true);
        if (intersectsManta.length > 0) {
            showWiki("manta");
            return; // Berhenti jika sudah kena manta
        }
    }

    if (nemoRig) {
        const intersectsNemo = raycaster.intersectObject(nemoRig, true);
        if (intersectsNemo.length > 0) {
            showWiki("nemo");
            return; // Berhenti jika sudah kena nemo
        }
    }

    // Jika klik meleset (tidak kena hewan apapun)
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

    // Sembunyikan otomatis setelah 5 detik
    setTimeout(() => { wikiPopup.style.display = "none"; }, 5000);
}
// onclick wiki popup end


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// particles
const particleCount = 10000;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
    pPos[i] = (Math.random() - 0.5) * 400;
}

pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

const pMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
});
// particle end

const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

const overlay = document.createElement("div");
overlay.style.cssText = `
  position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
  background:rgba(0,0,0,.35); color:#d7f2ff; font-family:system-ui,Arial;
  text-align:center; padding:24px; cursor:pointer; user-select:none;
`;
overlay.innerHTML = `
  <div style="max-width:760px">
    <div style="font-size:28px; font-weight:800; letter-spacing:.3px">Underwater</div>
    <div style="margin-top:10px; font-size:14px; opacity:.95; line-height:1.6">
      Klik untuk mulai (Pointer Lock)<br/>
      WASD = gerak, Space = naik, Shift = turun, Esc = keluar
    </div>
  </div>
`;
document.body.appendChild(overlay);

const controls = new PointerLockControls(camera, renderer.domElement);
overlay.addEventListener("click", () => controls.lock());
controls.addEventListener("lock", () => (overlay.style.display = "none"));
controls.addEventListener("unlock", () => (overlay.style.display = "flex"));

const btn = document.createElement("button");
btn.textContent = "Mode: Day";
btn.style.cssText = `
  position:fixed; top:16px; right:16px; z-index:10;
  padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,.18);
  background:rgba(0,0,0,.35); color:#eaf7ff; font-family:system-ui,Arial;
  cursor:pointer; backdrop-filter: blur(6px);
`;
document.body.appendChild(btn);

// crosshair
const crosshair = document.createElement("div");
crosshair.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    width: 24px;
    height: 24px;
    transform: translate(-50%, -50%);
    
    background-image: url('./textures/crosshair.png'); 
    background-size: contain;
    background-repeat: no-repeat;
    
    background-color: rgba(255, 255, 255, 0.5); 
    border-radius: 50%;
    border: 2px solid rgba(0, 170, 255, 0.8);

    pointer-events: none; 
    display: none;        
    z-index: 100;
`;
document.body.appendChild(crosshair);

controls.addEventListener("lock", () => {
    overlay.style.display = "none";
    crosshair.style.display = "block"; // Munculkan crosshair
});

controls.addEventListener("unlock", () => {
    overlay.style.display = "flex";
    crosshair.style.display = "none";  // Sembunyikan crosshair
    wikiPopup.style.display = "none";  // Sembunyikan popup wiki jika ada
});
// crosshair end


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
        scene.fog.density = 0.01;

        topLight.color.setHex(0xfff1d0);
        topLight.intensity = 1.25;

        ambient.intensity = 0.28;
        hemi.intensity = 0.6;

        renderer.toneMappingExposure = 1.12;
    } else {
        btn.textContent = "Mode: Night";
        scene.background.setHex(colors.nightBg);
        scene.fog.color.setHex(colors.nightBg);
        scene.fog.density = 0.024;

        topLight.color.setHex(0xb6d8ff);
        topLight.intensity = 0.45;

        ambient.intensity = 0.14;
        hemi.intensity = 0.35;

        renderer.toneMappingExposure = 0.95;
    }
}
btn.addEventListener("click", () => applyLighting(MODE === "day" ? "night" : "day"));
applyLighting("day");

const WORLD_RADIUS = 250;

// LANTAI
const seafloorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.0,
});

// const seafloor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 1, 1), seafloorMat);
const seafloorGeo = new THREE.PlaneGeometry(1000, 1000, 128, 128);

const positions = seafloorGeo.attributes.position;
for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i); // Ini sebenarnya posisi mendatar di plane sebelum rotasi

    // Rumus gelombang sederhana (kombinasi Sinus)
    // Frekuensi rendah (bukit besar) + Frekuensi tinggi (detail kecil)
    const z = Math.sin(x * 0.01) * 10 + Math.cos(y * 0.01) * 10
        + Math.sin(x * 0.05 + y * 0.05) * 2;

    positions.setZ(i, z);
}
// Hitung ulang pencahayaan (normals) agar bayangan di bukit terlihat nyata
seafloorGeo.computeVertexNormals();

const seafloor = new THREE.Mesh(seafloorGeo, seafloorMat);

// Fungsi utilitas untuk mendapatkan ketinggian tanah di posisi (x, z) tertentu
// Ini mereplikasi rumus matematika yang sama dengan yang kita pakai di loop vertices tadi
function getSeafloorHeight(x, z) {
    // Perhatikan: di dunia 3D (x, z), tapi rumus geometri pakai (x, y) lokal plane
    // Karena plane di-rotasi -Math.PI/2, sumbu Y lokal plane menjadi sumbu Z dunia negatif.
    // Namun untuk simplifikasi karena plane kita di pusat (0,0), kita bisa pakai input (x, z) langsung ke rumus.

    // PENTING: Gunakan RUMUS YANG SAMA PERSIS dengan saat pembuatan terrain
    return Math.sin(x * 0.01) * 10 + Math.cos(z * 0.01) * 10
        + Math.sin(x * 0.05 + z * 0.05) * 2;
}

seafloor.rotation.x = -Math.PI / 2;
seafloor.position.y = 0;
scene.add(seafloor);
const MAX_Y_SURFACE = 100.0; // Tinggi permukaan air

// TEXTURE
const texLoader = new THREE.TextureLoader();
const seafloorTex = texLoader.load("./models/tex.jpg");
seafloorTex.colorSpace = THREE.SRGBColorSpace;
seafloorMat.map = seafloorTex;

const gltfLoader = new GLTFLoader();
//whale
let whaleRig = null;
let whaleMixer = null;
let whaleBottomOffset = 0;
const whaleBox = new THREE.Box3();

const whaleState = {
    pos: new THREE.Vector3(0, 16, 0),
    vel: new THREE.Vector3(1, 0, 0),

    speed: 9.0,
    yMin: 10,
    yMax: 30,
    margin: 0.8,
    fleeSpeed: 14,
    fleeRadius: 15,
    fleeing: false
};

// MODEL WHALE
gltfLoader.load(
    "./models/Whale.glb",
    (gltf) => {
        whaleRig = new THREE.Group();
        scene.add(whaleRig);

        const whaleModel = gltf.scene;
        whaleModel.scale.set(3.2, 3.2, 3.2);

        whaleRig.add(whaleModel);
        whaleBox.setFromObject(whaleModel);
        whaleBottomOffset = -whaleBox.min.y;

        if (gltf.animations && gltf.animations.length > 0) {
            whaleMixer = new THREE.AnimationMixer(whaleModel);
            const clip = THREE.AnimationClip.findByName(gltf.animations, "Armature|Swim") || gltf.animations[0];
            const action = whaleMixer.clipAction(clip);
            action.reset();
            action.play();
            console.log("Whale clip playing:", clip.name);
        } else {
            console.warn("Whale.glb tidak punya animation clip.");
        }

        whaleState.pos.set(0, 16, 0);
        whaleState.vel.set(1, 2.0, 0);
        whaleRig.position.copy(whaleState.pos);
    },
    undefined,
    (err) => console.error("Gagal load Whale.glb:", err)
);
// END MODEL WHALE

let mantaRig = null;
let mantaMixer = null;

const mantaState = {
    pos: new THREE.Vector3(-50, 25, -50), // Mulai dari pojok yang berbeda
    vel: new THREE.Vector3(0.8, 0.5, 1),   // Arah gerak awal
    speed: 12.0,                           // Manta biasanya sedikit lebih gesit
    yMin: 15,
    yMax: 45,
    fleeSpeed: 14,
    fleeRadius: 15,
    fleeing: false
};

// MODEL MANTARAY	
gltfLoader.load(
    "./models/Manta_ray.glb",
    (gltf) => {
        mantaRig = new THREE.Group();
        scene.add(mantaRig);

        const mantaModel = gltf.scene;
        mantaModel.scale.set(2.5, 2.5, 2.5); // Sesuaikan skala
        mantaRig.add(mantaModel);

        if (gltf.animations && gltf.animations.length > 0) {
            mantaMixer = new THREE.AnimationMixer(mantaModel);
            // Sesuaikan nama animasi jika berbeda (biasanya "Swim" atau animasi index 0)
            const action = mantaMixer.clipAction(gltf.animations[0]);
            action.play();
        }

        mantaRig.position.copy(mantaState.pos);
    },
    undefined,
    (err) => console.error("Gagal load Manta Ray:", err)
);
// END MODEL MANTARAY

// MODEL NEMO
let nemoRig = null;
let nemoMixer = null;

const nemoState = {
    pos: new THREE.Vector3(30, 12, 30),
    vel: new THREE.Vector3(1, 0, 1),
    speed: 8,
    yMin: 8,
    yMax: 25,
    fleeSpeed: 14,
    fleeRadius: 15,
    fleeing: false
};

gltfLoader.load(
    "./models/Nemo.glb",
    (gltf) => {
        nemoRig = new THREE.Group();
        scene.add(nemoRig);

        const nemoModel = gltf.scene;
        nemoModel.scale.set(1, 1, 1);
        nemoRig.add(nemoModel);

        if (gltf.animations && gltf.animations.length > 0) {
            nemoMixer = new THREE.AnimationMixer(nemoModel);
            const action = nemoMixer.clipAction(gltf.animations[0]);
            action.play();
        }

        nemoRig.position.set(30, 12, 30);
    },
    undefined,
    (err) => console.error("Gagal load Clownfish:", err)
);
// END MODEL NEMO

function updateFishFlee(state, rig, dt) {
    const dist = state.pos.distanceTo(camera.position);

    if (dist < state.fleeRadius) {
        state.fleeing = true;

        const fleeDir = new THREE.Vector3()
            .subVectors(state.pos, camera.position)
            .normalize();

        state.vel.lerp(fleeDir, 0.1);
        state.speed = THREE.MathUtils.lerp(state.speed, state.fleeSpeed, 0.05);
    } else {
        state.fleeing = false;
        state.speed = THREE.MathUtils.lerp(state.speed, 8, 0.02);
    }

    state.pos.addScaledVector(state.vel, state.speed * dt);

    rig.position.copy(state.pos);

    rig.lookAt(
        state.pos.x + state.vel.x,
        state.pos.y + state.vel.y,
        state.pos.z + state.vel.z
    );
}

// --- WATER SURFACE (THE DIVIDER) ---
// Kita clone texture lantai untuk air, tapi diberi warna biru
const waterTex = seafloorTex.clone();
waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
waterTex.repeat.set(5, 5); // Ulangi tekstur agar detail riaknya terlihat kecil

const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
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

// Geometri dasar untuk semua rays
const rayGeo = new THREE.CylinderGeometry(5, 60, 400, 32, 1, true);

// Material dasar
const baseRayMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.05,
    alphaMap: rayTex,
    blending: THREE.AdditiveBlending,
    // side: THREE.DoubleSide,
    depthWrite: false
});

// Spawn multiple rays
const rayCount = 30; // Jumlah berkas cahaya
for (let i = 0; i < rayCount; i++) {
    // Clone material agar bisa punya opacity/animasi beda-beda
    const mat = baseRayMat.clone();

    // Variasi ukuran sedikit
    const scaleY = 0.8 + Math.random() * 0.5;

    const mesh = new THREE.Mesh(rayGeo, mat);

    // Posisi acak di sekitar player
    const x = (Math.random() - 0.5) * 350;
    const z = (Math.random() - 0.5) * 350;

    mesh.position.set(x, 100, z);
    mesh.scale.set(1, scaleY, 1);

    // Sedikit miring acak agar tidak terlalu seragam
    mesh.rotation.x = (Math.random() - 0.5) * 0.2;
    mesh.rotation.z = (Math.random() - 0.5) * 0.2;

    scene.add(mesh);

    // Simpan ke array untuk dianimasikan
    godRays.push({
        mesh: mesh,
        speed: 0.5 + Math.random() * 1.5, // Kecepatan rotasi/flicker
        baseOpacity: 0.1 + Math.random() * 0.1 // Opacity dasar
    });
}
// --- END GODRAYS ---

// ANTEK ANTEK SEAFLOOR
function randm(min, max) {
    return min + Math.random() * (max - min);
}

// batas posisi
const x_min = -200;
const x_max = 200;
const z_min = -200;
const z_max = 200;

// ===============================================================
const obstacles = [];
const PLAYER_R = 1.5;        // radius tabrakan kamera (ubah kalau terlalu “nabrak jauh”)
const Y_RANGE = 10;        // kalau kamera jauh lebih tinggi dari objek, dia boleh lewat

function addObstacle(x, y, z, r) {
    obstacles.push({ x, y, z, r });
}

function hitObstacle(x, y, z) {
    for (let i = 0; i < obstacles.length; i++) {
        const o = obstacles[i];

        // kalau terlalu beda tinggi, skip (biar bisa "terbang" lewat atas)
        // if (Math.abs(y - o.y) > Y_RANGE) continue;
        const halfH = (o.h / 2) + 2;
        if (y < o.y - halfH || y > o.y + halfH) continue;

        const dx = x - o.x;
        const dz = z - o.z;
        // const rr = (PLAYER_R + o.r);
        const distSq = dx * dx + dz * dz;
        const minCleanDist = (PLAYER_R + o.r);
        // if (dx * dx + dz * dz < rr * rr) return true;
        if (distSq < minCleanDist * minCleanDist) return true;
    }
    return false;
}
// ===============================================================

function spawnAntekAntek(path, count, type) {
    gltfLoader.load(path, (g) => {
        for (let i = 0; i < count; i++) {
            const antek = g.scene.clone(true);
            let s_min;
            let s_max;
            let y;

            // scale 
            if (type === "coral") { s_min = 30; s_max = 50; }
            else if (type === "rock") { s_min = 50; s_max = 100; }
            else if (type === "coralB") { s_min = 10; s_max = 25; }
            else if (type === "kelp") { s_min = 5; s_max = 5; }
            else { s_min = 1; s_max = 1; }

            antek.position.set(randm(x_min, x_max), 0, randm(z_min, z_max));
            const s = randm(s_min, s_max);
            antek.scale.set(s, s, s);

            // Set posisi X Z
            const randX = randm(x_min, x_max);
            const randZ = randm(z_min, z_max);
            antek.position.set(randX, 0, randZ);

            antek.rotation.y = randm(0, Math.PI * 2);
            antek.updateMatrixWorld(true);

            const box = new THREE.Box3().setFromObject(antek);
            const size = new THREE.Vector3(); box.getSize(size);
            const center = new THREE.Vector3(); box.getCenter(center);

            // HITUNG KETINGGIAN TANAH DI TITIK INI
            const groundY = getSeafloorHeight(randX, randZ);

            // Letakkan objek di atas tanah (groundY) dikurangi offset titik terendah objek (box.min.y)
            // agar objek menapak pas di permukaan gelombang
            antek.position.y = groundY - box.min.y;
            if (type === "rock") antek.position.y -= 1.0; // Sedikit tenggelamkan batu agar natural

            antek.updateMatrixWorld(true);
            scene.add(antek);

            // Update obstacle dengan posisi Y baru yang mengikuti terrain
            // Kita perlu hitung center lagi karena Y sudah berubah
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
// END ANTEK ANTEK SEAFLOOR

const keys = { w: false, a: false, s: false, d: false, space: false, shift: false };

function setKey(e, down) {
    if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyW") keys.w = down;
    if (e.code === "KeyA") keys.a = down;
    if (e.code === "KeyS") keys.s = down;
    if (e.code === "KeyD") keys.d = down;
    if (e.code === "Space") keys.space = down;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = down;
}
window.addEventListener("keydown", (e) => setKey(e, true), { passive: false });
window.addEventListener("keyup", (e) => setKey(e, false), { passive: false });

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const wish = new THREE.Vector3();

const SPEED = 12.0;
const VERT_SPEED = 9.0;
const MIN_Y = 0 + 1.6;
const MAX_Y = 100.0;

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;

    // whale tail animation
    if (whaleMixer) whaleMixer.update(dt);

    if (whaleRig) {
        updateFishFlee(whaleState, whaleRig, dt);
        // gerak lurus (XZ) + naik turun (Y)
        whaleState.pos.x += whaleState.speed * whaleState.vel.x * dt;
        whaleState.pos.z += whaleState.speed * whaleState.vel.z * dt;
        whaleState.pos.y += whaleState.vel.y * dt;

        // batas XZ (pakai WORLD_RADIUS)
        if (whaleState.pos.x > WORLD_RADIUS) { whaleState.pos.x = WORLD_RADIUS; whaleState.vel.x *= -1; }
        if (whaleState.pos.x < -WORLD_RADIUS) { whaleState.pos.x = -WORLD_RADIUS; whaleState.vel.x *= -1; }
        if (whaleState.pos.z > WORLD_RADIUS) { whaleState.pos.z = WORLD_RADIUS; whaleState.vel.z *= -1; }
        if (whaleState.pos.z < -WORLD_RADIUS) { whaleState.pos.z = -WORLD_RADIUS; whaleState.vel.z *= -1; }

        // batas Y
        if (whaleState.pos.y > whaleState.yMax) { whaleState.pos.y = whaleState.yMax; whaleState.vel.y *= -1; }

        const minRigY = whaleBottomOffset + whaleState.margin; // lantai + offset model
        const minY = Math.max(whaleState.yMin, minRigY);
        if (whaleState.pos.y < minY) { whaleState.pos.y = minY; whaleState.vel.y = Math.abs(whaleState.vel.y); }

        whaleRig.position.copy(whaleState.pos);

        // maju lihat depan
        whaleRig.lookAt(
            whaleState.pos.x + whaleState.vel.x,
            whaleState.pos.y,
            whaleState.pos.z + whaleState.vel.z
        );
    }

    // manta ray animation
    if (mantaMixer) mantaMixer.update(dt);

    if (mantaRig) {
        updateFishFlee(mantaState, mantaRig, dt);
        // Gerak Manta
        mantaState.pos.x += mantaState.speed * mantaState.vel.x * dt;
        mantaState.pos.z += mantaState.speed * mantaState.vel.z * dt;
        mantaState.pos.y += mantaState.vel.y * dt;

        // Boundary Check (Pantulan jika kena batas WORLD_RADIUS)
        if (Math.abs(mantaState.pos.x) > WORLD_RADIUS) mantaState.vel.x *= -1;
        if (Math.abs(mantaState.pos.z) > WORLD_RADIUS) mantaState.vel.z *= -1;
        if (mantaState.pos.y > mantaState.yMax || mantaState.pos.y < mantaState.yMin) mantaState.vel.y *= -1;

        mantaRig.position.copy(mantaState.pos);

        // Agar Manta menghadap ke arah dia berenang
        mantaRig.lookAt(
            mantaState.pos.x + mantaState.vel.x,
            mantaState.pos.y + mantaState.vel.y,
            mantaState.pos.z + mantaState.vel.z
        );
    }


    if (nemoMixer) nemoMixer.update(dt);

    if (nemoRig) {
        updateFishFlee(nemoState, nemoRig, dt);

        nemoState.pos.x += nemoState.speed * nemoState.vel.x * dt;
        nemoState.pos.z += nemoState.speed * nemoState.vel.z * dt;
        nemoState.pos.y += nemoState.vel.y * dt;

        // batas XZ (pakai WORLD_RADIUS)
        if (nemoState.pos.x > WORLD_RADIUS) { nemoState.pos.x = WORLD_RADIUS; nemoState.vel.x *= -1; }
        if (nemoState.pos.x < -WORLD_RADIUS) { nemoState.pos.x = -WORLD_RADIUS; nemoState.vel.x *= -1; }
        if (nemoState.pos.z > WORLD_RADIUS) { nemoState.pos.z = WORLD_RADIUS; nemoState.vel.z *= -1; }
        if (nemoState.pos.z < -WORLD_RADIUS) { nemoState.pos.z = -WORLD_RADIUS; nemoState.vel.z *= -1; }

        nemoRig.position.copy(nemoState.pos);

        // maju lihat depan
        nemoRig.lookAt(
            nemoState.pos.x + nemoState.vel.x,
            nemoState.pos.y,
            nemoState.pos.z + nemoState.vel.z
        );

    }

    const time = now * 0.001;

    // Animate Water Surface
    if (waterTex) {
        waterTex.offset.x += dt * 0.05;
        waterTex.offset.y += dt * 0.02;
    }

    // player movement
    if (controls.isLocked) {
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.crossVectors(forward, up).normalize();

        wish.set(0, 0, 0);
        if (keys.w) wish.add(forward);
        if (keys.s) wish.sub(forward);
        if (keys.d) wish.add(right);
        if (keys.a) wish.sub(right);

        if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(SPEED * dt);
        // ===============================================================
        // camera.position.add(wish);
        const ox = camera.position.x;
        const oy = camera.position.y;
        const oz = camera.position.z;

        const nx = ox + wish.x;
        const nz = oz + wish.z;

        // kalau aman, jalan normal
        if (!hitObstacle(nx, oy, nz)) {
            camera.position.x = nx;
            camera.position.z = nz;
        } else {
            // kalau nabrak, coba geser X aja / Z aja (biar nggak macet total)
            if (!hitObstacle(nx, oy, oz)) camera.position.x = nx;
            if (!hitObstacle(ox, oy, nz)) camera.position.z = nz;
        }
        // ===============================================================

        const nextY_up = camera.position.y + VERT_SPEED * dt;
        const nextY_down = camera.position.y - VERT_SPEED * dt;

        if (keys.space) {
            // Cek apakah naik akan menabrak objek dari bawah (jarang, tapi untuk keamanan)
            if (!hitObstacle(camera.position.x, nextY_up, camera.position.z)) {
                camera.position.y = nextY_up;
            }
        }
        if (keys.shift) {
            // Cek apakah turun akan menabrak bagian atas objek
            if (!hitObstacle(camera.position.x, nextY_down, camera.position.z)) {
                camera.position.y = nextY_down;
            }
        }

        camera.position.y = THREE.MathUtils.clamp(camera.position.y, MIN_Y, MAX_Y);

        // boundary
        const dx = camera.position.x;
        const dz = camera.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > WORLD_RADIUS) {
            const k = WORLD_RADIUS / (dist + 1e-6);
            camera.position.x *= k;
            camera.position.z *= k;
        }

        if (camera.position.y < MIN_Y) camera.position.y = MIN_Y;
    }

    // particle movement
    particles.rotation.y += dt * 0.1;

    renderer.render(scene, camera);
}

animate();