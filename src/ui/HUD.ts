import {
  ITEM_META,
  SKILL_META,
  xpForLevel,
  type ItemStack,
  type SaveData,
  type SkillId,
} from '../game/types';

export type ChatKind = 'system' | 'xp' | 'combat' | 'loot' | 'plain' | 'npc';

export class HUD {
  private chatLog: HTMLElement;
  private invGrid: HTMLElement;
  private invCount: HTMLElement;
  private skillsList: HTMLElement;
  private skillsPanel: HTMLElement;
  private progressWrap: HTMLElement;
  private progressFill: HTMLElement;
  private progressLabel: HTMLElement;
  private targetInfo: HTMLElement;
  private targetName: HTMLElement;
  private targetHp: HTMLElement;
  private hpFill: HTMLElement;
  private mpFill: HTMLElement;
  private sdFill: HTMLElement;
  private hpText: HTMLElement;
  private mpText: HTMLElement;
  private sdText: HTMLElement;
  private goldText: HTMLElement;
  private levelText: HTMLElement;
  private nameText: HTMLElement;
  private classText: HTMLElement;
  private xpFill: HTMLElement;
  private minimap: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private touchHint: HTMLElement;
  private inventory: HTMLElement;
  private btnInventory: HTMLButtonElement;
  private zoneLabel: HTMLElement;
  private narrowMq: MediaQueryList;
  private desktopInvInited = false;

  onAction: ((action: string) => void) | null = null;
  onInventoryClick: ((index: number) => void) | null = null;

