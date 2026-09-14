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
  inner: string;
  coat: string;
  coatSh: string;
  coatHi: string;
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
    skin: '#ffd2ae',
    skinSh: '#e0986c',
    skinHi: '#ffe8d6',
    cloth: '#8a94a0',
    clothSh: '#3a4450',
    clothHi: '#c4ccd4',
    inner: '#d0d6dc',
    coat: '#3a4250',
    coatSh: '#222830',
    coatHi: '#5a6470',
    accent: '#e0c048',
    hair: '#4a2214',
    hairSh: '#2a1008',
    hairHi: '#7a3c22',
    outline: '#140c08',
    eye: '#2e4ea8',
    blush: '#f08890',
    cut: 'armor',
  },
  sage: {
    skin: '#ffe0c8',
    skinSh: '#e0a888',
    skinHi: '#fff0e0',
    cloth: '#4a58a0',
    clothSh: '#2a3870',
    clothHi: '#7a88c8',
    inner: '#f2eefc',
    coat: '#3a4894',
    coatSh: '#242e68',
    coatHi: '#6a78c0',
    accent: '#a8d4ff',
    hair: '#c8b4e8',
    hairSh: '#8870c0',
    hairHi: '#ece4ff',
    outline: '#181028',
    eye: '#6840c0',
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
    inner: '#f0d8a8',
    coat: '#2c6230',
    coatSh: '#1a3c1c',
    coatHi: '#4a8a44',
    accent: '#d08040',
    hair: '#8a3c16',
    hairSh: '#4a1c08',
    hairHi: '#b85828',
    outline: '#14200c',
    eye: '#248038',
    blush: '#e87880',
    cut: 'tunic',
  },
};

