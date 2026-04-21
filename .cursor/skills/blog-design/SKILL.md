---
name: blog-design
description: Design system and visual guidelines for a tech product review blog inspired by an editorial magazine aesthetic. Use when building UI components, writing CSS/Tailwind, choosing colors, typography, layouts, or making any visual/UX decision for this blog project.
---

# Blog Design System

Editorial magazine aesthetic — clean, bold, and modern. Think high-end print media translated to the web: generous whitespace, strong typography hierarchy, and soft rounded surfaces.

## Color Palette

| Role | Value | Usage |
|------|-------|-------|
| Background | `#FFFFFF` / `#F7F7F5` | Page backgrounds, card bases |
| Text primary | `#0D0D0D` | Headlines, body copy |
| Text secondary | `#6B6B6B` | Meta info, captions, labels |
| Accent sage | `#B8C9C0` | Highlight cards, CTA backgrounds, tags |
| Accent cream | `#F0EBE0` | Featured card backgrounds |
| Accent dark | `#1A1A1A` | Dark cards, CTA buttons, overlay areas |
| Border/subtle | `#E8E8E8` | Dividers, card borders |

No heavy gradients. Use flat color fills only.

## Typography

**Display / Hero Headlines**
- Font: Italic serif (e.g. *Playfair Display*, *DM Serif Display*, or *Lora* italic)
- Weight: Bold italic
- Size scale: `4xl–7xl` depending on viewport
- Example: *"Best of the week"*, *"Fashion"*, *"Be part of our Broadcast"*

**Section headings / Card titles**
- Font: Bold sans-serif (e.g. *Inter*, *DM Sans*)
- Weight: 700–800
- Size: `lg–2xl`

**Body / Article text**
- Font: Serif or clean sans-serif
- Size: `base` (16px), generous `leading-relaxed` or `leading-loose`
- Columns: single column, max-width ~680px for readability

**Labels / Badges / Meta**
- Font: Sans-serif, uppercase or normal
- Size: `xs–sm`
- Weight: 500–600

**Rule:** Mix italic serif (display) + sans-serif (UI/body). Never mix more than two families.

## Spacing & Layout

- Base unit: `8px`
- Section vertical padding: `py-16` to `py-24`
- Card inner padding: `p-4` to `p-6`
- Max content width: `1200px`, centered
- Grid: 12-column, with asymmetric compositions (e.g. large card left + sidebar right)
- Generous whitespace — do not fill every pixel

## Shapes & Borders

- **Cards:** `rounded-2xl` to `rounded-3xl` (16–24px border-radius)
- **Buttons:** `rounded-full` (pill shape)
- **Input fields:** `rounded-full`, minimal border (`border border-gray-200`)
- **Badges/Tags:** `rounded-full`, small padding (`px-3 py-1`)
- **Avatars/icons:** `rounded-full`
- No sharp corners on interactive or decorative elements

## Components

### Navigation
- Logo left: bold sans-serif, dot suffix (e.g. "Blog Spot.")
- Center: nav links with superscript counters (`Articles 460`)
- Right: search icon (circle) + pill "Menu" button
- Background: white, no shadow — border-bottom only on scroll

### Cards
- Image fills top portion, rounded corners
- Category tag as pill badge overlaid or below image
- Date in small muted text
- Title in bold sans-serif, 2–3 lines max
- Arrow icon (`↗`) in a small circle for "open" action, positioned top-right of card
- Hover: subtle scale `scale-[1.02]` + shadow increase

### Category / Section Badge
- Pill shape, small text, light background (e.g. sage or off-white)
- Examples: `· Travel`, `· Fashion`, `· Tech`

### Feature Hero (Home)
- Full-bleed image card (left, large)
- Overlaid text box: white background, rounded, with category + title
- Sidebar: stacked secondary cards (ad card + editorial card)

### Article Page
- Date top-center, small muted text
- H1: large bold serif, ~3 lines
- Reading time + style badges centered below title (pill badges)
- Left-side social share icons (Facebook, Twitter/X) — sticky on scroll
- Body text: serif, line-height 1.8, max-width 680px
- Inline pull quotes with left border accent
- Images: full-width with caption below in muted small text

### CTA / Join Section
- Dark overlay card (`bg-[#1A1A1A]` or blurred image background)
- Large headline centered
- Row of circular avatar icons above form
- Form: two pill inputs side-by-side + black pill submit button
- Subtext: light gray, small

### Buttons
- **Primary:** `bg-black text-white rounded-full px-6 py-2`
- **Secondary:** `border border-black text-black rounded-full px-6 py-2 bg-transparent`
- **Ghost/small:** `bg-white/80 backdrop-blur rounded-full text-xs px-3 py-1`

## Iconography

- Style: minimal line icons or simple filled circles with arrows
- Arrow icon: `↗` (northeast arrow) inside a small circle — used for card CTAs
- Symbols on avatar circles: brackets `[ ]`, caret `^`, asterisk `*` — decorative
- Size: `16–20px`, never decorative clutter

## Images

- Editorial / lifestyle photography: real people, natural light, fashion, travel, culture, **tech products in context** (hands holding devices, workspace setups)
- Aspect ratios: `4:3` or `3:2` for cards, `16:9` for heroes
- Always use rounded corners matching card radius
- Avoid stock-photo genericness — prefer authentic editorial style

## Motion / Interactions

- Subtle only: `transition-all duration-200 ease-in-out`
- Card hover: slight scale + shadow
- No heavy animations or page transitions
- Scroll-triggered fade-in for sections (optional, subtle)

## Responsive Principles

- Mobile: single column, hero stacks vertically, nav collapses to hamburger
- Tablet: 2-column card grid
- Desktop: asymmetric multi-column layouts (as in the reference screens)
- Typography scales down gracefully — display headings from `5xl` → `3xl` → `2xl`

## Design Decisions to Avoid

- No dark mode by default (light editorial aesthetic is the identity)
- No heavy drop shadows (use `shadow-sm` or `shadow-md` max)
- No neon or saturated accent colors
- No full-width text blocks — always constrain with max-width
- No Comic Sans, system fonts for headlines, or all-caps serif