  constructor() {
    this.chatLog = el('chat-log');
    this.invGrid = el('inv-grid');
    this.invCount = el('inv-count');
    this.skillsList = el('skills-list');
    this.skillsPanel = el('skills-panel');
    this.progressWrap = el('progress-wrap');
    this.progressFill = el('progress-fill');
    this.progressLabel = el('progress-label');
    this.targetInfo = el('target-info');
    this.targetName = el('target-name');
    this.targetHp = el('target-hp');
    this.hpFill = el('hp-fill');
    this.mpFill = el('mp-fill');
    this.sdFill = el('sd-fill');
    this.hpText = el('hp-text');
    this.mpText = el('mp-text');
    this.sdText = el('sd-text');
    this.goldText = el('gold-text');
    this.levelText = el('level-text');
    this.nameText = el('hero-name');
    this.classText = el('hero-class');
    this.xpFill = el('xp-fill');
    this.minimap = el('minimap') as HTMLCanvasElement;
    this.minimapCtx = this.minimap.getContext('2d')!;
    this.touchHint = el('touch-hint');
    this.inventory = el('inventory');
    this.btnInventory = el('btn-inventory') as HTMLButtonElement;
    this.zoneLabel = el('minimap-label');
    this.narrowMq = window.matchMedia('(max-width: 480px)');

    el('btn-skills').addEventListener('click', () => {
      this.skillsPanel.hidden = !this.skillsPanel.hidden;
    });
    el('skills-close').addEventListener('click', () => {
      this.skillsPanel.hidden = true;
    });
    this.btnInventory.addEventListener('click', () => this.setInventoryOpen(this.inventory.hidden));
    el('inv-close').addEventListener('click', () => this.setInventoryOpen(false));

    const sync = () => this.syncInventoryForViewport();
    if (typeof this.narrowMq.addEventListener === 'function') {
      this.narrowMq.addEventListener('change', sync);
    } else {
      this.narrowMq.addListener(sync);
    }
    this.syncInventoryForViewport();

    document.querySelectorAll('.ab-slot').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = (btn as HTMLElement).dataset.action;
        if (action) this.onAction?.(action);
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 120);
      });
    });

    setTimeout(() => this.touchHint.classList.add('fade'), 9000);
  }

  setVisible(on: boolean): void {
    el('hud').style.display = on ? '' : 'none';
  }

  private syncInventoryForViewport(): void {
    if (this.narrowMq.matches) {
      this.desktopInvInited = false;
      this.setInventoryOpen(false);
    } else if (!this.desktopInvInited) {
      this.desktopInvInited = true;
      this.setInventoryOpen(true);
    }
  }

  private setInventoryOpen(open: boolean): void {
    this.inventory.hidden = !open;
    this.btnInventory.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!this.narrowMq.matches) {
      this.btnInventory.style.display = open ? 'none' : 'flex';
    }
  }

  chat(msg: string, kind: ChatKind = 'system'): void {
    const line = document.createElement('div');
    line.className = `chat-line ${kind === 'plain' ? '' : kind}`.trim();
    line.textContent = msg;
    this.chatLog.appendChild(line);
    while (this.chatLog.children.length > 48) {
      this.chatLog.removeChild(this.chatLog.firstChild!);
    }
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
  }

  setBars(save: SaveData): void {
    this.hpText.textContent = `${Math.round(save.hp)} / ${save.maxHp}`;
    this.mpText.textContent = `${Math.round(save.mp)} / ${save.maxMp}`;
    this.sdText.textContent = `${Math.round(save.sd)} / ${save.maxSd}`;
    this.hpFill.style.width = `${(save.hp / save.maxHp) * 100}%`;
    this.mpFill.style.width = `${(save.mp / save.maxMp) * 100}%`;
    this.sdFill.style.width = `${(save.sd / save.maxSd) * 100}%`;
    this.goldText.textContent = String(save.gold);
    this.levelText.textContent = `Lv ${save.level}`;
    this.nameText.textContent = save.name;
    const next = xpForLevel(save.level + 1);
    const prev = xpForLevel(save.level);
    const ratio = next === prev ? 1 : (save.xp - prev) / (next - prev);
    this.xpFill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  }

  setClassLabel(label: string): void {
    this.classText.textContent = label;
  }

  setZone(name: string): void {
    this.zoneLabel.textContent = name;
  }

  setInventory(items: ItemStack[], save?: SaveData): void {
    this.invGrid.innerHTML = '';
    const slots = 32;
    const worn = new Set([save?.weapon, save?.hat, save?.shield].filter(Boolean));
    for (let i = 0; i < slots; i++) {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'inv-slot';
      const item = items[i];
      if (item) {
        const meta = ITEM_META[item.id];
        slot.classList.add('has-item');
        if (worn.has(item.id)) slot.classList.add('equipped');
        slot.title = (meta?.name ?? item.id) + (worn.has(item.id) ? ' (equipped — click to swap)' : '');
        slot.innerHTML = `<span>${meta?.icon ?? '?'}</span>${
          item.qty > 1 ? `<span class="inv-qty">${item.qty}</span>` : ''
        }`;
        const idx = i;
        slot.addEventListener('click', () => this.onInventoryClick?.(idx));
      }
      this.invGrid.appendChild(slot);
    }
    this.invCount.textContent = `${items.length}/${slots}`;
  }

  setSkills(save: SaveData): void {
    this.skillsList.innerHTML = '';
    (Object.keys(SKILL_META) as SkillId[]).forEach((id) => {
      const s = save.skills[id];
      const meta = SKILL_META[id];
      const next = xpForLevel(s.level + 1);
      const prev = xpForLevel(s.level);
      const ratio = next === prev ? 1 : (s.xp - prev) / Math.max(1, next - prev);
      const row = document.createElement('div');
      row.className = 'skill-row';
      row.innerHTML = `
        <div class="skill-icon">${meta.icon}</div>
        <div class="skill-meta">
          <div class="skill-name">${meta.name}</div>
          <div class="skill-xp"><div style="width:${Math.max(0, Math.min(1, ratio)) * 100}%"></div></div>
        </div>
        <div class="skill-lvl">${s.level}</div>`;
      this.skillsList.appendChild(row);
    });
  }

  setProgress(on: boolean, label = '', ratio = 0): void {
    this.progressWrap.hidden = !on;
    if (on) {
      this.progressLabel.textContent = label;
      this.progressFill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
    }
  }

  setTarget(name: string | null, hp = 0, maxHp = 1): void {
    if (!name) {
      this.targetInfo.hidden = true;
      return;
    }
    this.targetInfo.hidden = false;
    this.targetName.textContent = name;
    this.targetHp.style.width = `${(hp / Math.max(1, maxHp)) * 100}%`;
  }

  drawMinimap(
    px: number,
    pz: number,
    marks: { x: number; z: number; color: string }[],
    camYaw = Math.PI / 4,
  ): void {
    const ctx = this.minimapCtx;
    const w = this.minimap.width;
    const h = this.minimap.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1c2a16';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
    ctx.fill();

    const scale = 2.15;
    const ang = -(camYaw - Math.PI / 4);
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const toX = (x: number, z: number) => {
      const dx = (x - px) * scale;
      const dz = (z - pz) * scale;
      return w / 2 + dx * c - dz * s;
    };
    const toY = (x: number, z: number) => {
      const dx = (x - px) * scale;
      const dz = (z - pz) * scale;
      return h / 2 + dx * s + dz * c;
    };

    ctx.fillStyle = '#6a6254';
    ctx.fillRect(toX(-16, -14), toY(-16, -14), 32 * scale, 28 * scale);
    ctx.fillStyle = '#8a8070';
    ctx.beginPath();
    ctx.arc(toX(0, 0), toY(0, 0), 9.2 * scale, 0, Math.PI * 2);
    ctx.fill();

    for (const m of marks) {
      ctx.fillStyle = m.color;
      ctx.fillRect(toX(m.x, m.z) - 2, toY(m.x, m.z) - 2, 4, 4);
    }

    ctx.fillStyle = '#f0d070';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function el(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node;
}
