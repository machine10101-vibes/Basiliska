# Basiliska

Browser **retro isometric MMORPG** foundation. You wake in **Valehaven**, a walled gate town on the Green Marches — cobble plaza, fountain, timbered halls, and open gates onto wolf woods, goblin cuts, and spore fields.

Original world, names, and procedural Three.js art. Camera and town layout follow the spirit of classic isometric MU-style starters (not a copy of any commercial setting).

**Play:** https://machine10101-vibes.github.io/Basiliska/

## Phase 1 features

- Vite + TypeScript + Three.js
- True isometric follow camera (`OrthographicCamera`, 45° yaw)
- Title screen + class select: **Iron Vanguard**, **Aether Sage**, **Thorn Archer**
- Click / tap-to-move, click-to-fight, safe town hold
- MU-inspired HUD: HP / MP / SD bars, XP, gold, chat, action bar, 32-slot pack, attributes, circular minimap
- Training dummy in town; Vale Wolves (north), Goblin Raiders (west), Spore Crawlers (east)
- Herb gathering, potions, localStorage save (`basiliska_save_v1`)
- Desktop + mobile

## Develop

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173/Basiliska/).

## Build

```bash
npm run build
npm run preview
```

Production `base` is `/Basiliska/` (exact case) for GitHub Pages.

## Controls

| Input | Action |
|--------|--------|
| Click / tap ground | Walk |
| Click foe | Close and strike |
| Click NPC | Hear a line |
| Click herb | Gather |
| 1–5 / action bar | Strike, class skill, red elixir, blue elixir, examine |
| `K` | Toggle attributes |

## Deploy notes

- Source on `main`
- Built site on orphan `gh-pages` (contents of `dist/` at branch root)
- `404.html` is a copy of `index.html` for deep-link fallback
- Asset URLs are `/Basiliska/assets/...`
