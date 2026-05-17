import * as THREE from 'three';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050505');
  scene.fog = new THREE.Fog('#050505', 6, 32);

  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.rotation.order = 'YXZ';

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  const ambient = new THREE.AmbientLight(0x111111, 0.55);
  const keyLight = new THREE.SpotLight(0x7f8cff, 7, 30, Math.PI / 3, 0.35, 1);
  const fill = new THREE.PointLight(0x223344, 0.4, 24);
  const back = new THREE.SpotLight(0x441122, 2.6, 16, Math.PI / 4, 0.6, 1);

  keyLight.position.set(4, 5, 2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  fill.position.set(-3, 4, -2);
  back.position.set(0, 3, 4);

  scene.add(ambient, keyLight, fill, back);

  const floorGeo = new THREE.PlaneGeometry(80, 80);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.95, metalness: 0.03 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.position.y = -0.01;
  scene.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 1 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 10;
  scene.add(ceiling);

  const cameraLight = new THREE.PointLight(0x80a0ff, 1.2, 6);
  camera.add(cameraLight);

  return {
    scene,
    camera,
    renderer,
    lights: {
      ambient,
      keyLight,
      fill,
      back,
      cameraLight,
    },
    overlays: createOverlays(),
  };
}

function createOverlays() {
  const hud = document.createElement('div');
  hud.id = 'oblind-hud';
  hud.style.cssText = [
    'position:fixed',
    'inset:0',
    'pointer-events:none',
    'font-family:Georgia,\"Times New Roman\",serif',
    'color:#d9deff',
    'text-shadow:0 0 12px #000',
    'font-size:14px',
    'mix-blend-mode:screen',
    'padding:14px',
    'user-select:none',
  ].join(';');

  const prompt = document.createElement('div');
  prompt.id = 'oblind-interact';
  prompt.style.cssText = 'position:absolute; right:20px; top:20px; text-align:right';

  const crosshair = document.createElement('div');
  crosshair.id = 'oblind-crosshair';
  crosshair.style.cssText = [
    'position:absolute',
    'left:50%',
    'top:50%',
    'width:8px',
    'height:8px',
    'margin-left:-4px',
    'margin-top:-4px',
    'border:1px solid rgba(160,170,255,0.85)',
    'background:rgba(160,170,255,0.25)',
    'box-shadow:0 0 8px rgba(130,170,255,0.55)',
    'pointer-events:none',
  ].join(';');

  const vignette = document.createElement('div');
  vignette.id = 'oblind-vignette';
  vignette.style.cssText = [
    'position:fixed',
    'inset:0',
    'pointer-events:none',
    'box-shadow: inset 0 0 120px 32px rgba(0,0,0,0.75)',
    'z-index:3',
  ].join(';');

  const grain = document.createElement('div');
  grain.id = 'oblind-grain';
  grain.style.cssText = [
    'position:fixed',
    'inset:0',
    'pointer-events:none',
    'background:radial-gradient(circle at 25% 25%, rgba(255,255,255,0.04) 1px, transparent 0), radial-gradient(circle at 45% 35%, rgba(255,255,255,0.04) 0.8px, transparent 0)',
    'opacity:0.18',
    'mix-blend-mode:screen',
    'z-index:2',
  ].join(';');

  hud.appendChild(prompt);
  hud.appendChild(crosshair);
  hud.appendChild(grain);
  hud.appendChild(vignette);

  return { hud, prompt };
}

export function buildRoomGeometry(scene, rooms) {
  const group = new THREE.Group();
  scene.remove(scene.getObjectByName('rooms'));
  group.name = 'rooms';

  rooms.forEach((room) => {
    for (const block of room.layout) {
      const geo = new THREE.BoxGeometry(block.size[0], block.size[1], block.size[2]);
      const mat = createBlockMaterial(block);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(block.position[0], block.position[1], block.position[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    for (const decor of room.decor ?? []) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(decor.radiusTop, decor.radiusBottom, decor.height, 12),
        new THREE.MeshStandardMaterial({ color: decor.color, roughness: 1, emissive: decor.color, emissiveIntensity: 0.05 }),
      );
      mesh.position.set(decor.position[0], decor.position[1], decor.position[2]);
      group.add(mesh);
    }
  });

  scene.add(group);
}

function createBlockMaterial(block) {
  if (block.material === 'debug-basic') {
    const material = new THREE.MeshBasicMaterial({
      color: block.color,
      side: THREE.DoubleSide,
    });
    material.toneMapped = false;
    return material;
  }

  return new THREE.MeshStandardMaterial({
    color: block.color,
    roughness: block.roughness,
    metalness: block.metalness,
  });
}

export function positionCameraFromMovement(camera, euler, move, look, delta = 1 / 60) {
  const speed = 2.6;
  euler.x = 0;
  euler.y -= look.x * 0.06;
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(euler);
  const right = new THREE.Vector3(1, 0, 0).applyEuler(euler);

  const dir = new THREE.Vector3();
  dir.addScaledVector(forward, -move.y);
  dir.addScaledVector(right, move.x);

  if (dir.lengthSq() > 0) {
    dir.normalize();
    camera.position.addScaledVector(dir, speed * delta);
  }

  camera.rotation.x = euler.x;
  camera.rotation.y = euler.y;
}

export function keepWithinRoom(camera, rooms) {
  const room = rooms[0];
  const limit = room?.bounds;
  if (!limit) return;

  camera.position.x = Math.max(limit.minX, Math.min(limit.maxX, camera.position.x));
  camera.position.y = Math.max(1, Math.min(limit.maxY, camera.position.y));
  camera.position.z = Math.max(limit.minZ, Math.min(limit.maxZ, camera.position.z));
}
