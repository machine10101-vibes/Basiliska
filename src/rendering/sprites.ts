import * as THREE from 'three';
import { Pix, makeCanvas } from './pixel';

export type AnimName = 'idle' | 'walk' | 'attack' | 'cast' | 'death';
export type WeaponKind = 'none' | 'sword' | 'staff' | 'bow' | 'club';
export type HatKind = 'none' | 'helm' | 'hood' | 'cap' | 'circlet' | 'wolfhood';
export type SpriteKind =
  | 'hero'
  | 'herald'
  | 'smith'
  | 'alchemist'
  | 'inn'
  | 'wolf'
  | 'goblin'
  | 'crawler'
  | 'dummy'
  | 'herb'
  | 'tree'
  | 'lamp';

export interface Gear {
  weapon: WeaponKind;
  hat: HatKind;
  shield: boolean;
}

export interface Palette {
  skin: string;
  skinSh: string;
  skinHi: string;
  cloth: string;
  clothSh: string;
  clothHi: string;
  accent: string;
  hair: string;
  hairSh: string;
  hairHi: string;
  outline: string;
  eye: string;
  blush: string;
  cut: 'armor' | 'robe' | 'tunic';
  ears?: boolean;
}

export const HERO_PALETTES: Record<'vanguard' | 'sage' | 'archer', Palette> = {
  vanguard: {
    skin: '#ffd4b0',
    skinSh: '#e09a70',
    skinHi: '#ffe8d4',
    cloth: '#6a7382',
    clothSh: '#3a4452',
    clothHi: '#9aa6b4',
    accent: '#e0c048',
    hair: '#4a2818',
    hairSh: '#2a140c',
    hairHi: '#7a4a28',
    outline: '#1a100c',
    eye: '#3a5aaa',
    blush: '#f09098',
    cut: 'armor',
  },
  sage: {
    skin: '#ffe0c8',
    skinSh: '#e0a888',
    skinHi: '#fff0e0',
    cloth: '#4a58a0',
    clothSh: '#2a3870',
    clothHi: '#7a88c8',
    accent: '#a8d4ff',
    hair: '#d4c0f0',
    hairSh: '#9880c8',
    hairHi: '#f0e8ff',
    outline: '#181028',
    eye: '#7048c0',
    blush: '#f4a0b0',
    cut: 'robe',
  },
  archer: {
    skin: '#f8cc9c',
    skinSh: '#d49a68',
    skinHi: '#ffe0bc',
    cloth: '#3d7a40',
    clothSh: '#245028',
    clothHi: '#5aaa58',
    accent: '#d08040',
    hair: '#7a3c18',
    hairSh: '#4a200c',
    hairHi: '#b06030',
    outline: '#14200c',
    eye: '#2a8a38',
    blush: '#e87880',
    cut: 'tunic',
  },
};

const NPC_PAL: Record<string, Palette> = {
  herald: {
    skin: '#ffd4b0',
    skinSh: '#e09a70',
    skinHi: '#ffe8d4',
    cloth: '#9a2a2a',
    clothSh: '#5a1414',
    clothHi: '#c84848',
    accent: '#e0c048',
    hair: '#d0b070',
    hairSh: '#8a7038',
    hairHi: '#ead090',
    outline: '#1a100c',
    eye: '#3a5aaa',
    blush: '#f09098',
    cut: 'armor',
  },
  smith: {
    skin: '#e0a878',
    skinSh: '#b07848',
    skinHi: '#f0c8a0',
    cloth: '#3a322c',
    clothSh: '#221c18',
    clothHi: '#5a5048',
    accent: '#989898',
    hair: '#2a2018',
    hairSh: '#100c08',
    hairHi: '#4a3a28',
    outline: '#100c08',
    eye: '#5a3a20',
    blush: '#d08070',
    cut: 'tunic',
  },
  alchemist: {
    skin: '#ffe0c8',
    skinSh: '#e0a888',
    skinHi: '#fff0e0',
    cloth: '#2a5a72',
    clothSh: '#163848',
    clothHi: '#4a88a0',
    accent: '#66ddee',
    hair: '#ece6d0',
    hairSh: '#b0a888',
    hairHi: '#fff8e8',
    outline: '#0c1820',
    eye: '#2288aa',
    blush: '#f0a0a8',
    cut: 'robe',
  },
  inn: {
    skin: '#f0c090',
    skinSh: '#c89060',
    skinHi: '#ffdcb0',
    cloth: '#7a4218',
    clothSh: '#4a2810',
    clothHi: '#a86830',
    accent: '#e0b060',
    hair: '#8a4828',
    hairSh: '#5a2810',
    hairHi: '#c07040',
    outline: '#1a1008',
    eye: '#5a4020',
    blush: '#e88880',
    cut: 'tunic',
  },
};

