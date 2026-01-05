import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const TEX_PATH = "./models/tex.jpg";
const WHALE_PATH = "./models/Whale.glb";
const WHALE_CLIP = "Armature|Swim";

function isPowerOfTwo(v) {
  return (v & (v - 1)) === 0;
}
function nextPowerOfTwo(v) {
  return 2 ** Math.ceil(Math.log2(v));
}
function randInCircle(radius) {
  const t = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius;
  return { x: Math.cos(t) * r, z: Math.sin(t) * r };
}

const scene = new THREE.Scene();

let MODE = "day";
const colors = { dayBg: 0x0a2a3a, nightBg: 0x04111f };

scene.background = new THREE.Color(colors.dayBg);
scene.fog = new THREE.FogExp2(colors.dayBg, 0.018);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(0, 10, 28);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

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
    <div style="font-size:28px; font-weight:800; letter-spacing:.3px">Underwater + Whale</div>
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
    scene.fog.density = 0.018;

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

const SEAFLOOR_Y = 0;
const WORLD_RADIUS = 160;

const seafloorMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 1.0,
  metalness: 0.0,
});

const seafloor = new THREE.Mesh(new THREE.PlaneGeometry(520, 520, 1, 1), seafloorMat);
seafloor.rotation.x = -Math.PI / 2;
seafloor.position.y = SEAFLOOR_Y;
scene.add(seafloor);

const texLoader = new THREE.TextureLoader();

texLoader.load(
  TEX_PATH,
  (imgTex) => {
    imgTex.colorSpace = THREE.SRGBColorSpace;

    const image = imgTex.image;
    let finalTex = imgTex;

    if (image && (!isPowerOfTwo(image.width) || !isPowerOfTwo(image.height))) {
      const cw = nextPowerOfTwo(image.width);
      const ch = nextPowerOfTwo(image.height);

      const c = document.createElement("canvas");
      c.width = cw;
      c.height = ch;
      const ctx = c.getContext("2d");
      ctx.drawImage(image, 0, 0, cw, ch);

      finalTex = new THREE.CanvasTexture(c);
      finalTex.colorSpace = THREE.SRGBColorSpace;
    }

    finalTex.wrapS = finalTex.wrapT = THREE.MirroredRepeatWrapping;

    finalTex.repeat.set(8, 8);

    finalTex.offset.set(Math.random(), Math.random());

    finalTex.magFilter = THREE.LinearFilter;
    finalTex.minFilter = THREE.LinearMipmapLinearFilter;
    finalTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    finalTex.needsUpdate = true;

    seafloorMat.map = finalTex;
    seafloorMat.needsUpdate = true;
  },
  undefined,
  (err) => console.error("Gagal load tex.jpg:", err)
);

const gltfLoader = new GLTFLoader();

let whaleRig = null;
let whaleMixer = null;
let whaleBottomOffset = 0; 
const whaleBox = new THREE.Box3();

const whaleState = {
  pos: new THREE.Vector3(0, 16, 0),
  vel: new THREE.Vector3(1, 0, 0),
  target: new THREE.Vector3(20, 18, 15),

  speed: 9.0,
  turn: 2.6,
  retarget: 2.5,

  yMin: 10,
  yMax: 30,

  wobble: 0.7,
  phase: Math.random() * Math.PI * 2,

  margin: 0.8,
};

function randomWhaleWaypoint() {
  const p = randInCircle(WORLD_RADIUS * 0.85);
  const y = whaleState.yMin + Math.random() * (whaleState.yMax - whaleState.yMin);
  return new THREE.Vector3(p.x, y, p.z);
}
function setNewWhaleTarget() {
  whaleState.target.copy(randomWhaleWaypoint());
  whaleState.retarget = 1.2 + Math.random() * 4.0;
}

