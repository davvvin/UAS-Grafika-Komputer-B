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

const seafloor = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 1, 1), seafloorMat);
seafloor.rotation.x = -Math.PI / 2;
seafloor.position.y = 0;
scene.add(seafloor);

// TEXTURE
const texLoader = new THREE.TextureLoader();
const seafloorTex = texLoader.load("./models/tex.jpg");
seafloorTex.colorSpace = THREE.SRGBColorSpace;
seafloorMat.map = seafloorTex;

const gltfLoader = new GLTFLoader();
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
};

// MODEL UTAMA
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
// END MODEL UTAMA

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
		const halfH = o.h / 2;
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
			antek.position.set(randm(x_min, x_max), 0, randm(z_min, z_max));
			antek.rotation.y = randm(0, Math.PI * 2);

			antek.updateMatrixWorld(true);
			// const box = new THREE.Box3().setFromObject(antek);
			// const floorY = seafloor.position.y;
			// const eps = 0.02;
			const box = new THREE.Box3().setFromObject(antek);
            const size = new THREE.Vector3();
            box.getSize(size);
            const center = new THREE.Vector3();
            box.getCenter(center);

			// geser supaya titik paling bawah (box.min.y) tepat di atas lantai
			// antek.position.y += (floorY - box.min.y) + eps;
			antek.position.y += (0 - box.min.y);
			antek.updateMatrixWorld(true); // Update lagi setelah geser Y

			scene.add(antek);
			const radius = Math.max(size.x, size.z) * 0.4; 
            const height = size.y;

            // Hitung radius dan tinggi berdasarkan Box3 yang sudah final
            obstacles.push({
                x: center.x,
                y: center.y,
                z: center.z,
                r: radius,
                h: height // Simpan tinggi objek untuk pengecekan vertikal yang lebih akurat
	// 		let r;
    //   if (type === "rock") r = s * 0.25;
    //   else if (type === "coral" || type === "coralB") r = s * 0.18;
    //   else r = s * 0.10;

    //   addObstacle(antek.position.x, antek.position.y, antek.position.z, r);
	// 	}
});
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
const MAX_Y = 70.0;

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

		if (keys.space) camera.position.y += VERT_SPEED * dt;
		if (keys.shift) camera.position.y -= VERT_SPEED * dt;

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