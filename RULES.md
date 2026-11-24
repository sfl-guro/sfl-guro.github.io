# SFL GURO rules for future edits

1. Never add code comments.
2. Never use a plain solid line border (`border: Npx solid ...`, `border-style: solid` with a colour only, or `outline` used as a frame) on any container, card, box, input, button, badge or cell.
3. Every framed element must reuse the app container border style:
   `border-style: solid; border-width: var(--px-card-corner-width); border-color: var(--sfl-outer-border, #181425); border-image: var(--px-border-image) 20% stretch; border-radius: 0; image-rendering: pixelated;`
   Use `var(--px-panel-corner-width)` instead of the card width for large panels.
4. The `.guro-frame` utility class applies this style and should be added to new elements instead of writing new border rules.
5. Dividers and decorative lines without a frame may use background gradients or `border: 0`, never a plain coloured solid border.
6. Every panel, page, popup, card and box must support the desktop Font Size Settings (10%, 20%, 30%). The setting sets `data-fs` on `<html>` and is desktop only (`min-width:1024px`); it must never change mobile view. The bubble chart panel is excluded.
7. Every `font-size` must be written as `calc(Npx * var(--fs-desk,1))` or `em`/`%` relative to a scaled parent. Never use a bare `px`, `rem` or `pt` font size, and never leave text on the browser default size, in CSS, inline styles, JS-built markup, SVG or canvas text.
8. Boxes that hold text or emoji must grow with it. Do not give them a fixed `width`/`height` in px for text; use `min-width`/`min-height`, `auto`, `minmax(0,1fr)` or `calc(Npx * var(--fs-inh,1))` so the larger font never overlaps, clips or breaks mid-word. Use `flex-wrap:wrap` and `min-width:0` on rows that contain text and buttons, and avoid `white-space:nowrap` with `overflow:hidden` on text.
9. Geometry that is drawn in fixed pixels (maps, grids, canvases) must be scaled as one unit (for example with `zoom` under `html[data-fs="10"|"20"|"30"]`) with `--fs-desk` reset so text is not scaled twice.
10. Every new or edited panel must be checked at default, 10%, 20% and 30% on desktop widths (1024px and up) for clipped, overlapping or broken text before it is delivered. The scale sets are pre-built in CSS, so switching must stay instant with no JS re-render.
