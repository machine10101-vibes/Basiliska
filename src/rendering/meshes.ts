import * as THREE from 'three';
import type { HeroClass } from '../game/types';

const matCache = new Map<string, THREE.MeshStandardMaterial>();

export function mat(
  color: number,
  opts: Partial<THREE.MeshStandardMaterialParameters> = {},
): THREE.MeshStandardMaterial {
  const key = `${color}_${opts.roughness ?? 0.8}_${opts.metalness ?? 0.06}_${opts.emissive ?? 0}_${opts.emissiveIntensity ?? 0}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.8,
      metalness: opts.metalness ?? 0.06,
      flatShading: opts.flatShading ?? true,
      ...opts,
    });
    matCache.set(key, m);
  }
  return m;
}

function addOutline(mesh: THREE.Mesh, scale = 1.07, color = 0x140c06): void {
  const outline = new THREE.Mesh(
    mesh.geometry,
    new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, depthWrite: false }),
  );
  outline.scale.setScalar(scale);
  outline.name = 'outline';
  mesh.add(outline);
}

function part(
  mesh: THREE.Mesh,
  parent: THREE.Object3D,
  outlineScale?: number,
): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (outlineScale) addOutline(mesh, outlineScale);
  parent.add(mesh);
  return mesh;
}

export function createSkyDome(): THREE.Mesh {
  const geo = new THREE.SphereGeometry(90, 24, 16);
  const matSky = new THREE.MeshBasicMaterial({
    color: 0x6a90b8,
    side: THREE.BackSide,
    fog: false,
  });
  const dome = new THREE.Mesh(geo, matSky);
  dome.name = 'sky';
  return dome;
}

export function createGround(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'ground';

  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(96, 96, 1, 1),
    mat(0x4a6b32, { roughness: 0.95, flatShading: true }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  grass.name = 'grass';
  g.add(grass);

  const plaza = new THREE.Mesh(
    new THREE.CircleGeometry(9.2, 28),
    mat(0x8a8070, { roughness: 0.88, metalness: 0.04 }),
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  plaza.receiveShadow = true;
  plaza.name = 'plaza';
  g.add(plaza);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(8.4, 9.2, 28),
    mat(0x6a6254, { roughness: 0.9 }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  ring.receiveShadow = true;
  g.add(ring);

  const addPath = (x: number, z: number, w: number, d: number, rot = 0) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(0x7a6e58, { roughness: 0.92 }));
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = rot;
    p.position.set(x, 0.018, z);
    p.receiveShadow = true;
    g.add(p);
  };
  addPath(0, 0, 4.2, 28);
  addPath(0, 0, 32, 3.6);

  return g;
}

export function createFountain(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'fountain';
  const stone = mat(0x8c8680, { roughness: 0.7, metalness: 0.08 });
  const water = mat(0x3a7aaa, {
    roughness: 0.15,
    metalness: 0.2,
    emissive: 0x1a4060,
    emissiveIntensity: 0.35,
  });

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.25, 0.45, 16), stone);
  basin.position.y = 0.22;
  part(basin, g, 1.03);

  const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.08, 16), water);
  pool.position.y = 0.42;
  part(pool, g);

  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 1.4, 8), stone);
  pillar.position.y = 1.05;
  part(pillar, g, 1.05);

  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.55, 0.28, 12), stone);
  bowl.position.y = 1.78;
  part(bowl, g, 1.04);

  const jet = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.7, 6),
    mat(0x8ec8e8, { emissive: 0x4488aa, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }),
  );
  jet.position.y = 2.2;
  jet.name = 'fountainJet';
  part(jet, g);

  return g;
}

export function createHouse(
  width: number,
  depth: number,
  height: number,
  roofColor = 0xa43a28,
): THREE.Group {
  const g = new THREE.Group();
  g.name = 'house';
  const plaster = mat(0xd8c4a0, { roughness: 0.9 });
  const timber = mat(0x4a3020, { roughness: 0.85 });
  const roof = mat(roofColor, { roughness: 0.72 });
  const dark = mat(0x2a1c12, { roughness: 0.8 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), plaster);
  body.position.y = height / 2;
  part(body, g, 1.02);

  const beam = new THREE.Mesh(new THREE.BoxGeometry(width + 0.08, 0.12, 0.12), timber);
  beam.position.set(0, height * 0.55, depth / 2 + 0.02);
  part(beam, g);
  const beam2 = beam.clone();
  beam2.position.z = -depth / 2 - 0.02;
  g.add(beam2);

  const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, depth) * 0.78, height * 0.7, 4), roof);
  roofMesh.position.y = height + height * 0.28;
  roofMesh.rotation.y = Math.PI / 4;
  part(roofMesh, g, 1.03);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.95, 0.08), dark);
  door.position.set(0, 0.48, depth / 2 + 0.04);
  part(door, g);

  const win = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.32, 0.06),
    mat(0xf0d878, { emissive: 0xaa8844, emissiveIntensity: 0.45 }),
  );
  win.position.set(-width * 0.28, height * 0.55, depth / 2 + 0.04);
  part(win, g);
  const win2 = win.clone();
  win2.position.x = width * 0.28;
  g.add(win2);

  return g;
}

export function createStall(color = 0x6a3a18): THREE.Group {
  const g = new THREE.Group();
  const wood = mat(0x5a3a22, { roughness: 0.88 });
  const cloth = mat(color, { roughness: 0.7 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.1), wood);
  table.position.y = 0.72;
  part(table, g);
  for (const sx of [-0.75, 0.75]) {
    for (const sz of [-0.4, 0.4]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.1), wood);
      leg.position.set(sx, 0.36, sz);
      part(leg, g);
    }
  }
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.08, 1.35), cloth);
  canopy.position.y = 1.55;
  part(canopy, g, 1.02);
  const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.55, 6), wood);
  poleL.position.set(-0.9, 0.78, -0.5);
  part(poleL, g);
  const poleR = poleL.clone();
  poleR.position.x = 0.9;
  g.add(poleR);
  return g;
}

export function createLamp(): THREE.Group {
  const g = new THREE.Group();
  const iron = mat(0x2a2420, { metalness: 0.45, roughness: 0.45 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.4, 6), iron);
  pole.position.y = 1.2;
  part(pole, g);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 6),
    mat(0xffd878, { emissive: 0xffaa44, emissiveIntensity: 1.4, roughness: 0.3 }),
  );
  lamp.position.y = 2.45;
  lamp.name = 'lampGlow';
  part(lamp, g);
  return g;
}

function solidWall(length: number): THREE.Group {
  const g = new THREE.Group();
  const stone = mat(0x7a7468, { roughness: 0.82 });
  const top = mat(0x5a5448, { roughness: 0.78 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(length, 2.15, 0.7), stone);
  body.position.y = 1.08;
  part(body, g, 1.015);
  const merlonCount = Math.max(2, Math.floor(length / 1.4));
  for (let i = 0; i < merlonCount; i++) {
    const t = merlonCount === 1 ? 0 : (i / (merlonCount - 1) - 0.5) * (length - 0.6);
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.78), top);
    merlon.position.set(t, 2.3, 0);
    part(merlon, g);
  }
  return g;
}

/** `gap` cuts a walkable opening in the middle (north/south gates). */
export function createWallSegment(length: number, gap = 0): THREE.Group {
  if (gap <= 0) return solidWall(length);
  const g = new THREE.Group();
  const side = (length - gap) / 2;
  if (side <= 0.4) return solidWall(length);
  const left = solidWall(side);
  left.position.x = -(gap / 2 + side / 2);
  const right = solidWall(side);
  right.position.x = gap / 2 + side / 2;
  g.add(left, right);
  return g;
}

export function createGate(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'gate';
  const stone = mat(0x6e685c, { roughness: 0.8 });
  const wood = mat(0x3e2816, { roughness: 0.86 });
  const left = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.6, 1.3), stone);
  left.position.set(-2.4, 1.8, 0);
  part(left, g, 1.02);
  const right = left.clone();
  right.position.x = 2.4;
  g.add(right);
  const arch = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.1, 1.15), stone);
  arch.position.set(0, 3.15, 0);
  part(arch, g, 1.02);
  const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.5, 0.16), wood);
  doorL.position.set(-1.45, 1.25, 0.42);
  doorL.rotation.y = 0.72;
  part(doorL, g);
  const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.5, 0.16), wood);
  doorR.position.set(1.45, 1.25, 0.42);
  doorR.rotation.y = -0.72;
  part(doorR, g);
  return g;
}

export function createTree(seed = 1): THREE.Group {
  const g = new THREE.Group();
  g.name = 'tree';
  const bark = mat(0x3a2818, { roughness: 0.95 });
  const leaf = mat(seed % 2 === 0 ? 0x2f6a28 : 0x3a7a30, { roughness: 0.88 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.7, 6), bark);
  trunk.position.y = 0.85;
  part(trunk, g, 1.06);
  const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 0), leaf);
  canopy.position.y = 2.15;
  canopy.scale.set(1.15, 0.95, 1.1);
  part(canopy, g, 1.04);
  const canopy2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), leaf);
  canopy2.position.set(0.35, 2.55, -0.15);
  part(canopy2, g);
  return g;
}

export function createHerb(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'herb';
  const leaf = mat(0x4aaa3a, { roughness: 0.7, emissive: 0x226622, emissiveIntensity: 0.15 });
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.42, 4), leaf);
    const a = (i / 5) * Math.PI * 2;
    blade.position.set(Math.cos(a) * 0.12, 0.2, Math.sin(a) * 0.12);
    blade.rotation.z = Math.cos(a) * 0.4;
    blade.rotation.x = Math.sin(a) * 0.4;
    part(blade, g);
  }
  return g;
}

export function createDummy(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'dummy';
  const wood = mat(0x6a4a28, { roughness: 0.86 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.7, 6), wood);
  pole.position.y = 0.85;
  part(pole, g, 1.06);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.7, 8), wood);
  torso.position.y = 1.35;
  torso.name = 'dummyTorso';
  part(torso, g, 1.05);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), wood);
  head.position.y = 1.85;
  part(head, g, 1.08);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.12, 0.12), wood);
  arm.position.y = 1.4;
  part(arm, g);
  return g;
}

function contactShadow(parent: THREE.Group, r = 0.38): void {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(r, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.36, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  shadow.name = 'contactShadow';
  parent.add(shadow);
}

export function createPlayerMesh(heroClass: HeroClass): THREE.Group {
  const g = new THREE.Group();
  g.name = 'player';
  contactShadow(g, 0.4);

  const skin = mat(0xc8a07c, { roughness: 0.7 });
  const hair = mat(heroClass === 'sage' ? 0x2a2038 : 0x1a120c, { roughness: 0.95 });

  let cloth: THREE.MeshStandardMaterial;
  let accent: THREE.MeshStandardMaterial;
  let metal = mat(0xd0d6dc, { metalness: 0.82, roughness: 0.22 });
  if (heroClass === 'vanguard') {
    cloth = mat(0x3a3e48, { roughness: 0.55, metalness: 0.35 });
    accent = mat(0xc9a227, { metalness: 0.55, roughness: 0.35 });
  } else if (heroClass === 'sage') {
    cloth = mat(0x2a3a78, { roughness: 0.78 });
    accent = mat(0x6ea8ff, { emissive: 0x2244aa, emissiveIntensity: 0.25 });
  } else {
    cloth = mat(0x2a4a28, { roughness: 0.82 });
    accent = mat(0x7a5030, { roughness: 0.7 });
  }

  const makeLeg = (side: number, name: string) => {
    const leg = new THREE.Group();
    leg.name = name;
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.42, 6), cloth);
    thigh.position.y = 0.52;
    part(thigh, leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.24), mat(0x2a1a10));
    boot.position.set(0, 0.08, 0.04);
    part(boot, leg);
    leg.position.set(side * 0.14, 0, 0);
    g.add(leg);
  };
  makeLeg(-1, 'legL');
  makeLeg(1, 'legR');

  const torso = new THREE.Group();
  torso.name = 'playerTorso';
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.55, 0.3), cloth);
  chest.position.y = 1.12;
  part(chest, torso, 1.05);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.32), accent);
  belt.position.y = 0.84;
  part(belt, torso);
  g.add(torso);

  const head = new THREE.Group();
  head.name = 'playerHead';
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), skin);
  skull.position.y = 1.52;
  part(skull, head, 1.08);
  const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), hair);
  hairMesh.position.set(0, 1.58, -0.02);
  hairMesh.scale.set(1, 0.7, 1.05);
  part(hairMesh, head);
  if (heroClass === 'vanguard') {
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 8), metal);
    helm.position.y = 1.66;
    part(helm, head, 1.05);
  }
  if (heroClass === 'sage') {
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.32, 6), cloth);
    hood.position.y = 1.72;
    part(hood, head);
  }
  g.add(head);

  const makeArm = (side: number, name: string) => {
    const arm = new THREE.Group();
    arm.name = name;
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.4, 6), cloth);
    upper.position.set(0, -0.18, 0);
    part(upper, arm);
    arm.position.set(side * 0.32, 1.28, 0);
    g.add(arm);
    return arm;
  };
  const armL = makeArm(-1, 'armL');
  const armR = makeArm(1, 'armR');

  const tool = new THREE.Group();
  tool.name = 'toolRoot';
  if (heroClass === 'vanguard') {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.04), metal);
    blade.position.y = 0.45;
    part(blade, tool);
    const hilt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.08), accent);
    part(hilt, tool);
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 6), metal);
    shield.rotation.z = Math.PI / 2;
    shield.position.set(-0.62, 1.1, 0.12);
    shield.name = 'shield';
    part(shield, g);
  } else if (heroClass === 'sage') {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.35, 6), mat(0x4a3018));
    shaft.position.y = 0.4;
    part(shaft, tool);
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12),
      mat(0x6ea8ff, { emissive: 0x3366ff, emissiveIntensity: 0.9 }),
    );
    gem.position.y = 1.1;
    gem.name = 'staffGem';
    part(gem, tool);
  } else {
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 6, 10, Math.PI), mat(0x5a3a18));
    bow.rotation.y = Math.PI / 2;
    part(bow, tool);
  }
  tool.position.set(0.38, 1.05, 0.12);
  g.add(tool);
  void armL;
  void armR;

  return g;
}

export function createNpc(kind: 'herald' | 'smith' | 'alchemist' | 'inn'): THREE.Group {
  const g = new THREE.Group();
  g.name = `npc-${kind}`;
  contactShadow(g, 0.34);
  const palettes = {
    herald: { cloth: 0x8a2a2a, accent: 0xc9a227 },
    smith: { cloth: 0x3a322c, accent: 0x888888 },
    alchemist: { cloth: 0x2a4a6a, accent: 0x66ccee },
    inn: { cloth: 0x6a3a18, accent: 0xd4a060 },
  } as const;
  const p = palettes[kind];
  const cloth = mat(p.cloth);
  const skin = mat(0xc4a07a);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.95, 8), cloth);
  body.position.y = 0.7;
  part(body, g, 1.05);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), skin);
  head.position.y = 1.32;
  part(head, g, 1.08);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.16, 8), mat(p.accent));
  hat.position.y = 1.48;
  part(hat, g);
  return g;
}

export function createWolf(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'wolf';
  contactShadow(g, 0.45);
  const fur = mat(0x5a5a62, { roughness: 0.92 });
  const dark = mat(0x2a2a30, { roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.95), fur);
  body.position.set(0, 0.48, 0);
  body.name = 'wolfBody';
  part(body, g, 1.05);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.32), fur);
  head.position.set(0, 0.55, 0.58);
  head.name = 'wolfHead';
  part(head, g, 1.06);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.18), dark);
  snout.position.set(0, 0.48, 0.78);
  part(snout, g);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.42, 5), dark);
  tail.position.set(0, 0.55, -0.62);
  tail.rotation.x = Math.PI / 2.4;
  tail.name = 'wolfTail';
  part(tail, g);
  for (const [x, z] of [
    [-0.14, 0.28],
    [0.14, 0.28],
    [-0.14, -0.28],
    [0.14, -0.28],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.32, 5), dark);
    leg.position.set(x, 0.16, z);
    part(leg, g);
  }
  return g;
}

export function createGoblin(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'goblin';
  contactShadow(g, 0.3);
  const hide = mat(0x3a6a28, { roughness: 0.85 });
  const dark = mat(0x2a3a18);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 7, 5), hide);
  body.scale.set(1, 1.15, 0.85);
  body.position.y = 0.55;
  body.name = 'goblinBody';
  part(body, g, 1.06);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 5), hide);
  head.position.y = 0.95;
  head.name = 'goblinHead';
  part(head, g, 1.08);
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 4), hide);
  earL.position.set(-0.18, 1.08, 0);
  earL.rotation.z = 0.6;
  part(earL, g);
  const earR = earL.clone();
  earR.position.x = 0.18;
  earR.rotation.z = -0.6;
  g.add(earR);
  const club = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.7, 5), dark);
  club.position.set(0.32, 0.55, 0.1);
  club.rotation.z = -0.5;
  club.name = 'goblinClub';
  part(club, g);
  return g;
}

export function createCrawler(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'crawler';
  contactShadow(g, 0.4);
  const chitin = mat(0x4a2a58, { roughness: 0.45, metalness: 0.15 });
  const glow = mat(0xaa44cc, { emissive: 0x6611aa, emissiveIntensity: 0.55 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), chitin);
  body.scale.set(1.15, 0.55, 1.4);
  body.position.y = 0.28;
  body.name = 'crawlerBody';
  part(body, g, 1.05);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), glow);
  head.position.set(0, 0.28, 0.48);
  part(head, g);
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1;
    const z = ((i % 3) - 1) * 0.22;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38, 4), chitin);
    leg.position.set(side * 0.28, 0.16, z);
    leg.rotation.z = side * 0.85;
    part(leg, g);
  }
  return g;
}

export function createMoveMarker(): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.42, 20),
    new THREE.MeshBasicMaterial({
      color: 0xe8c85a,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  ring.name = 'moveMarker';
  return ring;
}

export function createGodRays(): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({
    color: 0xffe6a8,
    transparent: true,
    opacity: 0.045,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 5; i++) {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 14), m);
    plane.position.set(-8 + i * 5.2, 8, -10 + (i % 2) * 4);
    plane.rotation.x = 0.35;
    g.add(plane);
  }
  return g;
}

/** Clone cached materials so hit-flash does not light up every matching mesh. */
export function uniqueMaterials(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (Array.isArray(obj.material)) {
      obj.material = obj.material.map((m) => m.clone());
    } else if (obj.material) {
      obj.material = obj.material.clone();
    }
  });
}

export function flashMesh(root: THREE.Object3D, color = 0xffeedd): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
      const mat = obj.material;
      const prev = mat.emissive.getHex();
      const prevI = mat.emissiveIntensity;
      mat.emissive.setHex(color);
      mat.emissiveIntensity = 0.85;
      setTimeout(() => {
        mat.emissive.setHex(prev);
        mat.emissiveIntensity = prevI;
      }, 90);
    }
  });
}