const GOBLIN_PAL: Palette = {
  skin: '#7cbc48',
  skinSh: '#4a8a28',
  skinHi: '#b0e070',
  cloth: '#5a3a20',
  clothSh: '#3a2410',
  clothHi: '#7a5430',
  accent: '#c09040',
  hair: '#2a5a18',
  hairSh: '#163810',
  hairHi: '#3a7a28',
  outline: '#14200c',
  eye: '#e8f060',
  blush: '#c07060',
  cut: 'tunic',
  ears: false,
};

const W = 80;
const H = 96;

function pose(anim: AnimName, frame: number, dir: number) {
  let bob =
    anim === 'walk' ? Math.abs(Math.sin((frame / 6) * Math.PI * 2)) * 2.2
    : anim === 'idle' ? Math.sin((frame / 8) * Math.PI * 2) * 0.8
    : anim === 'death' ? frame * 3
    : 0;
  let legL = 0;
  let legR = 0;
  let armL = 0;
  let armR = 0;
  let lean = 0;
  let swing = 0;
  if (anim === 'walk') {
    const t = (frame / 6) * Math.PI * 2;
    legL = Math.sin(t) * 5;
    legR = -Math.sin(t) * 5;
    armL = -Math.sin(t) * 4;
    armR = Math.sin(t) * 4;
  } else if (anim === 'attack') {
    const u = frame / 5;
    swing = u < 0.35 ? u / 0.35 : 1 - (u - 0.35) / 0.65;
    armR = -8 + swing * 16;
    lean = swing * 3;
    armL = -swing * 2;
  } else if (anim === 'cast') {
    const u = frame / 5;
    armL = -10 - u * 2;
    armR = -10 - u * 2;
    bob += u * 1.8;
  } else if (anim === 'idle') {
    armL = Math.sin((frame / 8) * Math.PI * 2) * 1.0;
    armR = -armL;
  }
  const back = dir === 3 || dir === 4;
  const profile = dir === 2;
  return { bob, legL, legR, armL, armR, lean, swing, back, profile, dir };
}

type Pose = ReturnType<typeof pose>;

function drawEye(p: Pix, ex: number, ey: number, pal: Palette, blink: boolean, rx = 4, ry = 6): void {
  if (blink) {
    p.hline(ex - rx, ey + 1, rx * 2 + 1, pal.outline);
    p.hline(ex - rx + 1, ey + 2, rx * 2 - 1, pal.skinSh);
    return;
  }
  p.oval(ex, ey, rx, ry, '#fff8f4', pal.outline);
  p.oval(ex, ey + 1, Math.max(2, rx - 1), Math.max(3, ry - 2), pal.eye);
  p.disc(ex, ey + 1, 2, '#120814');
  p.p(ex - 1, ey - 2, '#ffffff');
  p.p(ex - 2, ey - 1, '#ffffff');
  p.p(ex, ey - 2, '#ffffff');
  p.p(ex + 1, ey + 3, '#c8d8ff');
  p.hline(ex - rx, ey - ry, rx * 2 + 1, pal.outline);
  p.p(ex - rx, ey - ry + 1, pal.outline);
  p.p(ex + rx, ey - ry + 1, pal.outline);
}

function drawFace(
  p: Pix,
  cx: number,
  hy: number,
  pal: Palette,
  po: Pose,
  anim: AnimName,
  frame: number,
  hat: HatKind,
): void {
  if (po.back) return;
  const blink = anim === 'idle' && frame === 7;
  const mad = anim === 'attack';
  const cast = anim === 'cast';
  const ey = hy + 3;
  const hooded = hat === 'hood' || hat === 'wolfhood';
  const threeQ = po.dir === 1;
  const twoEyes = !po.profile || hooded;

  if (twoEyes) {
    const ox = threeQ ? 2 : 0;
    drawEye(p, cx - 7 + ox, ey, pal, blink);
    drawEye(p, cx + 7 + ox, ey, pal, blink);
    if (mad) {
      p.hline(cx - 12 + ox, ey - 8, 5, pal.outline);
      p.hline(cx + 7 + ox, ey - 8, 5, pal.outline);
    }
  } else {
    drawEye(p, cx - 11, ey, pal, blink, 4, 6);
    p.p(cx - 16, hy + 5, pal.skinSh);
    p.p(cx - 17, hy + 6, pal.skinSh);
  }

  p.oval(cx - 12, hy + 10, 3, 2, pal.blush);
  p.oval(cx + 12, hy + 10, 3, 2, pal.blush);
  p.p(cx - 9, hy + 6, pal.skinHi);
  p.p(cx + 8, hy + 6, pal.skinHi);

  if (cast) {
    p.oval(cx, hy + 14, 2, 2, pal.outline);
    p.p(cx, hy + 14, pal.skin);
  } else if (mad) {
    p.hline(cx - 2, hy + 14, 5, pal.outline);
  } else {
    p.p(cx - 1, hy + 14, pal.skinSh);
    p.p(cx, hy + 15, pal.skinSh);
    p.p(cx + 1, hy + 14, pal.skinSh);
  }
}

