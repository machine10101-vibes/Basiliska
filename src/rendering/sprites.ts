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
  cloth: string;
  clothSh: string;
  accent: string;
  hair: string;
  hairSh: string;
  outline: string;
  eye: string;
}

export const HERO_PALETTES: Record<'vanguard' | 'sage' | 'archer', Palette> = {
  vanguard: {
    skin: '#f0c8a0',
    skinSh: '#d4a078',
    cloth: '#5a6270',
    clothSh: '#3a424c',
    accent: '#d4b03a',
    hair: '#3a2418',
    hairSh: '#1e120c',
    outline: '#1a100c',
    eye: '#3a5a9a',
  },
  sage: {
    skin: '#f4d0b0',
    skinSh: '#d8a888',
    cloth: '#3a4a88',
    clothSh: '#243060',
    accent: '#8ec0ff',
    hair: '#c8b4e8',
    hairSh: '#8870b8',
    outline: '#1a1020',
    eye: '#6a40b0',
  },
  archer: {
    skin: '#e8c090',
    skinSh: '#c89868',
    cloth: '#3a6a38',
    clothSh: '#244a24',
    accent: '#c47838',
    hair: '#6a3820',
    hairSh: '#3e1e10',
    outline: '#14200c',
    eye: '#2a7a38',
  },
};

const NPC_PAL: Record<string, Palette> = {
  herald: {
    skin: '#f0c8a0',
    skinSh: '#d4a078',
    cloth: '#8a2a2a',
    clothSh: '#5a1818',
    accent: '#d4b03a',
    hair: '#c8b070',
    hairSh: '#8a7038',
    outline: '#1a100c',
    eye: '#3a5a9a',
  },
  smith: {
    skin: '#d8a070',
    skinSh: '#b07848',
    cloth: '#3a322c',
    clothSh: '#221c18',
    accent: '#888888',
    hair: '#2a2018',
    hairSh: '#100c08',
    outline: '#100c08',
    eye: '#5a3a20',
  },
  alchemist: {
    skin: '#f4d0b0',
    skinSh: '#d8a888',
    cloth: '#2a4a6a',
    clothSh: '#163044',
    accent: '#66ccee',
    hair: '#e8e0c8',
    hairSh: '#b0a888',
    outline: '#0c1820',
    eye: '#2288aa',
  },
  inn: {
    skin: '#e8b888',
    skinSh: '#c49060',
    cloth: '#6a3a18',
    clothSh: '#4a2810',
    accent: '#d4a060',
    hair: '#8a5030',
    hairSh: '#5a3018',
    outline: '#1a1008',
    eye: '#5a4020',
  },
};

const W = 64;
const H = 80;

