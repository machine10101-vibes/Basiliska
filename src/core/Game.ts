import * as THREE from 'three';
import { Wanderer } from '../entities/Wanderer';
import { GridEntity } from '../grid/GridEntity';
import { Pathfinder } from '../grid/Pathfinder';
import { TileGrid } from '../grid/TileGrid';
import { CharacterMesh, NPC_PALETTE, PLAYER_PALETTE } from '../render/CharacterMesh';
import { GridFloor } from '../render/GridFloor';
import { TileMarker } from '../render/TileMarker';
import { UnlitVertexColorMaterial } from '../render/UnlitVertexColorMaterial';
import { Hud } from '../ui/Hud';
import {
  GRID_HEIGHT,
  GRID_WIDTH,
  MAX_DELTA_SECONDS,
  MAX_PIXEL_RATIO,
  NPC_TILES_PER_SECOND,
  PLAYER_TILES_PER_SECOND,
  TILE_SIZE,
} from './constants';
import { IsometricCamera } from './IsometricCamera';
import { TileInput } from './TileInput';

/** Tiles that are impassable on the test map (x, z). */
const TEST_OBSTACLES: ReadonlyArray<readonly [number, number]> = [
  [3, 3],
  [4, 3],
  [5, 3],
  [5, 4],
  [2, 7],
  [7, 6],
  [7, 7],
];

/**
 * Owns the renderer, scene graph, simulation objects and the frame loop.
 *
 * Performance posture (single main thread, no workers):
 *  - Exactly one `requestAnimationFrame` loop; no timers or observers firing per frame.
 *  - Zero allocations inside `frame()`; all vectors are preallocated.
 *  - Static geometry has `matrixAutoUpdate = false`, so Three.js skips it
 *    during matrix propagation. Only the two characters update per frame.
 *  - Scene `autoUpdate` is left on because the character count is tiny; flip
 *    to manual `updateMatrixWorld` calls once hundreds of entities exist.
 *  - Draw calls on the test map: floor, grid lines, obstacles, 2 characters,
 *    1 glow shell, 2 markers = 8.
 */
export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: IsometricCamera;
  private readonly timer = new THREE.Timer();

  private readonly grid: TileGrid;
  private readonly pathfinder: Pathfinder;
  private readonly input: TileInput;
  private readonly hud: Hud;

  private readonly player: GridEntity;
  private readonly playerMesh: CharacterMesh;
  private readonly npc: GridEntity;
  private readonly wanderer: Wanderer;

  private readonly hoverMarker: TileMarker;
  private readonly destinationMarker: TileMarker;

  private readonly canvas: HTMLCanvasElement;

  /** Transient status message (e.g. "Blocked") and how long it stays visible. */
  private flashText = '';
  private flashTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // -- Renderer -----------------------------------------------------------
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // crisp pixels; also cheaper
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    this.renderer.setClearColor(0x0c0a08, 1);
    // Our materials are raw GLSL: no tone mapping or colour-space conversion
    // is applied by the renderer, matching a fixed-function framebuffer.
    this.renderer.toneMapping = THREE.NoToneMapping;

    // -- Grid + simulation --------------------------------------------------
    this.grid = new TileGrid(GRID_WIDTH, GRID_HEIGHT, TILE_SIZE);
    for (const [x, z] of TEST_OBSTACLES) this.grid.setBlocked(x, z, true);
    this.pathfinder = new Pathfinder(this.grid);

    // -- Camera -------------------------------------------------------------
    this.camera = new IsometricCamera(canvas.clientWidth / Math.max(1, canvas.clientHeight));

    // -- Static world -------------------------------------------------------
    this.scene.add(new GridFloor(this.grid).group);

    this.hoverMarker = new TileMarker(this.grid, 0xffffff, 0.18);
    this.destinationMarker = new TileMarker(this.grid, 0xe0b040, 0.55, 0.16);
    this.scene.add(this.hoverMarker.mesh, this.destinationMarker.mesh);

    // -- Characters ---------------------------------------------------------
    this.playerMesh = new CharacterMesh(PLAYER_PALETTE, 'Player');
    this.player = new GridEntity(
      1,
      this.playerMesh.mesh,
      this.grid,
      this.pathfinder,
      { x: 1, z: 1 },
      PLAYER_TILES_PER_SECOND,
    );
    this.scene.add(this.playerMesh.mesh);

    const npcMesh = new CharacterMesh(NPC_PALETTE, 'NPC');
    this.npc = new GridEntity(
      2,
      npcMesh.mesh,
      this.grid,
      this.pathfinder,
      { x: 7, z: 2 },
      NPC_TILES_PER_SECOND,
    );
    this.wanderer = new Wanderer(this.npc, this.grid);
    this.scene.add(npcMesh.mesh);

    this.camera.snapTo(this.playerMesh.mesh.position);

    // -- Input + HUD --------------------------------------------------------
    this.input = new TileInput(canvas, this.camera.camera, this.grid);
    this.input.onTileClick = (x, z) => this.handleTileClick(x, z);

    this.hud = new Hud({
      onGlowChange: (emissive, intensity) => this.playerMesh.setGlow(emissive, intensity),
    });

    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  /** Start the render loop. */
  start(): void {
    this.timer.connect(document);
    this.timer.reset();
    this.renderer.setAnimationLoop(this.frame);
  }

  /** Stop the loop and release GPU resources. */
  dispose(): void {
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('resize', this.handleResize);
    this.input.dispose();
    this.timer.dispose();
    this.renderer.dispose();
  }

  // ---------------------------------------------------------------------------
  // Frame
  // ---------------------------------------------------------------------------

  private readonly frame = (timestamp?: number): void => {
    this.timer.update(timestamp);
    const dt = Math.min(this.timer.getDelta(), MAX_DELTA_SECONDS);

    UnlitVertexColorMaterial.tick(this.timer.getElapsed());

    this.wanderer.update(dt);
    this.npc.update(dt);
    this.player.update(dt);

    if (!this.player.isMoving) this.destinationMarker.hide();

    if (this.input.hasHover) {
      this.hoverMarker.showAt(this.input.hovered.x, this.input.hovered.z);
    } else {
      this.hoverMarker.hide();
    }

    this.camera.follow(this.playerMesh.mesh.position, dt);

    this.hud.setPlayerTile(this.player.tile.x, this.player.tile.z);
    this.hud.setHoverTile(this.input.hovered.x, this.input.hovered.z, this.input.hasHover);
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.hud.setStatus(this.flashText);
    } else {
      this.hud.setStatus(this.player.isMoving ? 'Walking' : 'Idle');
    }
    this.hud.tickFps(dt);

    this.renderer.render(this.scene, this.camera.camera);
  };

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  private handleTileClick(x: number, z: number): void {
    if (!this.grid.isWalkable(x, z, this.player.id)) {
      this.flash('Blocked');
      return;
    }
    if (this.player.moveTo(x, z)) {
      this.destinationMarker.showAt(x, z);
    } else {
      this.flash('No path');
    }
  }

  private flash(text: string, seconds = 1.2): void {
    this.flashText = text;
    this.flashTimer = seconds;
  }

  private readonly handleResize = (): void => {
    const width = this.canvas.clientWidth;
    const height = Math.max(1, this.canvas.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.setAspect(width / height);
  };
}
