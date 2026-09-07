import * as THREE from 'three';
import { HUD } from '../ui/HUD';
import { VFX } from '../rendering/vfx';
import {
  animateDeath,
  animateHitFlinch,
  animateMobAttack,
  animatePlayerAttack,
  animatePlayerIdle,
  animatePlayerWalk,
  animateQuadWalk,
  PLAYER_ATTACK_CONNECT_END,
  PLAYER_ATTACK_CONNECT_START,
  PLAYER_ATTACK_DURATION,
  resetPlayerPose,
  turnTowardYaw,
} from '../rendering/anim';
import {
  createCrawler,
  createDummy,
  createFountain,
  createGate,
  createGoblin,
  createGodRays,
  createGround,
  createHerb,
  createHouse,
  createLamp,
  createMoveMarker,
  createNpc,
  createPlayerMesh,
  createSkyDome,
  createStall,
  createTree,
  createWallSegment,
  createWolf,
  flashMesh,
} from '../rendering/meshes';
import { CLASS_META, ITEM_META, levelFromXp, type HeroClass, type SaveData, type SkillId } from './types';
import { loadSave, newSave, writeSave } from './Persistence';

type MobKind = 'dummy' | 'wolf' | 'goblin' | 'crawler';
type InteractKind = MobKind | 'herb' | 'npc';

interface WorldObject {
  kind: InteractKind;
  mesh: THREE.Group;
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  depleted: boolean;
  respawnAt: number;
  home: { x: number; z: number };
  aggro: number;
  atkRange: number;
  dmg: [number, number];
  gold: number;
  loot?: string;
  npcLine?: string;
}

type Activity =
  | { type: 'idle' }
  | { type: 'move'; tx: number; tz: number }
  | { type: 'gather'; target: WorldObject; elapsed: number; duration: number }
  | { type: 'combat'; target: WorldObject; cooldown: number; swingT: number; hitDone: boolean };

const TOWN = { x0: -16, x1: 16, z0: -14, z1: 14 };
const SAVE_EVERY = 3;
const FRUSTUM = 11.5;

