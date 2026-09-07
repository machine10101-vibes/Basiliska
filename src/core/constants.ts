/**
 * Global tuning constants. Everything that defines the "feel" of the client
 * lives here so it can be adjusted without hunting through subsystems.
 */

/** World-space size of one grid tile (edge length). 1 tile == 1 world unit. */
export const TILE_SIZE = 1;

/** Dimensions of the test map, in tiles. */
export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 10;

/**
 * Camera orientation. MU Online uses a fixed oblique/isometric-style view.
 * The camera looks 45° down (pitch about X) and is rotated 45° about Y so
 * the grid's diagonals run vertically on screen.
 */
export const CAMERA_PITCH_DEG = 45;
export const CAMERA_YAW_DEG = 45;

/**
 * Half of the vertical extent of the orthographic view, in world units.
 * Smaller values zoom in. 6 shows roughly the whole 10x10 grid.
 */
export const CAMERA_VIEW_HALF_HEIGHT = 6;

/** How far the camera is pulled back along its view axis (only affects clipping). */
export const CAMERA_DISTANCE = 40;

/**
 * Smoothing factor for camera follow (per second). Higher snaps faster;
 * `Infinity` gives a rigidly locked camera like the original client.
 */
export const CAMERA_FOLLOW_RATE = 8;

/**
 * Upper bound for the device pixel ratio. Rendering at 1:1 keeps the retro
 * look (visible pixels, no sub-pixel smoothing) and keeps fill-rate low.
 */
export const MAX_PIXEL_RATIO = 1;

/** Movement speed of the player, in tiles per second. */
export const PLAYER_TILES_PER_SECOND = 4;

/** Movement speed of wandering NPCs, in tiles per second. */
export const NPC_TILES_PER_SECOND = 2;

/** Largest simulation step the game loop will take (guards against tab-switch spikes). */
export const MAX_DELTA_SECONDS = 0.1;