function drawHairBack(p: Pix, cx: number, hy: number, pal: Palette, po: Pose, hat: HatKind): void {
  if (hat === 'hood' || hat === 'wolfhood') return;
  if (po.back) {
    p.oval(cx, hy - 2, 17, 18, pal.hair, pal.outline);
    p.oval(cx, hy + 6, 14, 12, pal.hairSh);
    return;
  }
  if (po.profile) {
    p.oval(cx + 6, hy - 2, 14, 17, pal.hair, pal.outline);
    return;
  }
  p.oval(cx, hy - 4, 17, 16, pal.hair, pal.outline);
  if (pal.cut === 'robe') {
    p.oval(cx - 16, hy + 8, 6, 14, pal.hair, pal.outline);
    p.oval(cx + 16, hy + 8, 6, 14, pal.hair, pal.outline);
  }
}

function drawHairFront(p: Pix, cx: number, hy: number, pal: Palette, po: Pose, hat: HatKind): void {
  if (po.back) return;

  if (po.profile) {
    p.oval(cx + 8, hy - 10, 10, 6, pal.hair, pal.outline);
    p.oval(cx + 12, hy + 2, 5, 10, pal.hair, pal.outline);
    p.hline(cx - 2, hy - 14, 8, pal.hair);
    return;
  }

  p.oval(cx, hy - 14, 16, 6, pal.hair, pal.outline);
  p.rect(cx - 14, hy - 18, 28, 5, pal.hair);
  p.oval(cx - 15, hy + 2, 5, 12, pal.hair, pal.outline);
  p.oval(cx + 15, hy + 2, 5, 12, pal.hair, pal.outline);
  p.hline(cx - 6, hy - 17, 6, pal.hairHi);
  p.p(cx - 5, hy - 18, pal.hairHi);

  if (hat === 'hood' || hat === 'wolfhood') {
    p.hline(cx - 8, hy - 12, 16, pal.hair);
    return;
  }

  if (pal.cut !== 'armor' && hat === 'none') {
    p.p(cx + 2, hy - 22, pal.hair);
    p.p(cx + 3, hy - 23, pal.hair);
    p.p(cx + 4, hy - 22, pal.outline);
    p.p(cx + 3, hy - 22, pal.hairHi);
  }
  if (pal.cut === 'tunic') {
    p.oval(cx + 17, hy - 2, 6, 12, pal.hair, pal.outline);
    p.disc(cx + 18, hy + 10, 5, pal.hair, pal.outline);
    p.p(cx + 16, hy + 8, pal.hairHi);
  }
}

function drawHatBack(p: Pix, cx: number, hy: number, pal: Palette, hat: HatKind): void {
  if (hat === 'hood') {
    p.oval(cx, hy - 2, 19, 20, pal.cloth, pal.outline);
    p.oval(cx, hy + 4, 16, 14, pal.clothSh);
  } else if (hat === 'wolfhood') {
    p.oval(cx, hy - 2, 18, 19, '#8a8a94', pal.outline);
    p.oval(cx, hy + 4, 14, 12, '#6a6a74');
  }
}

function drawHatFront(p: Pix, cx: number, hy: number, pal: Palette, po: Pose, hat: HatKind): void {
  if (hat === 'hood') {
    p.oval(cx - 18, hy + 3, 5, 12, pal.cloth, pal.outline);
    p.oval(cx + 18, hy + 3, 5, 12, pal.cloth, pal.outline);
    p.oval(cx, hy + 15, 14, 5, pal.cloth, pal.outline);
    p.hline(cx - 10, hy - 14, 20, pal.clothHi);
    return;
  }
  if (hat === 'wolfhood') {
    p.diamond(cx - 10, hy - 18, 5, 8, '#8a8a94', pal.outline);
    p.diamond(cx + 10, hy - 18, 5, 8, '#8a8a94', pal.outline);
    p.diamond(cx - 10, hy - 17, 3, 5, '#e8c8c8');
    p.diamond(cx + 10, hy - 17, 3, 5, '#e8c8c8');
    p.oval(cx - 16, hy + 3, 5, 11, '#6a6a74', pal.outline);
    p.oval(cx + 16, hy + 3, 5, 11, '#6a6a74', pal.outline);
    p.oval(cx, hy + 15, 13, 5, '#6a6a74', pal.outline);
    return;
  }
  if (hat === 'helm') {
    p.oval(cx, hy - 16, 16, 6, pal.clothHi, pal.outline);
    p.rect(cx - 15, hy - 18, 30, 5, pal.clothSh);
    p.hline(cx - 12, hy - 12, 24, pal.accent);
    p.oval(cx - 17, hy + 8, 4, 6, pal.clothSh, pal.outline);
    p.oval(cx + 17, hy + 8, 4, 6, pal.clothSh, pal.outline);
    p.p(cx, hy - 22, pal.accent);
    p.vline(cx, hy - 22, 6, pal.accent);
    return;
  }
  if (hat === 'cap') {
    p.oval(cx, hy - 16, 14, 6, pal.accent, pal.outline);
    p.rect(cx - 12, hy - 17, 24, 5, pal.cloth);
    if (!po.back) p.oval(cx, hy - 12, 10, 2, pal.clothSh, pal.outline);
    p.p(cx + 2, hy - 20, pal.hairHi);
    return;
  }
  if (hat === 'circlet') {
    p.hline(cx - 12, hy - 12, 24, pal.accent);
    p.hline(cx - 11, hy - 13, 22, pal.accent);
    p.disc(cx, hy - 15, 2, '#7ed47e', pal.outline);
    p.p(cx, hy - 16, '#e8ffe8');
  }
}

