import * as THREE from 'three';

function get(root: THREE.Object3D, name: string): THREE.Object3D | undefined {
  return root.getObjectByName(name);
}

export const PLAYER_ATTACK_DURATION = 0.42;
export const PLAYER_ATTACK_CONNECT_START = 0.16;
export const PLAYER_ATTACK_CONNECT_END = 0.28;

export function turnTowardYaw(obj: THREE.Object3D, targetYaw: number, dt: number, rate = 8): void {
  let d = targetYaw - obj.rotation.y;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  obj.rotation.y += d * Math.min(1, dt * rate);
}

export function resetPlayerPose(player: THREE.Group): void {
  for (const name of ['legL', 'legR', 'armL', 'armR', 'playerHead', 'playerTorso', 'toolRoot']) {
    const n = get(player, name);
    if (n) n.rotation.set(0, 0, 0);
  }
  const tool = get(player, 'toolRoot');
  if (tool) tool.position.set(0.38, 1.05, 0.12);
  player.position.y = 0;
}

export function animatePlayerIdle(player: THREE.Group, t: number): void {
  const breath = Math.sin(t * 1.4) * 0.016;
  const torso = get(player, 'playerTorso');
  const head = get(player, 'playerHead');
  const tool = get(player, 'toolRoot');
  if (torso) torso.rotation.x = breath;
  if (head) head.rotation.x = breath * 0.4;
  if (tool) tool.rotation.z = Math.sin(t * 0.9) * 0.04;
}

export function animatePlayerWalk(player: THREE.Group, t: number, blend: number): void {
  const b = Math.max(0, Math.min(1, blend));
  const phase = t * 9.2;
  const stride = Math.sin(phase) * 0.55 * b;
  const legL = get(player, 'legL');
  const legR = get(player, 'legR');
  const armL = get(player, 'armL');
  const armR = get(player, 'armR');
  const torso = get(player, 'playerTorso');
  if (legL) legL.rotation.x = stride;
  if (legR) legR.rotation.x = -stride;
  if (armL) armL.rotation.x = -stride * 0.7;
  if (armR) armR.rotation.x = stride * 0.7;
  if (torso) torso.rotation.z = Math.sin(phase) * 0.04 * b;
  player.position.y = Math.abs(Math.sin(phase)) * 0.035 * b;
}

export function animatePlayerAttack(player: THREE.Group, t: number, heroClass: string): void {
  const u = Math.max(0, Math.min(1, t));
  const swing = u < 0.35 ? u / 0.35 : 1 - (u - 0.35) / 0.65;
  const armR = get(player, 'armR');
  const tool = get(player, 'toolRoot');
  const torso = get(player, 'playerTorso');
  if (heroClass === 'sage') {
    if (armR) armR.rotation.x = -1.1 * swing;
    if (tool) tool.rotation.x = -0.8 * swing;
  } else if (heroClass === 'archer') {
    if (armR) armR.rotation.x = -0.4 * swing;
    if (tool) tool.rotation.y = 0.6 * swing;
  } else {
    if (armR) armR.rotation.x = -1.4 * swing;
    if (tool) tool.rotation.x = -1.2 * swing;
  }
  if (torso) torso.rotation.y = 0.25 * swing;
}

export function animateHitFlinch(root: THREE.Object3D, t: number, inten = 1): void {
  const k = Math.max(0, t) * inten;
  root.rotation.z = Math.sin(k * 28) * 0.12 * k;
}

export function animateDeath(root: THREE.Object3D, t: number): void {
  const u = Math.max(0, Math.min(1, t));
  root.rotation.x = u * 1.25;
  root.position.y = Math.sin(u * Math.PI) * 0.15;
  root.scale.setScalar(1 - u * 0.15);
}

export function animateQuadWalk(root: THREE.Object3D, t: number, blend: number): void {
  const body = get(root, 'wolfBody') ?? get(root, 'crawlerBody') ?? get(root, 'goblinBody');
  if (body) body.rotation.z = Math.sin(t * 10) * 0.08 * blend;
  const tail = get(root, 'wolfTail');
  if (tail) tail.rotation.y = Math.sin(t * 8) * 0.4;
}

export function animateMobAttack(root: THREE.Object3D, t: number): void {
  const u = Math.max(0, Math.min(1, t));
  const swing = u < 0.4 ? u / 0.4 : 1 - (u - 0.4) / 0.6;
  root.rotation.x = -0.25 * swing;
  const club = get(root, 'goblinClub');
  if (club) club.rotation.z = -0.5 - swing * 1.1;
  const head = get(root, 'wolfHead') ?? get(root, 'goblinHead');
  if (head) head.rotation.x = 0.35 * swing;
}
