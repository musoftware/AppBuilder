---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics. Also use when the user mentions a brand name alongside a UI request (e.g., "like Stripe", "Vercel style", "Apple aesthetic"), asks to clone, mimic, or be inspired by a real product's design, or requests a "landing page", "dashboard", "component" when a brand or design style is implied or named. Make sure to trigger on mentions of brand names (Stripe, Vercel, Apple, Linear, Supabase, Spotify, Notion, Airbnb, Figma, Linear, Raycast, Cohere, PostHog, Sentry, Ferrari, BMW, Tesla, Cursor, etc.) even if the user doesn't explicitly say "use the frontend-design skill".
---

# Frontend Design

Create distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic detail and creative choices.

## When to Use

- Building websites, landing pages, dashboards, or components
- Styling or beautifying any web UI
- User mentions a brand name with a UI request ("like Stripe", "Vercel style", "Apple aesthetic")
- User asks to clone, mimic, or be inspired by a real product's design
- Any request where design quality matters

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:

1. **Purpose**: What problem does this interface solve? Who uses it?
2. **Tone**: Pick an extreme — brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian. There are so many flavors. Use these for inspiration but design something true to the aesthetic direction.
3. **Constraints**: Technical requirements (framework, performance, accessibility).
4. **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:

- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Brand Detection & Token Fetching

When the user references a specific brand ("like Stripe", "Vercel style", "Apple aesthetic"), follow this workflow:

### Step 1: Identify the Brand

Extract the brand name from the user's request. Common patterns:

- "Make it like {brand}" → brand = {brand}
- "{brand} style" → brand = {brand}
- "{brand} aesthetic" → brand = {brand}
- "Clone {brand}" → brand = {brand}
- "Inspired by {brand}" → brand = {brand}

If the brand is ambiguous, ask the user to clarify which brand they mean.

### Step 2: Fetch the DESIGN.md

Use `web_fetch` to get the brand's design token file:

```
web_fetch https://getdesign.md/{brand-slug}/design-md
```

For example:

- Stripe → `https://getdesign.md/stripe/design-md`
- Vercel → `https://getdesign.md/vercel/design-md`
- Apple → `https://getdesign.md/apple/design-md`

### Step 3: Extract Design Tokens

From the DESIGN.md, extract:

- **Colors**: Primary, secondary, accent, background, text colors
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Scale values (4px, 8px, 16px, 24px, etc.)
- **Border radius**: Default, large, pill values
- **Shadows**: Elevation levels
- **Motion**: Transition durations, easing curves
- **Layout**: Max widths, grid patterns, container sizes

Map these to CSS custom properties:

```css
:root {
  --color-primary: #635bff;
  --color-background: #ffffff;
  --color-text: #0a2540;
  --font-display: 'Söhne', sans-serif;
  --font-body: 'Inter', sans-serif;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 48px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
}
```

### Step 4: Apply Tokens to Components

Build the requested UI using the extracted tokens. Every color, spacing, typography, and animation decision should trace back to the brand's DESIGN.md.

### Step 5: Fallback (Brand Not Found)

If the brand isn't in the catalog or the DESIGN.md can't be fetched:

1. Check `references/brand-catalog.md` for the brand slug
2. If still not found, use the creative guidelines below
3. Tell the user: "I couldn't find design tokens for {brand}. I'll use creative guidelines instead — let me know if you want a different direction."

## Creative Guidelines (When No Brand Reference)

When building without a brand reference, follow these principles:

### Typography

Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial, Inter, Roboto, or system fonts. Opt for distinctive choices that elevate the frontend's aesthetics — unexpected, characterful font choices. Pair a distinctive display font with a refined body font.

**Good font pairings** (use Google Fonts):

- Display: `Clash Display`, `Syne`, `Bricolage Grotesque`, `Instrument Serif`, `Outfit`, `Plus Jakarta Sans`
- Body: `Source Sans 3`, `DM Sans`, `Satoshi`, `General Sans`, `Figtree`

### Color & Theme

Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.

**Theme directions** (pick one, don't mix):

- Dark precision (deep blacks, sharp white text, single accent color)
- Warm editorial (cream backgrounds, rich browns, warm accents)
- Cool editorial (white space, navy accents, crisp grays)
- Vibrant maximalist (bold saturated colors, high contrast)
- Muted luxury (desaturated tones, subtle gold/copper accents)

### Motion

Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments:

- One well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions
- Use scroll-triggering and hover states that surprise
- Keep durations tight (150-300ms) — nothing should feel slow

### Spatial Composition

- Unexpected layouts. Asymmetry. Overlap. Diagonal flow.
- Grid-breaking elements. Generous negative space OR controlled density.
- Don't center everything. Push content to edges. Create tension.

### Backgrounds & Visual Details

Create atmosphere and depth rather than defaulting to solid colors:

- Gradient meshes, noise textures, geometric patterns
- Layered transparencies, dramatic shadows
- Decorative borders, custom cursors, grain overlays
- Contextual effects that match the overall aesthetic

### What to AVOID (Generic AI Aesthetics)

NEVER use:

- Inter, Roboto, Arial, or system-ui as the primary font
- Purple gradients on white backgrounds (the default AI look)
- Predictable centered layouts with equal spacing
- Cookie-cutter component patterns
- Hero → Features → CTA → Footer (the AI website template)
- Rounded corners on everything
- The same shadow values everywhere

Each generation should feel genuinely designed for the context. No two outputs should look like they came from the same template.

## Implementation Patterns

### HTML/CSS/JS (No Framework)

Use CSS custom properties, CSS Grid, and modern CSS features. Keep JS minimal and focused on interactivity.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Page Title</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;600;700&family=Source+Sans+3:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        /* Design tokens here */
      }
      /* Styles here */
    </style>
  </head>
  <body>
    <!-- Content here -->
    <script>
      // Minimal interactivity here
    </script>
  </body>
</html>
```

### React Components

Use Tailwind or styled-components if the project already has them. Otherwise, use CSS modules or inline styles with CSS variables.

### Animation Examples

**Staggered page load** (CSS-only):

```css
.hero > * {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.6s ease forwards;
}
.hero > *:nth-child(1) {
  animation-delay: 0ms;
}
.hero > *:nth-child(2) {
  animation-delay: 100ms;
}
.hero > *:nth-child(3) {
  animation-delay: 200ms;
}

@keyframes fadeUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Hover state that surprises**:

```css
.card {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}
.card:hover {
  transform: translateY(-4px) rotate(-1deg);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
```

## Quality Checklist

Before delivering:

1. **No generic fonts** — Using a distinctive display + body font pairing?
2. **No purple gradient on white** — Committed to a specific color direction?
3. **No centered everything** — Used asymmetric or interesting layout?
4. **Background has character** — Not a solid color default?
5. **Motion feels intentional** — Staggered reveals, hover states that surprise?
6. **Responsive** — Works on mobile without breaking?
7. **Accessible** — Sufficient contrast, keyboard navigable?
8. **Production-ready** — No placeholder text, real content, semantic HTML?

## Reference Files

Load these as needed:

- **`references/brand-catalog.md`** — Brand names, slugs, and aesthetic summaries (when user references a brand)
- **`references/design-token-parser.md`** — How to read and apply DESIGN.md files
- **`references/component-patterns.md`** — Common UI patterns per aesthetic category