function pose(anim: AnimName, frame: number, dir: number) {
  let bob =
    anim === 'walk' ? Math.abs(Math.sin((frame / 6) * Math.PI * 2)) * 2
    : anim === 'idle' ? Math.sin((frame / 4) * Math.PI * 2) * 0.6
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
    legL = Math.sin(t) * 4;
    legR = -Math.sin(t) * 4;
    armL = -Math.sin(t) * 3;
    armR = Math.sin(t) * 3;
  } else if (anim === 'attack') {
    const u = frame / 5;
    swing = u < 0.35 ? u / 0.35 : 1 - (u - 0.35) / 0.65;
    armR = -6 + swing * 14;
    lean = swing * 3;
    armL = -swing * 2;
  } else if (anim === 'cast') {
    const u = frame / 5;
    armL = -8 - u * 2;
    armR = -8 - u * 2;
    bob += u * 1.5;
  } else if (anim === 'idle') {
    armL = Math.sin((frame / 4) * Math.PI * 2) * 0.8;
    armR = -armL;
  }
  const back = dir === 3 || dir === 4;
  const profile = dir === 2;
  return { bob, legL, legR, armL, armR, lean, swing, back, profile, dir };
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
  const cx = 32 + (po.lean | 0);
  const base = 70 - (po.bob | 0);
  if (anim === 'death') {
    p.oval(32, 74, 12, 4, 'rgba(0,0,0,0.28)');
    p.oval(36, 58, 16, 8, pal.cloth, pal.outline);
    p.disc(48, 50, 10, pal.skin, pal.outline);
    return;
  }

  p.oval(32, 76, 11, 4, 'rgba(0,0,0,0.32)');

  const footY = base;
  const boot = pal.clothSh;
  p.rectOutline(cx - 8 + (po.legL | 0), footY - 6, 6, 8, boot, pal.outline);
  p.rectOutline(cx + 2 + (po.legR | 0), footY - 6, 6, 8, boot, pal.outline);

  const hipY = footY - 16;
  p.rectOutline(cx - 8, hipY, 16, 12, pal.cloth, pal.outline);
  p.hline(cx - 7, hipY + 1, 14, pal.accent);

  const chestY = hipY - 14;
  p.rectOutline(cx - 9, chestY, 18, 16, pal.cloth, pal.outline);
  p.rect(cx - 8, chestY + 2, 4, 12, pal.clothSh);
  p.hline(cx - 8, chestY + 10, 16, pal.accent);

  const armY = chestY + 2;
  const hand = pal.skin;
  if (!po.back) {
    p.rectOutline(cx - 14, armY + (po.armL | 0), 6, 14, pal.cloth, pal.outline);
    p.rectOutline(cx - 13, armY + 12 + (po.armL | 0), 5, 5, hand, pal.outline);
  }
  p.rectOutline(cx + 8, armY + (po.armR | 0), 6, 14, pal.cloth, pal.outline);
  p.rectOutline(cx + 8, armY + 12 + (po.armR | 0), 5, 5, hand, pal.outline);

  if (gear.shield && !po.back) {
    const sx = cx - 16;
    const sy = chestY + 4;
    p.disc(sx, sy + 6, 8, pal.accent, pal.outline);
    p.disc(sx, sy + 6, 5, pal.clothSh, pal.outline);
  }

  const headY = chestY - 12;
  p.disc(cx, headY, 12, pal.skin, pal.outline);
  p.disc(cx, headY + 2, 10, pal.skin);

  if (!po.back) {
    p.oval(cx - 5, headY - 1, 4, 5, '#ffffff', pal.outline);
    p.oval(cx + 4, headY - 1, 4, 5, '#ffffff', pal.outline);
    p.disc(cx - 5, headY, 2, pal.eye);
    p.disc(cx + 4, headY, 2, pal.eye);
    p.p(cx - 4, headY - 1, '#ffffff');
    p.p(cx + 5, headY - 1, '#ffffff');
    p.p(cx - 6, headY + 6, '#f4a0a0');
    p.p(cx + 6, headY + 6, '#f4a0a0');
    p.hline(cx - 3, headY + 7, 6, pal.skinSh);
    p.p(cx, headY + 8, pal.skinSh);
  }

  if (gear.hat === 'hood') {
    p.disc(cx, headY - 2, 13, pal.cloth, pal.outline);
    p.disc(cx, headY + 1, 10, pal.skin);
    if (!po.back) {
      p.oval(cx - 5, headY - 1, 4, 5, '#ffffff', pal.outline);
      p.oval(cx + 4, headY - 1, 4, 5, '#ffffff', pal.outline);
      p.disc(cx - 5, headY, 2, pal.eye);
      p.disc(cx + 4, headY, 2, pal.eye);
    }
    p.rectOutline(cx - 14, headY + 4, 28, 8, pal.cloth, pal.outline);
  } else {
    if (po.back) {
      p.disc(cx, headY - 2, 12, pal.hair, pal.outline);
    } else {
      p.oval(cx, headY - 8, 11, 6, pal.hair, pal.outline);
      p.rect(cx - 11, headY - 6, 5, 12, pal.hair);
      p.rect(cx + 6, headY - 6, 5, 12, pal.hair);
    }
    p.rect(cx - 10, headY + 6, 4, 8, pal.hairSh);
    p.rect(cx + 6, headY + 6, 4, 8, pal.hairSh);
  }

  if (gear.hat === 'helm') {
    p.oval(cx, headY - 6, 12, 7, pal.accent, pal.outline);
    p.rectOutline(cx - 12, headY - 6, 24, 8, pal.clothSh, pal.outline);
    p.vline(cx, headY - 12, 8, pal.accent);
  } else if (gear.hat === 'cap') {
    p.oval(cx, headY - 8, 11, 5, pal.accent, pal.outline);
    p.rect(cx - 10, headY - 6, 20, 4, pal.cloth);
  } else if (gear.hat === 'circlet') {
    p.hline(cx - 10, headY - 6, 20, pal.accent);
    p.p(cx, headY - 8, '#7ec87e');
    p.p(cx - 6, headY - 7, '#7ec87e');
    p.p(cx + 6, headY - 7, '#7ec87e');
  } else if (gear.hat === 'wolfhood') {
    p.disc(cx, headY - 2, 13, '#6a6a72', pal.outline);
    p.p(cx - 12, headY - 10, '#6a6a72');
    p.p(cx + 12, headY - 10, '#6a6a72');
    p.rectOutline(cx - 8, headY - 14, 5, 8, '#6a6a72', pal.outline);
    p.rectOutline(cx + 3, headY - 14, 5, 8, '#6a6a72', pal.outline);
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
  const hx = cx + 12;
  const hy = chestY + 14 + (armR | 0);
  const lift = (swing * 10) | 0;
  if (weapon === 'sword') {
    const x = hx + (back ? -2 : 0);
    p.rectOutline(x, hy - 18 - lift, 3, 20, '#d0d6dc', pal.outline);
    p.rectOutline(x - 3, hy - 2 - lift, 9, 3, pal.accent, pal.outline);
    p.rect(x, hy + 1 - lift, 3, 6, '#5a3a18');
  } else if (weapon === 'staff') {
    p.rectOutline(hx + 1, hy - 22 - lift, 3, 28, '#6a4428', pal.outline);
    p.disc(hx + 2, hy - 24 - lift, 5, pal.accent, pal.outline);
    p.p(hx + 2, hy - 24 - lift, '#ffffff');
  } else if (weapon === 'bow') {
    for (let i = 0; i < 12; i++) {
      const ox = ((i - 6) * (i - 6)) / 8;
      p.p(hx + 2 + ox, hy - 16 + i, pal.accent);
      p.p(hx + 1 + ox, hy - 16 + i, pal.outline);
    }
    p.vline(hx + 6, hy - 14, 10, '#f0e0c0');
  } else if (weapon === 'club') {
    p.rectOutline(hx, hy - 8, 4, 16, '#5a3a18', pal.outline);
    p.disc(hx + 2, hy - 10, 6, '#6a4a22', pal.outline);
  }
}