function drawBody(p: Pix, cx: number, chestY: number, hipY: number, pal: Palette, po: Pose): void {
  const rx = po.profile ? 9 : 12;
  if (pal.cut === 'robe') {
    p.oval(cx, hipY + 4, rx + 3, 13, pal.cloth, pal.outline);
    p.oval(cx, chestY, rx, 12, pal.cloth, pal.outline);
    p.oval(cx - 2, chestY - 2, 4, 6, pal.clothHi);
    p.hline(cx - 8, chestY + 6, 16, pal.accent);
    p.rect(cx - 2, chestY + 6, 4, 14, pal.accent);
    return;
  }
  if (pal.cut === 'armor') {
    p.oval(cx, hipY, rx - 1, 9, pal.cloth, pal.outline);
    p.oval(cx, chestY, rx, 11, pal.cloth, pal.outline);
    p.oval(cx, chestY - 1, rx - 3, 7, pal.clothHi);
    if (!po.profile) {
      p.oval(cx - 12, chestY, 5, 6, pal.clothSh, pal.outline);
      p.oval(cx + 12, chestY, 5, 6, pal.clothSh, pal.outline);
    }
    p.hline(cx - 8, hipY - 2, 16, pal.accent);
    p.p(cx, hipY - 3, pal.accent);
    return;
  }
  p.oval(cx, hipY, rx - 1, 9, pal.cloth, pal.outline);
  p.oval(cx, chestY, rx - 1, 11, pal.cloth, pal.outline);
  p.oval(cx - 2, chestY - 2, 4, 5, pal.clothHi);
  p.hline(cx - 7, hipY - 1, 14, pal.accent);
  p.oval(cx, chestY - 8, 8, 4, pal.accent, pal.outline);
}

function drawArm(
  p: Pix,
  x: number,
  y: number,
  pal: Palette,
  hand: string,
): void {
  p.oval(x, y + 4, 4, 8, pal.cloth, pal.outline);
  p.disc(x, y + 12, 3, hand, pal.outline);
  p.p(x - 1, y + 11, pal.skinHi);
}

function drawHuman(
  p: Pix,
  pal: Palette,
  anim: AnimName,
  frame: number,
  dir: number,
  gear: Gear,
): void {
  const po = pose(anim, frame, dir);
  const cx = 40 + (po.lean | 0);
  const base = 86 - (po.bob | 0);

  if (anim === 'death') {
    p.oval(40, 90, 16, 4, 'rgba(0,0,0,0.28)');
    p.oval(46, 74, 18, 10, pal.cloth, pal.outline);
    p.oval(62, 64, 14, 15, pal.skin, pal.outline);
    p.oval(62, 58, 12, 8, pal.hair, pal.outline);
    p.hline(56, 64, 5, pal.outline);
    p.hline(66, 64, 5, pal.outline);
    p.p(56, 64, pal.outline);
    p.p(70, 64, pal.outline);
    return;
  }

  p.oval(40, 92, 14, 4, 'rgba(0,0,0,0.32)');

  const footY = base;
  const boot = pal.clothSh;
  p.oval(cx - 7 + (po.legL | 0), footY - 3, 5, 4, boot, pal.outline);
  p.oval(cx + 7 + (po.legR | 0), footY - 3, 5, 4, boot, pal.outline);
  p.oval(cx - 6 + (po.legL | 0), footY - 9, 4, 6, pal.cloth, pal.outline);
  p.oval(cx + 6 + (po.legR | 0), footY - 9, 4, 6, pal.cloth, pal.outline);

  const hipY = footY - 16;
  const chestY = hipY - 10;
  const hy = chestY - 18;
  const hand = pal.skin;

  drawHatBack(p, cx, hy, pal, gear.hat);
  drawHairBack(p, cx, hy, pal, po, gear.hat);

  if (!po.back) {
    drawArm(p, cx - 14, chestY + (po.armL | 0), pal, hand);
  }

  drawBody(p, cx, chestY, hipY, pal, po);

  if (gear.shield && !po.back) {
    const sx = cx - 17;
    const sy = chestY + 6;
    p.oval(sx, sy, 8, 10, pal.accent, pal.outline);
    p.oval(sx, sy, 5, 7, pal.clothSh, pal.outline);
    p.p(sx, sy - 2, pal.accent);
    p.hline(sx - 2, sy, 5, pal.accent);
  }

  p.oval(cx, hy, 16, 18, pal.skin, pal.outline);

  if (
    pal.ears !== false &&
    (gear.hat === 'none' || gear.hat === 'circlet' || gear.hat === 'cap')
  ) {
    p.oval(cx - 17, hy + 2, 3, 4, pal.skin, pal.outline);
    p.oval(cx + 17, hy + 2, 3, 4, pal.skin, pal.outline);
  }

  drawHairFront(p, cx, hy, pal, po, gear.hat);
  drawHatFront(p, cx, hy, pal, po, gear.hat);

  if (!po.back) {
    p.oval(cx, hy + 2, 12, 13, pal.skin);
    p.oval(cx - 4, hy - 2, 5, 5, pal.skinHi);
    drawFace(p, cx, hy, pal, po, anim, frame, gear.hat);
  }

  drawArm(p, cx + 14, chestY + (po.armR | 0), pal, hand);
  if (po.back) {
    drawArm(p, cx - 14, chestY + (po.armL | 0), pal, hand);
  }

  drawWeapon(p, gear.weapon, cx, chestY, po.armR, po.swing, po.back, pal);
}