const NPC_PAL: Record<string, Palette> = {
  herald: {
    skin: '#ffd2ae',
    skinSh: '#e0986c',
    skinHi: '#ffe8d6',
    cloth: '#9a2a2a',
    clothSh: '#5a1414',
    clothHi: '#c84848',
    inner: '#f0e0c8',
    coat: '#8a1e1e',
    coatSh: '#4a1010',
    coatHi: '#c04040',
    accent: '#e0c048',
    hair: '#d8b060',
    hairSh: '#8a7030',
    hairHi: '#f0d890',
    outline: '#1a100c',
    eye: '#2e4ea8',
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
    inner: '#6a5a4a',
    coat: '#2e2822',
    coatSh: '#141210',
    coatHi: '#4a4238',
    accent: '#989898',
    hair: '#1e1610',
    hairSh: '#0c0806',
    hairHi: '#3a3028',
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
    inner: '#e8f4f8',
    coat: '#245868',
    coatSh: '#143848',
    coatHi: '#4a88a0',
    accent: '#66ddee',
    hair: '#ece6d0',
    hairSh: '#b0a888',
    hairHi: '#fff8e8',
    outline: '#0c1820',
    eye: '#1e88aa',
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
    inner: '#f0d8b0',
    coat: '#6a3814',
    coatSh: '#3c200c',
    coatHi: '#a06030',
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
  inner: '#6a4a28',
  coat: '#4a3018',
  coatSh: '#2a1a0c',
  coatHi: '#6a4828',
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

function pose(anim: AnimName, frame: number, dir: number, weapon: WeaponKind = 'none') {
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
    legL = Math.sin(t) * 3;
    legR = -Math.sin(t) * 3;
    armL = -Math.sin(t) * 3;
    armR = Math.sin(t) * 3;
  } else if (anim === 'attack') {
    const u = frame / 5;
    swing = u < 0.35 ? u / 0.35 : 1 - (u - 0.35) / 0.65;
    if (weapon === 'bow') {
      armL = -6;
      armR = -4 - swing * 3;
      lean = swing * 2;
    } else {
      armR = -10 + swing * 18;
      lean = swing * 3;
      armL = -swing * 2;
    }
  } else if (anim === 'cast') {
    const u = frame / 5;
    armL = -10 - u * 2;
    armR = -10 - u * 2;
    bob += u * 1.8;
  } else if (anim === 'idle') {
    armL = Math.sin((frame / 8) * Math.PI * 2) * 1.0;
    armR = -armL;
  }
  const fullBack = dir === 4;
  const peekBack = dir === 3;
  const back = fullBack || peekBack;
  const profile = dir === 2;
  const threeQ = dir === 1;
  return { bob, legL, legR, armL, armR, lean, swing, back, fullBack, peekBack, profile, threeQ, dir };
}

type Pose = ReturnType<typeof pose>;

function bodyLayout(po: Pose) {
  const cx = 40 + (po.lean | 0);
  const footY = 91 - (po.bob | 0);
  const hipY = footY - 10;
  const chestY = hipY - 7;
  const hy = footY - 44;
  return { cx, footY, hipY, chestY, hy };
}

function drawEye(p: Pix, ex: number, ey: number, pal: Palette, blink: boolean, rx = 8, ry = 10): void {
  if (blink) {
    p.hline(ex - rx, ey + 3, rx * 2 + 1, pal.outline);
    p.hline(ex - rx + 1, ey + 4, rx * 2 - 1, pal.skinSh);
    return;
  }
  p.oval(ex, ey, rx, ry, '#ffffff', pal.outline);
  p.oval(ex, ey + 3, Math.max(4, rx - 1), Math.max(5, ry - 2), pal.eye);
  p.oval(ex + 1, ey + 4, Math.max(2, rx - 4), Math.max(3, ry - 5), '#140c18');
  p.disc(ex, ey + 4, 2, '#08040c');
  p.p(ex - 3, ey - 4, '#ffffff');
  p.p(ex - 2, ey - 5, '#ffffff');
  p.p(ex - 4, ey - 3, '#ffffff');
  p.p(ex - 2, ey - 3, '#ffffff');
  p.p(ex + 2, ey + 6, '#d8e4ff');
  p.hline(ex - rx - 1, ey - ry, rx * 2 + 3, pal.outline);
  p.hline(ex - rx, ey - ry + 1, rx * 2 + 1, pal.outline);
  p.p(ex - rx - 1, ey - ry + 2, pal.outline);
  p.p(ex + rx + 1, ey - ry + 2, pal.outline);
  p.p(ex - rx, ey + ry - 1, pal.outline);
  p.p(ex + rx, ey + ry - 1, pal.outline);
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
  if (po.fullBack) return;
  const blink = anim === 'idle' && frame === 7;
  const mad = anim === 'attack';
  const cast = anim === 'cast';
  const ey = hy + 10;
  const hooded = hat === 'hood' || hat === 'wolfhood';

  if (po.peekBack) {
    drawEye(p, cx - 11, ey, pal, blink, 6, 8);
    p.oval(cx - 15, hy + 16, 4, 3, pal.blush);
    return;
  }

  const twoEyes = !po.profile || hooded;
  if (twoEyes) {
    const ox = po.threeQ ? 2 : 0;
    drawEye(p, cx - 9 + ox, ey, pal, blink);
    drawEye(p, cx + 9 + ox, ey, pal, blink);
    if (mad) {
      p.hline(cx - 16 + ox, ey - 12, 8, pal.outline);
      p.hline(cx + 8 + ox, ey - 12, 8, pal.outline);
    }
  } else {
    drawEye(p, cx - 12, ey, pal, blink, 8, 10);
    p.p(cx - 20, hy + 10, pal.skinSh);
    p.p(cx - 21, hy + 11, pal.skinSh);
  }

  p.oval(cx - 16, hy + 18, 5, 3, pal.blush);
  p.oval(cx + 16, hy + 18, 5, 3, pal.blush);
  p.p(cx - 12, hy + 10, pal.skinHi);
  p.p(cx + 11, hy + 10, pal.skinHi);

  if (cast) {
    p.oval(cx, hy + 22, 2, 2, pal.outline);
    p.p(cx, hy + 22, pal.skin);
  } else if (mad) {
    p.hline(cx - 2, hy + 22, 5, pal.outline);
  } else {
    p.p(cx - 2, hy + 22, pal.skinSh);
    p.p(cx - 1, hy + 23, pal.skinSh);
    p.p(cx, hy + 23, pal.skinSh);
    p.p(cx + 1, hy + 23, pal.skinSh);
    p.p(cx + 2, hy + 22, pal.skinSh);
  }
}

function drawHairBack(p: Pix, cx: number, hy: number, pal: Palette, po: Pose, hat: HatKind): void {
  p.oval(cx + (po.profile ? 6 : 0), hy - 2, 22, 20, pal.hair, pal.outline);
  if (pal.cut === 'robe') {
    p.oval(cx - 22, hy + 14, 8, 20, pal.hair, pal.outline);
    p.oval(cx + 22, hy + 14, 8, 20, pal.hair, pal.outline);
  } else if (pal.cut === 'tunic') {
    p.oval(cx + 20, hy + 8, 8, 14, pal.hair, pal.outline);
  }
  if (hat === 'hood' || hat === 'wolfhood') {
    p.oval(cx, hy + 8, 22, 16, pal.coat, pal.outline);
  }
}

function drawHairSpikes(p: Pix, cx: number, hy: number, pal: Palette): void {
  if (pal.cut === 'armor') {
    p.diamond(cx - 16, hy - 14, 5, 8, pal.hair, pal.outline);
    p.diamond(cx - 7, hy - 22, 5, 9, pal.hair, pal.outline);
    p.diamond(cx + 4, hy - 24, 6, 10, pal.hair, pal.outline);
    p.diamond(cx + 14, hy - 16, 5, 8, pal.hair, pal.outline);
    p.diamond(cx + 20, hy - 6, 5, 7, pal.hair, pal.outline);
    p.diamond(cx - 20, hy - 4, 5, 7, pal.hair, pal.outline);
    p.p(cx - 4, hy - 20, pal.hairHi);
    p.p(cx + 6, hy - 22, pal.hairHi);
    p.p(cx + 14, hy - 14, pal.hairHi);
  } else if (pal.cut === 'robe') {
    p.oval(cx - 22, hy + 12, 9, 20, pal.hair, pal.outline);
    p.oval(cx + 22, hy + 12, 9, 20, pal.hair, pal.outline);
    p.oval(cx - 21, hy + 24, 8, 10, pal.hairSh, pal.outline);
    p.oval(cx + 21, hy + 24, 8, 10, pal.hairSh, pal.outline);
    p.diamond(cx - 11, hy - 18, 5, 8, pal.hair, pal.outline);
    p.diamond(cx + 2, hy - 20, 5, 8, pal.hair, pal.outline);
    p.diamond(cx + 12, hy - 16, 5, 7, pal.hair, pal.outline);
    p.p(cx - 8, hy - 16, pal.hairHi);
    p.p(cx + 8, hy - 16, pal.hairHi);
  } else {
    p.diamond(cx - 6, hy - 18, 4, 7, pal.hair, pal.outline);
    p.diamond(cx + 4, hy - 20, 5, 8, pal.hair, pal.outline);
    p.oval(cx + 20, hy + 2, 8, 14, pal.hair, pal.outline);
    p.disc(cx + 21, hy + 16, 7, pal.hair, pal.outline);
    p.oval(cx - 18, hy - 2, 7, 10, pal.hair, pal.outline);
    p.p(cx + 18, hy + 6, pal.hairHi);
    p.p(cx + 2, hy - 18, pal.hairHi);
  }
}

function drawBangs(p: Pix, cx: number, hy: number, pal: Palette, po: Pose): void {
  if (po.profile) {
    p.diamond(cx - 5, hy - 10, 4, 7, pal.hair, pal.outline);
    return;
  }
  p.diamond(cx - 9, hy - 10, 4, 7, pal.hair, pal.outline);
  p.diamond(cx, hy - 12, 4, 7, pal.hair, pal.outline);
  p.diamond(cx + 9, hy - 10, 4, 7, pal.hair, pal.outline);
  p.p(cx - 1, hy - 14, pal.hairHi);
}

function drawHairFront(p: Pix, cx: number, hy: number, pal: Palette, po: Pose, hat: HatKind): void {
  if (po.fullBack) {
    if (hat === 'wolfhood') {
      p.oval(cx, hy, 21, 22, '#8a8a94', pal.outline);
      p.diamond(cx - 12, hy - 22, 6, 10, '#8a8a94', pal.outline);
      p.diamond(cx + 12, hy - 22, 6, 10, '#8a8a94', pal.outline);
      return;
    }
    p.oval(cx, hy, 21, 22, pal.hair, pal.outline);
    drawHairSpikes(p, cx, hy, pal);
    if (hat === 'hood') {
      p.oval(cx, hy + 10, 20, 14, pal.coat, pal.outline);
    }
    return;
  }
  if (po.peekBack) {
    p.oval(cx + 5, hy - 2, 18, 21, pal.hair, pal.outline);
    drawHairSpikes(p, cx + 4, hy, pal);
    return;
  }

  p.oval(cx + (po.profile ? 5 : 0), hy - 8, 18, 12, pal.hair, pal.outline);
  drawHairSpikes(p, cx, hy, pal);
  drawBangs(p, cx, hy, pal, po);
}

function drawHatBack(p: Pix, cx: number, hy: number, pal: Palette, hat: HatKind): void {
  if (hat === 'hood') {
    p.oval(cx, hy + 10, 23, 14, pal.coat, pal.outline);
  } else if (hat === 'wolfhood') {
    p.oval(cx, hy + 6, 22, 16, '#8a8a94', pal.outline);
  }
}

function drawHatFront(p: Pix, cx: number, hy: number, pal: Palette, po: Pose, hat: HatKind): void {
  if (po.fullBack && (hat === 'hood' || hat === 'wolfhood')) return;
  if (hat === 'hood') {
    p.oval(cx - 21, hy + 8, 6, 14, pal.coat, pal.outline);
    p.oval(cx + 21, hy + 8, 6, 14, pal.coat, pal.outline);
    p.oval(cx, hy + 22, 13, 5, pal.coat, pal.outline);
    return;
  }
  if (hat === 'wolfhood') {
    p.diamond(cx - 12, hy - 24, 6, 10, '#8a8a94', pal.outline);
    p.diamond(cx + 12, hy - 24, 6, 10, '#8a8a94', pal.outline);
    p.diamond(cx - 12, hy - 23, 3, 5, '#e8c8c8');
    p.diamond(cx + 12, hy - 23, 3, 5, '#e8c8c8');
    p.oval(cx - 20, hy + 6, 5, 12, '#6a6a74', pal.outline);
    p.oval(cx + 20, hy + 6, 5, 12, '#6a6a74', pal.outline);
    return;
  }
  if (hat === 'helm') {
    if (po.fullBack) {
      p.rect(cx - 11, hy - 16, 22, 4, pal.clothSh);
      p.vline(cx, hy - 24, 8, pal.accent);
      return;
    }
    p.rect(cx - 12, hy - 16, 24, 3, pal.clothHi);
    p.hline(cx - 12, hy - 17, 24, pal.outline);
    p.hline(cx - 11, hy - 13, 22, pal.accent);
    p.p(cx, hy - 20, pal.accent);
    p.vline(cx, hy - 20, 4, pal.accent);
    return;
  }
  if (hat === 'cap') {
    p.oval(cx, hy - 22, 12, 6, pal.accent, pal.outline);
    p.rect(cx - 10, hy - 22, 20, 4, pal.coat);
    if (!po.back) p.oval(cx + 2, hy - 18, 8, 2, pal.coatSh, pal.outline);
    return;
  }
  if (hat === 'circlet') {
    p.hline(cx - 13, hy - 14, 26, pal.accent);
    p.disc(cx, hy - 16, 2, '#7ed47e', pal.outline);
  }
}

function drawBody(p: Pix, cx: number, chestY: number, hipY: number, pal: Palette, po: Pose): void {
  const wrx = po.profile ? 7 : 10;
  p.oval(cx, hipY + 3, wrx + 5, 7, pal.coat, pal.outline);
  p.oval(cx, chestY + 2, wrx, 7, pal.coat, pal.outline);
  p.oval(cx, hipY + 1, wrx + 2, 6, pal.coatHi);
  if (!po.fullBack) {
    p.rect(cx - 5, chestY - 5, 10, 15, pal.inner);
    p.vline(cx - 5, chestY - 5, 15, pal.outline);
    p.vline(cx + 4, chestY - 5, 15, pal.outline);
    p.oval(cx - 8, chestY + 4, 6, 10, pal.coat, pal.outline);
    p.oval(cx + 8, chestY + 4, 6, 10, pal.coat, pal.outline);
    p.p(cx - 3, chestY - 3, pal.inner);
    p.p(cx + 2, chestY - 3, pal.inner);
  }
  p.rect(cx - 8, hipY + 1, 16, 4, pal.accent);
  p.hline(cx - 8, hipY, 16, pal.outline);
  p.hline(cx - 8, hipY + 4, 16, pal.outline);
  if (!po.profile) {
    p.oval(cx - 13, chestY + 8, 5, 7, pal.coat, pal.outline);
    p.oval(cx + 13, chestY + 8, 5, 7, pal.coat, pal.outline);
  }
  if (pal.cut === 'armor' && !po.profile) {
    p.oval(cx - 11, chestY, 5, 4, pal.clothHi, pal.outline);
    p.oval(cx + 11, chestY, 5, 4, pal.clothHi, pal.outline);
  }
}

function drawArm(p: Pix, x: number, y: number, pal: Palette, hand: string): void {
  p.oval(x, y + 3, 4, 6, pal.coat, pal.outline);
  p.disc(x, y + 9, 3, hand, pal.outline);
  p.p(x - 1, y + 8, pal.skinHi);
}

function drawHuman(
  p: Pix,
  pal: Palette,
  anim: AnimName,
  frame: number,
  dir: number,
  gear: Gear,
): void {
  const po = pose(anim, frame, dir, gear.weapon);
  const { cx, footY, hipY, chestY, hy } = bodyLayout(po);
  const wielding = anim === 'attack' || anim === 'cast';
  const holster = !wielding && (gear.weapon === 'sword' || gear.weapon === 'bow');

  if (anim === 'death') {
    p.oval(40, 90, 16, 4, 'rgba(0,0,0,0.28)');
    p.oval(48, 78, 14, 8, pal.coat, pal.outline);
    p.oval(64, 62, 17, 18, pal.skin, pal.outline);
    p.oval(64, 52, 16, 12, pal.hair, pal.outline);
    p.hline(58, 64, 5, pal.outline);
    p.hline(68, 64, 5, pal.outline);
    return;
  }

  p.oval(40, 92, 12, 3, 'rgba(0,0,0,0.32)');
  p.oval(cx - 4 + (po.legL | 0), footY, 5, 2, '#2a1810', pal.outline);
  p.oval(cx + 4 + (po.legR | 0), footY, 5, 2, '#2a1810', pal.outline);
  p.p(cx - 4 + (po.legL | 0), footY - 1, '#4a3020');
  p.p(cx + 4 + (po.legR | 0), footY - 1, '#4a3020');

  const hand = pal.skin;
  drawHatBack(p, cx, hy, pal, gear.hat);
  drawHairBack(p, cx, hy, pal, po, gear.hat);
  if (holster && !po.back) drawHolsteredWeapon(p, gear.weapon, cx, hy, chestY, hipY, pal, po);

  if (!po.fullBack) drawArm(p, cx - 12, chestY + (po.armL | 0), pal, hand);
  drawBody(p, cx, chestY, hipY, pal, po);
  if (holster && po.back) drawHolsteredWeapon(p, gear.weapon, cx, hy, chestY, hipY, pal, po);

  if (gear.shield && !po.fullBack) {
    p.oval(cx - 16, chestY + 6, 7, 9, pal.accent, pal.outline);
    p.oval(cx - 16, chestY + 6, 4, 6, pal.coatSh, pal.outline);
  }

  p.oval(cx, hy, 21, 21, pal.skin, pal.outline);

  if (pal.ears !== false && !po.fullBack && (gear.hat === 'none' || gear.hat === 'circlet' || gear.hat === 'cap')) {
    p.oval(cx - 21, hy + 4, 3, 5, pal.skin, pal.outline);
    if (!po.profile) p.oval(cx + 21, hy + 4, 3, 5, pal.skin, pal.outline);
  }

  drawHairFront(p, cx, hy, pal, po, gear.hat);
  drawHatFront(p, cx, hy, pal, po, gear.hat);
  if (holster && !po.fullBack && gear.weapon === 'sword') {
    p.rect(cx - 22, hy + 8, 8, 4, pal.accent);
    p.rect(cx - 26, hy + 10, 6, 3, '#5a3a18');
    p.hline(cx - 22, hy + 7, 8, pal.outline);
  }

  if (po.peekBack) {
    p.oval(cx - 9, hy + 8, 9, 13, pal.skin);
    drawFace(p, cx, hy, pal, po, anim, frame, gear.hat);
  } else if (!po.fullBack) {
    p.oval(cx, hy + 12, 17, 14, pal.skin);
    p.oval(cx - 6, hy + 2, 6, 6, pal.skinHi);
    drawFace(p, cx, hy, pal, po, anim, frame, gear.hat);
  }

  drawArm(p, cx + 12, chestY + (po.armR | 0), pal, hand);
  if (po.fullBack) drawArm(p, cx - 12, chestY + (po.armL | 0), pal, hand);
  if (!holster) drawWieldedWeapon(p, gear.weapon, cx, hy, chestY, hipY, pal, po, anim);
}

function drawDiag(
  p: Pix,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  thick: number,
  fill: string,
  line?: string,
): void {
  const steps = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const px = x0 + Math.round(((x1 - x0) * i) / steps);
    const py = y0 + Math.round(((y1 - y0) * i) / steps);
    if (line) {
      p.p(px - 1, py, line);
      p.p(px + thick, py, line);
    }
    for (let t = 0; t < thick; t++) p.p(px + t, py, fill);
  }
}

