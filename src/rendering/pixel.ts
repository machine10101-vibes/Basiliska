/** Integer pixel drawing — no anti-alias, so sprites stay crunchy like RO. */

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export class Pix {
  readonly w: number;
  readonly h: number;
  flip = false;
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D, w: number, h: number) {
    this.ctx = ctx;
    this.w = w;
    this.h = h;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  p(x: number, y: number, c: string): void {
    const xx = this.flip ? this.w - 1 - (x | 0) : (x | 0);
    const yy = y | 0;
    if (xx < 0 || yy < 0 || xx >= this.w || yy >= this.h) return;
    this.ctx.fillStyle = c;
    this.ctx.fillRect(xx, yy, 1, 1);
  }

  hline(x: number, y: number, w: number, c: string): void {
    for (let i = 0; i < w; i++) this.p(x + i, y, c);
  }

  vline(x: number, y: number, h: number, c: string): void {
    for (let i = 0; i < h; i++) this.p(x, y + i, c);
  }

  rect(x: number, y: number, w: number, h: number, c: string): void {
    for (let j = 0; j < h; j++) this.hline(x, y + j, w, c);
  }

  rectOutline(x: number, y: number, w: number, h: number, fill: string, line: string): void {
    this.rect(x, y, w, h, line);
    if (w > 2 && h > 2) this.rect(x + 1, y + 1, w - 2, h - 2, fill);
  }

  disc(cx: number, cy: number, r: number, fill: string, line?: string): void {
    const draw = (rr: number, c: string) => {
      for (let y = -rr; y <= rr; y++) {
        const span = Math.floor(Math.sqrt(rr * rr - y * y));
        this.hline(cx - span, cy + y, span * 2 + 1, c);
      }
    };
    if (line) draw(r, line);
    draw(line ? Math.max(1, r - 1) : r, fill);
  }

  oval(cx: number, cy: number, rx: number, ry: number, fill: string, line?: string): void {
    const draw = (a: number, b: number, c: string) => {
      for (let y = -b; y <= b; y++) {
        const t = 1 - (y * y) / (b * b || 1);
        const span = Math.floor(a * Math.sqrt(Math.max(0, t)));
        this.hline(cx - span, cy + y, span * 2 + 1, c);
      }
    };
    if (line) draw(rx, ry, line);
    draw(line ? Math.max(1, rx - 1) : rx, line ? Math.max(1, ry - 1) : ry, fill);
  }
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d');
  ctx.imageSmoothingEnabled = false;
  return c;
}
