export type HeroClass = 'vanguard' | 'sage' | 'archer';

export type SkillId = 'vitality' | 'strength' | 'agility' | 'energy';

export interface SkillState {
  level: number;
  xp: number;
}

export interface ItemStack {
  id: string;
  qty: number;
}

export interface SaveData {
  version: 1;
  name: string;
  heroClass: HeroClass;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  sd: number;
  maxSd: number;
  level: number;
  xp: number;
  gold: number;
  skills: Record<SkillId, SkillState>;
  inventory: ItemStack[];
}

export const CLASS_META: Record<
  HeroClass,
  {
    name: string;
    title: string;
    blurb: string;
    accent: string;
    attackRange: number;
    moveSpeed: number;
    hp: number;
    mp: number;
    sd: number;
  }
> = {
  vanguard: {
    name: 'Iron Vanguard',
    title: 'Plate & Oath',
    blurb: 'Close steel. High vitality. Holds the gate.',
    accent: '#c9a227',
    attackRange: 1.85,
    moveSpeed: 4.0,
    hp: 140,
    mp: 40,
    sd: 90,
  },
  sage: {
    name: 'Aether Sage',
    title: 'Sigil & Flame',
    blurb: 'Ranged fire. Burns mana. Softens packs.',
    accent: '#6ea8ff',
    attackRange: 6.2,
    moveSpeed: 3.7,
    hp: 90,
    mp: 140,
    sd: 50,
  },
  archer: {
    name: 'Thorn Archer',
    title: 'Bow & Briar',
    blurb: 'Mid-range shots. Fast feet. Clean picks.',
    accent: '#7ec87e',
    attackRange: 5.4,
    moveSpeed: 4.4,
    hp: 110,
    mp: 70,
    sd: 70,
  },
};

export const SKILL_META: Record<SkillId, { name: string; icon: string }> = {
  vitality: { name: 'Vitality', icon: '❤' },
  strength: { name: 'Strength', icon: '⚔' },
  agility: { name: 'Agility', icon: '🏹' },
  energy: { name: 'Energy', icon: '✦' },
};

export const ITEM_META: Record<string, { name: string; icon: string; stackable: boolean }> = {
  short_sword: { name: 'Gate Shortsword', icon: '⚔', stackable: false },
  ash_staff: { name: 'Ash Staff', icon: '⚚', stackable: false },
  briar_bow: { name: 'Briar Bow', icon: '🏹', stackable: false },
  hp_potion: { name: 'Red Elixir', icon: '🧪', stackable: true },
  mp_potion: { name: 'Blue Elixir', icon: '💧', stackable: true },
  wolf_pelt: { name: 'Wolf Pelt', icon: '🦊', stackable: true },
  goblin_ear: { name: 'Raider Token', icon: '🪙', stackable: true },
  crawler_ichor: { name: 'Crawler Ichor', icon: '🟣', stackable: true },
  vale_herb: { name: 'Vale Herb', icon: '🌿', stackable: true },
  town_bread: { name: 'Hearth Bread', icon: '🍞', stackable: true },
};

export function xpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += Math.floor(i + 280 * Math.pow(2, i / 8));
  }
  return Math.floor(total / 4);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (level < 99 && xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function defaultSave(heroClass: HeroClass = 'vanguard', name = 'Wanderer'): SaveData {
  const meta = CLASS_META[heroClass];
  const starter =
    heroClass === 'vanguard' ? 'short_sword' : heroClass === 'sage' ? 'ash_staff' : 'briar_bow';
  return {
    version: 1,
    name: name.slice(0, 16) || 'Wanderer',
    heroClass,
    x: 0,
    z: 3.2,
    hp: meta.hp,
    maxHp: meta.hp,
    mp: meta.mp,
    maxMp: meta.mp,
    sd: meta.sd,
    maxSd: meta.sd,
    level: 1,
    xp: 0,
    gold: 50,
    skills: {
      vitality: { level: heroClass === 'vanguard' ? 12 : 8, xp: 0 },
      strength: { level: heroClass === 'vanguard' ? 10 : 6, xp: 0 },
      agility: { level: heroClass === 'archer' ? 12 : 7, xp: 0 },
      energy: { level: heroClass === 'sage' ? 14 : 6, xp: 0 },
    },
    inventory: [
      { id: starter, qty: 1 },
      { id: 'hp_potion', qty: 5 },
      { id: 'mp_potion', qty: 3 },
      { id: 'town_bread', qty: 4 },
    ],
  };
}
