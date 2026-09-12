import * as THREE from 'three';
import { makeCanvas } from './pixel';

function toMap(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function noise(x: number, y: number, s: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + s) * 43758.5453;
  return n - Math.floor(n);
}

export function grassTileMap(tiles = 48): THREE.CanvasTexture {
  const s = 32;
  const c = makeCanvas(s, s);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const n = noise(x, y, 3.1);
      const edge = x === 0 || y === 0 ? 0.78 : 1;
      const g = Math.floor((72 + n * 28) * edge);
      const r = Math.floor((42 + n * 14) * edge);
      const b = Math.floor((28 + n * 10) * edge);
      const i = (y * s + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toMap(c, tiles, tiles);
}

export function cobbleTileMap(tilesX = 10, tilesY = 10): THREE.CanvasTexture {
  const s = 32;
  const c = makeCanvas(s, s);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#6e675c';
  ctx.fillRect(0, 0, s, s);
  const stones: [number, number, number, number, string][] = [
    [2, 2, 13, 12, '#8a8274'],
    [16, 3, 14, 11, '#7a7366'],
    [2, 16, 12, 13, '#91897a'],
    [16, 16, 14, 13, '#80786c'],
  ];
  for (const [x, y, w, h, col] of stones) {
    ctx.fillStyle = '#3a342c';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = col;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = 'rgba(255,240,210,0.18)';
    ctx.fillRect(x + 1, y + 1, w - 3, 1);
  }
  return toMap(c, tilesX, tilesY);
}

export function plasterMap(): THREE.CanvasTexture {
  const s = 64;
  const c = makeCanvas(s, s);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#d4c2a0';
  ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(0, 0, s, 5);
  ctx.fillRect(0, s - 5, s, 5);
  ctx.fillRect(0, 0, 5, s);
  ctx.fillRect(s - 5, 0, 5, s);
  ctx.fillRect(s / 2 - 2, 0, 5, s);
  ctx.fillRect(0, s / 2 - 2, s, 5);
  ctx.fillStyle = '#c4b090';
  for (let i = 0; i < 40; i++) {
    ctx.fillRect((i * 17) % s, (i * 13) % s, 2, 2);
  }
  ctx.fillStyle = '#f0d878';
  ctx.fillRect(14, 14, 10, 10);
  ctx.fillRect(40, 14, 10, 10);
  ctx.fillStyle = '#2a1c12';
  ctx.fillRect(26, 42, 12, 18);
  return toMap(c, 1, 1);
}

export function roofTileMap(): THREE.CanvasTexture {
  const s = 32;
  const c = makeCanvas(s, s);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#8a2e1c';
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 6) {
    ctx.fillStyle = y % 12 === 0 ? '#a43a28' : '#7a2416';
    ctx.fillRect(0, y, s, 5);
    ctx.fillStyle = '#5a180e';
    ctx.fillRect(0, y + 5, s, 1);
    const ox = y % 12 === 0 ? 0 : 8;
    ctx.fillStyle = '#5a180e';
    for (let x = ox; x < s; x += 16) ctx.fillRect(x, y, 1, 5);
  }
  return toMap(c, 2, 2);
}

export function woodMap(): THREE.CanvasTexture {
  const s = 32;
  const c = makeCanvas(s, s);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#6a4428';
  ctx.fillRect(0, 0, s, s);
  for (let x = 0; x < s; x += 8) {
    ctx.fillStyle = '#5a361c';
    ctx.fillRect(x, 0, 7, s);
    ctx.fillStyle = '#3a2414';
    ctx.fillRect(x + 7, 0, 1, s);
    ctx.fillStyle = 'rgba(240,200,140,0.12)';
    ctx.fillRect(x + 1, 0, 1, s);
  }
  return toMap(c, 2, 1);
}

export function stoneMap(): THREE.CanvasTexture {
  const s = 32;
  const c = makeCanvas(s, s);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#7a7468';
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const ox = (y % 2) * 4;
      ctx.fillStyle = '#4a463c';
      ctx.fillRect(x * 8 + ox, y * 8, 8, 8);
      ctx.fillStyle = x + y === 3 ? '#8a8478' : '#747064';
      ctx.fillRect(x * 8 + ox + 1, y * 8 + 1, 6, 6);
    }
  }
  return toMap(c, 4, 2);
}