function drawWeapon(
  p: Pix,
  weapon: WeaponKind,
  cx: number,
  chestY: number,
  armR: number,
  swing: number,
  back: boolean,
  pal: Palette,
): void {
  const hx = cx + 16;
  const hy = chestY + 12 + (armR | 0);
  const lift = (swing * 12) | 0;
  if (weapon === 'sword') {
    const x = hx + (back ? -4 : 0);
    p.rect(x, hy - 22 - lift, 3, 20, '#e8eef4');
    p.p(x + 1, hy - 23 - lift, '#e8eef4');
    p.vline(x - 1, hy - 21 - lift, 18, pal.outline);
    p.vline(x + 3, hy - 21 - lift, 18, pal.outline);
    p.p(x, hy - 23 - lift, pal.outline);
    p.p(x + 2, hy - 23 - lift, pal.outline);
    p.rect(x - 3, hy - 3 - lift, 9, 3, pal.accent);
    p.hline(x - 3, hy - 4 - lift, 9, pal.outline);
    p.rect(x, hy - lift, 3, 6, '#6a4020');
  } else if (weapon === 'staff') {
    p.rect(hx + 1, hy - 26 - lift, 3, 32, '#7a5030');
    p.vline(hx, hy - 26 - lift, 32, pal.outline);
    p.vline(hx + 4, hy - 26 - lift, 32, pal.outline);
    p.disc(hx + 2, hy - 28 - lift, 6, pal.accent, pal.outline);
    p.disc(hx + 2, hy - 28 - lift, 3, '#e8f8ff');
    p.p(hx + 1, hy - 30 - lift, '#ffffff');
  } else if (weapon === 'bow') {
    for (let i = 0; i < 16; i++) {
      const ox = ((i - 8) * (i - 8)) / 10;
      p.p(hx + 2 + ox, hy - 18 + i, pal.accent);
      p.p(hx + 1 + ox, hy - 18 + i, pal.outline);
      p.p(hx + 3 + ox, hy - 18 + i, pal.outline);
    }
    p.vline(hx + 8, hy - 16, 12, '#f0e0c0');
  } else if (weapon === 'club') {
    p.rect(hx, hy - 8, 4, 16, '#5a3a18');
    p.vline(hx - 1, hy - 8, 16, pal.outline);
    p.vline(hx + 4, hy - 8, 16, pal.outline);
    p.disc(hx + 2, hy - 12, 7, '#6a4a22', pal.outline);
    p.p(hx, hy - 14, '#8a6a38');
  }
}

