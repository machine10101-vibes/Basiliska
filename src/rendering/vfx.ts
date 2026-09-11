import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  gravity: number;
}

interface FloatXp {
  el: HTMLDivElement;
  life: number;
  maxLife: number;
  world: THREE.Vector3;
  driftY: number;
}

export class VFX {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private overlay: HTMLElement;
  private particles: Particle[] = [];
  private floats: FloatXp[] = [];
  private tmp = new THREE.Vector3();

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    let overlay = document.getElementById('vfx-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'vfx-overlay';
      document.getElementById('app')?.appendChild(overlay);
    }
    this.overlay = overlay;
  }

  spawnBurst(pos: THREE.Vector3, color: number, count = 10, speed = 3.2): void {
    const geo = new THREE.TetrahedronGeometry(0.07);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.2,
      flatShading: true,
    });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.copy(pos);
      mesh.position.y += 0.7;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed, (Math.random() - 0.5) * speed),
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        gravity: 7,
      });
    }
  }

  floatText(world: THREE.Vector3, text: string, color = '#f0d070'): void {
    const el = document.createElement('div');
    el.className = 'float-xp';
    el.textContent = text;
    el.style.color = color;
    this.overlay.appendChild(el);
    this.floats.push({
      el,
      life: 1.15,
      maxLife: 1.15,
      world: world.clone(),
      driftY: 1.4,
    });
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vel.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 8;
      const fade = Math.max(0, p.life / p.maxLife);
      if (p.mesh.material instanceof THREE.MeshStandardMaterial) {
        p.mesh.material.opacity = fade;
        p.mesh.material.transparent = true;
      }
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt;
      this.tmp.copy(f.world);
      this.tmp.y += (1 - f.life / f.maxLife) * f.driftY;
      this.tmp.project(this.camera);
      const x = (this.tmp.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-this.tmp.y * 0.5 + 0.5) * window.innerHeight;
      f.el.style.transform = `translate(${x}px, ${y}px)`;
      f.el.style.opacity = String(Math.max(0, f.life / f.maxLife));
      if (f.life <= 0) {
        f.el.remove();
        this.floats.splice(i, 1);
      }
    }
  }
}