function drawHolsteredWeapon(
  p: Pix,
  weapon: WeaponKind,
  cx: number,
  hy: number,
  chestY: number,
  hipY: number,
  pal: Palette,
  po: Pose,
): void {
  if (weapon === 'sword') {
    const x0 = po.profile ? cx + 8 : cx - 18;
    const y0 = hy + 6;
    const x1 = po.profile ? cx + 12 : cx - 6;
    const y1 = hipY + 8;
    drawDiag(p, x0, y0, x1, y1, 4, '#4a3018', pal.outline);
    drawDiag(p, x0 + 1, y0, x1 + 1, y1, 2, '#6a4828');
    p.rect(x0 - 3, y0 - 3, 10, 5, pal.accent);
    p.rect(x0 - 7, y0 - 1, 7, 3, '#5a3a18');
    p.hline(x0 - 3, y0 - 4, 10, pal.outline);
  } else if (weapon === 'bow') {
    const bx = po.profile ? cx + 10 : cx - 18;
    const by = chestY - 4;
    for (let i = 0; i < 24; i++) {
      const ox = ((i - 12) * (i - 12)) / 16;
      p.p(bx - ox, by + i, pal.accent);
      p.p(bx - ox - 1, by + i, pal.outline);
      p.p(bx - ox + 1, by + i, pal.outline);
    }
    p.rect(cx + (po.profile ? 8 : 10), chestY + 2, 5, 10, '#5a3a18');
    p.vline(cx + (po.profile ? 10 : 12), chestY - 4, 8, '#d8b070');
    p.vline(cx + (po.profile ? 11 : 13), chestY - 6, 8, '#d8b070');
    p.p(cx + (po.profile ? 10 : 12), chestY - 7, '#c04040');
    p.p(cx + (po.profile ? 11 : 13), chestY - 8, '#c04040');
  }
}