function drawWolf(p: Pix, anim: AnimName, frame: number, dir: number): void {
  const t = (frame / 6) * Math.PI * 2;
  const bob = anim === 'walk' ? Math.abs(Math.sin(t)) * 1.5 : 0;
  const y = 70 - (bob | 0);
  const left = dir === 4;
  const hx = left ? 24 : 56;
  const fur = '#8a8a96';
  const dark = '#3a3a48';
  const out = '#14141c';
  p.oval(40, 90, 16, 4, 'rgba(0,0,0,0.3)');
  p.oval(40, y + 4, 16, 10, fur, out);
  p.oval(hx, y - 6, 13, 13, fur, out);
  p.diamond(hx - 8, y - 18, 5, 8, fur, out);
  p.diamond(hx + 8, y - 18, 5, 8, fur, out);
  p.diamond(hx - 8, y - 17, 3, 5, '#e8c8c8');
  p.diamond(hx + 8, y - 17, 3, 5, '#e8c8c8');
  p.oval(hx + (left ? -8 : 8), y - 4, 7, 5, '#d0d0d8', out);
  if (!left) {
    p.oval(hx - 5, y - 7, 4, 5, '#fff8f4', out);
    p.oval(hx + 4, y - 7, 4, 5, '#fff8f4', out);
    p.disc(hx - 5, y - 6, 2, '#c04040');
    p.disc(hx + 4, y - 6, 2, '#c04040');
    p.p(hx - 6, y - 8, '#ffffff');
    p.p(hx + 3, y - 8, '#ffffff');
    p.disc(hx + 8, y - 2, 2, '#1a1018');
    p.p(hx + 4, y + 2, '#f09090');
    p.p(hx - 2, y + 2, '#f09090');
  } else {
    p.oval(hx - 6, y - 7, 4, 5, '#fff8f4', out);
    p.disc(hx - 6, y - 6, 2, '#c04040');
    p.p(hx - 7, y - 8, '#ffffff');
    p.disc(hx - 10, y - 2, 2, '#1a1018');
  }
  p.rect(26, y + 10, 5, 10 + (Math.sin(t) * 2 | 0), dark);
  p.rect(34, y + 10, 5, 10 + (-Math.sin(t) * 2 | 0), dark);
  p.rect(42, y + 10, 5, 10 + (Math.sin(t) * 2 | 0), dark);
  p.rect(50, y + 10, 5, 10 + (-Math.sin(t) * 2 | 0), dark);
  p.oval(left ? 58 : 22, y + 2, 5, 4, dark, out);
  if (anim === 'attack') p.disc(hx + (left ? -10 : 10), y, 3, '#f0d0d0');
}

function drawGoblin(p: Pix, anim: AnimName, frame: number, dir: number): void {
  drawHuman(p, GOBLIN_PAL, anim, frame, dir, { weapon: 'club', hat: 'none', shield: false });
  const po = pose(anim, frame, dir);
  const cx = 40 + (po.lean | 0);
  const hy = 86 - (po.bob | 0) - 16 - 10 - 18;
  if (anim === 'death') return;
  p.oval(cx - 18, hy - 4, 5, 8, GOBLIN_PAL.skin, GOBLIN_PAL.outline);
  p.oval(cx + 18, hy - 4, 5, 8, GOBLIN_PAL.skin, GOBLIN_PAL.outline);
  p.p(cx - 18, hy - 8, GOBLIN_PAL.skinHi);
  p.p(cx + 18, hy - 8, GOBLIN_PAL.skinHi);
  if (!po.back) {
    p.p(cx - 4, hy + 12, '#f0f0e0');
    p.p(cx + 4, hy + 12, '#f0f0e0');
  }
}

function drawCrawler(p: Pix, anim: AnimName, frame: number): void {
  const t = (frame / 6) * Math.PI * 2;
  const y = 74 + (Math.sin(t) | 0);
  p.oval(40, 90, 12, 3, 'rgba(0,0,0,0.28)');
  const shell = '#6a3880';
  const glow = '#dd77f0';
  const out = '#1a0820';
  p.oval(40, y + 4, 18, 10, shell, out);
  p.oval(40, y - 6, 14, 12, shell, out);
  p.oval(34, y - 8, 5, 6, '#fff0ff', out);
  p.oval(46, y - 8, 5, 6, '#fff0ff', out);
  p.disc(34, y - 7, 2, glow);
  p.disc(46, y - 7, 2, glow);
  p.p(33, y - 9, '#ffffff');
  p.p(45, y - 9, '#ffffff');
  p.disc(40, y - 2, 4, glow, out);
  for (let i = 0; i < 3; i++) {
    p.vline(26 + i * 10, y + 10, 8 + (Math.sin(t + i) * 2 | 0), shell);
    p.vline(34 + i * 10, y + 10, 8 + (-Math.sin(t + i) * 2 | 0), shell);
  }
}

function drawDummy(p: Pix, anim: AnimName, frame: number): void {
  p.oval(40, 92, 10, 3, 'rgba(0,0,0,0.3)');
  const wood = '#8a6238';
  const out = '#2a180c';
  p.rect(37, 36, 6, 50, wood);
  p.vline(36, 36, 50, out);
  p.vline(43, 36, 50, out);
  p.oval(40, 30, 12, 12, wood, out);
  p.oval(24, 48, 16, 4, wood, out);
  p.hline(28, 28, 4, out);
  p.hline(48, 28, 4, out);
  p.p(32, 32, '#3a2410');
  p.p(48, 32, '#3a2410');
  if (anim === 'death') p.rect(24, 72, 32, 8, wood);
  if (frame % 2 && anim === 'idle') p.p(36, 26, '#3a2410');
}

