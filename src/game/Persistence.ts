import { defaultSave, type HeroClass, type SaveData } from './types';

const KEY = 'basiliska_save_v1';

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== 1 || !data.heroClass) return null;
    const base = defaultSave(data.heroClass, data.name);
    return { ...base, ...data, skills: { ...base.skills, ...data.skills } };
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function newSave(heroClass: HeroClass, name: string): SaveData {
  const data = defaultSave(heroClass, name);
  writeSave(data);
  return data;
}