function drawWieldedWeapon(
  p: Pix,
  weapon: WeaponKind,
  cx: number,
  hy: number,
  chestY: number,
  hipY: number,
  pal: Palette,
  po: Pose,
  anim: AnimName,
): void {
  const rightX = cx + 12;
  const rightY = chestY + 9 + (po.armR | 0);
  const leftX = cx - 12;
  const leftY = chestY + 9 + (po.armL | 0);
  const swing = po.swing;
  if (weapon === 'sword') {
    let tx: number;
    let ty: number;
    if (swing < 0.35) {
      tx = rightX + (po.profile ? -6 : 6);
      ty = rightY - 30;
    } else if (swing < 0.7) {
      tx = rightX + (po.profile ? -32 : 30);
      ty = rightY - 4;
    } else {
      tx = rightX + (po.profile ? -18 : 16);
      ty = rightY + 16;
    }
    drawDiag(p, rightX, rightY - 1, tx, ty, 3, '#dce4ee', pal.outline);
    p.rect(rightX - 3, rightY - 3, 7, 7, pal.accent);
    p.disc(rightX, rightY, 3, pal.skin, pal.outline);
    p.p(rightX - 1, rightY - 1, pal.skinHi);
  } else if (weapon === 'staff') {
    const lift = (swing * 10) | 0;
    const x = rightX + 4;
    p.rect(x, rightY - 36 - lift, 3, 42, '#7a5030');
    p.vline(x - 1, rightY - 36 - lift, 42, pal.outline);
    p.vline(x + 3, rightY - 36 - lift, 42, pal.outline);
    p.disc(x + 1, rightY - 38 - lift, 6, pal.accent, pal.outline);
    p.disc(x + 1, rightY - 38 - lift, 3, '#e8f8ff');
    p.p(x, rightY - 40 - lift, '#ffffff');
  } else if (weapon === 'bow') {
    const gx = leftX;
    const gy = leftY;
    for (let i = -13; i <= 13; i++) {
      const ox = (i * i) / 16;
      p.p(gx - 3 - ox, gy + i, pal.accent);
      p.p(gx - 4 - ox, gy + i, pal.outline);
      p.p(gx - 2 - ox, gy + i, pal.outline);
    }
    p.vline(gx + 5, gy - 10, 20, '#f0e0c0');
    p.p(gx + 5, gy - 11, pal.outline);
    p.p(gx + 5, gy + 10, pal.outline);
    const draw = anim === 'attack' ? (6 + ((swing * 4) | 0)) : 2;
    p.hline(gx - 10, gy, 18 + draw, '#e8d0a0');
    p.p(gx - 11, gy, pal.outline);
    p.p(gx - 12, gy - 1, '#c04040');
    p.p(gx - 12, gy + 1, '#c04040');
    p.p(gx + 8 + draw, gy, '#dce4ee');
    p.p(gx + 9 + draw, gy, pal.outline);
    p.disc(gx, gy, 3, pal.skin, pal.outline);
    p.disc(rightX - 2, gy, 3, pal.skin, pal.outline);
  } else if (weapon === 'club') {
    p.rect(rightX, rightY - 10, 4, 16, '#5a3a18');
    p.disc(rightX + 2, rightY - 14, 6, '#6a4a22', pal.outline);
  }
}