function drawHerb(p: Pix, frame: number): void {
  p.oval(40, 90, 7, 2, 'rgba(0,0,0,0.2)');
  const sway = Math.sin((frame / 4) * Math.PI * 2);
  for (let i = 0; i < 5; i++) {
    const a = -0.8 + i * 0.4;
    const x = 40 + ((Math.sin(a) * 9 + sway) | 0);
    p.vline(x, 76, 14, '#2a6a28');
    p.disc(x + (sway | 0), 74, 5, '#4aaa3a', '#1a4018');
  }
}

function drawTree(p: Pix, seed: number): void {
  p.oval(40, 92, 16, 4, 'rgba(0,0,0,0.28)');
  p.rect(36, 48, 8, 40, '#5a3a1c');
  p.vline(35, 48, 40, '#241408');
  p.vline(44, 48, 40, '#241408');
  const leaf = seed % 2 === 0 ? '#2f7a30' : '#3a8a38';
  p.disc(40, 34, 20, leaf, '#143818');
  p.disc(28, 42, 12, leaf, '#143818');
  p.disc(52, 40, 13, leaf, '#143818');
  p.disc(40, 22, 10, '#4aaa40', '#143818');
}

function drawLamp(p: Pix, frame: number): void {
  p.oval(40, 92, 7, 2, 'rgba(0,0,0,0.25)');
  p.rect(38, 36, 4, 52, '#2a2420');
  p.vline(37, 36, 52, '#100c08');
  p.vline(42, 36, 52, '#100c08');
  const glow = frame % 2 === 0 ? '#ffe088' : '#ffd060';
  p.disc(40, 30, 9, glow, '#4a3010');
  p.disc(40, 30, 4, '#fff6c8');
}

export function paintSprite(
  canvas: HTMLCanvasElement,
  kind: SpriteKind,
  anim: AnimName,
  frame: number,
  dir: number,
  gear: Gear,
  pal?: Palette,
): void {
  const ctx = canvas.getContext('2d')!;
  const p = new Pix(ctx, W, H);
  const flip = dir === 5 || dir === 6 || dir === 7;
  const d = flip ? (8 - dir) % 8 : dir;
  p.flip = flip;
  p.clear();
  if (kind === 'wolf') drawWolf(p, anim, frame, d);
  else if (kind === 'crawler') drawCrawler(p, anim, frame);
  else if (kind === 'dummy') drawDummy(p, anim, frame);
  else if (kind === 'herb') drawHerb(p, frame);
  else if (kind === 'tree') drawTree(p, frame);
  else if (kind === 'lamp') drawLamp(p, frame);
  else if (kind === 'goblin') drawGoblin(p, anim, frame, d);
  else {
    const palette = pal ?? (kind === 'hero' ? HERO_PALETTES.vanguard : NPC_PAL[kind] ?? NPC_PAL.herald);
    drawHuman(p, palette, anim, frame, d, gear);
  }
}

const FRAMES: Record<AnimName, number> = {
  idle: 8,
  walk: 6,
  attack: 6,
  cast: 6,
  death: 4,
};

export class SpriteActor {
  readonly group = new THREE.Group();
  readonly sprite: THREE.Sprite;
  facing = 0;
  kind: SpriteKind;
  gear: Gear;
  pal?: Palette;
  private canvas: HTMLCanvasElement;
  private tex: THREE.CanvasTexture;
  private anim: AnimName = 'idle';
  private frame = 0;
  private acc = 0;
  private lastKey = '';
  private flashT = 0;
  private mat: THREE.SpriteMaterial;

  constructor(kind: SpriteKind, gear: Gear, pal?: Palette, scaleX = 1.7, scaleY = 2.15) {
    this.kind = kind;
    this.gear = { ...gear };
    this.pal = pal;
    this.canvas = makeCanvas(W, H);
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.magFilter = THREE.NearestFilter;
    this.tex.minFilter = THREE.NearestFilter;
    this.tex.generateMipmaps = false;
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mat = new THREE.SpriteMaterial({
      map: this.tex,
      transparent: true,
      alphaTest: 0.15,
      depthWrite: true,
    });
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.scale.set(scaleX, scaleY, 1);
    this.sprite.center.set(0.5, 0);
    this.sprite.position.y = 0;
    this.sprite.name = kind;
    this.group.add(this.sprite);
    this.group.name = kind;
    this.redraw();
  }

  setGear(gear: Partial<Gear>): void {
    this.gear = { ...this.gear, ...gear };
    this.lastKey = '';
    this.redraw();
  }

  setAnim(anim: AnimName): void {
    if (this.anim === anim) return;
    this.anim = anim;
    this.frame = 0;
    this.acc = 0;
    this.redraw();
  }

  setAttackProgress(u: number): void {
    this.anim = 'attack';
    this.frame = Math.max(0, Math.min(5, Math.floor(u * 6)));
    this.redraw();
  }