function drawWolf(p: Pix, anim: AnimName, frame: number, dir: number): void {
  const t = (frame / 6) * Math.PI * 2;
  const bob = anim === 'walk' ? Math.abs(Math.sin(t)) * 1.5 : 0;
  const y = 58 - (bob | 0);
  p.oval(32, 74, 12, 4, 'rgba(0,0,0,0.3)');
  const fur = '#6a6a74';
  const dark = '#2a2a32';
  const out = '#121216';
  p.oval(30, y, 16, 9, fur, out);
  p.disc(dir === 4 ? 18 : 44, y - 2, 8, fur, out);
  p.oval(dir === 4 ? 12 : 50, y, 6, 4, dark, out);
  p.p(dir === 4 ? 10 : 52, y - 2, '#ffffff');
  p.p(dir === 4 ? 10 : 52, y - 2, '#c04040');
  p.rectOutline(18, y + 6, 5, 10 + (Math.sin(t) * 2 | 0), dark, out);
  p.rectOutline(26, y + 6, 5, 10 + (-Math.sin(t) * 2 | 0), dark, out);
  p.rectOutline(34, y + 6, 5, 10 + (Math.sin(t) * 2 | 0), dark, out);
  p.rectOutline(42, y + 6, 5, 10 + (-Math.sin(t) * 2 | 0), dark, out);
  p.oval(16, y - 2, 4, 3, dark, out);
  if (anim === 'attack') p.disc(dir === 4 ? 12 : 52, y + 2, 3, '#f0d0d0');
}

function drawGoblin(p: Pix, pal: Palette, anim: AnimName, frame: number, dir: number): void {
  const tiny: Palette = { ...pal, cloth: '#3a7a30', clothSh: '#245020', hair: '#2a5a20', hairSh: '#163814', eye: '#c0e040' };
  drawHuman(p, tiny, anim, frame, dir, { weapon: 'club', hat: 'none', shield: false });
  p.p(24, 28, '#3a7a30');
  p.p(40, 28, '#3a7a30');
  p.vline(22, 24, 8, '#3a7a30');
  p.vline(42, 24, 8, '#3a7a30');
}

function drawCrawler(p: Pix, anim: AnimName, frame: number): void {
  const t = (frame / 6) * Math.PI * 2;
  const y = 62 + (Math.sin(t) | 0);
  p.oval(32, 74, 10, 3, 'rgba(0,0,0,0.28)');
  const shell = '#5a3068';
  const glow = '#cc66ee';
  const out = '#1a0820';
  p.oval(32, y, 16, 8, shell, out);
  p.disc(32, y - 2, 6, glow, out);
  p.p(29, y - 3, '#ffffff');
  p.p(35, y - 3, '#ffffff');
  for (let i = 0; i < 3; i++) {
    p.vline(20 + i * 10, y + 6, 8 + (Math.sin(t + i) * 2 | 0), shell);
    p.vline(28 + i * 10, y + 6, 8 + (-Math.sin(t + i) * 2 | 0), shell);
  }
}