function drawWolf(p: Pix, anim: AnimName, frame: number, dir: number): void {
  const t = (frame / 6) * Math.PI * 2;
  const bob = anim === 'walk' ? Math.abs(Math.sin(t)) * 1.5 : 0;
  const y = 70 - (bob | 0);
  const back = dir === 4;
  const profile = dir === 2 || dir === 3;
  const hx = back ? 24 : 54;
  const fur = '#9a9aa8';
  const dark = '#3a3a48';
  const out = '#14141c';
  p.oval(40, 90, 16, 4, 'rgba(0,0,0,0.3)');
  p.oval(40, y + 6, 15, 9, fur, out);
  p.oval(hx, y - 8, 14, 14, fur, out);
  p.diamond(hx - 8, y - 20, 5, 8, fur, out);
  p.diamond(hx + 8, y - 20, 5, 8, fur, out);
  p.diamond(hx - 8, y - 19, 3, 5, '#f0c8c8');
  p.diamond(hx + 8, y - 19, 3, 5, '#f0c8c8');
  if (!back) {
    const ex = profile ? hx - 6 : hx;
    p.oval(ex - 5, y - 10, 5, 6, '#fff8f4', out);
    if (!profile) p.oval(ex + 5, y - 10, 5, 6, '#fff8f4', out);
    p.disc(ex - 5, y - 9, 2, '#c04040');
    if (!profile) p.disc(ex + 5, y - 9, 2, '#c04040');
    p.p(ex - 6, y - 12, '#ffffff');
    if (!profile) p.p(ex + 4, y - 12, '#ffffff');
    p.disc(hx + (profile ? -10 : 6), y - 4, 2, '#1a1018');
    p.oval(hx - 4, y - 2, 3, 2, '#f09090');
    p.oval(hx + 4, y - 2, 3, 2, '#f09090');
  }
  p.rect(26, y + 12, 5, 10 + (Math.sin(t) * 2 | 0), dark);
  p.rect(34, y + 12, 5, 10 + (-Math.sin(t) * 2 | 0), dark);
  p.rect(42, y + 12, 5, 10 + (Math.sin(t) * 2 | 0), dark);
  p.rect(50, y + 12, 5, 10 + (-Math.sin(t) * 2 | 0), dark);
  p.oval(back ? 58 : 22, y + 4, 5, 4, dark, out);
  if (anim === 'attack') p.disc(hx + (back ? -10 : 10), y, 3, '#f0d0d0');
}

