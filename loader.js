import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// LOADER & MODELS 
const gltfLoader = new GLTFLoader();

// Whale
export let whaleRig = null, whaleMixer = null, whaleBottomOffset = 0;
export const whaleState = { pos: new THREE.Vector3(0, 40, 0), vel: new THREE.Vector3(1, 0, 0), speed: 9.0, yMin: 10, yMax: 30, margin: 0.8 };

// Manta
export let mantaRig = null, mantaMixer = null;
export const mantaState = { pos: new THREE.Vector3(-50, 25, -50), vel: new THREE.Vector3(0.8, 0.5, 1), speed: 12.0, yMin: 15, yMax: 45 };

// Nemo
export let nemoRig = null, nemoMixer = null;
export const nemoState = { pos: new THREE.Vector3(0, 50, 0), vel: new THREE.Vector3(1.2, 0.3, 0.7), speed: 10.0, yMin: 10, yMax: 35 };

// Obstacles
export const obstacles = [];
const PLAYER_R = 1.5;

let _scene = null;
let _getSeafloorHeight = (x, z) => 0;

export function hitObstacle(x, y, z) {
  // Cek tabrakan dengan objek/batu
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    const halfH = (o.h / 2) + 2;
    if (y < o.y - halfH || y > o.y + halfH) continue;
    const dx = x - o.x; const dz = z - o.z;
    const distSq = dx * dx + dz * dz; const minCleanDist = (PLAYER_R + o.r);
    if (distSq < minCleanDist * minCleanDist) return true;
  }

  //  Cek tabrakan dengan TERRAIN (agar tidak tembus lantai bergelombang)
  const terrainHeight = _getSeafloorHeight(x, z);
  if (y < terrainHeight + 1) return true; // +2 buffer aman

  return false;
}

function randm(min, max) { return min + Math.random() * (max - min); }
const x_min = -200, x_max = 200, z_min = -200, z_max = 200;

// SPAWN (Tidak tumpang tindih)
const spawnColliders = []; // {x, z, r}

function overlapsSpawn(cx, cz, r) {
  for (let i = 0; i < spawnColliders.length; i++) {
    const p = spawnColliders[i];
    const dx = cx - p.x, dz = cz - p.z;
    const rr = r + p.r;
    if (dx * dx + dz * dz < rr * rr) return true;
  }
  return false;
}

function spawnAntekAntek(path, count, type) {
  gltfLoader.load(path, (g) => {
    for (let i = 0; i < count; i++) {
      const antek = g.scene.clone(true);

      // scale 
      let s_min, s_max;
      if (type === "coral") { s_min = 30; s_max = 50; }
      else if (type === "rock") { s_min = 50; s_max = 100; }
      else if (type === "coralB") { s_min = 10; s_max = 25; }
      else if (type === "kelp") { s_min = 5; s_max = 5; }
      else { s_min = 1; s_max = 1; }

      const s = randm(s_min, s_max);
      antek.scale.set(s, s, s);

      let placed = false;

      for (let tries = 0; tries < 2500 && !placed; tries++) {
        const randX = randm(x_min, x_max);
        const randZ = randm(z_min, z_max);

        // jauh dari player spawn 
        if ((randX * randX + randZ * randZ) <= (50 * 50)) continue;

        // set posisi & rotasi 
        antek.position.set(randX, 0, randZ);
        antek.rotation.y = randm(0, Math.PI * 2);
        antek.updateMatrixWorld(true);

        // grounding terrain 
        const box0 = new THREE.Box3().setFromObject(antek);
        const groundY = _getSeafloorHeight(randX, randZ);
        antek.position.y = groundY - box0.min.y;
        if (type === "rock") antek.position.y -= 2;
        if (type === "kelp") antek.position.y -= 5;
        antek.updateMatrixWorld(true);

        // hitung collider 
        const box = new THREE.Box3().setFromObject(antek);
        const size = new THREE.Vector3(); box.getSize(size);
        const center = new THREE.Vector3(); box.getCenter(center);

        const pad = 1; // margin nya
        const rCollider = 0.3 * Math.max(size.x, size.z) + pad;

        // anti tumpang tindih
        if (overlapsSpawn(center.x, center.z, rCollider)) continue;

        _scene.add(antek);
        spawnColliders.push({ x: center.x, z: center.z, r: rCollider });

        if (type !== "kelp") {
          obstacles.push({
            x: center.x, y: center.y, z: center.z,
            r: rCollider,
            h: size.y
          });
        }

        placed = true;
      }
    }
  });
}

export function initLoader(scene, getSeafloorHeight) {
  _scene = scene;
  _getSeafloorHeight = getSeafloorHeight;

  // Whale
  gltfLoader.load("./models/Whale.glb", (gltf) => {
    whaleRig = new THREE.Group(); _scene.add(whaleRig);
    const whaleModel = gltf.scene; whaleModel.scale.set(3.2, 3.2, 3.2); whaleRig.add(whaleModel);
    const box = new THREE.Box3().setFromObject(whaleModel); whaleBottomOffset = -box.min.y;
    if (gltf.animations.length) { whaleMixer = new THREE.AnimationMixer(whaleModel); whaleMixer.clipAction(gltf.animations[0]).play(); }
    whaleRig.position.copy(whaleState.pos);
  });

  // Manta
  gltfLoader.load("./models/Manta_ray.glb", (gltf) => {
    mantaRig = new THREE.Group(); _scene.add(mantaRig);
    const mantaModel = gltf.scene; mantaModel.scale.set(2.5, 2.5, 2.5); mantaRig.add(mantaModel);
    if (gltf.animations.length) { mantaMixer = new THREE.AnimationMixer(mantaModel); mantaMixer.clipAction(gltf.animations[0]).play(); }
    mantaRig.position.copy(mantaState.pos);
  }, undefined, (err) => console.error("Gagal load Manta:", err));

  // Nemo
    gltfLoader.load("./models/Nemo.glb", (gltf) => {
    nemoRig = new THREE.Group(); _scene.add(nemoRig);
    const nemoModel = gltf.scene; nemoModel.scale.set(1.5, 1.5, 1.5); nemoRig.add(nemoModel);
    if (gltf.animations.length) { nemoMixer = new THREE.AnimationMixer(nemoModel); nemoMixer.clipAction(gltf.animations[0]).play(); }
    nemoRig.position.copy(nemoState.pos);
  }, undefined, (err) => console.error("Gagal load Nemo:", err));


  spawnAntekAntek("./models/Kelp.glb", 200, "kelp");
  spawnAntekAntek("./models/Rock 2.glb", 40, "rock");
  spawnAntekAntek("./models/Coral 2.glb", 40, "coralB");
  spawnAntekAntek("./models/Rock 1.glb", 20, "rock");
  spawnAntekAntek("./models/Rock 3.glb", 20, "rock");
  spawnAntekAntek("./models/Coral 1.glb", 20, "coral");
  spawnAntekAntek("./models/Starfish.glb", 50, "else");
}
