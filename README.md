# Basiliska

Basiliska is a browser-based, 3D retro MMORPG foundation in the spirit of
MU Online. Built with **Three.js + TypeScript + Vite**.

- Play: [machine10101-vibes.github.io/Basiliska](https://machine10101-vibes.github.io/Basiliska/)
- GitHub: [machine10101-vibes/Basiliska](https://github.com/machine10101-vibes/Basiliska)

It ships the four architectural pillars the rest of a client can grow on:

| Pillar | Where | What it does |
| --- | --- | --- |
| Fixed isometric camera | `src/core/IsometricCamera.ts` | Orthographic camera locked at 45° pitch / 45° yaw, follow-only, no rotate/zoom controls |
| 2D grid under a 3D world | `src/grid/` | Flat typed-array tile grid, A* pathfinding, tile-by-tile movement with 8-way snapped facing |
| Retro unlit shading | `src/render/shaders/`, `src/render/UnlitVertexColorMaterial.ts` | Raw GLSL that ignores scene lights and shades purely by vertex colour, plus an emissive "+7 to +15" item glow with adjustable intensity |
| Lean single-thread loop | `src/core/Game.ts` | One rAF loop, no per-frame allocations, batched static geometry, ~8 draw calls |

## Running locally

```bash
npm install
npm run dev        # http://127.0.0.1:47321
```

Other scripts:

```bash
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production bundle into dist/
npm run preview    # serve the production bundle on the same port
```

Requires Node 20+ and a browser with WebGL2.

## Controls

- **Left-click** a floor tile: the player walks there tile by tile, routing around obstacles.
- **HUD → Item glow**: pick a level tier (+7 gold, +9 blue, ...) and drag the intensity slider to change the aura brightness live.

The blue cube is an NPC that wanders on the same grid, reserving tiles as it moves so the two characters never overlap.

## Project layout

```
index.html                  Canvas + DOM HUD
src/main.ts                 Bootstrap (disables Three colour management for literal colours)
src/core/
  constants.ts              All tuning knobs (grid size, camera angles, speeds, pixel ratio)
  Game.ts                   Renderer, scene assembly, frame loop, click handling
  IsometricCamera.ts        Fixed orthographic isometric camera
  TileInput.ts              Pointer -> ground-plane ray -> tile coordinate
src/grid/
  TileGrid.ts               2D tile array (blocked + occupant layers), world<->tile mapping
  Pathfinder.ts             A* with preallocated typed arrays and a binary heap
  GridEntity.ts             Step-by-step tile mover with snapped facing and tile reservation
src/entities/
  Wanderer.ts               Simple random-walk NPC brain
src/render/
  shaders/unlit.vert.glsl   Vertex colour pass-through + per-vertex glow pulse
  shaders/unlit.frag.glsl   colour * tint + emissive * glow (GLOW_SHELL variant for the aura)
  UnlitVertexColorMaterial.ts  RawShaderMaterial wrapper + glow shell factory
  vertexColors.ts           Face-painting helpers, deterministic hash noise
  GridFloor.ts              10x10 floor, grid lines, merged obstacles (3 draw calls)
  TileMarker.ts             Hover / destination quads
  CharacterMesh.ts          Low-poly character cube with a facing "nose" and glow shell
src/ui/
  Hud.ts, hud.css           DOM overlay; writes only when values change
```

## Design notes

### Camera

The camera is an `OrthographicCamera` whose rotation is set once
(`rotation.order = 'YXZ'`, pitch −45° about X, yaw 45° about Y) and never
changed. Its position is always `target − forward × distance`, so "following the
player" is just moving the target. There are no OrbitControls or any other
input hooks on the camera. Angles and view size live in `constants.ts`.

### Grid

`TileGrid` is the source of truth. Entities have an integer `tile` and the
scene only *displays* that state. `tileToWorld`/`worldToTile` are the only
places where the 2D↔3D conversion happens, so the tile size or origin can
change without touching gameplay code.

Movement in `GridEntity` is strictly per step: leave tile centre → arrive at
the next tile centre. On step start the entity reserves the destination tile
in the grid's occupant layer and snaps its yaw with `atan2(dx, dz)`. Because
`dx`/`dz` ∈ {−1, 0, 1} this yields exactly the 8 classic headings. Click
requests made mid-step are queued until the step completes so the character
is never re-planned from a half-tile position.

`Pathfinder` is A* over 8 neighbours with octile heuristic and no
corner-cutting. All working memory (g/f scores, parents, open/closed stamps,
heap) is allocated once and reused via a generation stamp, so a search
allocates nothing.

### Shading

`UnlitVertexColorMaterial` extends `RawShaderMaterial`, so Three.js injects
none of its lighting, fog, tone-mapping or colour-space chunks. The fragment
output is literally:

```
color = vertexColor * uColor + uEmissive * uGlowIntensity * pulse
```

That is the behaviour of a fixed-function pipeline with `GL_LIGHTING` off and
`glColor` per vertex. Faces are "lit" by painting them different shades
(`paintBox`) exactly as early 3D games did.

The item glow is two pieces:

1. The additive emissive term above, on the object itself.
2. A **glow shell**: the same geometry buffer drawn again, slightly inflated,
   back-faces only, additive blending, no depth write. This is the pre-shader
   era trick for a halo and costs one extra draw call and zero extra memory.
   Its uniforms are shared with the base material, so changing
   `glowIntensity` or `emissive` on the base updates the halo for free.

`glowIntensity` (0 = off, 1 = nominal, up to 3 = overdriven) and the pulse
speed/depth are runtime-adjustable; the HUD slider drives them.

### Performance

- Single `renderer.setAnimationLoop`; nothing else runs per frame.
- Preallocated `Vector3`s everywhere in the hot path; no closures or arrays created per frame.
- Static objects use `matrixAutoUpdate = false`.
- Pixel ratio capped at 1 (`MAX_PIXEL_RATIO`) — sharper retro pixels and a quarter of the fill cost on HiDPI screens.
- Hover picking is one ray/plane intersection on pointer events, not a scene raycast per frame.
- HUD only writes to the DOM when text actually changes; FPS is sampled twice a second.

## Next steps this foundation is shaped for

- Replace `CharacterMesh` with skinned low-poly models; keep `GridEntity` as the transform driver.
- Load real maps into `TileGrid` from a walkability bitmap (the original `.att` files are exactly this).
- Add a monster/NPC pool sharing one `Pathfinder` instance.
- Add a UV-textured variant of the unlit shader (`texture * vertexColor + emissive`).