function drawGoblin(p: Pix, anim: AnimName, frame: number, dir: number): void {
  drawHuman(p, GOBLIN_PAL, anim, frame, dir, { weapon: 'club', hat: 'none', shield: false });
  const po = pose(anim, frame, dir);
  const { cx, hy } = bodyLayout(po);
  if (anim === 'death' || po.fullBack) return;
  p.oval(cx - 20, hy - 4, 5, 9, GOBLIN_PAL.skin, GOBLIN_PAL.outline);
  p.oval(cx + 20, hy - 4, 5, 9, GOBLIN_PAL.skin, GOBLIN_PAL.outline);
  p.p(cx - 20, hy - 8, GOBLIN_PAL.skinHi);
  p.p(cx + 20, hy - 8, GOBLIN_PAL.skinHi);
  if (!po.back) {
    p.p(cx - 4, hy + 14, '#f0f0e0');
    p.p(cx + 4, hy + 14, '#f0f0e0');
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
  faceCam = false;
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
    if (this.faceCam) this.facing = camYaw + Math.PI;
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
  return new SpriteActor('hero', gear, HERO_PALETTES[heroClass], 3.05, 3.66);
}

export function createNpcSprite(kind: 'herald' | 'smith' | 'alchemist' | 'inn'): SpriteActor {
  const gear: Gear = {
    weapon: kind === 'smith' ? 'sword' : 'none',
    hat: kind === 'alchemist' ? 'hood' : kind === 'herald' ? 'helm' : kind === 'inn' ? 'cap' : 'none',
    shield: kind === 'herald',
  };
  const a = new SpriteActor(kind, gear, NPC_PAL[kind], 2.75, 3.3);
  a.faceCam = true;
  return a;
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
    null,
    heroClass === 'vanguard',
  );
  paintSprite(canvas, 'hero', 'idle', 0, 0, gear, HERO_PALETTES[heroClass]);
}
