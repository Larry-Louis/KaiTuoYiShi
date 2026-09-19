---
version: 1
slug: "components-features-zhiku-zhikuexperience-tsx"
primary_target: "components/features/Zhiku/ZhikuExperience.tsx"
related_targets: []
---

# Surface brief — 智库 (Zhiku)

Scope: the whole Zhiku surface — category/lore browsing, the story-archive reader, and the 自制 authoring workspace — reached from both the home route and in-game. One surface, one identity. Visitor mode: **Operate**, with a strong Experience lean on the home route (the user's dominant mode there is browsing for pleasure).

Audience and job: the player, either browsing accumulated lore with no target, or recalling one named thing mid-scene and wanting to be back in the story in seconds; plus the author in-game, writing and checking 自制 entries. Content: 162 built-in entries (99 character / 43 term / 12 location / 4 faction / 4 event), 27 story volumes, plus player-authored entries. Constraints: entries are hidden until runtime-unlocked, so the **empty and partially-unlocked states are the first states most players meet**; `--tn-*` and all incumbent `ZhikuNext/*` code are being deleted; no image generation is available, so this is a code-led build with no comp.

## Direction contract

THESIS: The archive is a room you move through, not a page you scroll. This refuses both incumbent failures at once — the star map's six information-free discs, and the flat wiki's dead two-column page. Structure is the canon (index + reader + panes); the space is real depth, not a grid.

OWN-WORLD: Near-black void with a deep starfield behind everything. Panels float at true z-depths, lit from within, milky rather than glassy. Structural black `#08070a`, panels `#141216`/`#1a1d23`, 开拓金 `#f5d97a` as the only warm accent, cyan `#75d6d8` as the live signal. System Chinese neo-grotesque for labels, mono for every readout. Hierarchy by scale and depth; no decorative borders.

STORY: The visitor sees that this archive has been *accumulating* — which categories are heavy, how much is left locked — and reaches any entry in one gesture. Nothing on screen is decoration.

FIRST VIEWPORT: A full-height left index (dense category rows that expand to entries) beside a wide reader pane, both floating above a starfield with true parallax depth. A monumental count sits at the top of the index at display scale — the largest thing on screen. The reader pane is empty until first selection, and that emptiness is designed as an invitation.

SIGNATURE INTERACTION: **container collapse/expand.** Selecting an entry expands its index row into the reader pane through a shared element with spring overshoot; the index physically narrows and its other rows recede in z. Collapsing returns it. Index, reader pane, and the 自制 workspace all collapse and expand their own containers rather than swapping routes.

MOTION GRAMMAR: layout animations and shared elements for every state change; springs with real overshoot; `AnimatePresence` for entering and leaving. Forbidden: opacity-pulse, glow-breathing, ambient drift — motion is position, scale, and layout, never light.

FORM: the canon's information architecture, carried by the console-dashboard-atmosphere world's depth and motion. Seed key `1cd25e7b`.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
