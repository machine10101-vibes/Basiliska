# Basiliska

Browser **retro isometric MMORPG** foundation. You wake in **Valehaven**, a walled
gate town on the Green Marches — cobble plaza, fountain, timbered halls, and open
gates onto wolf woods, goblin cuts, and spore fields.

Original world, names, and procedural Three.js art. Camera and town layout follow
the spirit of classic isometric MU-style starters (not a copy of any commercial
setting).

- **Play:** [machine10101-vibes.github.io/Basiliska](https://machine10101-vibes.github.io/Basiliska/)
- **GitHub:** [machine10101-vibes/Basiliska](https://github.com/machine10101-vibes/Basiliska)

## Phase 1 features

- Vite + TypeScript + Three.js
- True isometric follow camera (`OrthographicCamera`, 45° yaw)
- Title screen + class select: **Iron Vanguard**, **Aether Sage**, **Thorn Archer**
- Click / tap-to-move, click-to-fight, safe town hold
- MU-inspired HUD: HP / MP / SD bars, XP, gold, chat, action bar, 32-slot pack, attributes, circular minimap
- Training dummy in town; Vale Wolves (north), Goblin Raiders (west), Spore Crawlers (east)
- Herb gathering, potions, localStorage save (`basiliska_save_v1`)
- Desktop + mobile

## Running locally

```bash
npm install
npm run dev        # http://127.0.0.1:47321
```

Other scripts:

```bash
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production bundle into dist/
npm run preview    # serve the production bundle
npm run pages      # build with base /Basiliska/ and push gh-pages
```

Requires Node 20+ and a browser with WebGL2.

Open the URL Vite prints. Production `base` is `/Basiliska/` (exact case) for GitHub Pages.

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
- `.github/workflows/pages.yml` republishes Pages on every push to `main`