gltfLoader.load(
  WHALE_PATH,
  (gltf) => {
    whaleRig = new THREE.Group();
    scene.add(whaleRig);

    const whaleModel = gltf.scene;
    whaleModel.scale.set(3.2, 3.2, 3.2);

    whaleRig.add(whaleModel);
    whaleBox.setFromObject(whaleModel);
    whaleBottomOffset = -whaleBox.min.y; // jadi positif

    if (gltf.animations && gltf.animations.length > 0) {
      whaleMixer = new THREE.AnimationMixer(whaleModel);
      const clip = THREE.AnimationClip.findByName(gltf.animations, WHALE_CLIP) || gltf.animations[0];
      const action = whaleMixer.clipAction(clip);
      action.reset();
      action.play();
      console.log("Whale clip playing:", clip.name);
    } else {
      console.warn("Whale.glb tidak punya animation clip.");
    }

    whaleState.pos.set(0, 16, 0);
    whaleState.vel.set(1, 0, 0).normalize().multiplyScalar(whaleState.speed);
    setNewWhaleTarget();
    whaleRig.position.copy(whaleState.pos);
  },
  undefined,
  (err) => console.error("Gagal load Whale.glb:", err)
);

const keys = { w:false, a:false, s:false, d:false, space:false, shift:false };

function setKey(e, down) {
  if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
  if (e.code === "KeyW") keys.w = down;
  if (e.code === "KeyA") keys.a = down;
  if (e.code === "KeyS") keys.s = down;
  if (e.code === "KeyD") keys.d = down;
  if (e.code === "Space") keys.space = down;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = down;
}
window.addEventListener("keydown", (e) => setKey(e, true), { passive:false });
window.addEventListener("keyup", (e) => setKey(e, false), { passive:false });

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const wish = new THREE.Vector3();

const SPEED = 12.0;
const VERT_SPEED = 9.0;
const MIN_Y = SEAFLOOR_Y + 1.6;
const MAX_Y = 70.0;

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTime = performance.now();

const tmpDir = new THREE.Vector3();
const tmpDesired = new THREE.Vector3();
const tmpLook = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  const t = now * 0.001;

  // whale tail animation
  if (whaleMixer) whaleMixer.update(dt);

  // whale random path + anti-clipping
  if (whaleRig) {
    whaleState.retarget -= dt;

    const distToTarget = whaleState.pos.distanceTo(whaleState.target);
    if (distToTarget < 5.0 || whaleState.retarget <= 0) setNewWhaleTarget();

    // steering
    tmpDir.copy(whaleState.target).sub(whaleState.pos);
    const len = tmpDir.length();
    if (len > 1e-6) tmpDir.multiplyScalar(1 / len);

    tmpDesired.copy(tmpDir).multiplyScalar(whaleState.speed);
    whaleState.vel.lerp(tmpDesired, 1 - Math.exp(-whaleState.turn * dt));

    // move
    whaleState.pos.addScaledVector(whaleState.vel, dt);

    // boundary
    const d = Math.sqrt(whaleState.pos.x * whaleState.pos.x + whaleState.pos.z * whaleState.pos.z);
    if (d > WORLD_RADIUS * 0.97) {
      whaleState.target.set(0, 14 + Math.random() * 10, 0);
      whaleState.retarget = 0.5 + Math.random() * 1.0;
    }

    const wob = Math.sin(t * 1.6 + whaleState.phase) * whaleState.wobble;
    whaleState.pos.y = THREE.MathUtils.clamp(whaleState.pos.y + wob, whaleState.yMin, whaleState.yMax);

    const minRigY = SEAFLOOR_Y + whaleBottomOffset + whaleState.margin;
    if (whaleState.pos.y < minRigY) whaleState.pos.y = minRigY;

    whaleRig.position.copy(whaleState.pos);

    // face velocity
    const vLen = whaleState.vel.length();
    if (vLen > 1e-6) {
      tmpLook.set(
        whaleState.pos.x + whaleState.vel.x / vLen,
        whaleState.pos.y + whaleState.vel.y / vLen,
        whaleState.pos.z + whaleState.vel.z / vLen
      );
      whaleRig.lookAt(tmpLook);
    }
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
    camera.position.add(wish);

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

  renderer.render(scene, camera);
}

animate();