function drawDummy(p: Pix, anim: AnimName, frame: number): void {
  p.oval(32, 76, 8, 3, 'rgba(0,0,0,0.3)');
  const wood = '#8a6238';
  const out = '#2a180c';
  p.rectOutline(29, 28, 6, 44, wood, out);
  p.disc(32, 24, 10, wood, out);
  p.rectOutline(16, 40, 32, 6, wood, out);
  if (anim === 'death') p.rect(20, 60, 24, 8, wood);
  if (frame % 2 && anim === 'idle') p.p(28, 22, '#3a2410');
}

function drawHerb(p: Pix, frame: number): void {
  p.oval(32, 74, 6, 2, 'rgba(0,0,0,0.2)');
  const sway = Math.sin((frame / 4) * Math.PI * 2);
  for (let i = 0; i < 5; i++) {
    const a = -0.8 + i * 0.4;
    const x = 32 + ((Math.sin(a) * 8 + sway) | 0);
    const y = 70;
    p.vline(x, y - 14, 14, '#2a6a28');
    p.disc(x + (sway | 0), y - 16, 4, '#4aaa3a', '#1a4018');
  }
}

function drawTree(p: Pix, seed: number): void {
  p.oval(32, 76, 14, 4, 'rgba(0,0,0,0.28)');
  p.rectOutline(28, 40, 8, 36, '#5a3a1c', '#241408');
  const leaf = seed % 2 === 0 ? '#2f7a30' : '#3a8a38';
  p.disc(32, 28, 18, leaf, '#143818');
  p.disc(22, 34, 10, leaf, '#143818');
  p.disc(42, 32, 11, leaf, '#143818');
  p.disc(32, 18, 9, '#4aaa40', '#143818');
}

function drawLamp(p: Pix, frame: number): void {
  p.oval(32, 76, 6, 2, 'rgba(0,0,0,0.25)');
  p.rectOutline(30, 28, 4, 48, '#2a2420', '#100c08');
  const glow = frame % 2 === 0 ? '#ffe088' : '#ffd060';
  p.disc(32, 24, 8, glow, '#4a3010');
  p.disc(32, 24, 4, '#fff6c8');
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
  else if (kind === 'goblin') drawGoblin(p, pal ?? NPC_PAL.herald, anim, frame, d);
  else {
    const palette = pal ?? (kind === 'hero' ? HERO_PALETTES.vanguard : NPC_PAL[kind] ?? NPC_PAL.herald);
    const g: Gear =
      kind === 'hero'
        ? gear
        : {
            weapon: 'none',
            hat: kind === 'alchemist' ? 'hood' : kind === 'herald' ? 'helm' : 'none',
            shield: kind === 'herald',
          };
    drawHuman(p, palette, anim, frame, d, g);
  }
}

const FRAMES: Record<AnimName, number> = {
  idle: 4,
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
      : this.anim === 'idle' ? 0.22
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
  return new SpriteActor('hero', gear, HERO_PALETTES[heroClass], 2.35, 3.05);
}

export function createNpcSprite(kind: 'herald' | 'smith' | 'alchemist' | 'inn'): SpriteActor {
  const gear: Gear = {
    weapon: kind === 'smith' ? 'sword' : 'none',
    hat: kind === 'alchemist' ? 'hood' : kind === 'herald' ? 'helm' : kind === 'inn' ? 'cap' : 'none',
    shield: kind === 'herald',
  };
  return new SpriteActor(kind, gear, NPC_PAL[kind], 2.15, 2.75);
}

export function createMobSprite(kind: 'wolf' | 'goblin' | 'crawler' | 'dummy'): SpriteActor {
  const scale =
    kind === 'wolf' ? [2.5, 2.0]
    : kind === 'crawler' ? [2.1, 1.65]
    : kind === 'dummy' ? [1.85, 2.55]
    : [1.95, 2.45];
  return new SpriteActor(kind, { weapon: kind === 'goblin' ? 'club' : 'none', hat: 'none', shield: false }, undefined, scale[0], scale[1]);
}

export function createPropSprite(kind: 'herb' | 'tree' | 'lamp', seed = 0): SpriteActor {
  const scale =
    kind === 'tree' ? [2.6, 3.4]
    : kind === 'lamp' ? [1.1, 2.4]
    : [0.9, 1.1];
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