  setCastProgress(u: number): void {
    this.anim = 'cast';
    this.frame = Math.max(0, Math.min(5, Math.floor(u * 6)));
    this.redraw();
  }

  turnToward(yaw: number, dt: number, rate = 10): void {
    let d = yaw - this.facing;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.facing += d * Math.min(1, dt * rate);
  }

  flash(): void {
    this.flashT = 0.12;
    this.mat.color.setHex(0xffece0);
  }

  update(dt: number, camYaw: number): void {
    if (this.flashT > 0) {
      this.flashT -= dt;
      if (this.flashT <= 0) this.mat.color.setHex(0xffffff);
    }
    this.acc += dt;
    const step =
      this.anim === 'walk' ? 0.09
      : this.anim === 'idle' ? 0.16
      : this.anim === 'death' ? 0.16
      : 0.08;
    if (this.anim !== 'attack' && this.anim !== 'cast' && this.acc >= step) {
      this.acc = 0;
      this.frame = (this.frame + 1) % FRAMES[this.anim];
    }
    this.redraw(camYaw);
  }

  private redraw(camYaw = Math.PI / 4): void {
    const rel = this.facing - camYaw + Math.PI;
    const dir = ((Math.round(rel / (Math.PI / 4)) % 8) + 8) % 8;
    const key = `${this.kind}_${this.anim}_${this.frame}_${dir}_${this.gear.weapon}_${this.gear.hat}_${this.gear.shield}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    paintSprite(this.canvas, this.kind, this.anim, this.frame, dir, this.gear, this.pal);
    this.tex.needsUpdate = true;
  }
}

export function heroGearFromItems(
  heroClass: 'vanguard' | 'sage' | 'archer',
  weaponId: string | null,
  hatId: string | null,
  shield: boolean,
): Gear {
  let weapon: WeaponKind = heroClass === 'sage' ? 'staff' : heroClass === 'archer' ? 'bow' : 'sword';
  if (weaponId === 'ash_staff') weapon = 'staff';
  else if (weaponId === 'briar_bow') weapon = 'bow';
  else if (weaponId === 'short_sword') weapon = 'sword';
  let hat: HatKind = 'none';
  if (hatId === 'iron_helm') hat = 'helm';
  else if (hatId === 'aether_hood') hat = 'hood';
  else if (hatId === 'briar_cap') hat = 'cap';
  else if (hatId === 'leaf_circlet') hat = 'circlet';
  else if (hatId === 'wolf_pelt') hat = 'wolfhood';
  return { weapon, hat, shield };
}

export function createHeroSprite(
  heroClass: 'vanguard' | 'sage' | 'archer',
  gear: Gear,
): SpriteActor {
  return new SpriteActor('hero', gear, HERO_PALETTES[heroClass], 2.5, 3.0);
}

export function createNpcSprite(kind: 'herald' | 'smith' | 'alchemist' | 'inn'): SpriteActor {
  const gear: Gear = {
    weapon: kind === 'smith' ? 'sword' : 'none',
    hat: kind === 'alchemist' ? 'hood' : kind === 'herald' ? 'helm' : kind === 'inn' ? 'cap' : 'none',
    shield: kind === 'herald',
  };
  return new SpriteActor(kind, gear, NPC_PAL[kind], 2.3, 2.76);
}

export function createMobSprite(kind: 'wolf' | 'goblin' | 'crawler' | 'dummy'): SpriteActor {
  const scale =
    kind === 'wolf' ? [2.7, 2.15]
    : kind === 'crawler' ? [2.2, 1.7]
    : kind === 'dummy' ? [1.9, 2.6]
    : [2.15, 2.58];
  return new SpriteActor(kind, { weapon: kind === 'goblin' ? 'club' : 'none', hat: 'none', shield: false }, undefined, scale[0], scale[1]);
}

export function createPropSprite(kind: 'herb' | 'tree' | 'lamp', seed = 0): SpriteActor {
  const scale =
    kind === 'tree' ? [2.7, 3.5]
    : kind === 'lamp' ? [1.15, 2.5]
    : [0.95, 1.15];
  const a = new SpriteActor(kind, { weapon: 'none', hat: 'none', shield: false }, undefined, scale[0], scale[1]);
  a.facing = seed;
  return a;
}

export function paintPortrait(canvas: HTMLCanvasElement, heroClass: 'vanguard' | 'sage' | 'archer'): void {
  const gear = heroGearFromItems(
    heroClass,
    heroClass === 'sage' ? 'ash_staff' : heroClass === 'archer' ? 'briar_bow' : 'short_sword',
    heroClass === 'sage' ? 'aether_hood' : heroClass === 'archer' ? 'briar_cap' : 'iron_helm',
    heroClass === 'vanguard',
  );
  paintSprite(canvas, 'hero', 'idle', 0, 0, gear, HERO_PALETTES[heroClass]);
}