function inTown(x: number, z: number): boolean {
  return x > TOWN.x0 + 0.8 && x < TOWN.x1 - 0.8 && z > TOWN.z0 + 0.8 && z < TOWN.z1 - 0.8;
}

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private player!: THREE.Group;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private clock = new THREE.Clock();
  private hud!: HUD;
  private vfx!: VFX;
  private save!: SaveData;
  private objects: WorldObject[] = [];
  private ground!: THREE.Object3D;
  private activity: Activity = { type: 'idle' };
  private moveMarker!: THREE.Mesh;
  private saveTimer = 0;
  private playing = false;
  private animTime = 0;
  private moveBlend = 0;
  private camTarget = new THREE.Vector3();
  private camPos = new THREE.Vector3();
  private deathAnims: { mesh: THREE.Group; t: number; dur: number }[] = [];
  private hitReacts: { mesh: THREE.Object3D; t: number }[] = [];
  private pendingTarget: WorldObject | null = null;
  private pendingPowered = false;
  private fountainJet: THREE.Object3D | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.setClearColor(0x6a90b8);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x7a98b0, 0.016);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      -FRUSTUM * aspect,
      FRUSTUM * aspect,
      FRUSTUM,
      -FRUSTUM,
      0.1,
      220,
    );

    this.buildWorldPreview();
    this.bindTitle();
    window.addEventListener('resize', () => this.onResize());
    this.tick();

    const existing = loadSave();
    if (existing) {
      const resume = document.getElementById('btn-resume');
      if (resume) {
        resume.hidden = false;
        resume.textContent = `Continue ${existing.name} · ${CLASS_META[existing.heroClass].name}`;
      }
    }
  }

  private buildWorldPreview(): void {
    this.scene.add(createSkyDome());
    const groundRoot = createGround();
    this.ground = groundRoot.getObjectByName('grass') ?? groundRoot;
    this.scene.add(groundRoot);
    this.scene.add(createGodRays());

    const hemi = new THREE.HemisphereLight(0xffe8c0, 0x2a3a20, 0.72);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe0b0, 1.35);
    sun.position.set(18, 28, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight(0x6a7a88, 0.28));

    const fountain = createFountain();
    this.fountainJet = fountain.getObjectByName('fountainJet') ?? null;
    this.scene.add(fountain);

    const houses: [number, number, number, number, number, number][] = [
      [-10.5, -6.5, 4.2, 3.4, 2.1, 0xa43a28],
      [-11.2, 5.5, 3.8, 3.2, 2.0, 0x8a3020],
      [10.4, -5.8, 4.0, 3.6, 2.2, 0xb8442a],
      [10.8, 6.2, 3.6, 3.3, 1.95, 0x9a3824],
      [-6.5, -10.2, 3.4, 3.0, 1.85, 0xa85028],
      [6.2, -10.4, 3.5, 3.1, 1.9, 0x8c2e1c],
    ];
    for (const [x, z, w, d, h, roof] of houses) {
      const house = createHouse(w, d, h, roof);
      house.position.set(x, 0, z);
      this.scene.add(house);
    }

    const stallW = createStall(0x8a2a1a);
    stallW.position.set(-5.4, 0, 4.6);
    this.scene.add(stallW);
    const stallE = createStall(0x2a4a7a);
    stallE.position.set(5.6, 0, 4.2);
    this.scene.add(stallE);

    for (const [x, z] of [
      [-7, -7],
      [7, -7],
      [-7, 7],
      [7, 7],
      [0, 10.5],
      [0, -10.5],
    ]) {
      const lamp = createLamp();
      lamp.position.set(x, 0, z);
      this.scene.add(lamp);
    }

    const wallN = createWallSegment(28);
    wallN.position.set(0, 0, TOWN.z1);
    this.scene.add(wallN);
    const wallS = createWallSegment(28);
    wallS.position.set(0, 0, TOWN.z0);
    this.scene.add(wallS);
    const wallE = createWallSegment(24);
    wallE.rotation.y = Math.PI / 2;
    wallE.position.set(TOWN.x1, 0, 0);
    this.scene.add(wallE);
    const wallW = createWallSegment(24);
    wallW.rotation.y = Math.PI / 2;
    wallW.position.set(TOWN.x0, 0, 0);
    this.scene.add(wallW);

    const gateN = createGate();
    gateN.position.set(0, 0, TOWN.z1);
    this.scene.add(gateN);
    const gateS = createGate();
    gateS.position.set(0, 0, TOWN.z0);
    this.scene.add(gateS);

    const treeSpots: [number, number][] = [
      [-20, 8],
      [-22, 14],
      [-18, 18],
      [20, 10],
      [23, 16],
      [19, 20],
      [-22, -10],
      [-19, -16],
      [21, -12],
      [18, -18],
      [-8, 20],
      [8, 21],
      [-10, -20],
      [9, -21],
      [-26, 2],
      [26, -3],
    ];
    treeSpots.forEach(([x, z], i) => {
      const t = createTree(i);
      t.position.set(x, 0, z);
      this.scene.add(t);
    });

    this.moveMarker = createMoveMarker();
    this.moveMarker.visible = false;
    this.scene.add(this.moveMarker);

    this.camera.position.set(22, 22, 22);
    this.camera.lookAt(0, 0.6, 0);
  }

  private bindTitle(): void {
    const overlay = document.getElementById('title-screen');
    const nameInput = document.getElementById('hero-name-input') as HTMLInputElement | null;
    const cards = document.querySelectorAll<HTMLButtonElement>('.class-card');
    let picked: HeroClass = 'vanguard';
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        picked = (card.dataset.class as HeroClass) ?? 'vanguard';
      });
    });
    document.getElementById('btn-enter')?.addEventListener('click', () => {
      const name = nameInput?.value.trim() || 'Wanderer';
      this.startPlay(newSave(picked, name));
      if (overlay) overlay.hidden = true;
    });
    document.getElementById('btn-resume')?.addEventListener('click', () => {
      const data = loadSave();
      if (!data) return;
      this.startPlay(data);
      if (overlay) overlay.hidden = true;
    });
  }

  private startPlay(save: SaveData): void {
    this.save = save;
    this.hud = new HUD();
    this.vfx = new VFX(this.scene, this.camera);
    this.hud.setVisible(true);
    this.hud.setClassLabel(CLASS_META[save.heroClass].name);
    this.hud.setBars(save);
    this.hud.setInventory(save.inventory);
    this.hud.setSkills(save);
    this.hud.chat(`Welcome to Valehaven, ${save.name}.`, 'system');
    this.hud.chat('The north gate opens onto wolf woods. West: raiders. East: crawlers.', 'system');
    this.hud.chat('Click the cobbles to walk. Click foes to strike. Town is a safe hold.', 'system');

    this.player = createPlayerMesh(save.heroClass);
    this.player.position.set(save.x, 0, save.z);
    this.scene.add(this.player);

    this.spawnActors();

    this.hud.onAction = (action) => this.useAction(action);
    this.hud.onInventoryClick = (i) => this.useItem(i);
    window.addEventListener('pointerdown', (e) => this.onPointer(e));
    window.addEventListener('keydown', (e) => this.onKey(e));

    this.playing = true;
  }

  private spawnActors(): void {
    const addMob = (
      kind: MobKind,
      mesh: THREE.Group,
      x: number,
      z: number,
      hp: number,
      aggro: number,
      atkRange: number,
      dmg: [number, number],
      gold: number,
      loot: string,
      name: string,
    ) => {
      mesh.position.set(x, 0, z);
      this.scene.add(mesh);
      this.objects.push({
        kind,
        mesh,
        id: `${kind}-${x}-${z}`,
        name,
        hp,
        maxHp: hp,
        depleted: false,
        respawnAt: 0,
        home: { x, z },
        aggro,
        atkRange,
        dmg,
        gold,
        loot,
      });
    };

    const dummy = createDummy();
    addMob('dummy', dummy, 4.8, -3.4, 40, 0, 0, [0, 0], 0, '', 'Training Dummy');

    const wolves: [number, number][] = [
      [-3, 22],
      [3.5, 24],
      [-6, 26],
      [7, 23],
    ];
    wolves.forEach(([x, z]) => addMob('wolf', createWolf(), x, z, 48, 6.2, 1.7, [4, 8], 12, 'wolf_pelt', 'Vale Wolf'));

    const goblins: [number, number][] = [
      [-24, -2],
      [-26, 3],
      [-23, 6],
    ];
    goblins.forEach(([x, z]) =>
      addMob('goblin', createGoblin(), x, z, 56, 6.6, 1.6, [5, 9], 18, 'goblin_ear', 'Goblin Raider'),
    );

    const crawlers: [number, number][] = [
      [24, 1],
      [26, -4],
      [23, 6],
    ];
    crawlers.forEach(([x, z]) =>
      addMob('crawler', createCrawler(), x, z, 42, 5.8, 1.5, [3, 7], 14, 'crawler_ichor', 'Spore Crawler'),
    );

    const herbs: [number, number][] = [
      [-12, 17],
      [12, 18],
      [-14, -17],
      [13, -16],
      [18, 8],
    ];
    herbs.forEach(([x, z], i) => {
      const mesh = createHerb();
      mesh.position.set(x, 0, z);
      this.scene.add(mesh);
      this.objects.push({
        kind: 'herb',
        mesh,
        id: `herb-${i}`,
        name: 'Vale Herb',
        hp: 1,
        maxHp: 1,
        depleted: false,
        respawnAt: 0,
        home: { x, z },
        aggro: 0,
        atkRange: 0,
        dmg: [0, 0],
        gold: 0,
        loot: 'vale_herb',
      });
    });

    const npcs: [Parameters<typeof createNpc>[0], number, number, string, string][] = [
      ['herald', 1.6, 2.2, 'Gate Herald', 'Hold Valehaven. Wolves north, raiders west, crawlers east.'],
      ['smith', -5.4, 5.6, 'Ashen Smith', 'Steel is honest. Return with pelts if you want coin.'],
      ['alchemist', 5.6, 5.4, 'Vial Sister', 'Red restores flesh. Blue restores the aether.'],
      ['inn', 0.2, -4.8, 'Hearth Keep', 'Rest here. The wilderness does not forgive the weary.'],
    ];
    for (const [kind, x, z, name, line] of npcs) {
      const mesh = createNpc(kind);
      mesh.position.set(x, 0, z);
      this.scene.add(mesh);
      this.objects.push({
        kind: 'npc',
        mesh,
        id: `npc-${kind}`,
        name,
        hp: 1,
        maxHp: 1,
        depleted: false,
        respawnAt: 0,
        home: { x, z },
        aggro: 0,
        atkRange: 0,
        dmg: [0, 0],
        gold: 0,
        npcLine: line,
      });
    }
  }

  private onResize(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera.left = -FRUSTUM * aspect;
    this.camera.right = FRUSTUM * aspect;
    this.camera.top = FRUSTUM;
    this.camera.bottom = -FRUSTUM;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.playing) return;
    const map: Record<string, string> = {
      '1': 'attack',
      '2': 'skill',
      '3': 'potion',
      '4': 'mana',
      '5': 'examine',
      k: 'skills',
      K: 'skills',
    };
    const action = map[e.key];
    if (action === 'skills') {
      const panel = document.getElementById('skills-panel');
      if (panel) panel.hidden = !panel.hidden;
      return;
    }
    if (action) this.useAction(action);
  }

  private useAction(action: string): void {
    if (!this.playing) return;
    if (action === 'potion') {
      this.consume('hp_potion');
      return;
    }
    if (action === 'mana') {
      this.consume('mp_potion');
      return;
    }
    if (action === 'examine') {
      const near = this.nearestInteract(3.2);
      if (near) this.examine(near);
      else this.hud.chat('Nothing of note nearby.', 'plain');
      return;
    }
    if (action === 'attack' || action === 'skill') {
      const foe = this.nearestFoe(CLASS_META[this.save.heroClass].attackRange + 2.5);
      if (foe) this.engage(foe, action === 'skill');
      else this.hud.chat('No foe in reach.', 'plain');
    }
  }

  private useItem(index: number): void {
    const item = this.save.inventory[index];
    if (!item) return;
    if (item.id === 'hp_potion' || item.id === 'town_bread') this.consume(item.id);
    else if (item.id === 'mp_potion') this.consume(item.id);
    else this.hud.chat(`${ITEM_META[item.id]?.name ?? item.id}.`, 'plain');
  }

  private consume(id: string): void {
    const idx = this.save.inventory.findIndex((s) => s.id === id);
    if (idx < 0) {
      this.hud.chat('You have none of those.', 'plain');
      return;
    }
    const stack = this.save.inventory[idx];
    stack.qty -= 1;
    if (stack.qty <= 0) this.save.inventory.splice(idx, 1);
    if (id === 'hp_potion' || id === 'town_bread') {
      const heal = id === 'hp_potion' ? 45 : 22;
      this.save.hp = Math.min(this.save.maxHp, this.save.hp + heal);
      this.hud.chat(`You restore ${heal} life.`, 'xp');
      this.vfx.floatText(this.player.position, `+${heal}`, '#7ec87e');
    } else if (id === 'mp_potion') {
      this.save.mp = Math.min(this.save.maxMp, this.save.mp + 50);
      this.hud.chat('Aether returns.', 'xp');
    }
    this.hud.setBars(this.save);
    this.hud.setInventory(this.save.inventory);
  }

  private onPointer(e: PointerEvent): void {
    if (!this.playing) return;
    const t = e.target as HTMLElement;
    if (t.closest('#hud') || t.closest('#title-screen')) return;

    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const hits = this.raycaster.intersectObjects(
      [...this.objects.map((o) => o.mesh), this.ground],
      true,
    );
    if (!hits.length) return;

    const first = hits[0];
    const obj = this.objectFromMesh(first.object);
    if (obj && !obj.depleted) {
      if (obj.kind === 'npc') {
        this.hud.chat(`${obj.name}: ${obj.npcLine}`, 'npc');
        return;
      }
      if (obj.kind === 'herb') {
        this.pendingTarget = obj;
        this.activity = { type: 'move', tx: obj.mesh.position.x, tz: obj.mesh.position.z };
        this.showMarker(obj.mesh.position.x, obj.mesh.position.z);
        return;
      }
      this.engage(obj, this.pendingPowered);
      return;
    }

    const groundHit = hits.find((h) => h.object.name === 'grass' || h.object.name === 'plaza');
    const pt = (groundHit ?? first).point;
    this.pendingTarget = null;
    this.activity = { type: 'move', tx: pt.x, tz: pt.z };
    this.showMarker(pt.x, pt.z);
  }

  private objectFromMesh(mesh: THREE.Object3D): WorldObject | null {
    let n: THREE.Object3D | null = mesh;
    while (n) {
      const found = this.objects.find((o) => o.mesh === n);
      if (found) return found;
      n = n.parent;
    }
    return null;
  }

  private showMarker(x: number, z: number): void {
    this.moveMarker.position.set(x, 0.06, z);
    this.moveMarker.visible = true;
  }

  private engage(target: WorldObject, powered: boolean): void {
    if (target.kind === 'npc' || target.kind === 'herb') return;
    this.pendingTarget = target;
    this.pendingPowered = powered;
    const reach = CLASS_META[this.save.heroClass].attackRange + (powered ? 0.6 : 0);
    const dx = target.mesh.position.x - this.player.position.x;
    const dz = target.mesh.position.z - this.player.position.z;
    if (Math.hypot(dx, dz) > reach) {
      this.activity = { type: 'move', tx: target.mesh.position.x, tz: target.mesh.position.z };
      this.showMarker(target.mesh.position.x, target.mesh.position.z);
      return;
    }
    this.activity = { type: 'combat', target, cooldown: 0, swingT: 0, hitDone: false };
    this.hud.setTarget(target.name, target.hp, target.maxHp);
  }

  private examine(obj: WorldObject): void {
    if (obj.kind === 'npc') this.hud.chat(`${obj.name}: ${obj.npcLine}`, 'npc');
    else this.hud.chat(`${obj.name} — ${Math.round(obj.hp)}/${obj.maxHp} life.`, 'plain');
  }

  private nearestInteract(range: number): WorldObject | null {
    let best: WorldObject | null = null;
    let bestD = range;
    for (const o of this.objects) {
      if (o.depleted) continue;
      const d = Math.hypot(o.mesh.position.x - this.player.position.x, o.mesh.position.z - this.player.position.z);
      if (d < bestD) {
        best = o;
        bestD = d;
      }
    }
    return best;
  }

  private nearestFoe(range: number): WorldObject | null {
    let best: WorldObject | null = null;
    let bestD = range;
    for (const o of this.objects) {
      if (o.depleted || o.kind === 'npc' || o.kind === 'herb') continue;
      const d = Math.hypot(o.mesh.position.x - this.player.position.x, o.mesh.position.z - this.player.position.z);
      if (d < bestD) {
        best = o;
        bestD = d;
      }
    }
    return best;
  }

  private addItem(id: string, qty: number): void {
    const meta = ITEM_META[id];
    if (meta?.stackable) {
      const stack = this.save.inventory.find((s) => s.id === id);
      if (stack) {
        stack.qty += qty;
        return;
      }
    }
    if (this.save.inventory.length >= 32) {
      this.hud.chat('Inventory is full.', 'plain');
      return;
    }
    this.save.inventory.push({ id, qty });
  }

  private grantXp(amount: number, skill?: SkillId): void {
    this.save.xp += amount;
    const nextLevel = levelFromXp(this.save.xp);
    if (nextLevel > this.save.level) {
      this.save.level = nextLevel;
      this.save.maxHp += 8;
      this.save.maxMp += 5;
      this.save.hp = this.save.maxHp;
      this.save.mp = this.save.maxMp;
      this.hud.chat(`You reach level ${this.save.level}!`, 'xp');
      this.vfx.floatText(this.player.position, `LEVEL ${this.save.level}`, '#f0d070');
    }
    if (skill) {
      const s = this.save.skills[skill];
      s.xp += amount;
      const lv = levelFromXp(s.xp);
      if (lv > s.level) {
        s.level = lv;
        this.hud.chat(`${skill} rises to ${lv}.`, 'xp');
      }
    }
    this.hud.setSkills(this.save);
    this.hud.setBars(this.save);
  }

  private kill(obj: WorldObject): void {
    obj.depleted = true;
    obj.hp = 0;
    obj.respawnAt = this.clock.elapsedTime + (obj.kind === 'dummy' ? 8 : 20);
    this.deathAnims.push({ mesh: obj.mesh, t: 0, dur: 0.7 });
    this.hud.setTarget(null);
    if (this.activity.type === 'combat' && this.activity.target === obj) this.activity = { type: 'idle' };
    if (obj.kind === 'dummy') {
      this.grantXp(18, 'strength');
      this.hud.chat('The dummy splinters. It will be rebuilt.', 'combat');
      return;
    }
    const gold = obj.gold + Math.floor(Math.random() * 6);
    this.save.gold += gold;
    if (obj.loot) this.addItem(obj.loot, 1);
    this.grantXp(obj.kind === 'goblin' ? 36 : 28, obj.kind === 'crawler' ? 'energy' : 'strength');
    this.hud.chat(`${obj.name} falls. +${gold} gold.`, 'loot');
    this.vfx.spawnBurst(obj.mesh.position, 0xf0d070, 14, 4);
    this.hud.setInventory(this.save.inventory);
    this.hud.setBars(this.save);
  }

  private playerStrike(target: WorldObject, powered: boolean): void {
    const cls = this.save.heroClass;
    let dmg = 8 + this.save.skills.strength.level * 0.6 + this.save.level * 1.2;
    if (cls === 'sage') dmg = 10 + this.save.skills.energy.level * 0.9 + this.save.level;
    if (cls === 'archer') dmg = 9 + this.save.skills.agility.level * 0.8 + this.save.level;
    if (powered) {
      const cost = cls === 'sage' ? 18 : 10;
      if (this.save.mp < cost) {
        this.hud.chat('Not enough aether.', 'plain');
        dmg *= 0.7;
      } else {
        this.save.mp -= cost;
        dmg *= 1.55;
        this.vfx.spawnBurst(
          target.mesh.position,
          cls === 'sage' ? 0x6ea8ff : cls === 'archer' ? 0x7ec87e : 0xf0d070,
          12,
          5,
        );
      }
    }
    dmg = Math.round(dmg + Math.random() * 4);
    target.hp -= dmg;
    flashMesh(target.mesh);
    this.hitReacts.push({ mesh: target.mesh, t: 0.22 });
    this.vfx.floatText(target.mesh.position, `-${dmg}`, '#e08080');
    this.hud.setTarget(target.name, target.hp, target.maxHp);
    this.hud.setBars(this.save);
    if (target.hp <= 0) this.kill(target);
  }

  private mobThink(dt: number): void {
    if (!this.playing) return;
    const px = this.player.position.x;
    const pz = this.player.position.z;
    const playerSafe = inTown(px, pz);

    for (const o of this.objects) {
      if (o.kind === 'npc' || o.kind === 'herb') continue;
      if (o.depleted) {
        if (this.clock.elapsedTime >= o.respawnAt) {
          o.depleted = false;
          o.hp = o.maxHp;
          o.mesh.visible = true;
          o.mesh.rotation.set(0, 0, 0);
          o.mesh.scale.setScalar(1);
          o.mesh.position.set(o.home.x, 0, o.home.z);
        }
        continue;
      }
      if (o.kind === 'dummy' || o.aggro <= 0) continue;
      if (playerSafe) {
        const hx = o.home.x - o.mesh.position.x;
        const hz = o.home.z - o.mesh.position.z;
        const hd = Math.hypot(hx, hz);
        if (hd > 0.2) {
          o.mesh.position.x += (hx / hd) * 2.2 * dt;
          o.mesh.position.z += (hz / hd) * 2.2 * dt;
          turnTowardYaw(o.mesh, Math.atan2(hx, hz), dt);
          animateQuadWalk(o.mesh, this.animTime, 1);
        }
        continue;
      }
      const dx = px - o.mesh.position.x;
      const dz = pz - o.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < o.aggro && dist > o.atkRange) {
        o.mesh.position.x += (dx / dist) * 2.6 * dt;
        o.mesh.position.z += (dz / dist) * 2.6 * dt;
        turnTowardYaw(o.mesh, Math.atan2(dx, dz), dt);
        animateQuadWalk(o.mesh, this.animTime, 1);
      } else if (dist <= o.atkRange) {
        turnTowardYaw(o.mesh, Math.atan2(dx, dz), dt, 10);
        if (Math.random() < dt * 0.85) {
          animateMobAttack(o.mesh, 0.5);
          const dmg = o.dmg[0] + Math.floor(Math.random() * (o.dmg[1] - o.dmg[0] + 1));
          const soaked = Math.min(this.save.sd, Math.floor(dmg * 0.35));
          this.save.sd = Math.max(0, this.save.sd - soaked);
          this.save.hp = Math.max(0, this.save.hp - (dmg - soaked));
          this.vfx.floatText(this.player.position, `-${dmg - soaked}`, '#ff8866');
          this.hud.setBars(this.save);
          if (this.save.hp <= 0) this.playerDeath();
        }
      } else {
        const hx = o.home.x - o.mesh.position.x;
        const hz = o.home.z - o.mesh.position.z;
        const hd = Math.hypot(hx, hz);
        if (hd > 0.25) {
          o.mesh.position.x += (hx / hd) * 1.8 * dt;
          o.mesh.position.z += (hz / hd) * 1.8 * dt;
        }
      }
    }
  }

  private playerDeath(): void {
    this.save.hp = this.save.maxHp;
    this.save.mp = this.save.maxMp;
    this.save.sd = this.save.maxSd;
    this.save.x = 0;
    this.save.z = 3.2;
    this.player.position.set(0, 0, 3.2);
    this.activity = { type: 'idle' };
    this.pendingTarget = null;
    this.hud.chat('You fall. The Herald pulls you back to the fountain.', 'combat');
    this.hud.setBars(this.save);
    this.vfx.spawnBurst(this.player.position, 0xc9a227, 16, 4);
  }

  private tick = (): void => {
    requestAnimationFrame(this.tick);
    const dt = Math.min(0.05, this.clock.getDelta());
    this.animTime += dt;
    if (this.fountainJet) this.fountainJet.position.y = 2.2 + Math.sin(this.animTime * 3) * 0.08;

    if (this.playing) {
      this.updatePlay(dt);
      this.vfx.update(dt);
      this.hud.setBars(this.save);
      this.hud.setZone(inTown(this.player.position.x, this.player.position.z) ? 'Valehaven' : 'Wilds');
      this.hud.drawMinimap(
        this.player.position.x,
        this.player.position.z,
        this.objects
          .filter((o) => !o.depleted)
          .map((o) => ({
            x: o.mesh.position.x,
            z: o.mesh.position.z,
            color:
              o.kind === 'npc' ? '#f0d070' : o.kind === 'herb' ? '#66cc55' : o.kind === 'dummy' ? '#aaaaaa' : '#cc4444',
          })),
      );
      this.saveTimer += dt;
      if (this.saveTimer >= SAVE_EVERY) {
        this.saveTimer = 0;
        this.save.x = this.player.position.x;
        this.save.z = this.player.position.z;
        writeSave(this.save);
      }
    } else {
      this.camera.position.set(20 + Math.sin(this.animTime * 0.15) * 2, 22, 22);
      this.camera.lookAt(0, 0.6, 0);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updatePlay(dt: number): void {
    this.save.sd = Math.min(this.save.maxSd, this.save.sd + dt * 4);
    this.save.mp = Math.min(this.save.maxMp, this.save.mp + dt * 1.6);
    if (inTown(this.player.position.x, this.player.position.z)) {
      this.save.hp = Math.min(this.save.maxHp, this.save.hp + dt * 2.4);
    }

    const speed = CLASS_META[this.save.heroClass].moveSpeed;
    let moving = false;

    if (this.activity.type === 'move') {
      const dx = this.activity.tx - this.player.position.x;
      const dz = this.activity.tz - this.player.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.18) {
        this.player.position.x = this.activity.tx;
        this.player.position.z = this.activity.tz;
        this.moveMarker.visible = false;
        if (this.pendingTarget && !this.pendingTarget.depleted) {
          if (this.pendingTarget.kind === 'herb') {
            this.activity = { type: 'gather', target: this.pendingTarget, elapsed: 0, duration: 1.6 };
            this.hud.setProgress(true, 'Gathering herbs…', 0);
          } else {
            this.engage(this.pendingTarget, false);
          }
        } else {
          this.activity = { type: 'idle' };
        }
      } else {
        this.player.position.x += (dx / dist) * speed * dt;
        this.player.position.z += (dz / dist) * speed * dt;
        turnTowardYaw(this.player, Math.atan2(dx, dz), dt);
        moving = true;
      }
    } else if (this.activity.type === 'gather') {
      this.activity.elapsed += dt;
      this.hud.setProgress(true, 'Gathering herbs…', this.activity.elapsed / this.activity.duration);
      if (this.activity.elapsed >= this.activity.duration) {
        const t = this.activity.target;
        t.depleted = true;
        t.respawnAt = this.clock.elapsedTime + 16;
        t.mesh.visible = false;
        this.addItem('vale_herb', 1);
        this.grantXp(12, 'vitality');
        this.hud.chat('You pick Vale Herb.', 'loot');
        this.hud.setInventory(this.save.inventory);
        this.hud.setProgress(false);
        this.activity = { type: 'idle' };
        this.pendingTarget = null;
      }
    } else if (this.activity.type === 'combat') {
      const t = this.activity.target;
      if (t.depleted) {
        this.activity = { type: 'idle' };
        this.hud.setTarget(null);
      } else {
        const dx = t.mesh.position.x - this.player.position.x;
        const dz = t.mesh.position.z - this.player.position.z;
        const dist = Math.hypot(dx, dz);
        const reach = CLASS_META[this.save.heroClass].attackRange;
        turnTowardYaw(this.player, Math.atan2(dx, dz), dt, 10);
        if (dist > reach + 0.35) {
          this.player.position.x += (dx / dist) * speed * dt;
          this.player.position.z += (dz / dist) * speed * dt;
          moving = true;
        } else {
          this.activity.cooldown -= dt;
          if (this.activity.cooldown <= 0 && this.activity.swingT <= 0) {
            this.activity.swingT = 0.001;
            this.activity.hitDone = false;
          }
          if (this.activity.swingT > 0) {
            this.activity.swingT += dt;
            const u = this.activity.swingT / PLAYER_ATTACK_DURATION;
            animatePlayerAttack(this.player, u, this.save.heroClass);
            if (
              !this.activity.hitDone &&
              u >= PLAYER_ATTACK_CONNECT_START &&
              u <= PLAYER_ATTACK_CONNECT_END
            ) {
              this.activity.hitDone = true;
              this.playerStrike(t, this.pendingPowered);
              this.pendingPowered = false;
            }
            if (this.activity.swingT >= PLAYER_ATTACK_DURATION) {
              this.activity.swingT = 0;
              this.activity.cooldown = 0.55;
              resetPlayerPose(this.player);
            }
          }
        }
        this.hud.setTarget(t.name, t.hp, t.maxHp);
      }
    }

    this.moveBlend += ((moving ? 1 : 0) - this.moveBlend) * Math.min(1, dt * 8);
    if (this.activity.type !== 'combat' || this.activity.swingT <= 0) {
      if (this.moveBlend > 0.08) animatePlayerWalk(this.player, this.animTime, this.moveBlend);
      else animatePlayerIdle(this.player, this.animTime);
    }

    this.mobThink(dt);

    for (let i = this.deathAnims.length - 1; i >= 0; i--) {
      const d = this.deathAnims[i];
      d.t += dt;
      animateDeath(d.mesh, d.t / d.dur);
      if (d.t >= d.dur) {
        d.mesh.visible = false;
        this.deathAnims.splice(i, 1);
      }
    }
    for (let i = this.hitReacts.length - 1; i >= 0; i--) {
      const h = this.hitReacts[i];
      h.t -= dt;
      animateHitFlinch(h.mesh, h.t, 1);
      if (h.t <= 0) {
        h.mesh.rotation.z = 0;
        this.hitReacts.splice(i, 1);
      }
    }

    const px = this.player.position.x;
    const pz = this.player.position.z;
    this.camTarget.set(px, 0.7, pz);
    this.camPos.set(px + 20, 22, pz + 20);
    this.camera.position.lerp(this.camPos, 1 - Math.pow(0.001, dt));
    this.camera.lookAt(this.camTarget);
  }
}
