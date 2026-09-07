/** Emissive colours for the classic item-level glow tiers. */
export const GLOW_PRESETS: Record<string, number> = {
  none: 0x000000,
  gold: 0xd88a20, // +7 .. +8
  blue: 0x2a70ff, // +9 .. +10
  crimson: 0xff3030, // +11 .. +12
  violet: 0xb040ff, // +13 .. +14
  white: 0xf0f0ff, // +15
};

export interface HudCallbacks {
  onGlowChange(emissiveHex: number, intensity: number): void;
}

/**
 * Thin binding between game state and the DOM overlay.
 *
 * DOM writes are the most expensive thing a HUD can do, so every setter caches
 * the last value and only touches `textContent` when it changes. FPS is
 * sampled at a fixed interval rather than every frame.
 */
export class Hud {
  private readonly fpsEl = byId('hud-fps');
  private readonly playerTileEl = byId('hud-player-tile');
  private readonly hoverTileEl = byId('hud-hover-tile');
  private readonly statusEl = byId('hud-status');
  private readonly glowValueEl = byId('glow-value');
  private readonly glowRange = byId<HTMLInputElement>('glow-range');
  private readonly glowPreset = byId<HTMLSelectElement>('glow-preset');

  private lastPlayerTile = '';
  private lastHoverTile = '';
  private lastStatus = '';

  private frames = 0;
  private fpsAccumulator = 0;

  constructor(callbacks: HudCallbacks) {
    const emit = () => {
      const preset = this.glowPreset.value;
      const intensity = preset === 'none' ? 0 : Number(this.glowRange.value);
      this.glowValueEl.textContent = intensity.toFixed(2);
      this.glowRange.disabled = preset === 'none';
      callbacks.onGlowChange(GLOW_PRESETS[preset] ?? 0, intensity);
    };
    this.glowRange.addEventListener('input', emit);
    this.glowPreset.addEventListener('change', emit);
    emit();
  }

  setPlayerTile(x: number, z: number): void {
    const text = `${x}, ${z}`;
    if (text !== this.lastPlayerTile) {
      this.lastPlayerTile = text;
      this.playerTileEl.textContent = text;
    }
  }

  setHoverTile(x: number, z: number, visible: boolean): void {
    const text = visible ? `${x}, ${z}` : '—';
    if (text !== this.lastHoverTile) {
      this.lastHoverTile = text;
      this.hoverTileEl.textContent = text;
    }
  }

  setStatus(text: string): void {
    if (text !== this.lastStatus) {
      this.lastStatus = text;
      this.statusEl.textContent = text;
    }
  }

  /** Feed one frame's delta; updates the FPS readout roughly twice a second. */
  tickFps(dt: number): void {
    this.frames++;
    this.fpsAccumulator += dt;
    if (this.fpsAccumulator >= 0.5) {
      this.fpsEl.textContent = String(Math.round(this.frames / this.fpsAccumulator));
      this.frames = 0;
      this.fpsAccumulator = 0;
    }
  }
}

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`HUD element #${id} is missing from index.html`);
  return el as T;
}
